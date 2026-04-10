/**
 * Client-side PDF text extraction using pdfjs loaded from CDN.
 * Avoids bundler issues with pdfjs-dist v5 node: scheme imports.
 */

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

interface PDFJSLib {
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PDFDocument> };
  GlobalWorkerOptions: { workerSrc: string };
}

interface PDFDocument {
  numPages: number;
  getPage: (num: number) => Promise<PDFPage>;
}

interface PDFPage {
  getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
}

let pdfjsLib: PDFJSLib | null = null;

async function loadPdfjs(): Promise<PDFJSLib> {
  if (pdfjsLib) return pdfjsLib;

  const win = window as unknown as Record<string, unknown>;

  if (!win.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PDFJS_CDN}/pdf.min.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
      document.head.appendChild(script);
    });
  }

  const lib = win.pdfjsLib as PDFJSLib | undefined;
  if (!lib) {
    throw new Error("PDF.js failed to initialize — pdfjsLib not found on window");
  }

  lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
  pdfjsLib = lib;
  return lib;
}

/**
 * Extract text from a PDF ArrayBuffer.
 */
export async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<string> {
  const lib = await loadPdfjs();
  const pdf = await lib.getDocument({ data: pdfData }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if (item.str !== undefined) return item.str;
        return "";
      })
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

/**
 * Extract text from a File object (PDF).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return extractTextFromPDF(buffer);
}
