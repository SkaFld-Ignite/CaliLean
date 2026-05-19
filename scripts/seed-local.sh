#!/bin/bash
# Seed local Medusa instance to match production
# Usage: bash scripts/seed-local.sh

set -e

BASE_URL="http://localhost:9000"
EMAIL="admin@calilean.com"
PASSWORD="supersecret"

# Auth
TOKEN=$(curl -s "$BASE_URL/auth/user/emailpass" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

api() {
  local method=$1 path=$2 data=$3
  if [ -n "$data" ]; then
    curl -s "$BASE_URL/admin$path" -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s "$BASE_URL/admin$path" -X "$method" \
      -H "Authorization: Bearer $TOKEN"
  fi
}

echo "=== Updating store name ==="
STORE_ID=$(api GET /stores | python3 -c "import sys,json; print(json.load(sys.stdin)['stores'][0]['id'])")
api POST "/stores/$STORE_ID" '{"name":"CaliLean","supported_currencies":[{"currency_code":"eur","is_default":true},{"currency_code":"usd","is_default":false}]}' > /dev/null
echo "  Store updated to CaliLean"

echo -e "\n=== Creating regions ==="
# US region
US_REGION=$(api POST /regions '{
  "name": "United States",
  "currency_code": "usd",
  "countries": ["us"],
  "automatic_taxes": true
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['region']['id'])")
echo "  US region: $US_REGION"

# Europe region
EU_REGION=$(api POST /regions '{
  "name": "Europe",
  "currency_code": "eur",
  "countries": ["dk","fr","de","it","es","se","gb"],
  "automatic_taxes": true
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['region']['id'])")
echo "  EU region: $EU_REGION"

echo -e "\n=== Creating product categories ==="
# Parent category
PEPTIDES_ID=$(api POST /product-categories '{
  "name": "Peptides",
  "handle": "peptides",
  "is_active": true,
  "is_internal": false
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Peptides: $PEPTIDES_ID"

SUPPLIES_ID=$(api POST /product-categories '{
  "name": "Supplies",
  "handle": "supplies",
  "is_active": true,
  "is_internal": false
}' | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Supplies: $SUPPLIES_ID"

# Child categories under Peptides
RECOVERY_ID=$(api POST /product-categories "{
  \"name\": \"Recovery\",
  \"handle\": \"recovery\",
  \"is_active\": true,
  \"is_internal\": false,
  \"parent_category_id\": \"$PEPTIDES_ID\"
}" | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Recovery: $RECOVERY_ID"

WEIGHT_ID=$(api POST /product-categories "{
  \"name\": \"Weight Management\",
  \"handle\": \"weight-management\",
  \"is_active\": true,
  \"is_internal\": false,
  \"parent_category_id\": \"$PEPTIDES_ID\"
}" | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Weight Management: $WEIGHT_ID"

GROWTH_ID=$(api POST /product-categories "{
  \"name\": \"Growth & Anti-Aging\",
  \"handle\": \"growth-anti-aging\",
  \"is_active\": true,
  \"is_internal\": false,
  \"parent_category_id\": \"$PEPTIDES_ID\"
}" | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Growth & Anti-Aging: $GROWTH_ID"

LONGEVITY_ID=$(api POST /product-categories "{
  \"name\": \"Longevity\",
  \"handle\": \"longevity\",
  \"is_active\": true,
  \"is_internal\": false,
  \"parent_category_id\": \"$PEPTIDES_ID\"
}" | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Longevity: $LONGEVITY_ID"

COSMETIC_ID=$(api POST /product-categories "{
  \"name\": \"Cosmetic\",
  \"handle\": \"cosmetic\",
  \"is_active\": true,
  \"is_internal\": false,
  \"parent_category_id\": \"$PEPTIDES_ID\"
}" | python3 -c "import sys,json; print(json.load(sys.stdin)['product_category']['id'])")
echo "  Cosmetic: $COSMETIC_ID"

echo -e "\n=== Linking sales channel to API key ==="
SC_ID=$(api GET /sales-channels | python3 -c "import sys,json; print(json.load(sys.stdin)['sales_channels'][0]['id'])")
# Link the "Storefront" publishable key to the sales channel
api POST "/api-keys/apk_01KQXXXMJK5SSAA65YHKZ5WF9V/sales-channels" "{\"add\":[\"$SC_ID\"]}" > /dev/null
echo "  Linked sales channel $SC_ID to Storefront API key"

echo -e "\n=== Creating products ==="

create_product() {
  local title=$1 handle=$2 category_id=$3 options_json=$4 variants_json=$5

  PROD_ID=$(api POST /products "{
    \"title\": \"$title\",
    \"handle\": \"$handle\",
    \"status\": \"published\",
    \"categories\": [{\"id\": \"$category_id\"}],
    \"sales_channels\": [{\"id\": \"$SC_ID\"}],
    \"options\": $options_json,
    \"variants\": $variants_json
  }" | python3 -c "import sys,json; print(json.load(sys.stdin)['product']['id'])")
  echo "  $title: $PROD_ID"
}

# Recovery products
create_product "BPC-157" "bpc-157" "$RECOVERY_ID" \
  '[{"title":"Size","values":["5mg","10mg"]}]' \
  '[{"title":"5mg","sku":"CL-BPC-0005","options":{"Size":"5mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":29.74}]},{"title":"10mg","sku":"CL-BPC-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":47.99}]}]'

create_product "TB-500" "tb-500" "$RECOVERY_ID" \
  '[{"title":"Size","values":["5mg","10mg"]}]' \
  '[{"title":"5mg","sku":"CL-TB5-0005","options":{"Size":"5mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":33.99}]},{"title":"10mg","sku":"CL-TB5-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":62.99}]}]'

create_product "GHK-Cu" "ghk-cu" "$RECOVERY_ID" \
  '[{"title":"Size","values":["50mg","100mg"]}]' \
  '[{"title":"50mg","sku":"CL-GHK-0050","options":{"Size":"50mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":35.99}]},{"title":"100mg","sku":"CL-GHK-0100","options":{"Size":"100mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":69.99}]}]'

create_product "Wolverine" "wolverine" "$RECOVERY_ID" \
  '[{"title":"Size","values":["5mg","10mg"]}]' \
  '[{"title":"5mg","sku":"CL-WLV-0005","options":{"Size":"5mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":62.99}]},{"title":"10mg","sku":"CL-WLV-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":89.99}]}]'

# Weight Management
create_product "CL-1S" "cl-1s" "$WEIGHT_ID" \
  '[{"title":"Size","values":["10mg","30mg"]}]' \
  '[{"title":"10mg","sku":"CL-GL1-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":69.99}]},{"title":"30mg","sku":"CL-GL1-0030","options":{"Size":"30mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":159.99}]}]'

create_product "CL-2T" "cl-2t" "$WEIGHT_ID" \
  '[{"title":"Size","values":["30mg"]}]' \
  '[{"title":"30mg","sku":"CL-GL2-0030","options":{"Size":"30mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":189.99}]}]'

create_product "CL-3R" "cl-3r" "$WEIGHT_ID" \
  '[{"title":"Size","values":["10mg","30mg"]}]' \
  '[{"title":"10mg","sku":"CL-GL3-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":79.99}]},{"title":"30mg","sku":"CL-GL3-0030","options":{"Size":"30mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":219.99}]}]'

# Growth & Anti-Aging
create_product "Ipamorelin" "ipamorelin" "$GROWTH_ID" \
  '[{"title":"Size","values":["5mg","10mg"]}]' \
  '[{"title":"5mg","sku":"CL-IPM-0005","options":{"Size":"5mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":34.99}]},{"title":"10mg","sku":"CL-IPM-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":54.99}]}]'

create_product "Tesamorelin" "tesamorelin" "$GROWTH_ID" \
  '[{"title":"Size","values":["10mg","20mg"]}]' \
  '[{"title":"10mg","sku":"CL-TES-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":69.99}]},{"title":"20mg","sku":"CL-TES-0020","options":{"Size":"20mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":119.99}]}]'

# Longevity
create_product "MOTS-C" "mots-c" "$LONGEVITY_ID" \
  '[{"title":"Size","values":["10mg","40mg"]}]' \
  '[{"title":"10mg","sku":"CL-MOT-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":44.99}]},{"title":"40mg","sku":"CL-MOT-0040","options":{"Size":"40mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":109.99}]}]'

create_product "SS-31" "ss-31" "$LONGEVITY_ID" \
  '[{"title":"Size","values":["10mg","50mg"]}]' \
  '[{"title":"10mg","sku":"CL-SS3-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":59.99}]},{"title":"50mg","sku":"CL-SS3-0050","options":{"Size":"50mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":199.99}]}]'

# Cosmetic
create_product "GLOW" "glow" "$COSMETIC_ID" \
  '[{"title":"Size","values":["70mg"]}]' \
  '[{"title":"70mg","sku":"CL-GLW-0070","options":{"Size":"70mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":89.99}]}]'

create_product "KLOW" "klow" "$COSMETIC_ID" \
  '[{"title":"Size","values":["80mg"]}]' \
  '[{"title":"80mg","sku":"CL-KLW-0080","options":{"Size":"80mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":119.99}]}]'

create_product "Melanotan 2" "melanotan-2" "$COSMETIC_ID" \
  '[{"title":"Size","values":["10mg"]}]' \
  '[{"title":"10mg","sku":"CL-MT2-0010","options":{"Size":"10mg"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":34.99}]}]'

# Supplies
create_product "Bac Water" "bac-water" "$SUPPLIES_ID" \
  '[{"title":"Size","values":["3mL","10mL"]}]' \
  '[{"title":"3mL","sku":"CL-BAC-0003","options":{"Size":"3mL"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":9.99}]},{"title":"10mL","sku":"CL-BAC-0010","options":{"Size":"10mL"},"manage_inventory":false,"prices":[{"currency_code":"usd","amount":14.99}]}]'

echo -e "\n=== Done! ==="
echo "Seeded 15 products, 2 regions, 7 categories, linked sales channel"
