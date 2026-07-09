import { BadgeCheck, Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, label: "Fast tracked delivery" },
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: PackageCheck, label: "Easy returns" },
  { icon: BadgeCheck, label: "Verified quality" },
  { icon: Headphones, label: "Driver support" },
];

export function TrustBandSection() {
  return (
    <section className="trust-band" aria-label="Store benefits">
      {benefits.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label}>
            <Icon size={21} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </section>
  );
}
