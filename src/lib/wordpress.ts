/**
 * Utilidades para consultar la REST API de WordPress y sus campos ACF.
 */

const wpApiBase = (
  import.meta.env.WP_API_URL ?? import.meta.env.PUBLIC_WP_API_URL ?? ""
).trim();
const maxPerPage = 100;
const maxPostPages = 100;

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string; alt_text: string }[];
    "wp:term"?: { id: number; name: string; slug: string }[][];
  };
  acf?: Record<string, unknown>;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface ProjectFields {
  project_url?: string;
  github_url?: string;
  description?: string;
  technologies?: string;
  featured_image?: string;
  year?: string;
  category?: string;
}

export interface Project {
  id: number;
  title: { rendered: string };
  acf?: ProjectFields;
}

export interface SkillFields {
  level?: number;
  category?: string;
  icon?: string;
}

export interface Skill {
  id: number;
  title: { rendered: string };
  acf?: SkillFields;
}

export interface ExperienceFields {
  company?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  technologies?: string;
  company_url?: string;
}

export interface Experience {
  id: number;
  title: { rendered: string };
  acf?: ExperienceFields;
}

function getApiBase(): string {
  if (!wpApiBase) {
    throw new Error("WP_API_URL no configurada");
  }

  return wpApiBase.replace(/\/+$/, "");
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function createWpUrl(endpoint: string, params?: Record<string, string>): URL {
  const url = new URL(`${getApiBase()}${endpoint}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

async function wpRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<{ data: T; response: Response }> {
  const response = await fetch(createWpUrl(endpoint, params), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`WP API Error ${response.status}: ${endpoint}`);
  }

  return { data: (await response.json()) as T, response };
}

async function wpFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const { data } = await wpRequest<T>(endpoint, params);
  return data;
}

/** Obtiene publicaciones con imágenes y categorías embebidas. */
export async function getPosts(perPage = 10, page = 1): Promise<WPPost[]> {
  return wpFetch<WPPost[]>("/wp/v2/posts", {
    per_page: String(clampInteger(perPage, 1, maxPerPage)),
    page: String(clampInteger(page, 1, maxPostPages)),
    _embed: "1",
  });
}

/** Obtiene todas las publicaciones disponibles para páginas estáticas. */
export async function getAllPosts(): Promise<WPPost[]> {
  const posts: WPPost[] = [];

  for (let page = 1; page <= maxPostPages; page += 1) {
    const { data, response } = await wpRequest<WPPost[]>("/wp/v2/posts", {
      per_page: String(maxPerPage),
      page: String(page),
      _embed: "1",
    });

    posts.push(...data);

    const totalPages = Number(response.headers.get("X-WP-TotalPages"));
    const isLastPage =
      data.length < maxPerPage ||
      (Number.isFinite(totalPages) && totalPages > 0 && page >= totalPages);

    if (isLastPage) break;
  }

  return posts;
}

/** Obtiene una publicación por su slug. */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>("/wp/v2/posts", {
    slug,
    _embed: "1",
  });

  return posts[0] ?? null;
}

/** Obtiene los últimos N artículos para la portada. */
export async function getLatestPosts(count = 3): Promise<WPPost[]> {
  return getPosts(count, 1);
}

/** Obtiene las categorías que contienen publicaciones. */
export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>("/wp/v2/categories", { hide_empty: "true" });
}

/** Obtiene los proyectos del CPT portfolio. */
export async function getProjects(): Promise<Project[]> {
  return wpFetch<Project[]>("/wp/v2/portfolio", {
    per_page: String(maxPerPage),
    _fields: "id,title,acf",
    acf_format: "standard",
  });
}

/** Obtiene las habilidades del CPT skill. */
export async function getSkills(): Promise<Skill[]> {
  return wpFetch<Skill[]>("/wp/v2/skill", {
    per_page: String(maxPerPage),
    _fields: "id,title,acf",
  });
}

/** Agrupa habilidades por categoría de ACF. */
export function groupSkillsByCategory(skills: Skill[]): Record<string, Skill[]> {
  return skills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.acf?.category?.trim() || "Otros";
    (groups[category] ??= []).push(skill);
    return groups;
  }, {});
}

/** Obtiene la experiencia laboral de más reciente a más antigua. */
export async function getExperiences(): Promise<Experience[]> {
  return wpFetch<Experience[]>("/wp/v2/experience", {
    per_page: String(maxPerPage),
    _fields: "id,title,acf",
    orderby: "date",
    order: "desc",
  });
}

/** Formatea una fecha YYYY-MM en español. */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  if (dateString.toLowerCase() === "presente") return "Presente";

  const [year, month] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1);

  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
      });
}

/** Extrae la URL de la imagen destacada de una publicación embebida. */
export function getFeaturedImage(post: WPPost): string {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
}

/** Elimina las etiquetas HTML del contenido corto de WordPress. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Convierte una lista de tecnologías separada por comas en elementos individuales. */
export function parseTechs(technologyString: string): string[] {
  return technologyString
    .split(",")
    .map((technology) => technology.trim())
    .filter(Boolean);
}