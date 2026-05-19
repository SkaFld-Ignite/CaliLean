#!/usr/bin/env python3
"""
CaliLean – Medusa Product Seeder

Seeds 33 peptide products into a Medusa 2.0 backend via the Admin API.
Creates a US region (USD), a "Peptides" collection, then imports all products
with metadata, options, variants, prices, and images.

Usage:
  python3 scripts/seed-products.py

Environment (or edit constants below):
  MEDUSA_BACKEND_URL  – defaults to https://backend-production-3e14.up.railway.app
  MEDUSA_ADMIN_EMAIL  – defaults to admin@yourmail.com
  MEDUSA_ADMIN_PASS   – defaults to value from Railway env
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# ── Config ──────────────────────────────────────────────────────────────────
BACKEND_URL = os.getenv(
    "MEDUSA_BACKEND_URL",
    "https://backend-production-3e14.up.railway.app",
)
ADMIN_EMAIL = os.getenv("MEDUSA_ADMIN_EMAIL", "admin@yourmail.com")
ADMIN_PASS = os.getenv("MEDUSA_ADMIN_PASS")
if not ADMIN_PASS:
    print("FATAL: MEDUSA_ADMIN_PASS environment variable is required.")
    sys.exit(1)

SEED_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "storefront",
    "src",
    "data",
    "products-seed.json",
)

# ── HTTP Helpers ────────────────────────────────────────────────────────────

def api(method, path, data=None, token=None):
    """Make an HTTP request to the Medusa Admin API."""
    url = f"{BACKEND_URL}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        print(f"  API Error {e.code} {method} {path}: {error_body[:300]}")
        return None


def authenticate():
    """Get admin JWT token."""
    result = api("POST", "/auth/user/emailpass", {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS,
    })
    if not result or "token" not in result:
        print("FATAL: Could not authenticate with Medusa admin API.")
        sys.exit(1)
    return result["token"]


# ── Setup Steps ─────────────────────────────────────────────────────────────

def ensure_us_region(token):
    """Create a US region with USD if it doesn't exist. Return region ID."""
    result = api("GET", "/admin/regions", token=token)
    if result:
        for region in result.get("regions", []):
            if region["currency_code"] == "usd":
                print(f"  US region already exists: {region['id']}")
                return region["id"]

    print("  Creating US region (USD)...")
    result = api("POST", "/admin/regions", {
        "name": "United States",
        "currency_code": "usd",
        "countries": ["us"],
    }, token=token)
    if result and "region" in result:
        region_id = result["region"]["id"]
        print(f"  Created region: {region_id}")
        return region_id

    print("  WARN: Could not create US region")
    return None


def ensure_collection(token, title="Peptides", handle="peptides"):
    """Create a product collection if it doesn't exist. Return collection ID."""
    result = api("GET", f"/admin/collections?handle[]={handle}", token=token)
    if result:
        for col in result.get("collections", []):
            if col["handle"] == handle:
                print(f"  Collection '{title}' already exists: {col['id']}")
                return col["id"]

    print(f"  Creating collection '{title}'...")
    result = api("POST", "/admin/collections", {
        "title": title,
        "handle": handle,
    }, token=token)
    if result and "collection" in result:
        col_id = result["collection"]["id"]
        print(f"  Created collection: {col_id}")
        return col_id

    print(f"  WARN: Could not create collection '{title}'")
    return None


def get_sales_channel_id(token):
    """Get the default sales channel ID."""
    result = api("GET", "/admin/sales-channels?limit=1", token=token)
    if result and result.get("sales_channels"):
        return result["sales_channels"][0]["id"]
    return None


def get_existing_handles(token):
    """Get set of existing product handles to skip duplicates."""
    handles = set()
    offset = 0
    while True:
        result = api("GET", f"/admin/products?limit=100&offset={offset}&fields=handle", token=token)
        if not result or not result.get("products"):
            break
        for p in result["products"]:
            handles.add(p["handle"])
        if len(result["products"]) < 100:
            break
        offset += 100
    return handles


# ── Product Creation ────────────────────────────────────────────────────────

