import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Executive Board Portal",
  "Restricted governance portal for authenticated HEMS Society Board Members."
);

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

