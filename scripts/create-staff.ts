/**
 * Creates (or resets) a staff account with a password and an authenticator-app secret.
 * Run on the server, never share the output in chat or email:
 *
 *   npm run staff:create -- --email owner@vercenji.com --name "Owner name" --role owner
 *
 * You are asked for the password twice (it is not shown). The script prints a setup key
 * and an otpauth:// link to add to Google Authenticator, Microsoft Authenticator or 1Password.
 */
import "dotenv/config";
import { createInterface } from "node:readline";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { encryptSecret, hashPassword } from "../src/lib/auth/crypto";
import { newTotpSecret, otpauthUri } from "../src/lib/auth/totp";
import { DEFAULT_ROLES } from "../src/lib/auth/permissions";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    out._writeToOutput = (s: string) => out.output.write(s.includes(question) ? s : "");
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name");
  const roleKey = arg("role") ?? "owner";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Pass --email you@example.com");
  if (!DEFAULT_ROLES.some((r) => r.key === roleKey)) throw new Error(`--role must be one of: ${DEFAULT_ROLES.map((r) => r.key).join(", ")}`);

  const password = process.env.STAFF_PASSWORD ?? (await askHidden("Password (12+ characters): "));
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");
  if (!process.env.STAFF_PASSWORD && password !== (await askHidden("Repeat password: "))) throw new Error("Passwords do not match.");

  const db = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
  try {
    for (const r of DEFAULT_ROLES) {
      await db.role.upsert({ where: { key: r.key }, create: r, update: { name: r.name, permissions: r.permissions } });
    }
    const role = await db.role.findUniqueOrThrow({ where: { key: roleKey } });
    const secret = newTotpSecret();
    const data = { kind: "STAFF" as const, name, passwordHash: await hashPassword(password), totpSecret: encryptSecret(secret), isActive: true };
    const user = await db.user.upsert({ where: { email }, create: { email, ...data }, update: data });
    await db.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, create: { userId: user.id, roleId: role.id }, update: {} });
    await db.session.deleteMany({ where: { userId: user.id } }); // sign out everywhere after a reset
    await db.auditLog.create({ data: { actorId: null, action: "staff.create_or_reset", entityType: "User", entityId: user.id, after: { email, role: roleKey } } });

    console.log(`\nStaff account ready: ${email} (${role.name})`);
    console.log("Add this to your authenticator app now. It is shown only once.");
    console.log(`  Setup key: ${secret.match(/.{1,4}/g)!.join(" ")}`);
    console.log(`  Link:      ${otpauthUri(secret, email)}\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
