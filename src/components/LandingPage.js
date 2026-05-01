import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ItemCard from "./ItemCard";
import {
  ChevronRight,
  Home,
  Car,
  MapPin,
  Briefcase,
  Star,
  Users,
  Timer,
  Shield,
  Headphones,
  Lock,
  ArrowRight,
} from "lucide-react";

import wrapperitem from "./images/wrapperitem.png";
import ServiceCard from "./ServiceCard";
import ServiceOfferCard from "./ServiceOfferCard";
import PropertyStats from "./PropertyStats";

import { useNavigate } from 'react-router-dom';
import apiBaseUrl from '../config';

const LandingPage = ({ onSectionChange }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeService, setActiveService] = useState(0);

  // New state for API data
  const [featuredHouses, setFeaturedHouses] = useState([]);
  const [luxuryHouses, setLuxuryHouses] = useState([]);
  const [featuredCars, setFeaturedCars] = useState([]);
  const [featuredPlots, setFeaturedPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure all arrays are always arrays
  const safeFeaturedHouses = Array.isArray(featuredHouses) ? featuredHouses : [];
  const safeLuxuryHouses = Array.isArray(luxuryHouses) ? luxuryHouses : [];
  const safeFeaturedCars = Array.isArray(featuredCars) ? featuredCars : [];
  const safeFeaturedPlots = Array.isArray(featuredPlots) ? featuredPlots : [];

  // Fetch featured data from backend API
  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        setLoading(true);
        console.log('Fetching featured data...');

        // Fetch houses and sort them
        const housesResponse = await fetch(`${apiBaseUrl}/api/houses`);
        if (!housesResponse.ok) {
          throw new Error(`Houses API error: ${housesResponse.status}`);
        }
        const housesData = await housesResponse.json();
        const allHouses = housesData.houses || [];
        console.log('Houses fetched:', allHouses.length);

        // Filter out rental category entirely
        const nonRental = allHouses.filter(h => (h.category || '').toLowerCase() !== 'inzu ikodeshwa');

        // Group strictly by category labels defined in admin panel (no price-based mixing)
        const luxuryGroup = nonRental.filter(h => h.category === 'Luxury House').slice(0, 3);
        const middleGroup = nonRental.filter(h => h.category === 'Middle house').slice(0, 3);
        // Commercial properties (currently not displayed in UI sections but reserved for future)
        // const commercialGroup = nonRental.filter(h => h.category === 'Commercial Property').slice(0, 3);

        setFeaturedHouses(middleGroup); // Middle Houses section
        setLuxuryHouses(luxuryGroup);   // Luxury Houses section

        // Fetch cars and sort by latest year
        const carsResponse = await fetch(`${apiBaseUrl}/api/cars`);
        if (!carsResponse.ok) {
          throw new Error(`Cars API error: ${carsResponse.status}`);
        }
        const carsData = await carsResponse.json();
        const allCars = carsData.cars || [];
        const latestCars = [...allCars].sort((a, b) => b.year - a.year).slice(0, 3);
        setFeaturedCars(latestCars);
        console.log('Cars fetched:', allCars.length);

        // Fetch plots and sort by latest creation (using _id as proxy for creation date)
        const plotsResponse = await fetch(`${apiBaseUrl}/api/plots`);
        if (!plotsResponse.ok) {
          throw new Error(`Plots API error: ${plotsResponse.status}`);
        }
        const plotsData = await plotsResponse.json();
        const allPlots = plotsData.plots || [];
        // Sort by _id (newer MongoDB ObjectIds are "greater" than older ones)
        const latestPlots = [...allPlots].sort((a, b) => {
          // Convert ObjectId to timestamp for proper sorting
          const aTime = new Date(parseInt(a._id.substring(0, 8), 16) * 1000);
          const bTime = new Date(parseInt(b._id.substring(0, 8), 16) * 1000);
          return bTime - aTime;
        }).slice(0, 3);
        setFeaturedPlots(latestPlots);
        console.log('Plots fetched:', allPlots.length);

        console.log('All data fetched successfully');

      } catch (err) {
        console.error('Error fetching featured data:', err);
        setError(err.message);

        // Set fallback data to prevent empty page
        setFeaturedHouses([]);
        setLuxuryHouses([]);
        setFeaturedCars([]);
        setFeaturedPlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedData();
  }, []);

  // Handle service click navigation
  const handleServiceClick = (service) => {
    switch (service) {
      case "House Sales":
        onSectionChange("house");
        break;
      case "Car Sales":
        onSectionChange("car");
        break;
      case "Plot Sales":
        onSectionChange("plot");
        break;
      case "Job Services":
        onSectionChange("job");
        break;
      default:
        break;
    }
  };

  // Handle item navigation for different sections
  const handleItemClick = (item, section) => {
    // Store the selected item in localStorage so the target page can access it
    localStorage.setItem('selectedItem', JSON.stringify(item));
    localStorage.setItem('selectedItemType', section);

    switch (section) {
      case "house":
        // Navigate to house details page (with id)
        if (item && (item._id || item.id)) {
          // store selected item and navigate directly to detail route
          localStorage.setItem('selectedItem', JSON.stringify(item));
          localStorage.setItem('selectedItemType', section);
          navigate(`/house/${item._id || item.id}`);
        } else {
          onSectionChange("house");
        }
        break;
      case "car":
        // Navigate to car details page (with id)
        if (item && (item._id || item.id)) {
          localStorage.setItem('selectedItem', JSON.stringify(item));
          localStorage.setItem('selectedItemType', section);
          navigate(`/car/${item._id || item.id}`);
        } else {
          onSectionChange("car");
        }
        break;
      case "plot":
        // Navigate to plot details page (with id)
        if (item && (item._id || item.id)) {
          localStorage.setItem('selectedItem', JSON.stringify(item));
          localStorage.setItem('selectedItemType', section);
          navigate(`/plot/${item._id || item.id}`);
        } else {
          onSectionChange("plot");
        }
        break;
      case "job":
        // Navigate to job details page (with id)
        if (item && (item._id || item.id)) {
          localStorage.setItem('selectedItem', JSON.stringify(item));
          localStorage.setItem('selectedItemType', section);
          navigate(`/job/${item._id || item.id}`);
        } else {
          onSectionChange("job");
        }
        break;
      default:
        break;
    }
  };

  const services = [
    { icon: Home, text: "Rent Cars", color: "text-blue-500" },
    { icon: Car, text: "Buy Homes & Plots", color: "text-green-500" },
  ];

  const stats = [
    { icon: Users, number: "5K+", label: "Happy Customers" },
    { icon: Home, number: "1.2K+", label: "Properties Sold" },
    { icon: Briefcase, number: "15+", label: "Years of Experience" },
    { icon: Timer, number: "24/7", label: "Customer Support" },
  ];

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

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Note: Loading state will be shown inline in the listing sections instead of full-page reload

  // Error state
  if (error) {
    console.log('LandingPage: Error state:', error);
    return (
      <div className="min-h-screen bg-white">
        <Header onSectionChange={onSectionChange} activeSection="home" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }



  // Fallback render to ensure something always shows
  if (safeFeaturedHouses.length === 0 && safeLuxuryHouses.length === 0 && safeFeaturedCars.length === 0 && safeFeaturedPlots.length === 0) {
    console.log('LandingPage: No data available, showing fallback');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Header onSectionChange={onSectionChange} activeSection="home" />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            {/* Loading Spinner */}
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Loading Text */}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Properties</h2>
            <p className="text-gray-500 mb-6">Please wait while we fetch the latest listings...</p>

            {/* Animated Dots */}
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            {/* Retry Button (subtle) */}
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-gray-400 hover:text-blue-600 transition-colors duration-200 underline"
            >
              Click here to refresh if loading takes too long
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onSectionChange={onSectionChange} activeSection="home" />



      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-2000"></div>
        </div>

        {/* Background Image for Small Devices */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            backgroundImage: "url('/images/house.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.1,
          }}
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 animate-bounce delay-1000">
            <Home className="w-8 h-8 text-blue-300 opacity-60" />
          </div>
          <div className="absolute top-40 right-20 animate-bounce delay-2000">
            <Car className="w-6 h-6 text-green-300 opacity-60" />
          </div>
          <div className="absolute bottom-32 left-16 animate-bounce delay-3000">
            <Briefcase className="w-7 h-7 text-purple-300 opacity-60" />
          </div>
          <div className="absolute bottom-20 right-32 animate-bounce">
            <Star className="w-5 h-5 text-yellow-300 opacity-60" />
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div
              className={`space-y-6 sm:space-y-8 transform transition-all duration-1000 ${isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-10 opacity-0"
                }`}
            >
              {/* Animated Title */}
              <div className="space-y-8">
                <div className="relative">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    <span className="inline-flex items-center">
                      {services.map((service, index) => (
                        <span
                          key={index}
                          className={`transition-all duration-500 ${activeService === index
                            ? "text-blue-600 scale-110"
                            : "text-gray-400 scale-100"
                            }`}
                        >
                          <service.icon className="w-8 h-8 sm:w-10 sm:h-10 inline mr-2" />
                        </span>
                      ))}
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent animate-pulse">
                      {services[activeService].text}
                    </span>
                    <br />
                    <span className="text-gray-700">& Much More</span>
                  </h1>

                  {/* Animated underline */}
                  <div
                    className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"
                    style={{ width: `${30 + activeService * 20}%` }}
                  ></div>
                </div>

                <p className="text-lg sm:text-xl text-gray-600 w-full lg:w-[85%] leading-relaxed animate-fade-in-up">
                  Whether you're searching for a dream home, a reliable car
                  rental, land for investment, or your next job opportunity –
                  we've got you covered.
                </p>

                <p className="text-lg text-gray-500 font-light italic animate-fade-in-up delay-300">
                  ✨ We make it easy, reliable, and accessible just for you.
                </p>
              </div>

              {/* Enhanced Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button 
                  onClick={() => onSectionChange('house')}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>Explore Houses</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                <button 
                  onClick={() => onSectionChange('contact')}
                  className="group border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Contact Us</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </button>
              </div>
            </div>

            {/* Right Side - Enhanced Image */}
            <div
              className={`hidden lg:block relative transform transition-all duration-1000 delay-300 ${isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-10 opacity-0"
                }`}
            >
              <div className="relative w-full h-96 overflow-hidden rounded-2xl shadow-2xl group">
                {/* Main Image */}
                <div
                  className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: "url('/images/house.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20 group-hover:from-blue-900/30 group-hover:to-purple-900/30 transition-all duration-500"></div>

                  {/* Floating Badge */}
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">
                        Available Now
                      </span>
                    </div>
                  </div>

                  {/* Bottom Info Card */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Premium Properties
                        </h4>
                        <p className="text-sm text-gray-600">
                          Starting from $50K
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }

          .delay-300 {
            animation-delay: 0.3s;
          }
        `}</style>
      </section>

      {/* What do we offer */}
      <section className="py-8 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-blue-100 text-blue-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              SERVICES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              What do we offer
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              We provide comprehensive solutions for all your property, vehicle,
              and career needs in Rwanda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {/* Service Cards - Restored Original Design */}
            <ServiceCard
              icon={Home}
              title="House Sales"
              description="Find your dream home from our extensive collection of properties across Rwanda."
              buttonText="Browse Houses"
              color="text-blue-600"
              onClick={() => handleServiceClick("House Sales")}
              number={1}
            />
            <ServiceCard
              icon={Car}
              title="Car Sales"
              description="Discover quality vehicles for sale and rental from trusted sellers."
              buttonText="Browse Cars"
              color="text-green-600"
              onClick={() => handleServiceClick("Car Sales")}
              number={2}
            />
            <ServiceCard
              icon={MapPin}
              title="Plot Sales"
              description="Invest in prime land and plots for residential or commercial development."
              buttonText="Browse Plots"
              color="text-purple-600"
              onClick={() => handleServiceClick("Plot Sales")}
              number={3}
            />

          </div>
        </div>
      </section>

      {/* Luxury Houses Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-blue-100 text-blue-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              FEATURED • HIGHEST PRICES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Luxury Houses
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Discover our premium collection of luxury properties with the highest prices
              in prime locations across Rwanda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-lg text-gray-600">Loading luxury houses...</p>
                </div>
              </div>
            ) : safeLuxuryHouses && safeLuxuryHouses.length > 0 ? (
              safeLuxuryHouses.map((item, index) => (
                <ItemCard
                  key={index}
                  {...item}
                  category={item.category}
                  listingType={item.listingType}
                  numberOfDoors={item.numberOfDoors}
                  district={item.district}
                  sector={item.sector}
                  bedrooms={item.bedrooms}
                  bathrooms={item.bathrooms}
                  area={item.area}
                  areaUnit={item.areaUnit}
                  originalPrice={item.price}
                  discountedPrice={item.discountedPrice}
                  label="See More"
                  onClick={() => handleItemClick(item, "house")}
                  onCardClick={() => handleItemClick(item, "house")}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🏠</div>
                <p className="text-gray-500">No luxury houses available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Middle Houses Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-green-100 text-green-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              AFFORDABLE • LOWEST PRICES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Middle Houses
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Urasangamo amazu n'ibibanza bihendutse kandi bibereye buri wese. <br />
              Kuva kuri 59million gusubiza hasi kuri 500k/Rwf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-lg text-gray-600">Loading middle houses...</p>
                </div>
              </div>
            ) : safeFeaturedHouses.length > 0 ? (
              safeFeaturedHouses.map((item, index) => (
                <ItemCard
                  key={index}
                  {...item}
                  category={item.category}
                  listingType={item.listingType}
                  numberOfDoors={item.numberOfDoors}
                  district={item.district}
                  sector={item.sector}
                  bedrooms={item.bedrooms}
                  bathrooms={item.bathrooms}
                  area={item.area}
                  areaUnit={item.areaUnit}
                  originalPrice={item.price}
                  discountedPrice={item.discountedPrice}
                  label="See More"
                  onClick={() => handleItemClick(item, "house")}
                  onCardClick={() => handleItemClick(item, "house")}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No middle houses available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cars Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-blue-100 text-blue-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              VEHICLES • LATEST MODELS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Cars for Sale
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Browse our selection of the latest model vehicles for sale across Rwanda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {safeFeaturedCars.map((item, index) => (
              <ItemCard
                key={index}
                {...item}
                originalPrice={item.price}
                discountedPrice={item.discountedPrice}
                mileage={item.mileage}
                fuelType={item.fuelType || item.fuel}
                transmission={item.transmission}
                district={item.district || (item.address && item.address.district)}
                sector={item.sector || (item.address && item.address.sector)}
                label="See More"
                onClick={() => handleItemClick(item, "car")}
                onCardClick={() => handleItemClick(item, "car")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Plots Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block bg-purple-100 text-purple-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
              LAND • LATEST LISTINGS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Plots for Sale
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Invest in the latest prime land and plots for residential or commercial development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {safeFeaturedPlots.map((item, index) => (
              <ItemCard
                key={index}
                {...item}
                originalPrice={item.price}
                discountedPrice={item.discountedPrice}
                area={item.area}
                areaUnit={item.areaUnit}
                landUse={item.landUse}
                district={item.district || (item.address && item.address.district)}
                sector={item.sector || (item.address && item.address.sector)}
                label="See More"
                onClick={() => handleItemClick(item, "plot")}
                onCardClick={() => handleItemClick(item, "plot")}
              />
            ))}
          </div>
        </div>
      </section>



      {/* Property Statistics Section */}
      <PropertyStats />

      {/* Why working with us Section */}
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
                  excellent customer support. Our team is dedicated to helping
                  you find the perfect match for your needs.
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

              {/* Call to Action */}
              <div className="mt-8">
                <button 
                  onClick={() => onSectionChange('login')}
                  className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                >
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

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default LandingPage;
