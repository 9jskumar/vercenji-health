import path from "node:path";
import { readStoredFile } from "@/lib/uploads";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Public product images only. Partner documents live under applications/ and are never served here.
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const type = TYPES[path.extname(rel).toLowerCase()];
  if (parts[0] !== "products" || !type || parts.some((p) => p === ".." || p.startsWith("."))) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readStoredFile(rel);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
