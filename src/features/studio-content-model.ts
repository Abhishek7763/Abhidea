export type StudioContentLocale = "en" | "hi";
export type StudioEditorialStatus = "draft" | "needs_review" | "ready";

export type StudioContentFilters = Readonly<{
  type: string;
  status: StudioEditorialStatus | "all";
  locale: StudioContentLocale | "all";
}>;

export type StudioContentTypeOption = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type StudioContentListItem = Readonly<{
  localizationId: string;
  contentId: string;
  title: string;
  slug: string;
  summary: string;
  locale: StudioContentLocale;
  status: StudioEditorialStatus;
  updatedAt: string;
  contentType: StudioContentTypeOption;
}>;

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function isStudioContentLocale(value: unknown): value is StudioContentLocale {
  return value === "en" || value === "hi";
}

export function isStudioEditorialStatus(value: unknown): value is StudioEditorialStatus {
  return value === "draft" || value === "needs_review" || value === "ready";
}

export function normalizeStudioContentFilters(
  searchParams: Record<string, SearchParamValue>,
): StudioContentFilters {
  const rawType = firstValue(searchParams.type);
  const rawStatus = firstValue(searchParams.status);
  const rawLocale = firstValue(searchParams.locale);

  const type =
    rawType && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawType) && rawType.length <= 80
      ? rawType
      : "all";

  return {
    type,
    status: isStudioEditorialStatus(rawStatus) ? rawStatus : "all",
    locale: isStudioContentLocale(rawLocale) ? rawLocale : "all",
  };
}

export function filterStudioContentItems(
  items: readonly StudioContentListItem[],
  filters: StudioContentFilters,
): StudioContentListItem[] {
  return items.filter((item) => {
    if (filters.type !== "all" && item.contentType.slug !== filters.type) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.locale !== "all" && item.locale !== filters.locale) return false;
    return true;
  });
}

export function hasActiveStudioContentFilters(filters: StudioContentFilters): boolean {
  return filters.type !== "all" || filters.status !== "all" || filters.locale !== "all";
}

export function studioEditorialStatusLabel(status: StudioEditorialStatus): string {
  if (status === "needs_review") return "Needs review";
  if (status === "ready") return "Ready";
  return "Draft";
}

export function studioLocaleLabel(locale: StudioContentLocale): string {
  return locale === "hi" ? "Hindi" : "English";
}
