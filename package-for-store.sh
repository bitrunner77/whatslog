#!/bin/bash
# Package WhatsLog for Chrome Web Store

echo "=== Packaging WhatsLog for Chrome Web Store ==="
echo ""

cd /root/.openclaw/workspace/whatslog

# Remove development files
rm -rf icons/venv
rm -f .gitignore

# Create zip file
zip -r ../whatslog-chrome-extension.zip . -x "*.git*" "icons/README.md" "DEV_NOTES.md" "*.sh"

echo ""
echo "✅ Package created: whatslog-chrome-extension.zip"
echo ""
echo "Next steps:"
echo "1. Create icon files (16x16, 48x48, 128x128 PNG)"
echo "2. Go to https://chrome.google.com/webstore/devconsole"
echo "3. Upload the zip file"
echo "4. Fill in store listing details"
echo "5. Submit for review"
echo ""
echo "Pricing:"
echo "- Free: 50 messages/month"
echo "- Pro: $29 one-time or $5/month unlimited"
