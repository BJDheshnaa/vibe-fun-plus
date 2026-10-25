
/** Central site configuration used across pages and SEO metadata. */
export const SITE = {
  name: "Vibe Fun Plus",
  /** Production origin. Override with NEXT_PUBLIC_SITE_URL if the domain changes. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://vibe-fun-plus.vercel.app",
  tagline: "Games for AI, on tap.",
  description:
    "Vibe Fun Plus is an MCP Apps server featuring classic games and new additions. Connect once and explore the growing game library.",
  githubUrl: "https://github.com/BJDhesnaa/vibe-fun-plus",
  issuesUrl: "https://github.com/BJDhesnaa/vibe-fun-plus/issues",
  securityUrl:
    "https://github.com/BJDhesnaa/vibe-fun-plus/security/advisories/new",
  contactPath: "/contact",
  mcpPath: "/api/mcp",
  nav: [
    { label: "Games", href: "/#games" },
    { label: "Connect an agent", href: "/#connect" },
    { label: "Developers", href: "/#developers" },
  ],
} as const;

export function mcpEndpoint(): string {
  return `${SITE.url}${SITE.mcpPath}`;
}
