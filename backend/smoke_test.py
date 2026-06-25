"""Quick smoke-test for the auth endpoints."""
import json
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/v1"


def req(method: str, path: str, body=None, token: str | None = None):
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def main() -> None:
    print("=" * 60)

    # 1. Seed demo user
    s, b = req("POST", "/auth/seed")
    print(f"[SEED]   {s}  -> {json.dumps(b, indent=2)}")
    assert s == 200, f"Expected 200, got {s}"

    # 2. Login with seeded credentials
    s, b = req("POST", "/auth/login", {"email": "admin@route53.local", "password": "Admin1234!"})
    print(f"[LOGIN]  {s}  -> token_type={b.get('token_type')}  expires_in={b.get('expires_in')}s  user={b.get('user')}")
    assert s == 200, f"Expected 200, got {s}"
    assert b.get("token_type") == "bearer"
    assert "access_token" in b
    assert b["user"]["email"] == "admin@route53.local"
    assert b["expires_in"] == 86400, f"Expected 86400s (24h), got {b['expires_in']}"
    token: str = b["access_token"]

    # 3. /me
    s, b = req("GET", "/auth/me", token=token)
    print(f"[ME]     {s}  -> {json.dumps(b, indent=2)}")
    assert s == 200, f"Expected 200, got {s}"
    assert b["email"] == "admin@route53.local"

    # 4. Logout
    s, b = req("POST", "/auth/logout", token=token)
    print(f"[LOGOUT] {s}  -> {json.dumps(b, indent=2)}")
    assert s == 200, f"Expected 200, got {s}"
    assert b["message"] == "Logged out"

    # 5. Wrong password → 401
    s, b = req("POST", "/auth/login", {"email": "admin@route53.local", "password": "wrongpass"})
    print(f"[WRONG]  {s}  -> {json.dumps(b, indent=2)}")
    assert s == 401, f"Expected 401, got {s}"

    # 6. /me without token → 403 (HTTPBearer auto_error returns 403 on missing header)
    s, b = req("GET", "/auth/me")
    print(f"[NO-TKN] {s}  -> {json.dumps(b, indent=2)}")
    assert s in (401, 403), f"Expected 401/403, got {s}"

    print("=" * 60)
    print("ALL ASSERTIONS PASSED [OK]")


if __name__ == "__main__":
    main()
