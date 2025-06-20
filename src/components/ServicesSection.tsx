import React from 'react';
import { Activity, Scan, Shield, Heart } from 'lucide-react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Activity,
      title: 'Diagnostic Tests',
      description: 'Comprehensive blood work, urine analysis, and specialized diagnostic testing with rapid results.',
      features: ['Blood Chemistry', 'Hormone Testing', 'Allergy Panels', 'Genetic Testing']
    },
    {
      icon: Scan,
      title: 'Imaging Scans',
      description: 'State-of-the-art imaging technology including MRI, CT, X-ray, and ultrasound services.',
      features: ['MRI Imaging', 'CT Scans', 'X-Ray', 'Ultrasound']
    },
    {
      icon: Shield,
      title: 'Health Checkups',
      description: 'Complete health assessment packages tailored to your age, lifestyle, and health goals.',
      features: ['Annual Physicals', 'Executive Packages', 'Wellness Screenings', 'Preventive Care']
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our <span className="text-blue-600">Services</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive healthcare diagnostics powered by cutting-edge technology and expert medical professionals
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <service.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
              
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-12 text-center text-white">
          <Heart className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h3 className="text-3xl font-bold mb-4">Ready to prioritize your health?</h3>
          <p className="text-xl mb-8 opacity-90">
            Let our AI assistant help you choose the right diagnostic services for your needs
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg">
            Book Your Appointment
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;