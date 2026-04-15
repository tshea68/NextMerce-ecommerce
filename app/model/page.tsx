import ModelPageClient from "./ModelPage.client";
import JsonLd from "@/components/seo/JsonLd";
import { buildModelItemListSchema } from "@/lib/seo/schema";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "https://api.appliancepartgeeks.com"
).replace(/\/+$/, "");

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://next.appliancepartgeeks.com";

type AnyObj = Record<string, any>;

function cleanStr(v: any) {
  return String(v ?? "").trim();
}

function normalize(v: any) {
  return cleanStr(v).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getModelSeoData(modelNumber: string) {
  if (!modelNumber) {
    return {
      model: null as AnyObj | null,
      parts: { all: [] as AnyObj[], priced: [] as AnyObj[] },
    };
  }

  const [model, parts] = await Promise.all([
    fetchJson(`${API_BASE}/api/models/search?q=${encodeURIComponent(modelNumber)}`),
    fetchJson(
      `${API_BASE}/api/parts/for-model/${encodeURIComponent(modelNumber)}`
    ),
  ]);

  return {
    model: model && model.model_number ? model : null,
    parts: {
      all: Array.isArray(parts?.all) ? parts.all : [],
      priced: Array.isArray(parts?.priced) ? parts.priced : [],
    },
  };
}

function buildModelTitle(model: AnyObj | null, modelNumber: string) {
  const brand = cleanStr(model?.brand);
  const applianceType = cleanStr(model?.appliance_type);
  const modelNum = cleanStr(model?.model_number) || modelNumber;

  const bits = [brand, modelNum, applianceType, "Parts Diagram & Replacement Parts"].filter(Boolean);
  return bits.join(" ");
}

function buildModelDescription(model: AnyObj | null, partsCount: number, modelNumber: string) {
  const brand = cleanStr(model?.brand);
  const applianceType = cleanStr(model?.appliance_type);
  const modelNum = cleanStr(model?.model_number) || modelNumber;

  return `Find diagrams and replacement parts for ${[brand, modelNum, applianceType]
    .filter(Boolean)
    .join(" ")}. Browse ${partsCount} known parts, priced parts, and compatible OEM replacement components.`;
}

function buildBreadcrumbSchema(model: AnyObj | null, modelNumber: string) {
  const modelNum = cleanStr(model?.model_number) || modelNumber;
  const brand = cleanStr(model?.brand);
  const applianceType = cleanStr(model?.appliance_type);

  const items = [
    { label: "Home", href: "/" },
    { label: "Model", href: "/model" },
    ...(brand ? [{ label: brand }] : []),
    ...(applianceType ? [{ label: applianceType }] : []),
    ...(modelNum ? [{ label: modelNum }] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item:
        idx < items.length - 1
          ? `${SITE_URL}${item.href || ""}`
          : undefined,
    })),
  };
}



export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const raw = typeof sp.model === "string" ? sp.model : "";
  const modelNumber = cleanStr(raw);

  if (!modelNumber) {
    return {
      title: "Model Parts Lookup",
      description: "Search appliance model diagrams and replacement parts.",
    };
  }

  const { model, parts } = await getModelSeoData(modelNumber);

  return {
    title: buildModelTitle(model, modelNumber),
    description: buildModelDescription(model, parts.all.length, modelNumber),
    alternates: {
      canonical: `/model?model=${encodeURIComponent(modelNumber)}`,
    },
  };
}

export default async function ModelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const raw = typeof sp.model === "string" ? sp.model : "";
  const modelNumber = cleanStr(raw);

  const { model, parts } = await getModelSeoData(modelNumber);

  const canonicalUrl = modelNumber
    ? `${SITE_URL}/model?model=${encodeURIComponent(modelNumber)}`
    : `${SITE_URL}/model`;

  const breadcrumbSchema = modelNumber
    ? buildBreadcrumbSchema(model, modelNumber)
    : null;

  const itemListSchema =
    modelNumber && parts.all.length
      ? buildModelItemListSchema(parts.all.slice(0, 50), SITE_URL, modelNumber)
      : null;

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <ModelPageClient />
    </>
  );
}