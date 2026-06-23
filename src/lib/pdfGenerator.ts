import { jsPDF } from "jspdf";
import type { ExportOptions } from "@/lib/docxGenerator";

/**
 * PDF export — second output format alongside DOCX.
 * Uses jspdf (already a project dependency). Mirrors the DOCX export's
 * options so ExportModal can pass the exact same payload.
 */
export async function generateResponsePdf(opts: ExportOptions): Promise<Blob> {
  const {
    rfpTitle,
    issuingOrganization,
    submissionDeadline,
    questions,
    responses,
    companyName,
    rfpReferenceNumber,
    includeOnlyCompleted = false,
    includeConfidenceScores = true,
  } = opts;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56; // margins
  const MAXW = W - M * 2;
  let y = 0;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };

  // ── Cover ──
  doc.setFillColor(17, 17, 22);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(doc.splitTextToSize(rfpTitle || "RFP Response", MAXW), M, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(180, 180, 190);
  let cy = 260;
  if (issuingOrganization) { doc.text(`Prepared for: ${issuingOrganization}`, M, cy); cy += 20; }
  if (companyName) { doc.text(`Prepared by: ${companyName}`, M, cy); cy += 20; }
  if (rfpReferenceNumber) { doc.text(`Reference: ${rfpReferenceNumber}`, M, cy); cy += 20; }
  if (submissionDeadline) { doc.text(`Submission deadline: ${submissionDeadline}`, M, cy); cy += 20; }
  doc.text(new Date().toLocaleDateString(), M, cy);

  // ── Body ──
  doc.addPage();
  doc.setTextColor(20, 20, 25);
  y = M;

  const hasResponse = (q: (typeof questions)[number]) => {
    const r = responses[q.id];
    return !!(r && (r.status === "generated" || r.status === "edited" || r.editedContent || r.draft));
  };
  const exportable = includeOnlyCompleted
    ? questions.filter(hasResponse)
    : questions.filter((q) => !!responses[q.id]);

  // group by category, preserving question order
  const byCategory = new Map<string, typeof exportable>();
  for (const q of exportable) {
    const cat = q.category || "General";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(q);
  }

  const stripHtml = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  for (const [category, qs] of byCategory) {
    newPageIfNeeded(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(category, M, y);
    y += 10;
    doc.setDrawColor(225, 225, 232);
    doc.line(M, y, W - M, y);
    y += 22;

    for (const q of qs) {
      const r = responses[q.id];
      const qLines = doc.splitTextToSize(`${q.id}. ${q.text}`, MAXW);
      newPageIfNeeded(qLines.length * 14 + 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 25);
      doc.text(qLines, M, y);
      y += qLines.length * 14 + 6;

      if (includeConfidenceScores && r?.confidence != null) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(130, 130, 140);
        doc.text(`AI Confidence: ${r.confidence}%`, M, y);
        y += 14;
      }

      const body = stripHtml(r?.editedContent || r?.draft || "No response yet.");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(55, 55, 62);
      for (const para of body.split(/\n+/)) {
        const lines = doc.splitTextToSize(para, MAXW);
        newPageIfNeeded(lines.length * 14 + 8);
        doc.text(lines, M, y);
        y += lines.length * 14 + 8;
      }
      y += 14;
    }
    y += 8;
  }

  // ── Page numbers ──
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 158);
    doc.text(`${i - 1}`, W / 2, H - 28, { align: "center" });
  }

  return doc.output("blob");
}
