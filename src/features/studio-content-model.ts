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

export type StudioSubjectOption = Readonly<{
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

export type StudioDraftCreateInput = Readonly<{
  contentTypeId: string;
  locale: StudioContentLocale;
  title: string;
  slug: string;
  summary: string;
  bodyJson: Readonly<{
    schemaVersion: 1;
    blocks: readonly Readonly<{
      id: string;
      type: "paragraph";
      text: string;
    }>[];
  }>;
  subjectIds: readonly string[];
}>;

export type StudioDraftCreateState = Readonly<{
  status: "idle" | "error";
  message: string;
  fieldErrors: Readonly<Record<string, string>>;
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

export function normalizeStudioDraftSlug(value: string, fallbackTitle: string): string {
  const source = value.trim().length > 0 ? value : fallbackTitle;
  return source
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180)
    .replace(/-$/g, "");
}

export function buildStudioDraftDocument(bodyText: string): StudioDraftCreateInput["bodyJson"] {
  const blocks = bodyText
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((text, index) => ({
      id: `paragraph-${index + 1}`,
      type: "paragraph" as const,
      text,
    }));

  return {
    schemaVersion: 1,
    blocks,
  };
}

export function isStudioUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
