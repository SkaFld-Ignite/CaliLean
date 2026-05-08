#!/bin/bash
# Product catalog management script for CaliLean
# Updates existing products and creates new ones per the final product list

set -e

BASE_URL="http://localhost:9000"
SALES_CHANNEL="sc_01KKMFQ9CRSCS68SFYHHP6SB32"

# Authenticate
echo "🔐 Authenticating..."
TOKEN=$(curl -s "$BASE_URL/auth/user/emailpass" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourmail.com","password":"33opjsbd1f3ve0kjxdgwle6xl5oaksl3"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate"
  exit 1
fi
echo "✅ Authenticated"

AUTH="Authorization: Bearer $TOKEN"

# Helper: delete a variant
delete_variant() {
  local product_id=$1
  local variant_id=$2
  curl -s -X DELETE "$BASE_URL/admin/products/$product_id/variants/$variant_id" -H "$AUTH" > /dev/null
}

# Helper: create a variant with price
create_variant() {
  local product_id=$1
  local title=$2
  local sku=$3
  local price=$4  # in cents

  curl -s -X POST "$BASE_URL/admin/products/$product_id/variants" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"sku\": \"$sku\",
      \"manage_inventory\": false,
      \"prices\": [{\"amount\": $price, \"currency_code\": \"usd\"}]
    }" > /dev/null
}

# Helper: update product status
update_status() {
  local product_id=$1
  local status=$2
  curl -s -X POST "$BASE_URL/admin/products/$product_id" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"status\": \"$status\"}" > /dev/null
}

# Helper: create a new product
create_product() {
  local title=$1
  local handle=$2
  local status=$3
  shift 3
  # Remaining args are variant triples: title sku price

  local variants="["
  local first=true
  while [ $# -ge 3 ]; do
    local vtitle=$1; local vsku=$2; local vprice=$3
    shift 3
    if [ "$first" = true ]; then first=false; else variants+=","; fi
    variants+="{\"title\":\"$vtitle\",\"sku\":\"$vsku\",\"manage_inventory\":false,\"prices\":[{\"amount\":$vprice,\"currency_code\":\"usd\"}]}"
  done
  variants+="]"

  local result=$(curl -s -X POST "$BASE_URL/admin/products" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"handle\": \"$handle\",
      \"status\": \"$status\",
      \"sales_channels\": [{\"id\": \"$SALES_CHANNEL\"}],
      \"variants\": $variants
    }")

  local pid=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('product',{}).get('id',''))" 2>/dev/null)
  if [ -n "$pid" ] && [ "$pid" != "" ]; then
    echo "  ✅ Created: $title ($pid)"
  else
    echo "  ❌ Failed to create: $title"
    echo "  Response: $result" | head -c 200
    echo
  fi
}

echo ""
echo "═══════════════════════════════════════"
echo "  STEP 1: Draft products NOT in final list"
echo "═══════════════════════════════════════"

