import type { ReaderFixture } from "./reader-fixtures";

export type ReaderEntry = Omit<ReaderFixture, "alternateSlug"> & Readonly<{
  alternateSlug: string | null;
}>;
