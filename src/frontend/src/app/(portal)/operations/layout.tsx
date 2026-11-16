import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "2027 Operations Portal",
  "Workshop logistics and marketing console for authorized HEMS Operations Officers."
);

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
