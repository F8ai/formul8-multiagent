/**
 * SyzyChat - Simplified version with collapsible panels
 * Works without GoldenLayout dependency
 */

/**
 * SyzyChat - A comprehensive chat library
 * 
 * Features:
 * - Rocket.Chat integration
 * - OpenRouter AI support
 * - LangChain.js support
 * - Google Docs integration with natural language commands
 * - Emoji support
 * - HTML, Markdown, Mermaid, Electronic Schematic, and Molecular Structure rendering
 * - Collapsible panels (Projects, Chat, Documents)
 */

/**
 * ConfigManager - Secure configuration management for API keys and secrets
 */
class ConfigManager {
  constructor() {
    this.sensitiveKeys = new Set([
      'openRouterApiKey',
      'apiKey',
      'api_key',
      'secret',
      'password',
      'token',
      'auth',
      'credential'
    ]);
  }

  /**
   * Get configuration value from environment or options
   * Priority: options > environment variables
   */
  get(key, options = {}, envPrefix = 'SYZYCHAT_') {
    // First check if provided in options
    if (options[key] !== undefined && options[key] !== '') {
      return this.validate(key, options[key]);
    }

    // Then check environment variables (Node.js only)
    if (typeof process !== 'undefined' && process.env) {
      const envKey = envPrefix + key.replace(/([A-Z])/g, '_$1').toUpperCase();
      const envValue = process.env[envKey];
      if (envValue !== undefined && envValue !== '') {
        return this.validate(key, envValue);
      }
    }

    return options[key] || '';
  }

  /**
   * Validate configuration value
   */
  validate(key, value) {
    if (this.sensitiveKeys.has(key)) {
      if (typeof value !== 'string' || value.length === 0) {
        console.warn(`Warning: ${key} is empty or invalid`);
        return '';
      }
    }
    return value;
  }
}

/**
 * SyzyChat - Main chat library class
 */
class SyzyChat {
  constructor(options = {}) {
    this.configManager = new ConfigManager();
    
    // Initialize theme
    this.currentTheme = localStorage.getItem('syzychat-theme') || 'dark';
    
    // Always save theme to localStorage to ensure persistence
    localStorage.setItem('syzychat-theme', this.currentTheme);
    
    // AI Status tracking
    this.aiStatus = {
      available: false,
      lastCheck: null,
      errorCount: 0,
      maxErrors: 3
    };
    
    this.options = {
      // Core features
      enableEmoji: true,
      enableMarkdown: true,
      enableMermaid: true,
      enableHTML: true,
      enableDarkMode: true,
      darkMode: true,
      enablePyodide: false, // Enable Python code execution
      
      // API configuration
      openRouterApiKey: this.configManager.get('openRouterApiKey', options),
      backendUrl: options.backendUrl || '',
      
      // Pyodide configuration
      pyodideConfig: {
        timeout: 30000,
        allowPackageInstall: true,
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      },
      
      // Panel system
      panelSystem: {
        leftPanelCollapsed: true,
        rightPanelCollapsed: false
      },
      
      // Event handlers
      onConversationSwitch: null,
      onProjectSwitch: null,
      onDocumentOpen: null,
      
      ...options
    };
    
    // Initialize Pyodide tool if enabled
    this.pyodideTool = null;
    if (this.options.enablePyodide && typeof PyodideTool !== 'undefined') {
      this.pyodideTool = new PyodideTool(this.options.pyodideConfig);
    }

    // Panel system state
    this.panelSystem = {
      initialized: true,
      projects: new Map(),
      conversations: new Map(),
      files: new Map(), // Global file storage
      documents: new Map(),
      currentProject: null,
      currentConversation: null,
      leftPanelCollapsed: true, // Projects panel starts collapsed
      rightPanelCollapsed: true, // Documents panel starts collapsed
      leftPanelWidth: 300,
      rightPanelWidth: 300,
      searchQuery: '', // For conversation search
      collapsibles: new Map(), // Store collapsible instances
      rag: {
        enabled: true,
        knowledgeBase: new Map(), // Store knowledge chunks
        embeddings: new Map() // Store embeddings for similarity search
      }
    };

    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default data
   */
  initializeDefaultData() {
    // Initialize with empty state - no default project or conversation
    // Users can create their own projects and conversations as needed
  }

  /**
   * Check if device is mobile (screen width <= 768px)
   */
  isMobileDevice() {
    return window.innerWidth <= 768;
  }

  /**
   * Initialize SyzyChat
   */
  async initialize() {
    console.log('Initializing SyzyChat...');
    
    // Collapse both panels on mobile by default
    if (this.isMobileDevice()) {
      this.panelSystem.leftPanelCollapsed = true;
      this.panelSystem.rightPanelCollapsed = true;
      console.log('Mobile device detected, collapsing both panels by default');
    }
    
    // Load conversation history
    this.loadConversationHistory();
    
    // Initialize panel system
    this.initializePanelSystem();
    
    console.log('SyzyChat initialized successfully');
    return this;
  }

  /**
   * Initialize panel system
   */
  initializePanelSystem() {
    console.log('Initializing Panel System...');
    
    // Create the main layout
    this.createMainLayout();
    
    // Render all panels
    this.renderAllPanels();
    
    // Setup event listeners
    this.setupPanelEventListeners();
    
    // Setup window resize listener to handle orientation changes
    this.setupResizeListener();
  }

  /**
   * Create main layout
   */
  createMainLayout() {
    const container = document.getElementById('layout-container');
    if (!container) {
      console.error('Layout container not found');
      return;
    }

    container.innerHTML = `
      <div class="syzychat-layout">
        <div class="left-panel ${this.panelSystem.leftPanelCollapsed ? 'collapsed' : ''}" 
             id="left-panel" 
             style="width: ${this.panelSystem.leftPanelWidth}px; min-width: ${this.panelSystem.leftPanelWidth}px;">
          ${this.createLeftPanelHTML()}
        </div>
        <div class="resizer" id="left-resizer"></div>
        <div class="center-panel" id="center-panel">
          ${this.createCenterPanelHTML()}
        </div>
        <div class="resizer" id="right-resizer"></div>
        <div class="right-panel ${this.panelSystem.rightPanelCollapsed ? 'collapsed' : ''}" 
             id="right-panel"
             style="width: ${this.panelSystem.rightPanelWidth}px; min-width: ${this.panelSystem.rightPanelWidth}px;">
          ${this.createRightPanelHTML()}
        </div>
      </div>
    `;
  }

  /**
   * Create left panel HTML (Projects with Files and Chats)
   */
  createLeftPanelHTML() {
    return `
      <div class="syzychat-panel">
        <div class="search-bar">
          <label for="conversation-search" class="sr-only">Search conversations</label>
          <input type="text" id="conversation-search" placeholder="Search conversations..." aria-label="Search conversations" oninput="window.syzyChat.searchConversations(this.value)" />
          <button class="btn-clear-search" onclick="window.syzyChat.clearSearch()" title="Clear Search" aria-label="Clear search">✕</button>
        </div>
        <div class="file-browser" id="file-browser">
          <!-- File browser will be rendered here -->
        </div>
      </div>
    `;
  }

  /**
   * Create center panel HTML (Chat)
   */
  createCenterPanelHTML() {
    return `
      <div class="syzychat-container">
        <div class="chat-header">
          <h1 class="chat-title" id="chat-title">SyzyChat</h1>
          <div class="chat-controls">
            <button class="panel-toggle" id="left-panel-toggle" onclick="window.syzyChat.toggleLeftPanel()" title="Toggle Projects Panel">☰</button>
            <button class="panel-toggle" id="right-panel-toggle" onclick="window.syzyChat.toggleRightPanel()" title="Toggle Documents Panel">☰</button>
            <button class="theme-toggle" id="theme-toggle" onclick="window.syzyChat.toggleTheme()" title="Toggle Dark/Light Theme">🌙</button>
            <svg class="settings-gear" onclick="toggleSettings()" viewBox="0 0 24 24">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-container" 
             ondrop="window.syzyChat.handleFileDrop(event)" 
             ondragover="window.syzyChat.handleDragOver(event)" 
             ondragleave="window.syzyChat.handleDragLeave(event)">
          <div class="chat-input-wrapper">
            <label for="chat-input" class="sr-only">Type your message</label>
            <textarea id="chat-input" placeholder="Type your message or drag files here... (Enter to send, Shift+Enter for new line)" aria-label="Type your message" rows="3"></textarea>
            <div class="chat-input-actions">
              <button class="btn-upload" onclick="document.getElementById('file-input').click()" title="Upload File" aria-label="Upload file">📎</button>
              <button class="btn-send" onclick="window.syzyChat.sendMessage()" title="Send Message" aria-label="Send message">➤</button>
            </div>
          </div>
          <input type="file" id="file-input" multiple accept=".txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif" style="display: none;" onchange="window.syzyChat.handleFileSelect(event)">
        </div>
      </div>
    `;
  }

  /**
   * Create right panel HTML (Documents)
   */
  createRightPanelHTML() {
    return `
      <div class="documents-panel">
        <div class="documents-header">
          <h3>Documents</h3>
          <button class="btn-add-document" onclick="window.syzyChat.addDocument()" title="Add Document">+</button>
        </div>
        <div class="documents-content">
          <div class="documents-list" id="documents-list">
            <!-- Documents will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render all panels
   */
  renderAllPanels() {
    this.renderProjects();
    this.renderDocuments();
    this.updatePanelToggleButtons();
    this.applyTheme();
    this.updateThemeButton();
    this.updateAIStatusLight();
    
    // Check AI status after a short delay
    setTimeout(() => {
      this.checkAIStatus();
    }, 1000);
  }

  /**
   * Render projects dropdown and directory structure
   */
  renderProjects() {
    this.renderFileBrowser();
  }

  /**
   * Render file browser with projects as folders and conversations as files
   */
  renderFileBrowser() {
    const fileBrowser = document.getElementById('file-browser');
    if (!fileBrowser) {
      console.log('File browser not found');
      return;
    }

    // Clear existing content
    fileBrowser.innerHTML = '';

    if (this.panelSystem.projects.size === 0) {
      // Empty state
      fileBrowser.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📁</span>
          <span class="empty-text">No projects yet</span>
          <span class="empty-meta">Create a project to get started</span>
          <button class="btn-add-folder-empty" onclick="window.syzyChat.addProject()" title="Add Project">+📁</button>
        </div>
      `;
      return;
    }

    // Add header with Add Project button
    let html = `
      <div class="file-browser-header">
        <span class="browser-title">Projects</span>
        <button class="btn-add-folder" onclick="window.syzyChat.addProject()" title="Add Project">+📁</button>
      </div>
    `;
    
    // Render projects as folders
    for (const [projectId, project] of this.panelSystem.projects) {
      const isActive = projectId === this.panelSystem.currentProject;
      const conversationCount = project.conversations ? project.conversations.length : 0;
      const fileCount = project.files ? project.files.length : 0;
      
      html += `
        <div class="folder-item ${isActive ? 'active' : ''}" 
             data-project-id="${projectId}"
             onclick="window.syzyChat.switchProject('${projectId}')"
             oncontextmenu="window.syzyChat.showProjectContextMenu(event, '${projectId}')">
          <span class="folder-icon">📁</span>
          <span class="folder-name">${project.name}</span>
          <span class="folder-count">${conversationCount + fileCount}</span>
        </div>
      `;

      // If this project is active, show its contents
      if (isActive) {
        // Add Add Conversation button
        html += `
          <div class="add-conversation-section">
            <button class="btn-add-conversation" onclick="window.syzyChat.addConversation()" title="Add Conversation">+💬</button>
          </div>
        `;
        
        // Show conversations as files
        const conversations = (project.conversations || [])
          .map(id => this.panelSystem.conversations.get(id))
          .filter(conv => conv && !conv.archived);

        for (const conversation of conversations) {
          const isActiveConv = conversation.id === this.panelSystem.currentConversation;
          html += `
            <div class="file-item conversation-file ${isActiveConv ? 'active' : ''}" 
                 data-conversation-id="${conversation.id}"
                 onclick="window.syzyChat.switchConversation('${conversation.id}')"
                 oncontextmenu="window.syzyChat.showConversationContextMenu(event, '${conversation.id}')">
              <span class="file-icon">💬</span>
              <span class="file-name">${conversation.name || 'Untitled'}</span>
              <span class="file-meta">${conversation.messageCount || 0} msgs</span>
            </div>
          `;
        }

        // Show project files
        const projectFiles = (project.files || [])
          .map(id => this.panelSystem.files.get(id))
          .filter(file => file);

        for (const file of projectFiles) {
          html += `
            <div class="file-item project-file" 
                 data-file-id="${file.id}"
                 oncontextmenu="window.syzyChat.showFileContextMenu(event, '${file.id}')">
              <span class="file-icon">📄</span>
              <span class="file-name">${file.name}</span>
              <span class="file-meta">${this.formatFileSize(file.size)}</span>
            </div>
          `;
        }
      }
    }

    fileBrowser.innerHTML = html;
    console.log('File browser rendered');
  }

