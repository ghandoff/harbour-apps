import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/**
 * extract plain text from an uploaded file (PDF, DOCX, or TXT).
 * runs server-side only.
 */
export async function extract_text(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const array_buffer = await file.arrayBuffer();

  switch (ext) {
    case "pdf":
      return extract_pdf(array_buffer);
    case "docx":
      return extract_docx(Buffer.from(array_buffer));
    case "txt":
      return new TextDecoder().decode(array_buffer);
    default:
      throw new Error(`unsupported file type: .${ext}`);
  }
}

async function extract_pdf(data: ArrayBuffer): Promise<string> {
  const uint8 = new Uint8Array(data);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();
  return typeof result === "string" ? result : String(result);
}

async function extract_docx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
