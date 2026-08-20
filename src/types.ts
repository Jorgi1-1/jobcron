export type NormalizedJob = {
  company: string;
  title: string;
  location: string;
  url: string;
  postedAt: string | null;
  sourcePlatform: string;
  externalId: string;
};

export type SourcePlatform = "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "workday" | "custom";

export type Company = {
  name: string;
  platform: SourcePlatform;
  identifier: string;
  status: "verified" | "probable" | "unknown";
  tier: 1 | 2 | 3 | 4 | 5;
};

export type SourceResult = {
  company: string;
  jobs: NormalizedJob[];
  error?: string;
};