  /**
   * Render conversations list with files
   */
  renderConversationsList() {
    const conversationsList = document.getElementById('conversations-list');
    if (!conversationsList) {
      console.log('Conversations list not found');
      return;
    }

    const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
    if (!currentProject) {
      conversationsList.innerHTML = `
        <div class="list" id="conversations-list-js">
          <div class="list-container">
            <div class="list-item empty-state">
              <span class="item-icon">💬</span>
              <span class="item-name">No conversations yet</span>
              <span class="item-meta">Select a project to view conversations</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Get conversations to display (either search results or all conversations)
    let conversationsToShow;
    if (this.panelSystem.searchQuery) {
      // Show search results
      const searchResults = this.getSearchResults();
      conversationsToShow = searchResults.filter(conv => conv.projectId === this.panelSystem.currentProject);
    } else {
      // Show all conversations for current project
      conversationsToShow = (currentProject.conversations || [])
        .map(id => this.panelSystem.conversations.get(id))
        .filter(conv => conv && !conv.archived);
    }

    let html = '';
    
    // Add project files first
    const projectFiles = (currentProject.files || [])
      .map(id => this.panelSystem.files.get(id))
      .filter(file => file);
    
    for (const file of projectFiles) {
      html += `
        <div class="list-item file-item" 
             data-file-id="${file.id || 'unknown'}"
             draggable="true"
             ondragstart="window.syzyChat.handleFileDragStart(event, '${file.id || 'unknown'}')"
             oncontextmenu="window.syzyChat.showFileContextMenu(event, '${file.id || 'unknown'}')">
          <span class="item-icon">📄</span>
          <span class="item-name">${file.name}</span>
          <span class="item-meta">${this.formatFileSize(file.size)}</span>
        </div>
      `;
    }
    
    // Add conversations with their files
    for (const conversation of conversationsToShow) {
      if (!conversation) continue;

      const isActive = conversation.id === this.panelSystem.currentConversation;
      
      html += `
        <div class="list-item conversation-item ${isActive ? 'active' : ''}" 
             data-conversation-id="${conversation.id}"
             draggable="true"
             ondragstart="window.syzyChat.handleConversationDragStart(event, '${conversation.id}')"
             ondragend="window.syzyChat.handleDragEnd(event)"
             oncontextmenu="window.syzyChat.showConversationContextMenu(event, '${conversation.id}')"
             onclick="window.syzyChat.switchConversation('${conversation.id}')">
          <span class="item-icon">💬</span>
          <span class="item-name">${conversation.name}</span>
          <span class="item-meta">${conversation.messages.length} msgs</span>
        </div>
      `;
      
      // Add conversation files
      const conversationFiles = (conversation.files || [])
        .map(id => this.panelSystem.files.get(id))
        .filter(file => file);
      
      for (const file of conversationFiles) {
        html += `
          <div class="list-item file-item conversation-file" 
               data-file-id="${file.id || 'unknown'}"
               data-conversation-id="${conversation.id}"
               draggable="true"
               ondragstart="window.syzyChat.handleFileDragStart(event, '${file.id || 'unknown'}')"
               oncontextmenu="window.syzyChat.showFileContextMenu(event, '${file.id || 'unknown'}')">
            <span class="item-icon">📎</span>
            <span class="item-name">${file.name}</span>
            <span class="item-meta">${this.formatFileSize(file.size)}</span>
          </div>
        `;
      }
    }
    
    conversationsList.innerHTML = html;
  }

  /**
   * Render projects list
   */
  renderProjectsList() {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) {
      console.log('Projects list not found');
      return;
    }

    // Clear existing list
    projectsList.innerHTML = '';

    if (this.panelSystem.projects.size > 0) {
      // Create simple HTML collapsible list
      projectsList.innerHTML = `
        <details class="projects-details" open>
          <summary class="projects-summary">
            <span class="summary-icon">📁</span>
            <span class="summary-text">Projects</span>
            <span class="summary-count">${this.panelSystem.projects.size}</span>
            <button class="btn-add-project" onclick="event.stopPropagation(); window.syzyChat.addProject()" title="Add Project">+</button>
          </summary>
          <ul class="projects-ul">
            ${Array.from(this.panelSystem.projects.values()).map(project => {
              const isActive = project.id === this.panelSystem.currentProject;
              const conversationCount = project.conversations ? project.conversations.length : 0;
              const fileCount = project.files ? project.files.length : 0;
              
              return `
                <li class="project-li ${isActive ? 'active' : ''}" 
                    data-project-id="${project.id}"
                    draggable="true"
                    ondragstart="window.syzyChat.handleProjectDragStart(event, '${project.id}')"
                    ondragend="window.syzyChat.handleDragEnd(event)"
                    ondragover="window.syzyChat.handleProjectDragOver(event, '${project.id}')"
                    ondrop="window.syzyChat.handleProjectDrop(event, '${project.id}')"
                    onclick="window.syzyChat.switchProject('${project.id}')"
                    oncontextmenu="window.syzyChat.showProjectContextMenu(event, '${project.id}')">
                  <span class="project-icon">📁</span>
                  <span class="project-name">${project.name}</span>
                  <span class="project-meta">${conversationCount} chats, ${fileCount} files</span>
                </li>
              `;
            }).join('')}
          </ul>
        </details>
      `;
    } else {
      // Empty state
      projectsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📁</span>
          <span class="empty-text">No projects yet</span>
          <span class="empty-meta">Create a project to get started</span>
          <button class="btn-add-project-empty" onclick="window.syzyChat.addProject()" title="Add Project">+ Add Project</button>
        </div>
      `;
    }

    console.log('Projects list rendered:', this.panelSystem.projects.size, 'projects');
  }

