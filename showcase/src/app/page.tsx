/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import templates from '@/data/templates.json';
import { motion } from 'framer-motion';
import HeroSection from '@/components/ui/glassmorphism-trust-hero';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { resolveTemplateUrl } from '@/lib/urlResolver';

const ALL_CATEGORIES = [
  'All', '⭐ Starred', 'festival', 'technical', 'engineering', 'research', 'educator',
  'medical', 'wellness-sports', 'agriculture', 'transport-aviation', 'construction-trades',
  'creative', 'business', 'law-public', 'music', 'retail', 'services', 'startup', 'gaming'
];
const CATEGORY_LABELS: Record<string, string> = {
  'All': 'All Templates',
  'festival': 'Festival & Cultural',
  'technical': 'Technical & Software',
  'engineering': 'Engineering',
  'research': 'Science & Research',
  'educator': 'Educators & Training',
  'medical': 'Medical & Healthcare',
  'wellness-sports': 'Wellness & Sports',
  'agriculture': 'Agriculture & Farming',
  'transport-aviation': 'Aviation, Rail & Maritime',
  'construction-trades': 'Construction & Trades',
  'creative': 'Creative & Design',
  'business': 'Business & Finance',
  'law-public': 'Law & Public Service',
  'music': 'Music & Audio',
  'retail': 'Retail & Shops',
  'services': 'Services & Hospitality',
  'startup': 'Startups & Students',
  'gaming': 'Gaming & Esports',
};
const COLLECTION_FILTERS = ['All Collections', 'Core Library', 'Festival & Puja', 'Interactive 3D', 'Genre Lab'];
const COLLECTION_TAG_MAP: Record<string, string> = {
  'Core Library': 'core',
  'Festival & Puja': 'festival',
  'Interactive 3D': 'collection',
  'Genre Lab': 'genre-lab',
};
const STYLE_FILTERS: Array<{ label: string; tag: string }> = [
  { label: 'All Designs', tag: 'all' },
  { label: '3D & WebGL', tag: '3d-webgl' },
  { label: 'Photo Editorial', tag: 'photo-editorial' },
  { label: 'Canvas Interactive', tag: 'canvas-interactive' },
  { label: 'GSAP Motion', tag: 'gsap-motion' },
  { label: 'Web Audio', tag: 'web-audio' },
];
const STACK_FILTERS = ['All Stacks', 'HTML/CSS/JS', 'React', 'Next.js', 'Vue'];
const STRUCTURE_FILTERS = ['All Structures', 'Single-page', 'Multi-page'];
const SORT_OPTIONS = ['Featured', 'Name A–Z', 'Name Z–A', 'Category', 'Stack', 'Role A–Z'];

const CATEGORY_COLORS: Record<string, string> = {
  festival: '#f59e0b',
  technical: '#4ade80',
  engineering: '#38bdf8',
  research: '#60a5fa',
  educator: '#818cf8',
  medical: '#f87171',
  'wellness-sports': '#fb923c',
  agriculture: '#84cc16',
  'transport-aviation': '#22d3ee',
  'construction-trades': '#d97706',
  creative: '#f472b6',
  business: '#facc15',
  'law-public': '#94a3b8',
  music: '#c084fc',
  retail: '#fb7185',
  services: '#a78bfa',
  startup: '#2dd4bf',
  gaming: '#e879f9',
};

type Template = typeof templates[number];

