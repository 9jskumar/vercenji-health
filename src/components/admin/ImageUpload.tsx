"use client";

import { useActionState } from "react";
import { uploadProductImages, type FormState } from "@/lib/actions/catalogue";
import { Notice } from "./FormBits";

export function ImageUpload({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadProductImages, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl bg-ivory p-4">
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Images (JPG or PNG, up to 10 MB each, square works best)
        <input type="file" name="images" multiple required accept="image/jpeg,image/png" className="field font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Image description
        <input name="alt" required maxLength={200} placeholder="e.g. Foci 60-capsule jar, front view" className="field font-normal" />
      </label>
      <button type="submit" disabled={pending} className="self-start rounded-full bg-green px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Uploading…" : "Upload"}</button>
      <Notice state={state} />
    </form>
  );
}
