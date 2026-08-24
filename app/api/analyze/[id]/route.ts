import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/lib/database/db";
import { AnalysisOrchestrator } from "@/services/orchestrator/analysisOrchestrator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const analysis = await DatabaseRepository.getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error("GET /api/analyze/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { userId = "default-user", extractedFields } = body;

    if (!extractedFields) {
      return NextResponse.json(
        { success: false, error: "Missing extractedFields in request body." },
        { status: 400 }
      );
    }

    const updated = await AnalysisOrchestrator.reevaluateWithUserCorrections(
      id,
      userId,
      extractedFields
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/analyze/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update analysis" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default-user";

    const deleted = await DatabaseRepository.deleteAnalysis(id, userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete analysis or not authorized." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Analysis deleted successfully." });
  } catch (err: any) {
    console.error("DELETE /api/analyze/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
