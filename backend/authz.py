"""Composable authorization dependencies for Selora route handlers.

This module does NOT implement any new authentication. It composes two
primitives that already exist in the codebase:

  * ``main._get_user_id_from_token``  — verifies the caller's Supabase JWT.
  * ``database.get_store_by_id``      — resolves a store row (either family).

Both are imported lazily inside the dependency functions on purpose:

  1. It avoids a circular import. Once these dependencies are wired into
     ``main``'s route handlers, ``main`` will import this module at load time;
     importing ``main`` back here at module load would form a cycle.
  2. It keeps this module importable without starting the FastAPI app, and it
     makes both seams trivially monkeypatchable in tests.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, Request


@dataclass(frozen=True)
class UserIdentity:
    """The verified identity of the caller. ``user_id`` is the Supabase auth uid."""
    user_id: str
    email: Optional[str] = None


def get_current_user(request: Request) -> UserIdentity:
    """FastAPI dependency: verify the caller's Supabase JWT and return their identity.

    Delegates verification to the existing ``main._get_user_id_from_token`` — it
    is not re-implemented here. That function raises ``401`` for a missing,
    malformed, or expired token and ``503`` if the auth service is unreachable.
    This wrapper never returns ``None``: it either returns a ``UserIdentity`` or
    propagates the ``HTTPException`` raised by the verifier.
    """
    from main import _get_user_id_from_token  # lazy — see module docstring

    user_id, email = _get_user_id_from_token(request)
    return UserIdentity(user_id=user_id, email=email)


def require_store_owner(
    store_id: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """FastAPI dependency: resolve ``store_id`` and confirm ``user`` owns it.

    Resolution goes through ``database.get_store_by_id``, which already handles
    BOTH store families — the Shopify ``stores`` table and the native
    ``selora_stores`` table — and normalizes either row to expose a ``user_id``
    field. Ownership is therefore a single ``user_id`` comparison for both.

    Returns the resolved store row so the handler does not have to fetch it
    again. Raises ``404`` both when the store does not exist and when it exists
    but belongs to another user — the two cases are deliberately
    indistinguishable so the response never leaks the existence of a store the
    caller does not own.
    """
    from database import get_store_by_id  # lazy — see module docstring

    store = get_store_by_id(store_id)
    if not store or store.get("user_id") != user.user_id:
        raise HTTPException(status_code=404, detail="Store not found")
    return store
