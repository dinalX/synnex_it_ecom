import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { loadFeedImageResolver } from "./feed-images";

const prisma = new PrismaClient();

async function main() {
  // ─── Seed Product Categories ───────────────────────────────────────────────

  const categories = [
    {
      slug: "pos-solution",
      name: "POS Solution",
      shortDescription:
        "Complete POS solutions including machines, printers, cash drawers, and combo offers for retail, hospitality, and service industries.",
      description:
        "Synnex IT Solutions offers complete POS solutions in Sri Lanka designed to simplify, automate, and modernize daily business operations. Our all-in-one POS systems help you manage sales, billing, inventory management, and reporting.",
      icon: "Monitor",
      accent: "#1f8a70",
      sortOrder: 1,
      featured: true,
      children: [
        { slug: "pos-machine", name: "POS Machine", sortOrder: 1 },
        { slug: "pos-printers", name: "POS Printers", sortOrder: 2 },
        { slug: "cash-drawer", name: "Cash Drawer", sortOrder: 3 },
        { slug: "cash-counting-machine", name: "Cash Counting Machine", sortOrder: 4 },
        { slug: "handheld-pos", name: "Handheld POS", sortOrder: 5 },
        { slug: "restaurant-pagers", name: "Restaurant Pagers", sortOrder: 6 },
        { slug: "mobile-printers", name: "Mobile Printers", sortOrder: 7 },
      ],
    },
    {
      slug: "barcode-solution",
      name: "Barcode Solution",
      shortDescription:
        "Barcode scanners, label printers, consumables, and accessories for retail, warehousing, logistics, and manufacturing.",
      description:
        "Synnex IT Solutions delivers complete barcode solutions to help your business manage inventory, track assets, and streamline operations.",
      icon: "Barcode",
      accent: "#f0a202",
      sortOrder: 2,
      featured: true,
      children: [
        { slug: "barcode-scanners", name: "Barcode Scanners", sortOrder: 1 },
        { slug: "barcode-printers", name: "Barcode Printers", sortOrder: 2 },
        { slug: "barcode-label-roll", name: "Barcode Label Roll", sortOrder: 3 },
      ],
    },
    {
      slug: "biometrics-security-solution",
      name: "Biometrics & Security Solution",
      shortDescription:
        "Fingerprint attendance systems, smart door locks, safe boxes, CCTV, and access control solutions.",
      description:
        "Comprehensive biometric and security solutions including fingerprint time attendance, smart door locks, safe boxes, and access control systems.",
      icon: "Fingerprint",
      accent: "#6b7f82",
      sortOrder: 3,
      featured: true,
      children: [
        { slug: "time-attendance-fingerprint", name: "Time Attendance Fingerprint", sortOrder: 1 },
        { slug: "smart-door-lock", name: "Smart Door Lock", sortOrder: 2 },
        { slug: "safe-locker", name: "Safe Locker", sortOrder: 3 },
        { slug: "access-control", name: "Access Control", sortOrder: 4 },
      ],
    },
    {
      slug: "networking-solution",
      name: "Networking Solution",
      shortDescription:
        "Routers, switches, cables, connectors, wireless access points, and network accessories.",
      description:
        "Complete networking infrastructure solutions for businesses of all sizes.",
      icon: "Wifi",
      accent: "#2d6cdf",
      sortOrder: 4,
      featured: false,
      children: [
        { slug: "routers-switches", name: "Routers & Switches", sortOrder: 1 },
        { slug: "cables-connectors", name: "Cables & Connectors", sortOrder: 2 },
        { slug: "wireless-access-points", name: "Wireless Access Points", sortOrder: 3 },
      ],
    },
    {
      slug: "computer-accessories",
      name: "Computer Accessories",
      shortDescription:
        "Keyboards, mice, monitors, UPS, storage devices, and other PC peripherals.",
      description:
        "Quality computer accessories and peripherals for office and home use.",
      icon: "Keyboard",
      accent: "#d45113",
      sortOrder: 5,
      featured: false,
      children: [
        { slug: "keyboards-mice", name: "Keyboards & Mice", sortOrder: 1 },
        { slug: "monitors", name: "Monitors", sortOrder: 2 },
        { slug: "ups-power", name: "UPS & Power", sortOrder: 3 },
        { slug: "storage-devices", name: "Storage Devices", sortOrder: 4 },
      ],
    },
  ];

  for (const cat of categories) {
    const { children, ...parentData } = cat;
    const parent = await prisma.productCategory.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: parentData,
    });
    for (const child of children) {
      await prisma.productCategory.upsert({
        where: { slug: child.slug },
        update: { ...child, parentId: parent.id },
        create: { ...child, parentId: parent.id },
      });
    }
  }

  // ─── Seed Products ─────────────────────────────────────────────────────────

  const products: Array<{
    slug: string;
    name: string;
    category: string;
    subcategory: string;
    price: number;
    compareAt?: number;
    rating: number;
    inventory: number;
    sku: string;
    image: string;
    accent: string;
    description: string;
    shortDescription: string;
    specs: string;
    published: boolean;
  }> = [
    // ── POS Solution ──
    {
      slug: "ecr-lf100-electronic-cash-register",
      name: "ECR LF100 Electronic Cash Register",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 75000,
      rating: 4.7,
      inventory: 25,
      sku: "ECR-LF100",
      image: "/products/cash-register.svg",
      accent: "#1f8a70",
      description:
        "Reliable electronic cash register for small to medium retail shops. Features easy-to-use keyboard, receipt printing, and daily sales reporting.",
      shortDescription: "Reliable electronic cash register for small to medium retail shops.",
      specs: "8 departments,2-line LCD,Receipt printer built-in,Daily sales report",
      published: true,
    },
    {
      slug: "t3-mini-cash-register-machine",
      name: "T3 MINI Cash Register Machine",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 79000,
      rating: 4.7,
      inventory: 22,
      sku: "T3-MINI",
      image: "/products/cash-register.svg",
      accent: "#2d6cdf",
      description:
        "Compact billing hardware for small shops that need quick invoices and dependable daily sales handling.",
      shortDescription: "Compact billing hardware for small shops that need quick invoices and dependable daily sales handling.",
      specs: "Compact footprint,Thermal printing,Retail ready",
      published: true,
    },
    {
      slug: "android-touch-cash-register-battery",
      name: "Android Touch Cash Register with Battery Backup",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 125000,
      rating: 4.6,
      inventory: 15,
      sku: "ANDROID-TOUCH-CR",
      image: "/products/pos-combo.svg",
      accent: "#1f8a70",
      description:
        "Modern Android-powered touch cash register with built-in battery backup for uninterrupted billing during power outages.",
      shortDescription: "Modern Android-powered touch cash register with built-in battery backup for uninterrupted billing during power outages.",
      specs: "Android OS,Touch screen,Battery backup,Wi-Fi enabled",
      published: true,
    },
    {
      slug: "bn-tp081d-beldon-i7-touch-pos-machine",
      name: "BN-TP081D BELDON i7 Touch POS Machine",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 220000,
      compareAt: 225000,
      rating: 4.8,
      inventory: 10,
      sku: "BELDON-BN-TP081D",
      image: "/products/pos-combo.svg",
      accent: "#2d6cdf",
      description:
        "High-performance BELDON i7 touch POS machine with powerful processing for demanding retail and restaurant environments.",
      shortDescription: "High-performance BELDON i7 touch POS machine with powerful processing for demanding retail and restaurant environments.",
      specs: "Intel i7 processor,Touch display,SSD storage,Windows OS",
      published: true,
    },
    {
      slug: "bn-tp081d-beldon-i7-dual-touch-pos",
      name: "BN-TP081D BELDON i7 Dual Touch POS Machine",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 280000,
      compareAt: 285000,
      rating: 4.9,
      inventory: 8,
      sku: "BELDON-BN-TP081D-DUAL",
      image: "/products/pos-combo.svg",
      accent: "#1f8a70",
      description:
        "Dual-screen BELDON i7 POS machine with customer display for enhanced checkout experience.",
      shortDescription: "Dual-screen BELDON i7 POS machine with customer display for enhanced checkout experience.",
      specs: "Intel i7,Dual touch screens,Customer display,SSD storage",
      published: true,
    },
    {
      slug: "posmax-i7-dual-touch-pos-machine",
      name: "POSMAX i7 Dual Touch POS Machine",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 170000,
      compareAt: 175000,
      rating: 4.7,
      inventory: 12,
      sku: "POSMAX-I7-DUAL",
      image: "/products/pos-combo.svg",
      accent: "#f0a202",
      description:
        "Affordable POSMAX i7 dual touch POS machine ideal for retail and hospitality businesses.",
      shortDescription: "Affordable POSMAX i7 dual touch POS machine ideal for retail and hospitality businesses.",
      specs: "Intel i7,Dual touch screens,Customer display,Windows OS",
      published: true,
    },
    {
      slug: "android-z93-smart-mobile-pos-terminal",
      name: "ANDROID-Z93 Smart Mobile POS Terminal",
      category: "pos-solution",
      subcategory: "handheld-pos",
      price: 95000,
      rating: 4.5,
      inventory: 18,
      sku: "ANDROID-Z93",
      image: "/products/pos-combo.svg",
      accent: "#d45113",
      description:
        "Portable Android POS terminal for mobile businesses, delivery services, and on-the-go billing.",
      shortDescription: "Portable Android POS terminal for mobile businesses, delivery services, and on-the-go billing.",
      specs: "Android OS,Portable design,Wi-Fi & 4G,Built-in printer",
      published: true,
    },
    {
      slug: "pos-machine-combo-offer-198k",
      name: "POS Machine Combo Offer 198K",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 199000,
      rating: 4.9,
      inventory: 5,
      sku: "COMBO-198K",
      image: "/products/pos-combo.svg",
      accent: "#1f8a70",
      description:
        "Complete POS combo package with touch POS terminal, receipt printer, cash drawer, and barcode scanner. Ideal for retail and restaurant setups.",
      shortDescription: "Complete POS combo package with touch POS terminal, receipt printer, cash drawer, and barcode scanner.",
      specs: "Touch POS terminal,Receipt printer,Cash drawer,Barcode scanner",
      published: true,
    },
    {
      slug: "pos-machine-combo-offer-165k",
      name: "POS Machine Combo Offer 165K",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 165000,
      rating: 4.8,
      inventory: 7,
      sku: "COMBO-165K",
      image: "/products/pos-combo.svg",
      accent: "#2d6cdf",
      description:
        "Budget-friendly POS combo with essential hardware for small businesses starting their digital billing journey.",
      shortDescription: "Budget-friendly POS combo with essential hardware for small businesses starting their digital billing journey.",
      specs: "POS terminal,Receipt printer,Cash drawer,Basic setup",
      published: true,
    },
    {
      slug: "x1-senraise-touch-pos-80mm-printer",
      name: "X1 SENRAISE Touch POS Machine with 80MM Receipt Printer",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 165000,
      compareAt: 170000,
      rating: 4.6,
      inventory: 9,
      sku: "SENRAISE-X1",
      image: "/products/pos-combo.svg",
      accent: "#1f8a70",
      description:
        "SENRAISE X1 touch POS with integrated 80mm receipt printer for compact counter setups.",
      shortDescription: "SENRAISE X1 touch POS with integrated 80mm receipt printer for compact counter setups.",
      specs: "Touch screen,80mm thermal printer,Compact design,USB ports",
      published: true,
    },
    {
      slug: "x1-senraise-android-touch-pos",
      name: "X1 SENRAISE Android Touch POS Machine",
      category: "pos-solution",
      subcategory: "pos-machine",
      price: 135000,
      compareAt: 137000,
      rating: 4.5,
      inventory: 14,
      sku: "SENRAISE-X1-ANDROID",
      image: "/products/pos-combo.svg",
      accent: "#2d6cdf",
      description:
        "Android-based SENRAISE X1 touch POS machine with app support and cloud connectivity.",
      shortDescription: "Android-based SENRAISE X1 touch POS machine with app support and cloud connectivity.",
      specs: "Android OS,Touch display,Cloud sync,App ecosystem",
      published: true,
    },
    {
      slug: "beldon-bn-h10s-handheld-android-pos",
      name: "BELDON BN-H10S Handheld Android POS",
      category: "pos-solution",
      subcategory: "handheld-pos",
      price: 65000,
      compareAt: 69500,
      rating: 4.4,
      inventory: 20,
      sku: "BELDON-BN-H10S",
      image: "/products/cash-register.svg",
      accent: "#f0a202",
      description:
        "Handheld Android POS machine perfect for table-side ordering, queue-busting, and mobile checkout.",
      shortDescription: "Handheld Android POS machine perfect for table-side ordering, queue-busting, and mobile checkout.",
      specs: "Handheld design,Android OS,Wi-Fi & 4G,Built-in printer",
      published: true,
    },
    {
      slug: "beldon-bn-pvc045-mix-value-cash-counter",
      name: "BELDON BN-PVC045 Mix Value Cash Counting Machine",
      category: "pos-solution",
      subcategory: "cash-counting-machine",
      price: 199000,
      compareAt: 225000,
      rating: 4.8,
      inventory: 6,
      sku: "BELDON-BN-PVC045",
      image: "/products/cash-register.svg",
      accent: "#1f8a70",
      description:
        "Professional mix value cash counting machine with counterfeit detection for banks, supermarkets, and large retail operations.",
      shortDescription: "Professional mix value cash counting machine with counterfeit detection for banks, supermarkets, and large retail operations.",
      specs: "Mix value counting,Fake note detection,High speed,LCD display",
      published: true,
    },
    {
      slug: "epson-tm-t100e-80mm-thermal-receipt-printer",
      name: "EPSON TM-T100E 80MM Thermal Receipt Bill Printer",
      category: "pos-solution",
      subcategory: "pos-printers",
      price: 36000,
      compareAt: 38000,
      rating: 4.6,
      inventory: 30,
      sku: "EPSON-TM-T100E",
      image: "/products/receipt-printer.svg",
      accent: "#d45113",
      description:
        "Reliable EPSON thermal receipt printer for POS counters. Fast printing, easy paper loading, and low maintenance.",
      shortDescription: "Reliable EPSON thermal receipt printer for POS counters.",
      specs: "80mm thermal printing,USB interface,Easy paper load,Compact design",
      published: true,
    },
    {
      slug: "p61-restaurant-pager-system",
      name: "P61 Restaurant Pager System",
      category: "pos-solution",
      subcategory: "restaurant-pagers",
      price: 95000,
      compareAt: 98000,
      rating: 4.5,
      inventory: 12,
      sku: "P61-PAGERS",
      image: "/products/pos-combo.svg",
      accent: "#6b7f82",
      description:
        "Restaurant order management pager system for efficient kitchen-to-waiter communication.",
      shortDescription: "Restaurant order management pager system for efficient kitchen-to-waiter communication.",
      specs: "Wireless pagers,Long range,Easy setup,Multi-pager support",
      published: true,
    },
    {
      slug: "p71-restaurant-pager-system",
      name: "P71 Restaurant Pager System",
      category: "pos-solution",
      subcategory: "restaurant-pagers",
      price: 65000,
      compareAt: 68500,
      rating: 4.4,
      inventory: 18,
      sku: "P71-PAGERS",
      image: "/products/pos-combo.svg",
      accent: "#6b7f82",
      description:
        "Advanced restaurant pager system with extended range and multiple pager support for busy restaurants and cafés.",
      shortDescription: "Advanced restaurant pager system with extended range and multiple pager support for busy restaurants and cafés.",
      specs: "Extended range,LED display,Durable build,Multi-channel",
      published: true,
    },

    // ── Barcode Solution ──
    {
      slug: "beldon-bn-bs701d-2d-desktop-barcode-scanner",
      name: "Beldon BN-BS701D 2D Desktop Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 29500,
      rating: 4.7,
      inventory: 35,
      sku: "BELDON-BN-BS701D",
      image: "/products/barcode-scanner.svg",
      accent: "#f0a202",
      description:
        "High-performance 2D desktop barcode scanner for retail counters, pharmacies, and supermarkets. Reads all standard 1D and 2D barcodes.",
      shortDescription: "High-performance 2D desktop barcode scanner for retail counters, pharmacies, and supermarkets.",
      specs: "2D scanning,USB interface,High speed,All barcode types",
      published: true,
    },
    {
      slug: "beldon-bn-bs703d-2d-desktop-barcode-scanner",
      name: "BELDON BN-BS703D 2D Desktop Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 22500,
      compareAt: 24500,
      rating: 4.6,
      inventory: 40,
      sku: "BELDON-BN-BS703D",
      image: "/products/barcode-scanner.svg",
      accent: "#f0a202",
      description:
        "Advanced 2D desktop barcode scanner with superior motion tolerance for fast-paced retail environments.",
      shortDescription: "Advanced 2D desktop barcode scanner with superior motion tolerance for fast-paced retail environments.",
      specs: "2D scanning,High motion tolerance,USB plug & play,Durable",
      published: true,
    },
    {
      slug: "beldon-bn-bs702d-2d-desktop-barcode-scanner",
      name: "BELDON BN-BS702D 2D Desktop Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 19500,
      compareAt: 24000,
      rating: 4.5,
      inventory: 45,
      sku: "BELDON-BN-BS702D",
      image: "/products/barcode-scanner.svg",
      accent: "#f0a202",
      description:
        "Budget-friendly 2D desktop barcode scanner with reliable performance for everyday scanning needs.",
      shortDescription: "Budget-friendly 2D desktop barcode scanner with reliable performance for everyday scanning needs.",
      specs: "2D scanning,USB interface,Compact design,Easy setup",
      published: true,
    },
    {
      slug: "posmax-pm-bsw234l-handheld-wireless-barcode-scanner",
      name: "POSMAX PM-BSW234L Handheld Wireless Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 13500,
      rating: 4.4,
      inventory: 50,
      sku: "POSMAX-PM-BSW234L",
      image: "/products/barcode-scanner.svg",
      accent: "#2d6cdf",
      description:
        "Affordable handheld wireless barcode scanner for retail counters and stock rooms. 2.4G wireless with USB receiver.",
      shortDescription: "Affordable handheld wireless barcode scanner for retail counters and stock rooms.",
      specs: "2.4G wireless,USB receiver,Long battery life,Lightweight",
      published: true,
    },
    {
      slug: "posmax-pm-bsw234r-2d-handheld-wireless-barcode-scanner",
      name: "POSMAX PM-BSW234R 2D Handheld Wireless Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 18000,
      rating: 4.5,
      inventory: 38,
      sku: "POSMAX-PM-BSW234R",
      image: "/products/barcode-scanner.svg",
      accent: "#2d6cdf",
      description:
        "2D handheld wireless barcode scanner with extended range for warehouse and inventory management.",
      shortDescription: "2D handheld wireless barcode scanner with extended range for warehouse and inventory management.",
      specs: "2D wireless scanning,Extended range,USB cradle,Rechargeable",
      published: true,
    },
    {
      slug: "beldon-bn-bs207r-handheld-wireless-barcode-scanner",
      name: "BELDON Handheld Wireless Barcode Scanner BN-BS207R",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 12500,
      compareAt: 15000,
      rating: 4.3,
      inventory: 0,
      sku: "BELDON-BN-BS207R",
      image: "/products/barcode-scanner.svg",
      accent: "#f0a202",
      description:
        "Entry-level wireless barcode scanner perfect for small shops and inventory management on a budget.",
      shortDescription: "Entry-level wireless barcode scanner perfect for small shops and inventory management on a budget.",
      specs: "Wireless scanning,USB receiver,Lightweight,Economical",
      published: true,
    },
    {
      slug: "beldon-bn-9066rt-wireless-scanner-with-cradle",
      name: "BELDON Wireless Barcode Scanner with Cradle Base (BN-9066RT)",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 19500,
      rating: 4.5,
      inventory: 28,
      sku: "BELDON-BN-9066RT",
      image: "/products/barcode-scanner.svg",
      accent: "#f0a202",
      description:
        "Wireless barcode scanner with charging cradle base for convenient storage and charging at the counter.",
      shortDescription: "Wireless barcode scanner with charging cradle base for convenient storage and charging at the counter.",
      specs: "Wireless with cradle,Charging base,USB interface,Durable",
      published: true,
    },
    {
      slug: "posmax-pm-bs909-ultra-fast-2d-scanner-with-stand",
      name: "POSMAX Ultra Fast 2D Barcode Scanner with Stand (PM-BS909)",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 8500,
      rating: 4.6,
      inventory: 60,
      sku: "POSMAX-PM-BS909",
      image: "/products/barcode-scanner.svg",
      accent: "#1f8a70",
      description:
        "Ultra-fast 2D barcode scanner with adjustable stand. Best value for supermarkets and retail checkout counters.",
      shortDescription: "Ultra-fast 2D barcode scanner with adjustable stand.",
      specs: "2D scanning,Adjustable stand,Ultra-fast,Plug & play",
      published: true,
    },
    {
      slug: "honeywell-oribit-desktop-barcode-reader-7120d",
      name: "HONEYWELL ORIBIT Desktop Barcode Reader 7120D",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 45000,
      compareAt: 65000,
      rating: 4.7,
      inventory: 15,
      sku: "HONEYWELL-7120D",
      image: "/products/barcode-scanner.svg",
      accent: "#d45113",
      description:
        "Premium HONEYWELL desktop barcode reader with omnidirectional scanning for high-volume retail environments.",
      shortDescription: "Premium HONEYWELL desktop barcode reader with omnidirectional scanning for high-volume retail environments.",
      specs: "Omnidirectional scanning,High speed,USB interface,Premium build",
      published: true,
    },
    {
      slug: "honeywell-oribit-desktop-2d-barcode-reader-7120d",
      name: "HONEYWELL ORIBIT Desktop 2D Barcode Reader 7120D",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 49000,
      rating: 4.8,
      inventory: 12,
      sku: "HONEYWELL-7120D-2D",
      image: "/products/barcode-scanner.svg",
      accent: "#d45113",
      description:
        "Advanced HONEYWELL 2D desktop barcode reader capable of reading QR codes, DataMatrix, and all standard barcodes.",
      shortDescription: "Advanced HONEYWELL 2D desktop barcode reader capable of reading QR codes, DataMatrix, and all standard barcodes.",
      specs: "2D & 1D scanning,Omnidirectional,High performance,USB",
      published: true,
    },
    {
      slug: "zebra-ds-9308-2d-desktop-barcode-scanner",
      name: "ZEBRA DS 9308 2D Desktop Barcode Scanner",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 39000,
      rating: 4.7,
      inventory: 18,
      sku: "ZEBRA-DS-9308",
      image: "/products/barcode-scanner.svg",
      accent: "#111827",
      description:
        "Professional ZEBRA 2D desktop barcode scanner built for durability and high-volume scanning in demanding environments.",
      shortDescription: "Professional ZEBRA 2D desktop barcode scanner built for durability and high-volume scanning in demanding environments.",
      specs: "2D scanning,Heavy duty,USB interface,Omnidirectional",
      published: true,
    },
    {
      slug: "2d-budget-desktop-barcode-scanner-pm-bsd234",
      name: "2D Budget Desktop Barcode Scanner for Supermarket PM-BSD234",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 11500,
      compareAt: 12500,
      rating: 4.3,
      inventory: 55,
      sku: "POSMAX-PM-BSD234",
      image: "/products/barcode-scanner.svg",
      accent: "#1f8a70",
      description:
        "Most affordable 2D desktop barcode scanner designed for supermarkets and retail stores on a tight budget.",
      shortDescription: "Most affordable 2D desktop barcode scanner designed for supermarkets and retail stores on a tight budget.",
      specs: "2D scanning,Budget friendly,USB plug & play,Compact",
      published: true,
    },
    {
      slug: "zebra-ds8178-2d-handheld-wireless-barcode-reader",
      name: "ZEBRA DS8178 2D Handheld Wireless Barcode Reader",
      category: "barcode-solution",
      subcategory: "barcode-scanners",
      price: 175000,
      rating: 4.9,
      inventory: 8,
      sku: "ZEBRA-DS8178",
      image: "/products/barcode-scanner.svg",
      accent: "#111827",
      description:
        "Premium ZEBRA 2D handheld wireless barcode reader for enterprise-grade warehouse and logistics operations.",
      shortDescription: "Premium ZEBRA 2D handheld wireless barcode reader for enterprise-grade warehouse and logistics operations.",
      specs: "2D wireless,Bluetooth,Long range,Industrial grade",
      published: true,
    },
    {
      slug: "bixolon-4-inch-thermal-transfer-label-printer-xt3-40",
      name: "BIXOLON 4-Inch Thermal Transfer Label Printer XT3-40",
      category: "barcode-solution",
      subcategory: "barcode-printers",
      price: 285000,
      rating: 4.8,
      inventory: 5,
      sku: "BIXOLON-XT3-40",
      image: "/products/receipt-printer.svg",
      accent: "#2d6cdf",
      description:
        "Industrial-grade BIXOLON 4-inch thermal transfer label printer for high-volume barcode label printing in warehouses and manufacturing.",
      shortDescription: "Industrial-grade BIXOLON 4-inch thermal transfer label printer for high-volume barcode label printing in warehouses and manufacturing.",
      specs: "4-inch printing,Thermal transfer,USB & LAN,High speed",
      published: true,
    },
    {
      slug: "zebra-4-inch-thermal-transfer-industrial-label-printer-zt230",
      name: "ZEBRA 4 Inch Thermal Transfer Industrial Label Printer ZT230",
      category: "barcode-solution",
      subcategory: "barcode-printers",
      price: 295000,
      compareAt: 320000,
      rating: 4.9,
      inventory: 4,
      sku: "ZEBRA-ZT230",
      image: "/products/receipt-printer.svg",
      accent: "#111827",
      description:
        "Heavy-duty ZT230 industrial label printer for manufacturing, logistics, and warehouse barcode labeling operations.",
      shortDescription: "Heavy-duty ZT230 industrial label printer for manufacturing, logistics, and warehouse barcode labeling operations.",
      specs: "4-inch industrial,Thermal transfer,USB & Ethernet,Rugged build",
      published: true,
    },
    {
      slug: "zebra-heavy-duty-label-printer-zd-888ta",
      name: "ZEBRA Heavy Duty Label Printer ZD-888TA",
      category: "barcode-solution",
      subcategory: "barcode-printers",
      price: 56500,
      compareAt: 58500,
      rating: 4.6,
      inventory: 10,
      sku: "ZEBRA-ZD-888TA",
      image: "/products/receipt-printer.svg",
      accent: "#111827",
      description:
        "Versatile ZEBRA ZD-888TA label printer supporting both direct thermal and thermal transfer printing for retail and office use.",
      shortDescription: "Versatile ZEBRA ZD-888TA label printer supporting both direct thermal and thermal transfer printing for retail and office use.",
      specs: "Direct thermal & transfer,USB interface,Compact,Reliable",
      published: true,
    },

    // ── Biometrics & Security ──
    {
      slug: "luxurious-safe-box-secure-storage",
      name: "Luxurious Safe Box for Secure Storage",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 355000,
      rating: 4.9,
      inventory: 3,
      sku: "SAFE-LUXURY",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Premium luxurious safe box with advanced locking mechanism for high-value document and jewelry storage.",
      shortDescription: "Premium luxurious safe box with advanced locking mechanism for high-value document and jewelry storage.",
      specs: "Premium build,Digital lock,Fire resistant,Spacious interior",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-70b",
      name: "SAFE BOX for Secure Storage – AL-70B",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 98000,
      compareAt: 110000,
      rating: 4.5,
      inventory: 9,
      sku: "SAFE-AL-70B",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Heavy-duty safe box for cash, documents, and retail back-office security. Digital lock with override key.",
      shortDescription: "Heavy-duty safe box for cash, documents, and retail back-office security.",
      specs: "Digital lock,Reinforced body,Office ready,Override key",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-2014f",
      name: "SAFE BOX for Secure Storage – AL-2014F",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 73000,
      compareAt: 75000,
      rating: 4.4,
      inventory: 12,
      sku: "SAFE-AL-2014F",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Mid-size safe box with digital combination lock for office and home document security.",
      shortDescription: "Mid-size safe box with digital combination lock for office and home document security.",
      specs: "Digital combination,Compact size,Steel construction,Scratch resistant",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-70",
      name: "SAFE BOX for Secure Storage AL-70",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 88000,
      rating: 4.5,
      inventory: 10,
      sku: "SAFE-AL-70",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Standard office safe box with electronic lock for daily cash and document storage needs.",
      shortDescription: "Standard office safe box with electronic lock for daily cash and document storage needs.",
      specs: "Electronic lock,Standard size,Heavy duty,Bolt-down ready",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-50",
      name: "SAFE BOX for Secure Storage AL-50",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 58000,
      compareAt: 60000,
      rating: 4.3,
      inventory: 15,
      sku: "SAFE-AL-50",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Compact safe box ideal for small businesses and retail shops needing secure cash storage.",
      shortDescription: "Compact safe box ideal for small businesses and retail shops needing secure cash storage.",
      specs: "Compact design,Electronic lock,Portable,Steel body",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-36",
      name: "SAFE BOX for Secure Storage AL-36",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 43000,
      compareAt: 45000,
      rating: 4.2,
      inventory: 18,
      sku: "SAFE-AL-36",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Small safe box perfect for home offices and small retail counters. Digital lock with manual override.",
      shortDescription: "Small safe box perfect for home offices and small retail counters.",
      specs: "Small size,Digital lock,Manual override,Affordable",
      published: true,
    },
    {
      slug: "safe-box-secure-storage-al-25",
      name: "SAFE BOX for Secure Storage AL-25",
      category: "biometrics-security-solution",
      subcategory: "safe-locker",
      price: 35000,
      rating: 4.1,
      inventory: 20,
      sku: "SAFE-AL-25",
      image: "/products/safe-box.svg",
      accent: "#c44900",
      description:
        "Entry-level safe box for basic document and cash security. Compact and affordable.",
      shortDescription: "Entry-level safe box for basic document and cash security.",
      specs: "Entry-level,Compact,Key lock,Budget friendly",
      published: true,
    },
    {
      slug: "wm-5000v3-security-guard-tour-system",
      name: "WM-5000V3 Security Guard Tour System",
      category: "biometrics-security-solution",
      subcategory: "access-control",
      price: 46000,
      compareAt: 48000,
      rating: 4.4,
      inventory: 8,
      sku: "WM-5000V3",
      image: "/products/fingerprint-system.svg",
      accent: "#6b7f82",
      description:
        "Electronic security guard tour system for tracking patrol rounds in commercial buildings and facilities.",
      shortDescription: "Electronic security guard tour system for tracking patrol rounds in commercial buildings and facilities.",
      specs: "Electronic tracking,Tour management,USB download,Durable wand",
      published: true,
    },
    {
      slug: "beldon-bn-m11-door-access-control",
      name: "BELDON BN-M11 Door Access Control Solution",
      category: "biometrics-security-solution",
      subcategory: "access-control",
      price: 75000,
      compareAt: 79000,
      rating: 4.6,
      inventory: 7,
      sku: "BELDON-BN-M11",
      image: "/products/fingerprint-system.svg",
      accent: "#2d6cdf",
      description:
        "Complete door access control solution with fingerprint and card reader for office and commercial buildings.",
      shortDescription: "Complete door access control solution with fingerprint and card reader for office and commercial buildings.",
      specs: "Fingerprint & card,Easy installation,Access log,Multi-user",
      published: true,
    },
    {
      slug: "beldon-d05-smart-door-lock-tuya",
      name: "BELDON D05 Smart Door Lock with Tuya Mobile App",
      category: "biometrics-security-solution",
      subcategory: "smart-door-lock",
      price: 38000,
      compareAt: 42000,
      rating: 4.5,
      inventory: 14,
      sku: "BELDON-D05",
      image: "/products/fingerprint-system.svg",
      accent: "#1f8a70",
      description:
        "Smart door lock with Tuya mobile app control, fingerprint unlock, and keypad access for modern homes and offices.",
      shortDescription: "Smart door lock with Tuya mobile app control, fingerprint unlock, and keypad access for modern homes and offices.",
      specs: "Tuya app control,Fingerprint,Keypad,Auto-lock",
      published: true,
    },
    {
      slug: "beldon-d01-smart-door-lock-tuya",
      name: "BELDON D01 Smart Door Lock with Tuya Mobile App",
      category: "biometrics-security-solution",
      subcategory: "smart-door-lock",
      price: 35000,
      compareAt: 38000,
      rating: 4.4,
      inventory: 16,
      sku: "BELDON-D01",
      image: "/products/fingerprint-system.svg",
      accent: "#1f8a70",
      description:
        "Affordable smart door lock with Tuya app integration, fingerprint scanner, and PIN code access.",
      shortDescription: "Affordable smart door lock with Tuya app integration, fingerprint scanner, and PIN code access.",
      specs: "Tuya app,Fingerprint,PIN code,Easy install",
      published: true,
    },
    {
      slug: "biometric-fingerprint-time-attendance-bn-t109b",
      name: "Biometric Fingerprint Time Attendance Machine BN-T109B",
      category: "biometrics-security-solution",
      subcategory: "time-attendance-fingerprint",
      price: 29500,
      compareAt: 32000,
      rating: 4.5,
      inventory: 0,
      sku: "BELDON-BN-T109B",
      image: "/products/fingerprint-system.svg",
      accent: "#6b7f82",
      description:
        "Fingerprint time attendance machine with advanced biometric sensor for accurate employee tracking.",
      shortDescription: "Fingerprint time attendance machine with advanced biometric sensor for accurate employee tracking.",
      specs: "Fingerprint sensor,Attendance log,USB download,LCD display",
      published: true,
    },
    {
      slug: "biometric-fingerprint-time-attendance-bn-t109a",
      name: "Biometric Fingerprint Time Attendance Machine BN-T109A",
      category: "biometrics-security-solution",
      subcategory: "time-attendance-fingerprint",
      price: 32500,
      compareAt: 35000,
      rating: 4.4,
      inventory: 0,
      sku: "BELDON-BN-T109A",
      image: "/products/fingerprint-system.svg",
      accent: "#6b7f82",
      description:
        "Compact fingerprint attendance machine with card reader backup for reliable employee time tracking.",
      shortDescription: "Compact fingerprint attendance machine with card reader backup for reliable employee time tracking.",
      specs: "Fingerprint & card,Compact design,Attendance reports,USB",
      published: true,
    },
    {
      slug: "beldon-bn-d2-glass-door-access-controller",
      name: "BELDON BN-D2 Smart Door Access Controller for Glass Door",
      category: "biometrics-security-solution",
      subcategory: "access-control",
      price: 59000,
      rating: 4.5,
      inventory: 6,
      sku: "BELDON-BN-D2",
      image: "/products/fingerprint-system.svg",
      accent: "#2d6cdf",
      description:
        "Specialized access controller designed for glass doors in modern office buildings and commercial spaces.",
      shortDescription: "Specialized access controller designed for glass doors in modern office buildings and commercial spaces.",
      specs: "Glass door compatible,Fingerprint & card,Easy mount,Access log",
      published: true,
    },
    {
      slug: "beldon-bn-s01-3d-face-recognition-door-lock",
      name: "BELDON BN-S01 3D Face Recognition Smart Door Lock",
      category: "biometrics-security-solution",
      subcategory: "smart-door-lock",
      price: 75000,
      rating: 4.7,
      inventory: 5,
      sku: "BELDON-BN-S01",
      image: "/products/fingerprint-system.svg",
      accent: "#1f8a70",
      description:
        "Advanced 3D face recognition smart door lock for high-security residential and commercial applications.",
      shortDescription: "Advanced 3D face recognition smart door lock for high-security residential and commercial applications.",
      specs: "3D face recognition,Anti-spoofing,Auto-lock,Premium security",
      published: true,
    },
    {
      slug: "beldon-bn-f-31-fingerprint-door-lock",
      name: "BELDON BN-F-31 Fingerprint Smart Door Lock",
      category: "biometrics-security-solution",
      subcategory: "smart-door-lock",
      price: 27500,
      compareAt: 32000,
      rating: 4.3,
      inventory: 18,
      sku: "BELDON-BN-F-31",
      image: "/products/fingerprint-system.svg",
      accent: "#1f8a70",
      description:
        "Affordable fingerprint smart door lock with key override for homes and small offices.",
      shortDescription: "Affordable fingerprint smart door lock with key override for homes and small offices.",
      specs: "Fingerprint unlock,Key override,Easy install,Battery powered",
      published: true,
    },
  ];

  const resolveFeedImage = loadFeedImageResolver();
  let feedImageHits = 0;

  for (const p of products) {
    const { subcategory, ...productData } = p;
    const categoryRecord = await prisma.productCategory.findUnique({
      where: { slug: p.category },
    });
    const subcategoryRecord = await prisma.productCategory.findUnique({
      where: { slug: p.subcategory },
    });

    // Prefer the real synnex.lk product photo from the shopping feed;
    // fall back to the bundled placeholder SVG when no match exists.
    const feedImage = resolveFeedImage(p.name);
    if (feedImage) feedImageHits++;
    const imageUrl = feedImage ?? p.image;

    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: productData.name,
        category: subcategoryRecord?.name ?? p.subcategory,
        categoryId: categoryRecord?.id ?? null,
        price: productData.price,
        compareAt: productData.compareAt,
        rating: productData.rating,
        inventory: productData.inventory,
        image: imageUrl,
        accent: productData.accent,
        description: productData.description,
        specs: productData.specs,
        published: productData.published,
      },
      create: {
        ...productData,
        image: imageUrl,
        categoryId: categoryRecord?.id ?? null,
        category: subcategoryRecord?.name ?? p.subcategory,
      },
    });

    // One real gallery image per product (the feed has a single photo each);
    // clears the legacy 3-duplicate placeholder rows on reseed.
    await prisma.productImage.deleteMany({ where: { productId: createdProduct.id } });
    await prisma.productImage.create({
      data: {
        id: `${createdProduct.id}-0`,
        productId: createdProduct.id,
        url: imageUrl,
        alt: p.name,
        sortOrder: 0,
      },
    });
  }
  console.log(`   Product photos matched from feed: ${feedImageHits}/${products.length}`);

  // ─── Bootstrap Admin User (one-time; skipped if any AdminUser already exists) ──

  const PLACEHOLDER_ADMIN_HASH = "$2b$10$placeholderhashreplaceinproduction";
  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  const existingAdminCount = await prisma.adminUser.count();

  if (existingAdminCount === 0) {
    if (!bootstrapEmail || !bootstrapPassword) {
      console.warn(
        "⚠️  ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap. Set them in .env and rerun `npm run db:seed`.",
      );
    } else {
      await prisma.adminUser.create({
        data: {
          email: bootstrapEmail,
          name: "Synnex Admin",
          passwordHash: await hashPassword(bootstrapPassword),
          role: "SuperAdmin",
          active: true,
        },
      });
    }
  } else if (bootstrapEmail && bootstrapPassword) {
    // Repair admin rows created by an earlier seed run that used a non-functional placeholder hash.
    const staleAdmin = await prisma.adminUser.findFirst({
      where: { email: bootstrapEmail, passwordHash: PLACEHOLDER_ADMIN_HASH },
    });
    if (staleAdmin) {
      await prisma.adminUser.update({
        where: { id: staleAdmin.id },
        data: { passwordHash: await hashPassword(bootstrapPassword) },
      });
      console.log("🔧 Repaired placeholder admin password hash from an earlier seed run.");
    }

    // Ensure the bootstrap admin always ends up SuperAdmin, even if it was seeded
    // before SuperAdmin/PBAC existed.
    await prisma.adminUser.updateMany({
      where: { email: bootstrapEmail, role: { not: "SuperAdmin" } },
      data: { role: "SuperAdmin" },
    });
  }

  // ─── Seed Site Settings ────────────────────────────────────────────────────

  const settings = [
    { key: "site_name", value: "Synnex IT Solution", group: "general" },
    { key: "site_url", value: "https://synnex.lk", group: "general" },
    { key: "contact_phone", value: "011 255 9466", group: "contact" },
    { key: "contact_email", value: "info@synnex.lk", group: "contact" },
    {
      key: "contact_address",
      value: "No: 12, Daisy Villa Ave, R. A. De Mel Mawatha, Colombo 04",
      group: "contact",
    },
    { key: "currency", value: "LKR", group: "general" },
    { key: "currency_symbol", value: "Rs.", group: "general" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // ─── Seed Page Content ─────────────────────────────────────────────────────

  const pages = [
    {
      slug: "about",
      title: "About Synnex IT Solution",
      summary:
        "Sri Lanka's premier POS & technology partner since 2015.",
      body: `<p>Since 2015, Synnex IT Solution (Pvt) Ltd has been a leading provider of Point of Sale (POS) hardware and software solutions in Sri Lanka and the Maldives, dedicated to helping businesses streamline operations and enhance efficiency.</p>
<p>We supply top-quality POS machines, POS printers, barcode scanners, cash drawers, cash counting machines, and accessories, together with advanced barcode label printers and industrial label printers.</p>
<p>Our POS software solutions are designed to improve transaction accuracy, inventory control, and sales reporting for retail, hospitality, and service industries. Beyond POS systems, Synnex delivers PC and printer solutions, biometric and security systems, smart door locks, network solutions, and customized tech integration tailored to your business needs.</p>
<p>With a commitment to quality, technical support excellence, and customer satisfaction, Synnex is your trusted partner for technology solutions that drive business growth and operational success.</p>`,
      seoTitle: "About Us - Synnex IT Solution Sri Lanka",
      seoDescription:
        "Learn about Synnex IT Solution, Sri Lanka's leading POS hardware and technology partner since 2015.",
      published: true,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      summary: "Our privacy policy and data protection practices.",
      body: "<p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p>",
      seoTitle: "Privacy Policy - Synnex IT Solution",
      seoDescription: "Read our privacy policy.",
      published: true,
    },
    {
      slug: "terms-conditions",
      title: "Terms & Conditions",
      summary: "Terms and conditions for using our services.",
      body: "<p>By using our services, you agree to the following terms and conditions.</p>",
      seoTitle: "Terms & Conditions - Synnex IT Solution",
      seoDescription: "Read our terms and conditions.",
      published: true,
    },
  ];

  for (const page of pages) {
    await prisma.pageContent.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
  }

  // ─── Seed Job Posts ────────────────────────────────────────────────────────

  const jobs = [
    {
      slug: "pos-technician",
      title: "POS Technician",
      department: "Technical",
      location: "Colombo",
      type: "Full-time",
      summary:
        "Install, configure, and maintain POS hardware and software for retail and hospitality clients across Sri Lanka.",
      requirements: "Diploma in IT or related field,2+ years experience with POS systems,Ability to travel island-wide,Good communication skills",
      published: true,
    },
    {
      slug: "sales-executive",
      title: "Sales Executive - POS Solutions",
      department: "Sales",
      location: "Colombo",
      type: "Full-time",
      summary:
        "Drive sales of POS hardware, barcode solutions, and security systems to retail, hospitality, and corporate clients.",
      requirements: "Degree/Diploma in Marketing or related field,1+ years B2B sales experience,Target-driven mindset,Valid driving license",
      published: true,
    },
    {
      slug: "warehouse-assistant",
      title: "Warehouse Assistant",
      department: "Operations",
      location: "Colombo",
      type: "Full-time",
      summary:
        "Manage inventory, handle incoming/outgoing stock, and support logistics for our technology hardware warehouse.",
      requirements: "G.C.E. A/L or equivalent,Attention to detail,Physical fitness for lifting,Computer literacy preferred",
      published: true,
    },
  ];

  for (const job of jobs) {
    await prisma.jobPost.upsert({
      where: { slug: job.slug },
      update: job,
      create: job,
    });
  }

  // ─── Seed Driver Downloads ─────────────────────────────────────────────────

  const drivers = [
    {
      slug: "epson-tm-t100e-driver",
      title: "EPSON TM-T100E Printer Driver",
      deviceType: "POS Printer",
      version: "3.0.0",
      os: "Windows 10/11",
      fileUrl: "https://example.com/drivers/epson-tm-t100e.zip",
      notes: "Latest driver for EPSON TM-T100E thermal receipt printer.",
      published: true,
    },
    {
      slug: "beldon-barcode-scanner-driver",
      title: "BELDON Barcode Scanner Driver",
      deviceType: "Barcode Scanner",
      version: "2.1.0",
      os: "Windows 10/11",
      fileUrl: "https://example.com/drivers/beldon-scanner.zip",
      notes: "USB driver for BELDON desktop and handheld barcode scanners.",
      published: true,
    },
    {
      slug: "zebra-zt230-driver",
      title: "ZEBRA ZT230 Label Printer Driver",
      deviceType: "Label Printer",
      version: "1.5.0",
      os: "Windows 10/11",
      fileUrl: "https://example.com/drivers/zebra-zt230.zip",
      notes: "Driver for ZEBRA ZT230 industrial label printer.",
      published: true,
    },
  ];

  for (const driver of drivers) {
    await prisma.driverDownload.upsert({
      where: { slug: driver.slug },
      update: driver,
      create: driver,
    });
  }

  // ─── Seed Payment Instructions ─────────────────────────────────────────────

  const paymentMethods = [
    {
      method: "BankTransfer",
      title: "Bank Transfer",
      instructions:
        "Transfer the total amount to our bank account. Upload the payment receipt on the checkout page. Account details will be provided after order confirmation.",
      enabled: true,
      sortOrder: 1,
    },
    {
      method: "CashOnDelivery",
      title: "Cash on Delivery",
      instructions:
        "Pay in cash when your order is delivered. Available for orders within Colombo and suburbs.",
      enabled: true,
      sortOrder: 2,
    },
    {
      method: "Cheque",
      title: "Cheque Payment",
      instructions:
        "Issue a cheque in favor of 'Synnex IT Solution (Pvt) Ltd'. Delivery will be processed after cheque clearance.",
      enabled: true,
      sortOrder: 3,
    },
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentInstruction.upsert({
      where: { method: pm.method },
      update: pm,
      create: pm,
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log(`   Categories: ${categories.length} main + subcategories`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Admin users: ${await prisma.adminUser.count()}`);
  console.log(`   Site settings: ${settings.length}`);
  console.log(`   Pages: ${pages.length}`);
  console.log(`   Job posts: ${jobs.length}`);
  console.log(`   Driver downloads: ${drivers.length}`);
  console.log(`   Payment methods: ${paymentMethods.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
