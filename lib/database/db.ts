import fs from "fs";
import path from "path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AnalysisRecord,
  ComplianceResult,
  DashboardStats,
  ExtractedProductDeclarations,
  OcrResult,
  UploadedLabel,
  ViolationRecord,
  AnalysisStatus,
  ComplianceStatus,
} from "@/types";

import os from "os";

const LOCAL_DB_DIR = path.join(process.cwd(), ".data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "analyses_db.json");
const TMP_DB_FILE = path.join(os.tmpdir(), "metroshield_analyses_db.json");

interface LocalDbSchema {
  analyses: Record<string, AnalysisRecord>;
  users: Record<string, { id: string; email: string; fullName: string }>;
}

let inMemoryDb: LocalDbSchema | null = null;

function ensureLocalDb(): LocalDbSchema {
  if (inMemoryDb && Object.keys(inMemoryDb.analyses).length > 0) {
    return inMemoryDb;
  }

  let dbData: LocalDbSchema = { analyses: {}, users: {} };

  // 1. Try reading from bundled project file (.data/analyses_db.json)
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const content = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        dbData = {
          analyses: { ...dbData.analyses, ...(parsed.analyses || {}) },
          users: { ...dbData.users, ...(parsed.users || {}) },
        };
      }
    }
  } catch (err) {
    console.warn("Could not read bundled DB file:", err);
  }

  // 2. Try overlaying data from temp writable file (/tmp/metroshield_analyses_db.json)
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const tmpContent = fs.readFileSync(TMP_DB_FILE, "utf-8");
      const tmpParsed = JSON.parse(tmpContent);
      if (tmpParsed && typeof tmpParsed === "object") {
        dbData = {
          analyses: { ...dbData.analyses, ...(tmpParsed.analyses || {}) },
          users: { ...dbData.users, ...(tmpParsed.users || {}) },
        };
      }
    }
  } catch (err) {
    console.warn("Could not read tmp DB file:", err);
  }

  inMemoryDb = dbData;
  return inMemoryDb;
}

function saveLocalDb(data: LocalDbSchema) {
  inMemoryDb = data;

  // Try saving to .data if writable (local dev)
  try {
    if (!fs.existsSync(LOCAL_DB_DIR)) {
      fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return;
  } catch {
    // Expected on read-only environments like Vercel Lambda
  }

  // Fallback to saving in /tmp for serverless persistence
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Local tmp DB write error, preserved in-memory:", err);
  }
}

export class DatabaseRepository {
  private static isSupabaseConfigured(): boolean {
    const supabase = createServerSupabaseClient();
    return supabase !== null;
  }

  // --- ANALYSES ---
  static async createAnalysis(data: {
    id: string;
    userId: string;
    productName: string;
    status: AnalysisStatus;
  }): Promise<AnalysisRecord> {
    const supabase = createServerSupabaseClient();

    const record: AnalysisRecord = {
      id: data.id,
      userId: data.userId,
      productName: data.productName,
      status: data.status,
      complianceStatus: null,
      complianceScore: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from("analyses").insert({
          id: record.id,
          user_id: record.userId,
          product_name: record.productName,
          status: record.status,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        });
        if (error) throw error;
      } catch (err) {
        console.warn("Supabase createAnalysis failed, falling back to local DB:", err);
      }
    }

    const localDb = ensureLocalDb();
    localDb.analyses[record.id] = record;
    saveLocalDb(localDb);

