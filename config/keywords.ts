// FR-3 — Filtro por keywords (título) y por ubicación. Ajustar mensualmente
// según el log de vacantes descartadas (ver Riesgos, sección 11 del PRD).

export const titleKeywords: string[] = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "next.js",
  "nextjs",
  "typescript",
  "javascript",
  "ux",
  "ui",
  "ui/ux",
  "design system",
  "design systems",
  "full stack",
  "full-stack",
  "fullstack",
  "product engineer",
  "web developer",
  "software engineer, frontend",
  "ui engineer",
  // Ampliado a puestos de desarrollador en general, no solo front/full/UI
  "developer",
  "desarrollador",
  "desarrolladora",
  "software engineer",
  "swe",
];

export const locationKeywords: string[] = [
  "remote",
  "remoto",
  "latam",
  "latin america",
  "méxico",
  "mexico",
  "cdmx",
  "ciudad de méxico",
  "guadalajara",
  "monterrey",
  "puebla",
];
