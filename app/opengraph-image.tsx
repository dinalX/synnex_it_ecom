import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — POS Hardware Sri Lanka`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #262626 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "#ffffff",
              color: "#111111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: "44px", fontWeight: 800 }}>{siteConfig.name}</div>
        </div>
        <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.1, maxWidth: "980px" }}>
          POS, Barcode & Biometric Security Hardware
        </div>
        <div style={{ fontSize: "30px", marginTop: "28px", color: "#b9c8e4" }}>
          Islandwide delivery · Installation · After-sales support — Sri Lanka
        </div>
      </div>
    ),
    size,
  );
}
