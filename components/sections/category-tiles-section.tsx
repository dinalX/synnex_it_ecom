import Link from "next/link";
import {
  Barcode,
  Fingerprint,
  Monitor,
  PackageCheck,
  Printer,
  CreditCard,
  Smartphone,
  PrinterIcon,
  DollarSign,
  Eye,
  Clock,
  Camera,
  Lock,
  DoorClosed,
  Vault,
  Computer,
  Keyboard,
  Wifi,
  Battery,
  ScanLine,
  Tag,
  Ticket,
  MonitorSpeaker,
  TabletSmartphone,
  FileText,
  Bell,
} from "lucide-react";
import { fetchCategories } from "@/lib/data";
import type { ProductCategory } from "@prisma/client";

type CategoryWithChildren = ProductCategory & { children: ProductCategory[] };

type Tile = {
  name: string;
  slug: string;
  parentSlug: string;
  icon: React.ReactNode;
  description: string;
};

function buildTiles(categories: CategoryWithChildren[]): Tile[] {
  const iconMap: Record<string, React.ReactNode> = {
    "pos-machine": <CreditCard size={24} />,
    "handheld-pos": <Smartphone size={24} />,
    "pos-printers": <Printer size={24} />,
    "cash-drawer": <DollarSign size={24} />,
    "cash-counting-machine": <Eye size={24} />,
    "customer-display": <MonitorSpeaker size={24} />,
    "mobile-data-collector": <TabletSmartphone size={24} />,
    "pos-paper-roll": <FileText size={24} />,
    "restaurant-pagers": <Bell size={24} />,
    "barcode-scanners": <ScanLine size={24} />,
    "barcode-label-printers": <PrinterIcon size={24} />,
    "barcode-label-roll": <Tag size={24} />,
    "thermal-transfer-ribbon": <Ticket size={24} />,
    "smart-door-lock": <Lock size={24} />,
    "door-access-control": <DoorClosed size={24} />,
    "wireless-ip-camera": <Camera size={24} />,
    "time-attendance-fingerprint-solution": <Clock size={24} />,
    "safe-locker": <Vault size={24} />,
    "all-in-one-pc": <Computer size={24} />,
    monitor: <Monitor size={24} />,
    "keyboard-mouse": <Keyboard size={24} />,
    "a4-printer": <Printer size={24} />,
    "card-printer": <CreditCard size={24} />,
    "handheld-printer": <Printer size={24} />,
    "network-solutions": <Wifi size={24} />,
    "ups-power-supply": <Battery size={24} />,
  };

  const descMap: Record<string, string> = {
    "pos-machine": "Full-featured POS terminals for retail and hospitality billing",
    "handheld-pos": "Portable point-of-sale devices for on-the-go transactions",
    "pos-printers": "Thermal and impact printers designed for POS receipts",
    "cash-drawer": "Secure cash storage drawers that integrate with POS systems",
    "cash-counting-machine": "Automated machines for fast, accurate cash counting",
    "customer-display": "Secondary screens showing transaction details to customers",
    "mobile-data-collector": "Portable devices for inventory and data capture in the field",
    "pos-paper-roll": "Thermal receipt paper rolls compatible with POS printers",
    "restaurant-pagers": "Wireless paging systems for restaurant and hospitality service",
    "barcode-scanners": "Handheld and fixed scanners for retail and warehouse use",
    "barcode-label-printers": "Printers for producing barcode labels in-house",
    "barcode-label-roll": "Pre-cut label rolls for barcode and product labeling",
    "thermal-transfer-ribbon": "Ribbons for thermal transfer label printing",
    "smart-door-lock": "Electronic door locks with keyless entry and remote access",
    "door-access-control": "Systems to manage and restrict entry to secured areas",
    "wireless-ip-camera": "Network security cameras with remote monitoring capability",
    "time-attendance-fingerprint-solution": "Biometric attendance tracking using fingerprint recognition",
    "safe-locker": "Secure storage lockers for valuables and sensitive items",
    "all-in-one-pc": "Space-saving computers with integrated display and components",
    monitor: "Displays for desktop workstations and professional setups",
    "keyboard-mouse": "Input devices for desktop and office computing",
    "a4-printer": "Standard document printers for everyday office printing",
    "card-printer": "Printers for ID cards, access cards, and membership cards",
    "handheld-printer": "Portable printers for on-site labeling and receipts",
    "network-solutions": "Routers, switches, and networking equipment for business infrastructure",
    "ups-power-supply": "Uninterruptible power supplies to protect against outages",
  };

  const tiles: Tile[] = [];

  for (const cat of categories) {
    const subs = cat.children || [];
    for (const sub of subs) {
      tiles.push({
        name: sub.name,
        slug: sub.slug,
        parentSlug: cat.slug,
        icon: iconMap[sub.slug] || <PackageCheck size={24} />,
        description: descMap[sub.slug] || "",
      });
    }
  }

  return tiles;
}

export async function CategoryTilesSection() {
  const categories = await fetchCategories();
  const tiles = buildTiles(categories);

  return (
    <section className="category-tiles" aria-label="Shop by category">
      <div className="category-tiles-inner">
        <div className="category-tiles-header">
          <p className="eyebrow">Shop by Category</p>
          <h2>Browse our product categories</h2>
        </div>
        <div className="category-tiles-grid">
          {tiles.map((tile) => (
            <Link
              key={tile.slug}
              href={`/products?category=${tile.parentSlug}&subcategory=${tile.slug}`}
              className="category-tile"
            >
              <div className="category-tile-icon">{tile.icon}</div>
              <div className="category-tile-content">
                <h3>{tile.name}</h3>
                <p>{tile.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
