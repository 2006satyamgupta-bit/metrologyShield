import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/lib/database/db";
import { AnalysisOrchestrator } from "@/services/orchestrator/analysisOrchestrator";
import { ComplianceStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default-user";
    const status = (searchParams.get("status") as ComplianceStatus | "ALL") || "ALL";
    const search = searchParams.get("search") || "";
    const sortBy = (searchParams.get("sortBy") as any) || "date_desc";

    const records = await DatabaseRepository.getUserAnalyses(userId, {
      status,
      search,
      sortBy,
    });

    return NextResponse.json({ success: true, data: records });
  } catch (err: any) {
    console.error("GET /api/analyze error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const productName = (formData.get("productName") as string) || "Untitled Package Label";
    const userId = (formData.get("userId") as string) || "default-user";

    const allFiles: File[] = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image file provided in request." },
        { status: 400 }
      );
    }

    const filePayloads = await Promise.all(
      allFiles.map(async (f) => {
        const arrayBuffer = await f.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuffer),
          fileName: f.name,
          mimeType: f.type || "image/jpeg",
        };
      })
    );

    const result = await AnalysisOrchestrator.processNewUpload(
      userId,
      productName,
      filePayloads
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/analyze error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Analysis failed." },
      { status: 500 }
    );
  }
}
