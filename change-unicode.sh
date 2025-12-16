#!/bin/bash

# ============================================================================
# Script to fix line endings (CRLF -> LF) in all .sh files
# This fixes issues when working on Windows and pushing to Git
# 
# Usage: ./change-unicode.sh
# ============================================================================

set -e

echo "🔧 Fixing line endings in all .sh files..."
echo ""

# Configure Git to not auto-convert line endings for .sh files (if git is available)
if command -v git &> /dev/null && [ -d .git ]; then
    echo "⚙️  Configuring Git to preserve LF line endings for .sh files..."
    git config core.autocrlf false 2>/dev/null || true
    git config core.eol lf 2>/dev/null || true
    echo ""
fi

# Counters
FIXED_COUNT=0
TOTAL_COUNT=0
ERROR_COUNT=0

# Function to fix a single file - uses multiple methods to ensure it works
fix_file() {
    local file="$1"
    local temp_file="${file}.tmp.$$"
    local needs_fix=0
    
    # Check if file has CRLF line endings (check for \r)
    # Use multiple methods to detect CRLF
    if grep -q $'\r' "$file" 2>/dev/null || \
       file "$file" 2>/dev/null | grep -q "CRLF\|CR line terminators" || \
       od -c "$file" 2>/dev/null | grep -q "\\r" || \
       [ "$(tail -c 1 "$file" 2>/dev/null | od -An -tx1 | tr -d ' \n')" = "0d" ]; then
        needs_fix=1
    fi
    
    if [ $needs_fix -eq 1 ]; then
        echo "  🔧 Fixing: $file"
        
        # Method 1: Try dos2unix (best method if available)
        if command -v dos2unix &> /dev/null; then
            if dos2unix "$file" > /dev/null 2>&1; then
                FIXED_COUNT=$((FIXED_COUNT + 1))
                return 0
            fi
        fi
        
        # Method 2: Use sed (works in Git Bash on Windows)
        if command -v sed &> /dev/null; then
            # Try GNU sed (Linux/Git Bash) - no backup
            if sed -i 's/\r$//' "$file" 2>/dev/null; then
                FIXED_COUNT=$((FIXED_COUNT + 1))
                return 0
            fi
            # Try BSD sed (macOS) - with backup
            if sed -i.bak 's/\r$//' "$file" 2>/dev/null; then
                rm -f "${file}.bak" 2>/dev/null || true
                FIXED_COUNT=$((FIXED_COUNT + 1))
                return 0
            fi
        fi
        
        # Method 3: Use tr (universal fallback) - FORCE this method
        if tr -d '\r' < "$file" > "$temp_file" 2>/dev/null; then
            if [ -f "$temp_file" ] && [ -s "$temp_file" ]; then
                if mv "$temp_file" "$file" 2>/dev/null || \
                   (cp "$temp_file" "$file" 2>/dev/null && rm -f "$temp_file" 2>/dev/null); then
                    # Verify fix worked
                    if ! grep -q $'\r' "$file" 2>/dev/null; then
                        FIXED_COUNT=$((FIXED_COUNT + 1))
                        return 0
                    fi
                fi
            fi
            rm -f "$temp_file" 2>/dev/null || true
        fi
        
        # Method 4: Use awk as last resort
        if command -v awk &> /dev/null; then
            if awk 'BEGIN{RS="\r\n";ORS="\n"}{print}' "$file" > "$temp_file" 2>/dev/null; then
                if mv "$temp_file" "$file" 2>/dev/null; then
                    FIXED_COUNT=$((FIXED_COUNT + 1))
                    return 0
                fi
            fi
        fi
        
        echo "    ❌ ERROR: Could not fix $file"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    else
        echo "  ✓ Already correct: $file"
        return 0
    fi
}

# Find all .sh files in the project (excluding node_modules and .git)
# Use find with proper escaping to handle all cases
echo "📁 Searching for .sh files..."
echo ""

# Process files using find -exec for maximum compatibility
find . -type f -name "*.sh" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./.turbo/*" 2>/dev/null | sort | while IFS= read -r file; do
    if [ -f "$file" ]; then
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        fix_file "$file" || true
    fi
done

# Re-count because variables in while loop run in subshell
FIXED=0
TOTAL=0
ERRORS=0

for file in $(find . -type f -name "*.sh" ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./.turbo/*" 2>/dev/null | sort); do
    if [ -f "$file" ]; then
        TOTAL=$((TOTAL + 1))
        # Check with multiple methods
        if grep -q $'\r' "$file" 2>/dev/null || \
           file "$file" 2>/dev/null | grep -q "CRLF\|CR line terminators"; then
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

FIXED=$((TOTAL - ERRORS))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $TOTAL -eq 0 ]; then
    echo "❌ No .sh files found."
    exit 1
elif [ $ERRORS -gt 0 ]; then
    echo "⚠️  Summary:"
    echo "   - Total files: $TOTAL"
    echo "   - Fixed: $FIXED"
    echo "   - Still have CRLF: $ERRORS"
    echo ""
    echo "❌ Some files could not be fixed. Please check manually."
    exit 1
elif [ $FIXED -eq $TOTAL ]; then
    echo "✅ All $TOTAL .sh file(s) have correct line endings (LF)."
else
    echo "✅ Summary:"
    echo "   - Total files: $TOTAL"
    echo "   - Fixed: $FIXED"
    echo "   - Already correct: $((TOTAL - FIXED))"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Done!"
