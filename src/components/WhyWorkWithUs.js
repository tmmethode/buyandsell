import React from "react";
import { Shield, Headphones, Lock, ArrowRight } from "lucide-react";

const WhyWorkWithUs = ({ wrapperitem }) => {
  const features = [
    {
      icon: Shield,
      title: "Quality Assurance",
      description:
        "All listings are verified and quality-checked before being published.",
      stats: "99% Verified",
    },
    {
      icon: Headphones,
      title: "Expert Support",
      description:
        "Our team of experts is available 24/7 to assist you with any questions.",
      stats: "24/7 Available",
    },
    {
      icon: Lock,
      title: "Secure Transactions",
      description: "Safe and secure payment processing for all transactions.",
      stats: "100% Secure",
    },
  ];

  const statistics = [
    { number: "500+", label: "Happy Clients" },
    { number: "99%", label: "Success Rate" },
    { number: "24/7", label: "Support" },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50 relative">
      {/* Enhanced Background for Small Devices */}
      <div className="absolute inset-0 lg:hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${wrapperitem})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/95 to-gray-50/90"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                Why Choose Us?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                We provide comprehensive solutions with quality assurance and
                excellent customer support. Our team is dedicated to helping you
                find the perfect match for your needs.
              </p>
            </div>

            {/* Enhanced Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 group cursor-pointer p-4 rounded-lg hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 group-hover:bg-blue-700 group-hover:scale-110 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-300 shadow-lg">
                    <feature.icon className="text-white w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {feature.stats}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-3 gap-4 mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              {statistics.map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-8">
              <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2">
                <span>Get Started Today</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Enhanced Image Section */}
          <div className="hidden lg:block relative">
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl group">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent z-10"></div>

              <img
                src={wrapperitem}
                alt="Modern office building"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />

              {/* Floating badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-20 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-sm font-semibold text-blue-600">
                  Trusted Platform
                </span>
              </div>

              {/* Bottom floating card */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Live Support Available
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-200 rounded-full opacity-60 animate-bounce delay-100"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-300 rounded-full opacity-40 animate-bounce delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyWorkWithUs;
