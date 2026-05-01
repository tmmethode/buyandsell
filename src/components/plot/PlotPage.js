import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../Header";
import Footer from "../Footer";
import PlotDetailsPage from "./PlotDetailsPage";
import PropertyStats from "../PropertyStats";
import plotWrapper from "../images/plot_wrapper.png";
import apiBaseUrl from "../../config";

import {
  MapPin,
  Home,
  Building,
  TreePine,
  Factory,
  Building2
} from 'lucide-react';

const PlotPage = ({ onSectionChange }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [likedPlots, setLikedPlots] = useState(new Set());
  const [showPlotDetails, setShowPlotDetails] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [districts, setDistricts] = useState([{ id: "all", name: "All Locations" }]);
  const featuredPlotsRef = useRef(null);

  // New state for API data
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredPlots, setFilteredPlots] = useState([]);
  const [selectedPlotData, setSelectedPlotData] = useState(null); // State to hold full plot data
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Check if there's a selected item from homepage
  useEffect(() => {
    const selectedItem = localStorage.getItem('selectedItem');
    const selectedItemType = localStorage.getItem('selectedItemType');

    if (selectedItem && selectedItemType === 'plot') {
      try {
        const item = JSON.parse(selectedItem);
        setSelectedPlotId(item._id);
        setSelectedPlotData(item); // Set the full plot data
        setShowPlotDetails(true);

        // Clear the localStorage after using it
        localStorage.removeItem('selectedItem');
        localStorage.removeItem('selectedItemType');
      } catch (err) {
        console.error('Error parsing selected item:', err);
      }
    }
  }, []);

  // Fetch unique districts from plots
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/plots/districts`);
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

  // Helper: format number as currency with commas (e.g. 50000 -> 50,000 RWF)
  const formatPrice = (value) => {
    if (value === undefined || value === null) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("en-US") + " RWF";
  };

  // Helpers to map UI filter values to API params
  const getLocationLabel = (id) => {
    const match = districts.find((l) => l.id === id);
    return match ? match.name : "";
  };

  const buildPlotQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('limit', String(itemsPerPage));

    // Category → landUse mapping
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'residential') params.set('landUse', 'Residential');
      else if (selectedCategory === 'commercial') params.set('landUse', 'Commercial');
      else if (selectedCategory === 'agricultural') params.set('landUse', 'Agricultural');
      else if (selectedCategory === 'industrial') params.set('landUse', 'Industrial');
    }

    // Location (free text)
    if (selectedLocation !== 'all') {
      params.set('location', getLocationLabel(selectedLocation));
    }

    // Size → area range
    if (selectedSize !== 'all') {
      if (selectedSize === 'small') params.set('maxArea', '300');
      if (selectedSize === 'medium') { params.set('minArea', '300'); params.set('maxArea', '600'); }
      if (selectedSize === 'large') params.set('minArea', '600');
    }

    // Price range
    if (selectedPrice !== 'all') {
      if (selectedPrice === '0-20') params.set('maxPrice', '20000000');
      if (selectedPrice === '20-50') { params.set('minPrice', '20000000'); params.set('maxPrice', '50000000'); }
      if (selectedPrice === '50-100') { params.set('minPrice', '50000000'); params.set('maxPrice', '100000000'); }
      if (selectedPrice === '100+') params.set('minPrice', '100000000');
    }

    // Search
    if (searchTerm && searchTerm.trim()) params.set('search', searchTerm.trim());

    // Sort
    switch (sortBy) {
      case 'price-low-high': params.set('sortBy', 'priceNumeric'); params.set('sortOrder', 'asc'); break;
      case 'price-high-low': params.set('sortBy', 'priceNumeric'); params.set('sortOrder', 'desc'); break;
      case 'size-low-high': params.set('sortBy', 'area'); params.set('sortOrder', 'asc'); break;
      case 'size-high-low': params.set('sortBy', 'area'); params.set('sortOrder', 'desc'); break;
      default: params.set('sortBy', 'createdAt'); params.set('sortOrder', 'desc');
    }

    return params.toString();
  };

  const fetchPlots = async () => {
    try {
      setLoading(true);
      const qs = buildPlotQuery();
      const response = await fetch(`${apiBaseUrl}/api/plots?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch plots');
      const data = await response.json();
      const list = data.plots || [];
      setPlots(list);
      setFilteredPlots(list);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.totalItems || list.length);
      } else {
        setTotalPages(1);
        setTotalItems(list.length);
      }
    } catch (err) {
      console.error('Error fetching plots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, selectedLocation, selectedSize, selectedPrice, sortBy, searchTerm]);

  // Reset to first page on filter/sort/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPrice, selectedLocation, selectedSize, sortBy, searchTerm]);

  // Track if user has interacted with filters (to prevent scroll on initial load)
  const hasUserInteracted = useRef(false);

  // Auto-scroll to Featured Plots section only when user changes filters (not on initial load)
  useEffect(() => {
    if (hasUserInteracted.current && featuredPlotsRef.current) {
      featuredPlotsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory, selectedLocation, selectedSize, selectedPrice, sortBy]);

  // Mark that user has interacted after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const navigate = useNavigate();

  // Handle view details: persist selected plot and navigate to route
  const handleViewDetails = (plotId, plotItem = null) => {
    if (plotItem) {
      try {
        localStorage.setItem('selectedItem', JSON.stringify(plotItem));
        localStorage.setItem('selectedItemType', 'plot');
      } catch (err) {
        console.warn('Could not persist selected plot to localStorage', err);
      }
    }
    navigate(`/plot/${plotId}`);
  };

  // Handle back to plot list
  const handleBackToList = () => {
    setShowPlotDetails(false);
    setSelectedPlotId(null);
    setSelectedPlotData(null);
  };

  // Handle like/unlike
  const handleLike = (plotId) => {
    setLikedPlots(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(plotId)) {
        newLiked.delete(plotId);
      } else {
        newLiked.add(plotId);
      }
      return newLiked;
    });
  };

  // If showing plot details, render the details page
  if (showPlotDetails) {
    // Make sure we have the selected plot data
    if (!selectedPlotData && selectedPlotId && plots.length > 0) {
      const plotData = plots.find(plot => plot._id === selectedPlotId);
      if (plotData) {
        setSelectedPlotData(plotData);
      }
    }

    return (
      <PlotDetailsPage
        onSectionChange={onSectionChange}
        plotId={selectedPlotId}
        plotData={selectedPlotData} // Pass the full plot data
        onBack={handleBackToList}
      />
    );
  }

  // Note: Loading state will be shown inline in the plots cards section instead of full-page reload

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSectionChange={onSectionChange} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Plots</h2>
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

  // Note: Empty state is now handled inline in the plots cards section

  const plotCategories = [
    {
      id: "all",
      name: "All Plots",
      icon: MapPin,
      color: "text-gray-600"
    },
    {
      id: "residential",
      name: "Residential",
      icon: Home,
      color: "text-blue-600"
    },
    {
      id: "commercial",
      name: "Commercial",
      icon: Building,
      color: "text-purple-600"
    },
    {
      id: "agricultural",
      name: "Agricultural",
      icon: TreePine,
      color: "text-green-600"
    },
    {
      id: "industrial",
      name: "Industrial",
      icon: Factory,
      color: "text-orange-600"
    },
  ];

  const priceRanges = [
    { id: "all", name: "All Prices" },
    { id: "0-20", name: "0 - 20M RWF" },
    { id: "20-50", name: "20M - 50M RWF" },
    { id: "50-100", name: "50M - 100M RWF" },
    { id: "100+", name: "100M+ RWF" },
  ];

  // Districts are now fetched dynamically from the database

  const plotSizes = [
    { id: "all", name: "All Sizes" },
    { id: "small", name: "Small (≤ 300 sqm)" },
    { id: "medium", name: "Medium (300 - 600 sqm)" },
    { id: "large", name: "Large (> 600 sqm)" },
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

  // Render star rating
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSectionChange={onSectionChange} activeSection="plot" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-blue-600 text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${plotWrapper})`,
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/75 via-emerald-900/70 to-blue-900/75 backdrop-blur-[1px]"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-12 w-36 h-36 bg-green-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-12 w-52 h-52 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 right-1/3 w-28 h-28 bg-emerald-200 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/4 left-1/3 w-44 h-44 bg-teal-200 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-green-200 via-emerald-200 to-blue-200 bg-clip-text text-transparent">
                  Land Plot
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-green-300 via-emerald-300 to-blue-300 mx-auto rounded-full"></div>
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed opacity-95 px-4 font-light">
              Discover exceptional land plots across Rwanda. From residential to
              commercial, agricultural to industrial, we have the perfect plot
              for every development need.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
              <button onClick={() => onSectionChange('login')} className="group bg-white text-green-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-green-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base shadow-lg">
                <span className="flex items-center justify-center gap-2">
                  Sell a Plot
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
              </button>

              <button onClick={() => featuredPlotsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="group border-2 border-white/80 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-white hover:text-green-600 hover:border-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base backdrop-blur-sm">
                <span className="flex items-center justify-center gap-2">
                  Browse All Plots
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plot Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Plot Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Explore our diverse range of land plots to find the perfect match
              for your development needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {plotCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  className={`bg-white rounded-xl shadow-lg border-2 p-6 text-center cursor-pointer transition-all duration-300 hover:shadow-xl ${selectedCategory === category.id
                    ? "border-green-600 bg-green-50"
                    : "border-gray-100 hover:border-green-300"
                    }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <IconComponent className={`w-8 h-8 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advanced Filters and Search */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Find Your Perfect Plot
              </h3>
              {(() => {
                const activeCount = [
                  searchTerm !== "",
                  selectedLocation !== "all",
                  selectedSize !== "all",
                  selectedPrice !== "all",
                  sortBy !== "default"
                ].filter(Boolean).length;
                return activeCount > 0 ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  {districts.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Plot Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  {plotSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
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
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
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
                    setSelectedLocation("all");
                    setSelectedSize("all");
                    setSelectedPrice("all");
                    setSortBy("default");
                    setSearchTerm("");
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              {(() => {
                const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
                const end = totalItems === 0 ? 0 : Math.min(start + (filteredPlots.length - 1), totalItems);
                return (
                  <p className="text-green-800 font-semibold">
                    Showing {start}-{end} of {totalItems} plots
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plots */}
      <section ref={featuredPlotsRef} className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Available Plots
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our handpicked selection of premium land plots with the
              best features and competitive prices.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600">Loading plots...</p>
              </div>
            </div>
          ) : filteredPlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No plots found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms to find more plots.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedLocation("all");
                  setSelectedSize("all");
                  setSelectedPrice("all");
                  setSortBy("default");
                  setSearchTerm("");
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPlots
                .map((plot) => (
                  <div
                    key={plot._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Image Container with proper formatting */}
                    <div className="relative">
                      <div className="h-56 bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden">
                        {/* Property Image */}
                        <img
                          src={plot.mainImage && plot.mainImage.startsWith('http') ? plot.mainImage : `${apiBaseUrl}${plot.mainImage}`}
                          alt={plot.title}
                          data-plot-id={plot._id}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        {/* Fallback emoji (hidden by default) */}
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 items-center justify-center hidden"
                          style={{ display: 'none' }}
                        >
                          <span className="text-white text-6xl">🏞️</span>
                        </div>
                      </div>
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(plot._id)}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${likedPlots.has(plot._id)
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white"
                          }`}
                      >
                        <span className="text-lg">
                          {likedPlots.has(plot._id) ? "❤️" : "🤍"}
                        </span>
                      </button>

                      {/* Featured Badge */}
                      {plot.isFeatured && (
                        <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Featured
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Title and Price */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
                          {plot.title}
                        </h3>
                        <span className="text-base font-bold text-green-600">
                          {formatPrice(plot.priceNumeric ?? plot.price)}
                        </span>
                      </div>

                      {/* Location with icon */}
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {(() => {
                            const district = plot.district || plot.address?.district || '';
                            const sector = plot.sector || plot.address?.sector || '';
                            const locationStr = [district, sector].filter(Boolean).join(", ");
                            return locationStr || plot.location || 'Location not specified';
                          })()}
                        </span>
                      </div>

                      {/* Quick Stats with Icons */}
                      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-col items-center">
                          <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span className="text-xs text-gray-500">Area</span>
                          <span className="text-sm font-semibold text-gray-900">{plot.area} {plot.areaUnit}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-gray-200">
                          <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span className="text-xs text-gray-500">Shape</span>
                          <span className="text-sm font-semibold text-gray-900 capitalize">{plot.shape}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-gray-500">Terrain</span>
                          <span className="text-sm font-semibold text-gray-900 capitalize">{plot.terrain}</span>
                        </div>
                      </div>

                      {/* Land Use Badge and Status */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
                          {plot.landUse}
                        </span>
                        <span className="text-green-600 font-semibold text-xs">
                          {plot.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {plot.description}
                      </p>

                      {/* Features */}
                      {plot.features && plot.features.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {plot.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                            {plot.features.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                                +{plot.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleViewDetails(plot._id, plot)}
                          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          View Details
                        </button>

                        {/* Contact and Share Buttons */}
                        <div className="flex gap-2">
                          {/* Email Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const locationStr = [plot.district, plot.sector].filter(Boolean).join(", ") || 'N/A';
                              const priceStr = (plot.price || 0).toLocaleString('en-US');
                              const subject = encodeURIComponent(`Inquiry about: ${plot.title}`);
                              const body = encodeURIComponent(`Hello,\n\nI am interested in the following plot:\n\nTitle: ${plot.title}\nPrice: ${priceStr} RWF\nLocation: ${locationStr}\n\nPlease provide more information.\n\nThank you.`);
                              window.location.href = `mailto:announcementsafricaltd@gmail.com?subject=${subject}&body=${body}`;
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2 rounded-lg font-medium hover:bg-green-100 transition-all duration-200 text-xs"
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
                                title: plot.title,
                                text: `${plot.title}\nPrice: ${plot.price || 'N/A'}\n\n${plot.description || 'Check out this amazing plot!'}`,
                                url: `${window.location.origin}/plot/${plot._id}`
                              };
                              // Add image if available
                              if (plot.mainImage) {
                                fetch(plot.mainImage)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const file = new File([blob], 'plot.jpg', { type: 'image/jpeg' });
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
                              const message = `Hi, I'm interested in your plot: ${plot.title} - ${window.location.origin}/plot/${plot._id}`;
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
                  </div>
                ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredPlots.length > 0 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {(() => {
                const canPrev = currentPage > 1;
                const canNext = currentPage < totalPages;
                const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                return (
                  <>
                    <button
                      onClick={() => canPrev && setCurrentPage((p) => p - 1)}
                      disabled={!canPrev}
                      className={`px-3 py-2 rounded border ${canPrev ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      Prev
                    </button>
                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-2 rounded border ${p === currentPage ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => canNext && setCurrentPage((p) => p + 1)}
                      disabled={!canNext}
                      className={`px-3 py-2 rounded border ${canNext ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
              Why Choose Our Plot Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide comprehensive land plot solutions with quality
              assurance and excellent customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quality Plots
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All plots are thoroughly vetted and come with detailed
                documentation and legal verification.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Competitive Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Best market prices with flexible payment options and transparent
                pricing structure.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🛠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                After-Sales Support
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive land development services and 24/7 customer
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

export default PlotPage;