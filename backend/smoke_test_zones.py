"""
Smoke-test for Hosted Zones API endpoints.

Run with the server already started:
    python smoke_test_zones.py

Requires the demo user to exist (run /auth/seed first or this script seeds it).
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/v1"


def req(
    method: str,
    path: str,
    body: object = None,
    token: str | None = None,
) -> tuple[int, object]:
    data = json.dumps(body).encode() if body else None
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(
        BASE + path, data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw) if raw else {}


def section(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print("=" * 60)


def assert_eq(label: str, actual: object, expected: object) -> None:
    if actual != expected:
        print(f"  [FAIL] {label}: expected {expected!r}, got {actual!r}")
        sys.exit(1)
    print(f"  [OK]   {label} == {expected!r}")


def assert_in(label: str, key: str, mapping: dict) -> None:
    if key not in mapping:
        print(f"  [FAIL] {label}: key '{key}' not found in {mapping!r}")
        sys.exit(1)
    print(f"  [OK]   {label} key='{key}' present")


def main() -> None:
    # ── 0. Seed + login ──────────────────────────────────────────────────────
    section("0. Seed & Login")
    s, b = req("POST", "/auth/seed")
    print(f"  seed: {s}")
    assert s == 200, f"Seed failed: {b}"

    s, b = req(
        "POST",
        "/auth/login",
        {"email": "admin@route53.local", "password": "Admin1234!"},
    )
    assert_eq("login status", s, 200)
    token: str = b["access_token"]  # type: ignore[index]
    print(f"  token acquired")

    # ── 1. POST /hosted-zones — auto-append dot ──────────────────────────────
    section("1. Create zone (no trailing dot — auto-append)")
    s, b = req("POST", "/hosted-zones", {"name": "example.com", "type": "PUBLIC"}, token)
    print(f"  {s}  {b}")
    assert_eq("create status", s, 201)
    assert_eq("name", b["name"], "example.com.")  # type: ignore[index]
    assert_eq("record_count", b["record_count"], 2)  # type: ignore[index]
    assert_in("id", "id", b)  # type: ignore[arg-type]
    zone_id: str = b["id"]  # type: ignore[index]
    print(f"  zone_id={zone_id}")

    # ── 2. POST /hosted-zones — duplicate → 409 ──────────────────────────────
    section("2. Duplicate zone → 409")
    s, b = req("POST", "/hosted-zones", {"name": "example.com.", "type": "PUBLIC"}, token)
    print(f"  {s}  {b}")
    assert_eq("duplicate status", s, 409)

    # ── 3. POST /hosted-zones — invalid domain → 422 ─────────────────────────
    section("3. Invalid domain → 422")
    s, b = req("POST", "/hosted-zones", {"name": "not_a_domain", "type": "PUBLIC"}, token)
    print(f"  {s}  {b}")
    assert_eq("invalid domain status", s, 422)

    # ── 4. GET /hosted-zones — list ──────────────────────────────────────────
    section("4. List zones")
    s, b = req("GET", "/hosted-zones", token=token)
    print(f"  {s}  zones={b.get('zones', 'MISSING')}")
    assert_eq("list status", s, 200)
    assert_in("zones", "zones", b)  # type: ignore[arg-type]
    assert_in("total", "total", b)  # type: ignore[arg-type]
    assert_in("total_pages", "total_pages", b)  # type: ignore[arg-type]
    assert b["total"] >= 1, f"Expected total >= 1, got {b['total']}"  # type: ignore[index]

    # ── 5. GET /hosted-zones — search filter ─────────────────────────────────
    section("5. Search filter")
    s, b = req("GET", "/hosted-zones?search=example", token=token)
    print(f"  {s}  total={b.get('total')}")
    assert_eq("search status", s, 200)
    assert b["total"] >= 1, f"Expected >= 1 result"  # type: ignore[index]

    s, b = req("GET", "/hosted-zones?search=zzz-no-match-zzz", token=token)
    assert_eq("empty search total", b["total"], 0)  # type: ignore[index]

    # ── 6. GET /hosted-zones — type filter ───────────────────────────────────
    section("6. Type filter")
    s, b = req("GET", "/hosted-zones?type=PUBLIC", token=token)
    assert_eq("type filter status", s, 200)
    for z in b["zones"]:  # type: ignore[index]
        assert_eq("zone type", z["type"], "PUBLIC")

    # ── 7. GET /hosted-zones — pagination ────────────────────────────────────
    section("7. Pagination")
    s, b = req("GET", "/hosted-zones?page=1&page_size=1", token=token)
    assert_eq("page status", s, 200)
    assert len(b["zones"]) <= 1, f"Expected <= 1 zone on page, got {len(b['zones'])}"  # type: ignore[index]

    # ── 8. GET /hosted-zones/{zone_id} — with ns_records ─────────────────────
    section(f"8. Get zone {zone_id}")
    s, b = req("GET", f"/hosted-zones/{zone_id}", token=token)
    print(f"  {s}  {b}")
    assert_eq("get status", s, 200)
    assert_eq("zone id", b["id"], zone_id)  # type: ignore[index]
    assert_in("ns_records", "ns_records", b)  # type: ignore[arg-type]
    assert isinstance(b["ns_records"], list) and len(b["ns_records"]) > 0, (  # type: ignore[index]
        f"Expected non-empty ns_records, got {b['ns_records']}"
    )

    # ── 9. GET /hosted-zones/{zone_id} — 404 ─────────────────────────────────
    section("9. Get nonexistent zone → 404")
    s, b = req("GET", "/hosted-zones/ZNONEXISTENT00", token=token)
    print(f"  {s}  {b}")
    assert_eq("404 status", s, 404)

    # ── 10. PUT /hosted-zones/{zone_id} ──────────────────────────────────────
    section("10. Update zone (comment + type)")
    s, b = req(
        "PUT",
        f"/hosted-zones/{zone_id}",
        {"comment": "Updated comment", "type": "PRIVATE"},
        token,
    )
    print(f"  {s}  {b}")
    assert_eq("update status", s, 200)
    assert_eq("comment", b["comment"], "Updated comment")  # type: ignore[index]
    assert_eq("type", b["type"], "PRIVATE")  # type: ignore[index]

    # ── 11. DELETE — zone has only default records → 204 ─────────────────────
    section("11. Delete zone (only default NS/SOA) → 204")
    s, b = req("DELETE", f"/hosted-zones/{zone_id}", token=token)
    print(f"  {s}")
    assert_eq("delete status", s, 204)

    # ── 12. DELETE — zone with active records → 409 ───────────────────────────
    section("12. Create zone, add record, then delete → 409")
    s, b = req(
        "POST",
        "/hosted-zones",
        {"name": "blocked.example.com", "type": "PUBLIC"},
        token,
    )
    assert_eq("create for delete test status", s, 201)
    zone_id2: str = b["id"]  # type: ignore[index]

    # Add a custom A record
    s, b = req(
        "POST",
        f"/hosted-zones/{zone_id2}/records",
        {"name": "www", "type": "A", "ttl": 300, "value": ["1.2.3.4"]},
        token,
    )
    print(f"  add record: {s}  {b}")
    assert_eq("add record status", s, 201)

    # Attempt to delete — should get 409
    s, b = req("DELETE", f"/hosted-zones/{zone_id2}", token=token)
    print(f"  delete attempt: {s}  {b}")
    assert_eq("delete blocked status", s, 409)
    assert "Cannot delete" in b.get("detail", {}).get("detail", ""), (  # type: ignore[union-attr]
        f"Expected 'Cannot delete' in detail: {b}"
    )

    # ── Clean up ──────────────────────────────────────────────────────────────
    # Delete the A record first, then delete the zone
    s2, b2 = req("GET", f"/hosted-zones/{zone_id2}/records", token=token)
    for rec in b2.get("items", []):  # type: ignore[union-attr]
        if rec["type"] not in ("NS", "SOA"):
            req("DELETE", f"/hosted-zones/{zone_id2}/records/{rec['id']}", token=token)

    s, b = req("DELETE", f"/hosted-zones/{zone_id2}", token=token)
    assert_eq("cleanup delete status", s, 204)

    print("\n" + "=" * 60)
    print("  ALL HOSTED ZONES ASSERTIONS PASSED [OK]")
    print("=" * 60)


if __name__ == "__main__":
    main()
