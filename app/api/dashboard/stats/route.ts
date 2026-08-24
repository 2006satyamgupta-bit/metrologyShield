import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/lib/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default-user";

    const stats = await DatabaseRepository.getDashboardStats(userId);

    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    console.error("GET /api/dashboard/stats error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