def create_product(token, product, region_id, collection_id, sales_channel_id):
    """Create a single product with options, variants, prices, and images.

    Reads per-variant pricing from product["variants"] (new schema):
        [{"size": "5mg", "sku": "CL-BPC-0005", "price": 40.0, "hidden": False}]
    Variants with "hidden": true are tracked in the seed but skipped here
    (not created in Medusa until a price is set).
    """
    handle = product["handle"]
    title = product["title"]
    thumbnail = product.get("thumbnail") or product.get("image", "")

    # Clean metadata — remove empty strings
    raw_meta = product.get("metadata", {})
    metadata = {k: v for k, v in raw_meta.items() if v}

    seed_variants = product.get("variants")
    if not seed_variants:
        raise ValueError(
            f"Product '{handle}' has no 'variants' array. "
            f"Update to per-variant schema (size/sku/price/hidden)."
        )

    # Filter out hidden variants (kept in seed for tracking, not created live)
    visible_variants = [v for v in seed_variants if not v.get("hidden")]
    if not visible_variants:
        print(f"  SKIP {handle}: all variants are hidden")
        return None

    sizes = [v["size"] for v in visible_variants]

    variants = []
    for v in visible_variants:
        amount = v.get("price")
        if amount is None:
            raise ValueError(
                f"Variant {v['sku']} on '{handle}' has no price but is not hidden"
            )
        variants.append({
            "title": v["size"],
            "sku": v["sku"],
            "manage_inventory": False,
            "prices": [{"amount": amount, "currency_code": "usd"}],
            "options": {"Size": v["size"]},
        })

    payload = {
        "title": title,
        "handle": handle,
        "description": product.get("description", ""),
        "status": "published",
        "metadata": metadata,
        "options": [
            {"title": "Size", "values": sizes},
        ],
        "variants": variants,
        "images": [{"url": thumbnail}] if thumbnail else [],
    }

    if thumbnail:
        payload["thumbnail"] = thumbnail
    if collection_id:
        payload["collection_id"] = collection_id
    if sales_channel_id:
        payload["sales_channels"] = [{"id": sales_channel_id}]

    result = api("POST", "/admin/products", payload, token=token)
    if result and "product" in result:
        return result["product"]["id"]
    return None


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  CaliLean – Medusa Product Seeder")
    print("=" * 60)
    print(f"\n  Backend: {BACKEND_URL}")
    print(f"  Seed file: {SEED_FILE}\n")

    # Load seed data
    with open(SEED_FILE) as f:
        products = json.load(f)
    print(f"  Loaded {len(products)} products from seed file\n")

    # Authenticate
    print("[1/5] Authenticating...")
    token = authenticate()
    print("  OK\n")

    # Ensure US region
    print("[2/5] Ensuring US region (USD)...")
    region_id = ensure_us_region(token)
    print()

    # Ensure collection
    print("[3/5] Ensuring 'Peptides' collection...")
    collection_id = ensure_collection(token)
    print()

    # Get sales channel
    print("[4/5] Getting sales channel...")
    sc_id = get_sales_channel_id(token)
    print(f"  Sales channel: {sc_id}\n")

    # Check existing
    existing = get_existing_handles(token)
    print(f"  {len(existing)} products already in database\n")

    # Create products
    print("[5/5] Creating products...")
    created = 0
    skipped = 0
    failed = 0

    for i, product in enumerate(products):
        handle = product["handle"]
        title = product["title"]

        if handle in existing:
            print(f"  [{i+1:2d}/{len(products)}] SKIP {title} (already exists)")
            skipped += 1
            continue

        print(f"  [{i+1:2d}/{len(products)}] Creating {title}...", end=" ", flush=True)
        prod_id = create_product(token, product, region_id, collection_id, sc_id)

        if prod_id:
            print(f"OK ({prod_id})")
            created += 1
        else:
            print("FAILED")
            failed += 1

        # Small delay to avoid rate limiting
        time.sleep(0.3)

    print(f"\n{'=' * 60}")
    print(f"  Done! Created: {created} | Skipped: {skipped} | Failed: {failed}")
    print(f"{'=' * 60}\n")

    # Delete demo products if they exist
    demo_handles = {"sweatshirt", "t-shirt", "sweatpants", "shorts"}
    demo_to_delete = demo_handles & existing
    if demo_to_delete:
        print(f"  Found {len(demo_to_delete)} demo products. Delete them? (y/n) ", end="", flush=True)
        try:
            answer = input().strip().lower()
        except EOFError:
            answer = "n"
        if answer == "y":
            result = api("GET", "/admin/products?limit=100&fields=id,handle", token=token)
            if result:
                for p in result["products"]:
                    if p["handle"] in demo_handles:
                        print(f"  Deleting demo: {p['handle']}...", end=" ")
                        api("DELETE", f"/admin/products/{p['id']}", token=token)
                        print("OK")
            print("  Demo products removed.\n")


if __name__ == "__main__":
    main()
