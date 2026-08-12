import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info — Architecture & Template Distribution | Folio Hub",
  description:
    "Internal dashboard showing the architecture, template distribution, platform routing, and implementation plan for the PortfolioBuilder ecosystem.",
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
