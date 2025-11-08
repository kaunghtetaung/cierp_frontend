#!/bin/bash

echo "🚀 Starting NRC Component Migration..."
echo ""

# Create backup directory
BACKUP_DIR="nrc-backups-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backups..."
cp libs/schema-forms/NrcField.tsx "$BACKUP_DIR/NrcField.tsx.backup"
cp apps/publicWeb/src/app/\(register\)/profileSetup/student/components/PublicNrcField.tsx "$BACKUP_DIR/PublicNrcField.tsx.backup" 2>/dev/null || echo "  ⚠️  PublicNrcField.tsx not found"
cp apps/publicWeb/src/app/\(register\)/profileSetup/student/components/CompactNrcField.tsx "$BACKUP_DIR/CompactNrcField.tsx.backup" 2>/dev/null || echo "  ⚠️  CompactNrcField.tsx not found"

echo "✅ Backups created in: $BACKUP_DIR"
echo ""

echo "📝 Migration Summary:"
echo "  - Core NrcField: Manual update required (complex component)"
echo "  - PublicNrcField: Manual update required"
echo "  - CompactNrcField: Manual update required"
echo ""
echo "📚 Please follow: NRC_COMPONENT_UPDATE_GUIDE.md"
echo ""
echo "Key changes needed:"
echo "  1. Replace: import nrcData from '...' → import { useNrcStates, ... } from '@repo/nrc-hooks'"
echo "  2. Add hooks: const { states } = useNrcStates()"
echo "  3. Remove: static data filtering and local state"
echo "  4. Update: dropdowns to use hook data"
echo ""
echo "✅ Backups complete. Ready for manual migration."
