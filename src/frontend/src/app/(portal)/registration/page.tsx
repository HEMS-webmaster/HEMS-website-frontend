import type { Metadata } from "next";
import RegistrationClient from "@/components/workshop/RegistrationClient";

export const metadata: Metadata = {
  title: "Workshop Registration | HEMS Workshop",
  description:
    "Attendee pricing tiers, milestone dates, corporate packages, and cancellation policies for the Harsh-Environment Mass Spectrometry Workshop.",
};

export default function Registration() {
  return <RegistrationClient />;
}
