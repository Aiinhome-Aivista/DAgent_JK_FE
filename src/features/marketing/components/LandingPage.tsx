import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Database,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Cpu,
  CheckCircle2,
  Menu,
  X,
  Play,
  Twitter,
  Github,
  Linkedin,
  TwitterIcon
} from 'lucide-react';
import { Button, Badge } from '@/src/ui-kit';
// import image1 from '@/src/assets/images/landing1.jpg';
// import image2 from '@/src/assets/images/landing2.jpg';
import image1 from '../../../assets/images/landing1.jpg';
import image2 from '../../../assets/images/landing2.jpg';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDashboardClick?: () => void;
  onPricingClick?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onDashboardClick, onPricingClick }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
              <a href="#features" className="hover:text-accent transition-colors">Features</a>
              <a href="#use-cases" className="hover:text-accent transition-colors">Use Cases</a>
              <a href="#security" className="hover:text-accent transition-colors">Security</a>
              {/* <button onClick={onPricingClick} className="hover:text-accent transition-colors">Pricing</button> */}
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
            <a href="#features" className="block text-lg font-medium">Features</a>
            <a href="#use-cases" className="block text-lg font-medium">Use Cases</a>
            <a href="#security" className="block text-lg font-medium">Security</a>
            {/* <button onClick={onPricingClick} className="block text-lg font-medium w-full text-left">Pricing</button> */}
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="outline" onClick={onLogin} className="w-full">Log in</Button>
              <Button onClick={onGetStarted} className="w-full bg-accent text-white">Sign Up</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* <Badge variant="outline" className="bg-accent/5 text-accent border-accent/10 mb-6 px-4 py-1 rounded-full">
              New: DAgent Business Plan →
            </Badge> */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Ask Your Data Anything with AI
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
              No coding required. DAgent connects to your databases, spreadsheets, and apps to help you find answers faster.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={onGetStarted}
              className="w-full sm:w-auto h-14 px-10 text-lg bg-accent hover:bg-accent-hover text-white rounded-xl shadow-xl shadow-accent/20"
            >
              Try DAgent free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-14 px-10 text-lg rounded-xl border-slate-200 text-slate-900"
            >
              Talk to Founder <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50 p-2"
          >
            <img
              src={image1}
              alt="DAgent Dashboard"
              className="rounded-xl w-full h-auto shadow-inner"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
            Loved by 2,000,000+ users and trusted by teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            {['PandaDoc', 'Zapier', 'NVIDIA', '11x', 'GUESS', 'Toast', 'Avadel', 'SimpliSafe'].map(logo => (
              <span key={logo} className="text-xl font-bold text-slate-600">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Add data, ask questions</h2>
            <p className="text-slate-600">Ask for what you want and DAgent analyzes the data for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Connect all your data sources',
                desc: 'Connect with data sources like databases, spreadsheets, and more.',
                icon: <Database className="w-8 h-8 text-accent" />
              },
              {
                step: '2',
                title: 'Ask for analysis',
                desc: 'You provide the questions, DAgent handles the analysis.',
                icon: <MessageSquare className="w-8 h-8 text-accent" />
              },
              {
                step: '3',
                title: 'Get results, instantly',
                desc: 'Choose from charts, tables or full reports tailored to your data.',
                icon: <BarChart3 className="w-8 h-8 text-accent" />
              }
            ].map((item) => (
              <div key={item.step} className="space-y-6">
                <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center text-accent font-bold">
                  {item.step}
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 h-64 flex flex-col justify-center border border-slate-100">
                  {item.icon}
                  <h3 className="text-xl font-bold mt-4 mb-2 text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button onClick={onGetStarted} className="bg-accent text-white px-8 h-12 rounded-lg">
              Get started for free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Detailed Feature 1 */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-slate-900">Chat with your data</h2>
            <p className="text-lg text-slate-600">
              From spreadsheets to databases, ask questions in natural language and get instant insights.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accent w-5 h-5" />
                <span className="text-slate-700">Predict future trends with AI</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accent w-5 h-5" />
                <span className="text-slate-700">Generate complex SQL without coding</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accent w-5 h-5" />
                <span className="text-slate-700">Visualize data in any format</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
            <img
              src={image2}
              alt="Chat with data"
              className="w-full h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm italic text-slate-700">
            "I'm big on data analysis (spreadsheets DAU!), but often find myself frustrated by errors and slowness in trying to even analyze a basic spreadsheet in ChatGPT. DAgent is good at this, and has only gotten better over time. It's both very reliable, and can generate helpful ideas for extra analysis as well as visualizations."
            <div className="mt-6 flex items-center gap-3 not-italic">
              <div className="w-10 h-10 rounded-full bg-slate-200" >
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaMD1wXeLS4UbiMsMuHrlOL4pPIAlhYZZlYg&s" alt="Person" />
              </div>
              <div>
                <p className="font-bold text-sm">Alex Moore</p>
                <p className="text-xs text-slate-500">AI Partner, Andreessen Horowitz</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm italic text-slate-700">
            "DAgent.ai completely changed how I approach growth. I can analyze multiple datasets at once and turn them into insights for customer acquisition, retention, and marketing campaigns, all without waiting on engineering or hiring data analysts. I've used it at two companies now, and it's saved us hours while helping us make smarter decisions every day."
            <div className="mt-6 flex items-center gap-3 not-italic">
              <div className="w-10 h-10 rounded-full bg-slate-200" >
                <img src="https://cdn.prod.website-files.com/6411878c9450fd34ae2ad846/66f41ff7bad31e6491271fec_2.png" alt="Person" />
              </div>
              <div>
                <p className="font-bold text-sm">Amit Goalia</p>
                <p className="text-xs text-slate-500">Head of Growth, HomeFromCollege</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold">DAgent ensures your data is private and secure.</h2>
          <p className="text-slate-400 text-lg">
            Your data stays private and is never used to train AI. DAgent is compliant with industry-leading standards including SOC 2 Type II, TX-RAMP, and GDPR.
          </p>
          <div className="flex justify-center gap-12 pt-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Shield className="w-10 h-10 text-accent" />
              </div>
              <span className="text-sm font-bold text-white">SOC 2 Type 2</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Shield className="w-10 h-10 text-accent" />
              </div>
              <span className="text-sm font-bold text-white">GDPR</span>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 mt-8">
            Learn more <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900">A DAgent for every job</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Finance analyst', desc: 'Balance sheet creation for a SaaS company' },
              { title: 'Marketing', desc: 'Acquisition channel efficiency analysis' },
              { title: 'Operations', desc: 'Forecasting and inventory optimization' },
              { title: 'Business Owners', desc: 'Cash flow forecasting and budgeting' },
              { title: 'Data science', desc: 'Data cleaning and preparation' },
              { title: 'Scientific research', desc: 'Correlation matrix on genetic dataset' }
            ].map(job => (
              <div key={job.title} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg mb-2 text-slate-900">{job.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{job.desc}</p>
                <button className="text-accent text-sm font-bold flex items-center gap-1">
                  Try it out <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-accent/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold tracking-tight text-slate-900">Get started for free</h2>
          <p className="text-xl text-slate-600">With DAgent, you can get the most out of your data.</p>
          <Button
            onClick={onGetStarted}
            className="h-14 px-10 text-lg bg-accent hover:bg-accent-hover text-white rounded-xl shadow-xl shadow-accent/20"
          >
            Try DAgent free
          </Button>
        </div>
      </section>

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
                {/* <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); onPricingClick?.(); }} className="hover:text-accent transition-colors">Pricing</a></li> */}

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
