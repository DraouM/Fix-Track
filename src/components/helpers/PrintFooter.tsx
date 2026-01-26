"use client";

import { getShopInfo } from "@/lib/shopInfo";
import { useTranslation } from "react-i18next";

export function PrintFooter() {
  const shopInfo = getShopInfo();
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: "center", fontSize: "7px", marginTop: "4px" }}>
      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>
      <div style={{ whiteSpace: "pre-wrap", marginBottom: "2px" }}>
        {shopInfo.receiptFooter}
      </div>
      <div style={{ fontSize: "6px", color: "#666" }}>
        {t("receipt.generatedBy")}
      </div>
    </div>
  );
}
