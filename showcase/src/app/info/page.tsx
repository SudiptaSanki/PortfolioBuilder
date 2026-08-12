/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import templates from '@/data/templates.json';
import { useMemo, useState } from 'react';
import Link from 'next/link';

type Template = (typeof templates)[number];

const PLATFORM_COLORS: Record<string, string> = {
  'github-pages': '#24292f',
  vercel: '#000000',
  netlify: '#00c7b7',
  cloudflare: '#f38020',
  firebase: '#ffca28',
};

const PLATFORM_LABELS: Record<string, string> = {
  'github-pages': 'GitHub Pages',
  vercel: 'Vercel',
  netlify: 'Netlify',
  cloudflare: 'Cloudflare',
  firebase: 'Firebase',
};

const STACK_COLORS: Record<string, string> = {
  html: '#e44d26',
  react: '#61dafb',
  vue: '#42b883',
  nextjs: '#ffffff',
};

const STACK_LABELS: Record<string, string> = {
  html: 'HTML/CSS/JS',
  react: 'React',
  vue: 'Vue',
  nextjs: 'Next.js',
};

export default function InfoPage() {
  const [sortCol, setSortCol] = useState<string>('genre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Compute distributions from templates.json paths
  const analysis = useMemo(() => {
    const genreMap: Record<string, Record<string, number>> = {};
    const stackMap: Record<string, number> = {};
    const platformMap: Record<string, number> = {};
    const stackPlatformMap: Record<string, number> = {};

    templates.forEach((t: Template) => {
      const parts = t.path.split('/');
      const stack = parts[1] || 'unknown';
      const platform = parts[2] || 'unknown';
      const genre = parts[3] || 'unknown';

      // Genre breakdown
      if (!genreMap[genre]) genreMap[genre] = {};
      if (!genreMap[genre][stack]) genreMap[genre][stack] = 0;
      genreMap[genre][stack]++;

      // Stack totals
      stackMap[stack] = (stackMap[stack] || 0) + 1;

      // Platform totals
      platformMap[platform] = (platformMap[platform] || 0) + 1;

      // Stack + Platform combo
      const key = `${stack}/${platform}`;
      stackPlatformMap[key] = (stackPlatformMap[key] || 0) + 1;
    });

    // Genre table rows
    const genreRows = Object.entries(genreMap)
      .map(([genre, stacks]) => ({
        genre,
        html: stacks['html'] || 0,
        react: stacks['react'] || 0,
        vue: stacks['vue'] || 0,
        nextjs: stacks['nextjs'] || 0,
        total: Object.values(stacks).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => {
        const av = (a as any)[sortCol];
        const bv = (b as any)[sortCol];
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });

    return { genreRows, stackMap, platformMap, stackPlatformMap, total: templates.length };
  }, [sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const sortIcon = (col: string) => (sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#e4e4e7' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          background: 'rgba(10,10,12,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6c7af7, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>Folio Hub</span>
          <span style={{ color: '#71717a', fontSize: 13 }}>/</span>
          <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 500 }}>Info Dashboard</span>
        </div>
        <Link href="/" style={{ color: '#a1a1aa', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Templates
        </Link>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
          Architecture & Distribution Overview
        </h1>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 40, maxWidth: 700 }}>
          Live dashboard tracking every template across genres, tech stacks, and hosting platforms. This page
          auto-generates from <code style={{ color: '#a78bfa' }}>templates.json</code>.
        </p>

        {/* Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <SummaryCard label="Total Templates" value={analysis.total} color="#a78bfa" />
          <SummaryCard label="Genres" value={Object.keys(analysis.genreRows).length} color="#6ee7b7" />
          <SummaryCard label="Tech Stacks" value={Object.keys(analysis.stackMap).length} color="#fbbf24" />
          <SummaryCard label="Platforms" value={Object.keys(analysis.platformMap).length} color="#f87171" />
        </div>

        {/* Section: Genre × Stack Distribution */}
        <SectionTitle>Genre × Tech Stack Distribution</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Th onClick={() => handleSort('genre')}>Genre{sortIcon('genre')}</Th>
                <Th onClick={() => handleSort('html')} align="right">
                  HTML{sortIcon('html')}
                </Th>
                <Th onClick={() => handleSort('react')} align="right">
                  React{sortIcon('react')}
                </Th>
                <Th onClick={() => handleSort('vue')} align="right">
                  Vue{sortIcon('vue')}
                </Th>
                <Th onClick={() => handleSort('nextjs')} align="right">
                  Next.js{sortIcon('nextjs')}
                </Th>
                <Th onClick={() => handleSort('total')} align="right">
                  Total{sortIcon('total')}
                </Th>
              </tr>
            </thead>
            <tbody>
              {analysis.genreRows.map((row) => (
                <tr key={row.genre} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Td>
                    <span style={{ textTransform: 'capitalize' }}>{row.genre.replace(/-/g, ' ')}</span>
                  </Td>
                  <Td align="right">{row.html || <Dim>—</Dim>}</Td>
                  <Td align="right">{row.react || <Dim>—</Dim>}</Td>
                  <Td align="right">{row.vue || <Dim>—</Dim>}</Td>
                  <Td align="right">{row.nextjs || <Dim>—</Dim>}</Td>
                  <Td align="right">
                    <strong>{row.total}</strong>
                  </Td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                <Td>
                  <strong>TOTAL</strong>
                </Td>
                <Td align="right">
                  <strong>{analysis.genreRows.reduce((s, r) => s + r.html, 0)}</strong>
                </Td>
                <Td align="right">
                  <strong>{analysis.genreRows.reduce((s, r) => s + r.react, 0)}</strong>
                </Td>
                <Td align="right">
                  <strong>{analysis.genreRows.reduce((s, r) => s + r.vue, 0)}</strong>
                </Td>
                <Td align="right">
                  <strong>{analysis.genreRows.reduce((s, r) => s + r.nextjs, 0)}</strong>
                </Td>
                <Td align="right">
                  <strong>{analysis.total}</strong>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Platform Distribution */}
        <SectionTitle>Platform Distribution</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {Object.entries(analysis.platformMap)
            .sort((a, b) => b[1] - a[1])
            .map(([platform, count]) => (
              <div
                key={platform}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                    {PLATFORM_LABELS[platform] || platform}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: PLATFORM_COLORS[platform] || '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {platform === 'github-pages'
                    ? '🐙'
                    : platform === 'vercel'
                      ? '▲'
                      : platform === 'netlify'
                        ? '◆'
                        : platform === 'cloudflare'
                          ? '☁️'
                          : '🔥'}
                </div>
              </div>
            ))}
        </div>

        {/* Section: Stack × Platform Matrix */}
        <SectionTitle>Stack × Platform Matrix</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Th>Combo</Th>
                <Th align="right">Count</Th>
                <Th align="right">% of Total</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.stackPlatformMap)
                .sort((a, b) => b[1] - a[1])
                .map(([combo, count]) => {
                  const [stack, platform] = combo.split('/');
                  return (
                    <tr key={combo} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Td>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: STACK_COLORS[stack] || '#888',
                            marginRight: 8,
                          }}
                        />
                        {STACK_LABELS[stack] || stack} → {PLATFORM_LABELS[platform] || platform}
                      </Td>
                      <Td align="right">{count}</Td>
                      <Td align="right">{((count / analysis.total) * 100).toFixed(1)}%</Td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Section: 5-Level Taxonomy */}
        <SectionTitle>5-Level Foundation Taxonomy</SectionTitle>
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 48,
            fontFamily: 'var(--font-geist-mono)',
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: '#71717a' }}>templates /</div>
          <div style={{ paddingLeft: 20 }}>
            <span style={{ color: '#e44d26' }}>{'<Tech Stack>'}</span>
            <span style={{ color: '#71717a' }}> (html | react | vue | nextjs)</span>
          </div>
          <div style={{ paddingLeft: 40 }}>
            <span style={{ color: '#fbbf24' }}>{'<Platform>'}</span>
            <span style={{ color: '#71717a' }}> (github-pages | vercel | netlify | cloudflare | firebase)</span>
          </div>
          <div style={{ paddingLeft: 60 }}>
            <span style={{ color: '#6ee7b7' }}>{'<Genre>'}</span>
            <span style={{ color: '#71717a' }}> (business | creative | gaming | technology | ...)</span>
          </div>
          <div style={{ paddingLeft: 80 }}>
            <span style={{ color: '#93c5fd' }}>{'<Role>'}</span>
            <span style={{ color: '#71717a' }}> (ui-ux-designer | software-engineer | ...)</span>
          </div>
          <div style={{ paddingLeft: 100 }}>
            <span style={{ color: '#a78bfa' }}>{'<Theme Name>'}</span>
            <span style={{ color: '#71717a' }}> (cyberpunk-neon | minimal-studio | ...)</span>
          </div>
        </div>

        {/* Section: Platform Routing Rules */}
        <SectionTitle>Platform Routing Rules</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Th>Feature</Th>
                <Th align="center">GitHub Pages</Th>
                <Th align="center">Cloudflare</Th>
                <Th align="center">Vercel</Th>
                <Th align="center">Netlify</Th>
                <Th align="center">Firebase</Th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow feature="Bandwidth" gp="100GB/mo" cf="∞ Unlimited" vc="100GB/mo" nt="100GB/mo" fb="~10GB/mo" highlight="cf" />
              <ComparisonRow feature="SSR Support" gp="❌" cf="✅ Workers" vc="✅ Serverless" nt="✅ Functions" fb="✅ Cloud Fn" highlight="cf" />
              <ComparisonRow feature="SSR Timeout" gp="N/A" cf="30s" vc="10s" nt="10s" fb="Variable" highlight="cf" />
              <ComparisonRow feature="SSR Payload" gp="N/A" cf="25 MB" vc="4.5 MB" nt="6 MB" fb="10 MB" highlight="cf" />
              <ComparisonRow feature="3D Delivery" gp="Static only" cf="✅ Best" vc="⚠️ Limited" nt="⚠️ Limited" fb="❌ Low BW" highlight="cf" />
              <ComparisonRow feature="Credit Card" gp="❌ No" cf="❌ No" vc="❌ No" nt="❌ No" fb="❌ No" highlight="" />
              <ComparisonRow feature="Best For" gp="Static HTML" cf="3D, SSR, HT" vc="Next.js" nt="Vue SPAs" fb="Auth/DB" highlight="" />
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#52525b', fontSize: 12 }}>
          Auto-generated from <code style={{ color: '#a78bfa' }}>templates.json</code> · Updated on every build
        </div>
      </main>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        letterSpacing: '-0.3px',
      }}
    >
      {children}
    </h2>
  );
}

