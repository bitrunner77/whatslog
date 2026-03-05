# WhatsLog - Screenshot & Promo Image Capture Guide

This guide explains how to capture screenshots and promotional images from the HTML mockups for Chrome Web Store submission.

## 📸 Screenshots Required (1280x800 or 640x400)

Chrome Web Store requires at least 1 screenshot. We recommend 3-5 screenshots.

### Screenshot Files to Create:

1. **screenshot-1-whatsapp-panel.png** (1280x800)
   - Open: `screenshot-mockup-whatsapp.html`
   - Shows: WhatsApp Web with WhatsLog sidebar panel

2. **screenshot-2-popup.png** (1280x800)
   - Open: `screenshot-mockup-popup.html`
   - Shows: Extension popup with different states

3. **screenshot-3-settings.png** (1280x800)
   - Open: `screenshot-mockup-settings.html`
   - Shows: Settings/options page

## 🎨 Promotional Images (Optional but Recommended)

### Promotional Image Files to Create:

1. **promo-small-tile.png** (440x280)
   - Open: `promo-small-tile.html`
   - Used in: Chrome Web Store listing

2. **promo-large-tile.png** (920x680)
   - Open: `promo-large-tile.html`
   - Used in: Chrome Web Store featured sections

3. **promo-marquee.png** (1400x560)
   - Open: `promo-marquee.html`
   - Used in: Chrome Web Store homepage marquee

## 🛠️ How to Capture

### Option 1: Browser DevTools (Recommended)

1. Open the HTML file in Chrome
2. Open DevTools (F12)
3. Click the "Toggle device toolbar" icon (or press Ctrl+Shift+M)
4. Set custom dimensions:
   - For screenshots: 1280 x 800
   - For small tile: 440 x 280
   - For large tile: 920 x 680
   - For marquee: 1400 x 560
5. Use browser zoom to ensure the content fits properly
6. Screenshot using:
   - Windows: Win+Shift+S or Snipping Tool
   - Mac: Cmd+Shift+4
   - Or use DevTools: Ctrl+Shift+P → "Capture full size screenshot"

### Option 2: Online Screenshot Tools

Use these websites to capture at exact dimensions:
- https://html2canvas.hertzen.com/
- https://www.screenshotmachine.com/

### Option 3: Playwright/Selenium (Automated)

```bash
# Install playwright
npm install -g playwright

# Use browser to capture
npx playwright open screenshot-mockup-whatsapp.html
```

## ✅ Checklist Before Submitting

- [ ] Screenshot 1: 1280x800 PNG format
- [ ] Screenshot 2: 1280x800 PNG format
- [ ] Screenshot 3: 1280x800 PNG format
- [ ] Promo Small Tile: 440x280 PNG format (optional)
- [ ] Promo Large Tile: 920x680 PNG format (optional)
- [ ] Promo Marquee: 1400x560 PNG format (optional)

## 📁 File Naming Convention

Use these exact filenames for consistency:

```
screenshots/
├── screenshot-1-main.png
├── screenshot-2-popup.png
├── screenshot-3-settings.png
└── screenshot-4-export.png

promo/
├── small-tile.png (440x280)
├── large-tile.png (920x680)
└── marquee.png (1400x560)
```

## 🚀 Quick Start

1. Open each HTML file in Chrome
2. Resize browser window to match target dimensions
3. Use browser zoom (Ctrl++, Ctrl+-) if needed
4. Take screenshot at exact dimensions
5. Save as PNG with filenames above
6. Move to store-assets/ folder
