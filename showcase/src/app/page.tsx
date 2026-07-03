'use client';

import { useState, useMemo } from 'react';
import templates from '@/data/templates.json';

const ALL_CATEGORIES = ['All', 'technology', 'creative', 'business', 'academic', 'health-wellness', 'services'];
const CATEGORY_LABELS: Record<string, string> = {
  'All': 'All Templates',
  'technology': 'Technology',
  'creative': 'Creative',
  'business': 'Business',
  'academic': 'Academic',
  'health-wellness': 'Health & Wellness',
  'services': 'Services',
};
const STACK_FILTERS = ['All Stacks', 'HTML/CSS/JS', 'React', 'Next.js', 'Vue'];

type Template = typeof templates[number];

export default function Home() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStack, setActiveStack] = useState('All Stacks');

  const filtered = useMemo<Template[]>(() => {
    const q = query.toLowerCase().trim();
    return templates.filter((t) => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesStack = activeStack === 'All Stacks' || t.stack === activeStack;
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.theme.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesStack && matchesQuery;
    });
  }, [query, activeCategory, activeStack]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(12, 12, 14, 0.9)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6c7af7, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>Folio Hub</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a
              href="https://github.com/SudiptaSanki/PortfolioBuilder"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://github.com/SudiptaSanki/PortfolioBuilder/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--accent)', color: '#fff', padding: '7px 14px',
                borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Contribute
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', padding: '4px 12px', background: 'rgba(108,122,247,0.12)',
          border: '1px solid rgba(108,122,247,0.25)', borderRadius: 100, fontSize: 12,
          color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: 24,
        }}>
          Open Source — 10 Templates and Growing
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: 20, color: '#fff' }}>
          Portfolio templates for{' '}
          <span style={{ color: 'var(--accent)' }}>every profession</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          Browse a growing, open-source collection of professionally designed portfolio templates across technology, creative fields, business, and more.
        </p>

        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role, theme, or technology..."
            style={{
              width: '100%', padding: '13px 16px 13px 44px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </section>

      {/* Filters */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 24px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
                background: activeCategory === cat ? 'rgba(108,122,247,0.12)' : 'transparent',
                color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={activeStack}
            onChange={(e) => setActiveStack(e.target.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
            }}
          >
            {STACK_FILTERS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 24px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Grid */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16 }}>No templates match your search.</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); setActiveStack('All Stacks'); }}
              style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24,
          }}>
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Portfolio Builder is an open-source project.{' '}
          <a
            href="https://github.com/SudiptaSanki/PortfolioBuilder"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            Contribute on GitHub
          </a>
          {' '}and help us reach 1000+ templates.
        </p>
      </footer>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const [hovered, setHovered] = useState(false);

  const CATEGORY_COLORS: Record<string, string> = {
    technology: '#4ade80',
    creative: '#f472b6',
    business: '#facc15',
    academic: '#60a5fa',
    'health-wellness': '#fb923c',
    services: '#a78bfa',
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: hovered ? 'rgba(108,122,247,0.4)' : 'var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
        cursor: 'default',
      }}
    >
      {/* Preview Image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        <img
          src={template.preview}
          alt={template.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: CATEGORY_COLORS[template.category] || '#888',
          color: '#000', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
        }}>
          {template.stack}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>{template.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{template.role} &bull; {template.theme}</p>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          {template.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 6,
              fontSize: 11, color: 'var(--text-secondary)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/${template.path}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            View Code
          </a>
          <a
            href={`https://github.com/SudiptaSanki/PortfolioBuilder/tree/main/${template.path}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
              background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 500, transition: 'background 0.2s', textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Use Template
          </a>
        </div>
      </div>
    </div>
  );
}
