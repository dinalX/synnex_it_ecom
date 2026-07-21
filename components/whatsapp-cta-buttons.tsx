"use client";

import { MessageCircle, Package } from "lucide-react";
import type { WhatsappClickService } from "@/lib/whatsapp-click";

const WHATSAPP_NUMBER = "94112559466";

function track(kind: "technical" | "bulk", service: WhatsappClickService) {
  fetch("/api/whatsapp-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, service }),
  }).catch(() => {});
}

export function WhatsappCtaButtons({ service, title }: { service: WhatsappClickService; title: string }) {
  return (
    <>
      <a
        href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(`Hi, I need technical support for ${title}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="primary-action"
        onClick={() => track("technical", service)}
      >
        <MessageCircle size={18} />
        WhatsApp Technical Support
      </a>
      <a
        href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(`Hi, I'd like a bulk order quote for ${title}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="secondary-action"
        onClick={() => track("bulk", service)}
      >
        <Package size={18} />
        Bulk Order Inquiry
      </a>
    </>
  );
}
