#!/usr/bin/env bash
# Builds the ready-to-upload package for MilesWeb ("Setup Node.js App", startup file server.js).
# Usage: bash scripts/package-milesweb.sh [output-folder]   (default: ./deploy-out)
# The package never contains .env files or secrets: those are set in cPanel's Node.js app settings.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-deploy-out}"
APP="$OUT/vercenji-app"

# SITE_URL is built into page metadata (share links, canonical URLs), so it must be the live address.
SITE_URL="${SITE_URL:-https://vercenji.com}" NODE_ENV=production npm run build
rm -rf "$APP" && mkdir -p "$APP"
cp -rL .next/standalone/. "$APP/"          # -L: copy real files instead of symlinks (File Manager cannot extract symlinks)
cp -r public "$APP/public"
mkdir -p "$APP/.next" && cp -r .next/static "$APP/.next/static"
find "$APP" -maxdepth 1 -name ".env*" -delete

# Staff account tool, bundled so it runs with plain `node` on the server.
mkdir -p "$APP/tools"
npx esbuild scripts/create-staff.ts --bundle --platform=node --target=node22 --format=esm \
  --outfile="$APP/tools/create-staff.mjs" \
  --banner:js="import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" \
  --log-level=error

# A package.json with no dependencies, so "Run NPM Install" in cPanel has nothing to break.
cat > "$APP/package.json" <<'EOF'
{
  "name": "vercenji-health",
  "version": "1.0.0",
  "private": true,
  "description": "Vercenji Health website, ready-built. Do not run npm install: everything it needs is already in this folder.",
  "scripts": { "start": "node server.js" },
  "engines": { "node": ">=22" }
}
EOF

# Database schema, applied in order through phpMyAdmin.
mkdir -p "$OUT/database"
for d in prisma/migrations/*/; do cp "$d/migration.sql" "$OUT/database/$(basename "$d").sql"; done

(cd "$APP" && rm -f ../vercenji-app.zip && zip -qr ../vercenji-app.zip .)
echo "Package: $OUT/vercenji-app.zip ($(du -h "$OUT/vercenji-app.zip" | cut -f1))"
