import React from "react";
import { Home, Car, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { servicesOfferData } from "./data/mockData";

const ServiceOfferCard = ({
  icon: IconComponent,
  title,
  description,
  onClick,
}) => {
  const colors = {
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
    hover: "group-hover:from-blue-600 group-hover:to-blue-800",
    shadow: "shadow-blue-500/25",
    hoverShadow: "group-hover:shadow-blue-500/40",
    ring: "group-hover:ring-blue-200",
    accent: "text-blue-600",
  };

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center 
        hover:shadow-lg hover:-translate-y-1 hover:ring-2 ${colors.ring} 
        transition-all duration-300 cursor-pointer overflow-hidden`}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-gray-50 to-transparent rounded-full -translate-y-6 translate-x-6 group-hover:scale-125 transition-transform duration-500"></div>

      {/* Icon container with enhanced styling */}
      <div className="relative z-10">
        <div
          className={`w-10 h-10 ${colors.bg} ${colors.hover} ${colors.shadow} ${colors.hoverShadow}
            rounded-lg flex items-center justify-center mx-auto mb-3 
            shadow-lg group-hover:scale-105 group-hover:rotate-2 
            transition-all duration-300 ease-out`}
        >
          <IconComponent className="text-white w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </div>

        {/* Title with enhanced typography */}
        <h3
          className={`text-sm font-semibold text-gray-900 mb-2 
          group-hover:${colors.accent} transition-colors duration-300`}
        >
          {title}
        </h3>

        {/* Description with better spacing */}
        <p className="text-md text-gray-500 leading-relaxed mb-3 group-hover:text-gray-600 transition-colors duration-300 line-clamp-2">
          {description}
        </p>

        {/* Call-to-action arrow */}
        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <span className={`text-xs font-medium ${colors.accent} mr-1`}>
            View
          </span>
          <ArrowRight
            className={`w-3 h-3 ${colors.accent} group-hover:translate-x-0.5 transition-transform duration-200`}
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceOfferCard;
