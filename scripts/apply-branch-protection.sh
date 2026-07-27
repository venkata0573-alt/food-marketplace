#!/usr/bin/env bash
set -euo pipefail

# Applies branch protection for `main` via GitHub API.
# Requires: gh auth login, remote origin pointing at GitHub.

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="main"

gh api \
  -X PUT \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='Secret scan (gitleaks)' \
  -f required_status_checks.contexts[]='Lint, typecheck, test' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f restrictions=null \
  -f required_linear_history=true \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -F block_creations=false

echo "Branch protection applied for ${REPO}:${BRANCH}"
