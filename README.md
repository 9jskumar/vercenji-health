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

An order is marked paid only by a verified signature from Razorpay: either the signed browser response (checked and then read back from Razorpay's API) or the signed webhook. Each webhook event is processed once. Stock is taken when payment is captured; if it ran out in the meantime, a note appears on the order.

Delivery charges are set with `SHIPPING_FLAT_RUPEES` and `SHIPPING_FREE_ABOVE_RUPEES`. Both default to no charge until the owner confirms the rates.

Orders are managed at `/admin/orders` (owner, or staff with the `orders` role). Staff move orders through processing, shipped (courier and tracking number required) and delivered. Cancelling a paid order returns its stock and reminds staff to issue the refund in the Razorpay dashboard; refunds from the admin come later.
