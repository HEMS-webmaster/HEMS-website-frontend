import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Preferences & Unsubscribe | HEMS Society",
  description:
    "Confirm your HEMS Society mailing list subscription, update your institutional email address, or unsubscribe in one click.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

