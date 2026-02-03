const OLLAMA_BASE_URL = 'http://localhost:11434/api';
const CHAT_MODEL = 'llama3';
const VISION_MODEL = 'llava';
const EMBED_MODEL = 'nomic-embed-text'; // Efficient embedding model
const OLLAMA_ENABLED = true; // Module active

export const getOllamaEnabled = () => OLLAMA_ENABLED;

export const checkOllamaStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
        if (!response.ok) return false;

        const data = await response.json();
        const models = data.models || [];
        // Check if our core models exist
        const hasLlama = models.some((m: any) => m.name.includes(CHAT_MODEL));

        if (!hasLlama) {
            console.warn(`Ollama is online but ${CHAT_MODEL} is missing.`);
        }

        return hasLlama;
    } catch (e) {
        return false;
    }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    if (!OLLAMA_ENABLED) {
        return Array(768).fill(0).map(() => Math.random());
    }

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: EMBED_MODEL,
                prompt: text
            })
        });
        if (!response.ok) throw new Error('Embedding failed');
        const data = await response.json();
        return data.embedding;
    } catch (e) {
        console.warn("Embedding generation failed (Ollama offline?), using random fallback:", e);
        return Array(768).fill(0).map(() => Math.random());
    }
};

export const generateImageDescription = async (base64Image: string): Promise<string> => {
    if (!OLLAMA_ENABLED) return "Image content (Ollama disabled)";

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: VISION_MODEL,
                prompt: "Describe this image in detail for a search index.",
                images: [base64Image],
                stream: false
            })
        });
        const data = await response.json();
        return data.response;
    } catch (e) {
        console.error("Image indexing failed", e);
        return "Image content (analysis failed)";
    }
}

export const chatWithModel = async (messages: any[], model: string = CHAT_MODEL): Promise<string> => {
    if (!OLLAMA_ENABLED) {
        return "Ollama module is currently paused.";
    }

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false,
                options: { temperature: 0.1 }
            })
        });


        const data = await response.json();
        return data.message.content || "I could not generate a response.";
    } catch (error) {
        console.error("RAG Error:", error);
        throw new Error("Ollama Unreachable");
    }
}
