/**
 * WhatsLog - Popup Script
 * Handles popup UI interactions
 */

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const btnExtract = document.getElementById('btn-extract');
  const btnCsv = document.getElementById('btn-csv');
  const btnSheets = document.getElementById('btn-sheets');
  const btnAuth = document.getElementById('btn-auth');
  const waStatus = document.getElementById('wa-status');
  const msgCount = document.getElementById('msg-count');
  const authStatus = document.getElementById('auth-status');
  const progress = document.getElementById('progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const message = document.getElementById('message');
  const linkSettings = document.getElementById('link-settings');

  // State
  let extractedData = null;
  let isAuthenticated = false;

  // Initialize
  await checkWhatsAppStatus();
  await checkAuthStatus();
  await loadStats();

  // Event Listeners
  btnExtract.addEventListener('click', handleExtract);
  btnCsv.addEventListener('click', handleExportCsv);
  btnSheets.addEventListener('click', handleExportSheets);
  btnAuth.addEventListener('click', handleAuth);
  linkSettings.addEventListener('click', openSettings);

  /**
   * Check if WhatsApp Web is open
   */
  async function checkWhatsAppStatus() {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      if (tabs.length > 0) {
        waStatus.textContent = 'Connected';
        waStatus.classList.add('active');
        
        // Check if we have extracted data
        const response = await sendMessageToContent(tabs[0].id, { action: 'getStatus' });
        if (response && response.messageCount > 0) {
          msgCount.textContent = response.messageCount;
          btnCsv.disabled = false;
          btnSheets.disabled = !isAuthenticated;
        }
      } else {
        waStatus.textContent = 'Not open';
        btnExtract.disabled = true;
      }
    } catch (error) {
      waStatus.textContent = 'Error';
      console.error('Error checking WhatsApp status:', error);
    }
  }

  /**
   * Check Google authentication status
   */
  async function checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      isAuthenticated = response.authenticated;
      
      if (isAuthenticated) {
        authStatus.textContent = 'Connected';
        authStatus.classList.add('active');
        btnAuth.style.display = 'none';
        if (extractedData || parseInt(msgCount.textContent) > 0) {
          btnSheets.disabled = false;
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  /**
   * Load stats from storage
   */
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (response.stats && response.stats.messagesExported > 0) {
        // Could display stats in UI
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Handle extract button click
   */
  async function handleExtract() {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      if (tabs.length === 0) {
        showMessage('Please open WhatsApp Web first', 'error');
        return;
      }

      showProgress(true);
      updateProgress(20, 'Connecting to WhatsApp...');

      const response = await sendMessageToContent(tabs[0].id, { action: 'extractMessages' });
      
      updateProgress(100, 'Done!');
      
      if (response) {
        extractedData = response;
        msgCount.textContent = response.messageCount;
        btnCsv.disabled = false;
        btnSheets.disabled = !isAuthenticated;
        showMessage(`Extracted ${response.messageCount} messages from "${response.chatName}"`, 'success');
      }

      setTimeout(() => showProgress(false), 1000);
    } catch (error) {
      showProgress(false);
      showMessage('Error: ' + error.message, 'error');
    }
  }

  /**
   * Handle CSV export
   */
  async function handleExportCsv() {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      if (tabs.length === 0) return;

      // Request CSV export from content script
      await chrome.tabs.sendMessage(tabs[0].id, { action: 'exportCSV' });
      showMessage('CSV download started!', 'success');
    } catch (error) {
      showMessage('Export failed: ' + error.message, 'error');
    }
  }

  /**
   * Handle Google Sheets export
   */
  async function handleExportSheets() {
    if (!isAuthenticated) {
      showMessage('Please connect your Google account first', 'error');
      return;
    }

    if (!extractedData) {
      showMessage('Please extract messages first', 'error');
      return;
    }

    showProgress(true);
    updateProgress(30, 'Creating spreadsheet...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportToSheets',
        data: extractedData
      });

      showProgress(false);

      if (response.success) {
        showMessage('Exported to Google Sheets!', 'success');
        // Open spreadsheet in new tab
        if (response.result.spreadsheetUrl) {
          chrome.tabs.create({ url: response.result.spreadsheetUrl });
        }
      } else {
        showMessage('Export failed: ' + response.error, 'error');
      }
    } catch (error) {
      showProgress(false);
      showMessage('Export failed: ' + error.message, 'error');
    }
  }

  /**
   * Handle Google authentication
   */
  async function handleAuth() {
    try {
      btnAuth.disabled = true;
      btnAuth.textContent = 'Connecting...';

      const response = await chrome.runtime.sendMessage({ action: 'authenticate' });

      if (response.success) {
        isAuthenticated = true;
        authStatus.textContent = 'Connected';
        authStatus.classList.add('active');
        btnAuth.style.display = 'none';
        if (parseInt(msgCount.textContent) > 0) {
          btnSheets.disabled = false;
        }
        showMessage('Google account connected!', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btnAuth.disabled = false;
      btnAuth.textContent = '🔐 Connect Google Account';
      showMessage('Authentication failed: ' + error.message, 'error');
    }
  }

  /**
   * Open settings page
   */
  function openSettings(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  }

  /**
   * Send message to content script
   */
  function sendMessageToContent(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show/hide progress
   */
  function showProgress(show) {
    progress.classList.toggle('active', show);
  }

  /**
   * Update progress bar
   */
  function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    if (text) progressText.textContent = text;
  }

  /**
   * Show message
   */
  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'message ' + type;
    setTimeout(() => {
      message.className = 'message';
    }, 5000);
  }
});
