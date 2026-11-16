import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "2027 Treasurer & Stripe Portal",
  "Restricted financial control, refunds, promo waivers, and Stripe monitoring console for authorized HEMS Treasurers, Board Members, and Administrators."
);

export default function TreasurerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
