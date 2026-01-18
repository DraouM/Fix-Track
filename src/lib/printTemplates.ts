import { Repair, Payment } from "@/types/repair";
import { getShopInfo } from "./shopInfo";

/**
 * Generates the HTML for a thermal repair receipt.
 * This should match the visual style of the ReceiptTemplate React component.
 */
export function renderRepairReceiptHTML(repair: Repair, options: { includePayments?: boolean, includeParts?: boolean } = {}): string {
    const shopInfo = getShopInfo();
    const { includePayments = true, includeParts = true } = options;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balance = repair.estimatedCost - totalPaid;

    const partsHTML = (includeParts && repair.usedParts && repair.usedParts.length > 0)
        ? `
      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
      <div style="margin-bottom: 4px; font-size: 8px;">
        <div style="font-weight: bold; margin-bottom: 2px;">PARTS USED:</div>
        ${repair.usedParts.map(part => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>${part.partName} x${part.quantity}</span>
            <span>$${(part.cost || 0).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    const paymentsHTML = (includePayments && repair.payments && repair.payments.length > 0)
        ? `
      <div style="margin-top: 4px; font-size: 8px;">
        <div style="font-weight: bold; margin-bottom: 2px;">PAYMENTS:</div>
        <div style="border-top: 1px solid #000; margin-top: 3px; padding-top: 3px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>TOTAL PAID:</span>
            <span>$${totalPaid.toFixed(2)}</span>
          </div>
        </div>
      </div>
    ` : '';

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
          ${shopInfo.logoUrl ? `<div style="margin-bottom: 2px;"><img src="${shopInfo.logoUrl}" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>` : ''}
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 1px;">${shopInfo.shopName}</div>
          <div style="font-size: 7px;">${shopInfo.address}</div>
          <div style="font-size: 7px;">Tel: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="margin-bottom: 3px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Order #:</span>
            <span style="font-weight: bold; font-size: 8px;">${repair.code || repair.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${formatDate(repair.createdAt)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Status:</span>
            <span style="font-weight: bold;">${repair.status}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px;">
          <div style="font-weight: bold; margin-bottom: 2px;">CUSTOMER:</div>
          <div>${repair.customerName}</div>
          <div>${repair.customerPhone}</div>
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px; font-size: 8px;">
          <div style="font-weight: bold; margin-bottom: 2px;">DEVICE:</div>
          <div>${repair.deviceBrand} ${repair.deviceModel}</div>
          <div style="margin-top: 2px;">
            <div style="font-weight: bold;">Issue:</div>
            <div style="white-space: pre-wrap; word-break: break-all;">${repair.issueDescription}</div>
          </div>
        </div>

        ${partsHTML}

        <div style="margin-bottom: 4px; font-size: 9px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
            <span>REPAIR COST:</span>
            <span>$${repair.estimatedCost.toFixed(2)}</span>
          </div>
          ${paymentsHTML}
          <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-size: 10px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between;">
              <span>BALANCE DUE:</span>
              <span>$${balance.toFixed(2)}</span>
            </div>
          </div>
          <div style="margin-top: 3px; font-size: 8px; text-align: center;">
            <div style="font-weight: bold;">Payment Status: ${repair.paymentStatus}</div>
          </div>
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">Generated by Fixary POS</div>
        </div>

        <div style="text-align: center; margin-top: 6px; font-size: 7px;">
          <div style="border: 1px solid #000; padding: 4px; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">
            *${repair.code || repair.id}*
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 100);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
}

/**
 * Generates the HTML for a thermal payment receipt.
 */
export function renderPaymentReceiptHTML(payment: Payment, customerName?: string, referenceCode?: string): string {
    const shopInfo = getShopInfo();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
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
          ${shopInfo.logoUrl ? `<div style="margin-bottom: 2px;"><img src="${shopInfo.logoUrl}" style="max-width: 60mm; max-height: 40mm; object-fit: contain;"></div>` : ''}
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 1px;">${shopInfo.shopName}</div>
          <div style="font-size: 7px;">${shopInfo.address}</div>
          <div style="font-size: 7px;">Tel: ${shopInfo.phoneNumber}</div>
        </div>

        <div style="text-align: center; margin: 4px 0; font-weight: bold; font-size: 10px;">
          PAYMENT RECEIPT
        </div>

        <div style="margin-bottom: 4px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Receipt ID:</span>
            <span>${payment.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${formatDate(payment.date)}</span>
          </div>
          ${referenceCode ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Reference:</span>
            <span style="font-weight: bold;">${referenceCode}</span>
          </div>
          ` : ''}
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

        <div style="margin-bottom: 4px;">
          ${customerName ? `<div style="margin-bottom: 2px;"><span style="font-weight: bold;">Received From:</span> ${customerName}</div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span style="font-weight: bold;">AMOUNT PAID:</span>
            <span style="font-weight: bold;">$${payment.amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 7px; margin-top: 2px;">
            <span>Payment Method:</span>
            <span>${payment.method}</span>
          </div>
          ${payment.received_by ? `
          <div style="display: flex; justify-content: space-between; font-size: 7px;">
            <span>Received By:</span>
            <span>${payment.received_by}</span>
          </div>
          ` : ''}
        </div>

        <div style="text-align: center; font-size: 7px; margin-top: 4px;">
          <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
          <div style="white-space: pre-wrap; margin-bottom: 2px;">${shopInfo.receiptFooter}</div>
          <div style="font-size: 6px; color: #666;">Generated by Fixary POS</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 100);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
}
