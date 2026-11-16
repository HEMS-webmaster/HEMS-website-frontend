import { Suspense } from "react";
import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/utils/seo";
import RegistrationReceiptSheet from "@/components/workshop/RegistrationReceiptSheet";

export const metadata: Metadata = buildNoIndexMetadata(
  "Official Workshop Registration Receipt",
  "Itemized IRS 501(c)(3) registration receipt and institutional invoice for the HEMS Workshop."
);

export default function RegistrationReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-16 text-center text-sm text-slate-600">
          Loading official registration receipt...
        </div>
      }
    >
      <RegistrationReceiptSheet />
    </Suspense>
  );
}
