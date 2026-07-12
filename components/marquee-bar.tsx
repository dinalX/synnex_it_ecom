const MARQUEE_MESSAGES = [
  "100% Genuine Products",
  "Islandwide Delivery — Colombo & Outstation",
  "1-Year Warranty on Most Hardware",
  "WhatsApp Support for Setup & After-Sales",
];

export function MarqueeBar() {
  return (
    <div className="marquee-bar" aria-label="Store highlights">
      <div className="marquee-track">
        {[...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES].map((message, index) => (
          <span key={index}>{message}</span>
        ))}
      </div>
    </div>
  );
}
