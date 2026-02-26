/**
 * WhatsLog - Content Script
 * Injected into web.whatsapp.com to extract messages
 */

(function() {
  'use strict';

  // WhatsLog State
  const WhatsLog = {
    isActive: false,
    extractedMessages: [],
    currentChat: null,
    observer: null
  };

  // DOM Selectors for WhatsApp Web
  const SELECTORS = {
    // Chat container
    chatContainer: '#app .two > div > div > div > div > div > div[tabindex]',
    // Message bubbles
    messageBubble: '[data-testid="msg-container"]',
    // Message text
    messageText: '[data-testid="msg-text"]',
    // Sender name (in groups)
    senderName: '[data-testid="msg-meta"] span[dir="auto"]',
    // Timestamp
    timestamp: '[data-testid="msg-meta"] span[aria-label]',
    // Chat title/header
    chatTitle: '[data-testid="conversation-header"] span[dir="auto"]',
    // Chat list items
    chatListItem: '[data-testid="chat-list"] div[role="listitem"]',
    // Selected chat
    selectedChat: '[data-testid="chat-list"] div[role="listitem"][aria-selected="true"]'
  };

  /**
   * Extract text content from a message element
   */
  function extractMessageText(element) {
    const textElement = element.querySelector(SELECTORS.messageText);
    return textElement ? textElement.textContent.trim() : '';
  }

  /**
   * Extract sender name from a message element
   */
  function extractSenderName(element) {
    // Try to find sender name (mainly for group chats)
    const senderElement = element.querySelector('[data-testid="msg-meta"] > span:first-child');
    if (senderElement) {
      return senderElement.textContent.trim();
    }
    // If no sender found, it's likely a personal chat - use chat title
    return getCurrentChatTitle();
  }

  /**
   * Extract timestamp from a message element
   */
  function extractTimestamp(element) {
    const metaElement = element.querySelector('[data-testid="msg-meta"]');
    if (metaElement) {
      // Look for time text (usually in format like "10:30 AM" or "Yesterday")
      const timeElement = metaElement.querySelector('span:not([dir="auto"])');
      if (timeElement) {
        return timeElement.textContent.trim();
      }
    }
    return '';
  }

  /**
   * Check if message is from me
   */
  function isOutgoingMessage(element) {
    // Outgoing messages have different styling/data attributes
    return element.getAttribute('data-testid') === 'msg-container' && 
           element.classList.contains('message-out');
  }

  /**
   * Detect media type in message
   */
  function detectMediaType(element) {
    if (element.querySelector('[data-testid="image"]')) return 'image';
    if (element.querySelector('[data-testid="video"]')) return 'video';
    if (element.querySelector('[data-testid="audio"]')) return 'audio';
    if (element.querySelector('[data-testid="document"]')) return 'document';
    if (element.querySelector('[data-testid="sticker"]')) return 'sticker';
    return 'text';
  }

  /**
   * Extract a single message object from DOM element
   */
  function extractMessage(element) {
    return {
      id: element.getAttribute('data-id') || generateId(),
      text: extractMessageText(element),
      sender: extractSenderName(element),
      timestamp: extractTimestamp(element),
      isOutgoing: isOutgoingMessage(element),
      mediaType: detectMediaType(element),
      rawTimestamp: Date.now()
    };
  }

  /**
   * Generate unique ID for messages without data-id
   */
  function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current chat title
   */
  function getCurrentChatTitle() {
    const titleElement = document.querySelector(SELECTORS.chatTitle);
    return titleElement ? titleElement.textContent.trim() : 'Unknown Chat';
  }

  /**
   * Extract all visible messages from current chat
   */
  function extractAllMessages() {
    const messages = [];
    const messageElements = document.querySelectorAll(SELECTORS.messageBubble);
    
    messageElements.forEach(element => {
      try {
        const message = extractMessage(element);
        if (message.text || message.mediaType !== 'text') {
          messages.push(message);
        }
      } catch (error) {
        console.error('[WhatsLog] Error extracting message:', error);
      }
    });

    WhatsLog.extractedMessages = messages;
    WhatsLog.currentChat = getCurrentChatTitle();
    
    return {
      chatName: WhatsLog.currentChat,
      messageCount: messages.length,
      messages: messages
    };
  }

  /**
   * Scroll to load more messages
   */
  async function scrollToLoadMore(targetCount = 100) {
    const chatContainer = document.querySelector('#main .copyable-area');
    if (!chatContainer) return false;

    let previousCount = 0;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const currentMessages = document.querySelectorAll(SELECTORS.messageBubble).length;
      
      if (currentMessages >= targetCount || currentMessages === previousCount) {
        break;
      }

      previousCount = currentMessages;
      chatContainer.scrollTop = 0; // Scroll up to load older messages
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    return true;
  }

  /**
   * Create and inject WhatsLog UI panel
   */
  function createWhatsLogPanel() {
    // Check if panel already exists
    if (document.getElementById('whatslog-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'whatslog-panel';
    panel.className = 'whatslog-panel';
    panel.innerHTML = `
      <div class="whatslog-header">
        <span class="whatslog-title">📊 WhatsLog</span>
        <button class="whatslog-close" id="whatslog-close">×</button>
      </div>
      <div class="whatslog-content">
        <div class="whatslog-stats">
          <span id="whatslog-message-count">0 messages</span>
        </div>
        <div class="whatslog-actions">
          <button class="whatslog-btn whatslog-btn-primary" id="whatslog-extract">
            🔄 Extract Messages
          </button>
          <button class="whatslog-btn whatslog-btn-secondary" id="whatslog-export-csv">
            📁 Export CSV
          </button>
          <button class="whatslog-btn whatslog-btn-secondary" id="whatslog-export-sheets">
            📊 Export to Sheets
          </button>
        </div>
        <div class="whatslog-progress" id="whatslog-progress" style="display:none;">
          <div class="whatslog-progress-bar">
            <div class="whatslog-progress-fill" id="whatslog-progress-fill"></div>
          </div>
          <span class="whatslog-progress-text" id="whatslog-progress-text">0%</span>
        </div>
      </div>
    `;

    // Find sidebar to attach panel
    const sidebar = document.querySelector('#app .two > div:first-child');
    if (sidebar) {
      sidebar.appendChild(panel);
      attachPanelListeners();
    }
  }

  /**
   * Attach event listeners to panel buttons
   */
  function attachPanelListeners() {
    const closeBtn = document.getElementById('whatslog-close');
    const extractBtn = document.getElementById('whatslog-extract');
    const exportCsvBtn = document.getElementById('whatslog-export-csv');
    const exportSheetsBtn = document.getElementById('whatslog-export-sheets');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('whatslog-panel').style.display = 'none';
      });
    }

    if (extractBtn) {
      extractBtn.addEventListener('click', async () => {
        showProgress(true);
        updateProgress(20, 'Extracting messages...');
        
        await scrollToLoadMore(50);
        
        updateProgress(60, 'Processing...');
        const result = extractAllMessages();
        
        updateProgress(100, 'Done!');
        updateStats(result.messageCount);
        
        // Store in extension storage
        chrome.storage.local.set({
          lastExtraction: result
        });

        setTimeout(() => showProgress(false), 1000);
      });
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        exportToCSV();
      });
    }

    if (exportSheetsBtn) {
      exportSheetsBtn.addEventListener('click', () => {
        exportToGoogleSheets();
      });
    }
  }

  /**
   * Update progress UI
   */
  function updateProgress(percent, text) {
    const fill = document.getElementById('whatslog-progress-fill');
    const textEl = document.getElementById('whatslog-progress-text');
    if (fill) fill.style.width = percent + '%';
    if (textEl) textEl.textContent = text || percent + '%';
  }

  /**
   * Show/hide progress bar
   */
  function showProgress(show) {
    const progress = document.getElementById('whatslog-progress');
    if (progress) progress.style.display = show ? 'block' : 'none';
  }

  /**
   * Update message count stats
   */
  function updateStats(count) {
    const stats = document.getElementById('whatslog-message-count');
    if (stats) stats.textContent = `${count} messages extracted`;
  }

  /**
   * Export extracted messages to CSV
   */
  function exportToCSV() {
    if (!WhatsLog.extractedMessages.length) {
      alert('No messages extracted yet. Click "Extract Messages" first.');
      return;
    }

    const headers = ['Timestamp', 'Sender', 'Message', 'Type', 'Outgoing'];
    const rows = WhatsLog.extractedMessages.map(msg => [
      msg.timestamp,
      msg.sender,
      msg.text.replace(/"/g, '""'), // Escape quotes
      msg.mediaType,
      msg.isOutgoing ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `whatslog_${WhatsLog.currentChat.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`;
    link.click();
  }

  /**
   * Export to Google Sheets (via background script)
   */
  function exportToGoogleSheets() {
    if (!WhatsLog.extractedMessages.length) {
      alert('No messages extracted yet. Click "Extract Messages" first.');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'exportToSheets',
      data: {
        chatName: WhatsLog.currentChat,
        messages: WhatsLog.extractedMessages
      }
    }, response => {
      if (response && response.success) {
        alert('Successfully exported to Google Sheets!');
      } else {
        alert('Export failed: ' + (response?.error || 'Unknown error'));
      }
    });
  }

  /**
   * Add toggle button to WhatsApp Web header
   */
  function addToggleButton() {
    if (document.getElementById('whatslog-toggle')) return;

    const header = document.querySelector('[data-testid="conversation-header"]');
    if (!header) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'whatslog-toggle';
    toggleBtn.className = 'whatslog-toggle-btn';
    toggleBtn.innerHTML = '📊';
    toggleBtn.title = 'Open WhatsLog';
    toggleBtn.addEventListener('click', () => {
      const panel = document.getElementById('whatslog-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      } else {
        createWhatsLogPanel();
      }
    });

    header.appendChild(toggleBtn);
  }

  /**
   * Initialize WhatsLog
   */
  function init() {
    console.log('[WhatsLog] Initializing...');
    
    // Wait for WhatsApp Web to fully load
    const checkInterval = setInterval(() => {
      const chatList = document.querySelector('[data-testid="chat-list"]');
      if (chatList) {
        clearInterval(checkInterval);
        console.log('[WhatsLog] WhatsApp Web detected, adding UI...');
        
        addToggleButton();
        createWhatsLogPanel();
        
        // Listen for chat changes
        observeChatChanges();
      }
    }, 1000);
  }

  /**
   * Observe chat changes to update UI
   */
  function observeChatChanges() {
    const observer = new MutationObserver(() => {
      addToggleButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractMessages') {
      const result = extractAllMessages();
      sendResponse(result);
    } else if (request.action === 'getStatus') {
      sendResponse({
        isActive: WhatsLog.isActive,
        messageCount: WhatsLog.extractedMessages.length,
        currentChat: WhatsLog.currentChat
      });
    }
    return true;
  });

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
