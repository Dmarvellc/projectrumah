import DeveloperLayoutClient from "./layout-client";

export const metadata = {
  title: { template: "%s · Developer · RumahPlus", default: "Dashboard Developer" },
  robots: { index: false, follow: false },
};

export default function DeveloperLayout({ children }) {
  return <DeveloperLayoutClient>{children}</DeveloperLayoutClient>;
}
