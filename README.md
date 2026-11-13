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

Roles: `owner` (everything) and `partnerships` (partner applications only).
Uploaded documents are stored in `UPLOAD_DIR`, outside the public folder, and served to signed-in staff only.

## Rules
- No secrets in Git. Production configuration lives on the server.
- No product claim, certification, price or review is published unless the owner has supplied and approved it.
- Design tokens live in `src/app/globals.css` and follow the approved Phase 2 prototype.
