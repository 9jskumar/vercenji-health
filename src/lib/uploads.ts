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
  { mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
];

export type CheckedFile = { buffer: Buffer; mime: string; ext: string; originalName: string; sha256: string };

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./storage/uploads");
}

/** Validates uploads; returns an error message for the applicant, or the checked files. */
export async function checkUploads(files: File[]): Promise<{ error: string } | { files: CheckedFile[] }> {
  const real = files.filter((f) => f.size > 0);
  if (real.length > MAX_FILES) return { error: `Please attach at most ${MAX_FILES} documents.` };
  let total = 0;
  const out: CheckedFile[] = [];
  for (const f of real) {
    if (f.size > MAX_FILE_BYTES) return { error: `"${f.name}" is larger than 10 MB.` };
    total += f.size;
    if (total > MAX_TOTAL_BYTES) return { error: "Your documents add up to more than 20 MB. Please attach smaller files." };
    const buffer = Buffer.from(await f.arrayBuffer());
    const sig = SIGNATURES.find((s) => s.test(buffer));
    if (!sig) return { error: `"${f.name}" is not a PDF, JPG or PNG file.` };
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