# Products to set to draft (not in final list)
DRAFT_IDS=(
  "prod_01KKVY3HVW4D1446ZBFQWNCHYQ"  # TH9507
  "prod_01KKVY3M78XDS5VX477RTMXGYY"  # PT-141
  "prod_01KKVY3MVW01TS5SGJ4ZYDZZRW"  # Glutathione
  "prod_01KKVY3PKR3ADWFB13SDWE57R6"  # BPC-157/TB-500 Blend
  "prod_01KKVY3Q6AXWBFVT8GARDE7VQ8"  # NAD+
  "prod_01KKVY3QS423K0GSYRBVKRY5PQ"  # Snap-8
  "prod_01KKVY3RBFGG7BG1XAWNTNH697"  # Selank
  "prod_01KKVY3RXWMPWH4VK0HQJ5T6V1"  # Cagrilintide
  "prod_01KKVY3SHBPEAH58NYAJSR59PG"  # Thymosin Alpha-1
  "prod_01KKVY3T48X9NVBN42P9424BTJ"  # IGF-1 LR3
  "prod_01KKVY3TQ37T89YSDBGCKB53MH"  # Hexarelin
  "prod_01KKVY3VA9B2F4KSTCFNRSTK1V"  # CJC-1295 No DAC
  "prod_01KKVY3VX003ZTME9NRMECB0RQ"  # Sermorelin
  "prod_01KKVY3WFGQ9V033A2XNTJ648E"  # GHRP-2
  "prod_01KKVY3X1YG3M0J05M28C3S13R"  # GHRP-6
  "prod_01KKVY3XNMNTMD3KDCVGDABN6F"  # CL-3R (was Retatrutide)
  "prod_01KKVY3Y7KFPTECA84TYNC4W09"  # Melanotan I
  "prod_01KKVY3ZB4SAF4RVY4987G5N5M"  # Mazdutide
  "prod_01KKVY3ZXKD1PMK76DSAHHSHHT"  # Semax
  "prod_01KKVY40FQ07KF898KSSSFFXA6"  # DSIP
  "prod_01KKVY412F9HGEFYRY9EYWRANP"  # Epithalon
  "prod_01KKVY41N5JJV3BR76KZKDMK9N"  # AHK-Cu
  "prod_01KKVY42TS8D5TSK3B3C5HXJ12"  # Pinealon
  "prod_01KKVY43CJG81ENXBB5T6EAFNY"  # 5-Amino-1MQ
  "prod_01KKVY44020G0WMHFW9AT29JX2"  # CJC-1295/Ipamorelin Blend
  "prod_01KQ0W3RF9R3JR6S75JKHPTB4E"  # test product
)

for pid in "${DRAFT_IDS[@]}"; do
  update_status "$pid" "draft"
done
echo "✅ Set ${#DRAFT_IDS[@]} products to draft"

echo ""
echo "═══════════════════════════════════════"
echo "  STEP 2: Update existing products"
echo "═══════════════════════════════════════"

# --- BPC-157 (prod_01KKVY3H63QW7HBX13G12Z0ZTZ) ---
# Current: 5mg, 10mg, 20mg → Need: 5mg, 10mg (remove 20mg)
echo "  Updating BPC-157..."
delete_variant "prod_01KKVY3H63QW7HBX13G12Z0ZTZ" "variant_01KKVY3H8QJSMZHDT0PJ1ZFM3E"  # 20mg
update_status "prod_01KKVY3H63QW7HBX13G12Z0ZTZ" "published"
echo "  ✅ BPC-157: removed 20mg variant"

# --- GHK-Cu (prod_01KKVY3KKQT8XCG39E3WNJP0TG) ---
# Current: 50mg, 100mg → Need: 50mg, 100mg ✓ (just publish)
echo "  Updating GHK-Cu..."
update_status "prod_01KKVY3KKQT8XCG39E3WNJP0TG" "published"
echo "  ✅ GHK-Cu: published (variants already correct)"

# --- Ipamorelin (prod_01KKVY3JF30DG48VSYDEW4XTN8) ---
# Current: 10mg → Need: 5mg, 10mg (add 5mg)
echo "  Updating Ipamorelin..."
create_variant "prod_01KKVY3JF30DG48VSYDEW4XTN8" "5mg" "CL-IPM-0005" 3500
update_status "prod_01KKVY3JF30DG48VSYDEW4XTN8" "published"
echo "  ✅ Ipamorelin: added 5mg variant, published"

# --- MOTS-C (prod_01KKVY427RN68N5TRW3WP9EF55) ---
# Current: 5mg, 10mg → Need: 10mg, 40mg (remove 5mg, add 40mg)
echo "  Updating MOTS-C..."
delete_variant "prod_01KKVY427RN68N5TRW3WP9EF55" "variant_01KQ6KMVPV3VXYSD8QWVEH3Z4E"  # 5mg
create_variant "prod_01KKVY427RN68N5TRW3WP9EF55" "40mg" "CL-MOT-0040" 899
update_status "prod_01KKVY427RN68N5TRW3WP9EF55" "published"
echo "  ✅ MOTS-C: removed 5mg, added 40mg"

