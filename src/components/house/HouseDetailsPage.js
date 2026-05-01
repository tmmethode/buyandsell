import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Header from "../Header";
import Footer from "../Footer";
import ContractModal from "../ContractModal";
import {
  Phone,
  MessageCircle,
  Mail,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  MapPin,
  Home,
  Calendar,
  Car,
  X,
  ZoomIn,
  Maximize2,
} from "lucide-react";
import apiBaseUrl from "../../config";

const HouseDetailsPage = ({
  onSectionChange,
  houseId = null,
  houseData = null,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [mainObjectFit, setMainObjectFit] = useState("cover");
  const [triedAlt, setTriedAlt] = useState(false);
  const [similarHouses, setSimilarHouses] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const thumbnailRef = useRef(null);
  // Local house state: use prop if provided, otherwise we'll fetch by houseId
  const [houseState, setHouseState] = useState(houseData);

  // Keep houseState in sync if parent passes new houseData
  useEffect(() => {
    setHouseState(houseData);
  }, [houseData]);

  // If no houseData prop but a houseId is provided, fetch the house
  useEffect(() => {
    const fetchHouseById = async (id) => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/houses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch house");
        const data = await res.json();
        // API may return { house } or { data: house } or the house directly
        const house = data.house || data.data || data;
        setHouseState(house);
      } catch (err) {
        console.error("Error fetching house by id:", err);
      }
    };

    if (!houseData && houseId) {
      fetchHouseById(houseId);
    }
  }, [houseId, houseData]);

  // Helper function to get combined images array
  const getCombinedImages = () => {
    const imgs = houseState?.images || [];
    const mainImg = houseState?.mainImage;
    const allImages = [];
    if (mainImg && !imgs.includes(mainImg)) {
      allImages.push(
        mainImg.startsWith("http") ? mainImg : `${apiBaseUrl}${mainImg}`
      );
    }
    if (imgs.length > 0) {
      imgs.forEach((img) => {
        allImages.push(img.startsWith("http") ? img : `${apiBaseUrl}${img}`);
      });
    }
    return allImages;
  };

  // Build active image src based on selected index and provided data
  const activeImageSrc = useMemo(() => {
    if (!houseState) return "";
    const allImages = getCombinedImages();
    if (allImages.length > 0 && selectedImage < allImages.length) {
      return allImages[selectedImage];
    }
    return "";
  }, [houseState, selectedImage]);

  // On load/house change, auto-select the first loadable image
  useEffect(() => {
    if (!houseState) return;

    const allImages = getCombinedImages();

    console.log("Setting initial image selection:", { allImages });

    // Always start with selectedImage = 0 to show main image first
    setSelectedImage(0);
    setMainImageError(false);
    setMainObjectFit("cover");

    // If no images at all, show error
    if (allImages.length === 0) {
      setMainImageError(true);
    }
  }, [houseState]);

  // Reset selected image when house data changes
  useEffect(() => {
    setSelectedImage(0);
  }, [houseState]);

  // Scroll to top when component mounts
  useEffect(() => {
    // Smooth scroll to top with fallback for older browsers
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }

    // Also scroll the body element for better compatibility
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Fetch similar houses when similar tab is activated
  const fetchSimilarHouses = async () => {
    if (!houseState || similarHouses.length > 0) return;
    setLoadingSimilar(true);
    try {
      // Try by category first (exact backend field)
      let url = `${apiBaseUrl}/api/houses?limit=6`;
      if (houseState.category) {
        const qs = new URLSearchParams({
          category: houseState.category,
          limit: "6",
        });
        url = `${apiBaseUrl}/api/houses?${qs.toString()}`;
      }

      const response = await fetch(url);
      let list = [];
      if (response.ok) {
        const data = await response.json();
        list = (data.houses || data.data || data || []).filter(Boolean);
      }

      // Fallback: if none by category, get recent
      if (!list || list.length === 0) {
        try {
          const res2 = await fetch(`${apiBaseUrl}/api/houses?limit=6`);
          if (res2.ok) {
            const data2 = await res2.json();
            list = (data2.houses || data2.data || data2 || []).filter(Boolean);
          }
        } catch (e) {
          // ignore
        }
      }

      // Filter out the current house and keep first 3
      const filtered = (list || []).filter(
        (h) => (h._id || h.id) !== (houseState._id || houseState.id)
      );
      setSimilarHouses(filtered.slice(0, 3));
    } catch (error) {
      console.error("Error fetching similar houses:", error);
      setSimilarHouses([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Fetch similar houses when similar tab is clicked
  useEffect(() => {
    if (activeTab === "similar") {
      fetchSimilarHouses();
    }
  }, [activeTab]);

  // Initialize liked state based on user's favorites
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData && houseState) {
      const user = JSON.parse(userData);
      const isFavorited = houseState.favorites?.includes(user._id);
      setLiked(isFavorited);
    }
  }, [houseState]);

  // Handle like/favorite toggle
  const handleLike = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      alert('Please login to like properties');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/houses/${house.id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.isFavorite);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login to submit a review');
      return;
    }

    if (reviewRating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/houses/${house.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local house state with new rating
        setHouseState(prev => ({
          ...prev,
          rating: data.rating,
          ratingCount: data.ratingCount,
          reviews: data.reviews
        }));
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewComment('');
        alert('Review submitted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index) => {
    const allImages = getCombinedImages();

    console.log("Thumbnail clicked:", index, "Image:", allImages[index]);
    setSelectedImage(index);
    setMainImageError(false);
    setTriedAlt(false);
  };

  const handleMainImageLoad = (e) => {
    try {
      const { naturalWidth, naturalHeight } = e.target;
      // If the image is portrait, use 'contain' so it isn't heavily cropped
      if (naturalHeight > naturalWidth) {
        setMainObjectFit("contain");
      } else {
        setMainObjectFit("cover");
      }
      setMainImageError(false);
    } catch (err) {
      // ignore
    }
  };

  // Use the passed house data (or fetched houseState) if available
  const house = houseState
    ? {
      // Map API fields to the expected format
      id: houseState._id || houseState.id,
      name: houseState.title || houseState.name,
      category: houseState.category?.toLowerCase() || "middle",
      type: houseState.propertyType?.toLowerCase() || "house",
      location: houseState.location || "Unknown",
      locationDisplay: `${houseState.district || "Unknown"}, ${houseState.sector || "Unknown"
        }`,
      province: houseState.province || "Unknown",
      district: houseState.district || "Unknown",
      sector: houseState.sector || "Unknown",
      cell: houseState.cell || "Unknown",
      village: houseState.village || "Unknown",
      discountedPrice: houseState.discountedPrice ?? "",
      price:
        Number(houseState.discountedPrice) > 0
          ? Number(houseState.discountedPrice)
          : Number(houseState.priceNumeric) || Number(houseState.price) || 0,
      priceDisplay:
        Number(houseState.discountedPrice) > 0
          ? `${Number(houseState.discountedPrice).toLocaleString(
            "en-US"
          )} RWF`
          : Number(houseState.priceNumeric || houseState.price)
            ? `${(
              Number(houseState.priceNumeric) || Number(houseState.price)
            ).toLocaleString("en-US")} RWF`
            : "Price on request",
      originalPrice:
        Number(houseState.priceNumeric) || Number(houseState.price) || 0,
      originalPriceDisplay:
        Number(houseState.priceNumeric) || Number(houseState.price)
          ? `${(
            Number(houseState.priceNumeric) || Number(houseState.price)
          ).toLocaleString("en-US")} RWF`
          : "Price on request",
      discount:
        houseState.discountedPrice !== undefined &&
          houseState.discountedPrice !== null &&
          String(houseState.discountedPrice).trim() !== "" &&
          Number(houseState.discountedPrice) > 0 &&
          Number(houseState.priceNumeric) > Number(houseState.discountedPrice)
          ? `${Math.round(
            (100 *
              (Number(houseState.priceNumeric) -
                Number(houseState.discountedPrice))) /
            Number(houseState.priceNumeric)
          )}% OFF`
          : null,
      size: houseState.area || 0,
      sizeDisplay: `${houseState.area || 0} ${houseState.areaUnit || "sqm"}`,
      bedrooms: houseState.bedrooms || 0,
      bathrooms: houseState.bathrooms || 0,
      numberOfDoors: houseState.numberOfDoors || 0,
      listingType: houseState.listingType || "For Sale",
      parking: houseState.parkingSpaces || 0,
      parkingSpaces: houseState.parkingSpaces || 0,
      roadType: houseState.roadType || "N/A",
      sewageSystem: houseState.sewageSystem || "N/A",
      nearbyAmenities: Array.isArray(houseState.nearbyAmenities)
        ? houseState.nearbyAmenities
        : [],
      floors: 0, // Not in API
      yearBuilt: houseState.yearBuilt || 0,
      yearRenovated: houseState.yearRenovated || null,
      rating: 4.5, // Default rating
      reviews: 0, // No reviews in API
      likes: 0, // No likes in API
      status: houseState.status || "Available",
      description: houseState.description || "No description available",
      features: houseState.features || [],
      specifications: {
        dimensions: {
          plotSize: "N/A",
          builtArea: `${houseState.area || 0} ${houseState.areaUnit || "sqm"
            }`,
          frontage: "N/A",
          depth: "N/A",
        },
        construction: {
          structure: "Reinforced Concrete",
          roof: "Tiled Roof",
          walls: "Brick & Plaster",
          windows: "Aluminum Double Glazed",
          doors: "Solid Wood",
        },
        utilities: {
          water: houseState.waterSupply ? "Available" : "Not Available",
          electricity: houseState.electricity ? "Available" : "Not Available",
          internet: houseState.internet ? "Available" : "Not Available",
          sewage: houseState.sewageSystem || "Municipal",
        },
        amenities: {
          kitchen: "Modern Kitchen",
          bathrooms: `${houseState.bathrooms || 0} Full`,
          bedrooms: `${houseState.bedrooms || 0} Standard`,
          living: "Open Plan Design",
          dining: "Integrated",
        },
      },
      images: houseState.images || [],
      mainImage: houseState.mainImage || houseState.images?.[0] || null,
      youtubeUrl: houseState.youtubeUrl || null,
      reviewList: [], // No reviews in API
    }
    : null;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400" />);
    }

    return stars;
  };

  const scrollThumbnails = (direction) => {
    const container = thumbnailRef.current;
    const scrollAmount = 200;

    if (direction === "left") {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  const navigateImage = (direction) => {
    const allImages = getCombinedImages();

    if (allImages.length <= 1) return; // No navigation needed for single image

    if (direction === "prev") {
      setSelectedImage(
        selectedImage > 0 ? selectedImage - 1 : allImages.length - 1
      );
    } else {
      setSelectedImage(
        selectedImage < allImages.length - 1 ? selectedImage + 1 : 0
      );
    }
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e) => {
    if (!isLightboxOpen) return;

    if (e.key === 'Escape') {
      setIsLightboxOpen(false);
    } else if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    }
  }, [isLightboxOpen, navigateImage]);

  // Add/remove keyboard listener for lightbox
  useEffect(() => {
    if (isLightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, handleKeyDown]);

  const renderReviewStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= rating ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // Show loading UI when navigating to a specific id but the house hasn't been fetched yet.
  const isLoadingById = Boolean(houseId && !houseState);
  if (isLoadingById) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSectionChange={onSectionChange}
          activeSection="house"
          onOpenContract={() => setShowContractModal(true)}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading property...</p>
          </div>
        </div>
        <Footer onSectionChange={onSectionChange} />
      </div>
    );
  }

  // No data available case (no props and no API result)
  if (!house) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSectionChange={onSectionChange}
          activeSection="house"
          onOpenContract={() => setShowContractModal(true)}
        />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-3">🏠</div>
            <div className="text-lg">No house data available.</div>
            <div className="mt-4">
              <button
                onClick={onBack}
                className="text-blue-600 hover:underline"
              >
                Back to Property List
              </button>
            </div>
          </div>
        </div>
        <Footer onSectionChange={onSectionChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSectionChange={onSectionChange}
        activeSection="house"
        onOpenContract={() => setShowContractModal(true)}
      />

      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => onSectionChange("house")}
              className="hover:text-blue-600"
            >
              House
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">{house.name}</span>
          </nav>
        </div>
      </section>

      {/* Back Button */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <button
            onClick={() => {
              if (typeof onBack === "function") return onBack();
              if (typeof onSectionChange === "function")
                return onSectionChange("house");
              window.history.back();
            }}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
          >
            <span>←</span>
            <span>Back to Property List</span>
          </button>
        </div>
      </section>

      {/* House Images Gallery */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative">
                <div
                  className="h-72 sm:h-96 lg:h-[500px] bg-gray-100 rounded-2xl overflow-hidden group cursor-zoom-in shadow-lg"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  {/* Zoom overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 z-10 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Maximize2 className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <>
                    <img
                      key={activeImageSrc}
                      src={activeImageSrc}
                      alt={house.name}
                      className="w-full h-full object-center transition-all duration-700 group-hover:scale-105"
                      style={{
                        display: mainImageError ? "none" : "block",
                        objectFit: mainObjectFit,
                      }}
                      onLoad={handleMainImageLoad}
                      onError={(e) => {
                        console.log("Image load error:", activeImageSrc);
                        console.log("House data:", {
                          images: house.images,
                          mainImage: house.mainImage,
                          selectedImage,
                        });

                        const allImages = getCombinedImages();

                        // Simple fallback: try next image if available
                        if (allImages.length > 1) {
                          const nextIndex =
                            (selectedImage + 1) % allImages.length;
                          console.log(
                            "Trying next image:",
                            nextIndex,
                            allImages[nextIndex]
                          );
                          setSelectedImage(nextIndex);
                          setMainImageError(false);
                          setMainObjectFit("cover");
                          return;
                        }

                        // If only one image or no more images, show fallback
                        setMainImageError(true);
                      }}
                    />
                    {/* Fallback for failed images */}
                    <div
                      className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center"
                      style={{ display: mainImageError ? "flex" : "none" }}
                    >
                      <span className="text-white text-6xl">🏠</span>
                    </div>
                  </>
                </div>

                {/* Image Counter */}
                {(() => {
                  const allImages = getCombinedImages();

                  if (allImages.length > 0) {
                    return (
                      <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                        {selectedImage + 1} / {allImages.length}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Navigation Arrows */}
                <button
                  onClick={() => navigateImage("prev")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => navigateImage("next")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className={`absolute top-3 right-3 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${liked
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-600 hover:bg-red-500 hover:text-white"
                    }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                </button>

                {/* Rating Badge */}
                <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                  <div className="flex">{renderStars(house.rating)}</div>
                  <span className="text-sm font-semibold text-gray-700">
                    {house.rating}
                  </span>
                </div>
              </div>

              {/* Thumbnail Images with Scroll */}
              <div className="relative">
                {/* Scroll Left Button */}
                <button
                  onClick={() => scrollThumbnails("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Thumbnails Container */}
                <div
                  ref={thumbnailRef}
                  className="flex space-x-2 overflow-x-auto scrollbar-hide px-10 py-2 scroll-smooth"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {(() => {
                    const allImages = getCombinedImages();

                    if (allImages.length > 0) {
                      return allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => handleThumbnailClick(index)}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                            ? "ring-2 ring-blue-500 ring-offset-2 scale-105"
                            : "hover:ring-gray-300 hover:ring-offset-1"
                            }`}
                        >
                          <img
                            src={
                              typeof image === "string"
                                ? image.startsWith("http")
                                  ? image
                                  : `${apiBaseUrl}${image}`
                                : image
                            }
                            alt={`${house.name} view ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ));
                    } else {
                      return (
                        <div className="text-gray-400 text-sm p-4">
                          No images available
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Scroll Right Button */}
                <button
                  onClick={() => scrollThumbnails("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* YouTube Video Card - Under Thumbnails */}
              {houseState?.youtubeUrl && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mt-4">
                  {/* Video Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Property Video Tour</h3>
                      <p className="text-red-100 text-xs">Watch a walkthrough of this property</p>
                    </div>
                  </div>

                  {/* Video Player */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    {(() => {
                      const url = houseState.youtubeUrl;
                      let videoId = '';

                      // Extract video ID from various YouTube URL formats
                      if (url.includes('youtube.com/watch')) {
                        try {
                          const urlParams = new URLSearchParams(new URL(url).search);
                          videoId = urlParams.get('v') || '';
                        } catch {
                          videoId = '';
                        }
                      } else if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
                      } else if (url.includes('youtube.com/embed/')) {
                        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
                      } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
                        // Only use as video ID if it matches YouTube ID format (11 chars)
                        videoId = url;
                      }

                      // Only render iframe if we have a valid video ID
                      if (videoId && videoId.length === 11) {
                        return (
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title="Property Video Tour"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        );
                      }

                      // Show error message for invalid URLs
                      return (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                          <div className="text-center p-4">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm">Invalid YouTube URL</p>
                            <p className="text-xs mt-1">Please use a valid YouTube link</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Video Footer */}
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Virtual Tour</span>
                    </div>
                    <a
                      href={houseState.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      Watch on YouTube
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* House Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {house.name}
                </h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{house.locationDisplay}</span>
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {(() => {
                      const rawDiscount = house.discountedPrice;
                      const hasRawDiscount =
                        rawDiscount !== undefined &&
                        rawDiscount !== null &&
                        String(rawDiscount).trim() !== "";
                      const originalNum = isFinite(Number(house.originalPrice))
                        ? Number(house.originalPrice)
                        : 0;
                      const discountNum =
                        hasRawDiscount && isFinite(Number(rawDiscount))
                          ? Number(rawDiscount)
                          : 0;
                      const hasDiscount =
                        hasRawDiscount &&
                        discountNum > 0 &&
                        originalNum > 0 &&
                        discountNum < originalNum;

                      if (hasDiscount) {
                        return (
                          <>
                            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                              {`${Number(discountNum).toLocaleString(
                                "en-US"
                              )} RWF`}
                            </span>
                            <span className="text-base sm:text-lg text-gray-500 line-through">
                              {house.originalPriceDisplay}
                            </span>
                            <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                              {house.discount}
                            </span>
                            <span className="text-green-600 font-semibold text-sm sm:text-base ml-2">
                              {`Save ${(
                                originalNum - discountNum
                              ).toLocaleString("en-US")} RWF`}
                            </span>
                          </>
                        );
                      }

                      // No discount: show original price prominently
                      if (originalNum > 0) {
                        return (
                          <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                            {house.originalPriceDisplay}
                          </span>
                        );
                      }

                      return (
                        <span className="text-2xl sm:text-3xl font-bold text-gray-500">
                          Price on request
                        </span>
                      );
                    })()}
                    {house.listingType === "For Rent" && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl text-blue-600 font-medium">/month</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold uppercase">
                          For Rent
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {house.category !== "commercial property" ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                        <Home className="w-3 h-3 mr-1" />
                        Bedrooms
                      </div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {house.bedrooms}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-600">
                        Bathrooms
                      </div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {house.bathrooms}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 col-span-2">
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                      <Home className="w-3 h-3 mr-1" />
                      Number of Doors
                    </div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      {house.numberOfDoors || "N/A"}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600">Area</div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {house.sizeDisplay}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Category
                  </div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base capitalize">
                    {house.category || "N/A"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Listing Type
                  </div>
                  <div className="font-semibold text-sm sm:text-base">
                    <span className={`px-2 py-1 rounded-full text-xs ${house.listingType === "For Rent" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {house.listingType || "For Sale"}
                    </span>
                  </div>
                </div>
              </div>



              {/* Rating and Reviews */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
                <div className="flex items-center space-x-2">
                  <div className="flex">{renderStars(house.rating)}</div>
                  <span className="font-semibold text-gray-900">
                    {house.rating}
                  </span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">{house.reviews} reviews</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">❤️ {house.likes} likes</span>
              </div>

              {/* Contact Property Agent Section - Replace the old action buttons */}
              <div className="space-y-4">
                {/* Contact Property Agent Header */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    Agent
                  </h3>

                  {/* Agent Info */}
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                      {houseState?.owner?.profileImage ? (
                        <img
                          src={houseState.owner.profileImage.startsWith('http') ? houseState.owner.profileImage : `${apiBaseUrl}${houseState.owner.profileImage}`}
                          alt={houseState.owner.firstName || houseState.owner.name || 'Agent'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={`text-white font-bold text-lg ${houseState?.owner?.profileImage ? 'hidden' : 'flex'}`}>
                        {houseState?.owner?.firstName ? houseState.owner.firstName.charAt(0).toUpperCase() : (houseState?.owner?.name ? houseState.owner.name.charAt(0).toUpperCase() : 'A')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {houseState?.owner?.firstName && houseState?.owner?.lastName
                          ? `${houseState.owner.firstName} ${houseState.owner.lastName}`
                          : houseState?.owner?.name || 'Property Agent'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {houseState?.owner?.email || 'Licensed Real Estate Agent'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3">
                    {/* Call Now Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        window.location.href = `tel:${phone}`;
                      }}
                      className="flex items-center justify-center space-x-2 md:space-x-3 w-full bg-blue-100 text-blue-600 py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-blue-200 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div className="text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base">
                          Call Now
                        </div>
                        <div className="text-xs md:text-sm opacity-75">
                          +250 788 820 543
                        </div>
                      </div>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: house?.name || 'Property',
                            text: `Check out this property: ${house?.name || 'Property'}`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="flex items-center justify-center space-x-2 md:space-x-3 w-full bg-purple-100 text-purple-600 py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-purple-200 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                      <div className="text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base">
                          Share
                        </div>
                        <div className="text-xs md:text-sm opacity-75">
                          Share property
                        </div>
                      </div>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        const message = `Hi, I'm interested in your property: ${house?.name || "Property"
                          } - ${window.location.href}`;
                        const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(
                          message
                        )}`;
                        window.open(whatsappUrl, "_blank");
                      }}
                      className="flex items-center justify-center space-x-2 md:space-x-3 w-full bg-green-100 text-green-600 py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-green-200 transition-all duration-200 shadow-md hover:shadow-lg sm:col-span-2 lg:col-span-1"
                    >
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.63z" />
                      </svg>
                      <div className="text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base">
                          WhatsApp
                        </div>
                        <div className="text-xs md:text-sm opacity-75">
                          Chat instantly
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Available 24/7 Notice */}
                  <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-xs md:text-sm text-center">
                        Available 24/7 for inquiries
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Tabs Navigation - Fix responsive issues */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide">
            {[
              { id: "overview", name: "Overview" },
              { id: "reviews", name: "Reviews" },
              { id: "similar", name: "Similar Houses" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-3 md:py-4 px-3 md:px-4 border-b-2 font-medium text-sm md:text-base transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content - Complete all tabs with proper container */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 md:space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                {house.description}
              </p>
            </div>


          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Customer Reviews
                </h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(house.rating)}</div>
                    <span className="font-semibold text-gray-900 text-sm md:text-base">
                      {house.rating}
                    </span>
                  </div>
                  <span className="text-gray-600 hidden sm:inline">•</span>
                  <span className="text-gray-600 text-sm md:text-base">
                    {house.reviews} reviews
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 text-sm md:text-base self-start sm:self-auto"
              >
                Write a Review
              </button>
            </div>

            {/* No Reviews State */}
            <div className="text-center py-8 md:py-12">
              <div className="text-gray-400 text-4xl md:text-6xl mb-4">💬</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 text-sm md:text-base mb-4">
                Be the first to share your experience with this property.
              </p>
              <button
                onClick={() => setShowReviewModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 text-sm md:text-base"
              >
                Write First Review
              </button>
            </div>
          </div>
        )}

        {/* Similar Houses Tab */}
        {activeTab === "similar" && (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Similar Properties
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Properties with similar features and location
              </p>
            </div>

            {loadingSimilar ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 md:p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : similarHouses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {similarHouses.map((house) => (
                  <div
                    key={house._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                    onClick={() => {
                      const id = house._id || house.id;
                      if (id) window.location.href = `/house/${id}`;
                    }}
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                      {/* Property ID Badge for Similar Houses */}
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
                        ID:{" "}
                        {(house._id || house.id || "N/A")
                          .toString()
                          .slice(0, 4)}
                      </div>

                      {house.mainImage || (house.images && house.images[0]) ? (
                        <img
                          src={
                            house.mainImage
                              ? house.mainImage.startsWith("http")
                                ? house.mainImage
                                : `${apiBaseUrl}${house.mainImage}`
                              : house.images[0].startsWith("http")
                                ? house.images[0]
                                : `${apiBaseUrl}${house.images[0]}`
                          }
                          alt={house.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center hidden">
                        <span className="text-white text-4xl">🏠</span>
                      </div>
                    </div>

                    <div className="p-4 md:p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {house.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {house.district}, {house.sector}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">
                          {house.discountedPrice > 0
                            ? `${Number(house.discountedPrice).toLocaleString(
                              "en-US"
                            )} RWF`
                            : `${Number(
                              house.priceNumeric || house.price || 0
                            ).toLocaleString("en-US")} RWF`}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <span>{house.bedrooms}B</span>
                          <span className="mx-1">•</span>
                          <span>{house.bathrooms}Ba</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="text-gray-400 text-4xl md:text-6xl mb-4">
                  🏠
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  No similar properties found
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Try browsing our full catalog for more options.
                </p>
                <button
                  onClick={() => onSectionChange("house")}
                  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 text-sm md:text-base"
                >
                  Browse All Properties
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Contact Bar for Mobile - Add this at the bottom before Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-50 sm:hidden">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const phone = "+250788820543";
              window.location.href = `tel:${phone}`;
            }}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>Call</span>
          </button>

          <button
            onClick={() => {
              const phone = "+250788820543";
              const message = `Hi, I'm interested in your property: ${house?.name || "Property"
                } - ${window.location.href}`;
              const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(
                message
              )}`;
              window.open(whatsappUrl, "_blank");
            }}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.63z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 z-50"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-10 text-white px-4 py-2 rounded-full text-sm font-medium z-50">
            {selectedImage + 1} / {getCombinedImages().length}
          </div>

          {/* Navigation - Previous */}
          <button
            onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 z-50"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Main Lightbox Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImageSrc}
              alt={house?.name || 'House image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Navigation - Next */}
          <button
            onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 z-50"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Thumbnail Strip at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-xl z-50 max-w-[90vw] overflow-x-auto">
            {getCombinedImages().map((image, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); handleThumbnailClick(index); }}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                  ? 'ring-2 ring-white scale-105'
                  : 'opacity-60 hover:opacity-100'
                  }`}
              >
                <img
                  src={typeof image === 'string' ? (image.startsWith('http') ? image : `${apiBaseUrl}${image}`) : image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contract Modal */}
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        item={house}
        itemType="House"
      />

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowReviewModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this property..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{reviewComment.length}/500 characters</p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default HouseDetailsPage;
