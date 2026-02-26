# WhatsLog - WhatsApp-to-Sheets Automation

Chrome extension for exporting WhatsApp Web conversations to Google Sheets/Excel/CSV.

## MVP Features (Week 1-2)

### Week 1: Core Extension
1. **Chrome Extension Setup**
   - manifest.json with content script permissions
   - Inject script into web.whatsapp.com
   - UI panel in WhatsApp Web sidebar

2. **Message Extraction**
   - Parse WhatsApp Web DOM
   - Extract messages, timestamps, sender names
   - Handle group chats and individual chats
   - Support media detection (images, documents)

3. **Export Functionality**
   - Export to CSV (immediate)
   - Export to Google Sheets (OAuth + API)
   - Filter by date range
   - Select specific contacts

### Week 2: Polish & Integration
4. **Data Processing**
   - Auto-categorize by contact
   - Extract key info (dates, amounts, action items)
   - Simple AI summary (optional)

5. **UI/UX**
   - Clean export button in WhatsApp Web
   - Progress indicator
   - Settings panel

## Tech Stack
- Chrome Extension (Manifest V3)
- JavaScript/TypeScript
- Google Sheets API
- No backend needed initially

## Target Users
- Personal trainers (track client progress)
- Freelancers (client communication logs)
- Small service businesses (appointment tracking)

## Pricing Model
- **Free:** 50 messages/month
- **Pro:** $29 one-time or $5/month unlimited

## Deliverables
- Working Chrome extension
- Google Sheets integration
- Landing page
- Chrome Web Store ready

## Project Structure
```
whatslog/
├── manifest.json          # Extension manifest (V3)
├── content.js             # Content script for WhatsApp Web
├── background.js          # Service worker
├── popup.html             # Extension popup
├── popup.js               # Popup logic
├── options.html           # Settings page
├── options.js             # Settings logic
├── styles.css             # UI styles
├── lib/
│   ├── messageExtractor.js    # DOM parsing logic
│   ├── csvExporter.js         # CSV export
│   ├── sheetsExporter.js      # Google Sheets API
│   └── storage.js             # Chrome storage wrapper
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development Status
- [ ] Day 1: Project setup, manifest.json, basic structure
- [ ] Day 2: Message extraction from WhatsApp Web DOM
- [ ] Day 3: CSV export functionality
- [ ] Day 4: Google Sheets OAuth integration
- [ ] Day 5: UI panel in WhatsApp Web sidebar
- [ ] Day 6-7: Testing and bug fixes
- [ ] Week 2: Polish, beta testing, landing page
