import type { Metadata, Viewport } from "next";
import { Noto_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TelemetryTracker from "@/components/telemetry/TelemetryTracker";
import GoogleAnalyticsTag from "@/components/telemetry/GoogleAnalyticsTag";
import { AuthProvider } from "@/context/AuthContext";
import {
  SITE_URL,
  SITE_NAME,
  SITE_LEGAL_NAME,
  buildGlobalKnowledgeGraphJsonLd,
} from "@/utils/seo";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFBFD",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "HEMS Society | Harsh-Environment Mass Spectrometry",
  description:
    "Biennial symposium and 25+ year open-access proceedings archive advancing in-situ mass spectrometry across oceans, planetary bodies, and austere environments.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_LEGAL_NAME, url: SITE_URL }],
  creator: SITE_LEGAL_NAME,
  publisher: SITE_LEGAL_NAME,
  category: "science",
  openGraph: {
    title: "HEMS Society | Harsh-Environment Mass Spectrometry",
    description:
      "Biennial symposium and 25+ year open-access proceedings archive advancing in-situ mass spectrometry across oceans, planetary bodies, and austere environments.",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEMS Society | Harsh-Environment Mass Spectrometry",
    description:
      "Biennial symposium and 25+ year open-access proceedings archive advancing in-situ mass spectrometry across oceans, planetary bodies, and austere environments.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalJsonLd = buildGlobalKnowledgeGraphJsonLd();

  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${sourceSerif.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col theme-global">
        <GoogleAnalyticsTag />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
        <AuthProvider>
          <TelemetryTracker />
          <Navbar />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
