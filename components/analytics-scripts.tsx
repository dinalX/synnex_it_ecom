import Script from "next/script";
import { getSiteConfig } from "@/lib/site-settings";

/*
 * Settings values are interpolated into inline scripts, so each ID is
 * format-validated first — otherwise anyone with settings.update could
 * store JS in an ID field and run it on every storefront page.
 */
const GTAG_ID_PATTERN = /^[A-Z]{1,4}-[A-Z0-9-]{4,20}$/i; // G-, AW-, UA-, DC-
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/i;
const PIXEL_ID_PATTERN = /^\d{5,20}$/;

function safeId(value: string, pattern: RegExp): string | null {
  const trimmed = value.trim();
  return pattern.test(trimmed) ? trimmed : null;
}

export async function AnalyticsScripts() {
  const config = await getSiteConfig();
  const googleTagId = safeId(config.googleTagId, GTAG_ID_PATTERN);
  const gtmContainerId = safeId(config.gtmContainerId, GTM_ID_PATTERN);
  const facebookPixelId = safeId(config.facebookPixelId, PIXEL_ID_PATTERN);

  return (
    <>
      {gtmContainerId ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmContainerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {googleTagId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleTagId}');
            `}
          </Script>
        </>
      ) : null}

      {facebookPixelId ? (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
