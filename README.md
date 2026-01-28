
# FusionSeek - Fully Offline Edition

This version of FusionSeek is configured to run **completely offline** using local LLMs via Ollama. No data leaves your machine.

## Prerequisites

1.  **Node.js** (v18+)
2.  **Ollama**: Download from [ollama.com](https://ollama.com).

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local AI (Ollama)
Ensure Ollama is installed, then run the following commands in your terminal to pull the required models:

```bash
# Pull the text model (for documents and Q&A)
ollama pull llama3

# Pull the vision model (for image analysis)
ollama pull llava

# Pull the embedding model (CRITICAL for efficient search)
ollama pull nomic-embed-text
```

### 3. Start the Backend
Start the Ollama server (if not already running):
```bash
ollama serve
```

### 4. Run the Application
In a new terminal window:
```bash
npm run dev
```

## How It Works
*   All queries are sent to `http://localhost:11434` instead of Google Cloud.
*   **Text Analysis**: Uses `llama3`.
*   **Image Analysis**: Uses `llava`.
*   **Documents**: PDFs and text files are processed locally.

## Troubleshooting
*   **"The Intelligence Engine... encountered an error"**: Make sure `ollama serve` is running and you have pulled the models.
*   **Connection Refused / Network Error**: You may need to allow browser origins. Run Ollama with: `OLLAMA_ORIGINS="*" ollama serve`.
*   **Slow Performance**: Local LLM inference depends heavily on your GPU/CPU.
