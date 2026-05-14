"use client"

export type PDFRow = { label: string; value: string; highlight?: boolean; subtext?: string }

type CalcType = "mortgage" | "rates" | "netsheet" | "caprate" | "closing" | "combined"

const SECTION_COLORS: Record<CalcType, { accent: string; light: string }> = {
  mortgage: { accent: "#C9A84C", light: "#C9A84C22" },
  rates:    { accent: "#C9A84C", light: "#C9A84C22" },
  netsheet: { accent: "#C9A84C", light: "#C9A84C22" },
  caprate:  { accent: "#C9A84C", light: "#C9A84C22" },
  closing:  { accent: "#C9A84C", light: "#C9A84C22" },
  combined: { accent: "#C9A84C", light: "#C9A84C22" },
}

const TITLES: Record<CalcType, string> = {
  mortgage: "Mortgage Payment Calculator",
  rates:    "Current Interest Rates",
  netsheet: "Seller Net Sheet",
  caprate:  "Cap Rate & Investment Analysis",
  closing:  "Closing Cost Estimate",
  combined: "McKinney Realty Co. — Financial Summary",
}

// Convert local logo to base64 for embedding in the PDF HTML
async function getLogoBase64(): Promise<string> {
  try {
    const res = await fetch("/images/mckinney-logo.jpg")
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}

function buildHTML(type: CalcType, rows: PDFRow[], title: string, logoSrc: string): string {
  const { accent, light } = SECTION_COLORS[type]
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const rowsHTML = rows
    .map((r) => {
      if (r.label.startsWith("---")) {
        const sectionLabel = r.label.replace(/---/g, "").trim()
        return `
          <tr>
            <td colspan="2" style="
              padding: 14px 20px 6px;
              font-size: 9px;
              color: ${accent};
              text-transform: uppercase;
              letter-spacing: 0.15em;
              font-weight: 700;
              border-top: 1px solid #1e2d45;
              background: #0b1929;
            ">${sectionLabel}</td>
          </tr>`
      }
      return `
        <tr style="background: ${r.highlight ? light : "transparent"};">
          <td style="
            padding: 11px 20px;
            color: ${r.highlight ? "#f0ead6" : "#8fa3bc"};
            font-size: 12px;
            border-top: 1px solid #1a2a3d;
            font-weight: ${r.highlight ? "600" : "400"};
          ">${r.label}${r.subtext ? `<div style="font-size:10px;color:#4a6280;margin-top:2px;">${r.subtext}</div>` : ""}</td>
          <td style="
            padding: 11px 20px;
            color: ${r.highlight ? accent : "#dce9f5"};
            font-size: ${r.highlight ? "13px" : "12px"};
            text-align: right;
            border-top: 1px solid #1a2a3d;
            font-weight: ${r.highlight ? "700" : "500"};
          ">${r.value}</td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #071525; }
    body {
      font-family: 'Inter', sans-serif;
      background: #071525;
      color: #dce9f5;
      min-height: 100vh;
    }

    /* ── Cover strip ── */
    .cover {
      background: linear-gradient(135deg, #0a1f35 0%, #071525 60%, #0e2240 100%);
      padding: 48px 52px 36px;
      position: relative;
      overflow: hidden;
    }
    .cover::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, ${accent}, transparent);
    }
    .cover-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .logo-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      border-radius: 12px;
    }
    .brand-text .name {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 700;
      color: #f0ead6;
      letter-spacing: 0.02em;
    }
    .brand-text .sub {
      font-size: 11px;
      color: ${accent};
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .cover-meta {
      text-align: right;
    }
    .cover-meta .generated {
      font-size: 11px;
      color: #4a6a8a;
      letter-spacing: 0.05em;
    }
    .cover-meta .disclaimer {
      font-size: 10px;
      color: #2d4a65;
      margin-top: 4px;
    }

    /* ── Title block ── */
    .title-block {
      padding: 32px 52px 20px;
      background: #071525;
    }
    .title-block h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #f0ead6;
      line-height: 1.2;
    }
    .gold-rule {
      width: 56px;
      height: 3px;
      background: ${accent};
      border-radius: 2px;
      margin-top: 12px;
    }

    /* ── Table ── */
    .table-wrap {
      padding: 0 52px 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #0b1929;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1a2a3d;
    }

    /* ── Footer ── */
    .footer {
      padding: 20px 52px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #1a2a3d;
    }
    .footer-left {
      font-size: 9.5px;
      color: #2d4a65;
      max-width: 420px;
      line-height: 1.6;
    }
    .footer-right {
      font-size: 10px;
      color: ${accent};
      opacity: 0.7;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    @media print {
      html, body { background: #071525 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover, .table-wrap, .title-block, .footer { background: inherit !important; }
    }
  </style>
</head>
<body>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-inner">
      <div class="logo-wrap">
        ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="McKinney Realty Co." />` : `<div style="width:90px;height:90px;background:#0e2240;border-radius:12px;border:2px solid ${accent};"></div>`}
        <div class="brand-text">
          <div class="name">McKinney Realty Co.</div>
          <div class="sub">Professional Real Estate Services</div>
        </div>
      </div>
      <div class="cover-meta">
        <div class="generated">Generated ${now}</div>
        <div class="disclaimer">Informational purposes only</div>
      </div>
    </div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <h1>${title}</h1>
    <div class="gold-rule"></div>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      This estimate is for informational purposes only and does not constitute a loan commitment or financial advice.
      Actual costs may vary. Consult a licensed lender or financial advisor for accurate figures.
    </div>
    <div class="footer-right">McKinney Realty Co.</div>
  </div>

</body>
</html>`
}

export async function generatePDF(type: CalcType, rows: PDFRow[], customTitle?: string) {
  const title = customTitle ?? TITLES[type]
  const logoSrc = await getLogoBase64()
  const html = buildHTML(type, rows, title, logoSrc)

  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, "_blank")
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        URL.revokeObjectURL(url)
      }, 800)
    }
  }
}

export async function generateCombinedPDF(sections: { title: string; rows: PDFRow[] }[]) {
  const accent = "#C9A84C"
  const light = "#C9A84C22"
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const logoSrc = await getLogoBase64()

  const sectionsHTML = sections
    .map(({ title, rows }) => {
      const rowsHTML = rows.map((r) => {
        if (r.label.startsWith("---")) {
          return `<tr><td colspan="2" style="padding:12px 20px 5px;font-size:9px;color:${accent};text-transform:uppercase;letter-spacing:0.15em;font-weight:700;border-top:1px solid #1a2a3d;background:#0b1929;">${r.label.replace(/---/g, "").trim()}</td></tr>`
        }
        return `<tr style="background:${r.highlight ? light : "transparent"};">
          <td style="padding:10px 20px;color:${r.highlight ? "#f0ead6" : "#8fa3bc"};font-size:11px;border-top:1px solid #1a2a3d;font-weight:${r.highlight ? "600" : "400"};">${r.label}</td>
          <td style="padding:10px 20px;color:${r.highlight ? accent : "#dce9f5"};font-size:11px;text-align:right;border-top:1px solid #1a2a3d;font-weight:${r.highlight ? "700" : "500"};">${r.value}</td>
        </tr>`
      }).join("")

      return `
        <div style="margin-bottom: 32px;">
          <h2 style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#f0ead6;margin-bottom:8px;">${title}</h2>
          <div style="width:36px;height:2px;background:${accent};border-radius:1px;margin-bottom:12px;"></div>
          <table style="width:100%;border-collapse:collapse;background:#0b1929;border-radius:10px;overflow:hidden;border:1px solid #1a2a3d;">
            <tbody>${rowsHTML}</tbody>
          </table>
        </div>`
    }).join("")

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>McKinney Realty Co. — Financial Summary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #071525; }
    body { font-family: 'Inter', sans-serif; background: #071525; color: #dce9f5; }
    @media print { html, body { background: #071525 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <!-- Cover -->
  <div style="background:linear-gradient(135deg,#0a1f35,#071525 60%,#0e2240);padding:48px 52px 36px;position:relative;margin-bottom:0;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:20px;">
        ${logoSrc ? `<img src="${logoSrc}" style="width:90px;height:90px;object-fit:contain;border-radius:12px;" alt="McKinney Realty Co." />` : ""}
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#f0ead6;">McKinney Realty Co.</div>
          <div style="font-size:11px;color:${accent};letter-spacing:0.2em;text-transform:uppercase;margin-top:3px;">Professional Real Estate Services</div>
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#4a6a8a;">
        <div>Generated ${now}</div>
        <div style="margin-top:3px;font-size:10px;color:#2d4a65;">Informational purposes only</div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${accent},transparent);"></div>
  </div>

  <!-- Title -->
  <div style="padding:32px 52px 28px;background:#071525;">
    <h1 style="font-family:'Playfair Display',serif;font-size:28px;color:#f0ead6;">Financial Summary Report</h1>
    <div style="width:56px;height:3px;background:${accent};border-radius:2px;margin-top:12px;"></div>
  </div>

  <!-- Sections -->
  <div style="padding:0 52px 24px;">
    ${sectionsHTML}
  </div>

  <!-- Footer -->
  <div style="padding:18px 52px 40px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1a2a3d;">
    <div style="font-size:9.5px;color:#2d4a65;max-width:420px;line-height:1.6;">
      This report is for informational purposes only and does not constitute a loan commitment or financial advice. Actual costs may vary. Consult a licensed lender or financial advisor for accurate figures.
    </div>
    <div style="font-size:10px;color:${accent};opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;">McKinney Realty Co.</div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, "_blank")
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        URL.revokeObjectURL(url)
      }, 800)
    }
  }
}
