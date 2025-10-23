/**
 * SyzyChat Formul8 Plugin
 * 
 * Custom message formatter for Formul8 Multiagent System
 * Handles:
 * - Agent metadata badges
 * - Plan information
 * - Token usage and cost
 * - Upgrade prompts and callouts
 * - Formul8-specific markdown extensions
 * 
 * Usage:
 * ```javascript
 * const chat = new SyzyChat({
 *     formatter: Formul8MessageFormatter,
 *     messagesContainer: '#messages',
 *     inputElement: '#input',
 *     sendButton: '#send-btn',
 *     backendUrl: 'https://f8.syzygyx.com/api/chat'
 * });
 * ```
 * 
 * @version 1.0.0
 * @author Formul8 AI
 */

(function(global) {
    'use strict';

    /**
     * Formul8 Message Formatter
     * Extends DefaultMessageFormatter with Formul8-specific features
     */
    class Formul8MessageFormatter {
        /**
         * Escape HTML to prevent XSS
         */
        static escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Format assistant message with Formul8 metadata and features
         */
        static formatAssistantMessage(text, options = {}) {
            // Extract metadata (Agent, Plan, Tokens, Cost)
            const metadataRegex = /---\s*\*Agent:\s*([^|]+)\s*\|\s*Plan:\s*([^|]+)\s*\|\s*Tokens:\s*([^|]+)\s*\|\s*Cost:\s*([^)]+)\)\s*\*\s*/;
            const metadataMatch = text.match(metadataRegex);
            
            let metadata = null;
            let mainContent = text;
            
            if (metadataMatch) {
                metadata = {
                    agent: metadataMatch[1].trim(),
                    plan: metadataMatch[2].trim(),
                    tokens: metadataMatch[3].trim(),
                    cost: metadataMatch[4].trim()
                };
                mainContent = text.replace(metadataRegex, '');
            }
            
            // Extract upgrade prompts
            const upgradeRegex = /---\s*(💎|💡|🔓|🚀|⭐)\s*\*\*([^*]+)\*\*([^]*?)(?=---|$)/g;
            let upgradePrompts = [];
            let match;
            
            while ((match = upgradeRegex.exec(mainContent)) !== null) {
                upgradePrompts.push({
                    emoji: match[1],
                    title: match[2].trim(),
                    content: match[3].trim()
                });
            }
            
            // Remove upgrade prompts from main content
            mainContent = mainContent.replace(upgradeRegex, '');
            mainContent = mainContent.replace(/---\s*$/g, '').trim();
            
            // Convert markdown
            mainContent = this.markdownToHtml(mainContent);
            
            // Build formatted HTML
            let html = `<div class="message-main-content">${mainContent}</div>`;
            
            // Add metadata badges if present
            if (metadata) {
                html += `
                    <div class="message-metadata">
                        <span class="metadata-badge">🤖 <strong>${metadata.agent}</strong></span>
                        <span class="metadata-badge">📋 ${metadata.plan}</span>
                        <span class="metadata-badge">🎯 ${metadata.tokens} tokens</span>
                        <span class="metadata-badge">💰 ${metadata.cost}</span>
                    </div>
                `;
            }
            
            // Add upgrade prompts as callouts
            if (upgradePrompts.length > 0) {
                upgradePrompts.forEach(prompt => {
                    const lines = prompt.content.split(/\n|<br>/);
                    const bullets = [];
                    const links = [];
                    
                    lines.forEach(line => {
                        line = line.trim();
                        if (line.startsWith('•') || line.startsWith('-')) {
                            bullets.push(line.substring(1).trim());
                        } else if (line.includes('<a href=')) {
                            const linkMatches = line.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g);
                            for (const linkMatch of linkMatches) {
                                links.push({ url: linkMatch[1], text: linkMatch[2] });
                            }
                        }
                    });
                    
                    html += `
                        <div class="upgrade-callout">
                            <h4>${prompt.emoji} ${prompt.title}</h4>
                            ${bullets.length > 0 ? `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
                            ${links.length > 0 ? `<div class="upgrade-links">${links.map(l => `<a href="${l.url}" class="upgrade-link" target="_blank" rel="noopener noreferrer">${l.text}</a>`).join('')}</div>` : ''}
                        </div>
                    `;
                });
            }
            
            return html;
        }

        /**
         * Format user message
         */
        static formatUserMessage(text) {
            return this.escapeHtml(text).replace(/\n/g, '<br>');
        }

        /**
         * Markdown to HTML conversion with Formul8 extensions
         */
        static markdownToHtml(text) {
            // Code blocks with syntax highlighting
            text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
            });
            
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            // Bold, italic, bold+italic
            text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
            text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
            text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
            text = text.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Links
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            
            // Headers
            text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
            text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
            
            // Blockquotes
            text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
            
            // Horizontal rules
            text = text.replace(/^---$/gm, '<hr>');
            text = text.replace(/^\*\*\*$/gm, '<hr>');
            
            // Lists
            text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^• (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^\* (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
            
            // Wrap consecutive <li> tags in <ul>
            text = text.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
                return `<ul>${match}</ul>`;
            });
            
            // Tables (simple Markdown tables)
            text = text.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headerCells = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
                const rowsHtml = rows.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
            });
            
            // Line breaks
            text = text.replace(/\n/g, '<br>');
            
            return text;
        }
    }

    // Export to global scope
    global.Formul8MessageFormatter = Formul8MessageFormatter;

    // Log plugin loaded
    console.log('%c[SyzyChat] Formul8 Plugin Loaded', 'color: #00ff88; font-weight: bold;');

})(typeof window !== 'undefined' ? window : this);

