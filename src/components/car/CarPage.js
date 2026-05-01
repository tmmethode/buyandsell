import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import CarDetailsPage from "./CarDetailsPage";
import PropertyStats from "../PropertyStats";
import apiBaseUrl from "../../config";
import carWrapper from "../images/car_wrapper.png";
import {
  Heart,
  Star,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Zap,
  MessageCircle,
  Eye,
  Car,
  Truck,
  Sparkles,
  Shield,
  DollarSign,
  Wrench,
  Share2,
  Mail,
} from "lucide-react";

const CarPage = ({ onSectionChange }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [likedCars, setLikedCars] = useState(new Set());
  const [showCarDetails, setShowCarDetails] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const featuredCarsRef = useRef(null);

  // New state for API data
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredCars, setFilteredCars] = useState([]); // will mirror API results
  // Dynamic brand options
  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Check if there's a selected item from homepage
  useEffect(() => {
    const selectedItem = localStorage.getItem("selectedItem");
    const selectedItemType = localStorage.getItem("selectedItemType");

    if (selectedItem && selectedItemType === "car") {
      try {
        const item = JSON.parse(selectedItem);
        setSelectedCarId(item._id);
        setShowCarDetails(true);

        // Clear the localStorage after using it
        localStorage.removeItem("selectedItem");
        localStorage.removeItem("selectedItemType");
      } catch (err) {
        console.error("Error parsing selected item:", err);
      }
    }
  }, []);

  // Load distinct brands for filter
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);
        const res = await fetch(`${apiBaseUrl}/api/cars/brands`);
        if (!res.ok) throw new Error("Failed to fetch brands");
        const brands = await res.json(); // array of strings
        const cleaned = (brands || [])
          .filter((b) => typeof b === "string" && b.trim().length > 0)
          .map((b) => b.trim());
        setBrandOptions(cleaned);
      } catch (e) {
        console.warn("Could not load car brands:", e);
        setBrandOptions([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const buildCarQuery = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));

    // Category mapping to API fields
    if (selectedCategory !== "all") {
      if (selectedCategory === "suv") params.set("bodyType", "SUV");
      else if (selectedCategory === "sedan") params.set("bodyType", "Sedan");
      else if (selectedCategory === "electric")
        params.set("fuelType", "Electric");
      else if (selectedCategory === "commercial")
        params.set("bodyType", "Commercial");
      // 'luxury' spans multiple brands; skipping server param to avoid incorrect narrowing
    }

    // Brand
    if (selectedModel !== "all") {
      params.set("brand", selectedModel);
    }

    // Year
    if (selectedYear !== "all") {
      params.set("minYear", selectedYear);
      params.set("maxYear", selectedYear);
    }

    // Price
    if (selectedPrice !== "all") {
      if (selectedPrice === "0-50") params.set("maxPrice", "50000000");
      if (selectedPrice === "50-100") {
        params.set("minPrice", "50000000");
        params.set("maxPrice", "100000000");
      }
      if (selectedPrice === "100-200") {
        params.set("minPrice", "100000000");
        params.set("maxPrice", "200000000");
      }
      if (selectedPrice === "200+") params.set("minPrice", "200000000");
    }

    // Search
    if (searchTerm && searchTerm.trim())
      params.set("search", searchTerm.trim());

    // Sort
    switch (sortBy) {
      case "price-low-high":
        params.set("sortBy", "priceNumeric");
        params.set("sortOrder", "asc");
        break;
      case "price-high-low":
        params.set("sortBy", "priceNumeric");
        params.set("sortOrder", "desc");
        break;
      case "year-new-old":
        params.set("sortBy", "year");
        params.set("sortOrder", "desc");
        break;
      case "year-old-new":
        params.set("sortBy", "year");
        params.set("sortOrder", "asc");
        break;
      case "mileage-low-high":
        params.set("sortBy", "mileage");
        params.set("sortOrder", "asc");
        break;
      case "mileage-high-low":
        params.set("sortBy", "mileage");
        params.set("sortOrder", "desc");
        break;
      default:
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");
    }

    return params.toString();
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      const qs = buildCarQuery();
      const response = await fetch(`${apiBaseUrl}/api/cars?${qs}`);
      if (!response.ok) throw new Error("Failed to fetch cars");
      const data = await response.json();
      const list = data.cars || [];
      setCars(list);
      setFilteredCars(list);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || list.length);
      } else {
        setTotalPages(1);
        setTotalItems(list.length);
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    selectedCategory,
    selectedModel,
    selectedYear,
    selectedPrice,
    sortBy,
    searchTerm,
  ]);

  // Reset to first page when filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedPrice,
    selectedModel,
    selectedYear,
    sortBy,
    searchTerm,
  ]);

  // Track if user has interacted with filters (to prevent scroll on initial load)
  const hasUserInteracted = useRef(false);

  // Auto-scroll to Featured Cars section only when user changes filters (not on initial load)
  useEffect(() => {
    if (hasUserInteracted.current && featuredCarsRef.current) {
      featuredCarsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedCategory, selectedModel, selectedYear, selectedPrice, sortBy]);

  // Mark that user has interacted after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const navigate = useNavigate();

  // Handle view details: navigate to canonical route and persist selected item
  const handleViewDetails = (carId, carItem = null) => {
    if (carItem) {
      try {
        localStorage.setItem("selectedItem", JSON.stringify(carItem));
        localStorage.setItem("selectedItemType", "car");
      } catch (err) {
        console.warn("Could not persist selected car to localStorage", err);
      }
    }
    navigate(`/car/${carId}`);
  };

  // Handle back to car list
  const handleBackToList = () => {
    setShowCarDetails(false);
    setSelectedCarId(null);
  };

  // Handle like/unlike
  const handleLike = (carId) => {
    setLikedCars((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(carId)) {
        newLiked.delete(carId);
      } else {
        newLiked.add(carId);
      }
      return newLiked;
    });
  };

  // If showing car details, render the details page
  if (showCarDetails) {
    return (
      <CarDetailsPage
        onSectionChange={onSectionChange}
        carId={selectedCarId}
        onBack={handleBackToList}
      />
    );
  }

  // Note: Loading state will be shown inline in the cars cards section instead of full-page reload

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSectionChange={onSectionChange} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Error Loading Cars
            </h2>
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

  // Note: Empty state is now handled inline in the cars cards section

  const priceRanges = [
    { id: "all", name: "All Prices" },
    { id: "0-50", name: "0 - 50M RWF" },
    { id: "50-100", name: "50M - 100M RWF" },
    { id: "100-200", name: "100M - 200M RWF" },
    { id: "200+", name: "200M+ RWF" },
  ];

  // Brand options are loaded dynamically from API

  const carYears = [
    { id: "all", name: "All Years" },
    { id: "2024", name: "2024" },
    { id: "2023", name: "2023" },
    { id: "2022", name: "2022" },
    { id: "2021", name: "2021" },
    { id: "2020", name: "2020" },
    { id: "2019", name: "2019" },
    { id: "2018", name: "2018" },
  ];

  const sortOptions = [
    { id: "default", name: "Default" },
    { id: "price-low-high", name: "Price: Low to High" },
    { id: "price-high-low", name: "Price: High to Low" },
    { id: "year-new-old", name: "Year: Newest First" },
    { id: "year-old-new", name: "Year: Oldest First" },
    { id: "mileage-low-high", name: "Mileage: Low to High" },
    { id: "mileage-high-low", name: "Mileage: High to Low" },
    { id: "rating-high-low", name: "Rating: High to Low" },
    { id: "reviews-high-low", name: "Reviews: High to Low" },
  ];

  // Get appropriate car icon based on category
  const getCarIcon = (category) => {
    switch (category) {
      case "suv":
        return Truck;
      case "electric":
        return Zap;
      case "luxury":
        return Sparkles;
      case "commercial":
        return Truck;
      default:
        return Car;
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 text-yellow-400 fill-current opacity-50"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  // Enhanced Car Card Component
  const EnhancedCarCard = ({ car }) => {
    const CarIcon = getCarIcon(car.bodyType);

    return (
      <div className="group bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative max-w-sm">
        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-20">
          <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
            {car.status}
          </span>
        </div>

        {/* Compact Image Section */}
        <div className="relative h-64 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
          {/* Car Image */}
          <img
            src={
              car.mainImage && car.mainImage.startsWith("http")
                ? car.mainImage
                : `${apiBaseUrl}${car.mainImage}`
            }
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            onError={(e) => {
              e.target.style.display = "none";
              // Show car icon as fallback
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Car Icon Fallback */}
          <div className="absolute inset-0 items-center justify-center hidden">
            <CarIcon className="w-12 h-12 text-white opacity-90 group-hover:scale-105 transition-all duration-300" />
          </div>

          {/* Like Button */}
          <button
            onClick={() => handleLike(car._id)}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${likedCars.has(car._id)
              ? "bg-red-500 text-white shadow-md"
              : "bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white"
              }`}
          >
            <Heart
              className={`w-3 h-3 ${likedCars.has(car._id) ? "fill-current" : ""
                }`}
            />
          </button>

          {/* Rating Badge */}
          <div className="absolute bottom-2 left-2 bg-white/95 rounded-lg px-2 py-1 flex items-center space-x-1 shadow-sm">
            <div className="flex">{renderStars(car.rating)}</div>
            <span className="text-xs font-bold text-gray-800">
              {car.rating}
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-2 right-2 bg-blue-600/90 text-white text-xs font-medium px-2 py-1 rounded-full capitalize">
            {car.bodyType}
          </div>
        </div>

        {/* Compact Content Section */}
        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate pr-2">
              {car.title}
            </h3>
            <div className="text-sm font-bold text-blue-600 whitespace-nowrap">
              {car.price}
            </div>
          </div>

          {/* Key Specs - Single Row */}
          <div className="flex justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>{car.year}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Gauge className="w-3 h-3 text-blue-500" />
              <span>
                {car.mileage} {car.mileageUnit}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Fuel className="w-3 h-3 text-blue-500" />
              <span>{car.fuelType}</span>
            </div>
          </div>

          {/* Engine and Transmission */}
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
            <div className="flex justify-between">
              <span>
                {car.engineSize} {car.engineSizeUnit}
              </span>
              <span>{car.transmission}</span>
            </div>
          </div>

          {/* Location and Reviews */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="truncate">
                {(() => {
                  const district = car.district || car.address?.district || "";
                  const sector = car.sector || car.address?.sector || "";
                  const locationStr = [district, sector]
                    .filter(Boolean)
                    .join(", ");
                  return locationStr || car.location || "Unknown";
                })()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{car.views}</span>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => handleViewDetails(car._id, car)}
            className="w-full mt-4 bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <MessageCircle className="w-4 h-4" />
            View Details
          </button>

          {/* Contact and Share Buttons */}
          <div className="flex gap-2 mt-3">
            {/* Email Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const locationStr = [car.district, car.sector].filter(Boolean).join(", ") || 'N/A';
                const priceStr = (car.price || 0).toLocaleString('en-US');
                const subject = encodeURIComponent(`Inquiry about: ${car.title}`);
                const body = encodeURIComponent(`Hello,\n\nI am interested in the following car:\n\nTitle: ${car.title}\nPrice: ${priceStr} RWF\nLocation: ${locationStr}\n\nPlease provide more information.\n\nThank you.`);
                window.location.href = `mailto:announcementsafricaltd@gmail.com?subject=${subject}&body=${body}`;
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 transition-all duration-200 text-xs"
              title="Send Email"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareData = {
                  title: car.title,
                  text: `${car.title}\nPrice: ${car.price || 'N/A'}\n\n${car.description || 'Check out this amazing car!'}`,
                  url: `${window.location.origin}/car/${car._id}`
                };
                // Add image if available
                if (car.mainImage) {
                  fetch(car.mainImage)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], 'car.jpg', { type: 'image/jpeg' });
                      if (navigator.share) {
                        navigator.share({
                          ...shareData,
                          files: [file]
                        }).catch(() => {
                          if (navigator.share) {
                            navigator.share(shareData);
                          }
                        });
                      } else {
                        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                        alert('Content copied to clipboard!');
                      }
                    })
                    .catch(() => {
                      if (navigator.share) {
                        navigator.share(shareData);
                      } else {
                        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                        alert('Content copied to clipboard!');
                      }
                    });
                } else {
                  if (navigator.share) {
                    navigator.share(shareData);
                  } else {
                    navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                    alert('Content copied to clipboard!');
                  }
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-300 text-xs"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={() => {
                const message = `Hi, I'm interested in your car: ${car.title} - ${window.location.origin}/car/${car._id}`;
                const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, "_blank");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-all duration-200 text-xs"
              title="WhatsApp +250 788 820 543"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.63z" />
              </svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSectionChange={onSectionChange} activeSection="car" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${carWrapper})`,
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-blue-900/70 backdrop-blur-[1px]"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                  Vehicle
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-300 to-white mx-auto rounded-full"></div>
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed opacity-95 px-4 font-light">
              Discover a wide selection of premium cars, SUVs, and commercial
              vehicles. From luxury sedans to reliable family cars, we have the
              perfect vehicle for every need.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
              <button onClick={() => onSectionChange('login')} className="group bg-white text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base shadow-lg">
                <span className="flex items-center justify-center gap-2">
                  Sell a Car
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </button>

              <button onClick={() => featuredCarsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="group border-2 border-white/80 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-white hover:text-blue-600 hover:border-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base backdrop-blur-sm">
                <span className="flex items-center justify-center gap-2">
                  Browse All Cars
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters and Search */}
      <section className="py-8 sm:py-12 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Find Your Perfect Car
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  <option value="all">All Brands</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  {carYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  {priceRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedModel("all");
                    setSelectedYear("all");
                    setSelectedPrice("all");
                    setSortBy("default");
                    setSearchTerm("");
                  }}
                  className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              {(() => {
                const start =
                  totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
                const end =
                  totalItems === 0
                    ? 0
                    : Math.min(start + (filteredCars.length - 1), totalItems);
                return (
                  <p className="text-blue-800 font-semibold text-sm sm:text-base">
                    Showing {start}-{end} of {totalItems} cars
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section ref={featuredCarsRef} className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Available Cars
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our handpicked selection of premium vehicles with the
              best features and competitive prices.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600">Loading cars...</p>
              </div>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No cars found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms to find more cars.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedModel("all");
                  setSelectedYear("all");
                  setSelectedPrice("all");
                  setSortBy("default");
                  setSearchTerm("");
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map((car) => (
                <EnhancedCarCard key={car._id} car={car} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredCars.length > 0 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {(() => {
                const canPrev = currentPage > 1;
                const canNext = currentPage < totalPages;
                const pages = Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                );
                return (
                  <>
                    <button
                      onClick={() => canPrev && setCurrentPage((p) => p - 1)}
                      disabled={!canPrev}
                      className={`px-3 py-2 rounded border ${canPrev
                        ? "bg-white hover:bg-gray-50 text-gray-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      Prev
                    </button>
                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-2 rounded border ${p === currentPage
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => canNext && setCurrentPage((p) => p + 1)}
                      disabled={!canNext}
                      className={`px-3 py-2 rounded border ${canNext
                        ? "bg-white hover:bg-gray-50 text-gray-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      Next
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Why Choose Our Car Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              We provide comprehensive car solutions with quality assurance and
              excellent customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Quality Assurance
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                All vehicles undergo thorough inspection and come with detailed
                service history and warranty.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Competitive Pricing
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Best market prices with flexible financing options and
                transparent pricing structure.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                After-Sales Support
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Comprehensive maintenance services and 24/7 customer support for
                all your vehicle needs.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Property Statistics Section */}
      <PropertyStats />

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default CarPage;
