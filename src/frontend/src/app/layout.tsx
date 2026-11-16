import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TelemetryTracker from "@/components/telemetry/TelemetryTracker";
import GoogleAnalyticsTag from "@/components/telemetry/GoogleAnalyticsTag";
import PreviewChannelBanner from "@/components/telemetry/PreviewChannelBanner";
import { AuthProvider } from "@/context/AuthContext";
import {
  SITE_URL,
  SITE_NAME,
  SITE_LEGAL_NAME,
  buildGlobalKnowledgeGraphJsonLd,
} from "@/utils/seo";

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
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/noto-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/source-serif-4-normal-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col theme-global">
        <GoogleAnalyticsTag />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
        <AuthProvider>
          <TelemetryTracker />
          <PreviewChannelBanner />
          <Navbar />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
