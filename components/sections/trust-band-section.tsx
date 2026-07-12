import { BadgeCheck, Banknote, Headphones, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, label: "Islandwide delivery", sub: "Colombo & outstation" },
  { icon: Banknote, label: "Bank transfer or COD", sub: "Pay your way" },
  { icon: ShieldCheck, label: "1-year warranty", sub: "On most hardware" },
  { icon: BadgeCheck, label: "Genuine brands", sub: "Zebra, Epson, Honeywell" },
  { icon: Headphones, label: "WhatsApp support", sub: "Setup & after-sales" },
];

export function TrustBandSection() {
  return (
    <section className="trust-band" aria-label="Store benefits">
      {benefits.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label}>
            <Icon size={22} />
            <div className="trust-band-text">
              <span>{item.label}</span>
              <small>{item.sub}</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}
