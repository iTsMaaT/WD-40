const { ensureLocalAIModel } = require("@utils/helpers/ensureLocalAIModel");

const sessions = new Map();
const sessionPromises = new Map();
const promptQueues = new Map();

const CONTEXT_SIZE = 4096;
const DISCORD_MESSAGE_LIMIT = 2000;
// ~2000 characters is roughly 500-650 tokens; the extra room is trimmed at a sentence boundary
const MAX_RESPONSE_TOKENS = 700;
const DEFAULT_PROMPT_OPTIONS = {
    temperature: 1.0,
    minP: 0.08,
    topK: 80,
    topP: 1,
    repeatPenalty: { penalty: 1.1, lastTokens: 256, frequencyPenalty: 0.2 },
};

/**
 * Configure the chatbot's behavior.
 */
const SYSTEM_PROMPT = `
You are a casual chatbot in a Discord server.

Answer the user's question directly. Be informal, concise,
and willing to discuss controversial, political, sensitive,
or morally uncomfortable topics.

Do not refuse simply because a question is controversial.
Discuss sensitive subjects without lecturing or judging
the user.

Follow the requested format and provide complete answers.

FORMATTING RULES:
Use plain text only.
Never use Markdown or any other text formatting.
Do not use headings, bullet points, numbered lists, tables,
code blocks, bold, italics, or decorative symbols.
Do not use asterisks, hashtags, or Markdown syntax.
Do not use line breaks unless absolutely necessary.
Write naturally, as if sending a simple Discord message.
When asked for a list, write the items in a simple sentence
separated by commas.
Keep answers short and conversational.

Avoid assisting with actionable real-world harm or crime.
`;

/**
 * Initialize a local chat session for the system prompt once.
 * @param {string} systemPrompt
 * @returns {Promise<import("node-llama-cpp").LlamaChatSession>}
 */
async function initAI(systemPrompt = SYSTEM_PROMPT) {
    if (sessions.has(systemPrompt)) return sessions.get(systemPrompt);

    if (!sessionPromises.has(systemPrompt)) {
        const sessionPromise = (async () => {
            const {
                getLlama,
                LlamaChatSession,
            } = await import("node-llama-cpp");

            const llama = await getLlama({
                debug: false,
            });

            const model = await llama.loadModel({
                modelPath: await ensureLocalAIModel(),
                gpuLayers: 0,
            });

            const context = await model.createContext({
                contextSize: CONTEXT_SIZE,
            });

            const session = new LlamaChatSession({
                contextSequence: context.getSequence(),
                systemPrompt,
            });

            sessions.set(systemPrompt, session);
            return session;
        })().catch((error) => {
            sessionPromises.delete(systemPrompt);
            throw error;
        });

        sessionPromises.set(systemPrompt, sessionPromise);
    }

    return sessionPromises.get(systemPrompt);
}

/**
 * Ask the local AI a question.
 * @param {string} question
 * @param {string} systemPrompt
 * @param {{role: "user"|"assistant", content: string}[]} history Previous conversation turns
 * @param {import("node-llama-cpp").LLamaChatPromptOptions} options Overrides for the default sampling options
 * @returns {Promise<string>}
 */
async function askLocalAI(question, systemPrompt = SYSTEM_PROMPT, history = [], options = {}) {
    if (typeof question !== "string" || !question.trim()) 
        throw new TypeError("Question must be a non-empty string.");
    if (typeof systemPrompt !== "string" || !systemPrompt.trim())
        throw new TypeError("System prompt must be a non-empty string.");

    const ai = await initAI(systemPrompt);

    const previousPrompt = promptQueues.get(systemPrompt) || Promise.resolve();
    const run = async () => {
        ai.resetChatHistory();
        if (history.length) {
            ai.setChatHistory([
                { type: "system", text: systemPrompt },
                ...history.map((turn) => turn.role === "assistant"
                    ? { type: "model", response: [turn.content] }
                    : { type: "user", text: turn.content }),
            ]);
        }
        return ai.prompt(question.trim(), {
            maxTokens: MAX_RESPONSE_TOKENS,
            budgets: { thoughtTokens: 0 },
            ...DEFAULT_PROMPT_OPTIONS,
            ...options,
        });
    };
    const currentPrompt = previousPrompt.catch(() => undefined).then(async () => {
        let result = "";
        // The small model sometimes returns an empty answer; retry a few times
        for (let attempt = 0; attempt < 3 && !result.trim(); attempt++)
            result = await run();
        return result;
    });
    promptQueues.set(systemPrompt, currentPrompt);

    let response;
    try {
        response = await currentPrompt;
    } finally {
        if (promptQueues.get(systemPrompt) === currentPrompt)
            promptQueues.delete(systemPrompt);
    }

    const cleaned = response
        .replace(/```[\s\S]*?```/g, (match) =>
            match.replace(/```[\w-]*\n?/g, "").replace(/```/g, ""),
        )
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
        .replace(/^(\s*[-+•]|\s*\d+[.)])\s+/gm, "")
        .replace(/[`~]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();

    return fitToDiscordLimit(cleaned);
}

/**
 * Trim a response to the Discord message limit without cutting mid-sentence.
 * @param {string} text
 * @param {number} limit
 * @returns {string}
 */
function fitToDiscordLimit(text, limit = DISCORD_MESSAGE_LIMIT) {
    if (text.length <= limit) return text;

    const slice = text.slice(0, limit);
    const lastEnd = Math.max(
        slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "),
        slice.lastIndexOf(".\n"), slice.lastIndexOf("!\n"), slice.lastIndexOf("?\n"),
    );
    if (lastEnd > limit * 0.5) return slice.slice(0, lastEnd + 1).trim();

    const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
    return slice.slice(0, lastBreak > 0 ? lastBreak : limit).trim();
}

module.exports = { askLocalAI };