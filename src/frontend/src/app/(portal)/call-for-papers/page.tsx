import type { Metadata } from "next";
import CallForPapersClient from "@/components/workshop/CallForPapersClient";

export const metadata: Metadata = {
  title: "Call for Papers | HEMS Workshop",
  description:
    "Abstract submission guidelines, milestone dates, and core research areas for the Harsh-Environment Mass Spectrometry (HEMS) Workshop.",
};

export default function CallForPapers() {
  return <CallForPapersClient />;
}
