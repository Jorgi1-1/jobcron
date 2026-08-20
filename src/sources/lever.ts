import type { Company, NormalizedJob } from "../types.js";

const USER_AGENT = "JobCron/1.0 (+personal job-alert bot; low volume, 2 req/day)";

type LeverJob = {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt: number;
  categories?: { location?: string };
};

export async function fetchLeverJobs(company: Company): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${company.identifier}?mode=json`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Lever ${company.name}: HTTP ${res.status}`);
  }

  const jobs = (await res.json()) as LeverJob[];

  return jobs.map((job) => ({
    company: company.name,
    title: job.text,
    location: job.categories?.location ?? "",
    url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    sourcePlatform: "lever",
    externalId: job.id,
  }));
}
