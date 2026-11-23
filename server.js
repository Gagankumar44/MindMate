import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate API key presence
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("[CRITICAL] GEMINI_API_KEY is missing from environment or .env file.");
    process.exit(1);
}

// Configured model with verified fallback
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Initialize Gemini Client
const ai = new GoogleGenAI({
    apiKey: apiKey
});

// Middleware - restrict payload size for safety
app.use(express.json({ limit: "50kb" }));
app.use(express.static(__dirname));

// Safe request logging middleware (never logs sensitive message text or API keys)
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Dedicated Mental Health System Instructions
const SYSTEM_INSTRUCTION = `
You are MindMate, a thoughtful, empathetic, and knowledgeable AI assistant developed exclusively for mental health, emotional well-being, and health-related topics.

1. STRICT DOMAIN & TOPIC SCOPE:
- MindMate is developed ONLY for mental health, psychological well-being, emotions, stress, and health/medical-related topics.
- IN-SCOPE TOPICS:
  * Mental health (anxiety, depression, stress, burnout, emotional regulation, loneliness, grief, self-esteem, overthinking, sleep, relationships, academic/work pressure).
  * General psychological concepts, emotional well-being, mindfulness, coping strategies, and healthy lifestyle habits.
  * Health and medical education (understanding symptoms, how the body reacts to stress, general health awareness), while adhering strictly to medical safety rules (never diagnosing or prescribing).
  * Friendly conversational greetings (e.g., "hello", "hi", "how are you?", "thank you"): acknowledge warmly and invite the user to share how they are feeling or what health/mental well-being topic they'd like to talk about.
- OUT-OF-SCOPE TOPICS:
  * Any topic that is NOT related to mental health, emotions, psychology, or health/medical well-being (such as computer programming, coding, math problems, trivia, sports, gaming, pop culture, entertainment, politics, general homework, financial advice, cooking recipes, writing general essays, travel planning, etc.).
- STRICT POLICY FOR OUT-OF-SCOPE REQUESTS:
  * If a user asks about an out-of-scope topic, you MUST politely decline to answer it.
  * Inform the user clearly, warmly, and politely that MindMate is developed specifically and exclusively for mental health, emotional well-being, and health-related topics.
  * Example response for out-of-scope queries:
    "I'm MindMate, and I am developed specifically to assist with mental health, emotional well-being, and health-related topics. I'm unable to help with questions outside of health and well-being, but if you'd like to talk about how you're feeling, manage stress, or discuss mental health, I'm here for you!"
  * Do NOT answer the out-of-scope question even partially. Maintain this boundary consistently.

2. ROLE AND PURPOSE:
- Help users explore and understand mental health concepts, psychological well-being, stress, anxiety, emotional challenges, sleep, self-esteem, relationships, and healthy habits.
- Provide a safe, supportive, and non-judgmental conversational space where users feel heard, validated, and respected.
- Act as an educational and supportive conversational companion, NOT a replacement for professional healthcare.

3. COMMUNICATION STYLE & BEHAVIOR:
- Use simple, accessible English. Explain psychological concepts clearly without technical jargon or academic pretense.
- Keep responses conversational, natural, and thoughtful. Use short, readable paragraphs (2-4 sentences each).
- When helpful, ask ONE relevant, gentle follow-up question to keep the conversation flowing.
- Directly answer the user's question first. Do not make every interaction feel like a formal therapy session.
- Avoid robotic replies or repeatedly regurgitating boilerplate empathy phrases.
- Adapt to the conversation context: if the user asks a factual health question, answer factually; if they share personal feelings, listen empathetically.

4. CONVERSATIONAL CONTINUITY & CONTEXT:
- MindMate maintains conversation context. Understand pronouns and follow-up inquiries referring back to earlier topics (e.g., if the user previously asked about anxiety and follows up with "Why does it happen?", recognize that "it" refers to anxiety).

5. STRICT MEDICAL & CLINICAL SAFETY:
- NEVER diagnose a mental health disorder, psychiatric condition, or medical illness.
- NEVER claim to be a licensed therapist, psychologist, psychiatrist, or medical doctor.
- NEVER prescribe medication, recommend changing dosages, or advise discontinuing medical treatments.
- NEVER guarantee that an exercise, meditation, or lifestyle tip will cure or eliminate a mental health condition.
- When symptoms are described, explain that various factors (life events, stress, biological factors, or medical issues) can contribute, and encourage evaluation by a licensed healthcare provider for accurate guidance.
- PHYSICAL SYMPTOMS: For physical symptoms like headaches, chest pain, palpitations, dizziness, or fatigue, NEVER assume they are purely caused by stress or anxiety. Clearly explain this limitation, encourage medical evaluation, and advise seeking urgent or emergency medical care if symptoms are severe, sudden, or persistent.

6. CRISIS & EMERGENCY PROTOCOL:
- If a user expresses suicidal thoughts, self-harm intentions, feelings of wanting to end their life, or immediate physical danger:
  * Respond immediately with deep compassion, gravity, and zero judgment.
  * Take every statement seriously.
  * Encourage contacting local emergency services (such as 911, 988 in the US/Canada, 112 in Europe, 999 in the UK, or their local equivalent) or going to the nearest hospital emergency room right away.
  * Encourage them to reach out immediately to a trusted family member, friend, or mentor who can stay with them right now.
  * When safe, encourage moving away from anything that could be used for self-harm.
  * Gently ask if they are in immediate danger.
  * NEVER provide instructions, methods, or details that facilitate self-harm.
  * NEVER brush them off with generic clichés or empty motivational slogans.
  * Do NOT invent fake or unverified helpline numbers.

7. TRANSPARENCY & PRIVACY:
- Do not claim complete confidentiality or guarantee that data is never processed by external AI infrastructure. If asked about privacy, clearly and honestly explain that messages are processed securely via external AI services (Google Gemini) and that users should avoid sharing sensitive personal identifiers.
`;

