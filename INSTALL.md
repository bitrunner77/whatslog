# WhatsLog Extension - Installation Guide

## Quick Start

1. **Download the extension files** to a folder on your computer

2. **Open Chrome Extensions page:**
   - Go to `chrome://extensions/`
   - Or click menu → More tools → Extensions

3. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in top right corner

4. **Load the extension:**
   - Click "Load unpacked"
   - Select the `whatslog` folder

5. **Verify installation:**
   - You should see WhatsLog icon in your Chrome toolbar
   - Pin it for easy access

## Usage

1. **Open WhatsApp Web** (https://web.whatsapp.com)
2. **Open any chat** you want to export
3. **Click the WhatsLog icon** (📊) in the chat header or Chrome toolbar
4. **Click "Extract Messages"** to scan the conversation
5. **Export to CSV** or **Google Sheets**

## Google Sheets Setup

1. Click "Connect Google Account" in the popup or settings
2. Sign in with your Google account
3. Grant permission to create spreadsheets
4. You're ready to export!

## Troubleshooting

### Extension not showing in WhatsApp Web
- Refresh the WhatsApp Web page
- Check that extension is enabled in chrome://extensions
- Try reloading the extension

### Messages not extracting
- Make sure you're in an active chat
- Scroll up to load older messages first
- Try clicking "Extract Messages" again

### Google Sheets export failing
- Ensure you're authenticated (check settings)
- Try disconnecting and reconnecting Google account
- Check that you have internet connection

## File Structure
```
whatslog/
├── manifest.json      # Extension configuration
├── content.js         # WhatsApp Web integration
├── background.js      # Background service worker
├── popup.html/js      # Extension popup UI
├── options.html/js    # Settings page
├── styles.css         # UI styles
└── icons/             # Extension icons (create these)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Next Steps

- Create icon images (16x16, 48x48, 128x128 PNG)
- Test with real WhatsApp conversations
- Package for Chrome Web Store
