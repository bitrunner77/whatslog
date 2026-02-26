/**
 * WhatsLog - Background Service Worker
 * Handles Google Sheets API, storage, and cross-tab communication
 */

// Google Sheets API configuration
const GOOGLE_SHEETS_API = {
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets'
};

// Extension state
let extensionState = {
  isAuthenticated: false,
  token: null
};

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[WhatsLog] Extension installed:', details.reason);
  
  // Set default settings
  chrome.storage.local.set({
    settings: {
      defaultExportFormat: 'csv',
      autoExtract: false,
      maxMessagesPerExport: 1000,
      includeMedia: true
    },
    stats: {
      totalExports: 0,
      lastExportDate: null,
      messagesExported: 0
    }
  });
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[WhatsLog] Message received:', request.action);

  switch (request.action) {
    case 'exportToSheets':
      handleSheetsExport(request.data)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async

    case 'authenticate':
      authenticateWithGoogle()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'checkAuth':
      checkAuthentication()
        .then(result => sendResponse({ success: true, authenticated: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getSettings':
      chrome.storage.local.get('settings', (data) => {
        sendResponse({ success: true, settings: data.settings });
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'getStats':
      chrome.storage.local.get('stats', (data) => {
        sendResponse({ success: true, stats: data.stats });
      });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * Authenticate with Google OAuth
 */
async function authenticateWithGoogle() {
  try {
    const token = await chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: [GOOGLE_SHEETS_API.SCOPES]
    });
    
    extensionState.token = token;
    extensionState.isAuthenticated = true;
    
    return { token };
  } catch (error) {
    console.error('[WhatsLog] Authentication failed:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication() {
  try {
    const token = await chrome.identity.getAuthToken({ 
      interactive: false,
      scopes: [GOOGLE_SHEETS_API.SCOPES]
    });
    
    extensionState.token = token;
    extensionState.isAuthenticated = !!token;
    
    return extensionState.isAuthenticated;
  } catch (error) {
    extensionState.isAuthenticated = false;
    return false;
  }
}

/**
 * Export messages to Google Sheets
 */
async function handleSheetsExport(data) {
  const { chatName, messages } = data;
  
  // Ensure authenticated
  if (!extensionState.isAuthenticated) {
    await authenticateWithGoogle();
  }

  try {
    // Create new spreadsheet
    const spreadsheet = await createSpreadsheet(chatName);
    
    // Prepare data for sheet
    const sheetData = prepareSheetData(chatName, messages);
    
    // Write data to sheet
    await writeToSheet(spreadsheet.spreadsheetId, sheetData);
    
    // Update stats
    await updateExportStats(messages.length);
    
    return {
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl
    };
  } catch (error) {
    console.error('[WhatsLog] Sheets export failed:', error);
    throw error;
  }
}

/**
 * Create a new Google Spreadsheet
 */
async function createSpreadsheet(chatName) {
  const token = extensionState.token;
  const sanitizedName = `WhatsLog - ${chatName}`.substring(0, 100);
  
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sanitizedName,
        locale: 'en_US',
        timeZone: 'America/New_York'
      },
      sheets: [{
        properties: {
          title: 'Messages',
          gridProperties: {
            rowCount: 1000,
            columnCount: 10
          }
        }
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create spreadsheet');
  }

  return await response.json();
}

/**
 * Prepare data array for Google Sheets
 */
function prepareSheetData(chatName, messages) {
  const headers = ['Date', 'Time', 'Sender', 'Message', 'Type', 'Outgoing'];
  
  const rows = messages.map(msg => {
    const timestamp = parseTimestamp(msg.timestamp);
    return [
      timestamp.date,
      timestamp.time,
      msg.sender,
      msg.text,
      msg.mediaType,
      msg.isOutgoing ? 'Yes' : 'No'
    ];
  });

  return [headers, ...rows];
}

/**
 * Parse WhatsApp timestamp into date/time
 */
function parseTimestamp(timestamp) {
  // WhatsApp timestamps can be in various formats
  // "10:30 AM", "Yesterday", "Monday", "01/15/2024"
  
  const now = new Date();
  let date = '';
  let time = timestamp || '';

  if (timestamp.includes('Yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toLocaleDateString();
    time = timestamp.replace('Yesterday, ', '');
  } else if (timestamp.includes('Today')) {
    date = now.toLocaleDateString();
    time = timestamp.replace('Today, ', '');
  } else if (timestamp.includes(':')) {
    // Assume it's just a time, use today's date
    date = now.toLocaleDateString();
  } else {
    // Try to parse as full date
    const parsed = new Date(timestamp);
    if (!isNaN(parsed)) {
      date = parsed.toLocaleDateString();
      time = parsed.toLocaleTimeString();
    }
  }

  return { date, time };
}

/**
 * Write data to Google Sheet
 */
async function writeToSheet(spreadsheetId, data) {
  const token = extensionState.token;
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Messages!A1:F${data.length}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: data
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to write to spreadsheet');
  }

  // Format header row
  await formatHeaderRow(spreadsheetId);

  return await response.json();
}

/**
 * Format the header row in the spreadsheet
 */
async function formatHeaderRow(spreadsheetId) {
  const token = extensionState.token;
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 }
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        }]
      })
    }
  );

  return response.ok;
}

/**
 * Update export statistics
 */
async function updateExportStats(messageCount) {
  const { stats } = await chrome.storage.local.get('stats');
  
  const updatedStats = {
    totalExports: (stats?.totalExports || 0) + 1,
    lastExportDate: new Date().toISOString(),
    messagesExported: (stats?.messagesExported || 0) + messageCount
  };
  
  await chrome.storage.local.set({ stats: updatedStats });
}

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener((tab) => {
  // Open popup is default behavior
  // This is just for any additional logic needed
  console.log('[WhatsLog] Extension icon clicked');
});
