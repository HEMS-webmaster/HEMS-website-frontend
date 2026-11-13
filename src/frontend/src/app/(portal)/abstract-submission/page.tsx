import type { Metadata } from "next";
import AbstractSubmissionClient from "@/components/workshop/AbstractSubmissionClient";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Abstract Submission",
  "Submit your single-page PDF abstract and metadata for the upcoming HEMS Workshop."
);

export default function AbstractSubmissionPage() {
  return <AbstractSubmissionClient />;
}
