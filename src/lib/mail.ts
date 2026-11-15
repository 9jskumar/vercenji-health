import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing email through the mailbox on the MilesWeb server (cPanel → Email Accounts).
 * Set on the server only: SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS and MAIL_FROM.
 */
let transporter: Transporter | null = null;

export function mailEnabled() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export type Mail = { to: string; subject: string; text: string; html?: string };

/** Sends one email. Without SMTP settings, development builds print it to the console instead. */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!mailEnabled()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
      return true;
    }
    console.error("[mail] SMTP is not configured; email not sent");
    return false;
  }
  try {
    await transport().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, ...mail });
    return true;
  } catch (e) {
    console.error("[mail] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}
