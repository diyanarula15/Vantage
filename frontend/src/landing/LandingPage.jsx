import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import { HowItWorks, Comparison, FeaturesGrid, IntegrationsGrid } from './Sections';
import { PersonaTabs, SlackShowcase } from './Interactive';
import { Testimonials, FAQ, FinalCTA, Footer } from './Social';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Announcement Bar + 2. Navbar */}
      <Navbar />

      {/* 3. Hero Section */}
      <Hero />

      {/* 4. How It Works */}
      <HowItWorks />

      {/* 5. Before vs After Comparison */}
      <Comparison />

      {/* 8. Why This is Different — Features Grid */}
      <FeaturesGrid />

      {/* 9. Persona / Use-Case Tabs */}
      <PersonaTabs />

      {/* 10. Slack Conversation Showcase */}
      <SlackShowcase />

      {/* 11. Integrations / Data Sources */}
      <IntegrationsGrid />

      {/* 13. FAQ Accordion */}
      <FAQ />

      {/* 14. Final CTA */}
      <FinalCTA />

      {/* 15. Footer */}
      <Footer />
    </div>
  );
}
