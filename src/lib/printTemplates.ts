import { Repair, Payment } from "@/types/repair";
import { getShopInfo } from "./shopInfo";
import { CURRENCY_SYMBOLS, type Currency } from "@/types/settings";
import { i18n } from "./i18n";

/**
 * Generates the HTML for a thermal repair receipt.
 * This should match the visual style of the ReceiptTemplate React component.
 */
export function renderRepairReceiptHTML(
  repair: Repair,
  options: { includePayments?: boolean; includeParts?: boolean } = {},
  language: string = "en",
  currency: Currency = "USD",
  logoUrl?: string
): string {
  const shopInfo = getShopInfo();
  const { includePayments = true, includeParts = true } = options;

  const formatDate = (dateString: string) => {
    // Convert language code to locale
    const locale =
      language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = repair.estimatedCost - totalPaid;

  const isRTL = language === "ar";
  const direction = isRTL ? "rtl" : "ltr";

  const partsHTML =
    includeParts && repair.usedParts && repair.usedParts.length > 0
      ? `
      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
      <div style="margin-bottom: 4px; font-size: 8px;">
        <div style="font-weight: bold; margin-bottom: 2px;">${i18n.t("receipt.partsUsed", { lng: language })}:</div>
        ${repair.usedParts
        .map(
          (part) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${part.partName} x${part.quantity}</span>
            <span>${CURRENCY_SYMBOLS[currency]}${(part.cost || 0).toFixed(
            2
          )}</span>
          </div>
        `
        )
        .join("")}
      </div>
    `
      : "";

  const paymentsHTML =
    includePayments && repair.payments && repair.payments.length > 0
      ? `
      <div style="margin-top: 4px; font-size: 8px;">
        <div style="border-top: 1px solid #000; margin-top: 3px; padding-top: 3px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.totalPaid", { lng: language })}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${totalPaid.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `
      : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 80mm; 
            padding: 2mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 8px; 
            line-height: 1.15; 
            color: #000; 
            background: #fff;
          }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; }
          }
        </style>
      </head>
      <body dir="${direction}">
        <div style="text-align: center; margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          ${logoUrl || shopInfo.logoUrl
      ? `<div style="margin-bottom: 2px;"><img src="${logoUrl || shopInfo.logoUrl
      }" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>`
      : ""
    }
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 1px;">${shopInfo.shopName}</div>
          <div style="font-size: 7px;">${shopInfo.address}</div>
          <div style="font-size: 7px;">${i18n.t("receipt.telephone", { lng: language })}: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="margin-bottom: 3px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.orderNumber", { lng: language })}:</span>
            <span style="font-weight: bold; font-size: 8px;">${repair.code || repair.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.date", { lng: language })}:</span>
            <span>${formatDate(repair.createdAt)}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px; ${isRTL ? "text-align: right;" : ""}">
          <div style="font-weight: bold; margin-bottom: 2px;">${i18n.t("receipt.customer", { lng: language })}:</div>
          <div>${repair.customerName}</div>
          <div>${repair.customerPhone}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px; ${isRTL ? "text-align: right;" : ""}">
          <div style="font-weight: bold; margin-bottom: 2px;">${i18n.t("receipt.device", { lng: language })}:</div>
          <div>${repair.deviceBrand} ${repair.deviceModel}</div>
          <div style="margin-top: 2px;">
            <div style="font-weight: bold;">${i18n.t("receipt.issue", { lng: language })}:</div>
            <div style="white-space: pre-wrap; word-break: break-all;">${repair.issueDescription}</div>
          </div>
        </div>

        ${partsHTML}

        <div style="margin-bottom: 4px; font-size: 9px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.repairCost", { lng: language })}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${repair.estimatedCost.toFixed(2)}</span>
          </div>
          ${paymentsHTML}
          <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-size: 10px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
              <span>${i18n.t("receipt.balanceDue", { lng: language })}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">${i18n.t("receipt.generatedBy", { lng: language })}</div>
        </div>

        <div style="text-align: center; margin-top: 6px; font-size: 7px;">
          <div style="border: 1px solid #000; padding: 4px; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">
            *${repair.code || repair.id}*
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates the HTML for a thermal payment receipt.
 */
