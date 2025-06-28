import React from 'react';
import { Activity, Scan, Shield, Heart } from 'lucide-react';

const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Activity,
      title: 'Diagnostic Tests',
      description: 'Comprehensive blood work, urine analysis, and specialized diagnostic testing with rapid results.',
      features: ['Blood Chemistry', 'Hormone Testing', 'Allergy Panels', 'Genetic Testing'],
      image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    },
    {
      icon: Scan,
      title: 'Imaging Scans',
      description: 'State-of-the-art imaging technology including MRI, CT, X-ray, and ultrasound services.',
      features: ['MRI Imaging', 'CT Scans', 'X-Ray', 'Ultrasound'],
      image: 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    },
    {
      icon: Shield,
      title: 'Health Checkups',
      description: 'Complete health assessment packages tailored to your age, lifestyle, and health goals.',
      features: ['Annual Physicals', 'Executive Packages', 'Wellness Screenings', 'Preventive Care'],
      image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
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
              className="group p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Service Image */}
              <div className="relative h-48 mb-6 rounded-xl overflow-hidden">
                <img 
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
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
        <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-12 text-center text-white relative overflow-hidden">
          {/* Background Medical Image */}
          <div className="absolute inset-0 opacity-10">
            <img 
              src="https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop" 
              alt="Medical Background"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative z-10">
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
      </div>
    </section>
  );
};

export default ServicesSection;