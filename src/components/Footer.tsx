import React from 'react';
import { Stethoscope, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          {/* Company Info */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold">Sam Labs</span>
          </div>
          
          <p className="text-gray-400 mb-2">
            Providing accurate and affordable healthcare diagnostics to enhance community well-being.
          </p>
          
          <p className="text-gray-500 text-sm mb-8">
            Serving patients across New York, Chicago, Los Angeles, Miami, and Houston since 2005
          </p>

          {/* GitHub Link */}
          <div className="flex items-center justify-center mb-8">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-white/10 backdrop-blur-lg rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Sam Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;