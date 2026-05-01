import React, { useState, useEffect } from "react";
import base from "../config";

const PropertyStats = () => {
  const [stats, setStats] = useState({
    houses: 0,
    cars: 0,
    plots: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchStats();
    setIsVisible(true);
  }, []);

  const fetchStats = async () => {
    try {
      const [housesRes, carsRes, plotsRes] = await Promise.all([
        fetch(`${base}/api/houses?limit=1000`),
        fetch(`${base}/api/cars?limit=1000`),
        fetch(`${base}/api/plots?limit=1000`),
      ]);

      const housesData = housesRes.ok ? await housesRes.json() : { houses: [] };
      const carsData = carsRes.ok ? await carsRes.json() : { cars: [] };
      const plotsData = plotsRes.ok ? await plotsRes.json() : { plots: [] };

      const houseCount = housesData.houses?.length || 0;
      const carCount = carsData.cars?.length || 0;
      const plotCount = plotsData.plots?.length || 0;

      console.log("PropertyStats API counts:", {
        houses: houseCount,
        cars: carCount,
        plots: plotCount,
      });

      setStats({
        houses: houseCount,
        cars: carCount,
        plots: plotCount,
      });
    } catch (error) {
      console.error("PropertyStats - Error:", error);
    }
  };

  const propertyTypes = [
    {
      label: "Houses for Sale",
      count: stats.houses,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      gradient: "from-blue-500 to-blue-700",
      bgGlow: "bg-blue-500/20",
      shadowColor: "shadow-blue-500/30",
    },
    {
      label: "Cars for Sale",
      count: stats.cars,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/20",
      shadowColor: "shadow-emerald-500/30",
    },
    {
      label: "Plots for Sale",
      count: stats.plots,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/20",
      shadowColor: "shadow-amber-500/30",
    },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-200/50 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-sm font-medium text-blue-700">Live Statistics</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Available Properties
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of listings across different categories
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {propertyTypes.map((property, index) => (
            <div
              key={index}
              className={`group relative transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Card */}
              <div className={`relative h-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/80 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${property.shadowColor}`}>
                {/* Decorative gradient blob */}
                <div className={`absolute -top-4 -right-4 w-24 h-24 ${property.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Icon container */}
                <div className={`relative inline-flex items-center justify-center w-8 h-8 p-2 rounded-xl bg-gradient-to-br ${property.gradient} text-white shadow-lg mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {property.icon}
                </div>

                {/* Count with animated background */}
                <div className="relative mb-2">
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    {property.count.toLocaleString()}
                  </span>
                  <span className="text-lg font-semibold text-gray-400 ml-1">+</span>
                </div>

                {/* Label */}
                <h3 className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors duration-300">
                  {property.label}
                </h3>

                {/* Hover arrow indicator */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <svg className={`w-5 h-5 bg-gradient-to-r ${property.gradient} bg-clip-text`} style={{ color: 'currentColor' }} fill="none" viewBox="0 0 24 24" stroke="url(#gradient)">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyStats;
