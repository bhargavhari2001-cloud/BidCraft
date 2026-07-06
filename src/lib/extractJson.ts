/**
 * Extracts and parses a JSON object embedded in an LLM's text response.
 *
 * Models asked to "respond only with JSON" occasionally emit literal control
 * characters (real newlines/tabs) inside string values instead of escaping
 * them as \n/\t — technically invalid JSON that JSON.parse rejects outright.
 * This walks the matched substring tracking string/escape state and escapes
 * any raw control character found inside a string literal before retrying.
 */
export function extractJson<T = unknown>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");

  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return JSON.parse(escapeControlCharsInStrings(match[0])) as T;
  }
}

function escapeControlCharsInStrings(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (const ch of input) {
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    if (escaped) {
      out += ch;
      escaped = false;
    } else if (ch === "\\") {
      out += ch;
      escaped = true;
    } else if (ch === '"') {
      out += ch;
      inString = false;
    } else if (ch === "\n") {
      out += "\\n";
    } else if (ch === "\r") {
      out += "\\r";
    } else if (ch === "\t") {
      out += "\\t";
    } else {
      out += ch;
    }
  }

  return out;
}
