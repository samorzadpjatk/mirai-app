#!/bin/bash

# Script to fix line endings (CRLF -> LF) in all .sh files
# This fixes issues when working on Windows and pushing to Git
# Usage: ./change-unicode.sh

set -e

echo "🔧 Fixing line endings in all .sh files..."

# Find all .sh files in the project
SH_FILES=$(find . -type f -name "*.sh" ! -path "./node_modules/*" ! -path "./.git/*")

if [ -z "$SH_FILES" ]; then
    echo "❌ No .sh files found."
    exit 1
fi

# Counter for fixed files
FIXED_COUNT=0

# Process each .sh file
while IFS= read -r file; do
    if [ -f "$file" ]; then
        # Check if file has CRLF line endings
        if file "$file" | grep -q "CRLF\|CR line terminators"; then
            echo "  Fixing: $file"
            # Convert CRLF to LF using dos2unix if available, otherwise use sed
            if command -v dos2unix &> /dev/null; then
                dos2unix "$file" > /dev/null 2>&1
            elif command -v sed &> /dev/null; then
                sed -i 's/\r$//' "$file"
            else
                # Fallback: use tr to remove carriage returns
                tr -d '\r' < "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            fi
            ((FIXED_COUNT++))
        else
            echo "  ✓ Already correct: $file"
        fi
    fi
done <<< "$SH_FILES"

if [ $FIXED_COUNT -eq 0 ]; then
    echo "✅ All .sh files already have correct line endings (LF)."
else
    echo "✅ Fixed $FIXED_COUNT file(s)."
fi

echo "🎉 Done!"

