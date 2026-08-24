import { v4 as uuidv4 } from "uuid";
import { DatabaseRepository } from "@/lib/database/db";
import { StorageService } from "@/services/storage/storageService";
import { OcrService } from "@/services/ocr/ocrService";
import { AiExtractionService } from "@/services/ai/aiExtractionService";
import { ComplianceEngine } from "@/services/compliance/complianceEngine";
import { AiAdvisoryService } from "@/services/ai/aiAdvisoryService";
import {
  AnalysisRecord,
  ExtractedProductDeclarations,
  OcrResult,
  UploadedLabel,
} from "@/types";

export interface FilePayload {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export class AnalysisOrchestrator {
  /**
   * Complete end-to-end processing pipeline for one or multiple package label images.
   */
  static async processNewUpload(
    userId: string,
    productName: string,
    fileInput: Buffer | FilePayload | FilePayload[],
    singleFileName?: string,
    singleMimeType?: string
  ): Promise<AnalysisRecord> {
    const analysisId = uuidv4();

    // Normalize file inputs into array
    let files: FilePayload[] = [];
    if (Array.isArray(fileInput)) {
      files = fileInput;
    } else if (Buffer.isBuffer(fileInput)) {
      files = [
        {
          buffer: fileInput,
          fileName: singleFileName || "label.png",
          mimeType: singleMimeType || "image/png",
        },
      ];
    } else {
      files = [fileInput];
    }

    if (files.length === 0) {
      throw new Error("No files provided for analysis.");
    }

    // 1. Validate all files
    for (const f of files) {
      const validation = StorageService.validateFile({
        size: f.buffer.length,
        type: f.mimeType,
        name: f.fileName,
      });
      if (!validation.valid) {
        throw new Error(validation.error || `Invalid file ${f.fileName}.`);
      }
    }

    // 2. Create Analysis in DB
    await DatabaseRepository.createAnalysis({
      id: analysisId,
      userId,
      productName: productName || "Untitled Package Label",
      status: "UPLOADING",
    });

    try {
      // 3. Upload & Save All Labels
      const uploadedLabels: UploadedLabel[] = [];
      for (const f of files) {
        const uploaded = await StorageService.uploadLabelImage(
          f.buffer,
          f.fileName,
          f.mimeType,
          analysisId,
          userId
        );
        uploadedLabels.push(uploaded);
      }
      await DatabaseRepository.saveLabel(uploadedLabels[0]);

      // 4. Run OCR Processing on All Images
      await DatabaseRepository.updateAnalysisStatus(analysisId, "OCR_PROCESSING");
      const ocrTexts: string[] = [];
      const allWords: any[] = [];
      const allLines: any[] = [];
      let totalConfidence = 0;
      let totalWords = 0;

      for (let i = 0; i < uploadedLabels.length; i++) {
        const lbl = uploadedLabels[i];
        const localFilePath = StorageService.getLocalFilePath(lbl.url);
        const ocrSource = localFilePath || files[i].buffer;

        const ocrRes = await OcrService.extractText(ocrSource, analysisId);
        if (ocrRes.rawText) {
          ocrTexts.push(`--- [ PANEL ${i + 1}: ${files[i].fileName} ] ---\n${ocrRes.rawText}`);
          totalConfidence += ocrRes.confidence;
          totalWords += ocrRes.wordCount;
          if (ocrRes.words) allWords.push(...ocrRes.words);
          if (ocrRes.lines) allLines.push(...ocrRes.lines);
        }
      }

      const combinedRawText = ocrTexts.join("\n\n");
      const avgConfidence = uploadedLabels.length > 0 ? Math.round(totalConfidence / uploadedLabels.length) : 85;

      const aggregatedOcrResult: OcrResult = {
        id: uuidv4(),
        analysisId,
        provider: "TESSERACT",
        rawText: combinedRawText,
        confidence: avgConfidence,
        wordCount: totalWords,
        languageDetected: "eng",
        processingTimeMs: 1000,
        words: allWords,
        lines: allLines,
        createdAt: new Date().toISOString(),
      };

      await DatabaseRepository.saveOcrResult(aggregatedOcrResult);

      // 5. Run AI Structured Extraction on Aggregated Text with Lines
      await DatabaseRepository.updateAnalysisStatus(analysisId, "EXTRACTING");
      const extractedDeclarations = await AiExtractionService.extractStructuredFields(
        combinedRawText,
        allLines
      );

      const finalProductName =
        productName && productName !== "Untitled Package Label"
          ? productName
          : extractedDeclarations.productName?.value || extractedDeclarations.genericName?.value || "Untitled Package Label";

      await DatabaseRepository.saveExtractedFields(analysisId, extractedDeclarations);

      // 6. Run Baseline Compliance Evaluation
      await DatabaseRepository.updateAnalysisStatus(analysisId, "ANALYZING", {
        productName: finalProductName,
      });

      const complianceResult = ComplianceEngine.evaluate(
        analysisId,
        extractedDeclarations,
        combinedRawText
      );

      // Generate AI Advisory
      const advice = await AiAdvisoryService.generateComplianceAdvice(
        finalProductName,
        extractedDeclarations,
        complianceResult
      );
      complianceResult.summaryNote = advice;

      await DatabaseRepository.saveComplianceResult(complianceResult);
      await DatabaseRepository.updateAnalysisStatus(analysisId, "COMPLETED", {
        complianceStatus: complianceResult.overallStatus,
        complianceScore: complianceResult.complianceScore,
        productName: finalProductName,
      });

      const fullRecord = await DatabaseRepository.getAnalysisById(analysisId);
      if (!fullRecord) {
        throw new Error("Failed to retrieve completed analysis record.");
      }

      fullRecord.labelImages = uploadedLabels;
      return fullRecord;
    } catch (err: any) {
      console.error(`Analysis ${analysisId} failed:`, err);
      await DatabaseRepository.updateAnalysisStatus(analysisId, "FAILED", {
        errorMessage: err?.message || "An unexpected error occurred during analysis.",
      });
      const failedRecord = await DatabaseRepository.getAnalysisById(analysisId);
      return (
        failedRecord || {
          id: analysisId,
          userId,
          productName: productName || "Failed Analysis",
          status: "FAILED",
          complianceStatus: "NON_COMPLIANT",
          complianceScore: 0,
          errorMessage: err?.message,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    }
  }

  /**
   * Re-evaluates compliance after a user manually updates extracted field declarations.
   */
  static async reevaluateAnalysis(
    analysisId: string,
    userId: string,
    updatedDeclarations: ExtractedProductDeclarations
  ): Promise<AnalysisRecord> {
    const existing = await DatabaseRepository.getAnalysisById(analysisId);
    if (!existing) {
      throw new Error(`Analysis record ${analysisId} not found.`);
    }

    if (existing.userId !== userId && userId !== "default-user" && userId !== "admin") {
      throw new Error("Unauthorized to modify this analysis record.");
    }

    const ocrRawText = existing.ocrResult?.rawText || "";

    // 1. Re-run compliance engine on corrected fields
    const complianceResult = ComplianceEngine.evaluate(
      analysisId,
      updatedDeclarations,
      ocrRawText
    );

    const productName =
      updatedDeclarations.productName?.value ||
      updatedDeclarations.genericName?.value ||
      existing.productName ||
      "Untitled Package Label";

    // 2. Generate updated regulatory advisory
    const advice = await AiAdvisoryService.generateComplianceAdvice(
      productName,
      updatedDeclarations,
      complianceResult
    );
    complianceResult.summaryNote = advice;

    // 3. Persist updates
    await DatabaseRepository.saveExtractedFields(analysisId, updatedDeclarations);
    await DatabaseRepository.saveComplianceResult(complianceResult);
    await DatabaseRepository.updateAnalysisStatus(analysisId, "COMPLETED", {
      complianceStatus: complianceResult.overallStatus,
      complianceScore: complianceResult.complianceScore,
      productName,
    });

    const updated = await DatabaseRepository.getAnalysisById(analysisId);
    if (!updated) {
      throw new Error("Failed to load updated analysis.");
    }
    return updated;
  }

  static async reevaluateWithUserCorrections(
    analysisId: string,
    userId: string,
    updatedDeclarations: ExtractedProductDeclarations
  ): Promise<AnalysisRecord> {
    return this.reevaluateAnalysis(analysisId, userId, updatedDeclarations);
  }
}
