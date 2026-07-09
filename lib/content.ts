export const paymentInstructions = [
  {
    method: "bank-transfer",
    title: "Bank transfer",
    instructions:
      "Confirm the order, transfer to the Synnex company account, and send the slip through WhatsApp before dispatch.",
  },
  {
    method: "cash-on-delivery",
    title: "Cash on delivery",
    instructions:
      "Available for eligible Colombo and selected islandwide deliveries after phone confirmation.",
  },
  {
    method: "quotation",
    title: "Request a quotation",
    instructions:
      "For POS bundles, installation, and enterprise orders, the sales team will prepare a pro-forma invoice.",
  },
];

export const careerPosts = [
  {
    slug: "sales-executive-pos-solutions",
    title: "Sales Executive - POS Solutions",
    department: "Sales",
    location: "Colombo",
    type: "Full time",
    summary:
      "Work with retailers, restaurants, and offices to recommend POS, barcode, and security solutions.",
    requirements: ["Hardware sales experience", "Strong Sinhala/Tamil/English communication", "Valid riding license preferred"],
  },
  {
    slug: "technical-support-technician",
    title: "Technical Support Technician",
    department: "Support",
    location: "Colombo / Field visits",
    type: "Full time",
    summary:
      "Install POS hardware, configure printers, troubleshoot drivers, and support customers after purchase.",
    requirements: ["Windows troubleshooting", "Printer and network basics", "Customer-friendly field support"],
  },
];

export const driverDownloads = [
  {
    slug: "thermal-pos-printer-driver",
    title: "Thermal POS Printer Driver",
    deviceType: "Receipt Printer",
    version: "v4.2.1",
    os: "Windows 10 / Windows 11",
    fileUrl: "#",
    notes: "Use this package for common 80mm thermal receipt printers sold with Synnex POS bundles.",
  },
  {
    slug: "barcode-scanner-configuration-guide",
    title: "Barcode Scanner Configuration Guide",
    deviceType: "Barcode Scanner",
    version: "2026.01",
    os: "PDF Guide",
    fileUrl: "#",
    notes: "Reset, USB HID mode, and common retail barcode setup commands.",
  },
  {
    slug: "fingerprint-attendance-software",
    title: "Fingerprint Attendance Software",
    deviceType: "Biometric Device",
    version: "v3.8",
    os: "Windows",
    fileUrl: "#",
    notes: "Attendance reporting utility for supported fingerprint time attendance machines.",
  },
];
