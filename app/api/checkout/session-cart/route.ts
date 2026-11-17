import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(v: unknown, fallback = "") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function moneyToCents(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v * 100);

  const cleaned = String(v).replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  return Math.round(n * 100);
}

function metaValue(v: unknown) {
  return String(v ?? "").slice(0, 500);
}

function validImageUrl(v: unknown) {
  const s = cleanString(v);
  if (!s) return null;

  try {
    const u = new URL(s);
    if (u.protocol === "https:") return s;
  } catch {}

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is missing on the server." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
    const body = await req.json();

    const rawItems = Array.isArray(body?.items) ? body.items : [];
    const contact = body?.contact || {};
    const shipTo = body?.ship_to || {};

    if (!rawItems.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const items = rawItems.map((item: any) => {
      const mpn = cleanString(item?.mpn, "Unknown part");
      const name = cleanString(item?.name, mpn);
      const quantity = Math.max(1, Math.floor(Number(item?.quantity || item?.qty || 1)));
      const unitAmount = moneyToCents(item?.price);
      const image = validImageUrl(item?.image_url);

      if (!unitAmount || unitAmount <= 0) {
        throw new Error(`Missing or invalid price for ${mpn}.`);
      }

      return {
        mpn,
        name,
        quantity,
        unitAmount,
        isRefurb: Boolean(item?.is_refurb),
        image,
      };
    });

    const isRefurbOnly = items.length > 0 && items.every((x) => x.isRefurb);
    {
      // Server-side gate: never create a payable session from catalog stock alone.
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com").replace(/\/+$/, "");
      let check: Response;
      try {
        check = await fetch(`${apiBase}/api/checkout/verify-new-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            items: items.map((x) => ({ mpn: x.mpn, quantity: x.quantity, is_refurb: x.isRefurb, price: x.unitAmount / 100 })),
            ship_to: shipTo,
          }),
        });
      } catch {
        return NextResponse.json({ error: "We could not verify supplier availability. Please try again shortly." }, { status: 503 });
      }
      const proof = await check.json().catch(() => null);
      if (!check.ok || proof?.verified !== true || proof?.stock_verification !== "all_conditions_v1") {
        return NextResponse.json({
          error: typeof proof?.detail === "string" ? proof.detail : "Supplier availability could not be verified. Please refresh your cart.",
        }, { status: check.status === 409 ? 409 : 503 });
      }
    }
    const origin = req.nextUrl.origin;

    const metadata: Record<string, string> = {
      source: "next_hosted_checkout",
      is_refurb_only: String(isRefurbOnly),
      contact_email: metaValue(contact?.email),
      contact_name: metaValue(contact?.fullName),
      contact_phone: metaValue(contact?.phone),
      ship_name: metaValue(shipTo?.name),
      ship_phone: metaValue(shipTo?.phone),
      ship_address1: metaValue(shipTo?.address1),
      ship_address2: metaValue(shipTo?.address2),
      ship_city: metaValue(shipTo?.city),
      ship_state: metaValue(shipTo?.state),
      ship_postal: metaValue(shipTo?.postal),
      ship_country: metaValue(shipTo?.country || "US"),
      cart: metaValue(
        JSON.stringify(
          items.map((x) => ({
            mpn: x.mpn,
            qty: x.quantity,
            cents: x.unitAmount,
            refurb: x.isRefurb,
          }))
        )
      ),
    };

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitAmount,
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : undefined,
            metadata: {
              mpn: item.mpn,
              is_refurb: String(item.isRefurb),
            },
          },
        },
      })
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page" as any,
      customer_email: cleanString(contact?.email) || undefined,
      line_items,
      return_url: `${origin}/success?sid={CHECKOUT_SESSION_ID}`,
      billing_address_collection: "auto",
      metadata,
      payment_intent_data: {
        metadata,
      },
    });

    return NextResponse.json({
      id: session.id,
      client_secret: session.client_secret,
      is_refurb_only: isRefurbOnly,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create Stripe Checkout Session." },
      { status: 500 }
    );
  }
}

