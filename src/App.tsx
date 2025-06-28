import React, { useState } from 'react';
import Header from './components/Header';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import AICallModal from './components/AICallModal';
import Footer from './components/Footer';
import CallScreen from "./components/CallScreen";
import type { Company } from './types';

const company: Company = {
  name: 'Sam Labs',
  established: 'Jan 15, 2005',
  branches: ['New York', 'Chicago', 'Los Angeles', 'Miami', 'Houston'],
  employees: 250,
  mission: 'Providing accurate and affordable healthcare diagnostics to enhance community well-being.',
  services: ['Diagnostic tests', 'Imaging scans', 'Health checkup packages']
};

function App() {
  const [isAICallOpen, setIsAICallOpen] = useState(false);

  const handleOpenAICall = () => {
    setIsAICallOpen(true);
  };

  const handleCloseAICall = () => {
    setIsAICallOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header onOpenAICall={handleOpenAICall} />
      <AboutSection company={company} />
      <ServicesSection />
      <Footer />
      
      {/* <AICallModal 
        isOpen={isAICallOpen} 
        onClose={handleCloseAICall} 
      /> */}
      <CallScreen/>
    </div>
  );
}

export default App;