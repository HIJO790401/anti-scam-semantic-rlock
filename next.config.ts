import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const githubRepo = process.env.GITHUB_REPOSITORY?.split("/")[1] || "anti-scam-semantic-rlock";
const shouldUseGithubBasePath = process.env.GITHUB_PAGES === "true";
const basePath = shouldUseGithubBasePath ? `/${githubRepo}` : "";

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
