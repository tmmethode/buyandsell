import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Header from "../Header";
import Footer from "../Footer";
import ContractModal from "../ContractModal";
import {
  Phone,
  MessageCircle,
  Mail,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
} from "lucide-react";

import { useParams } from "react-router-dom";
import apiBaseUrl from "../../config";

const CarDetailsPage = ({ onSectionChange, carId: propCarId, carData, onBack }) => {
  const params = useParams();
  const carId = propCarId || params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const thumbnailRef = useRef(null);
  const [carState, setCarState] = useState(carData || null);
  const [loading, setLoading] = useState(Boolean(!carData && carId));
  const [error, setError] = useState(null);
  const [mainObjectFit, setMainObjectFit] = useState("cover");
  const [mainImageError, setMainImageError] = useState(false);
  const [similarCars, setSimilarCars] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Scroll to top when component mount
  useEffect(() => {
    // Smooth scroll to top with fallback for older browsers
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }

    // Also scroll the body element for better compatibility
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Fetch car when we have an id but no data
  useEffect(() => {
    const apiBase = apiBaseUrl;
    if (!carId) return;
    if (carState) return; // already have data
    if (!apiBase) {
      console.error("REACT_APP_API_BASE_URL is not set");
      setError("Missing API base URL");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetch(`${apiBase}/api/cars/${carId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setCarState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Failed to load car");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [carId, carState]);

  // Use the passed car data or fetched carState if available
  const effectiveData = carState || carData;

  // Car data is taken only from API/props now (no local dummy data)

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

  const navigateImage = (direction, imagesLength) => {
    if (direction === "prev") {
      setSelectedImage((s) => (s > 0 ? s - 1 : imagesLength - 1));
    } else {
      setSelectedImage((s) => (s < imagesLength - 1 ? s + 1 : 0));
    }
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e) => {
    if (!isLightboxOpen) return;

    if (e.key === 'Escape') {
      setIsLightboxOpen(false);
    } else if (e.key === 'ArrowLeft') {
      navigateImage('prev', getCombinedImages().length);
    } else if (e.key === 'ArrowRight') {
      navigateImage('next', getCombinedImages().length);
    }
  }, [isLightboxOpen, selectedImage]);

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

  // Determine the effective car object to render. Map API fields to the shape used by UI.
  const car = effectiveData
    ? (function (d) {
      const addr = d.address || {};
      const province = d.province || addr.city || '';
      const district = d.district || addr.district || '';
      const sector = d.sector || addr.sector || '';
      const cell = d.cell || addr.cell || '';
      const village = d.village || addr.village || '';
      const locationDisplay = [district, sector].filter(Boolean).join(', ') || d.location || 'Unknown';
      const priceNumeric = d.priceNumeric || (d.price ? (Number(String(d.price).match(/[\d,]+/g)?.join('').replace(/,/g, '')) || 0) : 0);
      const discounted = d.discountedPrice !== undefined && d.discountedPrice !== null ? Number(d.discountedPrice) : (d.discount ? Number(d.discount) : 0);

      return {
        id: d._id || d.id,
        name: d.title || d.name || `${d.brand || ''} ${d.model || ''}`.trim() || 'Car',
        location: locationDisplay,
        locationDisplay,
        price: priceNumeric ?? null,
        priceDisplay: d.price || (priceNumeric ? `${priceNumeric.toLocaleString('en-US')} RWF` : null),
        originalPrice: priceNumeric ?? null,
        originalPriceDisplay: d.price || (priceNumeric ? `${priceNumeric.toLocaleString('en-US')} RWF` : null),
        discountedPrice: discounted ?? null,
        mileage: d.mileage || d.mileageNumeric || 0,
        mileageDisplay: d.mileage ? String(d.mileage) + ' km' : d.mileageDisplay || (d.mileage ? `${d.mileage} km` : 'N/A'),
        fuel: d.fuelType || d.fuel || d.fuelType || 'Petrol',
        transmission: d.transmission || 'Automatic',
        color: d.color || '',
        year: d.year || d.modelYear || '',
        rating: d.rating ?? null,
        reviews: d.reviews ?? (d.reviewList && d.reviewList.length) ?? null,
        likes: d.likes ?? null,
        status: d.status || null,
        description: d.description || 'No description available',
        features: d.features || [],
        specifications: d.specifications || d.specs || {},
        images: d.images || [],
        mainImage: d.mainImage || (d.images && d.images[0]) || null,
        reviewList: d.reviewList || []
      };
    })(effectiveData)
    : null;

  // Image helpers to mirror HouseDetailsPage behavior
  const normalizeImage = (img) => {
    if (!img) return '';
    if (typeof img !== 'string') return img;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    // ensure leading slash is respected with apiBaseUrl
    const rel = img.startsWith('/') ? img.slice(1) : img;
    return apiBaseUrl ? `${apiBaseUrl}/${rel}` : img;
  };

  const getCombinedImages = () => {
    const imgs = (car?.images || []).slice();
    const mainImg = car?.mainImage;
    const all = [];
    if (mainImg && !imgs.includes(mainImg)) {
      all.push(normalizeImage(mainImg));
    }
    imgs.forEach((im) => all.push(normalizeImage(im)));
    return all;
  };

  const activeImageSrc = useMemo(() => {
    const all = getCombinedImages();
    if (all.length > 0 && selectedImage < all.length) return all[selectedImage];
    return '';
  }, [car, selectedImage]);

  // when the underlying car changes (identity or image set), reset selected image/index and object-fit/error
  useEffect(() => {
    setSelectedImage(0);
    setMainObjectFit("cover");
    setMainImageError(false);
    if (getCombinedImages().length === 0) {
      setMainImageError(true);
    }
    // Only run when car identity or its images set changes, not on every render
  }, [car?.id, (car?.images || []).length, car?.mainImage]);

  const handleMainImageLoad = (e) => {
    try {
      const { naturalWidth, naturalHeight } = e.target;
      if (naturalWidth && naturalHeight) {
        setMainObjectFit(naturalWidth < naturalHeight ? "contain" : "cover");
      }
    } catch (err) {
      // ignore
    }
  };

  const formatCurrency = (v) => {
    if (v === undefined || v === null || Number.isNaN(Number(v))) return "";
    return Number(v).toLocaleString("en-US") + " RWF";
  };

  // Fetch similar cars when Similar tab is activated
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!effectiveData) return;
      if (similarCars && similarCars.length > 0) return; // cache
      try {
        setLoadingSimilar(true);
        const base = `${apiBaseUrl}/api/cars`;
        const brand = effectiveData.brand || carState?.brand || '';
        const category = effectiveData.category || carState?.category || '';
        let url = `${base}?limit=6`;
        if (brand) {
          const qs = new URLSearchParams({ brand, limit: '6' });
          url = `${base}?${qs.toString()}`;
        } else if (category) {
          const qs = new URLSearchParams({ category, limit: '6' });
          url = `${base}?${qs.toString()}`;
        }

        const res = await fetch(url);
        let list = [];
        if (res.ok) {
          const data = await res.json();
          list = (data.cars || data.data || data || []).filter(Boolean);
        }

        // Fallback: recent cars
        if (!list || list.length === 0) {
          try {
            const res2 = await fetch(`${base}?limit=6`);
            if (res2.ok) {
              const data2 = await res2.json();
              list = (data2.cars || data2.data || data2 || []).filter(Boolean);
            }
          } catch (e) {
            // ignore
          }
        }

        const currentId = (effectiveData._id || effectiveData.id || car?.id);
        const filtered = (list || []).filter((c) => (c._id || c.id) !== currentId);
        setSimilarCars(filtered.slice(0, 6));
      } catch (err) {
        console.error('Error fetching similar cars:', err);
        setSimilarCars([]);
      } finally {
        setLoadingSimilar(false);
      }
    };
    if (activeTab === 'similar') {
      fetchSimilar();
    }
  }, [activeTab, effectiveData]);

  // Try to present fuel consumption as km/L when possible.
  // Handles strings like "8.5L/100km", numeric L/100km, or already in "km/L".
  const formatConsumptionToKmPerL = (raw) => {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();
    if (!s) return null;
    // If already in km/L, return as-is
    if (/km\s*\/\s*L|km\s*per\s*L|km\s*per\s*litre/i.test(s)) return s;
    // Match patterns like "8.5L/100km" or "8.5 L/100km"
    const l100 = s.match(/([\d.,]+)\s*[lL]\s*\/?\s*100\s*km/);
    if (l100) {
      const liters = parseFloat(l100[1].replace(/,/g, ""));
      if (!Number.isNaN(liters) && liters > 0) {
        const kmPerL = 100 / liters;
        return `${kmPerL.toFixed(1)} km/L`;
      }
    }
    // If the value is a plain number (assume L/100km), convert
    const justNumber = s.match(/^([\d.,]+)$/);
    if (justNumber) {
      const liters = parseFloat(justNumber[1].replace(/,/g, ""));
      if (!Number.isNaN(liters) && liters > 0) {
        return `${(100 / liters).toFixed(1)} km/L`;
      }
    }
    // Fallback: return original string
    return s;
  };

  // Small helpers to normalize numeric values and units for performance specs
  const extractNumber = (s) => {
    if (s === undefined || s === null) return null;
    const m = String(s).match(/([0-9]+(?:[.,][0-9]+)?)/);
    if (!m) return null;
    return m[1].replace(/,/g, '.');
  };

  const formatHp = (raw) => {
    if (!raw && raw !== 0) return null;
    const n = extractNumber(raw);
    return n ? `${n} hp` : String(raw);
  };

  const formatNm = (raw) => {
    if (!raw && raw !== 0) return null;
    const n = extractNumber(raw);
    return n ? `${n} Nm` : String(raw);
  };

  const formatKmh = (raw) => {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();
    // if already contains km/h, return as-is
    if (/km\s*\/?\s*h/i.test(s)) return s;
    const n = extractNumber(s);
    return n ? `${n} km/h` : s;
  };

  // If we navigated by id and are still loading, show a loader to avoid flashing wrong car
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
          <div>Loading car details…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  // No data available case (no props and no API result)
  if (!effectiveData || !car) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSectionChange={onSectionChange}
          activeSection="car"
          onOpenContract={() => setShowContractModal(true)}
        />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-3">🚗</div>
            <div className="text-lg">No car data available.</div>
            <div className="mt-4">
              <button onClick={onBack} className="text-blue-600 hover:underline">Back to Car List</button>
            </div>
          </div>
        </div>
        <Footer onSectionChange={onSectionChange} />
      </div>
    );
  }

  // local specs so UI can conditionally render only available fields
  const specs = car.specifications || {};

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSectionChange={onSectionChange}
        activeSection="car"
        onOpenContract={() => setShowContractModal(true)}
      />

      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => onSectionChange("car")}
              className="hover:text-purple-600"
            >
              Car Sales
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">{car.name}</span>
          </nav>
        </div>
      </section>

      {/* Back Button */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <button
            onClick={() => {
              if (typeof onBack === 'function') return onBack();
              if (typeof onSectionChange === 'function') return onSectionChange('car');
              window.history.back();
            }}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
          >
            <span>←</span>
            <span>Back to Car List</span>
          </button>
        </div>
      </section>

      {/* Car Images Gallery */}
      <section className="bg-white py-4 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Main Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative">
                <div className="h-64 sm:h-80 lg:h-96 bg-gray-100 rounded-xl overflow-hidden group">
                  <>
                    <img
                      key={activeImageSrc}
                      src={activeImageSrc}
                      alt={car.name}
                      className="w-full h-full object-center transition-all duration-700 group-hover:scale-105 cursor-pointer"
                      style={{ display: mainImageError ? 'none' : 'block', objectFit: mainObjectFit }}
                      onLoad={handleMainImageLoad}
                      onClick={() => setIsLightboxOpen(true)}
                      onError={() => {
                        const all = getCombinedImages();
                        if (all.length > 1) {
                          const nextIndex = (selectedImage + 1) % all.length;
                          setSelectedImage(nextIndex);
                          setMainImageError(false);
                          setMainObjectFit('cover');
                          return;
                        }
                        setMainImageError(true);
                      }}
                    />
                    {/* Fallback for failed images */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center"
                      style={{ display: mainImageError ? 'flex' : 'none' }}>
                      <span className="text-white text-6xl">🚗</span>
                    </div>
                  </>
                </div>

                {(() => {
                  const all = getCombinedImages();
                  if (all.length > 0) {
                    return (
                      <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                        {selectedImage + 1} / {all.length}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Navigation Arrows */}
                <button
                  onClick={() => navigateImage("prev", getCombinedImages().length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => navigateImage("next", getCombinedImages().length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Like Button */}
                <button
                  onClick={() => setLiked(!liked)}
                  className={`absolute top-3 right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${liked
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white backdrop-blur-sm"
                    }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                </button>

                {/* Rating Badge (only when rating exists) */}
                {car.rating ? (
                  <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                    <div className="flex">{renderStars(car.rating)}</div>
                    <span className="text-sm font-semibold text-gray-700">{car.rating}</span>
                  </div>
                ) : null}
              </div>

              {/* Thumbnail Images with Scroll (only when available) */}
              {(() => {
                const all = getCombinedImages(); return all && all.length > 0 ? (
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
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {all.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => { setSelectedImage(index); setMainImageError(false); }}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                            ? "ring-2 ring-blue-500 ring-offset-2 scale-105"
                            : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                            }`}
                        >
                          <img
                            src={image}
                            alt={`${car.name} view ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    {/* Scroll Right Button */}
                    <button
                      onClick={() => scrollThumbnails("right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : null
              })()}

              {/* YouTube Video Card - Under Thumbnails */}
              {effectiveData?.youtubeUrl && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mt-4">
                  {/* Video Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Car Video Tour</h3>
                      <p className="text-blue-100 text-xs">Watch this vehicle in action</p>
                    </div>
                  </div>

                  {/* Video Player */}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    {(() => {
                      const url = effectiveData.youtubeUrl;
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
                        videoId = url;
                      }

                      if (videoId && videoId.length === 11) {
                        return (
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title="Car Video Tour"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        );
                      }

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
                      href={effectiveData.youtubeUrl}
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

            {/* Car Info Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {car.name}
                </h1>
                <p className="text-gray-600 mb-4">{car.location}</p>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {(() => {
                      const original =
                        car.originalPrice !== undefined
                          ? car.originalPrice
                          : car.price;
                      const discounted =
                        car.discountedPrice !== undefined
                          ? car.discountedPrice
                          : null;
                      const showDiscount =
                        discounted && Number(discounted) > 0 && Number(discounted) < Number(original);

                      if (showDiscount) {
                        return (
                          <>
                            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                              {formatCurrency(discounted)}
                            </span>
                            <span className="text-base sm:text-lg text-gray-500 line-through">
                              {formatCurrency(original)}
                            </span>
                            <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                              {Math.round(((original - discounted) / original) * 100)}% OFF
                            </span>
                          </>
                        );
                      }

                      return (
                        <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                          {formatCurrency(car.price)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Quick Stats - only show values we have */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {car.mileageDisplay ? (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Mileage</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{car.mileageDisplay}</div>
                  </div>
                ) : null}

                {car.year ? (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Year</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{car.year}</div>
                  </div>
                ) : null}

                {car.fuel ? (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Fuel Type</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{car.fuel}</div>
                  </div>
                ) : null}

                {car.transmission ? (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Transmission</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{car.transmission}</div>
                  </div>
                ) : null}
              </div>

              {/* Rating and Reviews - only when available */}
              {(car.rating || car.reviews || car.likes) ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(car.rating)}</div>
                    <span className="font-semibold text-gray-900">{car.rating}</span>
                  </div>
                  {car.reviews ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{car.reviews} reviews</span>
                    </>
                  ) : null}
                  {car.likes ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">👍 {car.likes} likes</span>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* Contact Car Agent Section */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    Contact Car Agent
                  </h3>

                  {/* Agent Info */}
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                      {effectiveData?.owner?.profileImage ? (
                        <img
                          src={effectiveData.owner.profileImage.startsWith('http') ? effectiveData.owner.profileImage : `${apiBaseUrl}${effectiveData.owner.profileImage}`}
                          alt={effectiveData.owner.firstName || effectiveData.owner.name || 'Agent'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={`text-white font-bold text-lg ${effectiveData?.owner?.profileImage ? 'hidden' : 'flex'}`}>
                        {effectiveData?.owner?.firstName ? effectiveData.owner.firstName.charAt(0).toUpperCase() : (effectiveData?.owner?.name ? effectiveData.owner.name.charAt(0).toUpperCase() : 'A')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {effectiveData?.owner?.firstName && effectiveData?.owner?.lastName
                          ? `${effectiveData.owner.firstName} ${effectiveData.owner.lastName}`
                          : effectiveData?.owner?.name || 'Car Sales Agent'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {effectiveData?.owner?.email || 'Certified Vehicle Specialist'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                            title: car?.name || 'Car',
                            text: `Check out this car: ${car?.name || 'Car'}`,
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
                          Share car
                        </div>
                      </div>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        const message = `Hi, I'm interested in your car: ${car?.name || "Car"
                          } - ${window.location.href}`;
                        const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(
                          message
                        )}`;
                        window.open(whatsappUrl, "_blank");
                      }}
                      className="flex items-center justify-center space-x-2 md:space-x-3 w-full bg-green-100 text-green-600 py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-green-200 transition-all duration-200 shadow-md hover:shadow-lg"
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

              {/* Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">
                  {car.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto scrollbar-hide">
              {[
                { id: "overview", name: "Overview" },
                { id: "features", name: "Features" },
                { id: "reviews", name: "Reviews" },
                { id: "similar", name: "Similar Cars" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 py-3 sm:py-4 px-2 sm:px-3 lg:px-4 border-b-2 font-medium sm:font-semibold text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {tab.name}
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {car.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Features (4)
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const hpRaw = specs.performance?.power || car.power || specs.performance?.power;
                      const torqueRaw = specs.performance?.torque || car.torque;
                      const accel = specs.performance?.acceleration || car.acceleration;
                      const top = specs.performance?.topSpeed || car.topSpeed || specs.performance?.topSpeed;

                      return (
                        <>
                          {hpRaw ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Horsepower (hp)</span>
                              <span className="font-medium">{formatHp(hpRaw)}</span>
                            </div>
                          ) : null}

                          {torqueRaw ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Torque (Nm)</span>
                              <span className="font-medium">{formatNm(torqueRaw)}</span>
                            </div>
                          ) : null}

                          {accel ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Acceleration (0–100 km/h)</span>
                              <span className="font-medium">{accel}</span>
                            </div>
                          ) : null}

                          {top ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Top Speed (km/h)</span>
                              <span className="font-medium">{formatKmh(top)}</span>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Specifications</h3>
                  <div className="space-y-3">
                    {(() => {
                      const fuelRaw = car.fuelConsumption || specs.performance?.fuelConsumption || specs.fuel?.tankCapacity || null;
                      const fuel = formatConsumptionToKmPerL(fuelRaw);
                      const transmissionType = specs.transmission?.type || car.transmission || null;
                      const drivetrain = specs.transmission?.drivetrain || null;
                      const seats = car.seats || null;

                      return (
                        <>
                          {fuel ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fuel Consumption</span>
                              <span className="font-medium">{fuel}</span>
                            </div>
                          ) : null}

                          {transmissionType ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Transmission Type</span>
                              <span className="font-medium">{transmissionType}</span>
                            </div>
                          ) : null}

                          {drivetrain ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Drivetrain</span>
                              <span className="font-medium">{drivetrain}</span>
                            </div>
                          ) : null}

                          {seats ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Number of Seats</span>
                              <span className="font-medium">{seats}</span>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === "features" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Features & Technology
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {car.features && car.features.length > 0 ? (
                    car.features.map((feature, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">✓</span>
                          </div>
                          <span className="font-medium text-gray-900">{feature}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No features listed</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Customer Reviews
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(car.rating)}</div>
                      <span className="font-semibold text-gray-900">
                        {car.rating}
                      </span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">{car.reviews} reviews</span>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {car.reviewList && car.reviewList.length > 0 ? (
                  car.reviewList.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.user}</h4>
                          <p className="text-sm text-gray-600">{review.date}</p>
                        </div>
                        <div className="flex">{renderReviewStars(review.rating)}</div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No reviews yet</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "similar" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Cars</h2>
              {loadingSimilar ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : similarCars && similarCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarCars.map((sc) => (
                    <div
                      key={sc._id || sc.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        const id = sc._id || sc.id;
                        if (id) window.location.href = `/car/${id}`;
                      }}
                    >
                      <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                        {sc.mainImage || (Array.isArray(sc.images) && sc.images[0]) ? (
                          <img
                            src={(sc.mainImage ? sc.mainImage : sc.images[0]).startsWith('http') ? (sc.mainImage || sc.images[0]) : `${apiBaseUrl}${sc.mainImage || sc.images[0]}`}
                            alt={sc.title || sc.name || 'Car'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 items-center justify-center hidden">
                          <span className="text-white text-4xl">🚗</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{sc.title || sc.name || 'Car'}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {sc.price || (typeof sc.priceNumeric === 'number' ? `${sc.priceNumeric.toLocaleString('en-US')} RWF` : 'Price on request')}
                          </span>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {sc.mileage ? `${sc.mileage} km` : ''}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 line-clamp-1">
                          {sc.fuelType || sc.fuel} • {sc.transmission}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🚗</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No similar cars found</h3>
                  <p className="text-gray-600">We couldn't find any similar cars right now.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Interested in this car?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Contact our sales team for more information and to schedule a
                test drive.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {/* Phone */}
              <a
                href="tel:+250788820543"
                className="text-center group hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-blue-700 transition-colors duration-200">
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Call Us
                </h3>
                <p className="text-gray-600 text-sm sm:text-base group-hover:text-blue-600">
                  (+250) 788 820 543
                </p>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/250788820543"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center group hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-green-700 transition-colors duration-200">
                  <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  WhatsApp
                </h3>
                <p className="text-gray-600 text-sm sm:text-base group-hover:text-blue-600">
                  Send us a message
                </p>
              </a>

              {/* Share */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: car?.name || 'Car',
                      text: `Check out this car: ${car?.name || 'Car'}`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="text-center group hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-purple-700 transition-colors duration-200">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white"
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
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Share
                </h3>
                <p className="text-gray-600 text-sm sm:text-base group-hover:text-purple-600">
                  Share this car
                </p>
              </button>

              {/* Email */}
              <a
                href="mailto:announcementafrica@Email.com"
                className="text-center group hover:transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-purple-700 transition-colors duration-200">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email
                </h3>
                <p className="text-gray-600 text-sm sm:text-base break-all sm:break-normal group-hover:text-blue-600">
                  announcementafrica@Email.com
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Contact Bar for Mobile */}
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
              const message = `Hi, I'm interested in your car: ${car?.name || "Car"} - ${window.location.href}`;
              const whatsappUrl = `https://wa.me/250788820543?text=${encodeURIComponent(message)}`;
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

      {/* Contract Modal */}
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        item={car}
        itemType="Car"
      />

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
            onClick={(e) => { e.stopPropagation(); navigateImage('prev', getCombinedImages().length); }}
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
              src={getCombinedImages()[selectedImage]}
              alt={car?.title || 'Car image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Navigation - Next */}
          <button
            onClick={(e) => { e.stopPropagation(); navigateImage('next', getCombinedImages().length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 z-50"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Thumbnail Strip at Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-xl z-50 max-w-[90vw] overflow-x-auto">
            {getCombinedImages().map((image, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                  ? 'ring-2 ring-white scale-105'
                  : 'opacity-60 hover:opacity-100'
                  }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default CarDetailsPage;
