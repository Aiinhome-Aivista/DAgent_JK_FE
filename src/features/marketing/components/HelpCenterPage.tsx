import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/src/ui-kit';
import { TwitterIcon } from 'lucide-react';

interface HelpCenterPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onBackToLanding: () => void;
  onPricingClick?: () => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onGetStarted, onLogin, onBackToLanding, onPricingClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="theme-landing min-h-screen bg-white text-slate-900 font-sans selection:bg-accent/10 selection:text-accent">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
                D
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">DAgent</span>
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="/#features" className="hover:text-accent transition-colors">Features</a>
              <a href="/#use-cases" className="hover:text-accent transition-colors">Use Cases</a>
              <a href="/#security" className="hover:text-accent transition-colors">Security</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onPricingClick?.(); }} className="hover:text-accent transition-colors cursor-pointer">Pricing</a>
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
            <a href="/#features" className="block text-lg font-medium w-full text-left">Features</a>
            <a href="/#use-cases" className="block text-lg font-medium w-full text-left">Use Cases</a>
            <a href="/#security" className="block text-lg font-medium w-full text-left">Security</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onPricingClick?.(); }} className="block text-lg font-medium w-full text-left text-accent">Pricing</a>
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
          Help Center
        </h1>
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6 text-justify">
          <p className="text-lg">
            Welcome to the DAgent Help Center. Find answers to common questions and learn how to get the most out of your AI data assistant.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">How do I connect a new database?</h3>
              <p className="mt-2">
                Log into your dashboard, navigate to the "Connectors" tab, and select your database type. You will need your connection string and credentials.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Is my data secure?</h3>
              <p className="mt-2">
                Yes. DAgent acts as a read-only bridge to your data. We do not store your raw database tables, and your data is never used to train our AI models.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">How do I invite team members?</h3>
              <p className="mt-2">
                Depending on your pricing plan, you can invite team members from the Workspace Settings in your admin panel.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Still need help?</h2>
          <p>
            Our support team is here for you. Drop us an email at <a href="mailto:syed.arshad@aiinhome.com" className="text-accent hover:underline">syed.arshad@aiinhome.com</a> and we will get back to you within 24 hours.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-8">
          <div className="lg:w-1/3 flex flex-col items-start space-y-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xl">
                D
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">DAgent</span>
            </a>
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
                <li><a href="/terms-and-conditions" className="hover:text-accent transition-colors">Terms & Conditions</a></li>
                <li><a href="mailto:syed.arshad@aiinhome.com" className="hover:text-accent transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-6 text-slate-900">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onPricingClick?.(); }} className="hover:text-accent transition-colors">Pricing</a></li>

                <li><a href="/help-center" className="text-accent transition-colors">Help Center</a></li>
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
