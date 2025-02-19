1// DOM Elements
const chatContainer = document.getElementById('chatContainer');

// Code block helper functions
function copyCodeToClipboard(codeId) {
    const codeElement = document.getElementById(codeId);
    const codeText = codeElement.textContent;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const button = codeElement.parentElement.querySelector('.code-action-btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<span>✓ Copied!</span>';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 1000);
    });
}

function saveCodeToFile(codeId, language) {
    const codeElement = document.getElementById(codeId);
    const codeText = codeElement.textContent;
    
    // Create a blob with the code content
    const blob = new Blob([codeText], { type: 'text/plain' });
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Set the file name based on language and timestamp
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, -5);
    const extension = getFileExtension(language);
    link.download = `code-${timestamp}${extension}`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function getFileExtension(language) {
    const extensions = {
        'javascript': '.js',
        'typescript': '.ts',
        'python': '.py',
        'java': '.java',
        'c': '.c',
        'cpp': '.cpp',
        'csharp': '.cs',
        'php': '.php',
        'ruby': '.rb',
        'go': '.go',
        'rust': '.rs',
        'swift': '.swift',
        'kotlin': '.kt',
        'html': '.html',
        'css': '.css',
        'json': '.json',
        'yaml': '.yaml',
        'markdown': '.md',
        'sql': '.sql',
        'shell': '.sh',
        'bash': '.sh',
        'powershell': '.ps1',
        'dockerfile': '.dockerfile',
        'xml': '.xml'
    };
    return extensions[language.toLowerCase()] || '.txt';
}
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const serverUrlInput = document.getElementById('serverUrl');
const modelSelect = document.getElementById('modelSelect');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const checkConnectionBtn = document.getElementById('checkConnection');

// Settings and state
let currentSettings = {
    serverUrl: localStorage.getItem('ollamaServerUrl') || 'http://localhost:11434',
    model: localStorage.getItem('ollamaModel') || ''
};

let currentChatId = Date.now().toString();
let currentChat = {
    id: currentChatId,
    messages: [],
    date: new Date().toISOString()
};

// WebSocket setup
let ws = null;
let currentMessageDiv = null;
let streamingContent = '';

