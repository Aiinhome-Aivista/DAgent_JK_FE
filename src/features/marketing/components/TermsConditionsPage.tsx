import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/src/ui-kit';
import { TwitterIcon } from 'lucide-react';

interface TermsConditionsPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onBackToLanding: () => void;
  onPricingClick?: () => void;
}

export const TermsConditionsPage: React.FC<TermsConditionsPageProps> = ({ onGetStarted, onLogin, onBackToLanding, onPricingClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="theme-landing min-h-screen bg-white text-slate-900 font-sans selection:bg-accent/10 selection:text-accent">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToLanding}>
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
                D
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DAgent</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <button onClick={onBackToLanding} className="hover:text-accent transition-colors">Features</button>
              <button onClick={onBackToLanding} className="hover:text-accent transition-colors">Use Cases</button>
              <button onClick={onBackToLanding} className="hover:text-accent transition-colors">Security</button>
              <button onClick={onPricingClick} className="hover:text-accent transition-colors">Pricing</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={onLogin}
                className="text-sm font-medium text-slate-600 hover:text-accent transition-colors"
              >
                Log in
              </button>
              <Button
                onClick={onGetStarted}
                className="bg-accent hover:bg-accent-hover text-white rounded-full px-6"
              >
                Sign Up
              </Button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 px-4 py-6 space-y-4"
          >
            <button onClick={onBackToLanding} className="block text-lg font-medium w-full text-left">Features</button>
            <button onClick={onBackToLanding} className="block text-lg font-medium w-full text-left">Use Cases</button>
            <button onClick={onBackToLanding} className="block text-lg font-medium w-full text-left">Security</button>
            <button onClick={onPricingClick} className="block text-lg font-medium w-full text-left">Pricing</button>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" onClick={onLogin} className="w-full">Log in</Button>
              <Button onClick={onGetStarted} className="w-full bg-accent text-white">Sign Up</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-8">
          Terms & Conditions
        </h1>
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6 text-justify">
          <p>
            Welcome to <strong>DAgent</strong>. By accessing or using our AI data analysis platform, 
            you agree to be bound by these Terms and Conditions. Please read them carefully.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By registering for an account, subscribing to our services, or connecting your data sources, 
            you agree to abide by these terms. If you do not agree, you may not use the DAgent platform.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Use of Service</h2>
          <p>
            DAgent provides AI-powered data extraction, analysis, and visualization tools. You agree to use 
            the service only for lawful purposes and in accordance with your local regulations. You must not 
            use DAgent to process data that you do not have the right or authorization to access.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Data Ownership and Security</h2>
          <p>
            You retain all rights to the data you connect to DAgent. We claim no ownership over your 
            databases, spreadsheets, or query results. You are responsible for ensuring the security of your 
            account credentials and the API keys you provide to connect data sources.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Acceptable Usage and Limits</h2>
          <p>
            Depending on your subscription plan, certain usage limits apply (e.g., query volume, connected sources). 
            DAgent reserves the right to rate-limit or suspend accounts that exhibit abusive usage patterns 
            that degrade the performance of the platform for other users.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Disclaimer of Warranties</h2>
          <p>
            DAgent relies on underlying AI models to interpret queries and generate insights. While we strive 
            for high accuracy, the service is provided "as is". DAgent makes no warranties that the generated 
            insights, SQL queries, or data visualizations will be 100% error-free. Users are advised to verify 
            critical business insights.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            In no event shall DAgent Labs, Inc. be liable for any indirect, incidental, special, or consequential 
            damages, including loss of profits, data, or business opportunities, arising out of your use of 
            the DAgent platform.
          </p>

          <p className="mt-12 text-sm text-slate-500">
            Last updated: August 28, 2026. If you have any questions regarding these terms, contact <a href="mailto:syed.arshad@aiinhome.com" className="text-accent hover:underline">syed.arshad@aiinhome.com</a>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-8">
          <div className="lg:w-1/3 flex flex-col items-start space-y-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToLanding}>
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xl">
                D
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DAgent</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 mb-4 text-opacity-50">Connect with us</p>
              <div className="flex gap-4 text-slate-400">
                <Twitter className="w-5 h-5 cursor-not-allowed opacity-50" />
                <Github className="w-5 h-5 cursor-not-allowed opacity-50" />
                <Linkedin className="w-5 h-5 cursor-not-allowed opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-sm mb-6 text-slate-900">Company</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><a href="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" className="text-accent transition-colors">Terms & Conditions</a></li>
                <li><a href="mailto:syed.arshad@aiinhome.com" className="hover:text-accent transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-6 text-slate-900">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onPricingClick?.(); }} className="hover:text-accent transition-colors">Pricing</a></li>

                <li><a href="/help-center" className="hover:text-accent transition-colors">Help Center</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-200/60 text-center">
          <p className="text-sm text-slate-500">© 2026 DAgent Labs, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
