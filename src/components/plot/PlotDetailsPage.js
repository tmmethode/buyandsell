import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import ContractModal from '../ContractModal';

import { useParams } from 'react-router-dom';
import apiBaseUrl from '../../config';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const PlotDetailsPage = ({ onSectionChange, plotId: propPlotId, plotData, onBack }) => {
  const params = useParams();
  const plotId = propPlotId || params.id;
  const [activeTab, setActiveTab] = useState('overview');
  const [liked, setLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [plotState, setPlotState] = useState(plotData || null);
  const [loading, setLoading] = useState(Boolean(!plotData && plotId));
  const [error, setError] = useState(null);
  const [mainObjectFit, setMainObjectFit] = useState('cover');
  const [similarPlots, setSimilarPlots] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const thumbnailRef = useRef(null);

  // Scroll thumbnails
  const scrollThumbnails = (direction) => {
    if (thumbnailRef.current) {
      const scrollAmount = 200;
      thumbnailRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Navigate between images
  const navigateImage = (direction) => {
    const len = combinedImages?.length || 0;
    if (len === 0) return;
    if (direction === 'prev') {
      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : len - 1);
    } else {
      setSelectedImage(selectedImage < len - 1 ? selectedImage + 1 : 0);
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

  // Scroll to top when component mounts
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

  // Reset selected image when plot data changes
  useEffect(() => {
    setSelectedImage(0);
  }, [plotState, plotData]);

  // Fetch plot when we have an id but no data
  useEffect(() => {
    const apiBase = apiBaseUrl;
    if (!plotId) return;
    if (plotState) return;
    if (!apiBase) {
      console.error('REACT_APP_API_BASE_URL is not set');
      setError('Missing API base URL');
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetch(`${apiBase}/api/plots/${plotId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setPlotState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || 'Failed to load plot');
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [plotId, plotState]);

  // Use the passed plot data or fetched plotState if available
  const effectiveData = plotState || plotData;

  const plot = effectiveData
    ? (function (d) {
      // Map API fields to the expected format using the resolved data
      return {
        id: d._id || d.id,
        name: d.title || d.name || 'Plot',
        category: d.landUse?.toLowerCase() || 'residential',
        // Build a friendly location display from address pieces when available
        location: d.location || '',
        locationDisplay: (() => {
          const addr = d.address || {};
          const province = d.province || addr.city || '';
          const district = d.district || addr.district || '';
          const sector = d.sector || addr.sector || '';
          const cell = d.cell || addr.cell || '';
          const village = d.village || addr.village || '';
          const composed = [district, sector].filter(Boolean).join(', ');
          return composed || d.location || 'Unknown';
        })(),
        price: d.priceNumeric || d.price || 0,
        priceDisplay: d.price || 'Price on request',
        originalPrice: d.priceNumeric || d.originalPrice || d.price || 0,
        originalPriceDisplay: d.price || 'Price on request',
        discountedPrice: d.discountedPrice || d.discount || null,
        size: d.area || 0,
        sizeDisplay: d.area ? `${d.area} ${d.areaUnit || 'sqm'}` : null,
        rating: d.rating ?? null,
        reviews: d.reviews ?? null,
        likes: d.likes ?? null,
        status: d.status || null,
        description: d.description || 'No description available',
        features: d.features || [],
        // Nearby landmarks/points of interest normalization
        landmarks: (() => {
          const lm = d.landmarks ?? d.nearbyLandmarks ?? d.pointsOfInterest ?? d.pois ?? null;
          if (!lm) return [];
          if (Array.isArray(lm)) return lm.filter(Boolean);
          if (typeof lm === 'string') return lm.split(',').map((s) => s.trim()).filter(Boolean);
          return [];
        })(),
        specifications: {
          dimensions: {
            length: d.dimensions?.length || null,
            width: d.dimensions?.width || null,
            area: d.area ? `${d.area} ${d.areaUnit || 'sqm'}` : null,
            frontage: d.dimensions?.frontage || null,
            depth: d.dimensions?.depth || null
          },
          zoning: {
            type: d.landUse || null,
            density: d.zoning?.density || null,
            height: d.zoning?.height || null,
            setbacks: d.zoning?.setbacks || null
          },
          utilities: {
            water: d.utilities?.water || null,
            electricity: d.utilities?.electricity || null,
            internet: d.utilities?.internet || null,
            sewage: d.utilities?.sewage || null,
            drainage: d.utilities?.drainage || null
          },
          topography: {
            type: d.terrain || null,
            slope: d.topography?.slope || null,
            drainage: d.topography?.drainage || null,
            soil: d.topography?.soil || null
          },
          legal: {
            title: d.legal?.title || null,
            survey: d.legal?.survey || null,
            permit: d.legal?.permit || null,
            restrictions: d.legal?.restrictions || null
          },
          infrastructure: {
            roads: d.infrastructure?.roads || null,
            lighting: d.infrastructure?.lighting || null,
            security: d.infrastructure?.security || null,
            parking: d.infrastructure?.parking || null
          }
        },
        images: d.images || [],
        mainImage: d.mainImage || d.images?.[0] || null,
        reviewList: d.reviewList || []
      };
    })(effectiveData)
    : null;



  // Helper: combine mainImage + images and normalize URLs (mirrors House page behavior)
  const getCombinedImages = () => {
    const apiBase = apiBaseUrl;
    const list = [];
    const addImg = (img) => {
      if (!img) return;
      let src = img;
      if (typeof src === 'string') {
        if (apiBase && !src.startsWith('http') && !src.startsWith('data:')) {
          src = `${apiBase}/${src.replace(/^\//, '')}`;
        }
      }
      if (!list.includes(src)) list.push(src);
    };
    addImg(plot?.mainImage);
    (Array.isArray(plot?.images) ? plot.images : []).forEach(addImg);
    return list;
  };

  const combinedImages = useMemo(getCombinedImages, [plot]);

  // Active image source akin to HouseDetailsPage
  const activeImageSrc = useMemo(() => {
    if (!combinedImages || combinedImages.length === 0) return null;
    const idx = Math.min(Math.max(selectedImage, 0), combinedImages.length - 1);
    return combinedImages[idx];
  }, [combinedImages, selectedImage]);

  // Safety check - if plot is still undefined, we'll handle below after loading/error

  const handleMainImageLoad = (e) => {
    try {
      const { naturalWidth, naturalHeight } = e.target;
      if (naturalWidth && naturalHeight) {
        setMainObjectFit(naturalWidth < naturalHeight ? 'contain' : 'cover');
      }
    } catch (err) {
      // ignore
    }
  };

  const formatCurrency = (v) => {
    if (v === undefined || v === null || Number.isNaN(Number(v))) return '';
    return Number(v).toLocaleString('en-US') + ' RWF';
  };

  // Fetch similar plots when Similar tab is activated
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!plot) return;
      if (similarPlots && similarPlots.length > 0) return; // cache
      try {
        setLoadingSimilar(true);
        const apiBase = apiBaseUrl;
        const landUse = (plot.specifications?.zoning?.type) || plot.category || '';
        const qs = new URLSearchParams();
        if (landUse) qs.append('landUse', landUse);
        qs.append('limit', '6');
        const url = `${apiBase}/api/plots?${qs.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch similar plots: ${res.status}`);
        const data = await res.json();
        let list = (data.plots || data.data || data || []).filter(Boolean);
        let filtered = list.filter((p) => (p._id || p.id) !== plot.id);

        // Fallback: if empty, fetch recent plots without filter
        if (!filtered || filtered.length === 0) {
          try {
            const res2 = await fetch(`${apiBase}/api/plots?limit=6`);
            if (res2.ok) {
              const data2 = await res2.json();
              list = (data2.plots || data2.data || data2 || []).filter(Boolean);
              filtered = list.filter((p) => (p._id || p.id) !== plot.id);
            }
          } catch (e) {
            // ignore fallback error
          }
        }
        setSimilarPlots((filtered || []).slice(0, 6));
      } catch (err) {
        console.error(err);
        setSimilarPlots([]);
      } finally {
        setLoadingSimilar(false);
      }
    };

    if (activeTab === 'similar') {
      fetchSimilar();
    }
  }, [activeTab, plot]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
          <div>Loading plot details…</div>
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

  if (!plot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSectionChange={onSectionChange}
          activeSection="plot"
          onOpenContract={() => setShowContractModal(true)}
        />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-3">🌍</div>
            <div className="text-lg">No plot data available.</div>
            <div className="mt-4">
              <button onClick={onBack} className="text-green-600 hover:underline">Back to Plot List</button>
            </div>
          </div>
        </div>
        <Footer onSectionChange={onSectionChange} />
      </div>
    );
  }



  // local specs object to make checks simpler (allow missing specs)
  const specs = plot.specifications || {};

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  const renderReviewStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-gray-300"}>
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
        activeSection="plot"
        onOpenContract={() => setShowContractModal(true)}
      />

      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => onSectionChange('plot')} className="hover:text-green-600">
              Plot Sales
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">{plot.name}</span>
          </nav>
        </div>
      </section>

      {/* Back Button */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <button
            onClick={() => {
              if (typeof onBack === 'function') return onBack();
              if (typeof onSectionChange === 'function') return onSectionChange('plot');
              window.history.back();
            }}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
          >
            <span>←</span>
            <span>Back to Plot List</span>
          </button>
        </div>
      </section>

      {/* Plot Images Gallery */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Image */}
            <div className="space-y-4">
              <div className="relative">
                <div className="h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl overflow-hidden relative">
                  {/* Image counter */}
                  {combinedImages && combinedImages.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      {selectedImage + 1} / {combinedImages.length}
                    </div>
                  )}
                  {activeImageSrc ? (
                    <img
                      src={activeImageSrc}
                      alt={`${plot.name} view ${selectedImage + 1}`}
                      className="w-full h-full object-center cursor-pointer"
                      onLoad={handleMainImageLoad}
                      onClick={() => setIsLightboxOpen(true)}
                      style={{ objectFit: mainObjectFit }}
                    />
                  ) : null}
                  {/* Fallback for failed images or no images */}
                  <div className={`w-full h-full flex items-center justify-center ${activeImageSrc ? 'hidden' : 'flex'}`}>
                    <span className="text-white text-8xl">🌍</span>
                  </div>

                  {/* Nav arrows (match House page UX) */}
                  {combinedImages && combinedImages.length > 1 ? (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev - 1 + combinedImages.length) % combinedImages.length)}
                        className="absolute inset-y-0 left-0 px-3 flex items-center justify-center text-white/90 hover:text-white"
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev + 1) % combinedImages.length)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center justify-center text-white/90 hover:text-white"
                        aria-label="Next image"
                      >
                        ›
                      </button>
                    </>
                  ) : null}
                </div>

                {/* Like Button */}
                <button
                  onClick={() => setLiked(!liked)}
                  className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${liked
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                >
                  <span className="text-xl">
                    {liked ? '❤️' : '🤍'}
                  </span>
                </button>

                {plot.rating ? (
                  <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(plot.rating)}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {plot.rating}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Thumbnail Images with Scroll */}
              <div className="relative">
                {/* Scroll Left Button */}
                <button
                  onClick={() => scrollThumbnails('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Thumbnails Container */}
                <div
                  ref={thumbnailRef}
                  className="flex space-x-2 overflow-x-auto scrollbar-hide px-10 py-2 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {combinedImages && combinedImages.length > 0 ? (
                    combinedImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                          ? 'ring-2 ring-green-600 ring-offset-2 scale-105'
                          : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                          }`}
                      >
                        <img
                          src={image}
                          alt={`${plot.name} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm p-4">
                      No images available
                    </div>
                  )}
                </div>

                {/* Scroll Right Button */}
                <button
                  onClick={() => scrollThumbnails('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* YouTube Video Card - Under Thumbnails */}
              {effectiveData?.youtubeUrl && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mt-4">
                  {/* Video Header */}
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Plot Video Tour</h3>
                      <p className="text-green-100 text-xs">Watch a walkthrough of this plot</p>
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
                            title="Plot Video Tour"
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
                      className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1 transition-colors"
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

            {/* Plot Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{plot.name}</h1>
                <p className="text-gray-600 mb-4">{plot.locationDisplay}</p>

                {/* Price Section - only show when we actually have price data */}
                {(plot.price || plot.discountedPrice) ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const original = plot.originalPrice !== undefined ? plot.originalPrice : plot.price;
                        const discounted = plot.discountedPrice !== undefined ? plot.discountedPrice : null;
                        const showDiscount = discounted && Number(discounted) > 0 && Number(discounted) < Number(original);

                        if (showDiscount) {
                          return (
                            <>
                              <span className="text-3xl font-bold text-blue-600">{formatCurrency(discounted)}</span>
                              <span className="text-lg text-gray-500 line-through">{formatCurrency(original)}</span>
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">{Math.round(((original - discounted) / original) * 100)}% OFF</span>
                            </>
                          );
                        }

                        return <span className="text-3xl font-bold text-blue-600">{formatCurrency(plot.price)}</span>;
                      })()}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                {plot.sizeDisplay ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Size</div>
                    <div className="font-semibold text-gray-900">{plot.sizeDisplay}</div>
                  </div>
                ) : null}

                {specs.dimensions && specs.dimensions.area ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Dimensions</div>
                    <div className="font-semibold text-gray-900">{specs.dimensions.area}</div>
                  </div>
                ) : null}

                {specs.zoning && specs.zoning.type ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Zoning</div>
                    <div className="font-semibold text-gray-900 capitalize">{specs.zoning.type}</div>
                  </div>
                ) : null}

                {specs.topography && specs.topography.type ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Topography</div>
                    <div className="font-semibold text-gray-900 capitalize">{specs.topography.type}</div>
                  </div>
                ) : null}
              </div>

              {/* Rating and Reviews */}
              {(plot.rating || plot.reviews || plot.likes) ? (
                <div className="flex items-center space-x-4">
                  {plot.rating ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(plot.rating)}</div>
                      <span className="font-semibold text-gray-900">{plot.rating}</span>
                    </div>
                  ) : null}
                  {plot.reviews ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{plot.reviews} reviews</span>
                    </>
                  ) : null}
                  {plot.likes ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">👍 {plot.likes} likes</span>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* Contact Plot Agent Section */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    Contact Plot Agent
                  </h3>

                  {/* Agent Info */}
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
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
                          : effectiveData?.owner?.name || 'Land Sales Agent'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {effectiveData?.owner?.email || 'Licensed Land Specialist'}
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
                            title: plot?.name || 'Plot',
                            text: `Check out this plot: ${plot?.name || 'Plot'}`,
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
                          Share plot
                        </div>
                      </div>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        const message = `Hi, I'm interested in your plot: ${plot?.name || "Plot"
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
                <span className="text-green-600 font-semibold">{plot.status}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'reviews', name: 'Reviews' },
                { id: 'similar', name: 'Similar Plots' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
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
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{plot.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Plot Details</h3>
                  <div className="space-y-3">
                    {plot.sizeDisplay ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size</span>
                        <span className="font-medium">{plot.sizeDisplay}</span>
                      </div>
                    ) : null}

                    {specs.dimensions?.area ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions</span>
                        <span className="font-medium">{specs.dimensions.area}</span>
                      </div>
                    ) : null}

                    {/* Land Type */}
                    {(specs.zoning?.type || plot.category) ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Land Type</span>
                        <span className="font-medium capitalize">{specs.zoning?.type || plot.category}</span>
                      </div>
                    ) : null}

                    {specs.topography?.type ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Topography</span>
                        <span className="font-medium capitalize">{specs.topography.type}</span>
                      </div>
                    ) : null}

                    {/* Road Access */}
                    {specs.infrastructure?.roads ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Road Access</span>
                        <span className="font-medium">{specs.infrastructure.roads}</span>
                      </div>
                    ) : null}

                    {/* Soil Type */}
                    {specs.topography?.soil ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Soil Type</span>
                        <span className="font-medium capitalize">{specs.topography.soil}</span>
                      </div>
                    ) : null}

                    {/* Nearby Landmarks */}
                    {Array.isArray(plot.landmarks) && plot.landmarks.length > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nearby Landmarks</span>
                        <span className="font-medium text-right">{plot.landmarks.join(', ')}</span>
                      </div>
                    ) : null}

                    {/* Water Available */}
                    {specs.utilities?.water !== undefined && specs.utilities?.water !== null ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Water Available</span>
                        <span className="font-medium">
                          {typeof specs.utilities.water === 'boolean'
                            ? (specs.utilities.water ? 'Yes' : 'No')
                            : specs.utilities.water}
                        </span>
                      </div>
                    ) : null}

                    {/* Electricity Available */}
                    {specs.utilities?.electricity !== undefined && specs.utilities?.electricity !== null ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Electricity Available</span>
                        <span className="font-medium">
                          {typeof specs.utilities.electricity === 'boolean'
                            ? (specs.utilities.electricity ? 'Yes' : 'No')
                            : specs.utilities.electricity}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(plot.rating)}
                      </div>
                      <span className="font-semibold text-gray-900">{plot.rating}</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">{plot.reviews} reviews</span>
                  </div>
                </div>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {plot.reviewList && plot.reviewList.length > 0 ? (
                  plot.reviewList.map((review) => (
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

          {activeTab === 'similar' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Plots</h2>
              {loadingSimilar ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : similarPlots && similarPlots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarPlots.map((sp) => (
                    <div
                      key={sp._id || sp.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        const id = sp._id || sp.id;
                        if (id) {
                          window.location.href = `/plot/${id}`;
                        }
                      }}
                    >
                      <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                        {sp.mainImage || (Array.isArray(sp.images) && sp.images[0]) ? (
                          <img
                            src={(sp.mainImage ? sp.mainImage : sp.images[0]).startsWith('http') ? (sp.mainImage || sp.images[0]) : `${apiBaseUrl}${sp.mainImage || sp.images[0]}`}
                            alt={sp.title || sp.name || 'Plot'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-600 items-center justify-center hidden">
                          <span className="text-white text-4xl">🌍</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {sp.title || sp.name || 'Plot'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {sp.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {sp.price || (typeof sp.priceNumeric === 'number' ? `${sp.priceNumeric.toLocaleString('en-US')} RWF` : 'Price on request')}
                          </span>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{sp.area} {sp.areaUnit || 'sqm'}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2 line-clamp-1">
                          {sp.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🌍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No similar plots found</h3>
                  <p className="text-gray-600">We couldn't find any similar plots in the same category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interested in this plot?</h2>
              <p className="text-xl text-gray-600">Contact our sales team for more information and to schedule a site visit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: plot?.name || 'Plot',
                        text: `Check out this plot: ${plot?.name || 'Plot'}`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-700 transition-colors duration-200"
                >
                  <span className="text-white text-2xl">🔗</span>
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share</h3>
                <p className="text-gray-600">Share this plot</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📞</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600">(+250) 788 820 543</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600">Send us a message</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📧</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">announcementafrica@Email.com</p>
              </div>
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
              const message = `Hi, I'm interested in your plot: ${plot?.name || "Plot"
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

      {/* Contract Modal */}
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        item={plot}
        itemType="Plot"
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
            {selectedImage + 1} / {combinedImages?.length || 0}
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
              alt={plot?.title || 'Plot image'}
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
            {combinedImages?.map((image, index) => (
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

export default PlotDetailsPage; 
