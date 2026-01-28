
export type Modality = 'text' | 'image' | 'audio' | 'pdf';


export interface VectorNode {
  id: string;
  text: string;
  embedding?: number[];
  metadata: {
    sourceId: string;
    start: number;
    end: number;
    type: Modality;
  };
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  hash: string;
  modality: Modality;
  blockchainId: string;
  status: 'indexing' | 'ready' | 'error';
  content?: string;
  trustScore: number;
  indexedChunks: number;
  vectorData?: VectorNode[]; // Added for RAG
  description?: string; // For images (AI generated description)
}

export interface BlockchainRecord {
  timestamp: number;
  fileHash: string;
  documentId: string;
  action: 'REGISTRATION' | 'VERIFICATION' | 'MODIFICATION_CHECK';
  verified: boolean;
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  modality: Modality;
  relevanceScore: number;
  citation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  results?: SearchResult[];
  verificationDetails?: {
    filesChecked: number;
    discrepancies: number;
    blockchainStatus: 'SECURE' | 'TAMPERED';
  };
}
