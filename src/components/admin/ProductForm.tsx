"use client";

import { useActionState, useState } from "react";
import { saveProduct, type FormState } from "@/lib/actions/catalogue";
import { keepValuesSubmit } from "@/lib/forms";
import { lifestyleAudiences } from "@/content/catalogue";
import { Input, Notice, TextArea } from "./FormBits";

export type ProductFormValues = {
  id?: string;
  vertical: string;
  name: string;
  slug: string;
  subtitle: string;
  brand: string;
  description: string;
  ingredients: string;
  directions: string;
  warnings: string;
  approvedClaims: string;
  claimsApprovedBy: string;
  claimsApprovedAt: string | null;
  regulatoryInfo: string;
  specifications: string;
  warranty: string;
  sizeGuide: string;
  audience: string[];
  hsnCode: string;
  gstRate: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  categoryIds: string[];
};

type Cat = { id: string; name: string; vertical: string };

const statuses = [
  ["DRAFT", "Draft (staff only)"],
  ["PENDING_REVIEW", "Waiting for review"],
  ["ACTIVE", "Active (visible in the shop)"],
  ["ARCHIVED", "Archived"],
] as const;

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

export function ProductForm({ values, categories }: { values: ProductFormValues; categories: Cat[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [vertical, setVertical] = useState(values.vertical);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(!!values.id);
  const e = (k: string) => state.fieldErrors?.[k];
  const nutrition = vertical === "NUTRITION";

  return (
    <form onSubmit={keepValuesSubmit(action)} className="flex flex-col gap-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <Notice state={state} />
      <section className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 ring-1 ring-line md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Vertical
          <select name="vertical" value={vertical} onChange={(ev) => setVertical(ev.target.value)} className="field font-normal">
            <option value="NUTRITION">Nutrition &amp; Supplements</option>
            <option value="LIFESTYLE">Lifestyle &amp; Wearables</option>
            <option value="EMS">EMS equipment</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Status
          <select name="status" defaultValue={values.status} className="field font-normal">
            {statuses.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {e("status") && <span className="text-[#9B2C2C]">{e("status")}</span>}
        </label>
        <Input label="Product name" name="name" required defaultValue={values.name} error={e("name")}
          onChange={(ev) => { if (!slugTouched) setSlug(slugify(ev.currentTarget.value)); }} />
        <Input label="Web address" name="slug" required value={slug} error={e("slug")} hint="Lowercase words joined by hyphens"
          onChange={(ev) => { setSlugTouched(true); setSlug(ev.currentTarget.value); }} />
        <Input label="Short line under the name" name="subtitle" defaultValue={values.subtitle} error={e("subtitle")} hint="e.g. Herbal capsules, 60 count" />
        <Input label="Brand" name="brand" defaultValue={values.brand} error={e("brand")} hint="Leave empty for Vercenji products" />
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 md:col-span-2">
          <legend className="mb-1 text-sm font-semibold">Categories</legend>
          <div className="flex flex-wrap gap-2">
            {categories.filter((c) => c.vertical === vertical).map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-full bg-ivory px-3 py-1.5 text-sm">
                <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={values.categoryIds.includes(c.id)} className="accent-green" />
                {c.name}
              </label>
            ))}
            {categories.filter((c) => c.vertical === vertical).length === 0 && <span className="text-sm text-stone">No categories yet for this vertical. Add them under Categories.</span>}
          </div>
        </fieldset>
        {vertical === "LIFESTYLE" && (
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0 md:col-span-2">
            <legend className="mb-1 text-sm font-semibold">Shop for</legend>
            <div className="flex flex-wrap gap-2">
              {lifestyleAudiences.map((a) => (
                <label key={a.id} className="flex items-center gap-2 rounded-full bg-ivory px-3 py-1.5 text-sm">
                  <input type="checkbox" name="audience" value={a.id} defaultChecked={values.audience.includes(a.id)} className="accent-green" />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        <h2 className="m-0 text-base font-bold">Product information</h2>
        <TextArea label="Description" name="description" rows={5} defaultValue={values.description} error={e("description")} />
        {nutrition && (
          <>
            <TextArea label="Ingredients and composition" name="ingredients" rows={4} defaultValue={values.ingredients} hint="Exactly as on the approved label" />
            <TextArea label="Directions for use" name="directions" defaultValue={values.directions} />
            <TextArea label="Warnings" name="warnings" defaultValue={values.warnings} />
          </>
        )}
        {!nutrition && (
          <>
            <TextArea label="Specifications" name="specifications" rows={4} defaultValue={values.specifications} error={e("specifications")} hint="One per line, as Label: value. Only from the supplier's documents." />
            <TextArea label="Warranty" name="warranty" defaultValue={values.warranty} />
            {vertical === "LIFESTYLE" && <TextArea label="Size guide" name="sizeGuide" defaultValue={values.sizeGuide} />}
          </>
        )}
      </section>

      {nutrition && (
        <section className="flex flex-col gap-4 rounded-2xl bg-[#FBF7EE] p-6 ring-1 ring-gold/50">
          <h2 className="m-0 text-base font-bold">Claims and label sign-off</h2>
          <p className="m-0 text-sm text-[#45453F]">
            Only claims approved by your regulatory adviser for this product and country. Never disease, cure or certification claims that are not on the approved label.
          </p>
          <TextArea label="Approved claims" name="approvedClaims" rows={3} defaultValue={values.approvedClaims} hint="One claim per line" />
          <TextArea label="Manufacturing and regulatory information" name="regulatoryInfo" rows={4} defaultValue={values.regulatoryInfo} error={e("specifications")}
            hint="One per line, as Label: value, e.g. FSSAI licence: 1002…, Manufactured by: …, Marketed by: …" />
          <Input label="Label and claims approved by" name="claimsApprovedBy" defaultValue={values.claimsApprovedBy} error={e("claimsApprovedBy")}
            hint={values.claimsApprovedAt ? `Recorded ${values.claimsApprovedAt}` : "Name of the adviser. Required before a supplement can go Active."} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 ring-1 ring-line md:grid-cols-2">
        <h2 className="m-0 text-base font-bold md:col-span-2">Tax and search</h2>
        <Input label="HSN code" name="hsnCode" defaultValue={values.hsnCode} error={e("hsnCode")} inputMode="numeric" />
        <Input label="GST rate (%)" name="gstRate" defaultValue={values.gstRate} error={e("gstRate")} inputMode="decimal" />
        <Input label="Search result title" name="seoTitle" defaultValue={values.seoTitle} maxLength={70} hint="Up to 70 characters. Leave empty to use the product name." />
        <Input label="Search result description" name="seoDescription" defaultValue={values.seoDescription} maxLength={170} hint="Up to 170 characters" />
      </section>

      <button type="submit" disabled={pending} className="btn-primary self-start disabled:opacity-60">{pending ? "Saving…" : values.id ? "Save product" : "Create product"}</button>
    </form>
  );
}
