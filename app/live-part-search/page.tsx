import LivePartSearchClient from "@/components/live-search/LivePartSearchClient";

export const metadata = {
  title: "Live Part Search | Appliance Part Geeks",
  description: "Compare APG inventory against OEM and distributor part sources.",
};

export default function LivePartSearchPage() {
  return <LivePartSearchClient />;
}
