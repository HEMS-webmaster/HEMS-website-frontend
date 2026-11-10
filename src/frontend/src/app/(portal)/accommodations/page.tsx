import type { Metadata } from "next";
import AccommodationsClient from "@/components/workshop/AccommodationsClient";

export const metadata: Metadata = {
  title: "Venue & Accommodations | HEMS Workshop",
  description:
    "Official host venue, discounted group room block details, and reservation deadlines for the Harsh-Environment Mass Spectrometry Workshop.",
};

export default function Accommodations() {
  return <AccommodationsClient />;
}
