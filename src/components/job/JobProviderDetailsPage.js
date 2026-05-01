import React, { useState, useEffect, useMemo } from "react";
import Header from "../Header";
import Footer from "../Footer";
import {
  Phone,
  MessageCircle,
  Mail,
  Heart,
  Star,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  Linkedin,
  ExternalLink,
  Users,
  Building,
} from "lucide-react";

import { useParams } from "react-router-dom";
import apiBaseUrl from '../../config';

const JobProviderDetailsPage = ({ onSectionChange, providerId: propProviderId, providerData, onBack }) => {
  const params = useParams();
  const providerId = propProviderId || params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [liked, setLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [providerState, setProviderState] = useState(providerData || null);
  const [loading, setLoading] = useState(Boolean(!providerData && providerId));
  const [error, setError] = useState(null);

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

  useEffect(() => {
    setSelectedImage(0);
  }, [providerState, providerData]);

  useEffect(() => {
    if (!providerId) return;
    if (providerState) return;
    if (!apiBaseUrl) {
      console.error("REACT_APP_API_BASE_URL is not set");
      setError("Missing API base URL");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetch(`${apiBaseUrl}/api/jobs/${providerId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setProviderState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Failed to load provider");
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [providerId, providerState]);

  // Provider data now comes only from API/props
  const provider = providerState || null;

  const images = useMemo(() => {
    const list = Array.isArray(provider?.images) ? provider.images : [];
    return list.map((img) => {
      if (typeof img === 'string') return img;
      return img;
    });
  }, [provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
          <div>Loading company details…</div>
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

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSectionChange={onSectionChange} activeSection="job" />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-3">🏢</div>
            <div className="text-lg">No company data available.</div>
            <div className="mt-4">
              <button onClick={onBack} className="text-green-600 hover:underline">Back to Job List</button>
            </div>
          </div>
        </div>
        <Footer onSectionChange={onSectionChange} />
      </div>
    );
  }

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
      <Header onSectionChange={onSectionChange} activeSection="job" />

      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => onSectionChange('job')} className="hover:text-green-600">
              Job
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">{provider.company}</span>
          </nav>
        </div>
      </section>

      {/* Back Button */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
          >
            <span>←</span>
            <span>Back to Job List</span>
          </button>
        </div>
      </section>

      {/* Company Header */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Company Image */}
            <div className="space-y-4">
              <div className="relative">
                <div className="h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                  {images.length > 0 ? (
                    <span className="text-white text-8xl">{images[selectedImage]}</span>
                  ) : (
                    <span className="text-white text-6xl">🏢</span>
                  )}
                </div>
                
                {/* Like Button */}
                <button
                  onClick={() => setLiked(!liked)}
                  className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    liked
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <span className="text-xl">
                    {liked ? '❤️' : '🤍'}
                  </span>
                </button>

                {/* Rating Badge */}
                {provider.rating ? (
                  <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 flex items-center space-x-2">
                    <div className="flex">{renderStars(provider.rating)}</div>
                    <span className="text-sm font-semibold text-gray-700">{provider.rating}</span>
                  </div>
                ) : null}
              </div>

              {/* Thumbnail Images */}
              {images.length > 0 ? (
                <div className="flex space-x-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        selectedImage === index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{image}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Company Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.company}</h1>
                <p className="text-green-600 text-xl font-semibold mb-2">{provider.industry}</p>
                <p className="text-gray-600 mb-4">{provider.location}</p>
                
                <p className="text-gray-700 leading-relaxed mb-6">{provider.description}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Employees</div>
                  <div className="font-semibold text-gray-900">{provider.employees}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Founded</div>
                  <div className="font-semibold text-gray-900">{provider.founded}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Open Positions</div>
                  <div className="font-semibold text-green-600">{Array.isArray(provider.openPositions) ? provider.openPositions.length : 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Size</div>
                  <div className="font-semibold text-gray-900">{provider.size || 'N/A'}</div>
                </div>
              </div>

              {/* Rating and Reviews */}
              {(provider.rating || provider.reviews || provider.likes) ? (
                <div className="flex items-center space-x-4">
                  {provider.rating ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(provider.rating)}</div>
                      <span className="font-semibold text-gray-900">{provider.rating}</span>
                    </div>
                  ) : null}
                  {provider.reviews ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{provider.reviews} reviews</span>
                    </>
                  ) : null}
                  {provider.likes ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">👍 {provider.likes} likes</span>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Apply Now
                </button>
                <button className="flex-1 border-2 border-green-600 text-green-600 py-4 rounded-lg font-semibold hover:bg-green-50 transition-all duration-200">
                  Contact HR
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">{provider.status}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">{Array.isArray(provider.openPositions) ? provider.openPositions.length : 0} positions available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'jobs', name: 'Open Jobs' },
              { id: 'culture', name: 'Culture' },
              { id: 'reviews', name: 'Reviews' },
              { id: 'similar', name: 'Similar Companies' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-semibold transition-all duration-200 ${
                  activeTab === tab.id
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Website</span>
                      <span className="font-medium text-blue-600 hover:underline">{provider.website || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{provider.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{provider.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Address</span>
                      <span className="font-medium">{provider.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{provider.companyStats?.projects ?? 0}</div>
                      <div className="text-sm text-gray-600">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{provider.companyStats?.clients ?? 0}</div>
                      <div className="text-sm text-gray-600">Clients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{provider.companyStats?.countries ?? 0}</div>
                      <div className="text-sm text-gray-600">Countries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{provider.companyStats?.satisfaction ?? 0}</div>
                      <div className="text-sm text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Array.isArray(provider.benefits) ? provider.benefits : []).map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Values</h3>
                  <div className="space-y-2">
                    {(Array.isArray(provider.culture?.values) ? provider.culture.values : []).map((value, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
                <span className="text-gray-600">{Array.isArray(provider.openPositions) ? provider.openPositions.length : 0} positions available</span>
              </div>
              
              <div className="space-y-6">
                {(Array.isArray(provider.openPositions) ? provider.openPositions : []).map((job, idx) => (
                  <div key={job.title || idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title || 'Open Position'}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{job.department || '—'}</span>
                          <span>•</span>
                          <span>{job.type || '—'}</span>
                          <span>•</span>
                          <span>{job.location || provider.location || '—'}</span>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">{job.salary || ''}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{job.description || ''}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(job.skills) ? job.skills : []).map((skill, index) => (
                          <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience: {job.experience || '—'}</span>
                      <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'culture' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Values</h3>
                  <div className="space-y-3">
                    {(Array.isArray(provider.culture?.values) ? provider.culture.values : []).map((value, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Perks</h3>
                  <div className="space-y-3">
                    {(Array.isArray(provider.culture?.perks) ? provider.culture.perks : []).map((perk, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🎁</span>
                        </div>
                        <span className="font-medium">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Reviews</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(provider.rating)}
                      </div>
                      <span className="font-semibold text-gray-900">{provider.rating}</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">{provider.reviews} reviews</span>
                  </div>
                </div>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {(Array.isArray(provider.reviewList) ? provider.reviewList : []).map((review) => (
                  <div key={review.id || review.user} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.user}</h4>
                        <p className="text-sm text-gray-600">{review.position}</p>
                        <p className="text-sm text-gray-600">{review.date}</p>
                      </div>
                      <div className="flex">
                        {renderReviewStars(review.rating || 0)}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Companies</h2>
              <div className="text-gray-600">Similar companies will appear here when available.</div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interested in joining our team?</h2>
              <p className="text-xl text-gray-600">Contact our HR team to learn more about opportunities and the application process.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📞</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call HR</h3>
                <p className="text-gray-600">{provider.phone || 'N/A'}</p>
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
                <p className="text-gray-600">{provider.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default JobProviderDetailsPage; 