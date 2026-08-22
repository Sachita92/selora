"""Tests for the four image-upload endpoints' validation.

The old handlers base64-decoded with no size cap and wrote a client-controlled
content_type into the public bucket — and /upload-image put the client's
file_name straight into the storage path. Now, via _decode_image_upload:

  * the stored content type comes from magic-byte sniffing, never the claim;
    a claim contradicting the bytes is 415
  * only JPEG/PNG/WEBP are accepted (what StoreBuilder actually produces);
    SVG and HTML dressed up as images are 415
  * decoded size is capped at 10 MB (413), matching the client-side limit,
    with a base64-length pre-check so an oversized payload is never decoded
  * /upload-image names the stored object server-side (uuid + sniffed
    extension); file_name cannot influence the path at all

Hermetic: supabase_admin is replaced with a stub whose storage records
uploads, and _get_user_id_from_token is stubbed. No network.
"""
import base64
import re
import types

import pytest
from fastapi.testclient import TestClient

import main

STORE = "store-1"
OWNER = "owner-1"

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
WEBP = b"RIFF" + b"\x24\x00\x00\x00" + b"WEBP" + b"VP8 " + b"\x00" * 16
HTML = b"<html><script>alert(document.domain)</script></html>"
SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'


def _b64(data):
    return base64.b64encode(data).decode()


# ── fakes ─────────────────────────────────────────────────────────────────────

class _FakeQuery:
    def __init__(self, db, table):
        self._db = db
        self._table = table
        self._op = "select"
        self._payload = None

    def select(self, *a, **kw):
        self._op = "select"
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def eq(self, *a, **kw):
        return self

    def execute(self):
        if self._op == "update":
            self._db.updates.append((self._table, self._payload))
            return types.SimpleNamespace(data=[self._payload])
        return types.SimpleNamespace(data=self._db.rows.get(self._table, []))


class _FakeStorageBucket:
    def __init__(self, db):
        self._db = db

    def upload(self, path, data, opts):
        self._db.uploads.append({"path": path, "bytes": data, "opts": opts})

    def remove(self, path):
        self._db.removed.append(path)


class _FakeDb:
    """Routes table() to canned rows; records storage uploads and removes."""

    def __init__(self, rows):
        self.rows = rows
        self.updates = []
        self.uploads = []
        self.removed = []
        self.storage = types.SimpleNamespace(from_=lambda bucket: _FakeStorageBucket(self))

    def table(self, name):
        return _FakeQuery(self, name)


@pytest.fixture
def env(monkeypatch):
    db = _FakeDb({"selora_stores": [{"id": STORE, "user_id": OWNER}]})
    monkeypatch.setenv("SUPABASE_URL", "http://supa.test")
    monkeypatch.setattr("database.supabase_admin", lambda: db)
    monkeypatch.setattr(main, "_get_user_id_from_token", lambda request: (OWNER, "owner@example.com"))
    return TestClient(main.app), db


# ── valid images are accepted, typed from their bytes ─────────────────────────

def test_valid_png_accepted_and_named_server_side(env):
    client, db = env
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": _b64(PNG)})
    assert r.status_code == 200
    assert len(db.uploads) == 1
    up = db.uploads[0]
    assert re.fullmatch(rf"{STORE}/[0-9a-f\-]{{36}}\.png", up["path"])
    assert up["opts"]["content-type"] == "image/png"
    assert r.json()["url"] == f"http://supa.test/storage/v1/object/public/selora-products/{up['path']}"


def test_valid_jpeg_accepted_on_product_endpoint(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-product-image/prod-1",
        json={"file_data": _b64(JPEG), "content_type": "image/jpeg"},
    )
    assert r.status_code == 200
    assert db.uploads[0]["path"] == f"product-images/{STORE}/prod-1.jpg"
    assert db.uploads[0]["opts"]["content-type"] == "image/jpeg"


def test_valid_webp_accepted_on_category_endpoint(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-category-image/cat-1",
        json={"file_data": _b64(WEBP), "content_type": "image/webp"},
    )
    assert r.status_code == 200
    assert db.uploads[0]["opts"]["content-type"] == "image/webp"


def test_valid_jpeg_accepted_on_hero_endpoint(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-hero-image/main",
        json={"file_data": _b64(JPEG), "content_type": "image/jpeg"},
    )
    assert r.status_code == 200
    assert db.uploads[0]["path"] == f"hero-images/{STORE}/main.jpg"
    assert ("selora_stores", {"hero_image_main": r.json()["url"]}) in db.updates


# ── the claim never wins over the bytes ───────────────────────────────────────

def test_bytes_contradicting_claimed_type_rejected(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-image",
        json={"file_data": _b64(PNG), "content_type": "image/jpeg"},
    )
    assert r.status_code == 415
    assert db.uploads == []


def test_html_labelled_as_png_rejected(env):
    # The stored-XSS shape: script-bearing HTML claiming to be an image.
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-image",
        json={"file_data": _b64(HTML), "content_type": "image/png"},
    )
    assert r.status_code == 415
    assert db.uploads == []


def test_svg_rejected(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-image",
        json={"file_data": _b64(SVG), "content_type": "image/svg+xml"},
    )
    assert r.status_code == 415
    assert db.uploads == []


def test_hero_endpoint_rejects_non_image(env):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-hero-image/main",
        json={"file_data": _b64(HTML), "content_type": "image/jpeg"},
    )
    assert r.status_code == 415
    assert db.uploads == []
    assert db.updates == []


def test_stored_type_is_sniffed_when_no_claim_sent(env):
    client, db = env
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": _b64(PNG)})
    assert r.status_code == 200
    assert db.uploads[0]["opts"]["content-type"] == "image/png"


# ── size cap ──────────────────────────────────────────────────────────────────

def test_oversized_file_rejected(env):
    client, db = env
    oversized = JPEG + b"\x00" * (main.UPLOAD_MAX_BYTES + 1 - len(JPEG))
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": _b64(oversized)})
    assert r.status_code == 413
    assert db.uploads == []


def test_file_at_exact_cap_accepted(env):
    client, db = env
    at_cap = JPEG + b"\x00" * (main.UPLOAD_MAX_BYTES - len(JPEG))
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": _b64(at_cap)})
    assert r.status_code == 200
    assert len(db.uploads) == 1


# ── file_name cannot influence the stored path ────────────────────────────────

@pytest.mark.parametrize("file_name", [
    "../../evil.html",
    "..\\..\\evil.html",
    "/etc/passwd",
    "C:\\Windows\\evil.png",
    "a\x00b.png",
    "photo.png",  # even a benign name must not appear in the path
])
def test_file_name_never_reaches_storage_path(env, file_name):
    client, db = env
    r = client.post(
        f"/selora-stores/{STORE}/upload-image",
        json={"file_data": _b64(PNG), "file_name": file_name},
    )
    assert r.status_code == 200
    path = db.uploads[0]["path"]
    assert re.fullmatch(rf"{STORE}/[0-9a-f\-]{{36}}\.png", path)
    assert "evil" not in path and "passwd" not in path and "photo" not in path
    assert ".." not in path and "\\" not in path and "\x00" not in path


# ── malformed bodies ──────────────────────────────────────────────────────────

def test_missing_file_data_rejected(env):
    client, db = env
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"content_type": "image/png"})
    assert r.status_code == 400
    assert db.uploads == []


def test_invalid_base64_rejected(env):
    client, db = env
    r = client.post(f"/selora-stores/{STORE}/upload-image", json={"file_data": "!!!not-base64"})
    assert r.status_code == 400
    assert db.uploads == []
