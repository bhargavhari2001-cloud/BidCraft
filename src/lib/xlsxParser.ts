import ExcelJS from "exceljs";

/**
 * Converts an Excel/CSV workbook buffer into plain text suitable for
 * LLM question-extraction. Each sheet becomes a labeled CSV block.
 * Guards: sheet count and cell-output size are capped so a malicious
 * or enormous workbook can't blow up memory or the prompt budget.
 *
 * Uses exceljs (the npm `xlsx` package has unfixed prototype-pollution
 * and ReDoS advisories). exceljs reads .xlsx only, so:
 *  - csv  → decoded as text directly (it is already the target format)
 *  - xls  → rejected with a friendly conversion message
 */
const MAX_SHEETS = 10;
const MAX_TEXT_LENGTH = 60_000;

function csvEscape(v: unknown): string {
  let s: string;
  if (v == null) s = "";
  else if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (o.richText) s = o.richText.map((r) => r.text).join("");
    else s = o.text ?? (o.result != null ? String(o.result) : "");
  } else s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function workbookToText(buffer: Buffer, ext: string): Promise<string> {
  if (ext === "csv") {
    return buffer.toString("utf8").substring(0, MAX_TEXT_LENGTH);
  }
  if (ext === "xls") {
    throw new Error(
      "Legacy .xls files aren't supported — please re-save the file as .xlsx or CSV and upload again."
    );
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const parts: string[] = [];
  let total = 0;

  for (const sheet of wb.worksheets.slice(0, MAX_SHEETS)) {
    const rows: string[] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values.map(csvEscape).join(","));
    });
    if (!rows.length) continue;
    const block = `## Sheet: ${sheet.name}\n${rows.join("\n")}`;
    total += block.length;
    parts.push(block);
    if (total > MAX_TEXT_LENGTH) break;
  }

  return parts.join("\n\n").substring(0, MAX_TEXT_LENGTH);
}
