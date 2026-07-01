import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProofBar } from "@/components/ProofBar";
import { Capabilities } from "@/components/Capabilities";
import { Work } from "@/components/Work";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProofBar />
        <Capabilities />
        <Work />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