function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chunk') {
            if (!currentMessageDiv) {
                // Create a new message div for the streaming response
                streamingContent = '';
                addMessage('', false, true);
                currentMessageDiv = chatContainer.lastChild;
                const contentDiv = currentMessageDiv.querySelector('.message-content');
                contentDiv.innerHTML = '<div class="thinking-content">Thinking...</div>';
            }
            
            streamingContent += data.response || data.content;
            const contentDiv = currentMessageDiv.querySelector('.message-content');
            contentDiv.innerHTML = formatContent(streamingContent);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        else if (data.type === 'done') {
            if (currentMessageDiv) {
                // Save the complete message to chat history
                currentChat.messages.push({
                    content: streamingContent,
                    isUser: false,
                    timestamp: new Date().toISOString()
                });
                saveCurrentChat();
                
                // Reset streaming state
                currentMessageDiv = null;
                streamingContent = '';
                
                // Hide loading indicator and re-enable send button
                document.getElementById('loadingIndicator').classList.remove('show');
                sendBtn.disabled = false;
            }
        }
        else if (data.type === 'error') {
            addMessage('Error: ' + (data.error || 'Unknown error'), false);
            currentMessageDiv = null;
            streamingContent = '';
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected. Retrying in 5s...');
        setTimeout(setupWebSocket, 5000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Initialize WebSocket connection
setupWebSocket();

// Load saved chats from localStorage
function loadSavedChats() {
    const savedChats = JSON.parse(localStorage.getItem('ollama_chats') || '[]');
    return savedChats.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Save current chat to localStorage
function saveCurrentChat() {
    const savedChats = loadSavedChats();
    const existingIndex = savedChats.findIndex(chat => chat.id === currentChat.id);
    
    if (existingIndex >= 0) {
        savedChats[existingIndex] = currentChat;
    } else {
        savedChats.push(currentChat);
    }
    
    localStorage.setItem('ollama_chats', JSON.stringify(savedChats));
}

// Delete chat from history
function deleteChat(chatId) {
    const savedChats = loadSavedChats();
    const updatedChats = savedChats.filter(chat => chat.id !== chatId);
    localStorage.setItem('ollama_chats', JSON.stringify(updatedChats));
    displayChatHistory();
}

// Load a specific chat
function loadChat(chatId) {
    const savedChats = loadSavedChats();
    const chatToLoad = savedChats.find(chat => chat.id === chatId);
    
    if (chatToLoad) {
        currentChat = chatToLoad;
        currentChatId = chatToLoad.id;
        chatContainer.innerHTML = '';
        chatToLoad.messages.forEach(msg => {
            addMessage(msg.content, msg.isUser);
        });
        document.getElementById('chatHistoryModal').classList.remove('show');
    }
}

// Group chats by date
function groupChatsByDate(chats) {
    const groups = {};
    chats.forEach(chat => {
        const date = new Date(chat.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateKey;
        if (date.toDateString() === today.toDateString()) {
            dateKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = 'Yesterday';
        } else {
            dateKey = date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(chat);
    });
    return groups;
}

// Display chat history
function displayChatHistory() {
    const chatHistoryContainer = document.getElementById('chatHistoryContainer');
    const savedChats = loadSavedChats();
    const groupedChats = groupChatsByDate(savedChats);
    
    chatHistoryContainer.innerHTML = '';
    
    Object.entries(groupedChats).forEach(([date, chats]) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'chat-history-group';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'chat-history-group-header';
        headerDiv.textContent = date;
        groupDiv.appendChild(headerDiv);
        
        chats.forEach(chat => {
            const chatDiv = document.createElement('div');
            chatDiv.className = 'chat-history-item';
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'chat-history-date';
            dateDiv.textContent = new Date(chat.date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const previewDiv = document.createElement('div');
            previewDiv.className = 'chat-history-preview';
            const firstMessage = chat.messages[0]?.content || 'Empty chat';
            previewDiv.textContent = firstMessage;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'chat-history-actions';
            
            const loadButton = document.createElement('button');
            loadButton.className = 'load-chat';
            loadButton.textContent = 'Load';
            loadButton.onclick = () => loadChat(chat.id);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-chat';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this chat?')) {
                    deleteChat(chat.id);
                }
            };
            
            actionsDiv.appendChild(loadButton);
            actionsDiv.appendChild(deleteButton);
            
            chatDiv.appendChild(dateDiv);
            chatDiv.appendChild(previewDiv);
            chatDiv.appendChild(actionsDiv);
            
            groupDiv.appendChild(chatDiv);
        });
        
        chatHistoryContainer.appendChild(groupDiv);
    });
}

// Initialize settings
serverUrlInput.value = currentSettings.serverUrl;

/**
 * Checks the connection to the Ollama server
 * @param {string} url - The URL of the Ollama server to check
 * @returns {Promise<boolean>} - True if connection is successful, false otherwise
 */
async function checkConnection(url) {
    statusIndicator.className = 'status-dot checking';
    statusText.textContent = 'Checking connection...';
    
    try {
        const response = await fetch(`/api/models?serverUrl=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        statusIndicator.className = 'status-dot connected';
        statusText.textContent = 'Connected to Ollama';
        return true;
    } catch (error) {
        statusIndicator.className = 'status-dot disconnected';
        statusText.textContent = 'Unable to connect to Ollama';
        console.error('Connection error:', error);
        return false;
    }
}

/**
 * Loads available models from the Ollama server and populates the model select dropdown
 * @returns {Promise<void>}
 */
async function loadModels() {
    try {
        const response = await fetch(`/api/models?serverUrl=${encodeURIComponent(currentSettings.serverUrl)}`);
        const data = await response.json();
        
        modelSelect.innerHTML = '';
        data.models?.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
        
        if (currentSettings.model) {
            modelSelect.value = currentSettings.model;
        }
    } catch (error) {
        console.error('Error loading models:', error);
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
}

// Add message to chat
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error('Highlight error:', err);
            }
        }
        // Try to auto-detect language if not specified
        try {
            return hljs.highlightAuto(code).value;
        } catch (err) {
            console.error('Auto highlight error:', err);
        }
        return hljs.escapeHtml(code);
    },
    gfm: true,
    breaks: true,
        smartLists: true,
        xhtml: true,
    headerIds: false,
    mangle: false,
    pedantic: false,
    smartLists: true,
    smartypants: true
});

// Configure marked renderer for code blocks
const renderer = new marked.Renderer();
renderer.code = function(code, language) {
    let processedCode = code;
    
    // Handle code blocks that might contain text content
    if (typeof code === 'string' && code.includes('```')) {
        // Split the content at code block boundaries
        const parts = code.split(/(```[\s\S]*?```)/g);
        
        // Process each part separately
        return parts.map(part => {
            if (part.trim().startsWith('```')) {
                // Handle code blocks
                const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
                if (match) {
                    const [, lang, codeContent] = match;
                    if (lang && lang.toLowerCase() === 'ai') {
                        // Return AI blocks unchanged but properly formatted
                        return marked.parse(part);
                    }
                    
                    // Create unique ID for the code block
                    const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    
                    // Apply syntax highlighting
                    let highlighted;
                    try {
                        if (lang && hljs.getLanguage(lang)) {
                            highlighted = hljs.highlight(codeContent.trim(), { language: lang }).value;
                        } else {
                            highlighted = hljs.highlightAuto(codeContent.trim()).value;
                        }
                    } catch (err) {
                        console.error('Highlight error:', err);
                        highlighted = hljs.escapeHtml(codeContent.trim());
                    }
                    
                    // Add code actions
                    const codeActions = `
                        <div class="code-actions">
                            <button class="code-action-btn" onclick="copyCodeToClipboard('${codeId}')">
                                <span>📋 Copy</span>
                            </button>
                            <button class="code-action-btn" onclick="saveCodeToFile('${codeId}', '${lang || 'text'}')">
                                <span>💾 Save</span>
                            </button>
                        </div>
                    `;
                    
                    return `<pre data-language="${lang || 'text'}">${codeActions}<code id="${codeId}">${highlighted}</code></pre>`;
                }
            }
            // Process non-code parts as markdown
            return marked.parse(part);
        }).join('\n');
    }
    
    // Handle regular code blocks (without surrounding text)
    const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    let highlighted;
    try {
        if (language && hljs.getLanguage(language)) {
                    try {
                        highlighted = hljs.highlight(processedCode, { language }).value;
                    } catch (err) {
                        highlighted = hljs.highlightAuto(processedCode).value;
                    }
                } else {
                    highlighted = hljs.highlightAuto(processedCode).value;
                }
            } catch (err) {
                console.error('Highlight error:', err);
                highlighted = hljs.escapeHtml(processedCode);
            }
    
    const codeActions = `
        <div class="code-actions">
            <button class="code-action-btn" onclick="copyCodeToClipboard('${codeId}')">
                <span>📋 Copy</span>
            </button>
            <button class="code-action-btn" onclick="saveCodeToFile('${codeId}', '${language || 'text'}')">
                <span>💾 Save</span>
            </button>
        </div>
    `;
    
    return `<pre data-language="${language || 'text'}">${codeActions}<code id="${codeId}">${highlighted}</code></pre>`;
};
marked.use({ renderer });

/**
 * Formats the message content, handling both markdown and thinking tags
 * @param {string} content - The raw message content to format
 * @returns {string} - The formatted HTML content
 */
function formatContent(content) {
    // Handle thinking tags separately
    if (content.includes('<thinking>')) {
        return content;
    }

    // Pre-process code blocks to ensure proper formatting
    let processedContent = content;
    
    // Handle triple backtick code blocks while preserving text outside
    // First, split content into text and code blocks while preserving order
    const parts = processedContent.split(/(```.*?```)/gs);
    
    // Process each part separately
    processedContent = parts.map(part => {
        if (part.startsWith('```')) {
            // Handle code blocks
            const match = part.match(/(```(\w*)\n([\s\S]*?)```)/);
                            if (match) {
                                const [, , lang, code] = match;
                                if (lang && lang.toLowerCase() === 'ai') {
                                                        // Preserve AI blocks as-is
                                                        return part;
                                                    }
                                                    // Format regular code blocks
                                                    const trimmedCode = code
                                                        .split('\\n')
                                                        .map(line => line.trimEnd())
                                                        .join('\\n');
                                                    return renderer.code(trimmedCode, lang);
                                                }
                                         }
                                         // Return non-code parts for markdown processing
                                         return part;
    }).join('\n\n');

    // Handle inline code blocks
    processedContent = processedContent.replace(/`([^`]+)`/g, (match, code) => {
        return `\`${code.trim()}\``;
    });

    // Parse markdown using marked
    return marked.parse(processedContent);
}

