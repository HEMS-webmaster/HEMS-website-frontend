import type { Metadata } from "next";
import PortalOverviewClient from "@/components/workshop/PortalOverviewClient";

export const metadata: Metadata = {
  title: "HEMS Workshop Portal",
  description: "Central hub for HEMS Workshop attendees, contributing authors, and corporate sponsors.",
};

export default function LayoutPortal() {
  return <PortalOverviewClient />;
}
