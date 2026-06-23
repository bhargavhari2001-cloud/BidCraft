import * as XLSX from "xlsx";

/**
 * Converts an Excel/CSV workbook buffer into plain text suitable for
 * LLM question-extraction. Each sheet becomes a labeled CSV block.
 * Guards: sheet count and cell-output size are capped so a malicious
 * or enormous workbook can't blow up memory or the prompt budget.
 */
const MAX_SHEETS = 10;
const MAX_TEXT_LENGTH = 60_000;

export function workbookToText(buffer: Buffer): string {
  const wb = XLSX.read(buffer, { type: "buffer", dense: true });
  const parts: string[] = [];
  let total = 0;

  for (const name of wb.SheetNames.slice(0, MAX_SHEETS)) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (!csv.trim()) continue;
    const block = `## Sheet: ${name}\n${csv}`;
    total += block.length;
    parts.push(block);
    if (total > MAX_TEXT_LENGTH) break;
  }

  return parts.join("\n\n").substring(0, MAX_TEXT_LENGTH);
}
