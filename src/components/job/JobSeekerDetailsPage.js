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
  GraduationCap,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
} from "lucide-react";

import { useParams } from "react-router-dom";
import apiBaseUrl from "../../config";

const JobSeekerDetailsPage = ({ onSectionChange, seekerId: propSeekerId, seekerData, onBack }) => {
  const params = useParams();
  const seekerId = propSeekerId || params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [liked, setLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [seekerState, setSeekerState] = useState(seekerData || null);
  const [loading, setLoading] = useState(Boolean(!seekerData && seekerId));
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
  }, [seekerState, seekerData]);

  useEffect(() => {
    const apiBase = apiBaseUrl;
    if (!seekerId) return;
    if (seekerState) return;
    if (!apiBase) {
      console.error("REACT_APP_API_BASE_URL is not set");
      setError("Missing API base URL");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetch(`${apiBase}/api/jobs/${seekerId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setSeekerState(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Failed to load seeker");
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [seekerId, seekerState]);

  // Seeker data now comes only from API/props
  const seeker = seekerState || null;

  const images = useMemo(() => (Array.isArray(seeker?.images) ? seeker.images : []).map((i) => i), [seeker]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
          <div>Loading profile…</div>
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

  if (!seeker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSectionChange={onSectionChange} activeSection="job" />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-3">👤</div>
            <div className="text-lg">No profile data available.</div>
            <div className="mt-4">
              <button onClick={onBack} className="text-blue-600 hover:underline">Back to Job List</button>
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
      <Header onSectionChange={onSectionChange} activeSection="job" />

      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => onSectionChange("job")}
              className="hover:text-purple-600"
            >
              Job
            </button>
            <span>›</span>
            <span className="text-gray-900 font-medium">{seeker.name}</span>
          </nav>
        </div>
      </section>

      {/* Back Button */}
      <section className="bg-white py-4 border-b">
        <div className="container mx-auto px-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
          >
            <span>←</span>
            <span>Back to Job List</span>
          </button>
        </div>
      </section>

      {/* Profile Header */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image */}
            <div className="space-y-4">
              <div className="relative">
                <div className="h-96 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center">
                  {images.length > 0 ? (
                    <span className="text-white text-8xl">{images[selectedImage]}</span>
                  ) : (
                    <span className="text-white text-6xl">👤</span>
                  )}
                </div>

                {/* Like Button */}
                <button
                  onClick={() => setLiked(!liked)}
                  className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                    liked
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{liked ? "❤️" : "🤍"}</span>
                </button>

                {/* Rating Badge */}
                {seeker.rating ? (
                  <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 flex items-center space-x-2">
                    <div className="flex">{renderStars(seeker.rating)}</div>
                    <span className="text-sm font-semibold text-gray-700">{seeker.rating}</span>
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
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-2xl">{image}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {seeker.name}
                </h1>
                <p className="text-purple-600 text-xl font-semibold mb-2">
                  {seeker.title}
                </p>
                <p className="text-gray-600 mb-4">{seeker.location}</p>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-blue-600">
                      {seeker.salary}
                    </span>
                    {seeker.originalSalary ? (
                      <span className="text-lg text-gray-500 line-through">{seeker.originalSalary}</span>
                    ) : null}
                    {seeker.discount ? (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">{seeker.discount}</span>
                    ) : null}
                  </div>
                  {/* Optional savings message removed without dummy calculation */}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Experience</div>
                  <div className="font-semibold text-gray-900">
                    {seeker.experience}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Education</div>
                  <div className="font-semibold text-gray-900">{seeker.education || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Languages</div>
                  <div className="font-semibold text-gray-900">
                    {Array.isArray(seeker.languages) ? seeker.languages.length : 0}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Certifications</div>
                  <div className="font-semibold text-gray-900">
                    {Array.isArray(seeker.certifications) ? seeker.certifications.length : 0}
                  </div>
                </div>
              </div>

              {/* Rating and Reviews */}
              {(seeker.rating || seeker.reviews || seeker.likes) ? (
                <div className="flex items-center space-x-4">
                  {seeker.rating ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(seeker.rating)}</div>
                      <span className="font-semibold text-gray-900">{seeker.rating}</span>
                    </div>
                  ) : null}
                  {seeker.reviews ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{seeker.reviews} reviews</span>
                    </>
                  ) : null}
                  {seeker.likes ? (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">👍 {seeker.likes} likes</span>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* Contact Recruiter Section */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    Contact Recruiter
                  </h3>

                  {/* Agent Info */}
                  <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
                      {seeker?.createdBy?.profileImage ? (
                        <img
                          src={seeker.createdBy.profileImage.startsWith('http') ? seeker.createdBy.profileImage : `${apiBaseUrl}${seeker.createdBy.profileImage}`}
                          alt={seeker.createdBy.name || 'Recruiter'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={`text-white font-bold text-lg ${seeker?.createdBy?.profileImage ? 'hidden' : 'flex'}`}>
                        {seeker?.createdBy?.name ? seeker.createdBy.name.charAt(0).toUpperCase() : 'R'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {seeker?.createdBy?.name || 'HR Recruiter'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {seeker?.createdBy?.role || 'Talent Acquisition Specialist'}
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

                    {/* Send SMS Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        const smsUrl = `${window.location.origin}/seeker/${seeker?.id || seekerId}`;
                        const message = `Hi, I'm interested in this candidate: ${seeker?.name || "Candidate"
                          } - ${smsUrl}`;
                        window.location.href = `sms:${phone}?body=${encodeURIComponent(
                          message
                        )}`;
                      }}
                      className="flex items-center justify-center space-x-2 md:space-x-3 w-full bg-red-100 text-red-600 py-3 md:py-4 px-4 md:px-6 rounded-lg hover:bg-red-200 transition-all duration-200 shadow-md hover:shadow-lg"
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <div className="text-left min-w-0">
                        <div className="font-semibold text-sm md:text-base">
                          Send SMS
                        </div>
                        <div className="text-xs md:text-sm opacity-75">
                          Quick message
                        </div>
                      </div>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/seeker/${seeker?.id || seekerId}`;
                        if (navigator.share) {
                          navigator.share({
                            title: seeker?.name || 'Job Seeker',
                            text: `Check out this candidate: ${seeker?.name || 'Job Seeker'}`,
                            url: shareUrl
                          });
                        } else {
                          navigator.clipboard.writeText(shareUrl);
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
                          Share profile
                        </div>
                      </div>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        const phone = "+250788820543";
                        const waUrl = `${window.location.origin}/seeker/${seeker?.id || seekerId}`;
                        const message = `Hi, I'm interested in this candidate: ${seeker?.name || "Candidate"
                          } - ${waUrl}`;
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
                  {seeker.status}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">
                  Available: {seeker.availability}
                </span>
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
              { id: "overview", name: "Overview" },
              { id: "experience", name: "Experience" },
              { id: "education", name: "Education" },
              { id: "projects", name: "Projects" },
              { id: "reviews", name: "Reviews" },
              { id: "similar", name: "Similar Profiles" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-semibold transition-all duration-200 ${
                  activeTab === tab.id
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {seeker.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(seeker.skills) ? seeker.skills : []).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-700 px-3 py-2 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Languages
                  </h3>
                  <div className="space-y-2">
                    {(Array.isArray(seeker.languages) ? seeker.languages : []).map((language, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium">{language}</span>
                        <span className="text-green-600 font-semibold">
                          Fluent
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Certifications
                  </h3>
                  <div className="space-y-3">
                    {(Array.isArray(seeker.certifications) ? seeker.certifications : []).map((cert, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <span className="font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">📧</span>
                      <span className="font-medium">{seeker.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">📱</span>
                      <span className="font-medium">{seeker.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">🔗</span>
                      <span className="font-medium text-blue-600 hover:underline">
                        {seeker.linkedin}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">💻</span>
                      <span className="font-medium text-blue-600 hover:underline">
                        {seeker.portfolio}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Work Experience
              </h2>
              <div className="space-y-6">
                    {(Array.isArray(seeker.experienceDetails) ? seeker.experienceDetails : []).map((exp, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {exp.position}
                        </h3>
                        <p className="text-purple-600 font-medium">
                          {exp.company}
                        </p>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {exp.duration}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Education
              </h2>
              <div className="space-y-6">
                    {(Array.isArray(seeker.educationDetails) ? seeker.educationDetails : []).map((edu, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-purple-600 font-medium">
                          {edu.institution}
                        </p>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {edu.duration}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {edu.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Portfolio Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Array.isArray(seeker.projects) ? seeker.projects : []).map((project, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-700 mb-4">{project.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Technologies
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Project →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Client Reviews
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(seeker.rating)}</div>
                      <span className="font-semibold text-gray-900">
                        {seeker.rating}
                      </span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">
                      {seeker.reviews} reviews
                    </span>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {(Array.isArray(seeker.reviewList) ? seeker.reviewList : []).map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.user}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {review.company}
                        </p>
                        <p className="text-sm text-gray-600">{review.date}</p>
                      </div>
                      <div className="flex">
                        {renderReviewStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "similar" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Profiles</h2>
              <div className="text-gray-600">Similar profiles will appear here when available.</div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Interested in this candidate?
              </h2>
              <p className="text-xl text-gray-600">
                Contact our recruitment team to schedule an interview or get
                more information.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <button
                  onClick={() => {
                    // Add image if available
                    const shareUrl = `${window.location.origin}/seeker/${seeker?.id || seekerId}`;
                    const imageUrl = seeker?.profileImage?.startsWith('http') ? seeker.profileImage : `${apiBaseUrl}${seeker?.profileImage || ''}`;
                    const shareContent = {
                      title: seeker?.name || 'Job Seeker',
                      text: `${seeker?.name || 'Job Seeker'}\nSkill Level: ${seeker?.skillLevel || 'N/A'}\n\n${seeker?.bio || seeker?.description || 'Check out this amazing candidate!'}\n\n${shareUrl}`,
                      url: shareUrl
                    };
                    if (imageUrl && imageUrl.includes('http')) {
                      fetch(imageUrl, { mode: 'cors', credentials: 'include' })
                        .then(res => {
                          if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
                          return res.blob();
                        })
                        .then(blob => {
                          const file = new File([blob], 'seeker.jpg', { type: blob.type || 'image/jpeg' });
                          if (navigator.share) {
                            navigator.share({
                              ...shareContent,
                              files: [file]
                            }).catch(() => {
                              // Fallback if share with files fails
                              if (navigator.share) {
                                navigator.share(shareContent);
                              }
                            });
                          } else {
                            navigator.clipboard.writeText(`${shareContent.text}`);
                            alert('Content copied to clipboard!');
                          }
                        })
                        .catch(() => {
                          // Fallback if image fetch fails
                          if (navigator.share) {
                            navigator.share(shareContent);
                          } else {
                            navigator.clipboard.writeText(`${shareContent.text}`);
                            alert('Content copied to clipboard!');
                          }
                        });
                    } else {
                      if (navigator.share) {
                        navigator.share(shareContent);
                      } else {
                        navigator.clipboard.writeText(`${shareContent.text}`);
                        alert('Content copied to clipboard!');
                      }
                    }
                  }}
                  className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-700 transition-colors duration-200"
                >
                  <span className="text-white text-2xl">🔗</span>
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Share
                </h3>
                <p className="text-gray-600">Share this profile</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📞</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Call Us
                </h3>
                <p className="text-gray-600">(+250) 788 820 543</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  WhatsApp
                </h3>
                <p className="text-gray-600">Send us a message</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📧</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email
                </h3>
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
              const message = `Hi, I'm interested in this candidate: ${seeker?.name || "Candidate"
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

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default JobSeekerDetailsPage;
