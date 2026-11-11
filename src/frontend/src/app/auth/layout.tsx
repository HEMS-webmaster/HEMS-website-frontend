import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Member Sign In",
  "Sign in or register for a Harsh-Environment Mass Spectrometry (HEMS) Society account to access proceedings downloads and portal resources."
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