/**
 * Adds a message to the chat container
 * @param {string} content - The message content to add
 * @param {boolean} [isUser=false] - Whether the message is from the user
 */
function addMessage(content, isUser = false, skipSave = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Handle thinking tags for DeepSeek model
    if (!isUser && content.includes('<thinking>')) {
        const parts = content.split(/<thinking>|<\/thinking>/);
        parts.forEach((part, index) => {
            if (part.trim()) {
                const partDiv = document.createElement('div');
                if (index % 2 === 1) { // Inside thinking tags
                    partDiv.className = 'thinking-content';
                    partDiv.textContent = part.trim();
                } else { // Regular content
                    partDiv.innerHTML = formatContent(part.trim());
                }
                contentDiv.appendChild(partDiv);
            }
        });
    } else {
        contentDiv.innerHTML = isUser ? content : formatContent(content);
    }
    
    messageDiv.appendChild(contentDiv);
       
       // Add action buttons
       const actionsDiv = document.createElement('div');
       actionsDiv.className = 'message-actions';
       
       // Copy button for all messages
       const copyBtn = document.createElement('button');
       copyBtn.className = 'message-action-btn';
       copyBtn.innerHTML = '📋 Copy';
       copyBtn.title = 'Copy to clipboard';
       copyBtn.onclick = () => {
           navigator.clipboard.writeText(content).then(() => {
               copyBtn.innerHTML = '✓ Copied!';
               setTimeout(() => {
                   copyBtn.innerHTML = '📋 Copy';
               }, 1000);
           });
       };
       actionsDiv.appendChild(copyBtn);
   
       if (isUser) {
           // Edit button for user messages
           const editBtn = document.createElement('button');
           editBtn.className = 'message-action-btn';
           editBtn.innerHTML = '✏️ Edit';
           editBtn.title = 'Edit message';
           editBtn.onclick = () => {
               userInput.value = content;
               userInput.focus();
               
               let currentNode = messageDiv;
               let nodesToRemove = [];
               while (currentNode.nextSibling) {
                   nodesToRemove.push(currentNode.nextSibling);
                   currentNode = currentNode.nextSibling;
               }
               nodesToRemove.forEach(node => node.remove());
               messageDiv.remove();
               
               const messageIndex = currentChat.messages.findIndex(msg => msg.content === content && msg.isUser);
               if (messageIndex !== -1) {
                   currentChat.messages = currentChat.messages.slice(0, messageIndex);
                   saveCurrentChat();
               }
           };
           actionsDiv.appendChild(editBtn);
       } else if (!isUser && !content.includes('<thinking>')) {
           // Regenerate button for AI messages
           const regenerateBtn = document.createElement('button');
           regenerateBtn.className = 'message-action-btn';
           regenerateBtn.innerHTML = '🔄 Regenerate';
           regenerateBtn.title = 'Regenerate response';
           regenerateBtn.onclick = () => {
               // Find the last user message
               const lastUserMessage = currentChat.messages.slice().reverse().find(msg => msg.isUser);
               if (lastUserMessage) {
                   // Remove this message and any subsequent messages
                   let currentNode = messageDiv;
                   let nodesToRemove = [];
                   while (currentNode.nextSibling) {
                       nodesToRemove.push(currentNode.nextSibling);
                       currentNode = currentNode.nextSibling;
                   }
                   nodesToRemove.forEach(node => node.remove());
                   messageDiv.remove();
   
                   // Update chat history
                   const messageIndex = currentChat.messages.findIndex(msg => msg.content === content && !msg.isUser);
                   if (messageIndex !== -1) {
                       currentChat.messages = currentChat.messages.slice(0, messageIndex);
                       saveCurrentChat();
                   }
   
                   // Resend the last user message
                   sendMessage(lastUserMessage.content);
               }
           };
           actionsDiv.appendChild(regenerateBtn);
       }
   
       messageDiv.appendChild(actionsDiv);
       chatContainer.appendChild(messageDiv);
       chatContainer.scrollTop = chatContainer.scrollHeight;

    // Save message to current chat if it's not a thinking message and not loading from history
    if (!skipSave && !content.includes('<thinking>')) {
        currentChat.messages.push({
            content,
            isUser,
            timestamp: new Date().toISOString()
        });
        saveCurrentChat();
    }
}

