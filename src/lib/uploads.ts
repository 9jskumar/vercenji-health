import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

// The file's own first bytes decide its type, never its name or the browser's claim.
const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "application/pdf", ext: "pdf", test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  // Word 97-2003 (.doc): an OLE compound file.
  { mime: "application/msword", ext: "doc", test: (b) => b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) },
  // Word (.docx): a ZIP whose entries include word/document.xml. Other ZIPs (xlsx, apk, jar) do not match.
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: "docx",
    test: (b) => b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) && b.includes("word/document.xml", 0, "latin1"),
  },
  { mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
];

export type CheckedFile = { buffer: Buffer; mime: string; ext: string; originalName: string; sha256: string };

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./storage/uploads");
}

export const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const KIND_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

/**
 * Refuses documents that carry active content (macros, scripts, launch actions, embedded files).
 * Such files are not needed for a CV or an application, and they are the usual way to deliver malware.
 */
function hasActiveContent(mime: string, b: Buffer): boolean {
  if (mime === "application/pdf") return /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia)\b/.test(b.toString("latin1"));
  if (mime === "application/msword") {
    const utf16 = (s: string) => Buffer.from(s, "utf16le");
    return b.includes(utf16("Macros")) || b.includes(utf16("_VBA_PROJECT"));
  }
  if (KIND_LABEL[mime] === "DOCX") return /word\/(vbaProject\.bin|activeX|embeddings\/)/i.test(b.toString("latin1"));
  return false;
}

/** Validates uploads; returns an error message for the applicant, or the checked files. */
export async function checkUploads(
  files: File[],
  allowed: readonly string[] = ["application/pdf", "image/png", "image/jpeg"],
  limits: { maxFiles?: number; maxFileBytes?: number; maxTotalBytes?: number } = {},
): Promise<{ error: string } | { files: CheckedFile[] }> {
  const { maxFiles = MAX_FILES, maxFileBytes = MAX_FILE_BYTES, maxTotalBytes = MAX_TOTAL_BYTES } = limits;
  const mb = (n: number) => `${Math.round(n / (1024 * 1024))} MB`;
  const real = files.filter((f) => f.size > 0);
  if (real.length > maxFiles) return { error: `Please attach at most ${maxFiles} document${maxFiles === 1 ? "" : "s"}.` };
  let total = 0;
  const out: CheckedFile[] = [];
  for (const f of real) {
    if (f.size > maxFileBytes) return { error: `"${f.name}" is larger than ${mb(maxFileBytes)}.` };
    total += f.size;
    if (total > maxTotalBytes) return { error: `Your documents add up to more than ${mb(maxTotalBytes)}. Please attach smaller files.` };
    const buffer = Buffer.from(await f.arrayBuffer());
    const sig = SIGNATURES.find((s) => s.test(buffer));
    if (!sig || !allowed.includes(sig.mime)) {
      const kinds = allowed.map((m) => KIND_LABEL[m] ?? m).join(", ");
      return { error: `"${f.name}" is not an accepted file type (${kinds}).` };
    }
    if (hasActiveContent(sig.mime, buffer)) {
      return { error: `"${f.name}" contains macros, scripts or embedded files. Please save it as a plain PDF or Word document and try again.` };
    }
    out.push({
      buffer,
      mime: sig.mime,
      ext: sig.ext,
      originalName: f.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120) || `document.${sig.ext}`,
      sha256: createHash("sha256").update(buffer).digest("hex"),
    });
  }
  return { files: out };
}

/** Stores files under <root>/<folder>/ with random names. Returns relative paths. */
export async function storeFiles(folder: string, files: CheckedFile[]): Promise<string[]> {
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), folder);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const written: string[] = [];
  try {
    for (const f of files) {
      const rel = path.join(/*turbopackIgnore: true*/ folder, `${randomBytes(16).toString("hex")}.${f.ext}`);
      await writeFile(path.join(/*turbopackIgnore: true*/ uploadRoot(), rel), f.buffer, { mode: 0o600, flag: "wx" });
      written.push(rel);
    }
    return written;
  } catch (e) {
    await Promise.all(written.map((rel) => rm(path.join(/*turbopackIgnore: true*/ uploadRoot(), rel), { force: true })));
    throw e;
  }
}

/** Reads a stored file, refusing any path that escapes the upload root. */
export async function readStoredFile(rel: string): Promise<Buffer> {
  const root = uploadRoot();
  const full = path.resolve(/*turbopackIgnore: true*/ root, rel);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid path");
  return readFile(full);
}

export async function removeFolder(folder: string) {
  await rm(path.join(/*turbopackIgnore: true*/ uploadRoot(), folder), { recursive: true, force: true });
}
