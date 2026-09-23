import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { purchaseFromStripe, type Purchase } from "@/lib/purchase";

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

    let sid =
      req.nextUrl.searchParams.get("sid") ||
      req.nextUrl.searchParams.get("session_id");

    const stripe = new Stripe(secretKey);
    const pi = req.nextUrl.searchParams.get("pi");
    // Legacy PaymentIntent returns still use Stripe-verified session data for
    // analytics. This lookup never creates or modifies a payment or order.
    if (!sid && pi && /^pi_[A-Za-z0-9]+$/.test(pi)) {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 });
      sid = sessions.data[0]?.id || null;
    }
    if (!sid) {
      return NextResponse.json({ error: "Missing session id." }, { status: 400 });
    }

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

    let purchase: Purchase | null = null;
    if (session.payment_status === "paid" || paymentIntentStatus === "succeeded") {
      try {
        const lines: Stripe.LineItem[] = [];
        for await (const line of stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
          expand: ["data.price.product"],
        })) lines.push(line);
        purchase = purchaseFromStripe(session, lines);
      } catch {
        // Analytics enrichment must not prevent the existing confirmation UI.
        if (process.env.NODE_ENV === "development") {
          console.debug("[purchase] Stripe line-item lookup failed");
        }
      }
    }

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
      purchase,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Session lookup failed." },
      { status: 500 }
    );
  }
}
