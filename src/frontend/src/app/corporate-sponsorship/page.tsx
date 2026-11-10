import type { Metadata } from "next";
import CorporateSponsorshipClient from "@/components/workshop/CorporateSponsorshipClient";

export const metadata: Metadata = {
  title: "Corporate Sponsorship | HEMS Society & Biennial Workshop",
  description:
    "Partner with the Harsh-Environment Mass Spectrometry (HEMS) Workshop. Explore evergreen corporate sponsorship benefits, flexible invoicing options, student travel award support, and our sponsor registry.",
};

export default function CorporateSponsorshipPage() {
  return <CorporateSponsorshipClient />;
}
