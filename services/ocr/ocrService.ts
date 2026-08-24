import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/config/env";
import { OcrResult, OcrWordBox } from "@/types";

export interface OcrEngineOptions {
  language?: string;
  provider?: "TESSERACT" | "GOOGLE_VISION" | "OPENAI_VISION";
}

export class OcrService {
  /**
   * Run OCR extraction on an image buffer or file path.
   */
  static async extractText(
    imageSource: Buffer | string,
    analysisId: string,
    options?: OcrEngineOptions
  ): Promise<OcrResult> {
    const startTime = Date.now();
    const provider = options?.provider || (env.OCR_PROVIDER.toUpperCase() as "TESSERACT");

    try {
      if (provider === "GOOGLE_VISION" && env.OCR_API_KEY) {
        return await this.runGoogleVisionOcr(imageSource, analysisId, startTime);
      }

      // Default to robust standalone worker process
      return await this.runIsolatedTesseractOcr(imageSource, analysisId, startTime);
    } catch (err: any) {
      console.error("OCR Service execution error:", err?.message || err);
      return {
        id: uuidv4(),
        analysisId,
        provider: "FALLBACK",
        rawText: "",
        confidence: 0,
        wordCount: 0,
        languageDetected: "unknown",
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      };
    }
  }

  private static async runIsolatedTesseractOcr(
    imageSource: Buffer | string,
    analysisId: string,
    startTime: number
  ): Promise<OcrResult> {
    return new Promise((resolve) => {
      let imageFilePath = "";

      // Ensure we have a physical file path for the worker
      if (typeof imageSource === "string" && fs.existsSync(imageSource)) {
        imageFilePath = imageSource;
      } else {
        const tempDir = path.join(process.cwd(), ".data", "tmp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        imageFilePath = path.join(tempDir, `ocr-${analysisId}.png`);
        const buffer = Buffer.isBuffer(imageSource) ? imageSource : Buffer.from(imageSource);
        fs.writeFileSync(imageFilePath, buffer);
      }

      const runnerScript = path.join(process.cwd(), "services", "ocr", "ocrRunner.js");

      // Execute standalone Node process via process.execPath
      execFile(
        process.execPath,
        [runnerScript, imageFilePath, analysisId],
        { maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
        (error, stdout, stderr) => {
          if (error) {
            console.warn("OCR process error:", error.message || stderr);
            resolve({
              id: uuidv4(),
              analysisId,
              provider: "TESSERACT",
              rawText: "",
              confidence: 0,
              wordCount: 0,
              languageDetected: "eng",
              processingTimeMs: Date.now() - startTime,
              createdAt: new Date().toISOString(),
            });
            return;
          }

          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.success && parsed.data) {
              resolve({
                id: uuidv4(),
                analysisId,
                provider: "TESSERACT",
                rawText: parsed.data.rawText || "",
                confidence: parsed.data.confidence || 80,
                wordCount: parsed.data.wordCount || 0,
                languageDetected: "eng",
                processingTimeMs: Date.now() - startTime,
                words: parsed.data.words || [],
                lines: parsed.data.lines || [],
                createdAt: new Date().toISOString(),
              });
            } else {
              console.warn("OCR worker response error:", parsed.error);
              resolve({
                id: uuidv4(),
                analysisId,
                provider: "TESSERACT",
                rawText: "",
                confidence: 0,
                wordCount: 0,
                languageDetected: "eng",
                processingTimeMs: Date.now() - startTime,
                createdAt: new Date().toISOString(),
              });
            }
          } catch (jsonErr) {
            console.warn("OCR JSON parse error:", jsonErr, "raw output:", stdout);
            resolve({
              id: uuidv4(),
              analysisId,
              provider: "TESSERACT",
              rawText: stdout || "",
              confidence: 75,
              wordCount: (stdout || "").split(/\s+/).filter(Boolean).length,
              languageDetected: "eng",
              processingTimeMs: Date.now() - startTime,
              createdAt: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  private static async runGoogleVisionOcr(
    imageSource: Buffer | string,
    analysisId: string,
    startTime: number
  ): Promise<OcrResult> {
    const base64Image = Buffer.isBuffer(imageSource)
      ? imageSource.toString("base64")
      : "";

    if (!base64Image) {
      return this.runIsolatedTesseractOcr(imageSource, analysisId, startTime);
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${env.OCR_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
    const rawText = fullTextAnnotation?.text?.trim() || "";
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;

    return {
      id: uuidv4(),
      analysisId,
      provider: "GOOGLE_VISION",
      rawText,
      confidence: 95,
      wordCount,
      languageDetected: "eng",
      processingTimeMs: Date.now() - startTime,
      createdAt: new Date().toISOString(),
    };
  }
}
