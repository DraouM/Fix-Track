"use client";

import React, { useMemo } from "react";
import { PrinterConfig } from "@/types/settings";
import { getEffectiveWidth, getEffectiveHeight } from "@/lib/printerConfig";
import { renderTemplateForConfig } from "@/lib/thermalTemplates";

interface ReceiptPreviewProps {
  config: PrinterConfig;
}

export function ReceiptPreview({ config }: ReceiptPreviewProps) {
  const widthMm = getEffectiveWidth(config);
  const heightMm = getEffectiveHeight(config);

  const html = useMemo(() => renderTemplateForConfig(config), [config]);

  // Scale the preview to fit in the container
  // 1mm ≈ 3.78px, so 80mm ≈ 302px. Scale down if needed.
  const pxWidth = widthMm * 3.78;
  const maxContainerWidth = 340;
  const scale = Math.min(1, maxContainerWidth / pxWidth);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {widthMm}mm{heightMm ? ` × ${heightMm}mm` : " × auto"}
        </span>
      </div>
      <div
        className="rounded-lg border border-border bg-white overflow-hidden mx-auto"
        style={{
          width: `${pxWidth * scale}px`,
          maxHeight: "500px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${pxWidth}px`,
          }}
        >
          <iframe
            srcDoc={html}
            title="Receipt Preview"
            style={{
              width: `${pxWidth}px`,
              height: heightMm ? `${heightMm * 3.78}px` : "600px",
              border: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Preview is scaled to fit. Actual print output will be 1:1 at {widthMm}mm width.
      </p>
    </div>
  );
}
