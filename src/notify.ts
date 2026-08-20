import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { FilteredJob } from "./filter.js";

/**
 * FR-5 — envía el digest solo si hay vacantes nuevas. Soporta dos
 * proveedores (decisión abierta #3 del PRD), elegido vía EMAIL_PROVIDER.
 */
export async function sendDigest(jobs: FilteredJob[]): Promise<void> {
  if (jobs.length === 0) return;

  const to = requireEnv("DIGEST_TO_EMAIL");
  const subject = `JobCron — ${jobs.length} vacante(s) nueva(s)`;
  const html = renderHtml(jobs);
  const text = renderText(jobs);

  const provider = (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase();

  if (provider === "resend") {
    await sendWithResend(to, subject, html);
  } else if (provider === "gmail") {
    await sendWithGmailSmtp(to, subject, html, text);
  } else {
    throw new Error(`EMAIL_PROVIDER desconocido: ${provider}`);
  }
}

async function sendWithResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = process.env.RESEND_FROM_EMAIL ?? "JobCron <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

async function sendWithGmailSmtp(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const user = requireEnv("GMAIL_USER");
  const pass = requireEnv("GMAIL_APP_PASSWORD");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({ from: user, to, subject, html, text });
}

const BRAND_COLOR = "#4f46e5";
const TEXT_COLOR = "#1f2937";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const BG_COLOR = "#f4f4f7";
const CARD_BG = "#ffffff";

export function renderHtml(jobs: FilteredJob[]): string {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cards = jobs
    .map(
      (job) => `
      <tr>
        <td style="padding:0 0 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:10px;">
            <tr>
              <td style="padding:16px 20px;">
                <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${BRAND_COLOR};background:#eef2ff;border-radius:999px;padding:3px 10px;">
                  ${escapeHtml(job.company)}
                </span>
                <div style="margin-top:10px;">
                  <a href="${escapeHtml(job.url)}" style="font-size:17px;line-height:1.35;font-weight:600;color:${TEXT_COLOR};text-decoration:none;">
                    ${escapeHtml(job.title)}
                  </a>
                </div>
                <div style="margin-top:6px;font-size:14px;color:${MUTED_COLOR};">
                  📍 ${escapeHtml(job.location || "Ubicación no especificada")}
                </div>
                <div style="margin-top:14px;">
                  <a href="${escapeHtml(job.url)}" style="display:inline-block;font-size:13px;font-weight:600;color:${BRAND_COLOR};text-decoration:none;">
                    Ver vacante →
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JobCron</title>
    <style>
      @media only screen and (max-width: 480px) {
        .container { width: 100% !important; }
        .content-padding { padding-left: 16px !important; padding-right: 16px !important; }
        .header-title { font-size: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
            <tr>
              <td class="content-padding" style="padding:28px 24px 8px 24px;">
                <div class="header-title" style="font-size:22px;font-weight:700;color:${TEXT_COLOR};">
                  ${jobs.length} vacante${jobs.length === 1 ? "" : "s"} nueva${jobs.length === 1 ? "" : "s"} hoy
                </div>
                <div style="margin-top:4px;font-size:14px;color:${MUTED_COLOR};text-transform:capitalize;">
                  ${escapeHtml(today)}
                </div>
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding:16px 24px 0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${cards}
                </table>
              </td>
            </tr>
            <tr>
              <td class="content-padding" style="padding:8px 24px 24px 24px;text-align:center;">
                <div style="font-size:12px;color:${MUTED_COLOR};">
                  JobCron · digest automático de vacantes
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(jobs: FilteredJob[]): string {
  return jobs
    .map((job) => `${job.company} — ${job.title} (${job.location}) — ${job.url}`)
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}