/**
 * Sends a message to the Ollama server and handles the response
 * @param {string} message - The message to send to the AI model
 * @returns {Promise<void>}
 * @throws {Error} When the model is not selected or server communication fails
 */
async function sendMessage(message) {
    if (!currentSettings.model) {
        alert('Please select a model in settings first');
        return;
    }

    addMessage(message, true);
    userInput.value = '';
    
    // Show loading indicator
    document.getElementById('loadingIndicator').classList.add('show');
    sendBtn.disabled = true;
    
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Use WebSocket for streaming responses
            ws.send(JSON.stringify({
                message,
                model: currentSettings.model,
                serverUrl: currentSettings.serverUrl
            }));
        } else {
            // Fallback to HTTP if WebSocket is not available
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    model: currentSettings.model,
                    serverUrl: currentSettings.serverUrl
                })
            });

            const data = await response.json();
            if (data.error) {
                addMessage('Error: ' + data.error);
                return;
            }

            addMessage(data.message?.content || 'No response from model');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Error: Failed to get response from server');
    } finally {
        // Only hide loading indicator in HTTP fallback case
        // For WebSocket, it's handled by the 'done' message
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            document.getElementById('loadingIndicator').classList.remove('show');
            sendBtn.disabled = false;
        }
    }
}

/**
 * Clears the chat history and resets the input field
 * @returns {void}
 */
