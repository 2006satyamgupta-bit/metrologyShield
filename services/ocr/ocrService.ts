import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/config/env";
import { OcrResult, OcrWordBox } from "@/types";

import os from "os";
import Tesseract from "tesseract.js";

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

      // Default to isolated process or in-process fallback
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
    let imageFilePath = "";

    // Ensure we have a physical file path for the worker
    if (typeof imageSource === "string" && fs.existsSync(imageSource)) {
      imageFilePath = imageSource;
    } else {
      const tempDir = path.join(os.tmpdir(), "metroshield_tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      imageFilePath = path.join(tempDir, `ocr-${analysisId}.png`);
      const buffer = Buffer.isBuffer(imageSource) ? imageSource : Buffer.from(imageSource);
      fs.writeFileSync(imageFilePath, buffer);
    }

    const runnerScript = path.join(process.cwd(), "services", "ocr", "ocrRunner.js");

    // Execute standalone Node process via process.execPath with in-process fallback
    return new Promise(async (resolve) => {
      execFile(
        process.execPath,
        [runnerScript, imageFilePath, analysisId],
        { maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
        async (error, stdout, stderr) => {
          if (error) {
            console.warn("Worker process failed, attempting in-process Tesseract:", error.message || stderr);
            try {
              const res = await Tesseract.recognize(imageFilePath, "eng");
              const pageData = res.data as any;
              const rawText = (pageData.text || "").trim();
              const words = (pageData.words || []).map((w: any) => ({
                text: w.text,
                confidence: Math.round(w.confidence || 80),
                bbox: {
                  x0: w.bbox?.x0 || 0,
                  y0: w.bbox?.y0 || 0,
                  x1: w.bbox?.x1 || 0,
                  y1: w.bbox?.y1 || 0,
                },
              }));
              const lines = (pageData.lines || []).map((l: any, idx: number) => ({
                lineIndex: idx,
                text: l.text?.trim() || "",
                confidence: Math.round(l.confidence || 80),
                bbox: {
                  x0: l.bbox?.x0 || 0,
                  y0: l.bbox?.y0 || 0,
                  x1: l.bbox?.x1 || 0,
                  y1: l.bbox?.y1 || 0,
                },
              }));

              resolve({
                id: uuidv4(),
                analysisId,
                provider: "TESSERACT",
                rawText,
                confidence: Math.round(res.data.confidence || 85),
                wordCount: words.length,
                languageDetected: "eng",
                processingTimeMs: Date.now() - startTime,
                words,
                lines,
                createdAt: new Date().toISOString(),
              });
              return;
            } catch (fallbackErr: any) {
              console.error("In-process Tesseract fallback error:", fallbackErr);
            }
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
