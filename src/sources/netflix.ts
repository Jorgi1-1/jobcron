import type { NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type NetflixPosition = {
  id: number;
  name: string;
  location: string;
  canonicalPositionUrl: string;
  t_update?: number;
};

/**
 * Netflix — no usa Greenhouse/Lever/Ashby; su plataforma de carreras
 * (explore.jobs.netflix.net) expone la API JSON interna que alimenta su
 * propio buscador, sin autenticación (FR-1c). Verificado manualmente:
 * robots.txt de ese subdominio permite explícitamente `/api/apply`, y el
 * filtro `location=Mexico` reduce el resultado del lado del servidor
 * (5 vacantes en vez de recorrer las 500+ globales).
 */
export async function fetchNetflixJobs(): Promise<NormalizedJob[]> {
  const url =
    "https://explore.jobs.netflix.net/api/apply/v2/jobs?domain=netflix.com&location=Mexico";
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Netflix: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { positions?: NetflixPosition[] };

  return (data.positions ?? []).map((position) => ({
    company: "Netflix",
    title: position.name,
    location: position.location,
    url: position.canonicalPositionUrl,
    postedAt: position.t_update ? new Date(position.t_update * 1000).toISOString() : null,
    sourcePlatform: "custom",
    externalId: String(position.id),
  }));
}
