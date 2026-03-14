import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden">{children}</main>
      <Footer />
    </>
  );
}
