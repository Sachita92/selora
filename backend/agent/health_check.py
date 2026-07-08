"""
Selora Store Health Analyzer
============================
A dedicated, modular module for inspecting a store's product catalog and
computing a holistic health score with structured issue reports.

Architecture note:
  - This module is intentionally decoupled from pricing/listing optimization.
  - Future checks (theme, SEO metadata, page speed, broken links, accessibility)
    can be added as new _check_* methods without changing the existing interface.
  - The public API is: StoreHealthAnalyzer(snapshot).analyze() -> dict
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from adapters.base import StoreSnapshot, UniversalProduct


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class HealthIssue:
    severity: str          # 'critical' | 'warning' | 'info'
    category: str          # e.g. 'content', 'inventory', 'seo', 'conversion'
    code: str              # machine-readable key, e.g. 'missing_description'
    message: str           # human-readable summary
    affected_products: List[str] = field(default_factory=list)   # product titles
    affected_count: int = 0
    penalty: int = 0       # points deducted from health score

    def to_dict(self) -> dict:
        return {
            "severity": self.severity,
            "category": self.category,
            "code": self.code,
            "message": self.message,
            "affected_products": self.affected_products,
            "affected_count": self.affected_count,
            "penalty": self.penalty,
        }


@dataclass
class HealthReport:
    score: int
    grade: str                          # 'A', 'B', 'C', 'D', 'F'
    summary: str
    total_products: int
    issues_critical: int
    issues_warnings: int
    issues_info: int
    issues: List[HealthIssue]
    healthy_areas: List[str]
    recommendations: List[str]
    unavailable_checks: List[str]       # checks skipped due to missing data
    checked_at: str

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "grade": self.grade,
            "summary": self.summary,
            "total_products": self.total_products,
            "issues_critical": self.issues_critical,
            "issues_warnings": self.issues_warnings,
            "issues_info": self.issues_info,
            "issues": [i.to_dict() for i in self.issues],
            "healthy_areas": self.healthy_areas,
            "recommendations": self.recommendations,
            "unavailable_checks": self.unavailable_checks,
            "checked_at": self.checked_at,
        }


# ---------------------------------------------------------------------------
# Configurable thresholds (can be overridden per-store in the future)
# ---------------------------------------------------------------------------

DEFAULT_CONFIG = {
    "min_description_length": 100,   # chars — shorter is flagged as 'short'
    "low_inventory_threshold": 10,   # units — below this triggers low-stock warning
    "bestseller_min_sales": 5,       # 30-day units — qualifies as "bestselling"
    "zero_sales_days": 30,           # look-back window
    "low_conversion_threshold": 0.5, # % — below this with >0 views is flagged
    "high_views_threshold": 50,      # views — product is "high traffic"
    "single_image_flag": True,       # flag products with only 1 image
    # Score penalties (applied per occurrence, with per-check caps)
    "penalty_missing_description": 5,
    "penalty_short_description": 3,
    "penalty_missing_image": 10,
    "penalty_single_image": 2,
    "penalty_missing_alt_text": 2,
    "penalty_missing_tags": 2,
    "penalty_out_of_stock_bestseller": 8,
    "penalty_out_of_stock_regular": 4,
    "penalty_low_inventory": 3,
    "penalty_zero_sales": 1,
    "penalty_low_conversion": 2,
    "penalty_high_views_low_conv": 3,
    "penalty_duplicate_title": 2,
    # Per-check maximum penalty caps (to avoid punishing large catalogs unfairly)
    "cap_missing_description": 25,
    "cap_short_description": 15,
    "cap_missing_image": 30,
    "cap_single_image": 10,
    "cap_missing_alt_text": 10,
    "cap_missing_tags": 10,
    "cap_out_of_stock": 20,
    "cap_low_inventory": 15,
    "cap_zero_sales": 10,
    "cap_low_conversion": 10,
    "cap_high_views_low_conv": 12,
    "cap_duplicate_title": 8,
}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _strip_html(text: str) -> str:
    """Remove HTML tags from a string."""
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def _grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _summary_for_score(score: int, n_critical: int, n_warnings: int) -> str:
    if score >= 90:
        return "Your store is in excellent health with only minor opportunities to improve."
    if score >= 80:
        if n_critical > 0:
            return f"Your store is in good shape, but {n_critical} critical issue{'s' if n_critical > 1 else ''} need{'s' if n_critical == 1 else ''} your attention."
        return "Your store is in good condition with a few optimization opportunities."
    if score >= 70:
        return f"Your store has {n_critical} critical and {n_warnings} warning{'s' if n_warnings > 1 else ''} that are worth addressing to improve performance."
    if score >= 50:
        return "Several issues were found that may be hurting your store's conversion rate and SEO."
    return "Your store needs significant attention — multiple issues are likely impacting sales and customer experience."


def _capped_penalty(unit_penalty: int, count: int, cap: int) -> int:
    return min(unit_penalty * count, cap)


# ---------------------------------------------------------------------------
# Core analyzer
# ---------------------------------------------------------------------------

class StoreHealthAnalyzer:
    """
    Run a comprehensive health check on a store snapshot.

    Usage:
        analyzer = StoreHealthAnalyzer(snapshot, config=None)
        report = analyzer.analyze()          # returns HealthReport
        report_dict = report.to_dict()       # JSON-serialisable dict
    """

    def __init__(self, snapshot: StoreSnapshot, config: Optional[dict] = None):
        self.snapshot = snapshot
        self.cfg = {**DEFAULT_CONFIG, **(config or {})}
        self._issues: List[HealthIssue] = []
        self._healthy: List[str] = []
        self._unavailable: List[str] = []
        self._total_penalty = 0

    # ------------------------------------------------------------------ #
    # Public entry point                                                   #
    # ------------------------------------------------------------------ #

    def analyze(self) -> HealthReport:
        products = self.snapshot.products

        if not products:
            return HealthReport(
                score=50,
                grade="D",
                summary="No products found in this store. Add products to get a meaningful health report.",
                total_products=0,
                issues_critical=0,
                issues_warnings=0,
                issues_info=0,
                issues=[],
                healthy_areas=[],
                recommendations=["Add products to your store to begin selling."],
                unavailable_checks=["All checks require at least one product."],
                checked_at=datetime.utcnow().isoformat(),
            )

        # Run every check
        self._check_descriptions(products)
        self._check_images(products)
        self._check_alt_text(products)
        self._check_tags(products)
        self._check_inventory(products)
        self._check_sales(products)
        self._check_conversion(products)
        self._check_duplicate_titles(products)
        self._check_pricing(products)

        # Tally
        score = max(0, 100 - self._total_penalty)
        critical = [i for i in self._issues if i.severity == "critical"]
        warnings  = [i for i in self._issues if i.severity == "warning"]
        info_list = [i for i in self._issues if i.severity == "info"]

        recommendations = self._build_recommendations()

        return HealthReport(
            score=score,
            grade=_grade(score),
            summary=_summary_for_score(score, len(critical), len(warnings)),
            total_products=len(products),
            issues_critical=len(critical),
            issues_warnings=len(warnings),
            issues_info=len(info_list),
            issues=self._issues,
            healthy_areas=self._healthy,
            recommendations=recommendations,
            unavailable_checks=self._unavailable,
            checked_at=datetime.utcnow().isoformat(),
        )

    # ------------------------------------------------------------------ #
    # Individual checks                                                    #
    # ------------------------------------------------------------------ #

    def _check_descriptions(self, products: list):
        missing, short = [], []
        threshold = self.cfg["min_description_length"]

        for p in products:
            clean = _strip_html(p.description or "")
            if not clean:
                missing.append(p.title)
            elif len(clean) < threshold:
                short.append(p.title)

        if missing:
            penalty = _capped_penalty(
                self.cfg["penalty_missing_description"], len(missing),
                self.cfg["cap_missing_description"]
            )
            self._add_issue(HealthIssue(
                severity="critical",
                category="content",
                code="missing_description",
                message=f"{len(missing)} product{'s have' if len(missing) > 1 else ' has'} no description. Missing descriptions hurt SEO and conversion.",
                affected_products=missing[:10],
                affected_count=len(missing),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All products have descriptions.")

        if short:
            penalty = _capped_penalty(
                self.cfg["penalty_short_description"], len(short),
                self.cfg["cap_short_description"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="content",
                code="short_description",
                message=f"{len(short)} product{'s have' if len(short) > 1 else ' has'} a description shorter than {threshold} characters. Detailed descriptions improve conversion.",
                affected_products=short[:10],
                affected_count=len(short),
                penalty=penalty,
            ))

    def _check_images(self, products: list):
        missing_img, single_img = [], []

        for p in products:
            # Check primary image
            has_image = bool(p.image_url)

            # Check for multiple images via raw data (Shopify returns images array)
            images_raw = p.raw.get("images", []) if p.raw else []
            image_count = len(images_raw) if images_raw else (1 if has_image else 0)

            if not has_image:
                missing_img.append(p.title)
            elif self.cfg["single_image_flag"] and image_count == 1:
                single_img.append(p.title)

        if missing_img:
            penalty = _capped_penalty(
                self.cfg["penalty_missing_image"], len(missing_img),
                self.cfg["cap_missing_image"]
            )
            self._add_issue(HealthIssue(
                severity="critical",
                category="content",
                code="missing_image",
                message=f"{len(missing_img)} product{'s have' if len(missing_img) > 1 else ' has'} no product image. Products without images have significantly lower conversion rates.",
                affected_products=missing_img[:10],
                affected_count=len(missing_img),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All products have at least one image.")

        if single_img:
            penalty = _capped_penalty(
                self.cfg["penalty_single_image"], len(single_img),
                self.cfg["cap_single_image"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="content",
                code="single_image",
                message=f"{len(single_img)} product{'s have' if len(single_img) > 1 else ' has'} only one image. Adding lifestyle and detail shots significantly boosts conversion in fashion.",
                affected_products=single_img[:10],
                affected_count=len(single_img),
                penalty=penalty,
            ))

    def _check_alt_text(self, products: list):
        missing_alt = []

        for p in products:
            if not p.image_url:
                continue  # already flagged as missing image
            if not p.raw:
                continue  # data not available

            images_raw = p.raw.get("images", [])
            if not images_raw:
                continue  # can't evaluate

            has_any_alt = any(
                bool(img.get("alt") or "")
                for img in images_raw
                if isinstance(img, dict)
            )
            if not has_any_alt:
                missing_alt.append(p.title)

        if not any(p.raw for p in products):
            self._unavailable.append(
                "ALT text check: Unable to evaluate — raw image metadata not available in store data."
            )
            return

        if missing_alt:
            penalty = _capped_penalty(
                self.cfg["penalty_missing_alt_text"], len(missing_alt),
                self.cfg["cap_missing_alt_text"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="seo",
                code="missing_alt_text",
                message=f"{len(missing_alt)} product{'s have' if len(missing_alt) > 1 else ' has'} images without ALT text. ALT text improves accessibility and image SEO.",
                affected_products=missing_alt[:10],
                affected_count=len(missing_alt),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All product images have ALT text.")

    def _check_tags(self, products: list):
        # Tags are available in raw data for Shopify, not in base UniversalProduct
        has_tag_data = any(p.raw and "tags" in p.raw for p in products)
        if not has_tag_data:
            self._unavailable.append(
                "Tags check: Unable to evaluate — product tags not available in store data."
            )
            return

        missing_tags = []
        for p in products:
            tags = p.raw.get("tags", "") if p.raw else ""
            if isinstance(tags, str):
                tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            elif isinstance(tags, list):
                tag_list = tags
            else:
                tag_list = []

            if not tag_list:
                missing_tags.append(p.title)

        if missing_tags:
            penalty = _capped_penalty(
                self.cfg["penalty_missing_tags"], len(missing_tags),
                self.cfg["cap_missing_tags"]
            )
            self._add_issue(HealthIssue(
                severity="info",
                category="seo",
                code="missing_tags",
                message=f"{len(missing_tags)} product{'s have' if len(missing_tags) > 1 else ' has'} no tags. Tags help with site search and collection filtering.",
                affected_products=missing_tags[:10],
                affected_count=len(missing_tags),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All products are tagged.")

    def _check_inventory(self, products: list):
        threshold = self.cfg["low_inventory_threshold"]
        bestseller_min = self.cfg["bestseller_min_sales"]

        out_of_stock_bestsellers = []
        out_of_stock_regular = []
        low_inventory = []

        for p in products:
            if p.inventory is None:
                continue
            if p.inventory == 0:
                if p.sales_last_30_days >= bestseller_min:
                    out_of_stock_bestsellers.append(p.title)
                else:
                    out_of_stock_regular.append(p.title)
            elif p.inventory < threshold:
                low_inventory.append(p.title)

        total_out = len(out_of_stock_bestsellers) + len(out_of_stock_regular)

        if out_of_stock_bestsellers:
            penalty = _capped_penalty(
                self.cfg["penalty_out_of_stock_bestseller"],
                len(out_of_stock_bestsellers),
                self.cfg["cap_out_of_stock"]
            )
            self._add_issue(HealthIssue(
                severity="critical",
                category="inventory",
                code="out_of_stock_bestseller",
                message=f"{len(out_of_stock_bestsellers)} bestselling item{'s are' if len(out_of_stock_bestsellers) > 1 else ' is'} out of stock. These items are actively losing revenue.",
                affected_products=out_of_stock_bestsellers[:10],
                affected_count=len(out_of_stock_bestsellers),
                penalty=penalty,
            ))

        if out_of_stock_regular:
            penalty = _capped_penalty(
                self.cfg["penalty_out_of_stock_regular"],
                len(out_of_stock_regular),
                self.cfg["cap_out_of_stock"] // 2
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="inventory",
                code="out_of_stock",
                message=f"{len(out_of_stock_regular)} product{'s are' if len(out_of_stock_regular) > 1 else ' is'} out of stock.",
                affected_products=out_of_stock_regular[:10],
                affected_count=len(out_of_stock_regular),
                penalty=penalty,
            ))

        if not out_of_stock_bestsellers and not out_of_stock_regular:
            self._healthy.append("No bestselling items are out of stock.")

        if low_inventory:
            penalty = _capped_penalty(
                self.cfg["penalty_low_inventory"], len(low_inventory),
                self.cfg["cap_low_inventory"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="inventory",
                code="low_inventory",
                message=f"{len(low_inventory)} product{'s have' if len(low_inventory) > 1 else ' has'} critically low inventory (fewer than {threshold} units). Consider restocking before stockout.",
                affected_products=low_inventory[:10],
                affected_count=len(low_inventory),
                penalty=penalty,
            ))
        else:
            self._healthy.append(f"Inventory levels look healthy across your catalog.")

    def _check_sales(self, products: list):
        zero_sales = []
        for p in products:
            if p.inventory == 0:
                continue  # already flagged as out of stock
            if p.sales_last_30_days == 0:
                zero_sales.append(p.title)

        if zero_sales:
            penalty = _capped_penalty(
                self.cfg["penalty_zero_sales"], len(zero_sales),
                self.cfg["cap_zero_sales"]
            )
            self._add_issue(HealthIssue(
                severity="info",
                category="conversion",
                code="zero_sales",
                message=f"{len(zero_sales)} in-stock product{'s have' if len(zero_sales) > 1 else ' has'} had zero sales in the last 30 days. These may need better descriptions, pricing adjustments, or promotion.",
                affected_products=zero_sales[:10],
                affected_count=len(zero_sales),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All in-stock products have had at least one sale in the last 30 days.")

    def _check_conversion(self, products: list):
        has_views = any(p.views_last_30_days and p.views_last_30_days > 0 for p in products)
        if not has_views:
            self._unavailable.append(
                "Conversion rate check: Unable to evaluate — view/traffic data not available."
            )
            return

        low_conv = []
        high_views_low_conv = []
        conv_threshold = self.cfg["low_conversion_threshold"]
        views_threshold = self.cfg["high_views_threshold"]

        for p in products:
            views = p.views_last_30_days or 0
            if views == 0:
                continue
            conv = (p.sales_last_30_days / views) * 100
            if views >= views_threshold and conv < conv_threshold:
                high_views_low_conv.append(p.title)
            elif conv < conv_threshold:
                low_conv.append(p.title)

        if high_views_low_conv:
            penalty = _capped_penalty(
                self.cfg["penalty_high_views_low_conv"], len(high_views_low_conv),
                self.cfg["cap_high_views_low_conv"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="conversion",
                code="high_views_low_conversion",
                message=f"{len(high_views_low_conv)} product{'s have' if len(high_views_low_conv) > 1 else ' has'} high traffic but poor conversion. These products are attracting interest but not closing sales — review descriptions, pricing, and images.",
                affected_products=high_views_low_conv[:10],
                affected_count=len(high_views_low_conv),
                penalty=penalty,
            ))

        if low_conv:
            penalty = _capped_penalty(
                self.cfg["penalty_low_conversion"], len(low_conv),
                self.cfg["cap_low_conversion"]
            )
            self._add_issue(HealthIssue(
                severity="info",
                category="conversion",
                code="low_conversion",
                message=f"{len(low_conv)} product{'s have' if len(low_conv) > 1 else ' has'} a conversion rate below {conv_threshold}%.",
                affected_products=low_conv[:10],
                affected_count=len(low_conv),
                penalty=penalty,
            ))

    def _check_duplicate_titles(self, products: list):
        seen: dict[str, list] = {}
        for p in products:
            normalized = re.sub(r"\s+", " ", p.title.lower().strip())
            seen.setdefault(normalized, []).append(p.title)

        duplicates = []
        for key, titles in seen.items():
            if len(titles) > 1:
                duplicates.append(titles[0])

        if duplicates:
            penalty = _capped_penalty(
                self.cfg["penalty_duplicate_title"], len(duplicates),
                self.cfg["cap_duplicate_title"]
            )
            self._add_issue(HealthIssue(
                severity="warning",
                category="content",
                code="duplicate_titles",
                message=f"{len(duplicates)} product title{'s are' if len(duplicates) > 1 else ' is'} duplicated or near-identical. Unique titles are important for SEO and customer clarity.",
                affected_products=duplicates[:10],
                affected_count=len(duplicates),
                penalty=penalty,
            ))
        else:
            self._healthy.append("All product titles are unique.")

    def _check_pricing(self, products: list):
        missing_price = [p.title for p in products if not p.price or p.price <= 0]
        if missing_price:
            self._add_issue(HealthIssue(
                severity="critical",
                category="pricing",
                code="missing_price",
                message=f"{len(missing_price)} product{'s have' if len(missing_price) > 1 else ' has'} no price set. These products cannot be purchased.",
                affected_products=missing_price[:10],
                affected_count=len(missing_price),
                penalty=15,
            ))
        else:
            self._healthy.append("All products have pricing set.")

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    def _add_issue(self, issue: HealthIssue):
        self._issues.append(issue)
        self._total_penalty += issue.penalty

    def _build_recommendations(self) -> List[str]:
        recs = []
        for issue in self._issues:
            if issue.severity == "critical":
                if issue.code == "missing_description":
                    recs.append(f"Add detailed descriptions to {issue.affected_count} product{'s' if issue.affected_count > 1 else ''} — start with: {', '.join(issue.affected_products[:2])}.")
                elif issue.code == "missing_image":
                    recs.append(f"Upload product images for {issue.affected_count} item{'s' if issue.affected_count > 1 else ''} — products without images rarely convert.")
                elif issue.code == "out_of_stock_bestseller":
                    recs.append(f"Restock your bestselling item{'s' if issue.affected_count > 1 else ''} immediately: {', '.join(issue.affected_products[:3])}.")
                elif issue.code == "missing_price":
                    recs.append(f"Set a price on {issue.affected_count} unpublished product{'s' if issue.affected_count > 1 else ''}: {', '.join(issue.affected_products[:2])}.")
            elif issue.severity == "warning":
                if issue.code == "short_description":
                    recs.append(f"Expand descriptions for {issue.affected_count} product{'s' if issue.affected_count > 1 else ''} to at least {self.cfg['min_description_length']} characters.")
                elif issue.code == "single_image":
                    recs.append(f"Add lifestyle and detail photos to {issue.affected_count} product{'s' if issue.affected_count > 1 else ''} — multiple images increase fashion conversion by up to 30%.")
                elif issue.code == "missing_alt_text":
                    recs.append(f"Add ALT text to images for {issue.affected_count} product{'s' if issue.affected_count > 1 else ''} to improve image SEO.")
                elif issue.code == "out_of_stock":
                    recs.append(f"Restock {issue.affected_count} out-of-stock product{'s' if issue.affected_count > 1 else ''}: {', '.join(issue.affected_products[:3])}.")
                elif issue.code == "low_inventory":
                    recs.append(f"Monitor inventory on {issue.affected_count} low-stock item{'s' if issue.affected_count > 1 else ''}: {', '.join(issue.affected_products[:3])}.")
                elif issue.code == "high_views_low_conversion":
                    recs.append(f"Investigate conversion issues for high-traffic products: {', '.join(issue.affected_products[:3])} — consider improving descriptions or lowering price.")
                elif issue.code == "duplicate_titles":
                    recs.append(f"Rename duplicate product titles to unique, descriptive names.")
            elif issue.severity == "info":
                if issue.code == "zero_sales":
                    recs.append(f"Review {issue.affected_count} product{'s' if issue.affected_count > 1 else ''} with zero recent sales — they may need promotion or repricing.")
                elif issue.code == "missing_tags":
                    recs.append(f"Add product tags to {issue.affected_count} item{'s' if issue.affected_count > 1 else ''} to improve store search and navigation.")

        # Deduplicate while preserving order
        seen = set()
        unique_recs = []
        for r in recs:
            if r not in seen:
                seen.add(r)
                unique_recs.append(r)
        return unique_recs
