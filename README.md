# MindMate — AI Mental Health Assistant

MindMate is a calm, thoughtful, empathetic conversational AI mental health assistant designed to provide users with a comfortable, safe, and supportive space to discuss mental health, emotions, stress, anxiety, sleep, and general psychological well-being.

> **Disclaimer:** MindMate provides educational and well-being guidance, not professional clinical diagnosis, prescription, or treatment. It is an empathetic companion, not a replacement for professional healthcare.

---

## 🌟 Key Features

- **Empathetic & Context-Aware Conversations:** Powered by Google's Gemini API via the official `@google/genai` SDK, preserving recent conversational context for natural follow-ups.
- **Previous Chat History & Session Management:** Built-in collapsible sidebar allows users to start new conversations, switch between previous chats, and delete sessions. Saved 100% privately in the browser (`localStorage`) with zero server conversation logging.
- **Anti-Slop Design & Micro-Interactions:** Adheres to the *Nothing* frontend standards — zero generic gradient blobs, semantic CSS tokens (`--primary`, `--surface`, `--border`, `--ring`), tactile pressed states (`scale(0.97)`), and accessible `:focus-visible` rings.
- **Crisp Inline SVG Icons:** Clean, modern icon set (Lucide style) across the sidebar, header, suggestion pills, message tools, and modals.
- **Message Utilities:**
  - **Copy to Clipboard:** Copy any assistant message with instant checkmark visual feedback.
  - **Read Aloud (Text-to-Speech):** Listen to MindMate's calm replies using the native Web Speech Synthesis API, with play/stop toggle.
  - **Timestamps:** Clean message timestamps for natural reading flow.
- **Light & Dark Theme Toggle:** Seamless toggle between soothing Forest & Sage (Light) and Restful Deep Pine (Dark), persisted across reloads.
- **Mental Health Safety & Topic Guardrails:** Strictly restricts responses to mental health, emotional well-being, psychology, and health-related topics. Non-health requests (e.g., coding, trivia, recipes) are politely declined with guidance back to well-being.
- **Strict Non-Diagnostic Boundaries:** Explicitly enforces non-diagnostic boundaries, crisis intervention protocols, and medical safety.
- **Voice Input:** Native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) allowing users to speak naturally, review/edit their transcription, and send when ready.
- **Safe DOM Rendering:** Zero `innerHTML` injection of raw user or AI text, using structured DOM node creation to prevent XSS vulnerabilities while rendering clean lists and emphasis.
- **Robust Backend Engineering:** Express.js server featuring input sanitization, payload size limits, safe logging (no credentials or conversation text logged), and exponential backoff retry for transient API errors.

---

## 🎨 Color Palette & Design Tokens

| Token (Light) | Token (Dark) | Description |
|---|---|---|
| `--primary: #287653` | `--primary: #3DAE7D` | Main action buttons, active sessions, brand accents |
| `--primary-light: #E8F3ED` | `--primary-light: #162E23` | User message bubbles, avatar badges |
| `--background: #F4F7F5` | `--background: #0E1612` | Main page background |
| `--surface: #FFFFFF` | `--surface: #15201A` | Main chat view and card containers |
| `--sidebar-bg: #FFFFFF` | `--sidebar-bg: #121B16` | History sidebar background |
| `--text-primary: #1C2B22` | `--text-primary: #EEF4F0` | Primary headings and message text |
| `--text-secondary: #65776C` | `--text-secondary: #9DB0A4` | Subtitles, muted labels, secondary text |
| `--border: #E1E9E4` | `--border: #24352C` | Subtle structural dividers |

---

## 📁 Project Structure

```text
MindMate/
├── index.html         # Semantic interface with collapsible sidebar, modals & SVG icons
├── style.css          # Tokenized CSS, dark/light modes, responsive drawer, tactile polish
├── script.js          # Session manager, localStorage, speech synthesis, DOM security
├── server.js          # Express backend, Gemini SDK, safety prompts, retries
├── package.json       # Project dependencies and startup script
├── package-lock.json  # Locked dependency tree
├── .env               # Environment configuration (GEMINI_API_KEY, GEMINI_MODEL)
├── .gitignore         # Ignores .env, node_modules, logs
└── README.md          # Documentation and setup guide
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A valid Google Gemini API key

### 1. Installation

Install dependencies:
```bash
npm install
```

### 2. Environment Configuration

Ensure your `.env` file contains your Google Gemini API key and model identifier:
```env
GEMINI_API_KEY=your_verified_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=3000
```

### 3. Running the Server

Start the application:
```bash
npm start
```
The application will be accessible at:
```
http://localhost:3000
```

---

## 🛡️ API Endpoints

### `GET /api/health`
Checks backend status and verifies AI key configuration without revealing credentials.

**Response:**
```json
{
  "status": "running",
  "ai": "configured",
  "model": "gemini-3.5-flash-lite"
}
```

### `POST /api/chat`
Receives conversation messages, validates roles and length, applies mental health safety system instructions, and returns an empathetic AI reply.

**Request:**
```json
{
  "messages": [
    { "role": "user", "text": "What is anxiety?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Anxiety is a natural response to stress or uncertainty..."
}
```

---

## 🧪 Acceptance Testing Guide

1. **Application Launch:** Open `http://localhost:3000` — UI renders with the collapsible history sidebar, header, online status badge, and soothing suggestion pills with icons.
2. **Chat History & Sessions:**
   - Send a message. Notice the sidebar immediately creates a session with an auto-generated title and active indicator.
   - Click **"+ New Conversation"** or the header Plus button. The chat resets to a fresh conversation.
   - Switch back to the previous chat in the sidebar. All previous messages are restored instantly from `localStorage`.
   - Delete a conversation: Click the trash can icon on a session. Confirm the action in the accessible modal.
3. **Copy Message:** Click the copy icon under any bot message. The icon turns to a green checkmark with "Copied!" feedback, and the response is on your clipboard.
4. **Read Aloud (Text-to-Speech):** Click the speaker icon under a bot message. MindMate reads the message aloud with a gentle pace; clicking again pauses/stops speech.
5. **Dark Mode Toggle:** Click the Sun/Moon icon in the header or sidebar. The interface transitions smoothly between Forest Light and Pine Dark themes and persists your choice.
6. **Mobile Responsive Drawer:** Shrink the viewport below 768px. The sidebar becomes a sliding drawer with backdrop blur, accessible via the hamburger button and dismissible with tap or `Esc`.
7. **Empathetic & Safe Responses:** Ask about anxiety, burnout, or grief. MindMate responds empathetically, keeps medical safety boundaries, and rejects non-health inquiries politely.
8. **Voice Recognition:** Click the microphone button to dictate a message via native Web Speech API. Review and edit text before sending.
