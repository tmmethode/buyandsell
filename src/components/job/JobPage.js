import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import Header from "../Header";
import Footer from "../Footer";
import JobSeekerDetailsPage from "./JobSeekerDetailsPage";
import JobProviderDetailsPage from "./JobProviderDetailsPage";
import PropertyStats from "../PropertyStats";
import jobWrapper from "../images/job_wrapper.png";

const JobPage = ({ onSectionChange }) => {
  const [activeSection, setActiveSection] = useState("seekers");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedSalary, setSelectedSalary] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [likedJobs, setLikedJobs] = useState(new Set());
  const [likedSeekers, setLikedSeekers] = useState(new Set());
  const [showSeekerDetails, setShowSeekerDetails] = useState(false);
  const [selectedSeekerId, setSelectedSeekerId] = useState(null);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedSeekerData, setSelectedSeekerData] = useState(null);
  const [selectedProviderData, setSelectedProviderData] = useState(null);
  const params = useParams();

  // New state for API data
  const [jobs, setJobs] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredJobs, setFilteredJobs] = useState([]);
  // Pagination state for seekers and providers
  const [seekersPage, setSeekersPage] = useState(1);
  const [providersPage, setProvidersPage] = useState(1);
  const itemsPerPage = 9;

  // Check if there's a selected item from homepage
  useEffect(() => {
    const selectedItem = localStorage.getItem('selectedItem');
    const selectedItemType = localStorage.getItem('selectedItemType');
    
    if (selectedItem && selectedItemType === 'job') {
      try {
        const item = JSON.parse(selectedItem);
        setSelectedJobId(item._id);
        setShowJobDetails(true);
        
        // Clear the localStorage after using it
        localStorage.removeItem('selectedItem');
        localStorage.removeItem('selectedItemType');
      } catch (err) {
        console.error('Error parsing selected item:', err);
      }
    }
  }, []);

  // If route has an id (e.g. /job/:id), try to open the matching detail view
  useEffect(() => {
    const id = params.id;
    if (!id) return;

    // With API-driven details, open seeker or provider details directly by id
    // Prefer seeker details by default; users can toggle to provider as needed
    setSelectedSeekerId(id);
    setShowSeekerDetails(true);
  }, [params.id]);

  // Reset pagination when filters change (must be before any early returns)
  useEffect(() => {
    setSeekersPage(1);
    setProvidersPage(1);
  }, [selectedCategory, selectedLocation, selectedExperience, selectedSalary, sortBy, searchTerm]);

  // Reset pagination when switching sections (must be before any early returns)
  useEffect(() => {
    if (activeSection === 'seekers') {
      setSeekersPage(1);
    } else {
      setProvidersPage(1);
    }
  }, [activeSection]);

  // Handle view profile
  const handleViewProfile = (seekerId) => {
    try {
      localStorage.setItem('selectedItem', JSON.stringify({ _id: seekerId }));
      localStorage.setItem('selectedItemType', 'job');
    } catch (err) {
      // ignore
    }
    setSelectedSeekerId(seekerId);
    setShowSeekerDetails(true);
  };

  // Handle view company
  const handleViewCompany = (providerId) => {
    try {
      localStorage.setItem('selectedItem', JSON.stringify({ _id: providerId }));
      localStorage.setItem('selectedItemType', 'job');
    } catch (err) {}
    setSelectedProviderId(providerId);
    setShowProviderDetails(true);
  };

  // Handle back to job list
  const handleBackToList = () => {
    setShowSeekerDetails(false);
    setShowProviderDetails(false);
    setSelectedSeekerId(null);
    setSelectedProviderId(null);
  };

  // If showing seeker details, render the details page
  if (showSeekerDetails) {
    return (
      <JobSeekerDetailsPage
        onSectionChange={onSectionChange}
        seekerId={selectedSeekerId}
        seekerData={selectedSeekerData}
        onBack={handleBackToList}
      />
    );
  }

  // If showing provider details, render the details page
  if (showProviderDetails) {
    return (
      <JobProviderDetailsPage
        onSectionChange={onSectionChange}
        providerId={selectedProviderId}
        providerData={selectedProviderData}
        onBack={handleBackToList}
      />
    );
  }

  // No local dummy data — seekers and providers should be loaded via API in future

  const jobCategories = [
    { value: "all", label: "All Categories" },
    { value: "technology", label: "Technology" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "construction", label: "Construction" },
    { value: "logistics", label: "Logistics" },
  ];

  const locations = [
    { value: "all", label: "All Locations" },
    { value: "kigali", label: "Kigali" },
    { value: "butare", label: "Butare" },
    { value: "gisenyi", label: "Gisenyi" },
    { value: "ruhengeri", label: "Ruhengeri" },
    { value: "kibuye", label: "Kibuye" },
  ];

  const experienceLevels = [
    { value: "all", label: "All Experience" },
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6+ years)" },
  ];

  const salaryRanges = [
    { value: "all", label: "All Salaries" },
    { value: "low", label: "Under 1M RWF" },
    { value: "medium", label: "1M - 3M RWF" },
    { value: "high", label: "3M+ RWF" },
  ];

  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "rating", label: "Rating" },
    { value: "experience", label: "Experience" },
    { value: "salary", label: "Salary" },
    { value: "reviews", label: "Reviews" },
  ];

  const handleLike = (id, type) => {
    if (type === "seeker") {
      setLikedSeekers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      setLikedJobs((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }
  };

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

  const getFilteredAndSortedSeekers = () => {
    let filtered = seekers.filter((seeker) => {
      const matchesCategory =
        selectedCategory === "all" ||
        seeker.title.toLowerCase().includes(selectedCategory);
      const matchesLocation =
        selectedLocation === "all" ||
        seeker.location.toLowerCase().includes(selectedLocation);
      const matchesExperience =
        selectedExperience === "all" ||
        (selectedExperience === "entry" && parseInt(seeker.experience) <= 2) ||
        (selectedExperience === "mid" &&
          parseInt(seeker.experience) >= 3 &&
          parseInt(seeker.experience) <= 5) ||
        (selectedExperience === "senior" && parseInt(seeker.experience) >= 6);
      const matchesSalary =
        selectedSalary === "all" ||
        (selectedSalary === "low" &&
          parseInt(seeker.salary.replace(/[^\d]/g, "")) < 1000000) ||
        (selectedSalary === "medium" &&
          parseInt(seeker.salary.replace(/[^\d]/g, "")) >= 1000000 &&
          parseInt(seeker.salary.replace(/[^\d]/g, "")) <= 3000000) ||
        (selectedSalary === "high" &&
          parseInt(seeker.salary.replace(/[^\d]/g, "")) > 3000000);
      const matchesSearch =
        searchTerm === "" ||
        seeker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return (
        matchesCategory &&
        matchesLocation &&
        matchesExperience &&
        matchesSalary &&
        matchesSearch
      );
    });

    // Sort
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "experience":
        filtered.sort(
          (a, b) => parseInt(b.experience) - parseInt(a.experience)
        );
        break;
      case "salary":
        filtered.sort(
          (a, b) =>
            parseInt(b.salary.replace(/[^\d]/g, "")) -
            parseInt(a.salary.replace(/[^\d]/g, ""))
        );
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }

    return filtered;
  };

  const getFilteredAndSortedProviders = () => {
    let filtered = providers.filter((provider) => {
      const matchesCategory =
        selectedCategory === "all" ||
        provider.industry.toLowerCase().includes(selectedCategory);
      const matchesLocation =
        selectedLocation === "all" ||
        provider.location.toLowerCase().includes(selectedLocation);
      const matchesSearch =
        searchTerm === "" ||
        provider.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesLocation && matchesSearch;
    });

    // Sort
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }

    return filtered;
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedExperience("all");
    setSelectedSalary("all");
    setSortBy("default");
    setSearchTerm("");
    setSeekersPage(1);
    setProvidersPage(1);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSectionChange={onSectionChange} activeSection="job" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-600 text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${jobWrapper})`,
          }}
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/75 to-blue-800/80 backdrop-blur-[1px]"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-16 w-40 h-40 bg-blue-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-16 right-16 w-56 h-56 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-cyan-200 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                  Job Match
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 mx-auto rounded-full"></div>
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed opacity-95 px-4 font-light">
              Connect talented professionals with leading companies. Whether
              you're seeking opportunities or hiring talent, we've got you
              covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4">
              <button className="group bg-white text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base shadow-lg">
                <span className="flex items-center justify-center gap-2">
                  Post a Job
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                    />
                  </svg>
                </span>
              </button>

              <button className="group border-2 border-white/80 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-semibold hover:bg-white hover:text-blue-600 hover:border-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base backdrop-blur-sm">
                <span className="flex items-center justify-center gap-2">
                  Upload Resume
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                2,500+
              </div>
              <div className="text-gray-600">Active Job Seekers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Hiring Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Jobs Posted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tabs */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection("seekers")}
              className={`py-4 px-2 border-b-2 font-semibold transition-all duration-200 ${
                activeSection === "seekers"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Job Seekers
            </button>
            <button
              onClick={() => setActiveSection("providers")}
              className={`py-4 px-2 border-b-2 font-semibold transition-all duration-200 ${
                activeSection === "providers"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Job Providers
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white py-8 border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {jobCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            {activeSection === "seekers" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary
                  </label>
                  <select
                    value={selectedSalary}
                    onChange={(e) => setSelectedSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {salaryRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder={`Search ${
                  activeSection === "seekers" ? "job seekers" : "companies"
                }...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
            >
              Clear Filters
            </button>
            <div className="text-sm text-gray-600">
              {activeSection === "seekers"
                ? `${getFilteredAndSortedSeekers().length} job seekers found`
                : `${getFilteredAndSortedProviders().length} companies found`}
            </div>
          </div>
        </div>
      </section>

      {/* Job Seekers Section */}
      {activeSection === "seekers" && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            {getFilteredAndSortedSeekers().length === 0 ? (
              <div className="flex items-center justify-center min-h-[30vh] text-gray-600">
                No job seekers found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFilteredAndSortedSeekers()
                  .slice((seekersPage - 1) * itemsPerPage, seekersPage * itemsPerPage)
                  .map((seeker) => (
                <div
                  key={seeker.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-6xl">
                        {seeker.image}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLike(seeker.id, "seeker")}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        likedSeekers.has(seeker.id)
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">
                        {likedSeekers.has(seeker.id) ? "❤️" : "🤍"}
                      </span>
                    </button>

                    <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-1 flex items-center space-x-1">
                      <div className="flex">{renderStars(seeker.rating)}</div>
                      <span className="text-sm font-semibold text-gray-700 ml-1">
                        {seeker.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {seeker.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-2">
                      {seeker.title}
                    </p>
                    <p className="text-gray-600 mb-4">{seeker.location}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{seeker.experience}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Education:</span>
                        <span className="font-medium">{seeker.education}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Salary:</span>
                        <span className="font-medium text-green-600">
                          {seeker.salary}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {seeker.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {seeker.skills.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                            +{seeker.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>📝 {seeker.reviews} reviews</span>
                        <span>👍 {seeker.likes} likes</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          seeker.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {seeker.status}
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewProfile(seeker.id)}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                      >
                        View Profile
                      </button>
                      <button className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
            {/* Pagination Controls for seekers */}
            {getFilteredAndSortedSeekers().length > 0 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {(() => {
                  const total = getFilteredAndSortedSeekers().length;
                  const totalPages = Math.ceil(total / itemsPerPage);
                  const canPrev = seekersPage > 1;
                  const canNext = seekersPage < totalPages;
                  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  return (
                    <>
                      <button
                        onClick={() => canPrev && setSeekersPage((p) => p - 1)}
                        disabled={!canPrev}
                        className={`px-3 py-2 rounded border ${canPrev ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        Prev
                      </button>
                      {pages.map((p) => (
                        <button
                          key={p}
                          onClick={() => setSeekersPage(p)}
                          className={`px-3 py-2 rounded border ${p === seekersPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => canNext && setSeekersPage((p) => p + 1)}
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
      )}

      {/* Job Providers Section */}
      {activeSection === "providers" && (
        <section className="py-12">
          <div className="container mx-auto px-6">
            {getFilteredAndSortedProviders().length === 0 ? (
              <div className="flex items-center justify-center min-h-[30vh] text-gray-600">
                No companies found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFilteredAndSortedProviders()
                  .slice((providersPage - 1) * itemsPerPage, providersPage * itemsPerPage)
                  .map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-6xl">
                        {provider.image}
                      </span>
                    </div>

                    <button
                      onClick={() => handleLike(provider.id, "provider")}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        likedJobs.has(provider.id)
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">
                        {likedJobs.has(provider.id) ? "❤️" : "🤍"}
                      </span>
                    </button>

                    <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-1 flex items-center space-x-1">
                      <div className="flex">{renderStars(provider.rating)}</div>
                      <span className="text-sm font-semibold text-gray-700 ml-1">
                        {provider.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {provider.company}
                    </h3>
                    <p className="text-green-600 font-semibold mb-2">
                      {provider.industry}
                    </p>
                    <p className="text-gray-600 mb-4">{provider.location}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employees:</span>
                        <span className="font-medium">
                          {provider.employees}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Founded:</span>
                        <span className="font-medium">{provider.founded}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Open Positions:</span>
                        <span className="font-medium text-green-600">
                          {provider.openPositions}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Benefits
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.benefits.slice(0, 3).map((benefit, index) => (
                          <span
                            key={index}
                            className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
                          >
                            {benefit}
                          </span>
                        ))}
                        {provider.benefits.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                            +{provider.benefits.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>📝 {provider.reviews} reviews</span>
                        <span>👍 {provider.likes} likes</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          provider.status === "Hiring"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {provider.status}
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewCompany(provider.id)}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200"
                      >
                        View Company
                      </button>
                      <button className="flex-1 border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-200">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
            {/* Pagination Controls for providers */}
            {getFilteredAndSortedProviders().length > 0 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {(() => {
                  const total = getFilteredAndSortedProviders().length;
                  const totalPages = Math.ceil(total / itemsPerPage);
                  const canPrev = providersPage > 1;
                  const canNext = providersPage < totalPages;
                  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  return (
                    <>
                      <button
                        onClick={() => canPrev && setProvidersPage((p) => p - 1)}
                        disabled={!canPrev}
                        className={`px-3 py-2 rounded border ${canPrev ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        Prev
                      </button>
                      {pages.map((p) => (
                        <button
                          key={p}
                          onClick={() => setProvidersPage(p)}
                          className={`px-3 py-2 rounded border ${p === providersPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => canNext && setProvidersPage((p) => p + 1)}
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
      )}

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of professionals and companies finding their
                perfect match.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  For Job Seekers
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your profile and get discovered by top companies
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">
                  Create Profile
                </button>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏢</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  For Employers
                </h3>
                <p className="text-gray-600 mb-4">
                  Post jobs and find the perfect candidates for your team
                </p>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">
                  Post a Job
                </button>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📞</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Contact our support team for assistance
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">
                  Contact Support
                </button>
              </div>
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

export default JobPage;
