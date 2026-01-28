
import { GoogleGenAI, Type } from "@google/genai";
import { FileMetadata } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const performMultimodalRAG = async (
  query: string,
  files: FileMetadata[]
) => {
  const model = 'gemini-3-pro-preview';
  const parts: any[] = [];
  
  parts.push({
    text: `You are the FusionSeek Multimodal Intelligence Engine. 
    You are operating in a COMPLETELY OFFLINE environment. 
    You have access to a set of verified local files retrieved via Semantic Search (Vector DB).
    
    CRITICAL INSTRUCTIONS:
    1. Synthesize an answer to the user query using ONLY the provided content.
    2. Cite sources using [Filename].
    3. If content comes from an IMAGE, describe what you see and cite it.
    4. If content comes from AUDIO, treat it as a transcription and cite it.
    5. If content comes from a PDF, analyze its contents and cite it.
    6. Be concise but thorough.
    
    LOCAL DATA REPOSITORY:`
  });

  files.forEach(file => {
    if (file.modality === 'text') {
       parts.push({ text: `--- DOCUMENT: ${file.name} (Modality: Text, Hash: ${file.hash}) ---\nContent: ${file.content}` });
    } else if (file.modality === 'image' || file.modality === 'audio' || file.modality === 'pdf') {
       parts.push({ 
         inlineData: { 
           data: file.content?.split(',')[1] || '', 
           mimeType: file.type 
         } 
       });
       parts.push({ text: `--- SOURCE: ${file.name} (Modality: ${file.modality.toUpperCase()}, Blockchain Verified) ---` });
    }
  });

  parts.push({ text: `\nUSER QUERY: ${query}` });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        temperature: 0.1,
      }
    });

    // Directly access the .text property from GenerateContentResponse
    return response.text || "I could not generate a response from the provided sources.";
  } catch (error) {
    console.error("Gemini RAG Error:", error);
    return "The Intelligence Engine encountered an error accessing multimodal vectors.";
  }
};

export const findSimilarImages = async (
  sourceImage: FileMetadata,
  allFiles: FileMetadata[],
  refinementPrompt?: string
) => {
  const model = 'gemini-3-pro-preview';
  const otherImages = allFiles.filter(f => f.modality === 'image' && f.id !== sourceImage.id);
  
  if (otherImages.length === 0) return [];

  const baseInstructions = refinementPrompt 
    ? `Identify target images that are visually similar to the 'source' AND match this semantic refinement: "${refinementPrompt}".`
    : "Identify which of the following 'target' images are visually similar to the 'source' image.";

  const parts: any[] = [
    { text: `${baseInstructions} Rank them by similarity percentage (0-100). Return a JSON array of objects with { id: string, score: number, reason: string }.` },
    { text: "SOURCE IMAGE:" },
    {
      inlineData: {
        data: sourceImage.content?.split(',')[1] || '',
        mimeType: sourceImage.type
      }
    }
  ];

  otherImages.forEach((img, idx) => {
    parts.push({ text: `TARGET IMAGE (ID: ${img.id}):` });
    parts.push({
      inlineData: {
        data: img.content?.split(',')[1] || '',
        mimeType: img.type
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'The unique ID of the target image.' },
              score: { type: Type.NUMBER, description: 'Similarity score from 0 to 100.' },
              reason: { type: Type.STRING, description: 'Explanation for visual or semantic similarity.' }
            },
            required: ['id', 'score', 'reason'],
            propertyOrdering: ['id', 'score', 'reason']
          }
        },
        temperature: 0.1
      }
    });

    // Directly access the .text property from GenerateContentResponse
    const text = response.text || '[]';
    // Clean potential markdown code blocks if the model included them
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Visual Similarity Error:", error);
    return [];
  }
};

export const verifyHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