# --- TB-500 (prod_01KKVY3K187HW5HP7Q3E3NQJCS) ---
# Current: 5mg, 10mg → Need: 5mg, 10mg ✓ (already published)
echo "  ✅ TB-500: already correct and published"

# --- GLOW (prod_01KKVY3NFTRB6744B7BHH85NE8) ---
# Current: 70mg → Need: 70mg ✓ (just publish)
echo "  Updating GLOW..."
update_status "prod_01KKVY3NFTRB6744B7BHH85NE8" "published"
echo "  ✅ GLOW: published"

# --- KLOW (prod_01KKVY3P21G0ARTN9HXG2Q8RCY) ---
# Current: 80mg → Need: 80mg ✓ (just publish)
echo "  Updating KLOW..."
update_status "prod_01KKVY3P21G0ARTN9HXG2Q8RCY" "published"
echo "  ✅ KLOW: published"

# --- Melanotan II (prod_01KKVY3YSC9SZD4X653KGVF9NK) ---
# Current: 10mg → Need: 10mg ✓ (just publish, rename to "Melanotan 2")
echo "  Updating Melanotan 2..."
curl -s -X POST "$BASE_URL/admin/products/prod_01KKVY3YSC9SZD4X653KGVF9NK" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title": "Melanotan 2", "handle": "melanotan-2", "status": "published"}' > /dev/null
echo "  ✅ Melanotan 2: renamed and published"

echo ""
echo "═══════════════════════════════════════"
echo "  STEP 3: Create new products"
echo "═══════════════════════════════════════"

# CL-1S (GLP-1 Receptor Agonist)
create_product "CL-1S" "cl-1s" "published" \
  "10mg" "CL-GL1-0010" 15900 \
  "30mg" "CL-GL1-0030" 39900

# CL-2T (Dual GIP/GLP-1 Receptor Agonist)
create_product "CL-2T" "cl-2t" "published" \
  "10mg" "CL-GL2-0010" 15900 \
  "30mg" "CL-GL2-0030" 39900

# CL-3R (Triple GIP/GLP-1/Glucagon Receptor Agonist)
create_product "CL-3R" "cl-3r" "published" \
  "10mg" "CL-GL3-0010" 17900 \
  "30mg" "CL-GL3-0030" 44900

# Tesamorelin
create_product "Tesamorelin" "tesamorelin" "published" \
  "10mg" "CL-TES-0010" 17900 \
  "20mg" "CL-TES-0020" 32900

# SS-31
create_product "SS-31" "ss-31" "published" \
  "10mg" "CL-SS3-0010" 12900 \
  "50mg" "CL-SS3-0050" 54900

# Wolverine
create_product "Wolverine" "wolverine" "published" \
  "5mg" "CL-WLV-0005" 19900 \
  "10mg" "CL-WLV-0010" 34900

# Bac Water
create_product "Bac Water" "bac-water" "published" \
  "3mL" "CL-BAC-0003" 999 \
  "10mL" "CL-BAC-0010" 1499

echo ""
echo "═══════════════════════════════════════"
echo "  STEP 4: Verify final state"
echo "═══════════════════════════════════════"

echo ""
echo "Published products:"
curl -s "$BASE_URL/admin/products?status=published&limit=50&fields=title,handle,status" \
  -H "$AUTH" | python3 -c "
import json, sys
data = json.load(sys.stdin)
products = data.get('products', [])
for p in sorted(products, key=lambda x: x['title']):
    print(f'  • {p[\"title\"]} ({p[\"handle\"]})')
print(f'\nTotal published: {len(products)}')
"

echo ""
echo "✅ Product catalog update complete!"
