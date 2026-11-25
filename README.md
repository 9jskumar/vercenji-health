# Vercenji Health website

Next.js (App Router, TypeScript, Tailwind CSS) with MySQL through Prisma. Hosted on MilesWeb Cloud Professional.

## Release A scope
Brand site, nutrition and lifestyle shop, EMS equipment catalogue and enquiries, partner and franchise applications, customer accounts (OTP login), Razorpay checkout and the admin at `/admin`.

## Local setup
1. Node 22 LTS and a local MySQL 8 (or MariaDB 10.6+).
2. `cp .env.example .env` and fill in `DATABASE_URL`.
3. `npm install`, then `npx prisma migrate dev`.
4. `npm run dev` and open http://localhost:3000.

## Staff accounts
Admin is at `/admin`. Staff sign in with email, password and a 6-digit code from an authenticator app.
Create or reset an account on the server (never share the output):

    npm run staff:create -- --email you@example.com --name "Your name" --role owner

Roles: `owner` (everything), `partnerships` (partner applications only) and `catalogue` (products and categories).
Uploaded documents are stored in `UPLOAD_DIR`, outside the public folder, and served to signed-in staff only.

## Rules
- No secrets in Git. Production configuration lives on the server.
- No product claim, certification, price or review is published unless the owner has supplied and approved it.
- Design tokens live in `src/app/globals.css` and follow the approved Phase 2 prototype.

## Customer accounts
Customers sign in at `/login` with their email address and a 6-digit code sent by email (valid 10 minutes, 5 tries). There is no password.
New emails get an account on first sign-in. Orders placed with the same email, including guest orders from before, show under `/account/orders`.
Staff emails cannot sign in here; staff use `/admin/login`.

Customers can report a wrong or damaged delivery at `/account/returns` within 24 hours of the order being marked delivered. The order moves to
"Return requested" in the admin and an email goes to the support address.

Sign-in codes are sent with the SMTP settings in `.env.example` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`), set on the server only.

## Hidden sections
EMS, Water, Food, Lifestyle, About and Search are hidden until they are ready. Switch a section back on in `liveSections` in `src/lib/site.ts`.

## Adding products
Admin → Products → New product. Save it, then add options (size, SKU, MRP, price, stock) and images.
A product appears in the shop only when it is **Active** and has at least one option on sale.
Nutrition products cannot be made Active until "Label and claims approved by" is filled in.

## Payments (Razorpay)
Checkout uses Razorpay's hosted payment window, so card, UPI and bank details never reach this server.

1. In the Razorpay dashboard (Test mode first), create API keys and a webhook pointing to `https://<site>/api/webhooks/razorpay` with the events `payment.captured`, `order.paid`, `payment.authorized` and `payment.failed`. Choose a long random webhook secret.
2. Turn on automatic capture for payments (Settings → Payment capture), so paid orders are confirmed straight away.
3. On the server only, set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` in `.env`, then restart the app. Never commit these values or send them by chat or email.
4. Keys starting `rzp_test_` show a "Test mode" banner at checkout. Switch to live keys only after the owner signs off test orders.

While test keys (`rzp_test_…`) are set, checkout is open only to staff signed in to `/admin` in the same browser, so the public cannot place test orders. Test orders carry a "do not ship" note and the orders page shows a test-mode banner. Switching to live keys (`rzp_live_…`) opens checkout to everyone.

An order is marked paid only by a verified signature from Razorpay: either the signed browser response (checked and then read back from Razorpay's API) or the signed webhook. Each webhook event is processed once. Stock is taken when payment is captured; if it ran out in the meantime, a note appears on the order.

Delivery charges are set with `SHIPPING_FLAT_RUPEES` and `SHIPPING_FREE_ABOVE_RUPEES`. The owner has confirmed free delivery from ₹3,000; the charge for smaller orders is still to be confirmed, and until `SHIPPING_FLAT_RUPEES` is set no charge is added.

Orders are managed at `/admin/orders` (owner, or staff with the `orders` role). Staff move orders through processing, shipped (courier and tracking number required) and delivered. Cancelling a paid order returns its stock and reminds staff to issue the refund in the Razorpay dashboard; refunds from the admin come later.

## Careers and recruitment
The public careers portal is at `/careers` (vacancies, filters, job pages at `/careers/<title>-<reference>`, the application form at `.../apply`,
and "Submit your profile" at `/careers/future-opportunities`). Staff manage it at `/admin/careers`.

- **Who can use it:** owners, and staff with the `recruitment` role (`npm run staff:create -- --email … --role recruitment`). Permissions:
  `careers.manage` (vacancies, settings, templates, deleting candidate data), `careers.applications` (candidates, status, notes, emails) and
  `careers.cvs` (CV downloads and CSV export).
- **Vacancies:** Admin → Careers → Vacancies → New vacancy. Save as draft, preview, publish, pause (hide temporarily), close, duplicate or
  delete (only if it has no applications). A vacancy stops taking applications at the end of its deadline day (India time); "Close all expired"
  tidies them up. Nothing is published unless staff publish it, and no sample vacancies are included.
- **Email:** set the recruitment notification address(es) in Admin → Careers → Settings. Until one is set, new applications are logged but
  nobody is emailed. Candidates get an automatic acknowledgement. Interview, shortlist, selection, rejection and on-hold emails use editable
  templates with `{{name}}`, `{{position}}`, `{{reference}}` and `{{details}}`. Every email (sent, failed or skipped) is logged on the candidate.
- **CVs:** PDF, DOC or DOCX up to 5 MB, checked by their contents (not the file name). Files with macros, scripts or embedded files are refused.
  CVs are stored in `UPLOAD_DIR/careers/<application>/` with random names, outside the public folder, and are downloaded only through
  `/admin/careers/cv/<id>` by signed-in staff with `careers.cvs`. Every download and export is written to the audit log.
- **Spam protection:** hidden honeypot field, a signed form timestamp (instant or very old submissions are refused), per-connection and
  per-email limits, and one application per email per vacancy every 30 days.
- **Data retention:** each application has a "keep until" date (12 months by default, set in Settings). Staff with `careers.manage` can delete a
  candidate's data permanently from the candidate page, for example on request.
- **SEO:** `/careers` and each open vacancy have their own title, description, canonical URL and social tags; open vacancies carry
  JobPosting structured data and are listed in `/sitemap.xml`. Closed or expired vacancies stay reachable but are `noindex` and drop out of the
  sitemap. `/robots.txt` keeps admin, account, checkout and application-form pages out of search engines.
