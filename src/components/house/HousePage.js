import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import HouseDetailsPage from "./HouseDetailsPage";
import PropertyStats from "../PropertyStats";
import apiBaseUrl from "../../config";
import HouseWrapper from "../images/house_wrapper.png";

const HousePage = ({ onSectionChange }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedListingType, setSelectedListingType] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const featuredHousesRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHouses, setTotalHouses] = useState(0);
  const [likedHouses, setLikedHouses] = useState(new Set());
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  const [selectedHouseData, setSelectedHouseData] = useState(null);
  const [showHouseDetails, setShowHouseDetails] = useState(false);
  const [districts, setDistricts] = useState([{ id: "all", name: "All Locations" }]);

  // New state for API data
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredHouses, setFilteredHouses] = useState([]); // will mirror API results
  // Pagination state
  const itemsPerPage = 9;
  const [totalItems, setTotalItems] = useState(0);

  // Check if there's a selected item from homepage
  useEffect(() => {
    const selectedItem = localStorage.getItem("selectedItem");
    const selectedItemType = localStorage.getItem("selectedItemType");

    if (selectedItem && selectedItemType === "house") {
      try {
        const item = JSON.parse(selectedItem);

        // Store the full house data instead of just the ID
        setSelectedHouseId(item._id);
        setSelectedHouseData(item); // Store the full house data
        setShowHouseDetails(true);

        // Clear the localStorage after using it
        localStorage.removeItem("selectedItem");
        localStorage.removeItem("selectedItemType");
      } catch (err) {
        console.error("Error parsing selected item:", err);
      }
    }
  }, []);

  // Fetch unique districts from houses
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/houses/districts`);
        if (response.ok) {
          const data = await response.json();
          const districtOptions = [
            { id: "all", name: "All Locations" },
            ...data.map(district => ({
              id: district.toLowerCase().replace(/\s+/g, '-'),
              name: district
            }))
          ];
          setDistricts(districtOptions);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };
    fetchDistricts();
  }, []);

  // Helpers to map UI filter values to API params
  const getLocationLabel = (id) => {
    const match = districts.find((l) => l.id === id);
    return match ? match.name : "";
  };

  const propertyTypeMap = {
    detached: "Detached House",
    "semi-detached": "Semi-Detached",
    apartment: "Apartment",
    villa: "Villa",
    penthouse: "Penthouse",
    duplex: "Duplex",
    studio: "Studio",
  };

  const categoryMap = {
    luxury: "Luxury House",
    middle: "Middle house",
    commercial: "Commercial Property",
  };

  const buildHouseQuery = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(itemsPerPage));

    // Category
    if (selectedCategory !== "all" && categoryMap[selectedCategory]) {
      params.set("category", categoryMap[selectedCategory]);
    }

    // Location (free text contains district/sector)
    if (selectedLocation !== "all") {
      params.set("location", getLocationLabel(selectedLocation));
    }

    // Property type
    if (selectedType !== "all" && propertyTypeMap[selectedType]) {
      params.set("propertyType", propertyTypeMap[selectedType]);
    }

    // Listing type (For Sale / For Rent)
    if (selectedListingType !== "all") {
      params.set("listingType", selectedListingType);
    }

    // Price range
    if (selectedPrice !== "all") {
      if (selectedPrice === "0-20") {
        params.set("maxPrice", "20000000");
      } else if (selectedPrice === "20-50") {
        params.set("minPrice", "20000000");
        params.set("maxPrice", "50000000");
      } else if (selectedPrice === "50-100") {
        params.set("minPrice", "50000000");
        params.set("maxPrice", "100000000");
      } else if (selectedPrice === "100-200") {
        params.set("minPrice", "100000000");
        params.set("maxPrice", "200000000");
      } else if (selectedPrice === "200+") {
        params.set("minPrice", "200000000");
      }
    }

    // Search
    if (searchTerm && searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

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
      case "size-low-high":
        params.set("sortBy", "area");
        params.set("sortOrder", "asc");
        break;
      case "size-high-low":
        params.set("sortBy", "area");
        params.set("sortOrder", "desc");
        break;
      default:
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");
    }

    return params.toString();
  };

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const qs = buildHouseQuery();
      const response = await fetch(`${apiBaseUrl}/api/houses?${qs}`);
      if (!response.ok) {
        throw new Error("Failed to fetch houses");
      }
      const data = await response.json();
      const list = data.houses || [];
      setHouses(list);
      setFilteredHouses(list);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || list.length);
      } else {
        setTotalPages(1);
        setTotalItems(list.length);
      }
    } catch (err) {
      console.error("Error fetching houses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial mount and whenever filters/page/sort/search change
  useEffect(() => {
    fetchHouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    selectedCategory,
    selectedLocation,
    selectedType,
    selectedListingType,
    selectedPrice,
    sortBy,
    searchTerm,
  ]);

  // Reset to first page on any filter/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedPrice,
    selectedLocation,
    selectedType,
    selectedListingType,
    sortBy,
    searchTerm,
  ]);

  // Track if user has interacted with filters (to prevent scroll on initial load)
  const hasUserInteracted = useRef(false);

  // Auto-scroll to Featured Houses section only when user changes filters (not on initial load)
  useEffect(() => {
    if (hasUserInteracted.current && featuredHousesRef.current) {
      featuredHousesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [
    selectedCategory,
    selectedLocation,
    selectedType,
    selectedListingType,
    selectedPrice,
    sortBy,
  ]);

  // Mark that user has interacted after component mounts
  useEffect(() => {
    // Small delay to ensure we don't trigger on initial render
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle view details
  const navigate = useNavigate();
  // Navigate to canonical detail route and persist selected item for compatibility
  const handleViewDetails = (houseId, houseItem = null) => {
    if (houseItem) {
      try {
        localStorage.setItem("selectedItem", JSON.stringify(houseItem));
        localStorage.setItem("selectedItemType", "house");
      } catch (err) {
        console.warn("Could not store selectedItem in localStorage", err);
      }
    }
    // Navigate to route-based details page
    navigate(`/house/${houseId}`);
  };

  // Handle back to house list
  const handleBackToList = () => {
    setShowHouseDetails(false);
    setSelectedHouseId(null);
  };

  // Handle like/unlike
  const handleLike = (houseId) => {
    setLikedHouses((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(houseId)) {
        newLiked.delete(houseId);
      } else {
        newLiked.add(houseId);
      }
      return newLiked;
    });
  };

  // Price formatting helpers (comma separators + RWF)
  const formatCurrency = (value) => {
    const n = Number(value);
    if (!isFinite(n) || n === 0) return "Price on request";
    return `${n.toLocaleString("en-US")} RWF`;
  };

  const renderPrice = (house) => {
    const rawDiscount = house.discountedPrice;
    const hasRawDiscount =
      rawDiscount !== undefined &&
      rawDiscount !== null &&
      String(rawDiscount).trim() !== "";
    const originalNum = isFinite(Number(house.priceNumeric || house.price))
      ? Number(house.priceNumeric || house.price)
      : 0;
    const discountNum =
      hasRawDiscount && isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;
    const hasDiscount =
      hasRawDiscount &&
      discountNum > 0 &&
      originalNum > 0 &&
      discountNum < originalNum;

    if (hasDiscount) {
      const percent = Math.round(
        (100 * (originalNum - discountNum)) / originalNum
      );
      return (
        <div className="flex flex-col">
          <span className="text-sm text-gray-400 line-through">
            {formatCurrency(originalNum)}
          </span>
          <span className="text-base font-bold text-blue-600">
            {formatCurrency(discountNum)}
          </span>
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs ml-2">{`${percent}% OFF`}</span>
        </div>
      );
    }

    if (originalNum > 0) {
      return (
        <span className="text-base font-bold text-blue-600">
          {formatCurrency(originalNum)}
        </span>
      );
    }

    return (
      <span className="text-base font-bold text-blue-600">Price on request</span>
    );
  };

  // If showing house details, render the details page
  if (showHouseDetails) {
    return (
      <HouseDetailsPage
        onSectionChange={onSectionChange}
        houseId={selectedHouseId}
        houseData={selectedHouseData} // Pass the full house data
        onBack={handleBackToList}
      />
    );
  }

  const houseCategories = [
    { id: "all", name: "All Houses", icon: "🏠" },
    { id: "luxury", name: "Luxury", icon: "🏰" },
    { id: "middle", name: "Middle Class", icon: "🏡" },
    { id: "commercial", name: "Commercial", icon: "🏪" },
  ];

  const priceRanges = [
    { id: "all", name: "All Prices" },
    { id: "0-20", name: "0 - 20M RWF" },
    { id: "20-50", name: "20M - 50M RWF" },
    { id: "50-100", name: "50M - 100M RWF" },
    { id: "100-200", name: "100M - 200M RWF" },
    { id: "200+", name: "200M+ RWF" },
  ];

  // Districts are now fetched dynamically from the database

  const houseTypes = [
    { id: "all", name: "All Types" },
    { id: "detached", name: "Detached House" },
    { id: "semi-detached", name: "Semi-Detached" },
    { id: "apartment", name: "Apartment" },
    { id: "villa", name: "Villa" },
    { id: "penthouse", name: "Penthouse" },
    { id: "duplex", name: "Duplex" },
    { id: "studio", name: "Studio" },
  ];

  const sortOptions = [
    { id: "default", name: "Default" },
    { id: "price-low-high", name: "Price: Low to High" },
    { id: "price-high-low", name: "Price: High to Low" },
    { id: "size-low-high", name: "Size: Small to Large" },
    { id: "size-high-low", name: "Size: Large to Small" },
    { id: "rating-high-low", name: "Rating: High to Low" },
    { id: "reviews-high-low", name: "Reviews: High to Low" },
  ];

  // Note: Loading state will be shown inline in the house cards section instead of full-page reload

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSectionChange={onSectionChange} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Error Loading Houses
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

  // Note: Empty state is now handled inline in the houses cards section

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSectionChange={onSectionChange} activeSection="house" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-blue-600 text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${HouseWrapper})`,
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/75 via-blue-900/70 to-indigo-900/75 backdrop-blur-[1px]"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-8 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-8 w-56 h-56 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-indigo-200 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse delay-300"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                Find Your Dream
                <span className="block bg-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                  Home
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-300 via-blue-300 to-indigo-300 mx-auto rounded-full"></div>
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed opacity-95 px-4 font-light">
              Discover exceptional properties across Rwanda. From luxury villas
              to cozy apartments, we have the perfect home for every lifestyle
              and budget.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
              <button onClick={() => onSectionChange('login')} className="group bg-white text-purple-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-purple-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base shadow-lg">
                <span className="flex items-center justify-center gap-2">
                  Sell or Rent a House
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </span>
              </button>

              <button onClick={() => featuredHousesRef.current?.scrollIntoView({ behavior: 'smooth' })} className="group border-2 border-white/80 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-white hover:text-purple-600 hover:border-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base backdrop-blur-sm">
                <span className="flex items-center justify-center gap-2">
                  Browse All Properties
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

      {/* House Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Property Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore our diverse range of properties to find the perfect match
              for your lifestyle and needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {houseCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl shadow-lg border-2 p-6 text-center cursor-pointer transition-all duration-300 hover:shadow-xl ${selectedCategory === category.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-100 hover:border-blue-300"
                  }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="mb-4">
                  {category.id === 'all' && (
                    <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {category.id === 'luxury' && (
                    <svg className="w-12 h-12 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                  {category.id === 'middle' && (
                    <svg className="w-12 h-12 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {category.id === 'commercial' && (
                    <svg className="w-12 h-12 mx-auto text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Filters and Search */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Your Perfect Home
              </h3>
              {(() => {
                const activeCount = [
                  searchTerm !== "",
                  selectedLocation !== "all",
                  selectedType !== "all",
                  selectedPrice !== "all",
                  sortBy !== "default"
                ].filter(Boolean).length;
                return activeCount > 0 ? (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {activeCount} active {activeCount === 1 ? 'filter' : 'filters'}
                  </span>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Location Filter */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  {districts.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>


              {/* Price Filter */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price Range
                </label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  {priceRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Listing Type Filter */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Listing Type
                </label>
                <select
                  value={selectedListingType}
                  onChange={(e) => setSelectedListingType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
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
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedLocation("all");
                    setSelectedType("all");
                    setSelectedListingType("all");
                    setSelectedPrice("all");
                    setSortBy("default");
                    setSearchTerm("");
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              {(() => {
                const start =
                  totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
                const end =
                  totalItems === 0
                    ? 0
                    : Math.min(start + (filteredHouses.length - 1), totalItems);
                return (
                  <p className="text-blue-800 font-semibold">
                    Showing {start}-{end} of {totalItems} properties
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Houses */}
      <section ref={featuredHousesRef} className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Available Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our handpicked selection of premium properties with the
              best features and competitive prices.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600">Loading houses...</p>
              </div>
            </div>
          ) : filteredHouses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No properties found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms to find more
                properties.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLocation("all");
                  setSelectedType("all");
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
              {filteredHouses.map((house) => (
                <div
                  key={house._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative">
                    <div className="h-56 bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden">
                      {/* Property Image */}
                      <img
                        src={
                          house.mainImage && house.mainImage.startsWith("http")
                            ? house.mainImage
                            : `${apiBaseUrl}${house.mainImage}`
                        }
                        alt={house.title}
                        data-house-id={house._id}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      {/* Fallback emoji (hidden by default) */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 items-center justify-center hidden"
                        style={{ display: "none" }}
                      >
                        <span className="text-white text-6xl">🏠</span>
                      </div>
                    </div>
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(house._id)}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${likedHouses.has(house._id)
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white"
                        }`}
                    >
                      <span className="text-lg">
                        {likedHouses.has(house._id) ? "❤️" : "🤍"}
                      </span>
                    </button>
                    {/* Listing Type Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${house.listingType === 'For Rent' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                      {house.listingType || 'For Sale'}
                    </div>
                    {/* Featured Badge */}
                    {house.isFeatured && (
                      <div className="absolute top-4 left-24 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {/* Title and Price */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
                        {house.title}
                      </h3>
                      {renderPrice(house)}
                      {house.listingType === 'For Rent' && (
                        <span className="text-sm text-green-600 font-medium ml-1">/month</span>
                      )}
                      {/* Location with icon */}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {[house.district, house.sector].filter(Boolean).join(", ") || "Location not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats with Icons */}
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      {house.category?.toLowerCase() === 'commercial property' ? (
                        // Commercial: Show Number of Doors
                        <>
                          <div className="flex flex-col items-center col-span-2">
                            <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-xs text-gray-500">Doors</span>
                            <span className="text-sm font-semibold text-gray-900">{house.numberOfDoors || 0}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="text-xs text-gray-500">Area</span>
                            <span className="text-sm font-semibold text-gray-900">{house.area} {house.areaUnit}</span>
                          </div>
                        </>
                      ) : (
                        // Residential: Show Bedrooms, Bathrooms, Area
                        <>
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-xs text-gray-500">Bedrooms</span>
                            <span className="text-sm font-semibold text-gray-900">{house.bedrooms}</span>
                          </div>
                          <div className="flex flex-col items-center border-x border-gray-200">
                            <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            <span className="text-xs text-gray-500">Bathrooms</span>
                            <span className="text-sm font-semibold text-gray-900">{house.bathrooms}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="text-xs text-gray-500">Area</span>
                            <span className="text-sm font-semibold text-gray-900">{house.area} {house.areaUnit}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Property Type Badge */}
                    <div className="mb-4">
                      <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                        {house.propertyType}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {house.description}
                    </p>

                    {/* Features */}
                    {house.features && house.features.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {house.features.slice(0, 3).map((feature, index) => (
                            <span
                              key={index}
                              className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium"
                            >
                              {feature}
                            </span>
                          ))}
                          {house.features.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                              +{house.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewDetails(house._id, house)}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        View Details
                      </button>

                      {/* Contact and Share Buttons */}
                      <div className="flex gap-2">
                        {/* Email Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const locationStr = [house.district, house.sector].filter(Boolean).join(", ") || 'N/A';
                            const priceStr = (house.discountedPrice || house.price || 0).toLocaleString('en-US');
                            const subject = encodeURIComponent(`Inquiry about: ${house.title}`);
                            const body = encodeURIComponent(`Hello,\n\nI am interested in the following property:\n\nTitle: ${house.title}\nPrice: ${priceStr} RWF\nLocation: ${locationStr}\n\nPlease provide more information.\n\nThank you.`);
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
                              title: house.title,
                              text: `${house.title}\nPrice: ${house.price || 'N/A'}\n\n${house.description || 'Check out this amazing property!'}`,
                              url: `${window.location.origin}/house/${house._id}`
                            };
                            // Add image if available
                            if (house.mainImage) {
                              fetch(house.mainImage)
                                .then(res => res.blob())
                                .then(blob => {
                                  const file = new File([blob], 'property.jpg', { type: 'image/jpeg' });
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
                            const phone = "+250788820543";

                            const message = `Hi, I'm interested in your property: ${house.title} - ${window.location.origin}/house/${house._id}`;
                            const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, "_blank");
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-all duration-200 text-sm"
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
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredHouses.length > 0 && (
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Our Property Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide comprehensive property solutions with quality assurance
              and excellent customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quality Properties
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All properties are thoroughly vetted and come with detailed
                information and legal documentation.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Competitive Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Best market prices with flexible financing options and
                transparent pricing structure.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🛠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                After-Sales Support
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive property management services and 24/7 customer
                support for all your needs.
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

// Helper function for star rating
const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={i} className="text-yellow-400">
        ★
      </span>
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span key="half" className="text-yellow-400">
        ☆
      </span>
    );
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="text-gray-300">
        ★
      </span>
    );
  }

  return stars;
};

export default HousePage;
