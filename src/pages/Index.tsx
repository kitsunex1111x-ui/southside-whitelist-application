import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import StickyApply from "@/components/StickyApply";

// Lazy load below-fold components for faster initial paint
const FeaturesGrid = lazy(() => import("@/components/FeaturesGrid"));
const StoreSection = lazy(() => import("@/components/StoreSection"));
const FoundersSection = lazy(() => import("@/components/FoundersSection"));
const HowToJoin = lazy(() => import("@/components/HowToJoin"));
const RecentlyAccepted = lazy(() => import("@/components/RecentlyAccepted"));
const StreamersSection = lazy(() => import("@/components/StreamersSection"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));

const SectionLoader = () => (
  <div className="w-full h-32 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Suspense fallback={<SectionLoader />}>
        <FeaturesGrid />
        <StoreSection />
        <FoundersSection />
        <HowToJoin />
        <RecentlyAccepted />
        <StreamersSection />
        <FinalCTA />
      </Suspense>
      <Footer />
      <StickyApply />
    </div>
  );
};

export default Index;
