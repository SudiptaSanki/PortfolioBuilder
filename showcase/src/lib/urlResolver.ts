/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ResolvedTemplateUrls {
  provider: string;
  type: string;
  shard: string;
  baseUrl: string;
  previewUrl: string;
  githubUrl: string;
  previewImageSrc: string;
}

/**
 * resolveTemplateUrl
 * Centralized, provider-independent URL resolver for Portfolio Builder.
 * Encapsulates all deployment metadata, sharding, and routing rules in one place.
 */
export function resolveTemplateUrl(template: any): ResolvedTemplateUrls {
  const deployment = template.deployment || {};
  const rawPath = (template.path || deployment.path || '').replace(/\\/g, '/');
  const cleanPath = rawPath.replace(/^\/+/, '').replace(/\/index\.html$/, '');

  // 1. If explicit liveUrl is registered in deployment metadata, use it as primary
  let previewUrl = deployment.liveUrl || '';
  let provider = deployment.provider || template.platform || 'github-pages';
  const type = deployment.type || 'shared-static';
  const shard = deployment.shard || 'default';
  let baseUrl = deployment.baseUrl || '';

  // 2. Dynamic derivation if liveUrl is not present
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

  // 3. GitHub canonical source repository link
  const codePath = cleanPath.replace(/\/(dist|out)$/, '');
  const githubUrl = `https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/${codePath}`;

  // 4. Preview image resolution
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
    baseUrl,
    previewUrl,
    githubUrl,
    previewImageSrc
  };
}
