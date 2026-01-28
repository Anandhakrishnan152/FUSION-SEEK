
import { FileMetadata, VectorNode } from "../types";

const OLLAMA_BASE_URL = 'http://localhost:11434/api';
const CHAT_MODEL = 'llama3';
const VISION_MODEL = 'llava';
const EMBED_MODEL = 'nomic-embed-text'; // Efficient embedding model
const OLLAMA_ENABLED = false; // Module active

// --- Helper: Cosine Similarity ---
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
};

// --- Helper: Generate Embedding ---
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

// --- Helper: Chunk Text ---
const chunkText = (text: string, chunkSize: number = 500): string[] => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
};

// --- Core: Ingest & Index File ---
export const processAndIndexFile = async (file: FileMetadata): Promise<FileMetadata> => {
    const updatedFile = { ...file, vectorData: [] as VectorNode[] };

    if (file.modality === 'text' || file.modality === 'pdf') {
        // 1. Chunking
        const rawChunks = chunkText(file.content || '');

        // 2. Embedding
        for (let i = 0; i < rawChunks.length; i++) {
            const text = rawChunks[i];
            const embedding = await generateEmbedding(text);
            updatedFile.vectorData?.push({
                id: `${file.id}-chunk-${i}`,
                text,
                embedding,
                metadata: { sourceId: file.id, start: i * 500, end: (i + 1) * 500, type: file.modality }
            });
        }
    } else if (file.modality === 'image') {
        // 1. Generate Description (Image Captioning)
        if (OLLAMA_ENABLED) {
            try {
                const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: VISION_MODEL,
                        prompt: "Describe this image in detail for a search index.",
                        images: [file.content?.split(',')[1]],
                        stream: false
                    })
                });
                const data = await response.json();
                updatedFile.description = data.response;
            } catch (e) {
                console.error("Image indexing failed", e);
                updatedFile.description = "Image content (analysis failed)";
            }
        } else {
            updatedFile.description = "Image content (Ollama disabled)";
        }

        // 2. Embed Description
        const embedding = await generateEmbedding(updatedFile.description || '');
        updatedFile.vectorData?.push({
            id: `${file.id}-desc`,
            text: `[Image Description] ${updatedFile.description}`,
            embedding,
            metadata: { sourceId: file.id, start: 0, end: 0, type: 'image' }
        });
    }

    return updatedFile;
};

// --- Core: Retrieval ---
const retrieveRelevantContext = async (query: string, files: FileMetadata[], topK: number = 5): Promise<string> => {
    const queryEmbedding = await generateEmbedding(query);

    let allNodes: VectorNode[] = [];
    files.forEach(f => {
        if (f.vectorData) allNodes = allNodes.concat(f.vectorData);
    });

    if (allNodes.length === 0) return "";

    // Rank by similarity
    const scoredNodes = allNodes.map(node => ({
        node,
        score: node.embedding ? cosineSimilarity(queryEmbedding, node.embedding) : 0
    })).sort((a, b) => b.score - a.score);

    // Select Top K
    const topNodes = scoredNodes.slice(0, topK);

    return topNodes.map(item => `--- SOURCE (${item.node.metadata.type}): ${item.node.metadata.sourceId} ---\n${item.node.text}`).join('\n\n');
};

export const performMultimodalRAG = async (
    query: string,
    files: FileMetadata[]
) => {
    if (!OLLAMA_ENABLED) {
        return "Ollama module is currently paused. System is operating in restricted offline mode without LLM inference.";
    }

    // 1. Efficient Retrieval
    const context = await retrieveRelevantContext(query, files);

    if (!context) return "No relevant content found in the index.";

    let systemPrompt = `You are the FusionSeek Offline Intelligence Engine.
  Answer the user query using ONLY the provided context snippets.
  
  CONTEXT:
  ${context}
  `;

    // Check if we need to pass images (Visual RAG)
    // If the top retrieved nodes are images, we might want to pass the actual image to the vision model
    // For simplicity in this efficiency pass, we rely on the descriptions generated during ingestion.
    // However, if the user asks visually specific questions, we can check.

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
    ];

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
};

export const findSimilarImages = async (
    sourceImage: FileMetadata,
    allFiles: FileMetadata[],
    refinementPrompt?: string
) => {
    // Use embeddings for similarity if available
    if (!sourceImage.vectorData?.[0]?.embedding) return [];

    const sourceVec = sourceImage.vectorData[0].embedding;
    const otherImages = allFiles.filter(f => f.modality === 'image' && f.id !== sourceImage.id && f.vectorData?.[0]?.embedding);

    const results = otherImages.map(img => {
        const score = cosineSimilarity(sourceVec, img.vectorData![0].embedding!);
        return {
            id: img.id,
            score: Math.round(score * 100),
            reason: "Visual Semantic Match"
        };
    }).sort((a, b) => b.score - a.score);

    return results;
};

export const verifyHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
