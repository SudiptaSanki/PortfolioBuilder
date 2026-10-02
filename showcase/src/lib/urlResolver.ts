/* eslint-disable @typescript-eslint/no-explicit-any */

export type DeploymentStatus = 'active' | 'pending' | 'broken' | 'deprecated' | 'migrated';

export interface ResolvedTemplateUrls {
  provider: string;
  type: string;
  shard: string;
  status: DeploymentStatus;
  isAvailable: boolean;
  statusMessage?: string;
  baseUrl: string;
  previewUrl: string;
  githubUrl: string;
  previewImageSrc: string;
}

const DEFAULT_SHARD_BASES: Record<string, string> = {
  'github-pages-01': 'https://sudiptasanki.github.io/PortfolioBuilder',
  'cloudflare-static-01': 'https://templates-01.portfoliobuilders.pages.dev',
  'netlify-static-01': 'https://portfolio4builders.netlify.app',
  'vercel-runtime-01': 'https://portfolio4builders.vercel.app',
  'cloudflare-edge-01': 'https://portfoliobuilders.workers.dev'
};

/**
 * resolveTemplateUrl
 * Centralized, provider-independent URL resolver for Portfolio Builder.
 * Encapsulates all deployment metadata, sharding, and live status handling.
 */
export function resolveTemplateUrl(template: any): ResolvedTemplateUrls {
  const deployment = template.deployment || {};
  const rawPath = (template.path || deployment.path || '').replace(/\\/g, '/');
  const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/index\.html$/, '');

  // 1. Shard & Provider resolution
  let provider = deployment.provider || template.platform || 'github-pages';
  const type = deployment.type || 'shared-static';
  const shard = deployment.shard || (provider === 'github-pages' ? 'github-pages-01' : 'default');
  const status: DeploymentStatus = deployment.status || 'active';
  const isAvailable = status === 'active';

  let statusMessage: string | undefined;
  if (status === 'broken') {
    statusMessage = 'Preview node currently offline. Source code is verified and accessible on GitHub.';
  } else if (status === 'pending') {
    statusMessage = 'Deployment is pending verification.';
  } else if (status === 'deprecated') {
    statusMessage = 'This template version is deprecated.';
  } else if (status === 'migrated') {
    statusMessage = 'Template is migrating to a new hosting shard.';
  }

  // 2. Base URL resolution
  let baseUrl = deployment.baseUrl || DEFAULT_SHARD_BASES[shard] || '';

  // 3. Live Preview URL resolution
  let previewUrl = deployment.liveUrl || '';

  if (!previewUrl) {
    if (cleanPath.includes('/github-pages/')) {
      const relPath = cleanPath.split('/github-pages/')[1];
      baseUrl = baseUrl || 'https://sudiptasanki.github.io/PortfolioBuilder';
      previewUrl = `${baseUrl}/${relPath}/index.html`;
      provider = 'github-pages';
    } else if (cleanPath.includes('/netlify/')) {
      const relPath = cleanPath.split('/netlify/')[1];
      baseUrl = baseUrl || 'https://portfolio4builders.netlify.app';
      previewUrl = `${baseUrl}/${relPath}/index.html`;
      provider = 'netlify';
    } else if (cleanPath.includes('/vercel/')) {
      const relPath = cleanPath.split('/vercel/')[1];
      baseUrl = baseUrl || 'https://portfolio4builders.vercel.app';
      previewUrl = `${baseUrl}/${relPath}`;
      provider = 'vercel';
    } else {
      previewUrl = '/' + cleanPath + (cleanPath.endsWith('.html') ? '' : '/index.html');
      provider = 'cloudflare-pages';
    }
  }

  // 4. GitHub canonical source repository link
  const codePath = cleanPath.replace(/\/(dist|out)$/, '');
  const githubUrl = `https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/${codePath}`;

  // 5. Preview image resolution
  let previewImageSrc = '/images/placeholder.webp';
  if (template.preview) {
    const p = typeof template.preview === 'string' ? template.preview : template.preview.image;
    if (p) {
      if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) {
        previewImageSrc = p;
      } else if (baseUrl) {
        previewImageSrc = `${baseUrl}/${p}`;
      }
    }
  }

  return {
    provider,
    type,
    shard,
    status,
    isAvailable,
    statusMessage,
    baseUrl,
    previewUrl,
    githubUrl,
    previewImageSrc
  };
}
