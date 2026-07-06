import MarketingLayoutClient from "./layout-client";

export const metadata = {
  title: { template: "%s · Marketing · RumahPlus", default: "Dashboard Marketing" },
  robots: { index: false, follow: false },
};

export default function MarketingLayout({ children }) {
  return <MarketingLayoutClient>{children}</MarketingLayoutClient>;
}
