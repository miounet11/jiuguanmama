#!/bin/bash

# setup-plan.sh
# Sets up the planning environment and returns feature paths

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Parse arguments
JSON_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_MODE=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Extract feature slug from branch name
if [[ "$CURRENT_BRANCH" =~ ^feature/(.+)$ ]]; then
  FEATURE_SLUG="${BASH_REMATCH[1]}"
else
  echo "Error: Not on a feature branch. Current branch: $CURRENT_BRANCH" >&2
  exit 1
fi

# Define paths
SPECS_DIR="$REPO_ROOT/.specify/features/$FEATURE_SLUG"
FEATURE_SPEC="$SPECS_DIR/spec.md"
IMPL_PLAN="$SPECS_DIR/plan.md"

# Verify spec file exists
if [ ! -f "$FEATURE_SPEC" ]; then
  echo "Error: Feature spec not found at $FEATURE_SPEC" >&2
  exit 1
fi

# Create implementation directory if it doesn't exist
mkdir -p "$SPECS_DIR/implementation"

# Output results
if [ "$JSON_MODE" = true ]; then
  cat << EOF
{
  "FEATURE_SPEC": "$FEATURE_SPEC",
  "IMPL_PLAN": "$IMPL_PLAN",
  "SPECS_DIR": "$SPECS_DIR",
  "BRANCH": "$CURRENT_BRANCH",
  "FEATURE_SLUG": "$FEATURE_SLUG"
}
EOF
else
  echo "✓ Feature spec: $FEATURE_SPEC"
  echo "✓ Implementation plan: $IMPL_PLAN"
  echo "✓ Specs directory: $SPECS_DIR"
  echo "✓ Branch: $CURRENT_BRANCH"
fi