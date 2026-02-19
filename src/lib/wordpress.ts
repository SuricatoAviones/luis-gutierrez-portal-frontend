/**
 * lib/wordpress.ts
 * Utilidades para consumir la WordPress REST API y ACF
 *
 * BASE URL: variable de entorno WP_API_URL
 * Ej: https://mi-wordpress.com/wp-json
 */

const BASE = import.meta.env.WP_API_URL ?? 'https://tu-sitio.com/wp-json';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: { source_url: string; alt_text: string }[];
    'wp:term'?: { id: number; name: string; slug: string }[][];
  };
  acf?: Record<string, unknown>;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// ACF Custom Post Types
export interface Project {
  id: number;
  title: { rendered: string };
  acf: {
    project_url: string;
    github_url: string;
    description: string;
    technologies: string; // texto separado por comas
    featured_image: string;
    year: string;
    category: string;
  };
}

export interface Skill {
  id: number;
  title: { rendered: string };
  acf: {
    level: number;        // 0-100
    category: string;     // Frontend / Backend / DevOps / Tools
    icon: string;         // nombre del ícono o URL SVG
  };
}

export interface Experience {
  id: number;
  title: { rendered: string };
  acf: {
    company: string;
    position: string;
    start_date: string;  // YYYY-MM
    end_date: string;    // YYYY-MM | "presente"
    description: string;
    technologies: string;
    company_url: string;
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function wpFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error(`WP API Error ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// BLOG — /wp/v2/posts
// ─────────────────────────────────────────────

/**
 * Obtener posts del blog con imágenes y categorías embebidas.
 * @param perPage  Cantidad de posts (default 10)
 * @param page     Número de página para paginación (default 1)
 */
export async function getPosts(perPage = 10, page = 1): Promise<WPPost[]> {
  return wpFetch<WPPost[]>('/wp/v2/posts', {
    per_page: String(perPage),
    page: String(page),
    _embed: '1',
  });
}

/**
 * Obtener un post por su slug
 */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>('/wp/v2/posts', {
    slug,
    _embed: '1',
  });
  return posts[0] ?? null;
}

/**
 * Últimos N posts para preview en el home
 */
export async function getLatestPosts(count = 3): Promise<WPPost[]> {
  return getPosts(count, 1);
}

/**
 * Categorías del blog
 */
export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>('/wp/v2/categories', { hide_empty: 'true' });
}

// ─────────────────────────────────────────────
// PROYECTOS — CPT: portfolio  (ACF)
// ─────────────────────────────────────────────

/**
 * Obtener todos los proyectos del portafolio.
 * Requiere CPT "portfolio" registrado en WordPress con ACF.
 */
export async function getProjects(): Promise<Project[]> {
  return wpFetch<Project[]>('/wp/v2/portfolio', {
    per_page: '100',
    _fields: 'id,title,acf',
    acf_format: 'standard',
  });
}

// ─────────────────────────────────────────────
// HABILIDADES — CPT: skills  (ACF)
// ─────────────────────────────────────────────

/**
 * Obtener habilidades agrupadas por categoría.
 * Requiere CPT "skill" con campos ACF: level, category, icon.
 */
export async function getSkills(): Promise<Skill[]> {
  return wpFetch<Skill[]>('/wp/v2/skill', {
    per_page: '100',
    _fields: 'id,title,acf',
  });
}

/**
 * Agrupar skills por categoría
 */
export function groupSkillsByCategory(skills: Skill[]): Record<string, Skill[]> {
  return skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.acf.category ?? 'Otros';
    (acc[cat] ??= []).push(skill);
    return acc;
  }, {});
}

// ─────────────────────────────────────────────
// EXPERIENCIA — CPT: experience  (ACF)
// ─────────────────────────────────────────────

/**
 * Obtener experiencia laboral ordenada de más reciente a más antigua.
 * Requiere CPT "experience" con campos ACF: company, position, start_date, end_date, description.
 */
export async function getExperiences(): Promise<Experience[]> {
  const data = await wpFetch<Experience[]>('/wp/v2/experience', {
    per_page: '100',
    _fields: 'id,title,acf',
    orderby: 'date',
    order: 'desc',
  });
  return data;
}

// ─────────────────────────────────────────────
// HELPERS DE FORMATO
// ─────────────────────────────────────────────

/** Formatea fecha YYYY-MM a "Ene 2024" en español */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.toLowerCase() === 'presente') return 'Presente';
  const [year, month] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}

/** Extrae URL de imagen destacada de un WPPost embebido */
export function getFeaturedImage(post: WPPost): string {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
}

/** Limpia HTML de excerpt */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Lista de tecnologías desde string separado por comas */
export function parseTechs(techString: string): string[] {
  return techString?.split(',').map(t => t.trim()).filter(Boolean) ?? [];
}