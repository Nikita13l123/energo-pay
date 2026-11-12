#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd "$(dirname "$0")/.." && pwd)
output_path=${1:?Usage: package-release.sh /absolute/path/energo-pay-demo.tar.gz}
staging_dir=$(mktemp -d)
trap 'rm -rf "$staging_dir"' EXIT

cd "$project_dir"
test -f target/electricity-billing-0.0.1-SNAPSHOT.jar
test -f frontend/dist/index.html
mkdir -p "$staging_dir/energo-pay-demo/"{backend,web,source}
cp target/electricity-billing-0.0.1-SNAPSHOT.jar "$staging_dir/energo-pay-demo/backend/app.jar"
cp deploy/Dockerfile.backend "$staging_dir/energo-pay-demo/backend/Dockerfile"
cp deploy/Dockerfile.web "$staging_dir/energo-pay-demo/web/Dockerfile"
cp frontend/nginx.conf "$staging_dir/energo-pay-demo/web/nginx.conf"
cp -R frontend/dist "$staging_dir/energo-pay-demo/web/dist"
sed 's#build: \.$#build: ./backend#; s#build: ./frontend$#build: ./web#' compose.yaml > "$staging_dir/energo-pay-demo/compose.yaml"
git archive HEAD | tar -x -C "$staging_dir/energo-pay-demo/source"
tar -czf "$output_path" -C "$staging_dir" energo-pay-demo
