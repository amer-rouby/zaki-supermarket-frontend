// Shared letterhead styling/markup for every printed document in the app (stock/sales/
// expiry/financial reports via PrintHelperService, sales invoices via InvoicePrintService).
// Before this, each print surface built its own header/table CSS from scratch and they all
// looked like different, unrelated apps - one shared template fixes that plus the structural
// issues (ink-heavy gradient headers, no page-break control, network-dependent Google Font
// fetched inside the print iframe).

export interface PrintStoreInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

const BRAND = '#4338ca';
const TEXT_PRIMARY = '#1e293b';
const TEXT_SECONDARY = '#64748b';
const BORDER = '#cbd5e1';
const TABLE_HEADER_BG = '#f1f5f9';

export function getPrintFontFamily(isArabic: boolean): string {
  // No @import/<link> to Google Fonts here on purpose - the iframe is a separate document
  // context, so every print would wait on (and could fail on) a network fetch just to
  // render text. These system stacks render Arabic and Latin text cleanly without it.
  return isArabic
    ? "'Tahoma', 'Segoe UI', Arial, sans-serif"
    : "'Segoe UI', Roboto, Arial, sans-serif";
}

export function getPrintDocumentStyles(isArabic: boolean): string {
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';
  const fontFamily = getPrintFontFamily(isArabic);

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: ${fontFamily}; color: ${TEXT_PRIMARY}; background: #fff; }
    body { direction: ${dir}; padding: 12mm 10mm; font-size: 12px; line-height: 1.5; }
    .print-doc { max-width: 190mm; margin: 0 auto; }

    .letterhead { text-align: center; padding-bottom: 10px; margin-bottom: 18px; border-bottom: 2px solid ${BRAND}; }
    .ph-name { font-size: 20px; font-weight: 700; color: ${TEXT_PRIMARY}; }
    .ph-meta { font-size: 11px; color: ${TEXT_SECONDARY}; margin-top: 4px; }
    .doc-title { font-size: 16px; font-weight: 700; color: ${BRAND}; margin-top: 10px; }
    .doc-subtitle { font-size: 12px; color: ${TEXT_SECONDARY}; margin-top: 2px; }
    .doc-meta { font-size: 10px; color: ${TEXT_SECONDARY}; margin-top: 4px; }

    table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    thead { display: table-header-group; }
    thead th {
      background: ${TABLE_HEADER_BG}; color: ${TEXT_PRIMARY}; font-weight: 700; font-size: 11px;
      text-align: ${textAlign}; padding: 8px; border-bottom: 2px solid ${BRAND};
    }
    tbody tr { page-break-inside: avoid; }
    tbody td { padding: 7px 8px; border-bottom: 1px solid ${BORDER}; text-align: ${textAlign}; font-size: 11.5px; }
    tbody tr:nth-child(even) { background: #fafafa; }

    .doc-footer {
      text-align: center; margin-top: 22px; padding-top: 10px; border-top: 1px solid ${BORDER};
      color: ${TEXT_SECONDARY}; font-size: 10px;
    }

    @page { size: A4; margin: 0; }
    @media print {
      body { padding: 12mm 10mm; }
      a { color: inherit; text-decoration: none; }
    }
  `;
}

export function getPrintLetterheadHtml(
  store: PrintStoreInfo,
  documentTitle: string,
  subtitle?: string,
  metaLine?: string
): string {
  const metaParts = [store.address, store.phone, store.email].filter(Boolean);
  return `
    <header class="letterhead">
      <div class="ph-name">${store.name}</div>
      ${metaParts.length ? `<div class="ph-meta">${metaParts.join('&nbsp;&middot;&nbsp;')}</div>` : ''}
      <div class="doc-title">${documentTitle}</div>
      ${subtitle ? `<div class="doc-subtitle">${subtitle}</div>` : ''}
      ${metaLine ? `<div class="doc-meta">${metaLine}</div>` : ''}
    </header>
  `;
}

export function getPrintFooterHtml(appName: string, generatedLabel: string, isArabic: boolean): string {
  const now = new Date().toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  return `<footer class="doc-footer">${appName}&nbsp;&mdash;&nbsp;${generatedLabel}: ${now}</footer>`;
}
