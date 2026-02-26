/**
 * WhatsLog - Options/Settings Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const defaultFormat = document.getElementById('default-format');
  const maxMessages = document.getElementById('max-messages');
  const includeMedia = document.getElementById('include-media');
  const autoExtract = document.getElementById('auto-extract');
  const btnSave = document.getElementById('btn-save');
  const btnConnect = document.getElementById('btn-connect');
  const btnClear = document.getElementById('btn-clear');
  const btnReset = document.getElementById('btn-reset');
  const statExports = document.getElementById('stat-exports');
  const statMessages = document.getElementById('stat-messages');
  const message = document.getElementById('message');

  // Load settings and stats
  await loadSettings();
  await loadStats();

  // Event listeners
  btnSave.addEventListener('click', saveSettings);
  btnConnect.addEventListener('click', connectGoogle);
  btnClear.addEventListener('click', clearCache);
  btnReset.addEventListener('click', resetAllData);

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response.settings) {
        const settings = response.settings;
        defaultFormat.value = settings.defaultExportFormat || 'csv';
        maxMessages.value = settings.maxMessagesPerExport || 1000;
        includeMedia.checked = settings.includeMedia !== false;
        autoExtract.checked = settings.autoExtract || false;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Load statistics from storage
   */
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (response.stats) {
        statExports.textContent = response.stats.totalExports || 0;
        statMessages.textContent = (response.stats.messagesExported || 0).toLocaleString();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Save settings
   */
  async function saveSettings() {
    const settings = {
      defaultExportFormat: defaultFormat.value,
      maxMessagesPerExport: parseInt(maxMessages.value) || 1000,
      includeMedia: includeMedia.checked,
      autoExtract: autoExtract.checked
    };

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: settings
      });

      if (response.success) {
        showMessage('Settings saved successfully!', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      showMessage('Error saving settings: ' + error.message, 'error');
    }
  }

  /**
   * Connect Google account
   */
  async function connectGoogle() {
    btnConnect.disabled = true;
    btnConnect.textContent = 'Connecting...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'authenticate' });

      if (response.success) {
        btnConnect.textContent = '✓ Connected';
        btnConnect.classList.remove('btn-primary');
        btnConnect.classList.add('btn-secondary');
        showMessage('Google account connected successfully!', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      btnConnect.disabled = false;
      btnConnect.textContent = 'Connect Google Account';
      showMessage('Connection failed: ' + error.message, 'error');
    }
  }

  /**
   * Clear cache
   */
  async function clearCache() {
    if (!confirm('Are you sure you want to clear the cache? This will remove temporary data.')) {
      return;
    }

    try {
      await chrome.storage.local.remove(['lastExtraction', 'tempData']);
      showMessage('Cache cleared successfully!', 'success');
    } catch (error) {
      showMessage('Error clearing cache: ' + error.message, 'error');
    }
  }

  /**
   * Reset all data
   */
  async function resetAllData() {
    if (!confirm('WARNING: This will delete ALL your data including settings and statistics. This cannot be undone. Are you sure?')) {
      return;
    }

    try {
      await chrome.storage.local.clear();
      showMessage('All data has been reset. Reloading...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      showMessage('Error resetting data: ' + error.message, 'error');
    }
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
