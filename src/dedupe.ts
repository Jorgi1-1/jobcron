import { createClient } from "@supabase/supabase-js";
import type { FilteredJob } from "./filter.js";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en el entorno");
  }
  return createClient(url, key);
}

/**
 * FR-4 — dado un lote de vacantes ya filtradas, devuelve solo las que no
 * existen aún en `seen_jobs` (por URL) y las persiste.
 */
export async function dedupeAndPersist(jobs: FilteredJob[]): Promise<FilteredJob[]> {
  if (jobs.length === 0) return [];

  const supabase = getClient();
  const urls = jobs.map((j) => j.url);

  const { data: existing, error: selectError } = await supabase
    .from("seen_jobs")
    .select("url")
    .in("url", urls);

  if (selectError) {
    throw new Error(`Supabase select error: ${selectError.message}`);
  }

  const seenUrls = new Set((existing ?? []).map((row) => row.url));
  const newJobs = jobs.filter((job) => !seenUrls.has(job.url));

  if (newJobs.length === 0) return [];

  const { error: insertError } = await supabase.from("seen_jobs").insert(
    newJobs.map((job) => ({
      company: job.company,
      source_platform: job.sourcePlatform,
      external_id: job.externalId,
      title: job.title,
      location: job.location,
      url: job.url,
      posted_at: job.postedAt,
      matched_keywords: job.matchedKeywords,
    }))
  );

  if (insertError) {
    throw new Error(`Supabase insert error: ${insertError.message}`);
  }

  return newJobs;
}

export async function recordDigestRun(run: {
  jobsScanned: number;
  jobsNew: number;
  sourcesFailed: string[];
  emailSent: boolean;
}): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("digest_runs").insert({
    jobs_scanned: run.jobsScanned,
    jobs_new: run.jobsNew,
    sources_failed: run.sourcesFailed,
    email_sent: run.emailSent,
  });

  if (error) {
    console.error(`No se pudo registrar digest_run: ${error.message}`);
  }
}