  /**
   * Render files directory
   */
  renderFilesDirectory() {
    const filesDirectory = document.getElementById('files-directory');
    if (!filesDirectory) {
      console.log('Files directory not found');
      return;
    }

    const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
    if (!currentProject) return;

    const isExpanded = this.panelSystem.directories.files.expanded;
    filesDirectory.className = `directory-content ${isExpanded ? 'expanded' : ''}`;

    let html = '';
    for (const fileId of currentProject.files || []) {
      const file = this.panelSystem.files.get(fileId);
      if (!file) continue;

      html += `
        <div class="file-item" data-file-id="${fileId}">
          <div class="file-icon">📄</div>
          <div class="file-name" onclick="window.syzyChat.openFile('${fileId}')">
            <span class="file-title">${file.name}</span>
            <span class="file-meta">${file.size || 'Unknown size'}</span>
          </div>
          <div class="file-actions">
            <button class="btn-edit" onclick="event.stopPropagation(); window.syzyChat.editFile('${fileId}')" title="Rename">✏️</button>
            <button class="btn-delete" onclick="event.stopPropagation(); window.syzyChat.deleteFile('${fileId}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }
    
    filesDirectory.innerHTML = html;
    console.log('Files rendered:', (currentProject.files || []).length, 'files for project', this.panelSystem.currentProject);
  }

  /**
   * Render chats directory
   */
  renderChatsDirectory() {
    const chatsDirectory = document.getElementById('chats-directory');
    if (!chatsDirectory) {
      console.log('Chats directory not found');
      return;
    }

    const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
    if (!currentProject) return;

    const isExpanded = this.panelSystem.directories.chats.expanded;
    chatsDirectory.className = `directory-content ${isExpanded ? 'expanded' : ''}`;

    let html = '';
    for (const conversationId of currentProject.conversations || []) {
      const conversation = this.panelSystem.conversations.get(conversationId);
      if (!conversation) continue;

      const isActive = conversationId === this.panelSystem.currentConversation;
      
      html += `
        <div class="conversation-item ${isActive ? 'active' : ''}" 
             data-conversation-id="${conversationId}"
             draggable="true"
             ondragstart="window.syzyChat.handleDragStart(event, '${conversationId}')"
             ondragend="window.syzyChat.handleDragEnd(event)">
          <div class="conversation-drag-handle" title="Drag to move to another project">⋮⋮</div>
          <div class="conversation-name" onclick="window.syzyChat.switchConversation('${conversationId}')">
            <span class="conversation-title">${conversation.name}</span>
            <span class="conversation-meta">${conversation.messages.length} messages</span>
          </div>
          <div class="conversation-actions">
            <button class="btn-download" onclick="event.stopPropagation(); window.syzyChat.downloadConversation('${conversationId}')" title="Download">📥</button>
            <button class="btn-edit" onclick="event.stopPropagation(); window.syzyChat.editConversation('${conversationId}')" title="Rename">✏️</button>
            <button class="btn-delete" onclick="event.stopPropagation(); window.syzyChat.deleteConversation('${conversationId}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }
    
    chatsDirectory.innerHTML = html;
    
    // Setup drop zones for each project in the dropdown
    this.setupProjectDropZones();
    
    console.log('Chats rendered:', (currentProject.conversations || []).length, 'chats for project', this.panelSystem.currentProject);
  }

  /**
   * Render conversations for a project
   */
  renderProjectConversations(projectId) {
    const project = this.panelSystem.projects.get(projectId);
    if (!project) return '';
    
    let html = '';
    for (const convId of project.conversations) {
      const conversation = this.panelSystem.conversations.get(convId);
      if (!conversation) continue;
      
      const isActive = convId === this.panelSystem.currentConversation;
      
      html += `
        <div class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${convId}">
          <div class="conversation-name" onclick="window.syzyChat.switchConversation('${convId}')">
            ${conversation.name}
          </div>
          <div class="conversation-actions">
            <button class="btn-download" onclick="event.stopPropagation(); window.syzyChat.downloadConversation('${convId}')" title="Download">📥</button>
            <button class="btn-edit" onclick="event.stopPropagation(); window.syzyChat.editConversation('${convId}')" title="Rename">✏️</button>
            <button class="btn-delete" onclick="event.stopPropagation(); window.syzyChat.deleteConversation('${convId}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }
    return html;
  }

  // renderConversations() removed - conversations are now shown in renderProjects()

  /**
   * Render documents HTML
   */
  renderDocuments() {
    const documentsList = document.getElementById('documents-list');
    if (!documentsList) return;

    let html = '';
    for (const [id, document] of this.panelSystem.documents) {
      html += `
        <div class="document-item" data-document-id="${id}">
          <div class="document-name" onclick="window.syzyChat.openDocument('${id}')">
            ${document.name}
          </div>
          <div class="document-actions">
            <button class="btn-edit" onclick="event.stopPropagation(); window.syzyChat.editDocument('${id}')" title="Edit">✏️</button>
            <button class="btn-delete" onclick="event.stopPropagation(); window.syzyChat.deleteDocument('${id}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }
    
    if (html === '') {
      html = '<div class="no-documents">No documents yet. Click + to add one.</div>';
    }
    
    documentsList.innerHTML = html;
  }

  /**
   * Setup panel event listeners
   */
  setupPanelEventListeners() {
    // Panel toggle buttons
    const leftToggle = document.getElementById('left-panel-toggle');
    const rightToggle = document.getElementById('right-panel-toggle');
    
    if (leftToggle) {
      leftToggle.addEventListener('click', () => this.toggleLeftPanel());
    }
    
    if (rightToggle) {
      rightToggle.addEventListener('click', () => this.toggleRightPanel());
    }
    
    // Setup swipe gestures for mobile
    this.setupSwipeGestures();
    
    // Setup center panel click to close panels
    this.setupCenterPanelClickListener();
    
    // Setup resizers
    this.setupResizers();
  }

  /**
   * Setup swipe gesture detection for mobile panel toggling
   */
  setupSwipeGestures() {
    const centerPanel = document.getElementById('center-panel');
    if (!centerPanel) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    centerPanel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isSwiping = false;
    }, { passive: true });

    centerPanel.addEventListener('touchmove', (e) => {
      if (!isSwiping) {
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const deltaX = Math.abs(touchCurrentX - touchStartX);
        const deltaY = Math.abs(touchCurrentY - touchStartY);
        
        // Check if horizontal swipe (not vertical scroll)
        if (deltaX > deltaY && deltaX > 10) {
          isSwiping = true;
        }
      }
    }, { passive: true });

    centerPanel.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;
      
      // Calculate swipe distance and velocity
      const distance = Math.abs(deltaX);
      const velocity = distance / deltaTime;
      
      // Minimum swipe distance (50px) and ensure horizontal swipe
      const minSwipeDistance = 50;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontalSwipe && distance >= minSwipeDistance && isSwiping) {
        // Swipe right - open left panel
        if (deltaX > 0) {
          console.log('Swipe right detected, opening left panel');
          if (this.panelSystem.leftPanelCollapsed) {
            this.toggleLeftPanel();
          }
          // Close right panel if open
          if (!this.panelSystem.rightPanelCollapsed) {
            this.toggleRightPanel();
          }
        }
        // Swipe left - open right panel
        else {
          console.log('Swipe left detected, opening right panel');
          if (this.panelSystem.rightPanelCollapsed) {
            this.toggleRightPanel();
          }
          // Close left panel if open
          if (!this.panelSystem.leftPanelCollapsed) {
            this.toggleLeftPanel();
          }
        }
      }
      
