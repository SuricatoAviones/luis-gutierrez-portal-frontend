const DEFAULT_DESCRIPTION_MAX_LENGTH = 155;

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

export function normalizeMetaText(value?: string | null): string {
  if (!value) return "";

  return stripHtmlTags(value).replace(/\s+/g, " ").trim();
}

export function buildMetaDescription(
  value: string | undefined | null,
  fallback: string,
  maxLength = DEFAULT_DESCRIPTION_MAX_LENGTH,
): string {
  const description = normalizeMetaText(value) || normalizeMetaText(fallback);

  if (description.length <= maxLength) {
    return description;
  }

  const sliced = description.slice(0, maxLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutoff = lastSpace > 120 ? lastSpace : maxLength;

  return `${sliced.slice(0, cutoff).trimEnd().replace(/[.,;:!?-]+$/, "")}.`;
}