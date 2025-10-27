import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Application is running successfully",
  });
}

export const dynamic = "force-dynamic";
