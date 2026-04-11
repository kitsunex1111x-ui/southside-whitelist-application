import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LiveCounters from "@/components/LiveCounters";
import FeaturesGrid from "@/components/FeaturesGrid";
import FoundersSection from "@/components/FoundersSection";
import HowToJoin from "@/components/HowToJoin";
import RecentlyAccepted from "@/components/RecentlyAccepted";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyApply from "@/components/StickyApply";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LiveCounters />
      <FeaturesGrid />
      <FoundersSection />
      <HowToJoin />
      <RecentlyAccepted />
      <FinalCTA />
      <Footer />
      <StickyApply />
    </div>
  );
};

export default Index;
