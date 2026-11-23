/**
 * ============================================================================
 * MINDMATE — CLIENT APPLICATION
 * Calm, thoughtful AI mental health companion.
 * Features: Session history, LocalStorage persistence, Speech & Voice,
 * Copy & Read-Aloud utilities, Dark/Light theme, Strict DOM Security.
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================================
    // STORAGE KEYS & CONSTANTS
    // ============================================================================
    const STORAGE_KEY_SESSIONS = "mindmate_sessions_v2";
    const STORAGE_KEY_ACTIVE = "mindmate_active_session_id_v2";
    const STORAGE_KEY_THEME = "mindmate_theme_v2";

    // ============================================================================
    // DOM ELEMENT REFERENCES
    // ============================================================================
    const appLayout = document.getElementById("appLayout");
    const chatSidebar = document.getElementById("chatSidebar");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const headerNewChatBtn = document.getElementById("headerNewChatBtn");
    const historyList = document.getElementById("historyList");
    const historyEmpty = document.getElementById("historyEmpty");
    const sidebarThemeBtn = document.getElementById("sidebarThemeBtn");
    const headerThemeBtn = document.getElementById("headerThemeBtn");
    const clearAllHistoryBtn = document.getElementById("clearAllHistoryBtn");

    const chatArea = document.getElementById("chatArea");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const micButton = document.getElementById("micButton");
    const chatForm = document.getElementById("chatForm");
    const welcomeSection = document.getElementById("welcomeSection");
    const suggestionsSection = document.getElementById("suggestionsSection");
    const statusNotice = document.getElementById("statusNotice");
    const noticeIcon = document.getElementById("noticeIcon");
    const noticeText = document.getElementById("noticeText");
    const noticeClose = document.getElementById("noticeClose");

    const confirmModal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const modalConfirmBtn = document.getElementById("modalConfirmBtn");
    const metaThemeColor = document.getElementById("metaThemeColor");

    // ============================================================================
    // APPLICATION STATE
    // ============================================================================
    let sessions = [];
    let currentSessionId = null;
    let isSending = false;
    let isRecording = false;
    let speechRecognition = null;
    let noticeTimeout = null;
    let activeUtterance = null;
    let activeSpeakingButton = null;
    let pendingModalAction = null;

    // ============================================================================
    // ICONS (LUCIDE-STYLE SVG STRINGS FOR DYNAMIC RENDERING)
    // ============================================================================
    const ICONS = {
        messageSquare: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
        check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        volume: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
        volumeX: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`,
        sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`
    };

    // ============================================================================
    // THEME MANAGEMENT (DARK / LIGHT MODE)
    // ============================================================================

    function initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
        const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const currentTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
        setTheme(currentTheme, false);
    }

    function setTheme(theme, save = true) {
        document.documentElement.setAttribute("data-theme", theme);
        if (save) {
            localStorage.setItem(STORAGE_KEY_THEME, theme);
        }

        const isDark = theme === "dark";
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", isDark ? "#0E1612" : "#287653");
        }

        // Update Theme Button Icons & Labels
        const iconHtml = isDark ? ICONS.sun : ICONS.moon;
        const labelText = isDark ? "Light Mode" : "Dark Mode";

        if (sidebarThemeBtn) {
            const iconSlot = sidebarThemeBtn.querySelector(".theme-icon-slot");
            const textSlot = sidebarThemeBtn.querySelector(".theme-text");
            if (iconSlot) iconSlot.innerHTML = iconHtml;
            if (textSlot) textSlot.textContent = labelText;
        }

        if (headerThemeBtn) {
            headerThemeBtn.innerHTML = iconHtml;
            headerThemeBtn.setAttribute("title", `Switch to ${labelText}`);
            headerThemeBtn.setAttribute("aria-label", `Switch to ${labelText}`);
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(newTheme, true);
    }

    if (sidebarThemeBtn) sidebarThemeBtn.addEventListener("click", toggleTheme);
    if (headerThemeBtn) headerThemeBtn.addEventListener("click", toggleTheme);

    // ============================================================================
    // SIDEBAR DRAWER MANAGEMENT
    // ============================================================================

    function openMobileSidebar() {
        if (chatSidebar) chatSidebar.classList.add("is-open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("is-open");
    }

    function closeMobileSidebar() {
        if (chatSidebar) chatSidebar.classList.remove("is-open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("is-open");
    }

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            if (chatSidebar.classList.contains("is-open")) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        } else {
            chatSidebar.classList.toggle("is-collapsed");
        }
    }

    if (sidebarToggleBtn) sidebarToggleBtn.addEventListener("click", toggleSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    // ============================================================================
    // MODAL DIALOG MANAGEMENT
    // ============================================================================

    function showConfirmModal(title, message, confirmText, onConfirm) {
        if (!confirmModal) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirmBtn.textContent = confirmText || "Delete";
        pendingModalAction = onConfirm;
        confirmModal.style.display = "flex";
    }

    function hideConfirmModal() {
        if (!confirmModal) return;
        confirmModal.style.display = "none";
        pendingModalAction = null;
    }

    if (modalCancelBtn) modalCancelBtn.addEventListener("click", hideConfirmModal);
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener("click", () => {
            if (typeof pendingModalAction === "function") {
                pendingModalAction();
            }
            hideConfirmModal();
        });
    }

    // Keyboard ESC to close modal or sidebar
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (confirmModal && confirmModal.style.display === "flex") {
                hideConfirmModal();
            } else if (chatSidebar && chatSidebar.classList.contains("is-open")) {
                closeMobileSidebar();
            }
        }
    });

    // ============================================================================
    // SESSION MANAGER & LOCAL STORAGE
    // ============================================================================

    function loadSessionsFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
            sessions = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(sessions)) sessions = [];
        } catch (e) {
            console.error("Error loading chat sessions from storage:", e);
            sessions = [];
        }
    }

    function saveSessionsToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
            if (currentSessionId) {
                localStorage.setItem(STORAGE_KEY_ACTIVE, currentSessionId);
            }
        } catch (e) {
            console.error("Error saving chat sessions to storage:", e);
        }
    }

    function getActiveSession() {
        return sessions.find(s => s.id === currentSessionId);
    }

    function createNewSession(initialTitle = "New Conversation") {
        stopSpeech();
        const newSession = {
            id: "mindmate_session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            title: initialTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };

        sessions.unshift(newSession);
        currentSessionId = newSession.id;
        saveSessionsToStorage();
        renderSidebarHistory();
        renderActiveChatArea();
        closeMobileSidebar();
        messageInput.focus();
    }

    function switchSession(sessionId) {
        if (sessionId === currentSessionId) {
            closeMobileSidebar();
            return;
        }

        stopSpeech();
        currentSessionId = sessionId;
        localStorage.setItem(STORAGE_KEY_ACTIVE, currentSessionId);
        renderSidebarHistory();
        renderActiveChatArea();
        closeMobileSidebar();
        messageInput.focus();
    }

    function deleteSession(sessionId, event) {
        if (event) event.stopPropagation();

        const targetSession = sessions.find(s => s.id === sessionId);
        const title = targetSession ? targetSession.title : "this conversation";

        showConfirmModal(
            "Delete Conversation",
            `Are you sure you want to delete "${title}"? This cannot be undone.`,
            "Delete",
            () => {
                stopSpeech();
                sessions = sessions.filter(s => s.id !== sessionId);

                if (currentSessionId === sessionId) {
                    if (sessions.length > 0) {
                        currentSessionId = sessions[0].id;
                    } else {
                        createNewSession();
                        return;
                    }
                }

                saveSessionsToStorage();
                renderSidebarHistory();
                renderActiveChatArea();
            }
        );
    }

    function clearAllHistory() {
        if (sessions.length === 0) {
            showNotice("There are no saved conversations to clear.", "info", 3000);
            return;
        }

        showConfirmModal(
            "Clear All History",
            "Are you sure you want to delete all saved conversations? This cannot be undone.",
            "Clear All",
            () => {
                stopSpeech();
                sessions = [];
                currentSessionId = null;
                localStorage.removeItem(STORAGE_KEY_SESSIONS);
                localStorage.removeItem(STORAGE_KEY_ACTIVE);
                createNewSession();
                showNotice("All conversation history has been cleared.", "info", 3000);
            }
        );
    }

    if (newChatBtn) newChatBtn.addEventListener("click", () => createNewSession());
    if (headerNewChatBtn) headerNewChatBtn.addEventListener("click", () => createNewSession());
    if (clearAllHistoryBtn) clearAllHistoryBtn.addEventListener("click", clearAllHistory);

    // Render the history items list in the sidebar
    function renderSidebarHistory() {
        if (!historyList) return;
        historyList.innerHTML = "";

        if (sessions.length === 0) {
            if (historyEmpty) historyEmpty.style.display = "flex";
            return;
        }

        if (historyEmpty) historyEmpty.style.display = "none";

        sessions.forEach(session => {
            const item = document.createElement("div");
            item.className = "history-item";
            if (session.id === currentSessionId) {
                item.classList.add("is-active");
            }
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            item.setAttribute("aria-label", `Open conversation: ${session.title}`);

            const contentWrap = document.createElement("div");
            contentWrap.className = "history-item-content";

            const iconSpan = document.createElement("span");
            iconSpan.className = "history-item-icon";
            iconSpan.innerHTML = ICONS.messageSquare;

            const titleSpan = document.createElement("span");
            titleSpan.className = "history-item-title";
            titleSpan.textContent = session.title;

            contentWrap.appendChild(iconSpan);
            contentWrap.appendChild(titleSpan);

            // Actions (Delete)
            const actionsWrap = document.createElement("div");
            actionsWrap.className = "history-item-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "history-action-btn delete-btn";
            deleteBtn.title = "Delete conversation";
            deleteBtn.setAttribute("aria-label", `Delete conversation ${session.title}`);
            deleteBtn.innerHTML = ICONS.trash;
            deleteBtn.addEventListener("click", (e) => deleteSession(session.id, e));

            actionsWrap.appendChild(deleteBtn);

            item.appendChild(contentWrap);
            item.appendChild(actionsWrap);

            item.addEventListener("click", () => switchSession(session.id));
            item.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    switchSession(session.id);
                }
            });

            historyList.appendChild(item);
        });
    }

    // ============================================================================
    // STATUS & NOTIFICATION HELPERS
    // ============================================================================

    function showNotice(message, type = "info", autoDismissMs = 6000) {
        if (!statusNotice || !noticeText) return;

        if (noticeTimeout) {
            clearTimeout(noticeTimeout);
            noticeTimeout = null;
        }

        statusNotice.className = "status-notice";
        if (type === "error") {
            statusNotice.classList.add("is-error");
            if (noticeIcon) noticeIcon.textContent = "⚠️";
        } else if (type === "recording") {
            statusNotice.classList.add("is-recording");
            if (noticeIcon) noticeIcon.textContent = "🎙️";
        } else {
            if (noticeIcon) noticeIcon.textContent = "ℹ️";
        }

        noticeText.textContent = message;
        statusNotice.style.display = "flex";

        if (autoDismissMs > 0) {
            noticeTimeout = setTimeout(() => {
                hideNotice();
            }, autoDismissMs);
        }
    }

    function hideNotice() {
        if (statusNotice) {
            statusNotice.style.display = "none";
        }
        if (noticeTimeout) {
            clearTimeout(noticeTimeout);
            noticeTimeout = null;
        }
    }

    if (noticeClose) {
        noticeClose.addEventListener("click", hideNotice);
    }

    // ============================================================================
    // SAFE DOM FORMATTER (ZERO INNERHTML / STRICT XSS PREVENTION)
    // ============================================================================

    function parseInlineFormatting(text) {
        const fragment = document.createDocumentFragment();
        const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            const rawToken = match[0];
            if (rawToken.startsWith("**") && rawToken.endsWith("**") && rawToken.length >= 4) {
                const boldEl = document.createElement("strong");
                boldEl.textContent = rawToken.slice(2, -2);
                fragment.appendChild(boldEl);
            } else if (rawToken.startsWith("*") && rawToken.endsWith("*") && rawToken.length >= 2) {
                const italicEl = document.createElement("em");
                italicEl.textContent = rawToken.slice(1, -1);
                fragment.appendChild(italicEl);
            } else if (rawToken.startsWith("`") && rawToken.endsWith("`") && rawToken.length >= 2) {
                const codeEl = document.createElement("code");
                codeEl.textContent = rawToken.slice(1, -1);
                fragment.appendChild(codeEl);
            } else {
                fragment.appendChild(document.createTextNode(rawToken));
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        return fragment;
    }

    function renderSafeFormattedContent(text, container) {
        const lines = text.split("\n");
        let currentList = null;
        let currentParagraphLines = [];

        function flushParagraph() {
            if (currentParagraphLines.length > 0) {
                const p = document.createElement("p");
                const fullText = currentParagraphLines.join(" ");
                p.appendChild(parseInlineFormatting(fullText));
                container.appendChild(p);
                currentParagraphLines = [];
            }
        }

        function flushList() {
            if (currentList) {
                container.appendChild(currentList);
                currentList = null;
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) {
                flushParagraph();
                flushList();
                continue;
            }

            const bulletMatch = line.match(/^[\*\-]\s+(.+)/);
            const numberMatch = line.match(/^\d+[\.\)]\s+(.+)/);

            if (bulletMatch || numberMatch) {
                flushParagraph();
                const isOrdered = Boolean(numberMatch);
                const itemText = bulletMatch ? bulletMatch[1] : numberMatch[1];

                if (!currentList || (isOrdered && currentList.tagName !== "OL") || (!isOrdered && currentList.tagName !== "UL")) {
                    flushList();
                    currentList = document.createElement(isOrdered ? "ol" : "ul");
                }

                const li = document.createElement("li");
                li.appendChild(parseInlineFormatting(itemText));
                currentList.appendChild(li);
            } else {
                flushList();
                currentParagraphLines.push(line);
            }
        }

        flushParagraph();
        flushList();
    }

    function formatTime(timestamp) {
        const date = timestamp ? new Date(timestamp) : new Date();
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    // ============================================================================
    // TEXT-TO-SPEECH (READ ALOUD) & CLIPBOARD UTILITIES
    // ============================================================================

    function stopSpeech() {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        if (activeSpeakingButton) {
            activeSpeakingButton.classList.remove("is-speaking");
            activeSpeakingButton.innerHTML = ICONS.volume;
            activeSpeakingButton.setAttribute("title", "Read aloud");
            activeSpeakingButton = null;
        }
        activeUtterance = null;
    }

    function speakText(text, buttonElement) {
        if (!("speechSynthesis" in window)) {
            showNotice("Text-to-speech is not supported in this browser.", "info", 4000);
            return;
        }

        if (activeSpeakingButton === buttonElement) {
            stopSpeech();
            return;
        }

        stopSpeech();

        // Strip markdown stars/backticks for smooth natural reading
        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1")
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95; // Gentle, empathetic pace
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            activeSpeakingButton = buttonElement;
            buttonElement.classList.add("is-speaking");
            buttonElement.innerHTML = ICONS.volumeX;
            buttonElement.setAttribute("title", "Stop reading aloud");
        };

        utterance.onend = () => {
            stopSpeech();
        };

        utterance.onerror = (e) => {
            console.warn("Speech synthesis error:", e);
            stopSpeech();
        };

        activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    async function copyToClipboard(text, buttonElement) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-https or older environments
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }

            buttonElement.classList.add("copied");
            buttonElement.innerHTML = ICONS.check;
            buttonElement.setAttribute("title", "Copied to clipboard!");

            setTimeout(() => {
                buttonElement.classList.remove("copied");
                buttonElement.innerHTML = ICONS.copy;
                buttonElement.setAttribute("title", "Copy message");
            }, 2000);

        } catch (err) {
            console.error("Failed to copy message:", err);
            showNotice("Could not copy message to clipboard.", "error", 3000);
        }
    }

    // ============================================================================
    // CHAT MESSAGE RENDERING
    // ============================================================================

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    /**
     * Renders a message bubble to the chat conversation.
     * @param {string} text - Message text
     * @param {"user" | "bot"} sender - Sender identity
     * @param {boolean} isError - Error status
     * @param {number} timestamp - Epoch timestamp
     */
    function appendMessageBubble(text, sender, isError = false, timestamp = Date.now()) {
        const row = document.createElement("div");
        row.className = `message-row ${sender}-row`;

        const wrap = document.createElement("div");
        wrap.className = "message-bubble-wrap";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        if (isError) {
            bubble.classList.add("error-bubble");
            bubble.textContent = text;
        } else if (sender === "user") {
            bubble.textContent = text;
        } else {
            renderSafeFormattedContent(text, bubble);
        }

        wrap.appendChild(bubble);

        // Metadata & Actions Bar
        const meta = document.createElement("div");
        meta.className = "message-meta";

        const timeSpan = document.createElement("span");
        timeSpan.className = "message-time";
        timeSpan.textContent = formatTime(timestamp);
        meta.appendChild(timeSpan);

        if (sender === "bot" && !isError) {
            const actions = document.createElement("div");
            actions.className = "message-actions";

            // Copy Action
            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className = "msg-action-btn copy-btn";
            copyBtn.title = "Copy message";
            copyBtn.setAttribute("aria-label", "Copy message");
            copyBtn.innerHTML = ICONS.copy;
            copyBtn.addEventListener("click", () => copyToClipboard(text, copyBtn));
            actions.appendChild(copyBtn);

            // Read Aloud Action
            const speakBtn = document.createElement("button");
            speakBtn.type = "button";
            speakBtn.className = "msg-action-btn speak-btn";
            speakBtn.title = "Read aloud";
            speakBtn.setAttribute("aria-label", "Read aloud");
            speakBtn.innerHTML = ICONS.volume;
            speakBtn.addEventListener("click", () => speakText(text, speakBtn));
            actions.appendChild(speakBtn);

            meta.appendChild(actions);
        }

        wrap.appendChild(meta);
        row.appendChild(wrap);
        chatArea.appendChild(row);

        return row;
    }

    // Typing Indicator
    function showTypingIndicator() {
        removeTypingIndicator();

        const row = document.createElement("div");
        row.className = "message-row bot-row";
        row.id = "typingIndicatorRow";

        const wrap = document.createElement("div");
        wrap.className = "message-bubble-wrap";

        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";

        const dots = document.createElement("div");
        dots.className = "typing-dots";
        dots.setAttribute("aria-hidden", "true");
        dots.innerHTML = "<span></span><span></span><span></span>";

        const label = document.createElement("span");
        label.className = "typing-text";
        label.textContent = "MindMate is thinking...";

        indicator.appendChild(dots);
        indicator.appendChild(label);
        wrap.appendChild(indicator);
        row.appendChild(wrap);
        chatArea.appendChild(row);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const existing = document.getElementById("typingIndicatorRow");
        if (existing) existing.remove();
    }

    // Render active chat area based on activeSession
    function renderActiveChatArea() {
        const session = getActiveSession();
        chatArea.innerHTML = "";

        if (!session || session.messages.length === 0) {
            // Render Welcome Section & Suggestions
            const welcomeClone = welcomeSection.cloneNode(true);
            const suggestionsClone = suggestionsSection.cloneNode(true);

            chatArea.appendChild(welcomeClone);
            chatArea.appendChild(suggestionsClone);

            // Re-bind click events on suggestions
            suggestionsClone.querySelectorAll(".suggestion-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const query = btn.getAttribute("data-query") || btn.textContent.trim();
                    if (query) sendMessage(query);
                });
            });

            return;
        }

        // Render past messages in session
        session.messages.forEach(msg => {
            appendMessageBubble(msg.text, msg.role === "user" ? "user" : "bot", false, msg.timestamp);
        });

        scrollToBottom();
    }

    // ============================================================================
    // SENDING MESSAGES & BACKEND COMMUNICATION
    // ============================================================================

    async function sendMessage(textToSend = null) {
        const text = (textToSend !== null ? textToSend : messageInput.value).trim();

        if (!text || isSending) return;

        if (text.length > 4000) {
            showNotice("Please keep your message under 4,000 characters.", "error");
            return;
        }

        // Stop any active speech synthesis
        stopSpeech();

        // Stop voice recording if in progress
        if (isRecording && speechRecognition) {
            speechRecognition.stop();
        }

        let session = getActiveSession();
        if (!session) {
            createNewSession();
            session = getActiveSession();
        }

        const isFirstMessage = session.messages.length === 0;

        // If first message, generate a friendly clean title
        if (isFirstMessage) {
            let autoTitle = text.slice(0, 32);
            if (text.length > 32) autoTitle += "...";
            session.title = autoTitle;
            renderSidebarHistory();
        }

        isSending = true;
        hideNotice();

        const timestamp = Date.now();

        // 1. Remove welcome & suggestion panels if present
        const welcomeEl = chatArea.querySelector("#welcomeSection");
        const suggestionsEl = chatArea.querySelector("#suggestionsSection");
        if (welcomeEl) welcomeEl.remove();
        if (suggestionsEl) suggestionsEl.remove();

        // 2. Render User Message Bubble
        appendMessageBubble(text, "user", false, timestamp);
        scrollToBottom();

        // 3. Clear input
        messageInput.value = "";
        sendButton.disabled = true;
        messageInput.disabled = true;
        micButton.disabled = true;

        // 4. Update session messages & state
        session.messages.push({
            role: "user",
            text: text,
            timestamp: timestamp
        });
        session.updatedAt = timestamp;
        saveSessionsToStorage();

        // 5. Build recent history window for context
        const recentMessages = session.messages.slice(-12).map(m => ({
            role: m.role,
            text: m.text
        }));

        // 6. Show typing indicator
        showTypingIndicator();

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: recentMessages
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "I'm having trouble connecting right now. Please try again in a moment.");
            }

            const aiReply = data.reply;
            if (!aiReply || typeof aiReply !== "string" || !aiReply.trim()) {
                throw new Error("I'm having trouble connecting right now. Please try again in a moment.");
            }

            removeTypingIndicator();

            const replyTimestamp = Date.now();

            // Append to session state
            session.messages.push({
                role: "model",
                text: aiReply.trim(),
                timestamp: replyTimestamp
            });
            session.updatedAt = replyTimestamp;
            saveSessionsToStorage();

            // Render Bot Bubble
            appendMessageBubble(aiReply.trim(), "bot", false, replyTimestamp);
            scrollToBottom();

        } catch (error) {
            console.error("Chat communication error:", error);
            removeTypingIndicator();

            // Remove last user message from memory on failure so user can retry cleanly
            if (session.messages.length > 0 && session.messages[session.messages.length - 1].role === "user") {
                session.messages.pop();
                saveSessionsToStorage();
            }

            const friendlyError = error.message || "I'm having trouble connecting right now. Please try again in a moment.";
            appendMessageBubble(friendlyError, "bot", true);
            scrollToBottom();

        } finally {
            isSending = false;
            sendButton.disabled = false;
            messageInput.disabled = false;
            micButton.disabled = false;
            messageInput.focus();
        }
    }

    // ============================================================================
    // EVENT LISTENERS: SUBMISSION & SUGGESTIONS
    // ============================================================================

    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initial Suggestions Event Binding
    const initialSuggestions = document.querySelectorAll(".suggestion-btn");
    initialSuggestions.forEach((btn) => {
        btn.addEventListener("click", () => {
            const query = btn.getAttribute("data-query") || btn.textContent.trim();
            if (query) sendMessage(query);
        });
    });

    // ============================================================================
    // VOICE INPUT (WEB SPEECH API)
    // ============================================================================

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    function setupVoiceRecognition() {
        if (!SpeechRecognition) {
            micButton.addEventListener("click", () => {
                showNotice("Voice input is not supported in this browser. Please type your message.", "info", 6000);
            });
            return;
        }

        try {
            speechRecognition = new SpeechRecognition();
            speechRecognition.continuous = false;
            speechRecognition.interimResults = true;
            speechRecognition.lang = "en-US";
            speechRecognition.maxAlternatives = 1;

            speechRecognition.onstart = () => {
                isRecording = true;
                micButton.classList.add("is-recording");
                micButton.setAttribute("aria-label", "Stop recording");
                micButton.setAttribute("title", "Listening... Click to stop");
                showNotice("Listening... Speak gently into your microphone.", "recording", 0);
            };

            speechRecognition.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const currentText = finalTranscript || interimTranscript;
                if (currentText) {
                    messageInput.value = currentText;
                }
            };

            speechRecognition.onerror = (event) => {
                console.warn("Speech recognition event error:", event.error);
                isRecording = false;
                micButton.classList.remove("is-recording");
                micButton.setAttribute("aria-label", "Start voice input");
                micButton.setAttribute("title", "Voice input");

                if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    showNotice("Microphone access was denied. You can continue typing your message.", "error", 7000);
                } else if (event.error === "no-speech") {
                    showNotice("No speech detected. Please try again.", "info", 4000);
                } else if (event.error === "network") {
                    showNotice("Speech recognition network error. Please try typing instead.", "error", 5000);
                } else {
                    showNotice("Voice input stopped. You can review or type your message.", "info", 4000);
                }
            };

            speechRecognition.onend = () => {
                isRecording = false;
                micButton.classList.remove("is-recording");
                micButton.setAttribute("aria-label", "Start voice input");
                micButton.setAttribute("title", "Voice input");

                if (statusNotice && statusNotice.classList.contains("is-recording")) {
                    hideNotice();
                }

                messageInput.focus();
            };

            micButton.addEventListener("click", () => {
                if (isSending) return;

                if (isRecording) {
                    speechRecognition.stop();
                } else {
                    try {
                        speechRecognition.start();
                    } catch (err) {
                        console.warn("Speech recognition start failed:", err);
                    }
                }
            });

        } catch (e) {
            console.error("Speech recognition initialization error:", e);
            micButton.addEventListener("click", () => {
                showNotice("Voice input is not available right now. You can type your message.", "info", 5000);
            });
        }
    }

    // ============================================================================
    // APPLICATION INITIALIZATION
    // ============================================================================

    initTheme();
    loadSessionsFromStorage();

    const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (savedActiveId && sessions.some(s => s.id === savedActiveId)) {
        currentSessionId = savedActiveId;
    } else if (sessions.length > 0) {
        currentSessionId = sessions[0].id;
    } else {
        createNewSession();
    }

    renderSidebarHistory();
    renderActiveChatArea();
    setupVoiceRecognition();

    messageInput.focus();
});
