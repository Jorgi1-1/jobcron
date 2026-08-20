create table seen_jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  source_platform text not null,
  external_id text,
  title text not null,
  location text,
  url text not null unique,
  posted_at timestamptz,
  first_seen_at timestamptz default now(),
  matched_keywords text[]
);

create table digest_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz default now(),
  jobs_scanned int,
  jobs_new int,
  sources_failed text[],
  email_sent boolean
);

create index seen_jobs_url_idx on seen_jobs (url);
