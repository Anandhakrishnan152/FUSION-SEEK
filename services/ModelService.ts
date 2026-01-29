const OLLAMA_BASE_URL = 'http://localhost:11434/api';
const CHAT_MODEL = 'llama3';
const VISION_MODEL = 'llava';
const EMBED_MODEL = 'nomic-embed-text'; // Efficient embedding model
const OLLAMA_ENABLED = false; // Module active

export const getOllamaEnabled = () => OLLAMA_ENABLED;

export const generateEmbedding = async (text: string): Promise<number[]> => {
    if (!OLLAMA_ENABLED) {
        console.warn("Ollama module is disabled. Returning placeholder embedding.");
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
        console.error("Embedding generation failed (using random fallback for demo):", e);
        return Array(768).fill(0).map(() => Math.random()); // Fallback if model missing
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

export const chatWithModel = async (messages: any[]): Promise<string> => {
    if (!OLLAMA_ENABLED) {
        return "Ollama module is currently paused. System is operating in restricted offline mode without LLM inference.";
    }

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CHAT_MODEL,
                messages: messages,
                stream: false,
                options: { temperature: 0.1 }
            })
        });

        const data = await response.json();
        return data.message.content || "I could not generate a response.";
    } catch (error) {
        console.error("RAG Error:", error);
        return "Error generating response. Ensure Ollama is running.";
    }
}
