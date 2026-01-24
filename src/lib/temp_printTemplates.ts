
import { Transaction, TransactionItem, TransactionPayment } from "@/types/transaction";
import { Client } from "@/types/client";
import { getShopInfo } from "./shopInfo";
import { CURRENCY_SYMBOLS, type Currency } from "@/types/settings";

/**
 * Generates the HTML for a thermal transaction (sale) receipt.
 */
export function renderTransactionReceiptHTML(
    transaction: Transaction,
    items: TransactionItem[],
    payments: TransactionPayment[],
    client: Client | null,
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

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || 0;
    // If the transaction is completed, the new balance is:
    // Previous Balance + (Transaction Total - Paid Amount)
    // Assuming a Sale increases the client's debt (Outstanding Balance).
    // If Previous Balance is debt, then we add the remaining amount.
    const balanceDue = transaction.total_amount - totalPaid;
    const newBalance = (previousBalance || 0) + balanceDue;

    const itemsHTML = items
        .map(
            (item) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span style="flex: 1;">${item.item_name} <span style="font-size: 7px;">x${item.quantity}</span></span>
      <span>${CURRENCY_SYMBOLS[currency]}${item.total_price.toFixed(2)}</span>
    </div>
  `
        )
        .join("");

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
            font-size: 9px; 
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
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .solid-divider { border-top: 1px solid #000; margin: 5px 0; }
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
          <div style="font-size: 12px; font-weight: bold;">${shopInfo.shopName}</div>
          <div style="font-size: 8px;">${shopInfo.address}</div>
          <div style="font-size: 8px;">${shopInfo.phoneNumber}</div>
        </div>

        <!-- Transaction Info -->
        <div style="margin-bottom: 5px;">
           <div class="row">
            <span>${language === "ar" ? "رقم الفاتورة" : "Receipt #"}:</span>
            <span class="bold">${transaction.transaction_number || transaction.id.slice(0, 8)}</span>
           </div>
           <div class="row">
            <span>${language === "ar" ? "التاريخ" : "Date"}:</span>
            <span>${formatDate(transaction.created_at)}</span>
           </div>
        </div>

        <div class="divider"></div>

        <!-- Client Info -->
        <div style="margin-bottom: 5px;">
           <div class="bold" style="margin-bottom: 2px;">${language === "ar" ? "العميل" : "Customer"}:</div>
           <div>${client?.name || "Walk-in Customer"}</div>
           ${client?.phone ? `<div>${client.phone}</div>` : ""}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div style="margin-bottom: 5px;">
          <div class="bold" style="margin-bottom: 4px;">${language === "ar" ? "مشتريات" : "Items"}:</div>
          ${itemsHTML}
        </div>

        <div class="solid-divider"></div>

        <!-- Totals -->
        <div style="margin-bottom: 5px;">
          <div class="row bold" style="font-size: 11px;">
            <span>${language === "ar" ? "المجموع" : "TOTAL"}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${transaction.total_amount.toFixed(2)}</span>
          </div>
          
          ${totalPaid > 0
            ? `
            <div class="row">
              <span>${language === "ar" ? "المدفوع" : "Paid"}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${totalPaid.toFixed(2)}</span>
            </div>
            `
            : ""
        }

          <div class="row">
            <span>${language === "ar" ? "الباقي" : "Balance Due"}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${balanceDue.toFixed(2)}</span>
          </div>
        </div>

        <!-- Account Balance Section (Requested Feature) -->
        ${client
            ? `
            <div class="divider"></div>
            <div style="margin-bottom: 5px; background: #f0f0f0; padding: 4px;">
              <div class="bold center" style="margin-bottom: 4px; font-size: 10px;">${language === "ar" ? "كشف حساب" : "ACCOUNT SUMMARY"}</div>
              <div class="row">
                <span>${language === "ar" ? "الرصيد السابق" : "Previous Balance"}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${previousBalance.toFixed(2)}</span>
              </div>
              <div class="row bold">
                <span>${language === "ar" ? "الرصيد الحالي" : "New Balance"}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${newBalance.toFixed(2)}</span>
              </div>
            </div>
          `
            : ""
        }

        <div class="center" style="margin-top: 15px; font-size: 8px;">
          <div>${shopInfo.receiptFooter || "Thank you for your business!"}</div>
        </div>
      </body>
    </html>
  `;
}
