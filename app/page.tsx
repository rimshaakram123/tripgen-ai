import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import AIShowcase from "@/components/landing/AIShowcase";
import DNAPreview from "@/components/landing/DNAPreview";
import CTASection from "@/components/landing/CTASection";
import AmbientBackground from "@/components/ui/AmbientBackground";

export default function Home(){return <main className="relative min-h-screen overflow-hidden"><AmbientBackground/><Navbar/><Hero/><Features/><HowItWorks/><DNAPreview/><AIShowcase/><CTASection/><Footer/></main>}
