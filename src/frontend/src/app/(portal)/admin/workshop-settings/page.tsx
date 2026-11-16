import type { Metadata } from "next";
import WorkshopSettingsConsole from "@/components/admin/WorkshopSettingsConsole";

export const metadata: Metadata = {
  title: "Workshop Control Center | HEMS Admin",
  description:
    "Administrator control center for staging workshop updates, sharing Board preview links, publishing changes, and rolling back versions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminWorkshopSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 py-2">
      <WorkshopSettingsConsole />
    </div>
  );
}
