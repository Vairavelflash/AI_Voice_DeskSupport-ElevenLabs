import React, { useEffect, useState } from 'react';
import { Stethoscope, Phone, Play } from 'lucide-react';

interface HeaderProps {
  onOpenAICall: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAICall }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-teal-900">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-teal-400 rounded-full blur-3xl opacity-25 animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-lg rounded-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Sam Labs</span>
          </div>
          
          <button 
            onClick={onOpenAICall}
            className="flex items-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <Phone className="w-5 h-5" />
            <span>Call AI Assistant</span>
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <div 
        className="relative z-10 text-center max-w-4xl mx-auto px-6"
        style={{
          transform: `translateY(${scrollY * -0.2}px)`,
        }}
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          AI-Powered
          <span className="block bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Healthcare Diagnostics
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience the future of medical diagnostics with our AI front desk assistant. 
          Get personalized guidance for tests, scans, and health packages.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button 
            onClick={onOpenAICall}
            className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full text-white font-semibold text-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
          >
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Talk to Our AI Assistant</span>
          </button>
          
          <button className="px-8 py-4 border-2 border-white/30 rounded-full text-white font-semibold text-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105">
            Learn More
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;