function getLuminance(hex: string): number {
  const m = (hex || '').trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return 0.1;
  const n = m[1];
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Sequential Live Preview Queue (concurrency = 1)
 * Loads visible template iframes strictly one-by-one as the user scrolls,
 * paces requests with a short cooldown, and caps active mounted iframes & WebGL contexts.
 */
class LivePreviewQueue {
  private queue: string[] = [];
  private activeLoadingId: string | null = null;
  private mountedIds: string[] = [];
  private loadedIds = new Set<string>();
  private heavy3dMap = new Map<string, boolean>();
  private visibleIds = new Set<string>();
  private listeners = new Map<string, () => void>();
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private pacingTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly MAX_MOUNTED = 12;
  private readonly MAX_HEAVY_3D = 6;
  private readonly STEP_DELAY_MS = 280;
  private readonly LOAD_TIMEOUT_MS = 5000;

  subscribe(id: string, fn: () => void): () => void {
    this.listeners.set(id, fn);
    return () => {
      this.listeners.delete(id);
      this.setVisible(id, false, false);
    };
  }

  private notify(id: string) {
    const fn = this.listeners.get(id);
    if (fn) fn();
  }

  private notifyAll() {
    this.listeners.forEach((fn) => fn());
  }

  getState(id: string): { mounted: boolean; loaded: boolean; loading: boolean; queued: boolean } {
    return {
      mounted: this.mountedIds.includes(id) || this.activeLoadingId === id,
      loaded: this.loadedIds.has(id),
      loading: this.activeLoadingId === id,
      queued: this.queue.includes(id),
    };
  }

  setVisible(id: string, visible: boolean, is3d = false, priority = false) {
    this.heavy3dMap.set(id, is3d);
    if (visible) {
      this.visibleIds.add(id);
      if (this.activeLoadingId === id || this.mountedIds.includes(id)) {
        // Touch recency if already mounted
        if (this.mountedIds.includes(id)) {
          this.mountedIds = [...this.mountedIds.filter((x) => x !== id), id];
        }
        return;
      }
      if (!this.queue.includes(id)) {
        if (priority) this.queue.unshift(id);
        else this.queue.push(id);
      } else if (priority) {
        this.queue = [id, ...this.queue.filter((x) => x !== id)];
      }
      this.notify(id);
      this.pump();
    } else {
      this.visibleIds.delete(id);
      const wasQueued = this.queue.includes(id);
      if (wasQueued) {
        this.queue = this.queue.filter((x) => x !== id);
        this.notify(id);
      }
    }
  }

  prioritize(id: string, is3d = false) {
    this.setVisible(id, true, is3d, true);
  }

  private evictIfNeeded(incomingId: string) {
    const incomingIs3d = Boolean(this.heavy3dMap.get(incomingId));

    // Enforce 3D/WebGL context ceiling first
    if (incomingIs3d) {
      let current3d = this.mountedIds.filter((x) => this.heavy3dMap.get(x));
      while (current3d.length >= this.MAX_HEAVY_3D) {
        const victim = current3d.find((x) => !this.visibleIds.has(x)) || current3d[0];
        if (!victim) break;
        this.removeMounted(victim);
        current3d = this.mountedIds.filter((x) => this.heavy3dMap.get(x));
      }
    }

    // Enforce total mounted iframe ceiling
    while (this.mountedIds.length >= this.MAX_MOUNTED) {
      const victim = this.mountedIds.find((x) => !this.visibleIds.has(x)) || this.mountedIds[0];
      if (!victim) break;
      this.removeMounted(victim);
    }
  }

  private removeMounted(id: string) {
    this.mountedIds = this.mountedIds.filter((x) => x !== id);
    this.loadedIds.delete(id);
    this.notify(id);
  }

  private pump() {
    if (this.activeLoadingId || this.pacingTimer) return;
    // Prune invisible items at head of queue
    while (this.queue.length > 0 && !this.visibleIds.has(this.queue[0])) {
      const skipped = this.queue.shift()!;
      this.notify(skipped);
    }
    if (this.queue.length === 0) return;

    const nextId = this.queue.shift()!;
    this.evictIfNeeded(nextId);
    this.activeLoadingId = nextId;
    if (!this.mountedIds.includes(nextId)) {
      this.mountedIds.push(nextId);
    }
    this.notify(nextId);

    this.safetyTimer = setTimeout(() => {
      this.finishCurrent(nextId, false);
    }, this.LOAD_TIMEOUT_MS);
  }

  markLoaded(id: string) {
    if (this.activeLoadingId === id) {
      this.finishCurrent(id, true);
    } else if (this.mountedIds.includes(id)) {
      this.loadedIds.add(id);
      this.notify(id);
    }
  }

  private finishCurrent(id: string, cleanLoad: boolean) {
    if (this.activeLoadingId !== id) return;
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    this.loadedIds.add(id);
    this.activeLoadingId = null;
    this.notify(id);

    this.pacingTimer = setTimeout(() => {
      this.pacingTimer = null;
      this.pump();
    }, cleanLoad ? this.STEP_DELAY_MS : 120);
  }

  resetAll() {
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    if (this.pacingTimer) clearTimeout(this.pacingTimer);
    this.safetyTimer = null;
    this.pacingTimer = null;
    this.queue = [];
    this.activeLoadingId = null;
    this.mountedIds = [];
    this.loadedIds.clear();
    this.visibleIds.clear();
    this.notifyAll();
  }
}

const previewQueue = new LivePreviewQueue();

export default function Home() {
  const { user, login, logout } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const local = localStorage.getItem('foliohub_favorites');
    let localFavs: string[] = [];
    if (local) {
      try { localFavs = JSON.parse(local); setFavorites(localFavs); } catch (e) {}
    }
    if (user) {
      import('firebase/firestore').then(({ collection, getDocs, doc, setDoc }) => {
        getDocs(collection(db, 'users', user.uid, 'favorites')).then(snap => {
          const firestoreFavs = snap.docs.map(d => d.id);
          const merged = Array.from(new Set([...localFavs, ...firestoreFavs]));
          setFavorites(merged);
          localStorage.setItem('foliohub_favorites', JSON.stringify(merged));

          localFavs.forEach(fav => {
            if (!firestoreFavs.includes(fav)) {
              setDoc(doc(db, 'users', user.uid, 'favorites', fav), { timestamp: new Date().toISOString() });
            }
          });
        });
      });
    }
  }, [user]);

  const toggleFavorite = useCallback((templateName: string, templatePath: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(templateName);
      const newFavs = isFav ? prev.filter(f => f !== templateName) : [...prev, templateName];
      localStorage.setItem('foliohub_favorites', JSON.stringify(newFavs));

      if (user) {
        import('firebase/firestore').then(({ doc, setDoc, deleteDoc }) => {
          const docRef = doc(db, 'users', user.uid, 'favorites', templateName);
          if (isFav) {
            deleteDoc(docRef);
          } else {
            setDoc(docRef, { name: templateName, path: templatePath, timestamp: new Date().toISOString() });
          }
        });
      }
      return newFavs;
    });
  }, [user]);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeRole, setActiveRole] = useState('All Roles');
  const [activeStyle, setActiveStyle] = useState('all');
  const [activeStack, setActiveStack] = useState('All Stacks');
  const [activeStructure, setActiveStructure] = useState('All Structures');
  const [activeCollection, setActiveCollection] = useState('All Collections');
  const [sortBy, setSortBy] = useState('Featured');
  const [displayCount, setDisplayCount] = useState(24);

  useEffect(() => {
    setActiveRole('All Roles');
  }, [activeCategory]);

  useEffect(() => {
    setDisplayCount(24);
    previewQueue.resetAll();
  }, [query, activeCategory, activeRole, activeStyle, activeStack, activeStructure, activeCollection, sortBy]);

  const openExternalUrl = useCallback((url: string) => {
    if (typeof window === 'undefined' || !url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const visibleCategories = useMemo(() => {
    const present = new Set(templates.map((t) => t.category));
    return ALL_CATEGORIES.filter((cat) => cat === 'All' || cat === '⭐ Starred' || present.has(cat));
  }, []);

  const visibleCollections = useMemo(() => {
    const presentTags = new Set<string>();
    for (const t of templates) {
      for (const tag of t.tags || []) presentTags.add(tag);
    }
    return COLLECTION_FILTERS.filter((col) => {
      if (col === 'All Collections') return true;
      const requiredTag = COLLECTION_TAG_MAP[col];
      return requiredTag ? presentTags.has(requiredTag) : true;
    });
  }, []);

  const roleOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of templates) {
      if (activeCategory !== 'All' && activeCategory !== '⭐ Starred' && t.category !== activeCategory) {
        continue;
      }
      const r = t.role || (t as any).roleSlug || '';
      if (r) {
        counts.set(r, (counts.get(r) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeCategory]);

  const filtered = useMemo<Template[]>(() => {
    const q = query.toLowerCase().trim();
    const list = templates.filter((t) => {
      if (activeCategory === '⭐ Starred') {
        if (!favorites.includes(t.name)) return false;
      } else if (activeCategory !== 'All' && t.category !== activeCategory) {
        return false;
      }

      if (activeRole !== 'All Roles' && (t.role || '') !== activeRole) {
        return false;
      }

      const tags = t.tags || [];
      if (activeStyle !== 'all' && !tags.includes(activeStyle)) {
        return false;
      }

      const matchesCollection =
        activeCollection === 'All Collections' ||
        (activeCollection === 'Core Library' && tags.includes('core')) ||
        (activeCollection === 'Festival & Puja' && tags.includes('festival')) ||
        (activeCollection === 'Interactive 3D' && tags.includes('collection')) ||
        (activeCollection === 'Genre Lab' && tags.includes('genre-lab'));
      const matchesStack = activeStack === 'All Stacks' || t.stack === activeStack;
      const matchesStructure =
        activeStructure === 'All Structures' ||
        (activeStructure === 'Single-page' && tags.includes('single-page')) ||
        (activeStructure === 'Multi-page' && tags.includes('multi-page'));

      const aliases = ((t as any).aliases || []) as string[];
      const libs = ((t as any).libraries || []) as string[];
      const matchesQuery =
        !q ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.role || (t as any).profession || '').toLowerCase().includes(q) ||
        ((t as any).roleSlug || '').toLowerCase().includes(q) ||
        ((t as any).subCategory || '').toLowerCase().includes(q) ||
        ((t as any).subCategoryLabel || '').toLowerCase().includes(q) ||
        ((t as any).headline || '').toLowerCase().includes(q) ||
        (t.theme || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        libs.some((l) => l.toLowerCase().includes(q)) ||
        aliases.some((a) => a.toLowerCase().includes(q)) ||
        tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCollection && matchesStack && matchesStructure && matchesQuery;
    });

    const catOrder = ['festival', 'technical', 'engineering', 'research', 'educator', 'medical', 'wellness-sports', 'agriculture', 'transport-aviation', 'construction-trades', 'creative', 'business', 'law-public', 'music', 'retail', 'services', 'startup', 'gaming'];
    const sorted = [...list];
    if (sortBy === 'Name A–Z') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'Name Z–A') sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (sortBy === 'Category') sorted.sort((a, b) => (catOrder.indexOf(a.category) + 1 || 99) - (catOrder.indexOf(b.category) + 1 || 99) || (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'Stack') sorted.sort((a, b) => (a.stack || '').localeCompare(b.stack || '') || (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'Role A–Z') sorted.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
    return sorted;
  }, [query, activeCategory, activeRole, activeStyle, activeStack, activeStructure, activeCollection, sortBy, favorites]);

  const resetAllFilters = useCallback(() => {
    setQuery('');
    setActiveCategory('All');
    setActiveRole('All Roles');
    setActiveStyle('all');
    setActiveStack('All Stacks');
    setActiveStructure('All Structures');
    setActiveCollection('All Collections');
    setSortBy('Featured');
  }, []);

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
            <motion.a
              href="https://github.com/SudiptaSanki/PortfolioBuilder"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </motion.a>
            <motion.a
              href="https://github.com/SudiptaSanki/PortfolioBuilder/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'var(--accent)', color: '#fff', padding: '7px 14px',
                borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Contribute
            </motion.a>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                <img src={user.photoURL || ''} alt="User" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <button
                  onClick={logout}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', marginLeft: 8, fontFamily: 'inherit'
                }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Search Section */}
      <section style={{ padding: '40px 24px 20px', textAlign: 'center', maxWidth: 860, margin: '0 auto', position: 'relative' }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
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
            placeholder="Search by profession, tag, tech (e.g. 3d-webgl, photo-editorial, pilot, doctor)..."
            style={{
              width: '100%', padding: '13px 16px 13px 44px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </motion.div>

        {/* Popular Searches */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, alignSelf: 'center' }}>Try searching:</span>
          {['Developer', '3D WebGL', 'Photo Editorial', 'Medical', 'Pilot', 'Researcher', 'Festival', 'Architect'].map((term) => (
            <motion.button
              key={term}
              onClick={() => setQuery(term === '3D WebGL' ? '3d-webgl' : term === 'Photo Editorial' ? 'photo-editorial' : term)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {term}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Filters */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {visibleCategories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
                background: activeCategory === cat ? 'rgba(108,122,247,0.12)' : 'transparent',
                color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'background-color 0.15s, border-color 0.15s', fontFamily: 'inherit',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {STYLE_FILTERS.map((sf) => (
              <button
                key={sf.tag}
                onClick={() => setActiveStyle(sf.tag)}
                style={{
                  padding: '5px 12px', borderRadius: 100, fontSize: 12, border: '1px solid',
                  borderColor: activeStyle === sf.tag ? 'var(--accent)' : 'var(--border)',
                  background: activeStyle === sf.tag ? 'rgba(108,122,247,0.15)' : 'rgba(255,255,255,0.02)',
                  color: activeStyle === sf.tag ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 13, maxWidth: 220,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              <option value="All Roles">All Roles ({roleOptions.length})</option>
              {roleOptions.map(([r, count]) => (
                <option key={r} value={r}>{r} ({count})</option>
              ))}
            </select>
            <select
              value={activeCollection}
              onChange={(e) => setActiveCollection(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {visibleCollections.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={activeStack}
              onChange={(e) => setActiveStack(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {STACK_FILTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={activeStructure}
              onChange={(e) => setActiveStructure(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {STRUCTURE_FILTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--accent)', background: 'var(--surface)',
                color: 'var(--accent)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              }}
            >
              {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          Showing {filtered.length} of {templates.length} templates &bull; Visible screens stream live one-by-one as you scroll &bull; Click any card to open
        </span>
        {(query || activeCategory !== 'All' || activeRole !== 'All Roles' || activeStyle !== 'all' || activeCollection !== 'All Collections' || activeStack !== 'All Stacks' || activeStructure !== 'All Structures') && (
          <button
            onClick={resetAllFilters}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 80px' }}>
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16 }}>No templates match your search.</p>
            <button
              onClick={resetAllFilters}
              style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}>
              {filtered.slice(0, displayCount).map((t, i) => (
                <TemplateCard
                  key={t.path || t.id || t.name}
                  template={t}
                  index={i}
                  onOpenUrl={openExternalUrl}
                  onTagClick={(tag) => setQuery(tag)}
                  isFavorite={favorites.includes(t.name)}
                  toggleFavorite={() => toggleFavorite(t.name, t.path || '')}
                />
              ))}
            </div>

            {displayCount < filtered.length && (
              <div
                style={{ textAlign: 'center', padding: '40px 0' }}
                ref={(node) => {
                  if (!node) return;
                  const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                      setDisplayCount(prev => Math.min(prev + 24, filtered.length));
                      observer.disconnect();
                    }
                  }, { threshold: 0.1 });
                  observer.observe(node);
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Loading more templates...</span>
              </div>
            )}
          </>
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
          {' '}and explore {templates.length} deployed portfolio templates.
        </p>
      </footer>
    </div>
  );
}

function TemplateCard({
  template,
  index = 0,
  onOpenUrl,
  onTagClick,
  isFavorite,
  toggleFavorite,
}: {
  template: Template;
  index?: number;
  onOpenUrl: (url: string) => void;
  onTagClick: (tag: string) => void;
  isFavorite: boolean;
  toggleFavorite: (e: any) => void;
}) {
  const cardId = template.id || template.path || template.name;
  const tags = template.tags || [];
  const is3d = tags.includes('3d-webgl');

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [frameScale, setFrameScale] = useState(0.28);
  const [, setTick] = useState(0);

  const { previewUrl, displayUrlPath, githubUrl, isAvailable, status, statusMessage } = resolveTemplateUrl(template);
  const targetLink = isAvailable ? previewUrl : githubUrl;

  // Subscribe to sequential 1-by-1 preview queue
  useEffect(() => {
    return previewQueue.subscribe(cardId, () => setTick((t) => t + 1));
  }, [cardId]);

  // Observe card viewport intersection to load visible small screens lazily one by one
  useEffect(() => {
    if (!isAvailable) return;
    const el = previewRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        const isIn = entries[0]?.isIntersecting ?? false;
        previewQueue.setVisible(cardId, isIn, is3d);
      },
      { rootMargin: '160px 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      previewQueue.setVisible(cardId, false, is3d);
    };
  }, [cardId, is3d, isAvailable]);

  // Responsive 1280x720 desktop-to-card scaling
  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateScale = () => {
      const w = el.clientWidth || 340;
      setFrameScale(w / 1280);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const qState = previewQueue.getState(cardId);

  const palette = (template as any).palette || {
    bg: '#131318',
    fg: '#f4f4f5',
    accent: CATEGORY_COLORS[template.category] || '#6c7af7',
  };
  const isLight = getLuminance(palette.bg) > 0.45;
  const mutedFg = isLight ? 'rgba(24,24,27,0.68)' : 'rgba(244,244,245,0.68)';
  const subtleSurface = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)';
  const subtleBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const headline = (template as any).headline || template.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: (index % 24) * 0.015 }}
      onMouseEnter={() => {
        setHovered(true);
        if (isAvailable) previewQueue.prioritize(cardId, is3d);
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenUrl(targetLink)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenUrl(targetLink);
        }
      }}
      style={{
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: hovered ? 'rgba(108,122,247,0.65)' : 'var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 14px 40px rgba(0,0,0,0.45)' : 'none',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Top Miniature Browser Chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 11px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', opacity: 0.8, flexShrink: 0 }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', opacity: 0.8, flexShrink: 0 }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', opacity: 0.8, flexShrink: 0 }} />
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayUrlPath}
          </span>
        </div>
        <span
          style={{
            background: CATEGORY_COLORS[template.category] || '#888',
            color: '#000',
            padding: '2px 8px',
            borderRadius: 100,
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {template.stack}
        </span>
      </div>

      {/* Live 16:9 Small Screen Viewport */}
      <div
        ref={previewRef}
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: palette.bg,
          color: palette.fg,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Clean Loading / Queued Fallback Underneath Until Sequential Iframe Loads */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: `radial-gradient(circle at 82% 18%, ${palette.accent}24, transparent 58%), ${palette.bg}`,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: palette.accent,
                display: 'block',
                marginBottom: 5,
              }}
            >
              {template.role || template.category}
            </span>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.25,
                color: palette.fg,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '92%',
              }}
            >
              {headline}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, opacity: 0.7 }}>
            <div style={{ flex: 2, height: 42, borderRadius: 6, background: subtleSurface, border: `1px solid ${subtleBorder}` }} />
            <div style={{ flex: 1, height: 42, borderRadius: 6, background: subtleSurface, border: `1px solid ${subtleBorder}` }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: mutedFg }}>
              {qState.loading ? 'Streaming live preview…' : qState.queued ? 'Queued to load preview…' : isAvailable ? 'Scroll into view to stream' : 'Offline preview'}
            </span>
            <span style={{ fontSize: 10, color: palette.accent, fontWeight: 600 }}>1280×720</span>
          </div>
        </div>

        {/* Sequential Live Rendered Website inside Small Screen */}
        {qState.mounted && isAvailable && (
          <iframe
            src={previewUrl}
            title={template.name}
            onLoad={() => previewQueue.markLoaded(cardId)}
            sandbox="allow-scripts allow-same-origin"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1280,
              height: 720,
              border: 'none',
              pointerEvents: 'none',
              transform: `scale(${frameScale})`,
              transformOrigin: 'top left',
              background: '#fff',
              opacity: qState.loaded ? 1 : 0,
              transition: 'opacity 0.35s ease',
              zIndex: 3,
            }}
          />
        )}

        {/* Hover Pill */}
        {hovered && isAvailable && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              zIndex: 8,
              background: 'rgba(10,10,14,0.88)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 600,
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.2)',
              pointerEvents: 'none',
            }}
          >
            Click to Open Live Site ↗
          </div>
        )}

        {status !== 'active' && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: status === 'broken' ? '#ef4444' : '#f59e0b',
            color: '#fff', padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            zIndex: 10, textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {status}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>{template.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {template.role || (template as any).profession} &bull; {template.theme || 'Editorial Theme'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(e);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? '#facc15' : 'none'} stroke={isFavorite ? '#facc15' : 'var(--text-secondary)'} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 16,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {template.description || 'A professionally designed portfolio template ready for deployment.'}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {(() => {
            const priority = tags.filter((t) =>
              /^(single-page|multi-page|core|festival|collection|genre-lab|3d-webgl|photo-editorial|canvas-interactive|web-audio|gsap-motion|garland-|float-|edition-)/.test(t));
            const rest = tags.filter((t) => !priority.includes(t) && !['html', 'css', 'js'].includes(t));
            return [...priority, ...rest].slice(0, 6).map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                title={'Filter by ' + tag}
                style={{
                  padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 6,
                  fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                  border: '1px solid transparent', transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {tag}
              </span>
            ));
          })()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href={githubUrl}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            View Code
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href={targetLink}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
              background: isAvailable ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: isAvailable ? '#fff' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e: any) => { if (isAvailable) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e: any) => { if (isAvailable) e.currentTarget.style.background = 'var(--accent)'; }}
            title={statusMessage || 'Open Live Deployed Site'}
          >
            {isAvailable ? 'Live Preview' : 'Code Only'}
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
