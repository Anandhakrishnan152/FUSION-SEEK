import { FileMetadata, VectorNode } from "../types";
import { generateEmbedding, generateImageDescription, chatWithModel, getOllamaEnabled } from "./ModelService";

// --- Helper: Cosine Similarity ---
export const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
};

// --- Helper: Tokenizer for Keyword Search ---
const tokenize = (text: string): Set<string> => {
    return new Set(text.toLowerCase().split(/[\s,.;!?]+/).filter(w => w.length > 2));
};

// --- Helper: Jaccard Similarity (Keyword Overlap) ---
const jaccardSimilarity = (query: string, text: string): number => {
    const queryTokens = tokenize(query);
    const textTokens = tokenize(text);

    if (queryTokens.size === 0 || textTokens.size === 0) return 0;

    let intersection = 0;
    queryTokens.forEach(token => {
        if (textTokens.has(token)) intersection++;
    });

    const union = queryTokens.size + textTokens.size - intersection;
    return intersection / union;
};

// --- Helper: Smart Chunking (Sentence Aware) ---
export const chunkText = (text: string, chunkSize: number = 500): string[] => {
    // Split by sentence delimiters to avoid cutting thoughts in half
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

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
        const imageBase64 = file.content?.split(',')[1];
        if (imageBase64) {
            updatedFile.description = await generateImageDescription(imageBase64);
        } else {
            updatedFile.description = "Image content (invalid source)";
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
    const useVectors = getOllamaEnabled();
    const queryEmbedding = useVectors ? await generateEmbedding(query) : [];

    let allNodes: VectorNode[] = [];
    files.forEach(f => {
        if (f.vectorData) allNodes = allNodes.concat(f.vectorData);
    });

    if (allNodes.length === 0) return "";

    // Rank by similarity
    const scoredNodes = allNodes.map(node => {
        let score = 0;
        if (useVectors && node.embedding) {
            // Semantic Search
            score = cosineSimilarity(queryEmbedding, node.embedding);
        } else {
            // Fallback: Keyword Search (Jaccard)
            // This ensures accuracy when the model is offline
            score = jaccardSimilarity(query, node.text);
        }
        return { node, score };
    }).filter(n => n.score > 0.05) // Filter noise
        .sort((a, b) => b.score - a.score);

    // Select Top K
    const topNodes = scoredNodes.slice(0, topK);

    return topNodes.map(item => `--- SOURCE (${item.node.metadata.type}): ${item.node.metadata.sourceId} ---\n${item.node.text}`).join('\n\n');
};

import { performMultimodalRAG as geminiRAG } from "./geminiService";

export const performMultimodalRAG = async (
    query: string,
    files: FileMetadata[]
) => {
    // Forward to Gemini Service for Demo
    try {
        const result = await geminiRAG(query, files);
        return result;
    } catch (error) {
        console.error("Gemini Mode Failed, falling back to static search:", error);
        // Fallback logic could go here, or just return error string
        return "Error connecting to Gemini Model. Please check your API configuration.";
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
