import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient();

async function main() {
  // ─── Seed Product Categories ───────────────────────────────────────────────

  // Mirrors the real synnex.lk category tree exactly (see productcat-sitemap.xml):
  // 4 main categories, ~30 subcategories, with a few nested a third level deep.
  type CategorySeed = {
    slug: string;
    name: string;
    shortDescription?: string;
    description?: string;
    icon?: string;
    accent?: string;
    sortOrder: number;
    featured?: boolean;
    children?: CategorySeed[];
  };

  const categories: CategorySeed[] = [
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
        { slug: "cash-register", name: "Cash Register", sortOrder: 2 },
        { slug: "pos-printers", name: "POS Printers", sortOrder: 3 },
        { slug: "pos-paper-roll", name: "POS Paper Roll", sortOrder: 4 },
        { slug: "cash-drawer", name: "Cash Drawer", sortOrder: 5 },
        { slug: "cash-counting-machine", name: "Cash Counting Machine", sortOrder: 6 },
        { slug: "customer-display", name: "Customer Display", sortOrder: 7 },
        { slug: "handheld-pos", name: "Handheld POS", sortOrder: 8 },
        { slug: "kiosk", name: "Kiosk", sortOrder: 9 },
        { slug: "mobile-data-collector", name: "Mobile Data Collector", sortOrder: 10 },
        { slug: "mobile-printers", name: "Mobile Printers", sortOrder: 11 },
        { slug: "restaurant-pagers", name: "Restaurant Pagers", sortOrder: 12 },
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
        {
          slug: "barcode-label-printers",
          name: "Barcode Label Printers",
          sortOrder: 1,
          children: [
            { slug: "industrial-label-printers", name: "Industrial Label Printers", sortOrder: 1 },
          ],
        },
        {
          slug: "barcode-label-roll",
          name: "Barcode Label Roll",
          sortOrder: 2,
          children: [
            { slug: "direct-thermal-label-sticker-roll", name: "Direct Thermal Label Sticker Roll", sortOrder: 1 },
            { slug: "thermal-transfer-label-sticker-roll", name: "Thermal Transfer Label Sticker Roll", sortOrder: 2 },
            { slug: "thermal-transfer-wax-ribbon-roll", name: "Thermal Transfer Wax Ribbon Roll", sortOrder: 3 },
          ],
        },
        {
          slug: "barcode-scanners",
          name: "Barcode Scanners",
          sortOrder: 3,
          children: [
            { slug: "desktop-barcode-scanner", name: "Desktop Barcode Scanner", sortOrder: 1 },
            { slug: "handheld-barcode-scanner", name: "Handheld Barcode Scanner", sortOrder: 2 },
            { slug: "wireless-barcode-scanners", name: "Wireless Barcode Scanners", sortOrder: 3 },
          ],
        },
      ],
    },
    {
      slug: "biometrics-security-solution",
      name: "Biometrics & Security Solution",
      shortDescription:
        "Fingerprint attendance systems, smart door locks, safe boxes, and IP cameras.",
      description:
        "Comprehensive biometric and security solutions including fingerprint time attendance, smart door locks, safe boxes, and wireless IP cameras.",
      icon: "Fingerprint",
      accent: "#6b7f82",
      sortOrder: 3,
      featured: true,
      children: [
        { slug: "safe-locker", name: "Safe Locker", sortOrder: 1 },
        { slug: "smart-door-lock", name: "Smart Door Lock", sortOrder: 2 },
        { slug: "time-attendance-fingerprint-solution", name: "Time Attendance Fingerprint Solution", sortOrder: 3 },
        { slug: "wireless-ip-camera", name: "Wireless IP Camera", sortOrder: 4 },
      ],
    },
    {
      slug: "pc-printer-solution",
      name: "PC & Printer Solution",
      shortDescription:
        "PCs, monitors, printers, networking gear, and power accessories for the office.",
      description:
        "Complete PC and printer solutions for the office — all-in-one PCs, monitors, keyboards and mice, printers, networking, and UPS/power backup.",
      icon: "Printer",
      accent: "#2d6cdf",
      sortOrder: 4,
      featured: false,
      children: [
        { slug: "all-in-one-pc", name: "All In One PC", sortOrder: 1 },
        { slug: "key-board-and-mouse", name: "Key Board And Mouse", sortOrder: 2 },
        { slug: "monitor", name: "Monitor", sortOrder: 3 },
        { slug: "network-solution", name: "Network Solution", sortOrder: 4 },
        { slug: "power-supply", name: "Power Supply", sortOrder: 5 },
        {
          slug: "printers-solution",
          name: "Printers Solution",
          sortOrder: 6,
          children: [
            { slug: "a4-printers", name: "A4 Printers", sortOrder: 1 },
            { slug: "card-printer", name: "Card Printer", sortOrder: 2 },
            { slug: "handheld-printer", name: "Handheld Printer", sortOrder: 3 },
          ],
        },
        { slug: "ups", name: "UPS", sortOrder: 7 },
      ],
    },
  ];

  // Retire categories/slugs that no longer exist in the real taxonomy above —
  // either renamed (old slug replaced by a new one) or fully removed (the old
  // "Networking Solution" and "Computer Accessories" mains, superseded by
  // "PC & Printer Solution"). onDelete: SetNull means this only clears the
  // categoryId/parentId FKs it touches, never cascades into deleting products.
  await prisma.productCategory.deleteMany({
    where: {
      slug: {
        in: [
          "networking-solution",
          "routers-switches",
          "cables-connectors",
          "wireless-access-points",
          "computer-accessories",
          "keyboards-mice",
          "monitors",
          "ups-power",
          "storage-devices",
          "barcode-printers",
          "time-attendance-fingerprint",
          "access-control",
        ],
      },
    },
  });

  async function upsertCategoryTree(nodes: CategorySeed[], parentId: string | null) {
    for (const node of nodes) {
      const { children, ...data } = node;
      const record = await prisma.productCategory.upsert({
        where: { slug: data.slug },
        update: { ...data, parentId },
        create: { ...data, parentId },
      });
      if (children?.length) {
        await upsertCategoryTree(children, record.id);
      }
    }
  }

  await upsertCategoryTree(categories, null);

  // ─── Seed Products ─────────────────────────────────────────────────────────

  type ProductSeed = {
    slug: string;
    name: string;
    category: string;
    subcategory: string;
    price: number;
    compareAt?: number;
    rating: number;
    inventory: number;
    sku?: string;
    image: string;
    accent: string;
    description: string;
    shortDescription: string;
    specs: string;
    published: boolean;
  };

  // The full real catalog scraped from synnex.lk (see scripts/import-catalog.ts),
  // merged with the hand-curated sku/specs/rating/inventory kept for products
  // that predate the import. Products without a live price stay unpublished.
  // catalog.json is generated (gitignored) — build it before seeding.
  const catalogPath = join(process.cwd(), "prisma", "catalog.json");
  if (!existsSync(catalogPath)) {
    throw new Error(
      "prisma/catalog.json is missing — generate it first with: npx tsx scripts/import-catalog.ts",
    );
  }
  const catalog: ProductSeed[] = JSON.parse(readFileSync(catalogPath, "utf8"));
  const curated: Record<
    string,
    { sku?: string; specs?: string; rating?: number; inventory?: number }
  > = JSON.parse(readFileSync(join(process.cwd(), "prisma", "curated-overrides.json"), "utf8"));

  const products: ProductSeed[] = catalog.map((entry) => {
    const override = curated[entry.slug];
    return {
      ...entry,
      sku: override?.sku,
      specs: override?.specs ?? entry.specs,
      rating: override?.rating ?? entry.rating,
      inventory: entry.inventory === 0 ? 0 : override?.inventory ?? entry.inventory,
      published: entry.published && entry.price > 0,
    };
  })

  for (const p of products) {
    const { subcategory, ...productData } = p;
    const categoryRecord = await prisma.productCategory.findUnique({
      where: { slug: p.category },
    });
    const subcategoryRecord = await prisma.productCategory.findUnique({
      where: { slug: p.subcategory },
    });

    // catalog.json already carries the localized image path per product.
    const imageUrl = p.image;

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
  // The catalog is the source of truth: drop products that are no longer on
  // synnex.lk (e.g. the old hand-written seed slugs that never matched real
  // URLs). OrderItem.productId is SetNull, so order history survives.
  const removed = await prisma.product.deleteMany({
    where: { slug: { notIn: products.map((p) => p.slug) } },
  });
  if (removed.count > 0) {
    console.log(`   Removed ${removed.count} products not in the live catalog`);
  }

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

  // ─── Seed Hero Banners (rotating homepage carousel) ────────────────────────

  const existingBannerCount = await prisma.heroBanner.count();
  if (existingBannerCount === 0) {
    const bootstrapAdmin = await prisma.adminUser.findFirst({ where: { role: "SuperAdmin" } });
    const bannerProducts = await prisma.product.findMany({
      where: { published: true },
      orderBy: { rating: "desc" },
      take: 2,
    });

    const banners: Array<{
      title: string;
      subtitle: string;
      imageUrl: string;
      imageAlt: string;
      ctaLabel: string;
      ctaHref: string;
      productId: string | null;
      theme: string;
      sortOrder: number;
    }> = [];

    if (bannerProducts[0]) {
      banners.push({
        title: "Deal of the week",
        subtitle: bannerProducts[0].shortDescription || bannerProducts[0].description.slice(0, 120),
        imageUrl: bannerProducts[0].image,
        imageAlt: bannerProducts[0].name,
        ctaLabel: "Shop this deal",
        ctaHref: `/products/${bannerProducts[0].slug}`,
        productId: bannerProducts[0].id,
        theme: "light",
        sortOrder: 0,
      });
    }

    banners.push({
      title: "Islandwide Delivery, Always Genuine",
      subtitle: "Free setup guidance and after-sales support on every POS system we sell.",
      imageUrl: "/products/cash-register.svg",
      imageAlt: "Synnex POS hardware",
      ctaLabel: "Browse catalog",
      ctaHref: "/products",
      productId: null,
      theme: "dark",
      sortOrder: 1,
    });

    if (bannerProducts[1]) {
      banners.push({
        title: "Top rated by our customers",
        subtitle: bannerProducts[1].shortDescription || bannerProducts[1].description.slice(0, 120),
        imageUrl: bannerProducts[1].image,
        imageAlt: bannerProducts[1].name,
        ctaLabel: "Shop this deal",
        ctaHref: `/products/${bannerProducts[1].slug}`,
        productId: bannerProducts[1].id,
        theme: "light",
        sortOrder: 2,
      });
    }

    for (const banner of banners) {
      await prisma.heroBanner.create({
        data: { ...banner, createdById: bootstrapAdmin?.id ?? null },
      });
    }
    console.log(`   Hero banners seeded: ${banners.length}`);
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
