import Hero from "@/components/sections/Hero";
import WhatWeBuild from "@/components/sections/WhatWeBuild";
import Work from "@/components/sections/Work";
import DualEngine from "@/components/sections/DualEngine";
import WhySadeem from "@/components/sections/WhySadeem";
import HowWeWork from "@/components/sections/HowWeWork";
import About from "@/components/sections/About";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <WhatWeBuild />
      <DualEngine />
      <WhySadeem />
      <HowWeWork />
      <Work />
      <About />
      <CTA />
    </>
  );
}
