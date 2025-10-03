#!/bin/bash

# create-new-feature.sh
# Creates a new feature branch and initializes the spec file

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Parse arguments
JSON_MODE=false
FEATURE_DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_MODE=true
      shift
      ;;
    *)
      FEATURE_DESC="$1"
      shift
      ;;
  esac
done

if [ -z "$FEATURE_DESC" ]; then
  echo "Error: Feature description required" >&2
  exit 1
fi

# Generate feature slug from description
# Extract key concepts and create a readable slug
FEATURE_SLUG=$(echo "$FEATURE_DESC" |
  sed 's/[^a-zA-Z0-9\u4e00-\u9fa5 ]//g' |
  head -c 100 |
  sed 's/ /-/g' |
  tr '[:upper:]' '[:lower:]' |
  sed 's/^-*//' |
  sed 's/-*$//')

# If slug is empty or too short, use timestamp
if [ -z "$FEATURE_SLUG" ] || [ ${#FEATURE_SLUG} -lt 5 ]; then
  FEATURE_SLUG="feature-$(date +%Y%m%d-%H%M%S)"
else
  # Limit slug length and add timestamp for uniqueness
  FEATURE_SLUG=$(echo "$FEATURE_SLUG" | head -c 50)
  FEATURE_SLUG="${FEATURE_SLUG}-$(date +%Y%m%d)"
fi

BRANCH_NAME="feature/$FEATURE_SLUG"
SPEC_FILE="$REPO_ROOT/.specify/features/$FEATURE_SLUG/spec.md"

# Create feature directory
mkdir -p "$REPO_ROOT/.specify/features/$FEATURE_SLUG"

# Create and checkout branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Initialize spec file with basic structure
cat > "$SPEC_FILE" << 'EOF'
# Feature Specification

**Status**: Draft
**Created**: PLACEHOLDER_DATE
**Last Updated**: PLACEHOLDER_DATE

## Overview

PLACEHOLDER_DESCRIPTION

---

*This specification was initialized by create-new-feature.sh*
EOF

# Replace placeholders
CURRENT_DATE=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
sed -i.bak "s/PLACEHOLDER_DATE/$CURRENT_DATE/g" "$SPEC_FILE"
sed -i.bak "s/PLACEHOLDER_DESCRIPTION/$FEATURE_DESC/g" "$SPEC_FILE"
rm -f "$SPEC_FILE.bak"

# Output results
if [ "$JSON_MODE" = true ]; then
  cat << EOF
{
  "BRANCH_NAME": "$BRANCH_NAME",
  "SPEC_FILE": "$SPEC_FILE",
  "FEATURE_SLUG": "$FEATURE_SLUG",
  "FEATURE_DIR": "$REPO_ROOT/.specify/features/$FEATURE_SLUG"
}
EOF
else
  echo "✓ Created branch: $BRANCH_NAME"
  echo "✓ Initialized spec: $SPEC_FILE"
  echo "✓ Feature directory: $REPO_ROOT/.specify/features/$FEATURE_SLUG"
fi