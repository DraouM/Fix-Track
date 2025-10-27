// app/api/escpos-test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This is a simple API route to test if the ESC/POS encoder works
    return NextResponse.json({
      success: true,
      message: "ESC/POS test endpoint is working",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