    return record;
  }

  static async getAnalysisById(id: string): Promise<AnalysisRecord | null> {
    const supabase = createServerSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("analyses")
          .select("*, uploaded_labels(*), ocr_results(*), compliance_results(*)")
          .eq("id", id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            productName: data.product_name,
            status: data.status,
            complianceStatus: data.compliance_status,
            complianceScore: data.compliance_score,
            errorMessage: data.error_message,
            labelImage: data.uploaded_labels?.[0]
              ? {
                  id: data.uploaded_labels[0].id,
                  analysisId: data.id,
                  fileName: data.uploaded_labels[0].file_name,
                  storagePath: data.uploaded_labels[0].storage_path,
                  mimeType: data.uploaded_labels[0].mime_type,
                  fileSizeBytes: data.uploaded_labels[0].file_size_bytes,
                  url: data.uploaded_labels[0].url,
                  createdAt: data.uploaded_labels[0].created_at,
                }
              : undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn("Supabase getAnalysisById failed, falling back to local DB:", err);
      }
    }

    const localDb = ensureLocalDb();
    return localDb.analyses[id] || null;
  }

  static async updateAnalysisStatus(
    id: string,
    status: AnalysisStatus,
    extra?: {
      errorMessage?: string | null;
      complianceStatus?: ComplianceStatus | null;
      complianceScore?: number | null;
      productName?: string;
    }
  ): Promise<void> {
    const supabase = createServerSupabaseClient();
    const updatedAt = new Date().toISOString();

    if (supabase) {
      try {
        await supabase
          .from("analyses")
          .update({
            status,
            error_message: extra?.errorMessage ?? null,
            compliance_status: extra?.complianceStatus ?? null,
            compliance_score: extra?.complianceScore ?? null,
            product_name: extra?.productName,
            updated_at: updatedAt,
          })
          .eq("id", id);
      } catch (err) {
        console.warn("Supabase updateAnalysisStatus failed:", err);
      }
    }

    const localDb = ensureLocalDb();
    if (localDb.analyses[id]) {
      localDb.analyses[id] = {
        ...localDb.analyses[id],
        status,
        updatedAt,
        ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
        ...(extra?.complianceStatus !== undefined && { complianceStatus: extra.complianceStatus }),
        ...(extra?.complianceScore !== undefined && { complianceScore: extra.complianceScore }),
        ...(extra?.productName !== undefined && { productName: extra.productName }),
      };
      saveLocalDb(localDb);
    }
  }

  static async saveLabel(label: UploadedLabel): Promise<void> {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("uploaded_labels").insert({
          id: label.id,
          analysis_id: label.analysisId,
          file_name: label.fileName,
          storage_path: label.storagePath,
          mime_type: label.mimeType,
          file_size_bytes: label.fileSizeBytes,
          url: label.url,
          created_at: label.createdAt,
        });
      } catch (err) {
        console.warn("Supabase saveLabel failed:", err);
      }
    }

    const localDb = ensureLocalDb();
    if (localDb.analyses[label.analysisId]) {
      localDb.analyses[label.analysisId].labelImage = label;
      saveLocalDb(localDb);
    }
  }

  static async saveOcrResult(ocr: OcrResult): Promise<void> {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("ocr_results").insert({
          id: ocr.id,
          analysis_id: ocr.analysisId,
          provider: ocr.provider,
          raw_text: ocr.rawText,
          confidence: ocr.confidence,
          word_count: ocr.wordCount,
          language_detected: ocr.languageDetected,
          processing_time_ms: ocr.processingTimeMs,
          created_at: ocr.createdAt,
        });
      } catch (err) {
        console.warn("Supabase saveOcrResult failed:", err);
      }
    }

    const localDb = ensureLocalDb();
    if (localDb.analyses[ocr.analysisId]) {
      localDb.analyses[ocr.analysisId].ocrResult = ocr;
      saveLocalDb(localDb);
    }
  }

  static async saveExtractedFields(
    analysisId: string,
    fields: ExtractedProductDeclarations
  ): Promise<void> {
    const localDb = ensureLocalDb();
    if (localDb.analyses[analysisId]) {
      localDb.analyses[analysisId].extractedFields = fields;
      if (fields.productName?.value) {
        localDb.analyses[analysisId].productName = fields.productName.value;
      }
      saveLocalDb(localDb);
    }
  }

  static async saveComplianceResult(result: ComplianceResult): Promise<void> {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("compliance_results").insert({
          id: result.id,
          analysis_id: result.analysisId,
          overall_status: result.overallStatus,
          compliance_score: result.complianceScore,
          total_rules: result.totalRulesEvaluated,
          passed_rules: result.passedRulesCount,
          failed_rules: result.failedRulesCount,
          warning_rules: result.warningRulesCount,
          assessed_at: result.assessedAt,
          summary_note: result.summaryNote,
        });
      } catch (err) {
        console.warn("Supabase saveComplianceResult failed:", err);
      }
    }

    const localDb = ensureLocalDb();
    if (localDb.analyses[result.analysisId]) {
      localDb.analyses[result.analysisId].complianceResult = result;
      localDb.analyses[result.analysisId].complianceStatus = result.overallStatus;
      localDb.analyses[result.analysisId].complianceScore = result.complianceScore;
      localDb.analyses[result.analysisId].status = "COMPLETED";
      saveLocalDb(localDb);
    }
  }

  static async getUserAnalyses(
    userId: string,
    filters?: {
      status?: ComplianceStatus | "ALL";
      search?: string;
      sortBy?: "date_desc" | "date_asc" | "score_desc" | "score_asc";
    }
  ): Promise<AnalysisRecord[]> {
    const localDb = ensureLocalDb();
    let records = Object.values(localDb.analyses).filter(
      (a) => a.userId === userId || userId === "default-user" || userId === "admin"
    );

    // Apply search filter
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.productName?.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.extractedFields?.manufacturerName?.value?.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (filters?.status && filters.status !== "ALL") {
      records = records.filter((r) => r.complianceStatus === filters.status);
    }

    // Sorting
    records.sort((a, b) => {
      if (filters?.sortBy === "date_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters?.sortBy === "score_desc") {
        return (b.complianceScore ?? 0) - (a.complianceScore ?? 0);
      }
      if (filters?.sortBy === "score_asc") {
        return (a.complianceScore ?? 0) - (b.complianceScore ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return records;
  }

  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    const analyses = await this.getUserAnalyses(userId);

    const completed = analyses.filter((a) => a.status === "COMPLETED");
    const compliantCount = completed.filter((a) => a.complianceStatus === "COMPLIANT").length;
    const partiallyCompliantCount = completed.filter(
      (a) => a.complianceStatus === "PARTIALLY_COMPLIANT"
    ).length;
    const nonCompliantCount = completed.filter(
      (a) => a.complianceStatus === "NON_COMPLIANT"
    ).length;
    const requiresReviewCount = completed.filter(
      (a) => a.complianceStatus === "REQUIRES_REVIEW"
    ).length;

    const totalScores = completed.reduce((sum, a) => sum + (a.complianceScore ?? 0), 0);
    const averageScore = completed.length > 0 ? Math.round(totalScores / completed.length) : 0;

    // Aggregate top violations across completed analyses
    const violationMap = new Map<
      string,
      { ruleCode: string; name: string; count: number; severity: any }
    >();

    completed.forEach((a) => {
      a.complianceResult?.violations.forEach((v) => {
        if (v.status === "VIOLATION") {
          const key = v.ruleCode;
          const current = violationMap.get(key) || {
            ruleCode: v.ruleCode,
            name: v.ruleName,
            count: 0,
            severity: v.severity,
          };
          current.count += 1;
          violationMap.set(key, current);
        }
      });
    });

    const topViolations = Array.from(violationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAnalyses: analyses.length,
      compliantCount,
      partiallyCompliantCount,
      nonCompliantCount,
      requiresReviewCount,
      averageScore,
      recentAnalyses: analyses.slice(0, 5),
      topViolations,
    };
  }

  static async deleteAnalysis(id: string, userId: string): Promise<boolean> {
    const localDb = ensureLocalDb();
    const item = localDb.analyses[id];
    if (!item) return false;
    if (item.userId !== userId && userId !== "admin" && userId !== "default-user") {
      return false;
    }
    delete localDb.analyses[id];
    saveLocalDb(localDb);
    return true;
  }
}
