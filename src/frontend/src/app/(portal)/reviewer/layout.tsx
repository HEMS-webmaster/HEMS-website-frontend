import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Abstract Reviewer Portal",
  "Restricted peer-review and abstract evaluation console for HEMS Workshop reviewers."
);

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
