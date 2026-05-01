import cleanedHeroLogos from "@/public/hero-logos-clean/manifest.json";

export type HeroLogo = {
  id?: number | null;
  brand_long: string | null;
  brand: string | null;
  brand_code: string | null;
  image_url: string | null;
  brand_norm?: string | null;
  hero_enabled: boolean | null;
  hero_priority: number | null;
  clean_image_url?: string | null;
};

export async function getHeroLogos(): Promise<HeroLogo[]> {
  return (cleanedHeroLogos as HeroLogo[])
    .filter((logo) => logo.clean_image_url || logo.image_url)
    .map((logo) => ({
      ...logo,
      image_url: logo.clean_image_url || logo.image_url,
    }));
}
