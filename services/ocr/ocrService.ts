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

    // Guard against empty or invalid input
    if (
      !imageSource ||
      (Buffer.isBuffer(imageSource) && imageSource.length < 10) ||
      (typeof imageSource === "string" && !fs.existsSync(imageSource))
    ) {
      return {
        id: uuidv4(),
        analysisId,
        provider: "FALLBACK",
        rawText: "",
        confidence: 0,
        wordCount: 0,
        languageDetected: "unknown",
        processingTimeMs: Date.now() - startTime,
        words: [],
        lines: [],
        createdAt: new Date().toISOString(),
      };
    }

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
        words: [],
        lines: [],
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
    let isTempFile = false;

    try {
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
        isTempFile = true;
      }

      // Direct in-process Tesseract execution using local trained weights
      const langPath = path.join(process.cwd(), "public");
      const hasLocalTessdata = fs.existsSync(path.join(langPath, "eng.traineddata"));

      const recognizePromise = (async (): Promise<OcrResult> => {
        const res = await Tesseract.recognize(imageFilePath, "eng", {
          langPath: hasLocalTessdata ? langPath : undefined,
        });

        const pageData = res.data as any;
        const rawText = (pageData.text || "").trim();
        const words: OcrWordBox[] = (pageData.words || []).map((w: any) => ({
          text: w.text,
          confidence: Math.round(w.confidence || 0),
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
          confidence: Math.round(l.confidence || 0),
          bbox: {
            x0: l.bbox?.x0 || 0,
            y0: l.bbox?.y0 || 0,
            x1: l.bbox?.x1 || 0,
            y1: l.bbox?.y1 || 0,
          },
        }));

        return {
          id: uuidv4(),
          analysisId,
          provider: "TESSERACT",
          rawText,
          confidence: Math.round(res.data.confidence || (words.length > 0 ? 80 : 0)),
          wordCount: words.length,
          languageDetected: "eng",
          processingTimeMs: Date.now() - startTime,
          words,
          lines,
          createdAt: new Date().toISOString(),
        };
      })();

      // 20-second safety timeout
      const timeoutPromise = new Promise<OcrResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Tesseract OCR timed out after 20s for analysis ${analysisId}`));
        }, 20000);
      });

      return await Promise.race([recognizePromise, timeoutPromise]);
    } catch (err: any) {
      console.warn("Tesseract OCR failed/timed out:", err?.message || err);

      // Attempt Google Vision fallback if API key is configured
      if (env.OCR_API_KEY && env.OCR_API_KEY.trim() !== "") {
        try {
          return await this.runGoogleVisionOcr(imageSource, analysisId, startTime);
        } catch (gvErr: any) {
          console.error("Google Vision fallback also failed:", gvErr?.message || gvErr);
        }
      }

      // Honest failure result with zero fabricated data
      return {
        id: uuidv4(),
        analysisId,
        provider: "FALLBACK",
        rawText: "",
        confidence: 0,
        wordCount: 0,
        languageDetected: "unknown",
        processingTimeMs: Date.now() - startTime,
        words: [],
        lines: [],
        createdAt: new Date().toISOString(),
      };
    } finally {
      if (isTempFile && imageFilePath) {
        try {
          fs.unlinkSync(imageFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
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
