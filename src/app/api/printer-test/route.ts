import { NextResponse } from "next/server";

export async function GET() {
  // This is a simple health check endpoint
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Printer test endpoint is available",
  });
}

// Add a POST endpoint to test printer functionality
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testType } = body;

    // Simulate printer test based on type
    switch (testType) {
      case "escpos":
        return NextResponse.json({
          success: true,
          message: "ESC/POS test completed successfully",
          data: {
            bytesSent: 1024,
            printerResponse: "ACK",
          },
        });

      case "discovery":
        return NextResponse.json({
          success: true,
          message: "Printer discovery completed",
          data: {
            printers: [
              "USB Printer 1",
              "Network Printer 2",
              "Bluetooth Printer 3",
            ],
          },
        });

      case "status":
        return NextResponse.json({
          success: true,
          message: "Printer status check completed",
          data: {
            online: true,
            paperStatus: "ok",
            errorStatus: "ok",
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Unknown test type",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Printer test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform printer test",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
