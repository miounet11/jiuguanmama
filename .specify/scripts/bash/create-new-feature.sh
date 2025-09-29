#!/bin/bash

# create-new-feature.sh - Creates a new feature branch and spec file

set -e

# Function to sanitize branch name
sanitize_branch_name() {
    echo "$1" | sed 's/[^a-zA-Z0-9\-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | tr '[:upper:]' '[:lower:]'
}

# Function to generate spec file name
generate_spec_name() {
    echo "$1" | sed 's/[^a-zA-Z0-9\-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | tr '[:upper:]' '[:lower:]'
}

# Parse arguments
JSON_OUTPUT=false
FEATURE_DESCRIPTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            FEATURE_DESCRIPTION="$1"
            shift
            ;;
    esac
done

if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Error: Feature description is required"
    exit 1
fi

# Generate branch and file names
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="feature/doc-cleanup-v2-prep-$TIMESTAMP"
SPEC_NAME="doc-cleanup-v2-preparation"
SPEC_FILE="$(pwd)/.specify/specs/${SPEC_NAME}.md"

# Create specs directory if it doesn't exist
mkdir -p "$(dirname "$SPEC_FILE")"

# Create and checkout new branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || echo "Branch may already exist, continuing..."

# Create initial spec file
cat > "$SPEC_FILE" << 'EOF'
# Documentation Cleanup and V2 Preparation

*This file was auto-generated and needs to be completed*

## Feature Description

[TO BE FILLED]

## Requirements

[TO BE FILLED]

## Technical Design

[TO BE FILLED]

## Implementation Plan

[TO BE FILLED]
EOF

if [ "$JSON_OUTPUT" = true ]; then
    cat << EOF
{
  "BRANCH_NAME": "$BRANCH_NAME",
  "SPEC_FILE": "$SPEC_FILE",
  "status": "created"
}
EOF
else
    echo "Created branch: $BRANCH_NAME"
    echo "Created spec file: $SPEC_FILE"
fi