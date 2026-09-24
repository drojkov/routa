import { Hero } from "@/components/site/hero";
import { ModelFan } from "@/components/site/model-fan";
import { Nav } from "@/components/site/nav";
import { CtaFooter, Faq, Features, ModelStrip, Pricing, Steps, Testimonials } from "@/components/site/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="-mt-16">
        <Hero />
        <ModelStrip />
        <Steps />
        <Testimonials />
        <ModelFan />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <CtaFooter />
    </>
  );
}