function clearChat() {
    chatContainer.innerHTML = '';
    userInput.value = '';
    userInput.focus();
    
    // Create new chat
    currentChatId = Date.now().toString();
    currentChat = {
        id: currentChatId,
        messages: [],
        date: new Date().toISOString()
    };
}

// Event Listeners
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryBtn = document.getElementById('chatHistoryBtn');
const chatHistoryModal = document.getElementById('chatHistoryModal');
const closeChatHistory = document.getElementById('closeChatHistory');

// Chat History Modal
chatHistoryBtn.addEventListener('click', () => {
    chatHistoryModal.classList.add('show');
    displayChatHistory();
});

closeChatHistory.addEventListener('click', () => {
    chatHistoryModal.classList.remove('show');
});
newChatBtn.addEventListener('click', () => {
    if (chatContainer.children.length > 0) {
        if (confirm('Are you sure you want to start a new chat? This will clear the current conversation.')) {
            clearChat();
        }
    }
});

sendBtn.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    }
});

settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
    checkConnection(serverUrlInput.value);
    loadModels();
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('show');
});

serverUrlInput.addEventListener('blur', () => {
    checkConnection(serverUrlInput.value);
});

checkConnectionBtn.addEventListener('click', () => {
    checkConnection(serverUrlInput.value);
});

saveSettings.addEventListener('click', async () => {
    const isConnected = await checkConnection(serverUrlInput.value);
    if (!isConnected) {
        if (!confirm('Unable to connect to Ollama. Save settings anyway?')) {
            return;
        }
    }
    
    currentSettings.serverUrl = serverUrlInput.value;
    currentSettings.model = modelSelect.value;
    
    localStorage.setItem('ollamaServerUrl', currentSettings.serverUrl);
    localStorage.setItem('ollamaModel', currentSettings.model);
    
    settingsModal.classList.remove('show');
    loadModels(); // Reload models with new server URL
});

// Initial connection check and model load
checkConnection(currentSettings.serverUrl);
loadModels();