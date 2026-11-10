import type { Metadata } from "next";
import StudentAwardsClient from "@/components/workshop/StudentAwardsClient";

export const metadata: Metadata = {
  title: "Student Travel Awards | HEMS Workshop",
  description:
    "HEMS Workshop Student Travel Award guidelines, $1,500.00 proposed award details, M.S./M.A./Ph.D. eligibility, selection criteria, and application instructions.",
};

export default function StudentTravelAwardsPage() {
  return <StudentAwardsClient />;
}
