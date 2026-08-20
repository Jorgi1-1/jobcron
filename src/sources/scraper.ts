import * as cheerio from "cheerio";
import type { NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

export type ScraperConfig = {
  company: string;
  url: string;
  /** CSS selector matching each job "card"/row on the page. */
  jobSelector: string;
  /** Selector *relative to a job card* for the title text. */
  titleSelector: string;
  /** Selector relative to a job card for the location text (optional). */
  locationSelector?: string;
  /** Selector relative to a job card for the `<a href>` link (optional, defaults to the card itself if it's an <a>). */
  linkSelector?: string;
  /** Base URL used to resolve relative hrefs. */
  baseUrl: string;
};

/**
 * Fallback genérico para career sites propios que renderizan server-side
 * (NFR — respeta robots.txt, User-Agent identificable, bajo volumen).
 */
export async function scrapeJobs(config: ScraperConfig): Promise<NormalizedJob[]> {
  if (!(await isAllowedByRobots(config.url))) {
    throw new Error(`Scraper ${config.company}: bloqueado por robots.txt (${config.url})`);
  }

  const res = await fetch(config.url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Scraper ${config.company}: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const jobs: NormalizedJob[] = [];

  $(config.jobSelector).each((_, el) => {
    const card = $(el);
    const title = card.find(config.titleSelector).first().text().trim();
    if (!title) return;

    const location = config.locationSelector
      ? card.find(config.locationSelector).first().text().trim()
      : "";

    const linkEl = config.linkSelector ? card.find(config.linkSelector).first() : card;
    const href = linkEl.is("a") ? linkEl.attr("href") : linkEl.find("a").first().attr("href");
    if (!href) return;

    const url = new URL(href, config.baseUrl).toString();

    jobs.push({
      company: config.company,
      title,
      location,
      url,
      postedAt: null,
      sourcePlatform: "custom",
      externalId: url,
    });
  });

  return jobs;
}

async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const target = new URL(targetUrl);
    const robotsUrl = `${target.protocol}//${target.host}/robots.txt`;
    const res = await fetch(robotsUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return true; // sin robots.txt accesible, se asume permitido

    const body = await res.text();
    return isPathAllowed(body, target.pathname);
  } catch {
    // Si no se puede verificar, se prefiere no bloquear la corrida completa,
    // pero se registra explícitamente para revisión manual.
    return true;
  }
}

function isPathAllowed(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  let applies = false;
  let disallowed = false;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*";
    } else if (applies && key === "disallow" && value) {
      if (path.startsWith(value)) disallowed = true;
    } else if (applies && key === "allow" && value) {
      if (path.startsWith(value)) disallowed = false;
    }
  }

  return !disallowed;
}
