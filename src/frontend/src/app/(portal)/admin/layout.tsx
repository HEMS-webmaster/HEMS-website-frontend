import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Administration Console",
  "Restricted HEMS Society administrative management and analytics console."
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
