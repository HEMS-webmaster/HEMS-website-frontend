import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/utils/firebase";

/**
 * Loads Google Analytics 4 (`gtag.js`) for the HEMS Society web property (`G-F06RZ8L5CR`).
 * - Renders official Google tag scripts so Google Analytics stream verification passes immediately upon DNS cutover.
 * - Automatically disables GA4 hit transmission on `localhost` / `127.0.0.1` and internal `/admin`, `/board`, `/operations`, `/treasurer`, `/reviewer` portals so officer maintenance never skews public symposium metrics.
 */
export default function GoogleAnalyticsTag() {
  if (!GA_MEASUREMENT_ID) return null;

  const initSnippet = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    (function() {
      var host = window.location.hostname || '';
      var path = window.location.pathname || '';
      var search = window.location.search || '';
      var isLocal = host === 'localhost' || host === '127.0.0.1';
      var isPreviewChannel = /^[a-z0-9-]+--[a-z0-9-]+\\.(web\\.app|firebaseapp\\.com)$/i.test(host);
      var isInternalPortal = /^\\/(admin|board|operations|treasurer|reviewer)(\\/|$)/.test(path);
      var isWorkshopPreview = false;
      try {
        var params = new URLSearchParams(search);
        var pv = params.get('preview');
        if (pv !== null) {
          var pvLow = pv.trim().toLowerCase();
          isWorkshopPreview = pvLow !== '' && pvLow !== 'off' && pvLow !== 'clear' && pvLow !== 'false' && pvLow !== '0';
        } else if (window.sessionStorage && window.sessionStorage.getItem('hems_workshop_preview_token_v1')) {
          isWorkshopPreview = true;
        }
      } catch (e) {}
      if (isLocal || isPreviewChannel || isInternalPortal || isWorkshopPreview) {
        window['ga-disable-${GA_MEASUREMENT_ID}'] = true;
      }
      var params = new URLSearchParams(window.location.search);
      var hemsSrc = params.get('src');
      if (hemsSrc && !params.get('utm_campaign')) {
        gtag('set', 'campaign', {
          name: hemsSrc,
          source: 'hems_campaign',
          medium: 'email'
        });
      }
    })();
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      anonymize_ip: true
    });
  `;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="hems-ga4-init" strategy="afterInteractive">
        {initSnippet}
      </Script>
    </>
  );
}

