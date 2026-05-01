import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import locationDataImport from "../data/location.json";
import apiBaseUrl from "../../config";
const locationData = locationDataImport.locations;

const HouseManagement = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "admin";
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [availableOwners, setAvailableOwners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5); // default 5 per page

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Middle house",
    listingType: "For Sale", // For Sale or For Rent
    price: "",
    discountedPrice: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    contactPhone: "",
    contactEmail: "",
    bedrooms: "",
    bathrooms: "",
    numberOfDoors: "", // For commercial properties
    area: "",
    areaUnit: "sqm",
    propertyType: "House",
    condition: "Good",
    amenities: [],
    features: [],
    // New fields
    roadType: "Paved", // Road access: Paved (Tarmac), Gravel (Murram), Dirt, None
    parking: false,
    parkingSpaces: "",
    furnished: false,
    petFriendly: false,
    security: false,
    waterSupply: true,
    electricity: true,
    internet: false,
    yearBuilt: "",
    yearRenovated: "",
    nearbyAmenities: "", // comma-separated input; backend parses to array
    sewageSystem: "Municipal",
    youtubeUrl: "", // YouTube video URL for property tour
    status:
      typeof window !== "undefined" &&
        localStorage.getItem("user") &&
        JSON.parse(localStorage.getItem("user"))?.role === "admin"
        ? "Available"
        : "Pending",
    images: [],
    mainImage: "",
    // Overview information fields
    specifications: {
      dimensions: {
        plotSize: "",
        builtArea: "",
        frontage: "",
        depth: "",
      },
      construction: {
        structure: "Reinforced Concrete",
        roof: "Tiled Roof",
        walls: "Brick & Plaster",
        windows: "Aluminum Double Glazed",
        doors: "Solid Wood",
      },
      utilities: {
        water: "Available",
        electricity: "Available",
        internet: "Not Available",
        sewage: "Municipal",
      },
      amenities: {
        kitchen: "Modern Kitchen",
        bathrooms: "",
        bedrooms: "",
        living: "Open Plan Design",
        dining: "Integrated",
      },
    },
  });

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // Location state for dropdowns
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSectors, setAvailableSectors] = useState([]);
  const [availableCells, setAvailableCells] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  // Users list for owner change (admin only)
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // apiBaseUrl is provided by src/config which validates the environment at startup

  // Debounce search term for live search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchHouses();
  }, [currentPage, categoryFilter, statusFilter, ownerFilter, pageSize, debouncedSearchTerm]);

  // Fetch available users for owner filter (admin only)
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!isAdmin) return;
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiBaseUrl}/api/dashboard/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAvailableUsers(data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchAvailableUsers();
  }, [isAdmin]);

  // Helper functions for location data
  const getUniqueProvinces = () => {
    const provinces = [...new Set(locationData.map((item) => item.Province))];
    return provinces;
  };

  const getDistrictsByProvince = (province) => {
    const districts = [
      ...new Set(
        locationData
          .filter((item) => item.Province === province)
          .map((item) => item.District)
      ),
    ];
    return districts;
  };

  const getSectorsByDistrict = (province, district) => {
    const sectors = [
      ...new Set(
        locationData
          .filter(
            (item) => item.Province === province && item.District === district
          )
          .map((item) => item.Sector)
      ),
    ];
    return sectors;
  };

  const getCellsBySector = (province, district, sector) => {
    const cells = [
      ...new Set(
        locationData
          .filter(
            (item) =>
              item.Province === province &&
              item.District === district &&
              item.Sector === sector
          )
          .map((item) => item.Cell)
      ),
    ];
    return cells;
  };

  const getVillagesByCell = (province, district, sector, cell) => {
    const villages = [
      ...new Set(
        locationData
          .filter(
            (item) =>
              item.Province === province &&
              item.District === district &&
              item.Sector === sector &&
              item.Cell === cell
          )
          .map((item) => item.Village)
      ),
    ];
    return villages;
  };

  // Handle location changes
  const handleProvinceChange = (province) => {
    setFormData({
      ...formData,
      province,
      district: "",
      sector: "",
      cell: "",
      village: "",
    });
    setAvailableDistricts(getDistrictsByProvince(province));
    setAvailableSectors([]);
    setAvailableCells([]);
    setAvailableVillages([]);
  };

  const handleDistrictChange = (district) => {
    setFormData({
      ...formData,
      district,
      sector: "",
      cell: "",
      village: "",
    });
    setAvailableSectors(getSectorsByDistrict(formData.province, district));
    setAvailableCells([]);
    setAvailableVillages([]);
  };

  const handleSectorChange = (sector) => {
    setFormData({
      ...formData,
      sector,
      cell: "",
      village: "",
    });
    setAvailableCells(
      getCellsBySector(formData.province, formData.district, sector)
    );
    setAvailableVillages([]);
  };

  const handleCellChange = (cell) => {
    setFormData({
      ...formData,
      cell,
      village: "",
    });
    setAvailableVillages(
      getVillagesByCell(
        formData.province,
        formData.district,
        formData.sector,
        cell
      )
    );
  };

  const handleVillageChange = (village) => {
    setFormData({
      ...formData,
      village,
    });
  };

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      let response;
      if (isAdmin) {
        const params = new URLSearchParams({
          page: currentPage,
          limit: pageSize,
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
          ...(categoryFilter !== "all" && { category: categoryFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(ownerFilter !== "all" && { owner: ownerFilter }),
        });
        response = await fetch(`${apiBaseUrl}/api/dashboard/houses?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        response = await fetch(`${apiBaseUrl}/api/houses/my-houses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (!response.ok) {
        throw new Error("Failed to fetch houses");
      }

      const data = await response.json();
      if (isAdmin) {
        setHouses(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        // my-houses returns an array
        setHouses(Array.isArray(data) ? data : data.houses || data.data || []);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHouses();
  };

  const handleStatusChange = async (houseId, newStatus) => {
    if (!isAdmin) {
      setError("Only admins can change status");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/houses/${houseId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update house status");
      }

      // Update local state
      setHouses(
        houses.map((house) =>
          house._id === houseId ? { ...house, status: newStatus } : house
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHouse = async (houseId) => {
    if (!window.confirm("Are you sure you want to delete this house?")) return;

    try {
      const token = localStorage.getItem("token");
      let response;
      if (isAdmin) {
        response = await fetch(
          `${apiBaseUrl}/api/dashboard/houses/${houseId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        const house = houses.find((h) => h._id === houseId);
        if (house && house.status !== "Pending") {
          setError("You can only delete a house while its status is Pending");
          return;
        }
        response = await fetch(`${apiBaseUrl}/api/houses/${houseId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (!response.ok) {
        throw new Error("Failed to delete house");
      }

      // Remove house from local state
      setHouses(houses.filter((house) => house._id !== houseId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit functionality
  const handleEdit = (house) => {
    if (!isAdmin && house.status !== "Pending") {
      setWarningMessage("You can only edit a house while its status is Pending. Please contact an administrator if you need to make changes.");
      setShowWarningModal(true);
      return;
    }
    setEditingHouse(house);

    // Populate cascading dropdowns for editing
    if (house.province) {
      setAvailableDistricts(getDistrictsByProvince(house.province));
      if (house.district) {
        setAvailableSectors(
          getSectorsByDistrict(house.province, house.district)
        );
        if (house.sector) {
          setAvailableCells(
            getCellsBySector(house.province, house.district, house.sector)
          );
          if (house.cell) {
            setAvailableVillages(
              getVillagesByCell(
                house.province,
                house.district,
                house.sector,
                house.cell
              )
            );
          }
        }
      }
    }

    setFormData({
      title: house.title || "",
      description: house.description || "",
      category: house.category || "Middle house",
      listingType: house.listingType || "For Sale",
      price: house.price || "",
      discountedPrice: house.discountedPrice || "",
      province: house.province || "",
      district: house.district || "",
      sector: house.sector || "",
      cell: house.cell || "",
      village: house.village || "",
      bedrooms: house.bedrooms || "",
      bathrooms: house.bathrooms || "",
      numberOfDoors: house.numberOfDoors || "",
      area: house.area || "",
      areaUnit: house.areaUnit || "sqm",
      propertyType: house.propertyType || "House",
      condition: house.condition || "Good",
      amenities: house.amenities || [],
      features: house.features || [],
      roadType: house.roadType || "Paved",
      parking: house.parking || false,
      parkingSpaces: house.parkingSpaces ?? "",
      furnished: house.furnished || false,
      petFriendly: house.petFriendly || false,
      security: house.security || false,
      waterSupply: house.waterSupply !== undefined ? house.waterSupply : true,
      electricity: house.electricity !== undefined ? house.electricity : true,
      internet: house.internet || false,
      yearBuilt: house.yearBuilt ?? "",
      yearRenovated: house.yearRenovated ?? "",
      nearbyAmenities: Array.isArray(house.nearbyAmenities)
        ? house.nearbyAmenities.join(", ")
        : house.nearbyAmenities || "",
      sewageSystem: house.sewageSystem || "Municipal",
      youtubeUrl: house.youtubeUrl || "",
      owner: house.owner?._id || house.owner || "",
      status: house.status || "Available",
      images: house.images || [],
      mainImage: house.mainImage || "",
      // Handle specifications with proper fallbacks
      specifications: {
        dimensions: {
          plotSize: house.specifications?.dimensions?.plotSize || "",
          builtArea: house.specifications?.dimensions?.builtArea || "",
          frontage: house.specifications?.dimensions?.frontage || "",
          depth: house.specifications?.dimensions?.depth || "",
        },
        construction: {
          structure:
            house.specifications?.construction?.structure ||
            "Reinforced Concrete",
          roof: house.specifications?.construction?.roof || "Tiled Roof",
          walls: house.specifications?.construction?.walls || "Brick & Plaster",
          windows:
            house.specifications?.construction?.windows ||
            "Aluminum Double Glazed",
          doors: house.specifications?.construction?.doors || "Solid Wood",
        },
        utilities: {
          water: house.specifications?.utilities?.water || "Available",
          electricity:
            house.specifications?.utilities?.electricity || "Available",
          internet:
            house.specifications?.utilities?.internet || "Not Available",
          sewage: house.specifications?.utilities?.sewage || "Municipal",
        },
        amenities: {
          kitchen: house.specifications?.amenities?.kitchen || "Modern Kitchen",
          bathrooms: house.specifications?.amenities?.bathrooms || "",
          bedrooms: house.specifications?.amenities?.bedrooms || "",
          living: house.specifications?.amenities?.living || "Open Plan Design",
          dining: house.specifications?.amenities?.dining || "Integrated",
        },
      },
    });

    // Load existing images for editing
    if (house.images && house.images.length > 0) {
      const existingImages = house.images.map((imageUrl, index) => {
        const previewUrl =
          typeof imageUrl === "string" && imageUrl.startsWith("http")
            ? imageUrl
            : `${apiBaseUrl}${imageUrl}`;
        return {
          file: null, // No file object for existing images
          preview: previewUrl,
          isExisting: true,
          originalUrl: imageUrl,
        };
      });
      setUploadedImages(existingImages);

      // Set main image index
      const mainImageIndex = house.images.findIndex(
        (img) => img === house.mainImage
      );
      setMainImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
    } else {
      setUploadedImages([]);
      setMainImageIndex(0);
    }

    setShowEditModal(true);

    // Fetch users for owner dropdown (admin only)
    if (isAdmin) {
      fetchAvailableUsers();
    }
  };

  // Fetch available users for owner change
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBaseUrl}/api/dashboard/users?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.data || data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateHouse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add text fields (exclude contact fields; handle them explicitly below)
      Object.keys(formData).forEach((key) => {
        if (
          key !== "images" &&
          key !== "mainImage" &&
          key !== "contactPhone" &&
          key !== "contactEmail" &&
          key !== "specifications"
        ) {
          let value = formData[key];
          // Ensure boolean fields are sent as booleans
          if (
            [
              "parking",
              "furnished",
              "petFriendly",
              "security",
              "waterSupply",
              "electricity",
              "internet",
            ].includes(key)
          ) {
            value = Boolean(value);
          }
          if (key === "discountedPrice") {
            value = value ? parseInt(value) : 0;
          }
          if (Array.isArray(value)) {
            value.forEach((item) => formDataToSend.append(key, item));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });
      // Ensure utilities fields in specifications are booleans
      const specCopy = { ...formData.specifications };
      if (specCopy.utilities) {
        ["water", "electricity", "internet"].forEach((key) => {
          if (specCopy.utilities[key] !== undefined) {
            specCopy.utilities[key] =
              specCopy.utilities[key] === true ||
              specCopy.utilities[key] === "true" ||
              specCopy.utilities[key] === 1 ||
              specCopy.utilities[key] === "1";
          }
        });
      }
      formDataToSend.append("specifications", JSON.stringify(specCopy));

      // Hint backend upload destination for mainImage
      formDataToSend.append("uploadContext", "houses");

      // Add priceNumeric field (extract number from price string)
      if (formData.price) {
        const priceMatch = formData.price.match(/\d+/g);
        if (priceMatch) {
          const priceNumeric = parseInt(priceMatch.join(""));
          formDataToSend.append("priceNumeric", priceNumeric);
        }
      }

      // Add missing required fields with default values for contact fields
      if (
        !formData.contactPhone ||
        (typeof formData.contactPhone === "string" &&
          formData.contactPhone.trim() === "")
      ) {
        formDataToSend.append("contactPhone", "+250 78 123 4567");
      } else {
        formDataToSend.append("contactPhone", formData.contactPhone);
      }
      if (
        !formData.contactEmail ||
        (typeof formData.contactEmail === "string" &&
          formData.contactEmail.trim() === "")
      ) {
        formDataToSend.append("contactEmail", "admin@example.com");
      } else {
        formDataToSend.append("contactEmail", formData.contactEmail);
      }

      // Log the data being sent for debugging
      console.log("Form data being sent:", Object.fromEntries(formDataToSend));

      // Always send all currently displayed images (existing and new) to backend
      uploadedImages.forEach((img) => {
        if (img.isExisting && img.originalUrl) {
          formDataToSend.append("existingImages", img.originalUrl);
        }
      });

      // Add new images if any
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img, index) => {
          if (img.file) {
            if (index === mainImageIndex) {
              formDataToSend.append("mainImage", img.file);
            } else {
              formDataToSend.append("houseImages", img.file);
            }
          }
        });
      }

      const response = await fetch(
        `${apiBaseUrl}/${isAdmin
          ? `api/dashboard/houses/${editingHouse._id}`
          : `api/houses/${editingHouse._id}`
        }`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || "Failed to update house");
      }

      const updatedHouse = await response.json();
      await fetchHouses();
      setShowEditModal(false);
      setEditingHouse(null);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Add functionality
  const handleAddHouse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add text fields (exclude contact fields; handle them explicitly below)
      Object.keys(formData).forEach((key) => {
        if (
          key !== "images" &&
          key !== "mainImage" &&
          key !== "contactPhone" &&
          key !== "contactEmail" &&
          key !== "specifications"
        ) {
          let value = formData[key];
          // Ensure boolean fields are sent as booleans
          if (
            [
              "parking",
              "furnished",
              "petFriendly",
              "security",
              "waterSupply",
              "electricity",
              "internet",
            ].includes(key)
          ) {
            value = Boolean(value);
          }
          if (key === "discountedPrice") {
            value = value ? parseInt(value) : 0;
          }
          if (Array.isArray(value)) {
            value.forEach((item) => formDataToSend.append(key, item));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });
      // Ensure utilities fields in specifications are booleans
      const specCopy = { ...formData.specifications };
      if (specCopy.utilities) {
        ["water", "electricity", "internet"].forEach((key) => {
          if (specCopy.utilities[key] !== undefined) {
            specCopy.utilities[key] =
              specCopy.utilities[key] === true ||
              specCopy.utilities[key] === "true" ||
              specCopy.utilities[key] === 1 ||
              specCopy.utilities[key] === "1";
          }
        });
      }
      formDataToSend.append("specifications", JSON.stringify(specCopy));

      // Hint backend upload destination for mainImage
      formDataToSend.append("uploadContext", "houses");

      // Add priceNumeric field (extract number from price string)
      if (formData.price) {
        const priceMatch = formData.price.match(/\d+/g);
        if (priceMatch) {
          const priceNumeric = parseInt(priceMatch.join(""));
          formDataToSend.append("priceNumeric", priceNumeric);
        }
      }

      // Add missing required fields with default values
      if (!formData.contactPhone || formData.contactPhone.trim() === "") {
        formDataToSend.append("contactPhone", "+250 78 123 4567");
      } else {
        formDataToSend.append("contactPhone", formData.contactPhone);
      }
      if (!formData.contactEmail || formData.contactEmail.trim() === "") {
        formDataToSend.append("contactEmail", "admin@example.com");
      } else {
        formDataToSend.append("contactEmail", formData.contactEmail);
      }

      // Log the data being sent for debugging
      console.log("Form data being sent:", Object.fromEntries(formDataToSend));

      // Add images
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img, index) => {
          if (img.file) {
            if (index === mainImageIndex) {
              formDataToSend.append("mainImage", img.file);
            } else {
              formDataToSend.append("houseImages", img.file);
            }
          }
        });
      } else {
        // If no images uploaded, the backend will use default images
        console.log("No images uploaded, backend will use default images");
      }

      // For non-admins, enforce Pending status at submission as well (backend also enforces)
      if (!isAdmin) {
        formDataToSend.set("status", "Pending");
      }
      const response = await fetch(
        `${apiBaseUrl}/${isAdmin ? "api/dashboard/houses" : "api/houses"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || "Failed to add house");
      }

      const newHouse = await response.json();
      console.log("New house data received:", newHouse);
      console.log("New house mainImage:", newHouse.data.mainImage);
      await fetchHouses();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Image upload functions
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setUploadedImages([...uploadedImages, ...newImages]);

    // Update form data with new images
    const imageUrls = [...uploadedImages, ...newImages].map(
      (img) => img.preview
    );
    setFormData({
      ...formData,
      images: imageUrls,
      mainImage: imageUrls[mainImageIndex] || imageUrls[0] || "",
    });
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);

    const imageUrls = newImages.map((img) => img.preview);
    setFormData({
      ...formData,
      images: imageUrls,
      mainImage: imageUrls[mainImageIndex] || imageUrls[0] || "",
    });
  };

  const setMainImage = (index) => {
    setMainImageIndex(index);
    setFormData({
      ...formData,
      images: uploadedImages.map((img) => img.preview),
      mainImage: uploadedImages[index]?.preview || "",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Middle house",
      listingType: "For Sale",
      price: "",
      discountedPrice: "",
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
      bedrooms: "",
      bathrooms: "",
      numberOfDoors: "",
      area: "",
      areaUnit: "sqm",
      propertyType: "House",
      condition: "Good",
      amenities: [],
      features: [],
      roadType: "Paved",
      parking: false,
      parkingSpaces: "",
      furnished: false,
      petFriendly: false,
      security: false,
      waterSupply: true,
      electricity: true,
      internet: false,
      yearBuilt: "",
      yearRenovated: "",
      nearbyAmenities: "",
      youtubeUrl: "",
      sewageSystem: "Municipal",
      owner: "",
      status: isAdmin ? "Available" : "Pending",
      images: [],
      mainImage: "",
    });
    setUploadedImages([]);
    setMainImageIndex(0);
    setAvailableDistricts([]);
    setAvailableSectors([]);
    setAvailableCells([]);
    setAvailableVillages([]);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      Sold: { color: "bg-red-100 text-red-800", icon: XCircle },
      Pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      "Under Review": { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig["Available"];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      "Luxury House": { color: "bg-purple-100 text-purple-800" },
      "Middle house": { color: "bg-blue-100 text-blue-800" },
      "Inzu ikodeshwa": { color: "bg-green-100 text-green-800" },
      "Commercial Property": { color: "bg-orange-100 text-orange-800" },
    };

    const config = categoryConfig[category] || categoryConfig["Middle house"];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {category}
      </span>
    );
  };

  // Price formatting helper to match ItemCard display (RWF, localized, discount handling)
  const formatPriceDisplay = (price, discountedPrice) => {
    const toNumber = (val) => {
      if (!val && val !== 0) return 0;
      if (typeof val === "number") return val;
      const match = String(val).match(/\d+/g);
      return match ? parseInt(match.join("")) : 0;
    };

    const p = toNumber(price);
    const d = toNumber(discountedPrice);

    const fmt = (n) => `RWF ${n.toLocaleString("en-US")}`;

    if (d && d > 0 && p && p > d) {
      const percentOff = Math.round(((p - d) / p) * 100);
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{fmt(d)}</div>
          <div className="text-xs text-gray-400 line-through">{fmt(p)}</div>
          <div className="text-xs text-red-500">{percentOff}% off</div>
        </div>
      );
    }

    if (p) {
      return <div className="text-sm font-medium text-gray-900">{fmt(p)}</div>;
    }

    return <div className="text-sm text-gray-900">N/A</div>;
  };

  // Note: Loading state will be shown inline in the table section instead of replacing entire component

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl md:text-6xl mb-4">⚠️</div>
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">
          Error Loading house
        </h2>
        <p className="text-sm md:text-base text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchHouses}
          className="bg-gray-700 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-gray-800 text-sm md:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          </h2>
          <p className="text-sm md:text-base text-gray-600">
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span>Add House</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search houses by title or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value="all">All Categories</option>
                <option value="Luxury House">Luxury House</option>
                <option value="Middle house">Middle House</option>
                <option value="Commercial Property">Commercial Property</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {isAdmin && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={ownerFilter}
                  onChange={(e) => {
                    setOwnerFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                >
                  <option value="all">All Owners</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="relative w-full sm:w-auto">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap"
            >
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span>Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Houses Grid/Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden mb-6">
        {/* Mobile & Tablet Card View - Improved Design */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading houses...</p>
            </div>
          ) : houses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No houses found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {houses.map((house) => (
                <div key={house._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Image Section */}
                  <div className="relative h-40 bg-gray-100">
                    {(() => {
                      const preferredMain = house.mainImage || (house.images && house.images[0]);
                      if (!preferredMain) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        );
                      }
                      const src = preferredMain.startsWith("http") ? preferredMain : `${apiBaseUrl}${preferredMain}`;
                      return (
                        <img
                          src={src}
                          alt={house.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      );
                    })()}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(house.status)}
                    </div>
                    {/* Listing Type Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${house.listingType === 'For Rent' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                        {house.listingType || 'For Sale'}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3">
                    {/* Title & Category */}
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{house.title}</h3>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {house.district || house.location}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <p className="text-base font-bold text-green-600">
                        {formatPriceDisplay(house.price, house.discountedPrice)}
                        {house.listingType === 'For Rent' && <span className="text-xs font-normal text-gray-500">/mo</span>}
                      </p>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      {house.category !== 'Commercial Property' ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{house.bedrooms || 0}</span> Beds
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{house.bathrooms || 0}</span> Baths
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{house.numberOfDoors || 0}</span> Doors
                        </span>
                      )}
                      {house.area && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">{house.area}</span> {house.areaUnit || 'sqm'}
                        </span>
                      )}
                    </div>

                    {/* Owner & Category */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {house.owner?.profileImage ? (
                            <img
                              src={house.owner.profileImage.startsWith('http') ? house.owner.profileImage : `${apiBaseUrl}${house.owner.profileImage}`}
                              alt="Owner"
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <User className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                          {house.owner?.firstName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {house.category || 'House'}
                      </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2">
                      {isAdmin && (
                        <select
                          value={house.status}
                          onChange={(e) => handleStatusChange(house._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white cursor-pointer flex-1 max-w-[100px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Review</option>
                        </select>
                      )}
                      <div className="flex items-center gap-1.5">
                        {(isAdmin || user?.permissions?.includes("houses:edit")) && (
                          <button
                            onClick={() => handleEdit(house)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            localStorage.setItem("selectedItem", JSON.stringify(house));
                            localStorage.setItem("selectedItemType", "house");
                            localStorage.setItem("navigateToSection", "house");
                            window.location.reload();
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(isAdmin || user?.permissions?.includes("houses:delete")) && (
                          <button
                            onClick={() => handleDeleteHouse(house._id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View - Properly contained scroll */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    HOUSE
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    DETAILS
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    TYPE
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    CATEGORY
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    OWNER
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    POSTED
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-3"></div>
                        <p className="text-sm text-gray-500">Loading houses...</p>
                      </div>
                    </td>
                  </tr>
                ) : houses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500">No houses found</div>
                    </td>
                  </tr>
                ) : houses.map((house) => (
                  <tr key={house._id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const preferredMain =
                              house.mainImage ||
                              (house.images && house.images[0]);
                            if (!preferredMain)
                              return (
                                <Home className="h-5 w-5 text-gray-600" />
                              );
                            const src = preferredMain.startsWith("http")
                              ? preferredMain
                              : `${apiBaseUrl}${preferredMain}`;
                            return (
                              <img
                                src={src}
                                alt={house.title}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            );
                          })()}
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                            {house.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[140px]">
                            {house.location ||
                              `${house.village}, ${house.district}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900 min-w-0">
                        {formatPriceDisplay(
                          house.price,
                          house.discountedPrice
                        )}
                        {house.listingType === 'For Rent' && (
                          <span className="text-gray-500 text-xs">/month</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-32">
                        {house.category?.toLowerCase() === 'commercial property' ? (
                          <>
                            {house.numberOfDoors || 0} Doors
                            {house.area ? ` • ${house.area}${house.areaUnit || 'sqm'}` : ''}
                          </>
                        ) : (
                          <>
                            {house.bedrooms || 0}B • {house.bathrooms || 0}Ba
                            {house.area ? ` • ${house.area}${house.areaUnit || 'sqm'}` : ''}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${house.listingType === 'For Rent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {house.listingType || 'For Sale'}
                      </span>
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap">
                      {getCategoryBadge(house.category)}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap">
                      {getStatusBadge(house.status)}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {house.owner?.profileImage ? (
                            <img
                              src={house.owner.profileImage.startsWith('http') ? house.owner.profileImage : `${apiBaseUrl}${house.owner.profileImage}`}
                              alt="Owner"
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-2 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                            {house.owner?.firstName || house.owner?.lastName
                              ? `${house.owner.firstName || ''} ${house.owner.lastName || ''}`.trim()
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      {house.createdAt
                        ? new Date(house.createdAt).toLocaleDateString()
                        : ""}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {isAdmin && (
                          <select
                            value={house.status}
                            onChange={(e) =>
                              handleStatusChange(house._id, e.target.value)
                            }
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white min-w-24"
                          >
                            <option value="Available">Available</option>
                            <option value="Sold">Sold</option>
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                          </select>
                        )}

                        {(isAdmin || user?.permissions?.includes("houses:edit")) && (
                          <button
                            onClick={() => handleEdit(house)}
                            className="text-blue-600 hover:text-blue-900 p-1 flex-shrink-0"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            localStorage.setItem(
                              "selectedItem",
                              JSON.stringify(house)
                            );
                            localStorage.setItem("selectedItemType", "house");
                            localStorage.setItem(
                              "navigateToSection",
                              "house"
                            );
                            window.location.reload();
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {(isAdmin || user?.permissions?.includes("houses:delete")) && (
                          <button
                            onClick={() => handleDeleteHouse(house._id)}
                            className="text-red-600 hover:text-red-900 p-1 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!loading && houses.length === 0 && (
            <div className="text-center py-8">
              <Home className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm md:text-base text-gray-500 mb-3">
                You don't have any houses yet.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2 text-sm md:text-base"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first house</span>
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex justify-center sm:justify-end space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Add House Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg md:rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    Add New House
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>

                <form onSubmit={handleAddHouse} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={32}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                        >
                          <option value="Luxury House">Luxury House</option>
                          <option value="Middle house">Middle House</option>
                          <option value="Commercial Property">
                            Commercial Property
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Listing Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.listingType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listingType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                          required
                        >
                          <option value="For Sale">For Sale</option>
                          <option value="For Rent">For Rent</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.listingType === "For Rent" ? "Price per Month" : "Price"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={formData.listingType === "For Rent" ? "e.g., 500000" : "e.g., 50000000"}
                        min="0"
                        required
                      />
                    </div>

                    {formData.listingType !== "For Rent" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discounted Price
                        </label>
                        <input
                          type="number"
                          value={formData.discountedPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountedPrice: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 45000000"
                          min="0"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.province}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Province</option>
                        {getUniqueProvinces().map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!formData.province}
                      >
                        <option value="">Select District</option>
                        {availableDistricts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sector <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.sector}
                        onChange={(e) => handleSectorChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!formData.district}
                      >
                        <option value="">Select Sector</option>
                        {availableSectors.map((sector) => (
                          <option key={sector} value={sector}>
                            {sector}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.category !== "Commercial Property" ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bedrooms <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.bedrooms}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bedrooms: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bathrooms <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.bathrooms}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bathrooms: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Doors <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.numberOfDoors}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numberOfDoors: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          placeholder="e.g., 5"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area
                      </label>
                      <input
                        type="number"
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            area: parseInt(e.target.value) || "",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area Unit
                      </label>
                      <select
                        value={formData.areaUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            areaUnit: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="sqm">Square Meters</option>
                        <option value="sqft">Square Feet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>

                  {/* YouTube Video URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        YouTube Video URL (Optional)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          youtubeUrl: e.target.value,
                        })
                      }
                      placeholder="https://www.youtube.com/watch?v=... or video ID"
                      className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Add a YouTube video link for a property tour or walkthrough
                    </p>
                  </div>

                  {/* Image Upload Section */}
                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="house-images"
                      />
                      <label
                        htmlFor="house-images"
                        className="cursor-pointer inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Images
                      </label>
                      <p className="mt-2 text-xs md:text-sm text-gray-500">
                        Upload multiple images (JPG, PNG, GIF)
                      </p>
                    </div>

                    {/* Image Preview Grid */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image Preview
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image.preview}
                                alt={`Preview ${index + 1}`}
                                className={`w-full h-16 md:h-24 object-cover rounded-lg border-2 cursor-pointer transition-all ${mainImageIndex === index
                                  ? "border-blue-500"
                                  : "border-gray-200"
                                  }`}
                                onClick={() => setMainImage(index)}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              {mainImageIndex === index && (
                                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 md:px-2 py-1 rounded-full">
                                  Main
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 mt-2">
                          Click on an image to set it as the main image
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm md:text-base text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add House
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
        }

        {/* Edit Modal follows similar responsive pattern... */}
        {
          showEditModal && editingHouse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg md:rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      Edit House
                    </h3>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingHouse(null);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateHouse} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={32}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                          >
                            <option value="Luxury House">Luxury House</option>
                            <option value="Middle house">Middle House</option>
                            <option value="Commercial Property">
                              Commercial Property
                            </option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Listing Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.listingType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                listingType: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                            required
                          >
                            <option value="For Sale">For Sale</option>
                            <option value="For Rent">For Rent</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Owner Selection (Admin Only) */}
                      {isAdmin && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Property Owner
                            </span>
                          </label>
                          <div className="relative">
                            <select
                              value={formData.owner}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  owner: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                              disabled={loadingUsers}
                            >
                              <option value="">Select Owner</option>
                              {availableUsers.map((user) => (
                                <option key={user._id} value={user._id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              {loadingUsers ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.listingType === "For Rent" ? "Price per Month" : "Price"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={formData.listingType === "For Rent" ? "e.g., 500000" : "e.g., 50000000"}
                          min="0"
                          required
                        />
                      </div>

                      {formData.listingType !== "For Rent" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discounted Price
                          </label>
                          <input
                            type="number"
                            value={formData.discountedPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountedPrice: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 45000000"
                            min="0"
                          />
                        </div>
                      )}

                      {/* Location Fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Province <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.province}
                          onChange={(e) => handleProvinceChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Province</option>
                          {getUniqueProvinces().map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          disabled={!formData.province}
                        >
                          <option value="">Select District</option>
                          {availableDistricts.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sector <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.sector}
                          onChange={(e) => handleSectorChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          disabled={!formData.district}
                        >
                          <option value="">Select Sector</option>
                          {availableSectors.map((sector) => (
                            <option key={sector} value={sector}>
                              {sector}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Property Details */}
                      {formData.category !== "Commercial Property" ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bedrooms <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.bedrooms}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bedrooms: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bathrooms <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.bathrooms}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bathrooms: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Doors <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.numberOfDoors}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                numberOfDoors: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            placeholder="e.g., 5"
                            required
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area
                        </label>
                        <input
                          type="number"
                          value={formData.area}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              area: parseInt(e.target.value) || "",
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area Unit
                        </label>
                        <select
                          value={formData.areaUnit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              areaUnit: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="sqm">Square Meters</option>
                          <option value="sqft">Square Feet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>

                    {/* YouTube Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          YouTube Video URL (Optional)
                        </span>
                      </label>
                      <input
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            youtubeUrl: e.target.value,
                          })
                        }
                        placeholder="https://www.youtube.com/watch?v=... or video ID"
                        className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add a YouTube video link for a property tour or walkthrough
                      </p>
                    </div>

                    {/* Image Upload Section for Edit */}
                    <div className="border-t pt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Images <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="house-edit-images"
                        />
                        <label
                          htmlFor="house-edit-images"
                          className="cursor-pointer inline-flex items-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Images
                        </label>
                        <p className="mt-2 text-xs md:text-sm text-gray-500">
                          Upload multiple images (JPG, PNG, GIF)
                        </p>
                      </div>

                      {/* Image Preview Grid */}
                      {uploadedImages.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Preview
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.preview}
                                  alt={`Preview ${index + 1}`}
                                  className={`w-full h-16 md:h-24 object-cover rounded-lg border-2 cursor-pointer transition-all ${mainImageIndex === index
                                    ? "border-blue-500"
                                    : "border-gray-200"
                                    }`}
                                  onClick={() => setMainImage(index)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                {mainImageIndex === index && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 md:px-2 py-1 rounded-full">
                                    Main
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 mt-2">
                            Click on an image to set it as the main image
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingHouse(null);
                          resetForm();
                        }}
                        className="px-4 py-2 text-sm md:text-base text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update House
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )
        }
      </div >

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Action Not Allowed</h3>
            </div>
            <p className="text-gray-600 mb-6">{warningMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK, Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default HouseManagement;
