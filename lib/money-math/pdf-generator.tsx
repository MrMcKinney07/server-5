export type PDFRow = { label: string; value: string; highlight?: boolean }

type CalcType = "mortgage" | "rates" | "netsheet" | "caprate" | "closing" | "combined"

const ACCENT_COLORS: Record<CalcType, string> = {
  mortgage: "#22d3ee",
  rates: "#10b981",
  netsheet: "#f59e0b",
  caprate: "#a78bfa",
  closing: "#f43f5e",
  combined: "#22d3ee",
}

const TITLES: Record<CalcType, string> = {
  mortgage: "Mortgage Payment Calculator",
  rates: "Current Interest Rates",
  netsheet: "Seller Net Sheet",
  caprate: "Cap Rate & Investment Analysis",
  closing: "Closing Cost Estimate",
  combined: "McKinney One — Financial Summary",
}

function buildHTML(type: CalcType, rows: PDFRow[], title: string): string {
  const accent = ACCENT_COLORS[type]
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const rowsHTML = rows
    .map((r) => {
      if (r.label.startsWith("---")) {
        return `<tr><td colspan="2" style="padding:10px 16px 4px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;border-top:1px solid #1e293b;">${r.label.replace(/---/g, "").trim()}</td></tr>`
      }
      return `
        <tr style="${r.highlight ? `background:${accent}18;` : "background:transparent;"}">
          <td style="padding:9px 16px;color:${r.highlight ? "#f8fafc" : "#94a3b8"};font-size:12px;border-top:1px solid #1e293b;font-weight:${r.highlight ? "600" : "400"};">${r.label}</td>
          <td style="padding:9px 16px;color:${r.highlight ? accent : "#f8fafc"};font-size:12px;text-align:right;border-top:1px solid #1e293b;font-weight:${r.highlight ? "700" : "500"};">${r.value}</td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0e1a; color: #f8fafc; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-dot { width: 32px; height: 32px; border-radius: 8px; background: ${accent}; }
    .brand-name { font-size: 18px; font-weight: 700; color: #f8fafc; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .meta { text-align: right; }
    .meta-date { font-size: 11px; color: #64748b; }
    h1 { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 4px; }
    .accent-line { width: 48px; height: 3px; border-radius: 2px; background: ${accent}; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; background: #0f1629; }
    .footer { margin-top: 32px; font-size: 10px; color: #334155; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-dot"></div>
      <div>
        <div class="brand-name">McKinney One</div>
        <div class="brand-sub">Real Estate CRM</div>
      </div>
    </div>
    <div class="meta">
      <div class="meta-date">Generated: ${now}</div>
      <div class="meta-date" style="margin-top:2px;">For informational purposes only</div>
    </div>
  </div>
  <h1>${title}</h1>
  <div class="accent-line"></div>
  <table>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>
  <div class="footer">
    This estimate is for informational purposes only and does not constitute a loan commitment or financial advice. 
    Actual costs may vary. Consult a licensed lender or financial advisor for accurate figures.
  </div>
</body>
</html>`
}

export function generatePDF(type: CalcType, rows: PDFRow[], customTitle?: string) {
  const title = customTitle ?? TITLES[type]
  const html = buildHTML(type, rows, title)

  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)

  const printWindow = window.open(url, "_blank")
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        URL.revokeObjectURL(url)
      }, 500)
    }
  }
}

export function generateCombinedPDF(sections: { title: string; rows: PDFRow[] }[]) {
  const accent = "#22d3ee"
  const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const sectionsHTML = sections
    .map(
      ({ title, rows }) => `
    <div style="margin-bottom:36px;">
      <h2 style="font-size:15px;font-weight:700;color:#f8fafc;margin-bottom:6px;">${title}</h2>
      <div style="width:32px;height:2px;border-radius:1px;background:${accent};margin-bottom:14px;"></div>
      <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;background:#0f1629;">
        <tbody>
          ${rows
            .map((r) => {
              if (r.label.startsWith("---")) {
                return `<tr><td colspan="2" style="padding:8px 14px 3px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;border-top:1px solid #1e293b;">${r.label.replace(/---/g, "").trim()}</td></tr>`
              }
              return `<tr style="${r.highlight ? `background:${accent}18;` : ""}">
                <td style="padding:8px 14px;color:${r.highlight ? "#f8fafc" : "#94a3b8"};font-size:11px;border-top:1px solid #1e293b;font-weight:${r.highlight ? "600" : "400"};">${r.label}</td>
                <td style="padding:8px 14px;color:${r.highlight ? accent : "#f8fafc"};font-size:11px;text-align:right;border-top:1px solid #1e293b;font-weight:${r.highlight ? "700" : "500"};">${r.value}</td>
              </tr>`
            })
            .join("")}
        </tbody>
      </table>
    </div>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>McKinney One — Financial Summary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0e1a; color: #f8fafc; padding: 40px; }
    .footer { margin-top: 24px; font-size: 10px; color: #334155; text-align: center; border-top: 1px solid #1e293b; padding-top: 14px; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;border-radius:8px;background:${accent};"></div>
      <div>
        <div style="font-size:18px;font-weight:700;color:#f8fafc;">McKinney One</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Real Estate CRM</div>
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b;">
      <div>Generated: ${now}</div>
      <div style="margin-top:2px;">For informational purposes only</div>
    </div>
  </div>
  <h1 style="font-size:22px;font-weight:700;color:#f8fafc;margin-bottom:4px;">Financial Summary Report</h1>
  <div style="width:48px;height:3px;border-radius:2px;background:${accent};margin-bottom:32px;"></div>
  ${sectionsHTML}
  <div class="footer">
    This report is for informational purposes only and does not constitute a loan commitment or financial advice.
    Actual costs may vary. Consult a licensed lender or financial advisor for accurate figures.
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
      }, 500)
    }
  }
}
