import { Repair, Payment } from "@/types/repair";
import { getShopInfo } from "./shopInfo";
import { CURRENCY_SYMBOLS, type Currency } from "@/types/settings";

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

  const partsHTML =
    includeParts && repair.usedParts && repair.usedParts.length > 0
      ? `
      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
      <div style="margin-bottom: 4px; font-size: 8px;">
        <div style="font-weight: bold; margin-bottom: 2px;">${language === "ar"
        ? "قطع الغيار المستخدمة:"
        : language === "fr"
          ? "PIÈCES UTILISÉES:"
          : "PARTS USED:"
      }</div>
        ${repair.usedParts
        .map(
          (part) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
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
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${language === "ar"
        ? "إجمالي المدفوع:"
        : language === "fr"
          ? "TOTAL PAYÉ:"
          : "TOTAL PAID:"
      }</span>
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
      <body>
        <div style="text-align: center; margin-bottom: 4px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          ${logoUrl || shopInfo.logoUrl
      ? `<div style="margin-bottom: 2px;"><img src="${logoUrl || shopInfo.logoUrl
      }" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>`
      : ""
    }
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 1px;">${shopInfo.shopName}</div>
          <div style="font-size: 7px;">${shopInfo.address}</div>
          <div style="font-size: 7px;">${language === "ar" ? "هاتف" : language === "fr" ? "Tél" : "Tel"}: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="margin-bottom: 3px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between;">
            <span>${language === "ar" ? "رقم الطلب" : language === "fr" ? "N° de commande" : "Order #"}:</span>
            <span style="font-weight: bold; font-size: 8px;">${repair.code || repair.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>${language === "ar" ? "التاريخ" : language === "fr" ? "Date" : "Date"}:</span>
            <span>${formatDate(repair.createdAt)}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px;">
          <div style="font-weight: bold; margin-bottom: 2px;">${language === "ar" ? "العميل" : language === "fr" ? "Client" : "Customer"}:</div>
          <div>${repair.customerName}</div>
          <div>${repair.customerPhone}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px;">
          <div style="font-weight: bold; margin-bottom: 2px;">${language === "ar" ? "الجهاز" : language === "fr" ? "Appareil" : "Device"}:</div>
          <div>${repair.deviceBrand} ${repair.deviceModel}</div>
          <div style="margin-top: 2px;">
            <div style="font-weight: bold;">${language === "ar" ? "المشكلة" : language === "fr" ? "Problème" : "Issue"}:</div>
            <div style="white-space: pre-wrap; word-break: break-all;">${repair.issueDescription}</div>
          </div>
        </div>

        ${partsHTML}

        <div style="margin-bottom: 4px; font-size: 9px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
            <span>${language === "ar" ? "تكلفة الإصلاح" : language === "fr" ? "Coût réparation" : "Repair Cost"}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${repair.estimatedCost.toFixed(2)}</span>
          </div>
          ${paymentsHTML}
          <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-size: 10px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between;">
              <span>${language === "ar" ? "الرصيد المطلوب" : language === "fr" ? "Solde dû" : "Balance Due"}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">${language === "ar" ? "تم إنشاؤه بواسطة Fixary POS" : language === "fr" ? "Généré par Fixary POS" : "Generated by Fixary POS"}</div>
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
  logoUrl?: string
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
          <div style="font-size: 7px;">${language === "ar" ? "هاتف" : language === "fr" ? "Tél" : "Tel"}: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="text-align: center; margin: 4px 0; font-weight: bold; font-size: 10px;">
          ${language === "ar" ? "إيصال دفع" : language === "fr" ? "REÇU DE PAIEMENT" : "PAYMENT RECEIPT"}
        </div>

        <div style="margin-bottom: 4px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between;">
            <span>${language === "ar" ? "رقم الإيصال" : language === "fr" ? "ID du reçu" : "Receipt ID"}:</span>
            <span>${payment.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>${language === "ar" ? "التاريخ" : language === "fr" ? "Date" : "Date"}:</span>
            <span>${formatDate(payment.date)}</span>
          </div>
          ${referenceCode
      ? `
          <div style="display: flex; justify-content: space-between;">
            <span>${language === "ar" ? "المرجع" : language === "fr" ? "Référence" : "Reference"}:</span>
            <span style="font-weight: bold;">${referenceCode}</span>
          </div>
          `
      : ""
    }
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px;">
          ${customerName
      ? `<div style="margin-bottom: 2px;"><span style="font-weight: bold;">${language === "ar" ? "استلم من" : language === "fr" ? "Reçu de" : "Received From"}:</span> ${customerName}</div>`
      : ""
    }
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span style="font-weight: bold;">${language === "ar" ? "المبلغ المدفوع" : language === "fr" ? "MONTANT PAYÉ" : "AMOUNT PAID"}:</span>
            <span style="font-weight: bold;">${CURRENCY_SYMBOLS[currency]}${payment.amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 7px; margin-top: 2px;">
            <span>${language === "ar" ? "طريقة الدفع" : language === "fr" ? "Mode de paiement" : "Payment Method"}:</span>
            <span>${payment.method}</span>
          </div>
          ${payment.received_by
      ? `
          <div style="display: flex; justify-content: space-between; font-size: 7px;">
            <span>${language === "ar" ? "استلم بواسطة" : language === "fr" ? "Reçu par" : "Received By"}:</span>
            <span>${payment.received_by}</span>
          </div>
          `
      : ""
    }
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">${language === "ar" ? "تم إنشاؤه بواسطة Fixary POS" : language === "fr" ? "Généré par Fixary POS" : "Generated by Fixary POS"}</div>
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

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  // If the transaction is completed, the new balance is:
  // Previous Balance + (Transaction Total - Paid Amount)
  const balanceDue = transaction.total_amount - totalPaid;
  const newBalance = (previousBalance || 0) + balanceDue;

  const itemsHTML = items
    .map(
      (item) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span style="flex: 1;">${item.item_name} <span style="font-size: 8px;">x${item.quantity}</span></span>
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
          <div style="font-size: 9px;">${language === "ar" ? "هاتف" : language === "fr" ? "Tél" : "Tel"}: ${shopInfo.phoneNumber}</div>
        </div>

        <!-- Transaction Info -->
        <div style="margin-bottom: 5px;">
           <div class="row">
            <span>${language === "ar" ? "رقم الفاتورة" : language === "fr" ? "N° de facture" : "Receipt #"}:</span>
            <span class="bold">${transaction.transaction_number || transaction.id.slice(0, 8)}</span>
           </div>
           <div class="row">
            <span>${language === "ar" ? "التاريخ" : language === "fr" ? "Date" : "Date"}:</span>
            <span>${formatDate(transaction.created_at)}</span>
           </div>
        </div>

        <div class="divider"></div>

        <!-- Client Info -->
        <div style="margin-bottom: 5px;">
           <div class="bold" style="margin-bottom: 2px;">${language === "ar" ? "العميل" : language === "fr" ? "Client" : "Customer"}:</div>
           <div>${client?.name || (language === "ar" ? "عميل عابر" : language === "fr" ? "Client de passage" : "Walk-in Customer")}</div>
           ${client?.phone ? `<div>${client.phone}</div>` : ""}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div style="margin-bottom: 5px;">
          <div class="bold" style="margin-bottom: 4px;">${language === "ar" ? "الأصناف" : language === "fr" ? "Articles" : "Items"}:</div>
          ${itemsHTML}
        </div>

        <div class="solid-divider"></div>

        <!-- Totals -->
        <div style="margin-bottom: 5px;">
          <div class="row bold" style="font-size: 12px;">
            <span>${language === "ar" ? "المجموع" : language === "fr" ? "TOTAL" : "TOTAL"}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${transaction.total_amount.toFixed(2)}</span>
          </div>
          
          ${totalPaid > 0
      ? `
            <div class="row">
              <span>${language === "ar" ? "المدفوع" : language === "fr" ? "Payé" : "Paid"}:</span>
              <span>${CURRENCY_SYMBOLS[currency]}${totalPaid.toFixed(2)}</span>
            </div>
            `
      : ""
    }

          <div class="row">
            <span>${language === "ar" ? "الباقي" : language === "fr" ? "Solde dû" : "Balance Due"}:</span>
            <span>${CURRENCY_SYMBOLS[currency]}${balanceDue.toFixed(2)}</span>
          </div>
        </div>

        <!-- Account Balance Section (Requested Feature) -->
        ${client
      ? `
            <div class="divider"></div>
            <div style="margin-bottom: 5px; background: #f0f0f0; padding: 4px;">
              <div class="bold center" style="margin-bottom: 4px; font-size: 11px;">${language === "ar" ? "ملخص الحساب" : language === "fr" ? "RÉSUMÉ DU COMPTE" : "ACCOUNT SUMMARY"}</div>
              <div class="row">
                <span>${language === "ar" ? "الرصيد السابق" : language === "fr" ? "Solde précédent" : "Previous Balance"}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${previousBalance.toFixed(2)}</span>
              </div>
              <div class="row bold">
                <span>${language === "ar" ? "الرصيد الحالي" : language === "fr" ? "Nouveau solde" : "New Balance"}:</span>
                <span>${CURRENCY_SYMBOLS[currency]}${newBalance.toFixed(2)}</span>
              </div>
            </div>
          `
      : ""
    }

        <div class="center" style="margin-top: 15px; font-size: 8px;">
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter || (language === "ar" ? "شكراً لتعاملكم معنا!" : language === "fr" ? "Merci pour votre confiance !" : "Thank you for your business!")}</div>
          <div style="font-size: 6px; color: #666;">${language === "ar" ? "تم إنشاؤه بواسطة Fixary POS" : language === "fr" ? "Généré par Fixary POS" : "Generated by Fixary POS"}</div>
        </div>
      </body>
    </html>
  `;
}