export function renderPaymentReceiptHTML(
  payment: Payment,
  customerName?: string,
  referenceCode?: string,
  language: string = "en",
  currency: Currency = "USD",
  logoUrl?: string,
  previousBalance?: number
): string {
  const shopInfo = getShopInfo();

  const formatDate = (dateString: string) => {
    // Convert language code to locale
    const locale =
      language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isRTL = language === "ar";
  const direction = isRTL ? "rtl" : "ltr";

  return `
    <!DOCTYPE html>
    <html lang="${language}" dir="${direction}">
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 80mm; 
            padding: 2mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 8px; 
            line-height: 1.2; 
            color: #000; 
            background: #fff;
          }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          ${logoUrl || shopInfo.logoUrl
      ? `<div style="margin-bottom: 2px;"><img src="${logoUrl || shopInfo.logoUrl
      }" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>`
      : ""
    }
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 1px;">${shopInfo.shopName}</div>
          <div style="font-size: 7px;">${shopInfo.address}</div>
          <div style="font-size: 7px;">${i18n.t("receipt.telephone", { lng: language })}: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="text-align: center; margin: 4px 0; font-weight: bold; font-size: 10px;">
          ${i18n.t("receipt.paymentReceipt", { lng: language })}
        </div>

        <div style="margin-bottom: 4px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.receiptID", { lng: language })}:</span>
            <span>${payment.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.date", { lng: language })}:</span>
            <span>${formatDate(payment.date)}</span>
          </div>
          ${referenceCode
      ? `
          <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.reference", { lng: language })}:</span>
            <span style="font-weight: bold;">${referenceCode}</span>
          </div>
          `
      : ""
    }
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; ${isRTL ? "text-align: right;" : ""}">
          ${customerName
      ? `<div style="margin-bottom: 2px;"><span style="font-weight: bold;">${i18n.t("receipt.receivedFrom", { lng: language })}:</span> ${customerName}</div>`
      : ""
    }
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span style="font-weight: bold;">${i18n.t("receipt.amountPaid", { lng: language })}:</span>
            <span style="font-weight: bold;">${CURRENCY_SYMBOLS[currency]}${payment.amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 7px; margin-top: 2px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.paymentMethod", { lng: language })}:</span>
            <span>${i18n.t(`repairs.${payment.method.toLowerCase()}`, { lng: language })}</span>
          </div>
          ${payment.received_by
      ? `
          <div style="display: flex; justify-content: space-between; font-size: 7px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("receipt.receivedBy", { lng: language })}:</span>
            <span>${payment.received_by}</span>
          </div>
          `
      : ""
    }
        </div>
        
        ${previousBalance !== undefined
      ? `
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="margin-bottom: 4px; ${isRTL ? "text-align: right;" : ""}">
            <div style="font-size: 7px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; color: #666;">
              ${i18n.t("receipt.accountSummary", { lng: language })}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 7px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
              <span>${i18n.t("receipt.previousBalance", { lng: language })}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${previousBalance.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 7px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
              <span>${i18n.t("receipt.amountPaid", { lng: language })}:</span>
              <span>-${CURRENCY_SYMBOLS[currency]}${payment.amount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px; font-weight: bold; border-top: 1px solid #eee; padding-top: 2px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
              <span>${i18n.t("receipt.newBalance", { lng: language })}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${(previousBalance - payment.amount).toFixed(2)}</span>
            </div>
          </div>
        `
      : ""
    }

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">${i18n.t("receipt.generatedBy", { lng: language })}</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates the HTML for a thermal transaction (sale) receipt.
 * Displays items, totals, and the previous/new balance for the client.
 */
export function renderTransactionReceiptHTML(
  transaction: any,
  items: any[],
  payments: any[],
  client: any,
  previousBalance: number,
  language: string = "en",
  currency: Currency = "USD",
  logoUrl?: string
): string {
  const shopInfo = getShopInfo();

  const formatDate = (dateString: string) => {
    const locale =
      language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isRTL = language === "ar";
  const direction = isRTL ? "rtl" : "ltr";

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  // If the transaction is completed, the new balance is:
  // Previous Balance + (Transaction Total - Paid Amount)
  const balanceDue = transaction.total_amount - totalPaid;
  const newBalance = (previousBalance || 0) + balanceDue;

  const itemsHTML = items
    .map(
      (item) => `
    <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
      <span style="flex: 1; ${isRTL ? "text-align: right;" : ""}">
        ${item.item_name} <span style="font-size: 8px;">x${item.quantity}</span>
      </span>
      <span>${CURRENCY_SYMBOLS[currency]}${item.total_price.toFixed(2)}</span>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="${language}" dir="${direction}">
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            width: 80mm; 
            padding: 2mm; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 10px; 
            line-height: 1.2; 
            color: #000; 
            background: #fff;
          }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; }
          }
          .bold { font-weight: bold; }
          .right { text-align: right; }
          .center { text-align: center; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .solid-divider { border-top: 1px solid #000; margin: 6px 0; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="center" style="margin-bottom: 10px;">
          ${logoUrl || shopInfo.logoUrl
      ? `<div style="margin-bottom: 4px;"><img src="${logoUrl || shopInfo.logoUrl
      }" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>`
      : ""
    }
          <div style="font-size: 14px; font-weight: bold;">${shopInfo.shopName}</div>
          <div style="font-size: 9px;">${shopInfo.address}</div>
          <div style="font-size: 9px;">${i18n.t("receipt.telephone", { lng: language })}: ${shopInfo.phoneNumber}</div>
        </div>

        <!-- Transaction Info -->
        <div style="margin-bottom: 5px;">
           <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("transactions_module.summary.paymentFor", { type: i18n.t("transactions_module.sale", { lng: language }), lng: language })}:</span>
            <span class="bold">${transaction.transaction_number || transaction.id.slice(0, 8)}</span>
           </div>
           <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("common.date", { lng: language })}:</span>
            <span>${formatDate(transaction.created_at)}</span>
           </div>
        </div>

        <div class="divider"></div>

        <!-- Client Info -->
        <div style="margin-bottom: 5px; ${isRTL ? "text-align: right;" : ""}">
           <div class="bold" style="margin-bottom: 2px;">${i18n.t("transactions_module.party.client", { lng: language })}:</div>
           <div>${client?.name || (language === "ar" ? "عميل عابر" : language === "fr" ? "Client de passage" : i18n.t("transactions_module.party.walkInCustomer", { lng: language }))}</div>
           ${client?.phone ? `<div>${client.phone}</div>` : ""}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div style="margin-bottom: 5px; ${isRTL ? "text-align: right;" : ""}">
          <div class="bold" style="margin-bottom: 4px;">${i18n.t("transactions_module.itemTable.details", { lng: language })}:</div>
          ${itemsHTML}
        </div>

        <div class="solid-divider"></div>

        <!-- Totals -->
        <div style="margin-bottom: 5px;">
          <div class="row bold" style="font-size: 12px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("transactions_module.summary.total", { lng: language })}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${transaction.total_amount.toFixed(2)}</span>
          </div>
          
          ${totalPaid > 0
      ? `
            <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
              <span>${i18n.t("transactions_module.summary.amountPaid", { lng: language })}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${totalPaid.toFixed(2)}</span>
            </div>
            `
      : ""
    }

          <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
            <span>${i18n.t("transactions_module.summary.balanceDue", { lng: language })}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${balanceDue.toFixed(2)}</span>
          </div>
        </div>

        <!-- Account Balance Section (Requested Feature) -->
        ${client
      ? `
            <div class="divider"></div>
            <div style="margin-bottom: 5px; background: #f0f0f0; padding: 4px; ${isRTL ? "text-align: right;" : ""}">
              <div class="bold center" style="margin-bottom: 4px; font-size: 11px;">${i18n.t("receipt.accountSummary", { lng: language })}</div>
              <div class="row" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
                <span>${i18n.t("receipt.previousBalance", { lng: language })}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${previousBalance.toFixed(2)}</span>
              </div>
              <div class="row bold" style="${isRTL ? "flex-direction: row-reverse;" : ""}">
                <span>${i18n.t("receipt.newBalance", { lng: language })}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${newBalance.toFixed(2)}</span>
              </div>
            </div>
          `
      : ""
    }

        <div class="center" style="margin-top: 15px; font-size: 8px;">
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter || i18n.t("repairs.thankYou", { lng: language })}</div>
          <div style="font-size: 6px; color: #666;">${i18n.t("receipt.generatedBy", { lng: language })}</div>
        </div>
      </body>
    </html>
  `;
}