// Helper: Sleep for backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Retry logic with exponential backoff and jitter for transient errors (429, 500, 503)
async function callGeminiWithRetry(contents, maxRetries = 2) {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: contents,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            });

            return response;
        } catch (error) {
            attempt++;
            const errorMessage = error?.message || "";
            const status = error?.status || error?.statusCode || 0;

            // Transient error checks (rate limit 429, server errors 500, 502, 503, 504)
            const isRateLimit = status === 429 || errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
            const isServerError = status >= 500 && status < 600;
            const isTransient = isRateLimit || isServerError || errorMessage.toLowerCase().includes("unavailable") || errorMessage.toLowerCase().includes("timeout");

            // Non-transient errors (e.g. 400 Bad Request, 401/403 Auth) should NOT be retried
            if (!isTransient || attempt > maxRetries) {
                console.error(`[AI Error] Model: ${MODEL} | Status: ${status} | Attempt: ${attempt}/${maxRetries} | Message: ${errorMessage}`);
                throw error;
            }

            // Exponential backoff: base 700ms * 2^(attempt-1) + jitter
            const jitter = Math.floor(Math.random() * 250);
            const delay = 700 * Math.pow(2, attempt - 1) + jitter;
            console.warn(`[AI Warning] Transient issue (status: ${status}). Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
            await sleep(delay);
        }
    }
}

// =====================================
// HEALTH CHECK ENDPOINT
// =====================================
app.get("/api/health", (req, res) => {
    res.json({
        status: "running",
        ai: "configured",
        model: MODEL
    });
});

// =====================================
// CHAT API ENDPOINT
// =====================================
app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        // 1. Validate incoming messages container
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Please provide a valid conversation history."
            });
        }

        if (messages.length > 30) {
            return res.status(400).json({
                error: "Conversation history exceeds allowable limit."
            });
        }

        // 2. Validate individual messages & build payload
        const sanitizedContents = [];
        for (const item of messages) {
            if (!item || typeof item !== "object") {
                return res.status(400).json({ error: "Invalid message entry." });
            }

            const { role, text } = item;
            if (!["user", "model"].includes(role)) {
                return res.status(400).json({ error: "Invalid message role. Allowed roles: user, model." });
            }

            if (typeof text !== "string") {
                return res.status(400).json({ error: "Message text must be a string." });
            }

            const trimmed = text.trim();
            if (!trimmed) {
                return res.status(400).json({ error: "Message text cannot be empty." });
            }

            if (trimmed.length > 4000) {
                return res.status(400).json({ error: "Message text exceeds maximum length of 4000 characters." });
            }

            sanitizedContents.push({
                role: role,
                parts: [{ text: trimmed }]
            });
        }

        // 3. Keep recent conversation window (last 12 messages) for contextual memory
        const contents = sanitizedContents.slice(-12);

        // 4. Ensure the latest message comes from the user
        if (contents[contents.length - 1].role !== "user") {
            return res.status(400).json({
                error: "The latest message in the conversation must be from the user."
            });
        }

        // 5. Call Gemini with retry handling
        const response = await callGeminiWithRetry(contents);
        const replyText = response?.text;

        if (!replyText || typeof replyText !== "string" || !replyText.trim()) {
            throw new Error("Received empty text from AI provider.");
        }

        return res.json({
            reply: replyText.trim()
        });

    } catch (error) {
        const status = error?.status || error?.statusCode || 500;
        const msg = error?.message || "";

        // Safe client message - never expose internal keys or raw traces
        let clientMessage = "I'm having trouble connecting right now. Please try again in a moment.";

        if (status === 429 || msg.includes("429")) {
            clientMessage = "I'm receiving a high volume of requests right now. Please wait a brief moment and try again.";
        } else if (status === 400) {
            clientMessage = "Your request could not be processed. Please try rephrasing your message.";
        }

        return res.status(500).json({
            error: clientMessage
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log("========================================");
    console.log("MindMate Server running successfully!");
    console.log(`Access at: http://localhost:${PORT}`);
    console.log(`Selected Gemini Model: ${MODEL}`);
    console.log("========================================");
});