function Th({ children, onClick, align = 'left' }: { children: React.ReactNode; onClick?: () => void; align?: string }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: '10px 12px',
        textAlign: align as any,
        fontWeight: 500,
        color: '#a1a1aa',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: string }) {
  return <td style={{ padding: '10px 12px', textAlign: align as any }}>{children}</td>;
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#3f3f46' }}>{children}</span>;
}

function ComparisonRow({
  feature,
  gp,
  cf,
  vc,
  nt,
  fb,
  highlight,
}: {
  feature: string;
  gp: string;
  cf: string;
  vc: string;
  nt: string;
  fb: string;
  highlight: string;
}) {
  const hlStyle = { background: 'rgba(167, 139, 250, 0.08)', fontWeight: 600 as const };
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Td>{feature}</Td>
      <td style={{ padding: '10px 12px', textAlign: 'center', ...(highlight === 'gp' ? hlStyle : {}) }}>{gp}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', ...(highlight === 'cf' ? hlStyle : {}) }}>{cf}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', ...(highlight === 'vc' ? hlStyle : {}) }}>{vc}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', ...(highlight === 'nt' ? hlStyle : {}) }}>{nt}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', ...(highlight === 'fb' ? hlStyle : {}) }}>{fb}</td>
    </tr>
  );
}
