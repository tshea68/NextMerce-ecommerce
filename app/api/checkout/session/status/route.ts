import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY is missing on the server." },
        { status: 500 }
      );
    }

    const sid =
      req.nextUrl.searchParams.get("sid") ||
      req.nextUrl.searchParams.get("session_id");

    if (!sid) {
      return NextResponse.json({ error: "Missing session id." }, { status: 400 });
    }

    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.retrieve(sid, {
      expand: ["payment_intent", "line_items"],
    });

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const paymentIntentStatus =
      typeof session.payment_intent === "string"
        ? null
        : session.payment_intent?.status || null;

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      metadata: session.metadata,
      payment_intent: paymentIntent,
      payment_intent_status: paymentIntentStatus,
      line_items: session.line_items,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Session lookup failed." },
      { status: 500 }
    );
  }
}
