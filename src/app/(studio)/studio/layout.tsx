import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Studio",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type StudioLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function StudioLayout({ children }: StudioLayoutProps) {
  return children;
}
