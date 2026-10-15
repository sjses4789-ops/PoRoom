"""서버와 말하는 곳 — Supabase(PostgREST, RLS 그대로 적용)와 웹의 서버 액션(/api/app/rpc).

읽기는 Supabase에 직접(웹·앱과 같은 보안 규칙), 쓰기·검증이 필요한 일은 웹의 서버 액션을 그대로 부른다 —
데스크탑 프로그램에 로직을 다시 구현하지 않는다(웹·앱과 항상 같은 규칙).
"""
from __future__ import annotations

from typing import Any

import httpx

from .auth import AuthError, AuthManager
from .config import Config


class ApiError(Exception):
    pass


class Api:
    def __init__(self, config: Config, auth: AuthManager) -> None:
        self._config = config
        self._auth = auth
        self._client = httpx.Client(timeout=20)

    # ── 공통 ───────────────────────────────────────────────────
    def _headers(self, token: str | None = None) -> dict[str, str]:
        if token is None:
            try:
                token = self._auth.access_token()
            except AuthError:
                token = None
        return {
            "apikey": self._config.supabase_anon_key,
            "Authorization": f"Bearer {token or self._config.supabase_anon_key}",
        }

    def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        headers = {**self._headers(), **kwargs.pop("headers", {})}
        res = self._client.request(method, url, headers=headers, **kwargs)
        if res.status_code == 401 and self._auth.is_signed_in:
            # 토큰이 막 만료됐을 수 있다 — 한 번 갱신해서 다시 시도한다.
            try:
                self._auth.ensure_fresh(force=True)
            except AuthError:
                return res
            headers = {**self._headers(), **kwargs.get("headers", {})}
            res = self._client.request(method, url, headers=headers, **kwargs)
        return res

    # ── PostgREST ──────────────────────────────────────────────
    def select(
        self,
        table: str,
        columns: str = "*",
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
        single: bool = False,
    ) -> Any:
        """filters는 PostgREST 형식(예: {"room_id": "eq.123", "id": "in.(a,b)"}). single이면 한 행(없으면 None)."""
        params: dict[str, str] = {"select": columns, **(filters or {})}
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = str(limit)
        res = self._request("GET", f"{self._config.supabase_url}/rest/v1/{table}", params=params)
        if res.status_code >= 400:
            raise ApiError(f"select {table}: {res.status_code} {res.text[:200]}")
        rows = res.json()
        if single:
            return rows[0] if rows else None
        return rows

    def insert(self, table: str, row: dict, returning: str | None = None) -> Any:
        headers = {"Prefer": "return=representation"} if returning else {}
        params = {"select": returning} if returning else None
        res = self._request("POST", f"{self._config.supabase_url}/rest/v1/{table}", json=row, headers=headers, params=params)
        if res.status_code >= 400:
            raise ApiError(f"insert {table}: {res.status_code} {res.text[:200]}")
        if returning:
            data = res.json()
            return data[0] if data else None
        return None

    def delete(self, table: str, filters: dict[str, str]) -> None:
        res = self._request("DELETE", f"{self._config.supabase_url}/rest/v1/{table}", params=filters)
        if res.status_code >= 400:
            raise ApiError(f"delete {table}: {res.status_code} {res.text[:200]}")

    def rpc_db(self, function: str, args: dict | None = None) -> Any:
        """DB 함수(예: my_attendance_dates)를 부른다."""
        res = self._request("POST", f"{self._config.supabase_url}/rest/v1/rpc/{function}", json=args or {})
        if res.status_code >= 400:
            raise ApiError(f"rpc {function}: {res.status_code} {res.text[:200]}")
        return res.json() if res.content else None

    # ── 웹 서버 액션 ───────────────────────────────────────────
    def web_rpc(self, fn: str, args: list | None = None) -> Any:
        """웹의 서버 액션(src/lib/*.ts)을 그대로 부른다. 결과(result)를 돌려주고, 실패하면 None."""
        if self._config.preview:
            return None
        res = self._request("POST", f"{self._config.web_url}/api/app/rpc", json={"fn": fn, "args": args or []})
        if res.status_code != 200:
            return None
        body = res.json()
        if body.get("ok") is not True:
            return None
        return body.get("result")

    def get_bytes(self, url: str) -> bytes | None:
        """캐릭터 이미지 같은 공개 파일을 받는다."""
        try:
            res = self._client.get(url, timeout=15)
        except httpx.HTTPError:
            return None
        return res.content if res.status_code == 200 else None

    def close(self) -> None:
        self._client.close()
