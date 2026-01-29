import { BlockchainRecord } from "../types";

/*
 * =========================================================================================
 * 🎭 FUSIONSEEK BLOCKCHAIN SERVICE: THE HONEST ASSESSMENT
 * =========================================================================================
 * 
 * ## 🎯 Stated Purpose
 * The blockchain in FusionSeek serves as a data integrity and provenance layer.
 * 1. File Integrity: Ensures the document used for AI answers hasn't been tampered with.
 * 2. Immutable Audit Trail: A permanent, unalterable history of knowledge ingestion.
 * 3. Provenance: Linking AI answers back to specific, verified source versions.
 * 
 * ## 🤔 Critical Architecture Decision (The "Honest Truth")
 * While we implement a "Blockchain" here, we acknowledge for this Academic Context:
 * - A full decentralized P2P blockchain network is overkill for a single-node RAG system.
 * - We are implementing "Option 1: Cryptographic Hash Chain" (like Git).
 * 
 * ## 🛠️ Implementation Strategy: Cryptographic Hash Chain
 * 
 * Structure:
 * [Block N] {
 *    prevHash: "..." // Links to Block N-1
 *    data: { fileHash, timestamp, ... }
 *    currentHash: SHA256(prevHash + data)
 * }
 * 
 * This provides:
 * ✅ Tamper-evidence (changing an old record breaks all subsequent hashes)
 * ✅ Provenance (chain of history)
 * ✅ Simplicity (no consensus overhead)
 * 
 * =========================================================================================
 */

class SimpleBlockchainService {
    private chain: BlockchainRecord[];
    private difficulty: number = 2; // Simple Proof of Work difficulty (leading zeros)

    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    private createGenesisBlock(): BlockchainRecord {
        return {
            index: 0,
            timestamp: Date.now(),
            fileHash: "0",
            documentId: "GENESIS_BLOCK",
            action: 'REGISTRATION',
            verified: true,
            previousHash: "0",
            currentHash: "0000GENESIS_HASH_START_OF_CHAIN",
            nonce: 0
        };
    }

    public getLatestBlock(): BlockchainRecord {
        return this.chain[this.chain.length - 1];
    }

    // --- Core: SHA-256 Hashing for File Content ---
    public async verifyHash(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // --- Core: Block Hashing (The "Chain" Logic) ---
    private async calculateBlockHash(
        index: number,
        previousHash: string,
        timestamp: number,
        data: string,
        nonce: number
    ): Promise<string> {
        const input = index + previousHash + timestamp + data + nonce;
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- Core: Mining (Proof of Work - Academic Demo) ---
    // In a real private permissioned chain, this might be replaced by a simple signature,
    // but for the "Learning Opportunity", we implement basic PoW.
    public async addBlock(
        fileHash: string,
        documentId: string,
        action: 'REGISTRATION' | 'VERIFICATION' | 'MODIFICATION_CHECK'
    ): Promise<BlockchainRecord> {
        const previousBlock = this.getLatestBlock();
        const nextIndex = previousBlock.index + 1;
        const timestamp = Date.now();
        const data = fileHash + documentId + action;
        let nonce = 0;
        let hash = await this.calculateBlockHash(nextIndex, previousBlock.currentHash, timestamp, data, nonce);

        // Simple Proof of Work: Find a hash starting with "00..."
        // In a real browser app, we keep difficulty VERY low to not freeze UI.
        while (hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
            nonce++;
            hash = await this.calculateBlockHash(nextIndex, previousBlock.currentHash, timestamp, data, nonce);

            // Safety break for huge loops in JS single thread
            if (nonce > 1000000) break;
        }

        const newBlock: BlockchainRecord = {
            index: nextIndex,
            timestamp,
            fileHash,
            documentId,
            action,
            verified: true, // Initially true as we just mined it
            previousHash: previousBlock.currentHash,
            currentHash: hash,
            nonce
        };

        this.chain.push(newBlock);
        return newBlock;
    }

    // --- Integrity Check: Validate the Entire Chain ---
    public async isChainValid(): Promise<boolean> {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // 1. Check if current block's hash is valid
            const data = currentBlock.fileHash + currentBlock.documentId + currentBlock.action;
            const calculatedHash = await this.calculateBlockHash(
                currentBlock.index,
                currentBlock.previousHash,
                currentBlock.timestamp,
                data,
                currentBlock.nonce || 0
            );

            if (currentBlock.currentHash !== calculatedHash) {
                console.error(`Block ${i} Invalid: Hash mismatch. Calculated: ${calculatedHash}, Stored: ${currentBlock.currentHash}`);
                return false;
            }

            // 2. Check if previousHash link is valid
            if (currentBlock.previousHash !== previousBlock.currentHash) {
                console.error(`Block ${i} Invalid: previousHash link broken.`);
                return false;
            }
        }
        return true;
    }

    public getChain(): BlockchainRecord[] {
        return this.chain;
    }
}

// Export singleton instance
export const blockchainService = new SimpleBlockchainService();

// Keep standalone helper export for legacy compatibility if needed, 
// though using the class instance is preferred.
export const verifyHash = (file: File) => blockchainService.verifyHash(file);
