#!/bin/bash

# check-prerequisites.sh
# Checks for available design documents and returns paths

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
FEATURE_DIR="$REPO_ROOT/.specify/features/$FEATURE_SLUG"

# Check for available documents
AVAILABLE_DOCS=()

if [ -f "$FEATURE_DIR/spec.md" ]; then
  AVAILABLE_DOCS+=("$FEATURE_DIR/spec.md")
fi

if [ -f "$FEATURE_DIR/plan.md" ]; then
  AVAILABLE_DOCS+=("$FEATURE_DIR/plan.md")
fi

if [ -f "$FEATURE_DIR/data-model.md" ]; then
  AVAILABLE_DOCS+=("$FEATURE_DIR/data-model.md")
fi

if [ -f "$FEATURE_DIR/research.md" ]; then
  AVAILABLE_DOCS+=("$FEATURE_DIR/research.md")
fi

if [ -f "$FEATURE_DIR/quickstart.md" ]; then
  AVAILABLE_DOCS+=("$FEATURE_DIR/quickstart.md")
fi

if [ -d "$FEATURE_DIR/contracts" ]; then
  for contract in "$FEATURE_DIR/contracts"/*.md; do
    if [ -f "$contract" ]; then
      AVAILABLE_DOCS+=("$contract")
    fi
  done
fi

# Output results
if [ "$JSON_MODE" = true ]; then
  # Build JSON array
  DOCS_JSON="["
  FIRST=true
  for doc in "${AVAILABLE_DOCS[@]}"; do
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      DOCS_JSON+=","
    fi
    DOCS_JSON+="\"$doc\""
  done
  DOCS_JSON+="]"

  cat << EOF
{
  "FEATURE_DIR": "$FEATURE_DIR",
  "AVAILABLE_DOCS": $DOCS_JSON,
  "FEATURE_SLUG": "$FEATURE_SLUG",
  "BRANCH": "$CURRENT_BRANCH"
}
EOF
else
  echo "✓ Feature directory: $FEATURE_DIR"
  echo "✓ Available documents:"
  for doc in "${AVAILABLE_DOCS[@]}"; do
    echo "  - $doc"
  done
fi
