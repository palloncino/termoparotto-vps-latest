#!/bin/bash
# Apply a simpler, flatter UI style to ReportDetails component

FILE="/var/www/termoparotto/client/src/components/reports/ReportDetails.tsx"

# Simple sed replacements to remove shadows and gradients
sed -i 's/shadow-lg/border/g' "$FILE"
sed -i 's/shadow-xl/border/g' "$FILE"
sed -i 's/hover:shadow-md//g' "$FILE"
sed -i 's/bg-gradient-to-br from-gray-900 to-gray-800/bg-gray-100/g' "$FILE"
sed -i 's/bg-gradient-to-r from-gray-50 to-gray-100/bg-gray-50/g' "$FILE"
sed -i 's/bg-gradient-to-br from-white to-gray-50/bg-white/g' "$FILE"
sed -i 's/group-hover:scale-110 transition-transform duration-300//g' "$FILE"
sed -i 's/group-hover:scale-105 transform duration-200//g' "$FILE"
sed -i 's/rounded-xl/rounded-lg/g' "$FILE"
sed -i 's/text-2xl font-bold/text-lg font-semibold/g' "$FILE"
sed -i 's/p-8/p-6/g' "$FILE"

echo "✓ Applied flatter UI to ReportDetails"

