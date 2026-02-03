import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - we assume the worker is copied to /public/pdf.worker.min.mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `[Page ${i}] ${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error("PDF Extraction Failed:", error);
        return "Error: Could not extract text from PDF. File might be encrypted or scanned image.";
    }
};
