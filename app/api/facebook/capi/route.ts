import { NextResponse } from "next/server";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { getMetaCapiCredentials } from "@/lib/site-settings";
import { buildEventId, hashForMeta } from "@/lib/tracking";

type CapiPayload = {
  eventName?: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
};

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const payload = (await request.json()) as CapiPayload;
  const credentials = await getMetaCapiCredentials();

  if (!credentials) {
    return NextResponse.json({
      ok: true,
      configured: false,
      eventId: buildEventId("local"),
    });
  }
  const { pixelId, accessToken } = credentials;

  const eventId = buildEventId("synnex");
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: payload.eventName || "Lead",
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: "website",
            event_source_url: payload.eventSourceUrl,
            user_data: {
              em: hashForMeta(payload.email),
              ph: hashForMeta(payload.phone),
            },
            custom_data: {
              currency: payload.currency || "LKR",
              value: payload.value,
              contents: payload.contents,
            },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    return NextResponse.json({ ok: false, eventId }, { status: 502 });
  }

  return NextResponse.json({ ok: true, configured: true, eventId });
}
