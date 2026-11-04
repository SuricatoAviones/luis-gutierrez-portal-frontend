/**
 * Cliente de la REST API de WordPress (con campos ACF) para el navegador.
 *
 * El sitio se publica como HTML estático en cPanel, así que el contenido se
 * consulta en cada visita desde el cliente: lo que se publica o edita en
 * WordPress aparece sin volver a compilar ni desplegar.
 */
import { WP_API_URL } from "astro:env/client";

const apiBase = WP_API_URL.trim().replace(/\/+$/, "");
const maxPerPage = 100;
const requestTimeoutMs = 15_000;

// Los listados no necesitan el contenido completo de cada artículo.
const postSummaryFields = "id,slug,date,title,excerpt,_links,_embedded";

export interface WPImageSize {
  source_url: string;
  width: number;
  height: number;
}

export interface WPMedia {
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, WPImageSize>;
  };
}

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: WPMedia[];
  };
}

export interface PostsPage {
  posts: WPPost[];
  total: number;
  totalPages: number;
}

/** ACF devuelve `false` o `null` en campos vacíos (p. ej. una imagen sin asignar). */
export type AcfValue = string | number | false | null | undefined;

export interface ProjectFields {
  project_url?: AcfValue;
  github_url?: AcfValue;
  description?: AcfValue;
  technologies?: AcfValue;
  featured_image?: AcfValue;
  year?: AcfValue;
  category?: AcfValue;
}

export interface Project {
  id: number;
  date: string;
  title: { rendered: string };
  acf?: ProjectFields;
}

export interface SkillFields {
  level?: AcfValue;
  category?: AcfValue;
  icon?: AcfValue;
}

export interface Skill {
  id: number;
  title: { rendered: string };
  acf?: SkillFields;
}

export interface ExperienceFields {
  company?: AcfValue;
  position?: AcfValue;
  start_date?: AcfValue;
  end_date?: AcfValue;
  description?: AcfValue;
  technologies?: AcfValue;
  company_url?: AcfValue;
}

export interface Experience {
  id: number;
  title: { rendered: string };
  acf?: ExperienceFields;
}

export interface ImageSource {
  src: string;
  srcset: string;
  width?: number;
  height?: number;
}

/** Error HTTP de la API (p. ej. 400 cuando se pide una página inexistente). */
export class WPApiError extends Error {
  constructor(
    readonly status: number,
    endpoint: string,
  ) {
    super(`WP API Error ${status}: ${endpoint}`);
    this.name = "WPApiError";
  }
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(requestTimeoutMs)
    : undefined;
}

async function wpRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<{ data: T; response: Response }> {
  const url = new URL(`${apiBase}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: timeoutSignal(),
  });

  if (!response.ok) {
    throw new WPApiError(response.status, endpoint);
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

function readCountHeader(response: Response, name: string): number {
  const value = Number(response.headers.get(name));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Obtiene una página de artículos (sin contenido) y el total de páginas. */
export async function getPosts(perPage = 10, page = 1): Promise<PostsPage> {
  const { data, response } = await wpRequest<WPPost[]>("/wp/v2/posts", {
    per_page: String(clampInteger(perPage, 1, maxPerPage)),
    page: String(Math.max(1, Math.trunc(page) || 1)),
    _embed: "wp:featuredmedia",
    _fields: postSummaryFields,
  });

  return {
    posts: data,
    total: readCountHeader(response, "X-WP-Total"),
    totalPages: Math.max(1, readCountHeader(response, "X-WP-TotalPages")),
  };
}

/** Obtiene los últimos N artículos para la portada. */
export async function getLatestPosts(count = 3): Promise<WPPost[]> {
  const { posts } = await getPosts(count, 1);
  return posts;
}

/** Obtiene un artículo completo por su slug. */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>("/wp/v2/posts", {
    slug,
    _embed: "wp:featuredmedia",
  });

  const wanted = safeDecode(slug).toLowerCase();
  return (
    posts.find((post) => safeDecode(post.slug).toLowerCase() === wanted) ??
    posts[0] ??
    null
  );
}

/** Obtiene los proyectos del CPT portfolio. */
export async function getProjects(): Promise<Project[]> {
  return wpFetch<Project[]>("/wp/v2/portfolio", {
    per_page: String(maxPerPage),
    _fields: "id,date,title,acf",
    acf_format: "standard",
    orderby: "date",
    order: "desc",
  });
}

/** Obtiene las habilidades del CPT skill. */
export async function getSkills(): Promise<Skill[]> {
  return wpFetch<Skill[]>("/wp/v2/skill", {
    per_page: String(maxPerPage),
    _fields: "id,title,acf",
  });
}

/** Obtiene la experiencia laboral. */
export async function getExperiences(): Promise<Experience[]> {
  return wpFetch<Experience[]>("/wp/v2/experience", {
    per_page: String(maxPerPage),
    _fields: "id,title,acf",
    orderby: "date",
    order: "desc",
  });
}

/** Agrupa habilidades por su categoría de ACF, conservando el orden. */
export function groupSkillsByCategory(skills: Skill[]): [string, Skill[]][] {
  const groups = new Map<string, Skill[]>();

  skills.forEach((skill) => {
    const category = stripHtml(acfText(skill.acf?.category)) || "Otros";
    const group = groups.get(category);
    if (group) group.push(skill);
    else groups.set(category, [skill]);
  });

  return Array.from(groups);
}

/** Valor de texto de un campo ACF ("" si está vacío o no es texto/número). */
export function acfText(value: AcfValue): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Decodifica un segmento de URL sin lanzar errores con valores inválidos. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** URL pública de un artículo del blog. */
export function getPostUrl(post: Pick<WPPost, "slug">): string {
  return `/blog/${encodeURIComponent(safeDecode(post.slug))}`;
}

/** Convierte HTML de WordPress en texto plano (decodifica entidades). */
export function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Devuelve la URL solo si es http(s); descarta valores como "#" o "javascript:". */
export function toSafeUrl(value: AcfValue): string | null {
  const trimmed = acfText(value);
  if (!trimmed || trimmed === "#") return null;

  try {
    const url = new URL(trimmed, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Formatea la fecha de publicación de un artículo ("8 de octubre de 2026"). */
export function formatPostDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
}

/** Formatea una fecha YYYY-MM en español ("ene 2024"). */
export function formatYearMonth(dateString: string): string {
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

/**
 * Imagen destacada de un artículo, con `srcset` a partir de los tamaños que
 * genera WordPress (se omiten los recortes con otra proporción).
 */
export function getFeaturedImage(post: WPPost): ImageSource | null {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media?.source_url) return null;

  const width = media.media_details?.width;
  const height = media.media_details?.height;
  const ratio = width && height ? width / height : 0;

  const candidates = Object.values(media.media_details?.sizes ?? {})
    .filter((size) => size.source_url && size.width > 0 && size.height > 0)
    .filter(
      (size) => !ratio || Math.abs(size.width / size.height - ratio) < 0.02,
    )
    .sort((a, b) => a.width - b.width);

  const byWidth = new Map(candidates.map((size) => [size.width, size]));
  const srcset = Array.from(byWidth.values())
    .map((size) => `${size.source_url} ${size.width}w`)
    .join(", ");

  return { src: media.source_url, srcset, width, height };
}

/** Convierte una lista de tecnologías separada por comas en elementos. */
export function parseTechs(technologies: AcfValue): string[] {
  return acfText(technologies)
    .split(",")
    .map((technology) => technology.trim())
    .filter(Boolean);
}