      isSwiping = false;
    }, { passive: true });
  }

  /**
   * Setup center panel click listener to close open panels
   */
  setupCenterPanelClickListener() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    
    // Close panels when clicking on chat messages area (only on mobile)
    if (chatMessages) {
      chatMessages.addEventListener('click', (e) => {
        if (this.isMobileDevice()) {
          // Check if any panel is open and close them
          // Exclude clicks on buttons and interactive elements
          const isInteractiveElement = e.target.tagName === 'BUTTON' || 
                                        e.target.tagName === 'A' || 
                                        e.target.tagName === 'INPUT' ||
                                        e.target.closest('button') ||
                                        e.target.closest('a');
          
          if (!isInteractiveElement && (!this.panelSystem.leftPanelCollapsed || !this.panelSystem.rightPanelCollapsed)) {
            console.log('Chat area clicked, closing open panels');
            if (!this.panelSystem.leftPanelCollapsed) {
              this.toggleLeftPanel();
            }
            if (!this.panelSystem.rightPanelCollapsed) {
              this.toggleRightPanel();
            }
          }
        }
      });
    }
  }

  /**
   * Setup resizable panels
   */
  setupResizers() {
    const leftResizer = document.getElementById('left-resizer');
    const rightResizer = document.getElementById('right-resizer');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const centerPanel = document.getElementById('center-panel');

    if (leftResizer && leftPanel && centerPanel) {
      this.setupResizer(leftResizer, leftPanel, centerPanel, 'left');
    }

    if (rightResizer && rightPanel && centerPanel) {
      this.setupResizer(rightResizer, rightPanel, centerPanel, 'right');
    }
  }

  /**
   * Setup individual resizer
   */
  setupResizer(resizer, panel1, panel2, side) {
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const containerRect = document.querySelector('.syzychat-layout').getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      let newWidth;
      if (side === 'left') {
        newWidth = e.clientX - containerRect.left;
        this.panelSystem.leftPanelWidth = Math.max(200, Math.min(600, newWidth));
        panel1.style.width = this.panelSystem.leftPanelWidth + 'px';
        panel1.style.minWidth = this.panelSystem.leftPanelWidth + 'px';
      } else {
        newWidth = containerRect.right - e.clientX;
        this.panelSystem.rightPanelWidth = Math.max(200, Math.min(600, newWidth));
        panel2.style.width = this.panelSystem.rightPanelWidth + 'px';
        panel2.style.minWidth = this.panelSystem.rightPanelWidth + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  /**
   * Setup window resize listener for mobile/desktop transitions
   */
  setupResizeListener() {
    let resizeTimer;
    // Track previous device type
    let wasMobileDevice = this.isMobileDevice();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const isNowMobile = this.isMobileDevice();
        
        // If transitioning from desktop to mobile, collapse both panels
        if (!wasMobileDevice && isNowMobile) {
          if (!this.panelSystem.leftPanelCollapsed) {
            console.log('Transitioning to mobile view, collapsing left panel');
            this.toggleLeftPanel();
          }
          if (!this.panelSystem.rightPanelCollapsed) {
            console.log('Transitioning to mobile view, collapsing right panel');
            this.toggleRightPanel();
          }
        }
        // Update previous device type
        wasMobileDevice = isNowMobile;
      }, 250);
    });
  }

  /**
   * Toggle left panel (Projects & Conversations)
   */
  toggleLeftPanel() {
    this.panelSystem.leftPanelCollapsed = !this.panelSystem.leftPanelCollapsed;
    const leftPanel = document.getElementById('left-panel');
    const leftResizer = document.getElementById('left-resizer');
    
    if (leftPanel) {
      if (this.panelSystem.leftPanelCollapsed) {
        leftPanel.classList.add('collapsed');
        leftPanel.style.width = '0px';
        leftPanel.style.minWidth = '0px';
        leftPanel.style.display = 'none';
        if (leftResizer) leftResizer.style.display = 'none';
      } else {
        leftPanel.classList.remove('collapsed');
        leftPanel.style.width = this.panelSystem.leftPanelWidth + 'px';
        leftPanel.style.minWidth = this.panelSystem.leftPanelWidth + 'px';
        leftPanel.style.display = 'block';
        if (leftResizer) leftResizer.style.display = 'block';
      }
    }
    this.updatePanelToggleButtons();
    console.log('Left panel toggled, collapsed:', this.panelSystem.leftPanelCollapsed);
  }

  /**
   * Toggle right panel (Documents)
   */
  toggleRightPanel() {
    this.panelSystem.rightPanelCollapsed = !this.panelSystem.rightPanelCollapsed;
    const rightPanel = document.getElementById('right-panel');
    const rightResizer = document.getElementById('right-resizer');
    
    if (rightPanel) {
      if (this.panelSystem.rightPanelCollapsed) {
        rightPanel.classList.add('collapsed');
        rightPanel.style.width = '0px';
        rightPanel.style.minWidth = '0px';
        rightPanel.style.display = 'none';
        if (rightResizer) rightResizer.style.display = 'none';
      } else {
        rightPanel.classList.remove('collapsed');
        rightPanel.style.width = this.panelSystem.rightPanelWidth + 'px';
        rightPanel.style.minWidth = this.panelSystem.rightPanelWidth + 'px';
        rightPanel.style.display = 'block';
        if (rightResizer) rightResizer.style.display = 'block';
      }
    }
    this.updatePanelToggleButtons();
    console.log('Right panel toggled, collapsed:', this.panelSystem.rightPanelCollapsed);
  }

  /**
   * Update panel toggle button states
   */
  updatePanelToggleButtons() {
    const leftToggle = document.getElementById('left-panel-toggle');
    const rightToggle = document.getElementById('right-panel-toggle');
    
    if (leftToggle) {
      leftToggle.classList.toggle('active', this.panelSystem.leftPanelCollapsed);
    }
    if (rightToggle) {
      rightToggle.classList.toggle('active', this.panelSystem.rightPanelCollapsed);
    }
  }

  /**
   * Toggle project expansion
   */
  toggleProject(projectId) {
    const project = this.panelSystem.projects.get(projectId);
    if (project) {
      project.expanded = !project.expanded;
      this.renderProjects();
    }
  }

  /**
   * Add new project
   */
  addProject() {
    const name = prompt('Enter project name:', 'New Project');
    if (name && name.trim()) {
      const id = 'project-' + Date.now();
      this.panelSystem.projects.set(id, {
        id: id,
        name: name.trim(),
        conversations: [],
        expanded: true
      });
      this.renderProjects();
    }
  }

  /**
   * Edit project
   */
  editProject(projectId) {
    const project = this.panelSystem.projects.get(projectId);
    if (project) {
      const newName = prompt('Enter new project name:', project.name);
      if (newName && newName.trim()) {
        project.name = newName.trim();
        this.renderProjects();
      }
    }
  }

  /**
   * Delete project
   */
  deleteProject(projectId) {
    if (projectId === 'default') {
      alert('Cannot delete the default project');
      return;
    }
    
    if (confirm('Are you sure you want to delete this project?')) {
      const project = this.panelSystem.projects.get(projectId);
      if (project) {
        // Move conversations to default project
        const defaultProject = this.panelSystem.projects.get('default');
        for (const convId of project.conversations) {
          defaultProject.conversations.push(convId);
        }
        
        this.panelSystem.projects.delete(projectId);
        
        if (this.panelSystem.currentProject === projectId) {
          this.panelSystem.currentProject = 'default';
        }
        
        this.renderProjects();
      }
    }
  }

  /**
   * Add new conversation
   */
  addConversation() {
    const name = prompt('Enter conversation name:', 'New Chat');
    if (name && name.trim()) {
      const id = 'conv-' + Date.now();
      this.panelSystem.conversations.set(id, {
        id: id,
        name: name.trim(),
        projectId: this.panelSystem.currentProject,
        messages: []
      });
      
      // Add to current project
      const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
      if (currentProject) {
        currentProject.conversations.push(id);
      }
      
      this.renderProjects();
    }
  }

  /**
   * Edit conversation
   */
  editConversation(conversationId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (conversation) {
      const newName = prompt('Enter new conversation name:', conversation.name);
      if (newName && newName.trim()) {
        conversation.name = newName.trim();
        this.renderProjects();
      }
    }
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.panelSystem.conversations.delete(conversationId);
      
      // Remove from project
      for (const [projectId, project] of this.panelSystem.projects) {
        const index = project.conversations.indexOf(conversationId);
        if (index > -1) {
          project.conversations.splice(index, 1);
          break;
        }
      }
      
      if (this.panelSystem.currentConversation === conversationId) {
        // Switch to first available conversation
        const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
        if (currentProject && currentProject.conversations.length > 0) {
          this.panelSystem.currentConversation = currentProject.conversations[0];
        } else {
          // Create new conversation
          this.addConversation();
        }
      }
      
      this.renderProjects();
    }
  }

  /**
   * Download a single conversation as JSON
   */
  downloadConversation(conversationId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return;
    }

    const project = this.panelSystem.projects.get(conversation.projectId);
    const downloadData = {
      conversation: {
        id: conversation.id,
        name: conversation.name,
        projectId: conversation.projectId,
        projectName: project ? project.name : 'Unknown Project',
        createdAt: conversation.createdAt,
        lastActivity: conversation.lastActivity,
        messages: conversation.messages
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'SyzyChat'
      }
    };

    this.downloadJSON(downloadData, `conversation-${conversation.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`);
  }

  /**
   * Download all conversations as JSON
   */
  downloadAllConversations() {
    const conversations = Array.from(this.panelSystem.conversations.values());
    const projects = Array.from(this.panelSystem.projects.values());
    
    const downloadData = {
      conversations: conversations.map(conv => {
        const project = this.panelSystem.projects.get(conv.projectId);
        return {
          id: conv.id,
          name: conv.name,
          projectId: conv.projectId,
          projectName: project ? project.name : 'Unknown Project',
          createdAt: conv.createdAt,
          lastActivity: conv.lastActivity,
          messages: conv.messages
        };
      }),
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        lastActivity: project.lastActivity,
        conversationCount: project.conversations.length,
        fileCount: project.files.length
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'SyzyChat',
        totalConversations: conversations.length,
        totalProjects: projects.length
      }
    };

    this.downloadJSON(downloadData, `syzychat-export-${new Date().toISOString().split('T')[0]}.json`);
  }

  /**
   * Download JSON data as a file
   */
  downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`Downloaded: ${filename}`);
  }

  /**
   * Show context menu for conversation
   */
  showConversationContextMenu(event, conversationId) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove any existing context menu
    this.hideContextMenu();
    
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.id = 'conversation-context-menu';
    
    const project = this.panelSystem.projects.get(conversation.projectId);
    const isArchived = conversation.archived || false;
    
    contextMenu.innerHTML = `
      <div class="context-menu-item" onclick="window.syzyChat.shareConversation('${conversationId}')">
        <span class="context-menu-icon">🔗</span>
        <span class="context-menu-text">Share Chat</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.downloadConversation('${conversationId}')">
        <span class="context-menu-icon">💾</span>
        <span class="context-menu-text">Save</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.showConversationDetails('${conversationId}')">
        <span class="context-menu-icon">ℹ️</span>
        <span class="context-menu-text">See Details</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.editConversation('${conversationId}')">
        <span class="context-menu-icon">✏️</span>
        <span class="context-menu-text">Rename</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.toggleConversationArchive('${conversationId}')">
        <span class="context-menu-icon">${isArchived ? '📂' : '📦'}</span>
        <span class="context-menu-text">${isArchived ? 'Unarchive' : 'Archive'}</span>
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item context-menu-danger" onclick="window.syzyChat.deleteConversation('${conversationId}')">
        <span class="context-menu-icon">🗑️</span>
        <span class="context-menu-text">Delete</span>
      </div>
    `;
    
    // Position the context menu
    const rect = event.target.closest('.conversation-item').getBoundingClientRect();
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.zIndex = '10000';
    
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
    }, 0);
  }

  /**
   * Hide context menu
   */
  hideContextMenu() {
    const contextMenu = document.getElementById('conversation-context-menu');
    if (contextMenu) {
      contextMenu.remove();
    }
  }

  /**
   * Share conversation (copy link or export)
   */
  shareConversation(conversationId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;
    
    // For now, just download the conversation
    this.downloadConversation(conversationId);
    
    // Show a toast notification
    this.showToast(`Conversation "${conversation.name}" shared as download`);
  }

  /**
   * Show conversation details
   */
  showConversationDetails(conversationId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;
    
    const project = this.panelSystem.projects.get(conversation.projectId);
    const createdDate = new Date(conversation.createdAt).toLocaleString();
    const lastActivityDate = new Date(conversation.lastActivity).toLocaleString();
    
    const details = `
Conversation Details:
• Name: ${conversation.name}
• Project: ${project ? project.name : 'Unknown'}
• Messages: ${conversation.messages.length}
• Created: ${createdDate}
• Last Activity: ${lastActivityDate}
• Archived: ${conversation.archived ? 'Yes' : 'No'}
• ID: ${conversation.id}
    `.trim();
    
    alert(details);
  }

  /**
   * Toggle conversation archive status
   */
  toggleConversationArchive(conversationId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;
    
    conversation.archived = !conversation.archived;
    conversation.lastActivity = Date.now();
    
    this.saveConversationHistory();
    this.renderDirectories();
    
    const action = conversation.archived ? 'archived' : 'unarchived';
    this.showToast(`Conversation "${conversation.name}" ${action}`);
  }

  /**
   * Show toast notification
   */
  showToast(message, duration = 3000) {
    // Remove existing toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }

  /**
   * Search conversations
   */
  searchConversations(query) {
    this.panelSystem.searchQuery = query.toLowerCase().trim();
    this.renderDirectories();
    
    // Update search results count
    const results = this.getSearchResults();
    if (this.panelSystem.searchQuery && results.length > 0) {
      this.showToast(`Found ${results.length} conversation${results.length === 1 ? '' : 's'}`);
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    const searchInput = document.getElementById('conversation-search');
    if (searchInput) {
      searchInput.value = '';
    }
    this.panelSystem.searchQuery = '';
    this.renderDirectories();
  }

  /**
   * Get search results
   */
  getSearchResults() {
    if (!this.panelSystem.searchQuery) {
      return Array.from(this.panelSystem.conversations.values());
    }

    const query = this.panelSystem.searchQuery;
    const results = [];

    for (const conversation of this.panelSystem.conversations.values()) {
      // Search in conversation name
      if (conversation.name.toLowerCase().includes(query)) {
        results.push(conversation);
        continue;
      }

      // Search in message content
      for (const message of conversation.messages) {
        if (message.content && message.content.toLowerCase().includes(query)) {
          results.push(conversation);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Handle file drop
   */
  handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const inputContainer = event.currentTarget;
    inputContainer.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    this.processFiles(files);
  }

  /**
   * Handle drag over
   */
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const inputContainer = event.currentTarget;
    inputContainer.classList.add('drag-over');
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const inputContainer = event.currentTarget;
    inputContainer.classList.remove('drag-over');
  }

  /**
   * Handle file select
   */
  handleFileSelect(event) {
    const files = event.target.files;
    this.processFiles(files);
  }

  /**
   * Process uploaded files
   */
  processFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.uploadFile(file);
    }
  }

  /**
   * Upload a single file
   */
  uploadFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        content: content,
        uploadedAt: new Date().toISOString()
      };
      
      // Add file to current conversation
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      fileData.id = fileId;
      this.panelSystem.files.set(fileId, fileData);
      
      const currentConversation = this.panelSystem.conversations.get(this.panelSystem.currentConversation);
      if (currentConversation) {
        if (!currentConversation.files) {
          currentConversation.files = [];
        }
        currentConversation.files.push(fileId);
        this.saveConversationHistory();
        this.renderConversationsList();
      }
      
      // Add file info to chat
      this.addFileMessage(fileData);
      
      this.showToast(`File "${file.name}" uploaded successfully`);
    };
    
    reader.onerror = () => {
      this.showToast(`Error reading file "${file.name}"`);
    };
    
    // Read file based on type
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }

  /**
   * Add file message to chat
   */
  addFileMessage(fileData) {
    const messageContent = `📎 **File Uploaded:** ${fileData.name}\n- Size: ${this.formatFileSize(fileData.size)}\n- Type: ${fileData.type}\n- Uploaded: ${new Date(fileData.uploadedAt).toLocaleString()}`;
    
    this.addMessageToConversation(this.panelSystem.currentConversation, 'user', messageContent);
    this.renderMessages();
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Handle file drag start
   */
  handleFileDragStart(event, fileId) {
    event.dataTransfer.setData('text/plain', fileId);
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
  }

  /**
   * Handle project drag start
   */
  handleProjectDragStart(event, projectId) {
    event.dataTransfer.setData('text/plain', projectId);
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
  }

  /**
   * Handle project drag over
   */
  handleProjectDragOver(event, projectId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.target.classList.add('drag-over');
  }

  /**
   * Handle project drop
   */
  handleProjectDrop(event, projectId) {
    event.preventDefault();
    event.target.classList.remove('drag-over');
    
    const fileId = event.dataTransfer.getData('text/plain');
    if (fileId) {
      this.moveFileToProject(fileId, projectId);
    }
  }

  /**
   * Handle conversation drag start
   */
  handleConversationDragStart(event, conversationId) {
    event.dataTransfer.setData('text/plain', conversationId);
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
  }

  /**
   * Show file context menu
   */
  showFileContextMenu(event, fileId) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove any existing context menu
    this.hideContextMenu();
    
    const file = this.panelSystem.files.get(fileId);
    if (!file) return;
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.id = 'file-context-menu';
    
    contextMenu.innerHTML = `
      <div class="context-menu-item" onclick="window.syzyChat.downloadFile('${fileId}')">
        <span class="context-menu-icon">💾</span>
        <span class="context-menu-text">Download</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.moveFileToProject('${fileId}')">
        <span class="context-menu-icon">📁</span>
        <span class="context-menu-text">Move to Project</span>
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item context-menu-danger" onclick="window.syzyChat.deleteFile('${fileId}')">
        <span class="context-menu-icon">🗑️</span>
        <span class="context-menu-text">Delete</span>
      </div>
    `;
    
    // Position the context menu
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.zIndex = '10000';
    
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
    }, 0);
  }

  /**
   * Download file
   */
  downloadFile(fileId) {
    const file = this.panelSystem.files.get(fileId);
    if (!file) return;
    
    const blob = new Blob([file.content], { type: file.type });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded: ${file.name}`);
  }

  /**
   * Move file to project scope
   */
  moveFileToProject(fileId) {
    const file = this.panelSystem.files.get(fileId);
    if (!file) return;
    
    const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
    if (!currentProject) return;
    
    // Remove from conversation if it's there
    for (const conversation of this.panelSystem.conversations.values()) {
      if (conversation.files && conversation.files.includes(fileId)) {
        conversation.files = conversation.files.filter(id => id !== fileId);
        break;
      }
    }
    
    // Add to project
    if (!currentProject.files) {
      currentProject.files = [];
    }
    if (!currentProject.files.includes(fileId)) {
      currentProject.files.push(fileId);
    }
    
    this.saveConversationHistory();
    this.renderConversationsList();
    this.showToast(`Moved "${file.name}" to project scope`);
  }

  /**
   * Add file to project via context menu
   */
  addFileToProject(projectId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.txt,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif';
    
    fileInput.onchange = (event) => {
      const files = Array.from(event.target.files);
      files.forEach(file => {
        this.uploadFileToProject(file, projectId);
      });
    };
    
    fileInput.click();
  }

  /**
   * Upload file directly to project
   */
  uploadFileToProject(file, projectId) {
    const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const fileData = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: Date.now(),
      projectId: projectId
    };
    
    // Store file data
    this.panelSystem.files.set(fileId, fileData);
    
    // Add to project
    const project = this.panelSystem.projects.get(projectId);
    if (project) {
      if (!project.files) {
        project.files = [];
      }
      project.files.push(fileId);
    }
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      fileData.content = e.target.result;
      this.panelSystem.files.set(fileId, fileData);
      this.saveConversationHistory();
      this.renderProjectsList();
      this.renderConversationsList();
      this.showToast(`File "${file.name}" added to project`);
    };
    
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }

  /**
   * Delete file
   */
  deleteFile(fileId) {
    if (confirm('Are you sure you want to delete this file?')) {
      const file = this.panelSystem.files.get(fileId);
      if (!file) return;
      
      // Remove from all projects and conversations
      for (const project of this.panelSystem.projects.values()) {
        if (project.files) {
          project.files = project.files.filter(id => id !== fileId);
        }
      }
      
      for (const conversation of this.panelSystem.conversations.values()) {
        if (conversation.files) {
          conversation.files = conversation.files.filter(id => id !== fileId);
        }
      }
      
      this.panelSystem.files.delete(fileId);
      this.saveConversationHistory();
      this.renderConversationsList();
      this.showToast(`Deleted: ${file.name}`);
    }
  }

  /**
   * Show project context menu
   */
  showProjectContextMenu(event, projectId) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove any existing context menu
    this.hideContextMenu();
    
    const project = this.panelSystem.projects.get(projectId);
    if (!project) return;
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.id = 'project-context-menu';
    
    contextMenu.innerHTML = `
      <div class="context-menu-item" onclick="window.syzyChat.addFileToProject('${projectId}')">
        <span class="context-menu-icon">📎</span>
        <span class="context-menu-text">Add File</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.editProject('${projectId}')">
        <span class="context-menu-icon">✏️</span>
        <span class="context-menu-text">Rename</span>
      </div>
      <div class="context-menu-item" onclick="window.syzyChat.downloadProject('${projectId}')">
        <span class="context-menu-icon">💾</span>
        <span class="context-menu-text">Download All</span>
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item context-menu-danger" onclick="window.syzyChat.deleteProject('${projectId}')">
        <span class="context-menu-icon">🗑️</span>
        <span class="context-menu-text">Delete</span>
      </div>
    `;
    
    // Position the context menu
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.zIndex = '10000';
    
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
    }, 0);
  }

  /**
   * Edit project name
   */
  editProject(projectId) {
    const project = this.panelSystem.projects.get(projectId);
    if (!project) return;
    
    const newName = prompt('Enter new project name:', project.name);
    if (newName && newName.trim() && newName !== project.name) {
      project.name = newName.trim();
      project.lastActivity = Date.now();
      this.saveConversationHistory();
      this.renderProjectsList();
      this.showToast(`Project renamed to "${newName}"`);
    }
  }

  /**
   * Download all conversations and files from project
   */
  downloadProject(projectId) {
    const project = this.panelSystem.projects.get(projectId);
    if (!project) return;
    
    const conversations = (project.conversations || [])
      .map(id => this.panelSystem.conversations.get(id))
      .filter(conv => conv);
    
    const files = (project.files || [])
      .map(id => this.panelSystem.files.get(id))
      .filter(file => file);
    
    const downloadData = {
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        lastActivity: project.lastActivity,
        conversations: conversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          createdAt: conv.createdAt,
          lastActivity: conv.lastActivity,
          messages: conv.messages
        })),
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: file.uploadedAt
        }))
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'SyzyChat'
      }
    };

    this.downloadJSON(downloadData, `project-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`);
  }

  /**
   * Delete project
   */
  deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This will delete all conversations and files in this project.')) {
      const project = this.panelSystem.projects.get(projectId);
      if (!project) return;
      
      // Don't allow deleting the default project
      if (projectId === 'default') {
        this.showToast('Cannot delete the default project');
        return;
      }
      
      // Delete all conversations in this project
      for (const conversationId of project.conversations || []) {
        this.panelSystem.conversations.delete(conversationId);
      }
      
      // Delete all files in this project
      for (const fileId of project.files || []) {
        this.panelSystem.files.delete(fileId);
      }
      
      // Delete the project
      this.panelSystem.projects.delete(projectId);
      
      // Switch to default project if this was the current project
      if (this.panelSystem.currentProject === projectId) {
        this.panelSystem.currentProject = 'default';
        this.panelSystem.currentConversation = 'conv-1';
      }
      
      this.saveConversationHistory();
      this.renderProjectsList();
      this.renderConversationsList();
      this.showToast(`Deleted project "${project.name}"`);
    }
  }

  /**
   * Switch to a conversation
   */
  switchConversation(conversationId) {
    this.panelSystem.currentConversation = conversationId;
    this.renderProjects();
    this.updateChatTitle();
    
    // Emit event for external handling
    if (this.options.onConversationSwitch) {
      this.options.onConversationSwitch(conversationId);
    }
  }

  /**
   * Update chat title to show current conversation name
   */
  updateChatTitle() {
    const chatTitle = document.getElementById('chat-title');
    if (!chatTitle) return;
    
    const conversation = this.panelSystem.conversations.get(this.panelSystem.currentConversation);
    if (conversation) {
      chatTitle.textContent = conversation.name || 'Untitled Chat';
    } else {
      chatTitle.textContent = 'SyzyChat';
    }
  }

  /**
   * Toggle between dark and light theme
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('syzychat-theme', this.currentTheme);
    this.applyTheme();
    this.updateThemeButton();
  }

  /**
   * Apply the current theme
   */
  applyTheme() {
    const body = document.body;
    const container = document.querySelector('.syzychat-layout');
    
    if (this.currentTheme === 'dark') {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      if (container) {
        container.classList.remove('light-theme');
        container.classList.add('dark-theme');
      }
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      if (container) {
        container.classList.remove('dark-theme');
        container.classList.add('light-theme');
      }
    }
  }

  /**
   * Update theme toggle button icon
   */
  updateThemeButton() {
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
      themeButton.title = this.currentTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    }
  }

  /**
   * Check AI service availability
   */
  async checkAIStatus() {
    try {
      // Check if we have a valid OpenRouter API key
      if (this.options.openRouterApiKey && this.options.openRouterApiKey !== 'demo-key') {
        // Test OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.options.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SyzyChat'
          },
          body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: 'test'
              }
            ],
            max_tokens: 10
          })
        });
        
        if (response.ok) {
          this.aiStatus.available = true;
          this.aiStatus.errorCount = 0;
          this.aiStatus.lastCheck = new Date();
          this.updateAIStatusLight();
          return true;
        }
      }

      // No valid API key or API failed
      this.aiStatus.available = false;
      this.aiStatus.errorCount = this.aiStatus.maxErrors;
      this.aiStatus.lastCheck = new Date();
      this.updateAIStatusLight();
      return false;
      
    } catch (error) {
      console.error('AI status check failed:', error);
      this.aiStatus.available = false;
      this.aiStatus.errorCount++;
      this.aiStatus.lastCheck = new Date();
      this.updateAIStatusLight();
      return false;
    }
  }

  /**
   * Update AI status light
   */
  updateAIStatusLight() {
    let statusLight = document.getElementById('ai-status-light');
    const centerPanel = document.getElementById('center-panel');
    
    if (!statusLight) {
      // Create status light if it doesn't exist
      statusLight = document.createElement('div');
      statusLight.id = 'ai-status-light';
      statusLight.className = 'ai-status-light';
      
      // Add to the center panel header
      if (centerPanel) {
        const header = centerPanel.querySelector('.chat-header');
        if (header) {
          // Add to the chat controls section
          const controls = header.querySelector('.chat-controls');
          if (controls) {
            controls.appendChild(statusLight);
          } else {
            header.appendChild(statusLight);
          }
        }
      }
    }
    
    // Update status based on availability
    if (this.aiStatus.available) {
      statusLight.className = 'ai-status-light ai-status-online';
      statusLight.title = 'AI Service Online';
      statusLight.innerHTML = '🟢';
      
      // Update center panel border
      if (centerPanel) {
        centerPanel.className = centerPanel.className.replace(/ai-status-\w+/g, '');
        centerPanel.classList.add('ai-status-online');
      }
    } else if (this.aiStatus.errorCount >= this.aiStatus.maxErrors) {
      statusLight.className = 'ai-status-light ai-status-offline';
      statusLight.title = 'AI Service Offline';
      statusLight.innerHTML = '🔴';
      
      // Update center panel border
      if (centerPanel) {
        centerPanel.className = centerPanel.className.replace(/ai-status-\w+/g, '');
        centerPanel.classList.add('ai-status-offline');
      }
    } else {
      statusLight.className = 'ai-status-light ai-status-checking';
      statusLight.title = 'Checking AI Service...';
      statusLight.innerHTML = '🟡';
      
      // Update center panel border
      if (centerPanel) {
        centerPanel.className = centerPanel.className.replace(/ai-status-\w+/g, '');
        centerPanel.classList.add('ai-status-checking');
      }
    }
  }

  /**
   * Record AI error and update status
   */
  recordAIError() {
    this.aiStatus.errorCount++;
    this.aiStatus.available = false;
    this.updateAIStatusLight();
  }

  /**
   * Record AI success and update status
   */
  recordAISuccess() {
    this.aiStatus.available = true;
    this.aiStatus.errorCount = 0;
    this.updateAIStatusLight();
  }

  /**
   * Switch to a project
   */
  switchProject(projectId) {
    this.panelSystem.currentProject = projectId;
    this.renderProjects();
    this.updateChatTitle();
    
    // Emit event for external handling
    if (this.options.onProjectSwitch) {
      this.options.onProjectSwitch(projectId);
    }
  }

  /**
   * Add new document
   */
  addDocument() {
    const name = prompt('Enter document name:');
    if (name && name.trim()) {
      const id = 'doc-' + Date.now();
      this.panelSystem.documents.set(id, {
        id: id,
        name: name.trim(),
        content: '',
        createdAt: new Date().toISOString()
      });
      
      this.renderDocuments();
    }
  }

  /**
   * Edit document
   */
  editDocument(documentId) {
    const document = this.panelSystem.documents.get(documentId);
    if (document) {
      const newName = prompt('Enter new document name:', document.name);
      if (newName && newName.trim()) {
        document.name = newName.trim();
        this.renderDocuments();
      }
    }
  }

  /**
   * Delete document
   */
  deleteDocument(documentId) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.panelSystem.documents.delete(documentId);
      this.renderDocuments();
    }
  }

  /**
   * Open document
   */
  openDocument(documentId) {
    const document = this.panelSystem.documents.get(documentId);
    if (document) {
      // Emit event for external handling
      if (this.options.onDocumentOpen) {
        this.options.onDocumentOpen(documentId, document);
      }
      console.log('Opening document:', document.name);
    }
  }

  /**
   * Create a new conversation when chat starts
   */
  createConversationFromChat() {
    // Check if we already have a conversation for this chat
    if (this.panelSystem.conversations.has(this.panelSystem.currentConversation)) {
      return this.panelSystem.currentConversation;
    }
    
    // Create a new conversation
    const conversationId = 'conv-' + Date.now();
    const conversationName = 'New Conversation';
    
    this.panelSystem.conversations.set(conversationId, {
      id: conversationId,
      name: conversationName,
      projectId: this.panelSystem.currentProject,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
    
    // Add to current project
    const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
    if (currentProject) {
      currentProject.conversations.push(conversationId);
    }
    
    // Set as current conversation
    this.panelSystem.currentConversation = conversationId;
    
    // Re-render the list
    this.renderProjects();
    
    console.log('Created new conversation:', conversationId);
    return conversationId;
  }

  /**
   * Update conversation name using AI
   */
  async updateConversationNameWithAI(conversationId, firstMessage) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation || conversation.name !== 'New Conversation') {
      return;
    }

    try {
      // Use AI to generate a better title
      const title = await this.generateConversationTitle(firstMessage);
      if (title) {
        conversation.name = title;
        conversation.lastActivity = new Date().toISOString();
        this.renderProjects();
        console.log('Updated conversation title with AI:', title);
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error);
      // Fallback to simple title
      this.updateConversationName(conversationId, firstMessage);
    }
  }

  /**
   * Generate conversation title using AI
   */
  async generateConversationTitle(message) {
    try {
      // Try AI backend first
      if (this.options.backendUrl && !this.options.backendUrl.includes('lambda-url.us-east-1.on.aws')) {
        const response = await fetch(this.options.backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Generate a short, descriptive title (max 50 characters) for a conversation that starts with this message. Return only the title, no quotes or extra text.'
              },
              {
                role: 'user',
                content: message
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.recordAISuccess();
          return data.reply ? data.reply.trim() : null;
        }
      }

      // Fallback: Use OpenRouter API directly
      if (this.options.openRouterApiKey && this.options.openRouterApiKey !== 'demo-key') {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.options.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SyzyChat'
          },
          body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Generate a short, descriptive title (max 50 characters) for a conversation that starts with this message. Return only the title, no quotes or extra text.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 50,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.recordAISuccess();
          return data.choices?.[0]?.message?.content?.trim() || null;
        }
      }

      // Final fallback: Generate simple title from message
      this.recordAIError();
      return this.generateSimpleTitle(message);
      
    } catch (error) {
      console.error('AI title generation failed:', error);
      this.recordAIError();
      return this.generateSimpleTitle(message);
    }
  }

  /**
   * Generate simple title from message content
   */
  generateSimpleTitle(message) {
    // Remove common prefixes and clean up
    let title = message
      .replace(/^(hello|hi|hey|test|can you|please|help|how|what|when|where|why|who)\s*/i, '')
      .replace(/[.!?]+$/, '')
      .trim();
    
    // Truncate to 50 characters
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    // If empty, use default
    if (!title) {
      title = 'New Conversation';
    }
    
    return title;
  }

  /**
   * Update conversation name based on first message (fallback)
   */
  updateConversationName(conversationId, firstMessage) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (conversation && conversation.name === 'New Conversation') {
      // Extract a meaningful name from the first message
      let newName = firstMessage.substring(0, 50);
      if (firstMessage.length > 50) {
        newName += '...';
      }
      conversation.name = newName;
      conversation.lastActivity = new Date().toISOString();
      this.renderProjects();
    }
  }

  /**
   * Send message from chat input
   */
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to current conversation
    if (this.panelSystem.currentConversation) {
      this.addMessageToConversation(this.panelSystem.currentConversation, 'user', message);
      this.renderMessages();
      
      // Clear input
      input.value = '';
      
      // Update conversation name with AI if this is the first message
      const conversation = this.panelSystem.conversations.get(this.panelSystem.currentConversation);
      if (conversation && conversation.messages.length === 1) {
        this.updateConversationNameWithAI(this.panelSystem.currentConversation, message);
      }
      
      // Get AI response
      try {
        const aiResponse = await this.getAIResponse(message);
        this.addMessageToConversation(this.panelSystem.currentConversation, 'assistant', aiResponse);
        this.renderMessages();
        this.recordAISuccess();
      } catch (error) {
        console.error('AI response failed:', error);
        this.addMessageToConversation(this.panelSystem.currentConversation, 'assistant', 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again later.');
        this.renderMessages();
        this.recordAIError();
      }
    }
  }

  /**
   * Get AI response for a message
   */
  async getAIResponse(message) {
    // Try OpenRouter API directly
    if (this.options.openRouterApiKey && this.options.openRouterApiKey !== 'demo-key') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.options.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SyzyChat'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant integrated into SyzyChat. Provide helpful, concise responses. You can help with coding, general questions, and creative tasks.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      }
    }

    // Fallback: Use a simple response generator
    return this.generateSimpleResponse(message);
  }

  /**
   * Generate simple response when AI is not available
   */
  generateSimpleResponse(message) {
    const responses = [
      `I understand you said: "${message}". I'm a simple AI assistant. For full AI capabilities, please configure an OpenRouter API key.`,
      `Thanks for your message: "${message}". I'm currently running in demo mode. To get AI responses, please add your OpenRouter API key in the settings.`,
      `I received: "${message}". I'm a basic assistant right now. For advanced AI features, please set up your API credentials.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Add message to conversation history
   */
  addMessageToConversation(conversationId, role, content, options = {}) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;

    const message = {
      role: role,
      content: content,
      options: options,
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date().toISOString();

    // Save to localStorage
    this.saveConversationHistory();

    console.log('Added message to conversation:', conversationId, 'Total messages:', conversation.messages.length);
  }

  /**
   * Load conversation history from localStorage
   */
  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('syzychat-conversations');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Restore conversations
        if (data.conversations) {
          for (const [id, conv] of Object.entries(data.conversations)) {
            this.panelSystem.conversations.set(id, conv);
          }
        }
        
        // Restore projects with conversations
        if (data.projects) {
          for (const [id, project] of Object.entries(data.projects)) {
            this.panelSystem.projects.set(id, project);
          }
        }
        
        console.log('Loaded conversation history:', this.panelSystem.conversations.size, 'conversations');
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  /**
   * Save conversation history to localStorage
   */
  saveConversationHistory() {
    try {
      const data = {
        conversations: Object.fromEntries(this.panelSystem.conversations),
        projects: Object.fromEntries(this.panelSystem.projects),
        currentProject: this.panelSystem.currentProject,
        currentConversation: this.panelSystem.currentConversation,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('syzychat-conversations', JSON.stringify(data));
      console.log('Saved conversation history');
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  /**
   * Setup drop zones for project dropdown options
   */
  setupProjectDropZones() {
    const projectSelect = document.getElementById('project-select');
    if (!projectSelect) return;

    // Add drop event listeners to each option
    const options = projectSelect.querySelectorAll('option');
    options.forEach(option => {
      option.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        option.classList.add('drop-target');
      });

      option.addEventListener('dragleave', (e) => {
        option.classList.remove('drop-target');
      });

      option.addEventListener('drop', (e) => {
        e.preventDefault();
        option.classList.remove('drop-target');
        
        const conversationId = e.dataTransfer.getData('text/plain');
        const targetProjectId = option.value;
        
        if (conversationId && targetProjectId) {
          this.moveConversationToProject(conversationId, targetProjectId);
        }
      });
    });
  }

  /**
   * Handle drag start
   */
  handleDragStart(event, conversationId) {
    event.dataTransfer.setData('text/plain', conversationId);
    event.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    event.target.classList.add('dragging');
    
    // Show drop zones
    this.showProjectDropZones();
    
    console.log('Started dragging conversation:', conversationId);
  }

  /**
   * Handle drag end
   */
  handleDragEnd(event) {
    event.target.classList.remove('dragging');
    
    // Hide drop zones
    this.hideProjectDropZones();
    
    console.log('Finished dragging conversation');
  }

  /**
   * Show visual feedback for drop zones
   */
  showProjectDropZones() {
    const projectSelect = document.getElementById('project-select');
    if (!projectSelect) return;

    projectSelect.classList.add('drop-zone-active');
    
    // Add visual indicator
    const dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    dropIndicator.textContent = 'Drop conversation on project to move it';
    projectSelect.parentNode.appendChild(dropIndicator);
  }

  /**
   * Hide visual feedback for drop zones
   */
  hideProjectDropZones() {
    const projectSelect = document.getElementById('project-select');
    if (!projectSelect) return;

    projectSelect.classList.remove('drop-zone-active');
    
    // Remove visual indicator
    const dropIndicator = document.querySelector('.drop-indicator');
    if (dropIndicator) {
      dropIndicator.remove();
    }
  }

  /**
   * Move conversation to different project
   */
  moveConversationToProject(conversationId, targetProjectId) {
    const conversation = this.panelSystem.conversations.get(conversationId);
    if (!conversation) return;

    const sourceProject = this.panelSystem.projects.get(conversation.projectId);
    const targetProject = this.panelSystem.projects.get(targetProjectId);
    
    if (!sourceProject || !targetProject) return;

    // Remove from source project
    const sourceIndex = sourceProject.conversations.indexOf(conversationId);
    if (sourceIndex > -1) {
      sourceProject.conversations.splice(sourceIndex, 1);
    }

    // Add to target project
    targetProject.conversations.push(conversationId);

    // Update conversation's project
    conversation.projectId = targetProjectId;

    // Save changes
    this.saveConversationHistory();

    // Re-render if we're viewing the source project
    if (this.panelSystem.currentProject === conversation.projectId) {
      this.renderDirectories();
    }

    console.log(`Moved conversation ${conversationId} from ${sourceProject.name} to ${targetProject.name}`);
  }

  /**
   * Toggle directory expansion
   */
  toggleDirectory(directoryName) {
    if (this.panelSystem.directories[directoryName]) {
      this.panelSystem.directories[directoryName].expanded = !this.panelSystem.directories[directoryName].expanded;
      this.renderDirectories();
    }
  }

  /**
   * Add file to project
   */
  addFile() {
    const name = prompt('Enter file name:');
    if (name && name.trim()) {
      const fileId = 'file-' + Date.now();
      const file = {
        id: fileId,
        name: name.trim(),
        content: '',
        size: '0 bytes',
        projectId: this.panelSystem.currentProject,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      this.panelSystem.files.set(fileId, file);
      
      // Add to current project
      const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
      if (currentProject) {
        if (!currentProject.files) currentProject.files = [];
        currentProject.files.push(fileId);
      }
      
      this.renderDirectories();
      this.saveConversationHistory();
    }
  }

  /**
   * Open file
   */
  openFile(fileId) {
    const file = this.panelSystem.files.get(fileId);
    if (file) {
      console.log('Opening file:', file.name);
      // TODO: Implement file viewer/editor
    }
  }

  /**
   * Edit file
   */
  editFile(fileId) {
    const file = this.panelSystem.files.get(fileId);
    if (file) {
      const newName = prompt('Enter new file name:', file.name);
      if (newName && newName.trim()) {
        file.name = newName.trim();
        file.lastModified = new Date().toISOString();
        this.renderDirectories();
        this.saveConversationHistory();
      }
    }
  }

  /**
   * Delete file
   */
  deleteFile(fileId) {
    if (confirm('Are you sure you want to delete this file?')) {
      this.panelSystem.files.delete(fileId);
      
      // Remove from project
      const currentProject = this.panelSystem.projects.get(this.panelSystem.currentProject);
      if (currentProject && currentProject.files) {
        const index = currentProject.files.indexOf(fileId);
        if (index > -1) {
          currentProject.files.splice(index, 1);
        }
      }
      
      this.renderDirectories();
      this.saveConversationHistory();
    }
  }

  /**
   * RAG: Add knowledge chunk
   */
  addKnowledgeChunk(content, source, metadata = {}) {
    const chunkId = 'chunk-' + Date.now();
    const chunk = {
      id: chunkId,
      content: content,
      source: source,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      projectId: this.panelSystem.currentProject
    };
    
    this.panelSystem.rag.knowledgeBase.set(chunkId, chunk);
    
    // Generate embedding for similarity search
    this.generateEmbedding(content).then(embedding => {
      this.panelSystem.rag.embeddings.set(chunkId, embedding);
    });
    
    console.log('Added knowledge chunk:', chunkId);
  }

  /**
   * RAG: Search knowledge base
   */
  async searchKnowledge(query, limit = 5) {
    if (!this.panelSystem.rag.enabled) return [];
    
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results = [];
      
      for (const [chunkId, embedding] of this.panelSystem.rag.embeddings) {
        const similarity = this.calculateSimilarity(queryEmbedding, embedding);
        if (similarity > 0.7) { // Threshold for relevance
          const chunk = this.panelSystem.rag.knowledgeBase.get(chunkId);
          if (chunk) {
            results.push({ ...chunk, similarity });
          }
        }
      }
      
      // Sort by similarity and return top results
      return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
    } catch (error) {
      console.error('Knowledge search failed:', error);
      return [];
    }
  }

  /**
   * Generate embedding for text (simplified)
   */
  async generateEmbedding(text) {
    // Simplified embedding - in production, use a proper embedding service
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // 384-dimensional embedding
    
    words.forEach(word => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity
   */
  calculateSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      openRouter: this.options.openRouterApiKey ? 'Connected' : 'Not configured',
      darkMode: this.options.darkMode ? 'Enabled' : 'Disabled',
      features: {
        emoji: this.options.enableEmoji,
        markdown: this.options.enableMarkdown,
        mermaid: this.options.enableMermaid,
        html: this.options.enableHTML,
        darkMode: this.options.enableDarkMode
      },
      panelSystem: this.panelSystem ? 'initialized' : 'not configured'
    };
  }
}

// Make SyzyChat available globally
window.SyzyChat = SyzyChat;