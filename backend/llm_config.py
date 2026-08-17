"""Central registry of LLM model names, keyed by ROLE, not by model.

Every LLM call site must read its model from here instead of hardcoding a
string — a single upstream decommission (llama-3.3-70b-versatile, removed by
Groq on 2026-08-16) broke three call sites at once because each held its own
copy. With this module, the next swap is a config change, not a code change:
set the env var, or edit the default here.
"""
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

AGENT_MODEL = os.getenv("AGENT_MODEL", "openai/gpt-oss-120b")

TITLE_MODEL = os.getenv("TITLE_MODEL", "llama-3.1-8b-instant")
