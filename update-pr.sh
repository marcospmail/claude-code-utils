#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting PR update process..."

# Configuration
FORK_REPO="git@github.com:marcospmail/raycast-extensions.git"
BRANCH="ext/claude-code-utils"
TEMP_DIR="/tmp/raycast-fork-lite-$$"  # $$ adds process ID for uniqueness
SOURCE_DIR="$(pwd)"
SYNC_MARKER="$SOURCE_DIR/.last-pr-sync"

# Step 1: Minimal clone with partial clone + sparse checkout
echo "📦 Cloning fork (minimal, using partial clone)..."
git clone --depth 1 \
  --filter=blob:none \
  --sparse \
  --branch "$BRANCH" \
  --single-branch \
  "$FORK_REPO" "$TEMP_DIR"

cd "$TEMP_DIR"
echo "📂 Setting up sparse checkout for extension directory only..."
git sparse-checkout set extensions/claude-code-utils

# Step 2: Copy changes to the fork
echo "📋 Copying files from $SOURCE_DIR to fork..."
rsync -av \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'update-pr.sh' \
  --exclude '.last-pr-sync' \
  --exclude 'coverage' \
  --exclude '.DS_Store' \
  "$SOURCE_DIR/" \
  "$TEMP_DIR/extensions/claude-code-utils/"

# Also remove any accidentally copied files
rm -f "$TEMP_DIR/extensions/claude-code-utils/update-pr.sh"
rm -f "$TEMP_DIR/extensions/claude-code-utils/.last-pr-sync"

# Step 3: Commit and push (already in TEMP_DIR)

echo "🔍 Checking for changes..."
if [[ -z $(git status --porcelain) ]]; then
  echo "✅ No changes to commit. PR is already up to date!"
  cd /tmp
  rm -rf "$TEMP_DIR"
  exit 0
fi

echo "📝 Staging changes..."
git add .

# Get new commit messages from source repository (all commits not yet synced)
cd "$SOURCE_DIR"

if [[ -f "$SYNC_MARKER" ]]; then
  LAST_SYNCED=$(cat "$SYNC_MARKER")
  echo "🔍 Getting commits since last sync ($LAST_SYNCED)..."
  NEW_COMMITS=$(git log --format="%s" "$LAST_SYNCED"..HEAD)
  COMMIT_COUNT=$(git rev-list --count "$LAST_SYNCED"..HEAD)
else
  echo "🔍 No sync marker found, getting recent commits..."
  NEW_COMMITS=$(git log --format="%s" -10)
  COMMIT_COUNT=$(echo "$NEW_COMMITS" | wc -l | tr -d ' ')
fi

# Get current HEAD to save after successful push
CURRENT_HEAD=$(git rev-parse HEAD)

cd "$TEMP_DIR"

# Build squashed commit message
if [[ -n "$NEW_COMMITS" ]] && [[ $COMMIT_COUNT -gt 0 ]]; then
  FIRST_COMMIT=$(echo "$NEW_COMMITS" | tail -1)  # Oldest commit (chronological order)
  echo ""
  echo "📦 Squashing $COMMIT_COUNT commit(s) into one:"
  echo "$NEW_COMMITS" | tac | sed 's/^/  - /'  # Reverse to show chronological order
  echo ""

  # Create commit message with body listing all commits
  if [[ $COMMIT_COUNT -gt 1 ]]; then
    COMMIT_BODY=$(echo "$NEW_COMMITS" | head -n -1 | tac | sed 's/^/- /')
    git commit -m "$FIRST_COMMIT" -m "$COMMIT_BODY"
  else
    git commit -m "$FIRST_COMMIT"
  fi

  echo "✍️  Commit created with title: $FIRST_COMMIT"
else
  COMMIT_MSG="docs: update extension files"
  git commit -m "$COMMIT_MSG"
  echo "✍️  Using default commit message: $COMMIT_MSG"
fi

echo "⬆️  Pushing to $BRANCH..."
git push origin "$BRANCH"

# Save current HEAD as last synced commit
echo "💾 Saving sync marker..."
echo "$CURRENT_HEAD" > "$SYNC_MARKER"

# Step 4: Clean up
echo "🧹 Cleaning up temporary files..."
cd /tmp
rm -rf "$TEMP_DIR"

echo "✅ PR updated successfully!"
echo "🔗 View PR: https://github.com/raycast/extensions/pull/22162"
