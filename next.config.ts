import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] || "anti-scam-semantic-rlock";
const isUserOrOrgPagesRepo = repository.endsWith(".github.io");
const explicitBasePath = process.env.GITHUB_PAGES_BASE_PATH;

function resolveBasePath() {
  if (explicitBasePath !== undefined) {
    const trimmed = explicitBasePath.trim();
    if (!trimmed || trimmed === "/") return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  if (process.env.GITHUB_PAGES === "true") {
    return isUserOrOrgPagesRepo ? "" : `/${repository}`;
  }

  return "";
}

const basePath = resolveBasePath();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
        basePath,
        assetPrefix: basePath || undefined
      }
    : {})
};

export default nextConfig;
