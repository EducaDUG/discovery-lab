#!/usr/bin/env bash
# Publish the committed state of discovery-lab to https://morehumaned.com/discovery-lab/
# by copying it into EducaDUG/morehumaned-site and pushing straight to main.
# Run AFTER committing/pushing discovery-lab. Uses a short path (C:/dlmh2) because of
# Windows long-path limits. Standing authorization from Diego (2026-10-19): no PR, no merge click.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST=/c/dlmh2
if [ ! -d "$DEST/.git" ]; then (cd /c && gh repo clone EducaDUG/morehumaned-site dlmh2 -- -q); fi
cd "$DEST"
git config core.longpaths true; git config core.autocrlf false
git checkout -q main; git pull -q --ff-only
git rm -r -q --ignore-unmatch discovery-lab
mkdir -p discovery-lab
(cd "$SRC" && git archive HEAD) | tar -x -C discovery-lab
( cd discovery-lab
  git rm -r -q --cached --ignore-unmatch .claude docs/policy robots.txt sitemap.xml .nojekyll 2>/dev/null || true
  rm -rf .claude docs/policy; rm -f robots.txt sitemap.xml .nojekyll
  grep -rlI "educadug.github.io/discovery-lab" . | xargs -r sed -i 's#educadug.github.io/discovery-lab#morehumaned.com/discovery-lab#g' )
git add -A 2>&1 | grep -v '^warning' || true
if git diff --cached --quiet; then echo "morehumaned.com already up to date"; exit 0; fi
SHA=$(cd "$SRC" && git rev-parse --short HEAD)
git -c user.name="Diego Urrutia Guevara" -c user.email=duguevara@gmail.com commit -q -m "Sync Discovery Lab @ $SHA

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q origin main
echo "Published Discovery Lab @ $SHA to morehumaned.com/discovery-lab/"
