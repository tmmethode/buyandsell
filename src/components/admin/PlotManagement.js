import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plus,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ruler,
} from "lucide-react";
import apiBaseUrl from "../../config";
import locationDataImport from "../data/location.json";
const locationData = locationDataImport.locations;

const PlotManagement = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "admin";
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // default 5 per page
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [landUseFilter, setLandUseFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("");

  // Add/Edit modal states and form
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    price: "",
    discountedPrice: "",
    area: "",
    areaUnit: "sqm",
    status:
      typeof window !== "undefined" &&
        localStorage.getItem("user") &&
        JSON.parse(localStorage.getItem("user"))?.role === "admin"
        ? "Available"
        : "Pending",
    landUse: "Residential",
    roadAccess: "tarmac",
    soilType: "Mixed",
    utilitiesWater: false,
    utilitiesElectricity: false,
    nearbyLandmarks: "",
    youtubeUrl: "",
  });

  // Image upload state for plots (edit)
  const [uploadedImages, setUploadedImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // Location dropdown helpers for plots
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSectors, setAvailableSectors] = useState([]);
  const [availableCells, setAvailableCells] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  // Users list for owner change (admin only)
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const getUniqueProvinces = () => {
    return [...new Set(locationData.map((i) => i.Province))];
  };

  const getDistrictsByProvince = (province) => {
    return [
      ...new Set(
        locationData
          .filter((i) => i.Province === province)
          .map((i) => i.District)
      ),
    ];
  };

  const getSectorsByDistrict = (province, district) => {
    return [
      ...new Set(
        locationData
          .filter((i) => i.Province === province && i.District === district)
          .map((i) => i.Sector)
      ),
    ];
  };

  const getCellsBySector = (province, district, sector) => {
    return [
      ...new Set(
        locationData
          .filter(
            (i) =>
              i.Province === province &&
              i.District === district &&
              i.Sector === sector
          )
          .map((i) => i.Cell)
      ),
    ];
  };

  const getVillagesByCell = (province, district, sector, cell) => {
    return [
      ...new Set(
        locationData
          .filter(
            (i) =>
              i.Province === province &&
              i.District === district &&
              i.Sector === sector &&
              i.Cell === cell
          )
          .map((i) => i.Village)
      ),
    ];
  };

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
    setFormData({ ...formData, district, sector: "", cell: "", village: "" });
    setAvailableSectors(getSectorsByDistrict(formData.province, district));
    setAvailableCells([]);
    setAvailableVillages([]);
  };

  const handleSectorChange = (sector) => {
    setFormData({ ...formData, sector, cell: "", village: "" });
    setAvailableCells(
      getCellsBySector(formData.province, formData.district, sector)
    );
    setAvailableVillages([]);
  };

  const handleCellChange = (cell) => {
    setFormData({ ...formData, cell, village: "" });
    setAvailableVillages(
      getVillagesByCell(
        formData.province,
        formData.district,
        formData.sector,
        cell
      )
    );
  };

  const handleVillageChange = (village) =>
    setFormData({ ...formData, village });

  useEffect(() => {
    fetchPlots();
  }, []);

  // Fetch available users on mount (admin only)
  useEffect(() => {
    if (isAdmin) {
      fetchAvailableUsers();
    }
  }, [isAdmin]);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        setError("Missing API base URL");
        setLoading(false);
        return;
      }
      // Use admin endpoint for admins; regular users fetch only their plots
      const response = await fetch(
        `${apiBaseUrl}/${isAdmin ? "api/dashboard/plots" : "api/plots/my-plots"
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plots");
      }

      const data = await response.json();
      // admin endpoint returns { success: true, data: [...] }, user endpoint returns array
      setPlots(
        Array.isArray(data) ? data : data.plots || data.data || data || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (plotId, newStatus) => {
    if (!isAdmin) {
      setError("Only admins can change status");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/plots/${plotId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchPlots(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating plot status:", error);
    }
  };

  const handleDelete = async (plotId) => {
    if (window.confirm("Are you sure you want to delete this plot?")) {
      try {
        const token = localStorage.getItem("token");
        if (!apiBaseUrl) {
          console.error(
            "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
          );
          return;
        }
        // For non-admins, only allow delete when status is Pending
        let response;
        if (isAdmin) {
          response = await fetch(
            `${apiBaseUrl}/api/dashboard/plots/${plotId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        } else {
          const plot = plots.find((p) => p._id === plotId);
          if (plot && plot.status !== "Pending") {
            setError("You can only delete a plot while its status is Pending");
            return;
          }
          response = await fetch(`${apiBaseUrl}/api/plots/${plotId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }

        if (response.ok) {
          fetchPlots(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting plot:", error);
      }
    }
  };

  const filteredPlots = plots.filter((plot) => {
    const matchesSearch =
      plot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || plot.status === statusFilter;
    const matchesLandUse =
      landUseFilter === "all" || plot.landUse === landUseFilter;
    const matchesOwner =
      ownerFilter === "" || plot.owner?._id === ownerFilter;
    return matchesSearch && matchesStatus && matchesLandUse && matchesOwner;
  });

  // Pagination calculations (client-side)
  const totalPages = Math.max(1, Math.ceil(filteredPlots.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlots.length, pageSize]);
  const paginatedPlots = filteredPlots.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      Sold: { color: "bg-red-100 text-red-800", icon: XCircle },
      Pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
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



  const formatPriceDisplay = (price, discountedPrice) => {
    const rawOriginal = price || "";
    let originalNum = 0;
    if (typeof rawOriginal === "number") originalNum = rawOriginal;
    else {
      const m = String(rawOriginal).match(/\d+/g);
      if (m) originalNum = parseInt(m.join(""));
    }
    const hasRawDiscount =
      discountedPrice !== undefined &&
      discountedPrice !== null &&
      String(discountedPrice).trim() !== "";
    const discountNum =
      hasRawDiscount && isFinite(Number(discountedPrice))
        ? Number(discountedPrice)
        : 0;
    const hasDiscount =
      hasRawDiscount &&
      discountNum > 0 &&
      originalNum > 0 &&
      discountNum < originalNum;

    if (hasDiscount) {
      return (
        <>
          <div className="text-sm text-gray-500 line-through">
            {Number(originalNum).toLocaleString("en-US")} RWF
          </div>
          <div className="text-sm font-medium text-blue-600">
            {Number(discountNum).toLocaleString("en-US")} RWF
          </div>
        </>
      );
    }

    if (originalNum > 0) {
      return (
        <div className="text-sm font-medium text-blue-600">
          {Number(originalNum).toLocaleString("en-US")} RWF
        </div>
      );
    }

    return (
      <div className="text-sm font-medium text-gray-500">Price on request</div>
    );
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      discountedPrice: "",
      area: "",
      areaUnit: "sqm",
      location: "",
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
      status: isAdmin ? "Available" : "Pending",
      mainImage: "",
      landUse: "Residential",
      roadAccess: "tarmac",
      soilType: "Mixed",
      utilitiesWater: false,
      utilitiesElectricity: false,
      nearbyLandmarks: "",
    });
    setAvailableDistricts([]);
    setAvailableSectors([]);
    setAvailableCells([]);
    setAvailableVillages([]);
  };

  const handleEdit = (plot) => {
    if (!isAdmin && plot.status !== "Pending") {
      setWarningMessage("You can only edit a plot while its status is Pending. Please contact an administrator if you need to make changes.");
      setShowWarningModal(true);
      return;
    }
    setEditingPlot(plot);
    setFormData({
      title: plot.title || "",
      description: plot.description || "",
      price: plot.price || "",
      discountedPrice: plot.discountedPrice || "",
      area: plot.area || "",
      areaUnit: plot.areaUnit || "sqm",
      location: plot.location || "",
      province:
        plot.province || (plot.address && (plot.address.city || "")) || "",
      district: plot.district || (plot.address && plot.address.district) || "",
      sector: plot.sector || (plot.address && plot.address.sector) || "",
      cell: plot.cell || (plot.address && plot.address.cell) || "",
      village: plot.village || (plot.address && plot.address.village) || "",
      status: plot.status || "Available",
      mainImage: plot.mainImage || "",
      landUse: plot.landUse || "Residential",
      roadAccess: (() => {
        const rt = plot.roadType || "None";
        if (rt === "Paved") return "tarmac";
        if (rt === "Gravel") return "murram";
        if (rt === "Dirt") return "dirt";
        return "no-access";
      })(),
      soilType: plot.soilType || "Mixed",
      utilitiesWater: (plot.utilities && !!plot.utilities.water) || false,
      utilitiesElectricity:
        (plot.utilities && !!plot.utilities.electricity) || false,
      nearbyLandmarks: Array.isArray(plot.nearbyFacilities)
        ? plot.nearbyFacilities.join(", ")
        : "",
      youtubeUrl: plot.youtubeUrl || "",
      owner: plot.owner?._id || plot.owner || "",
    });

    // Fetch available users for owner change (admin only)
    if (isAdmin) {
      fetchAvailableUsers();
    }

    const provinceVal =
      plot.province || (plot.address && plot.address.city) || "";
    const districtVal =
      plot.district || (plot.address && plot.address.district) || "";
    const sectorVal =
      plot.sector || (plot.address && plot.address.sector) || "";
    const cellVal = plot.cell || (plot.address && plot.address.cell) || "";
    if (provinceVal) {
      setAvailableDistricts(getDistrictsByProvince(provinceVal));
      if (districtVal) {
        setAvailableSectors(getSectorsByDistrict(provinceVal, districtVal));
        if (sectorVal) {
          setAvailableCells(
            getCellsBySector(provinceVal, districtVal, sectorVal)
          );
          if (cellVal) {
            setAvailableVillages(
              getVillagesByCell(provinceVal, districtVal, sectorVal, cellVal)
            );
          }
        }
      }
    }

    setShowEditModal(true);
    // Load existing images for editing
    if (plot.images && plot.images.length > 0) {
      const existingImages = plot.images.map((imageUrl, index) => ({
        file: null,
        preview:
          imageUrl && imageUrl.startsWith("http")
            ? imageUrl
            : `${apiBaseUrl}${imageUrl}`,
        isExisting: true,
        originalUrl: imageUrl,
      }));
      setUploadedImages(existingImages);
      const mainIdx = plot.images.findIndex((img) => img === plot.mainImage);
      setMainImageIndex(mainIdx >= 0 ? mainIdx : 0);
    } else {
      setUploadedImages([]);
      setMainImageIndex(0);
    }
  };

  const handleUpdatePlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = { ...formData };
      // Ensure discountedPrice is always sent as a number (0 if empty)
      payload.discountedPrice = payload.discountedPrice
        ? parseInt(payload.discountedPrice)
        : 0;
      // Map location pieces into `address` object expected by Plot model
      payload.address = {
        city: formData.province || "",
        district: formData.district || "",
        sector: formData.sector || "",
        cell: formData.cell || "",
        village: formData.village || "",
      };
      // Map land type, road access, utilities, soil, and landmarks to model fields
      payload.landUse = formData.landUse || "Residential";
      const roadTypeMap = {
        tarmac: "Paved",
        murram: "Gravel",
        dirt: "Dirt",
        "no-access": "None",
      };
      payload.roadType = roadTypeMap[formData.roadAccess] || "None";
      payload.accessRoad = payload.roadType !== "None";
      payload.soilType = formData.soilType || "Mixed";
      payload.utilities = {
        water: !!formData.utilitiesWater,
        electricity: !!formData.utilitiesElectricity,
      };
      const landmarksArr = (formData.nearbyLandmarks || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      payload.nearbyFacilities = landmarksArr;
      if (payload.price && typeof payload.price === "string") {
        const m = payload.price.match(/\d+/g);
        if (m) payload.priceNumeric = parseInt(m.join(""));
      }

      // If there are any new image files, use FormData to upload images along with fields
      const hasNewFiles = uploadedImages.some((img) => img.file);
      let response;
      if (hasNewFiles) {
        const formToSend = new FormData();
        // append simple fields
        Object.keys(payload).forEach((key) => {
          if (
            key === "address" ||
            key === "utilities" ||
            key === "nearbyFacilities"
          ) {
            formToSend.append(key, JSON.stringify(payload[key]));
          } else if (key !== "images" && key !== "mainImage") {
            formToSend.append(key, payload[key]);
          }
        });
        // hint backend destination
        formToSend.append("uploadContext", "plots");
        // append existing image URLs so backend can retain them
        uploadedImages.forEach((img) => {
          if (img.isExisting && img.originalUrl)
            formToSend.append("existingImages", img.originalUrl);
        });
        // pass current main image if it's one of the existing images
        const mainIsExisting =
          uploadedImages[mainImageIndex] &&
          uploadedImages[mainImageIndex].isExisting;
        if (mainIsExisting) {
          const url = uploadedImages[mainImageIndex].originalUrl;
          if (url) formToSend.append("currentMainImage", url);
        }
        // append new files
        uploadedImages.forEach((img, idx) => {
          if (img.file) {
            if (idx === mainImageIndex)
              formToSend.append("mainImage", img.file);
            else formToSend.append("plotImages", img.file);
          }
        });
        response = await fetch(
          `${apiBaseUrl}/${isAdmin
            ? `api/dashboard/plots/${editingPlot._id}`
            : `api/plots/${editingPlot._id}`
          }`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              // NOTE: Do not set Content-Type for FormData
            },
            body: formToSend,
          }
        );
      } else {
        response = await fetch(
          `${apiBaseUrl}/${isAdmin
            ? `api/dashboard/plots/${editingPlot._id}`
            : `api/plots/${editingPlot._id}`
          }`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) throw new Error("Failed to update plot");

      // Refresh plots to get fully populated data (including owner object)
      await fetchPlots();
      setShowEditModal(false);
      setEditingPlot(null);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update plot");
    }
  };

  const handleAddPlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      // Build FormData exactly like House add flow, always multipart
      const formToSend = new FormData();

      // Prepare payload values similar to House flow
      const payload = { ...formData };
      payload.discountedPrice = payload.discountedPrice
        ? parseInt(payload.discountedPrice)
        : 0;
      // Extract priceNumeric from price string
      if (payload.price && typeof payload.price === "string") {
        const m = payload.price.match(/\d+/g);
        if (m) payload.priceNumeric = parseInt(m.join(""));
      }
      // Address object (city = province to align with existing address shape)
      const address = {
        city: formData.province || "",
        district: formData.district || "",
        sector: formData.sector || "",
        cell: formData.cell || "",
        village: formData.village || "",
      };
      // Additional fields mapping
      payload.landUse = formData.landUse || "Residential";
      const roadTypeMap = {
        tarmac: "Paved",
        murram: "Gravel",
        dirt: "Dirt",
        "no-access": "None",
      };
      payload.roadType = roadTypeMap[formData.roadAccess] || "None";
      payload.accessRoad = payload.roadType !== "None";
      payload.soilType = formData.soilType || "Mixed";
      const utilities = {
        water: !!formData.utilitiesWater,
        electricity: !!formData.utilitiesElectricity,
      };
      const nearbyFacilities = (formData.nearbyLandmarks || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Append simple text fields like House add (exclude images/mainImage)
      Object.keys(payload).forEach((key) => {
        if (
          key !== "images" &&
          key !== "mainImage" &&
          key !== "nearbyLandmarks" &&
          key !== "utilitiesWater" &&
          key !== "utilitiesElectricity"
        ) {
          formToSend.append(key, payload[key]);
        }
      });
      // Append nested JSON fields
      formToSend.append("address", JSON.stringify(address));
      formToSend.append("utilities", JSON.stringify(utilities));
      formToSend.append("nearbyFacilities", JSON.stringify(nearbyFacilities));

      // Hint backend destination like House
      formToSend.append("uploadContext", "plots");

      // Add contact defaults (same handling style as House)
      formToSend.append("contactPhone", "+250 78 123 4567");
      formToSend.append("contactEmail", "admin@example.com");

      // Add images (if any); for plots backend requires images/mainImage
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img, idx) => {
          if (img.file) {
            if (idx === mainImageIndex)
              formToSend.append("mainImage", img.file);
            else formToSend.append("plotImages", img.file);
          }
        });
      }
      // For non-admins, enforce Pending status (backend may also enforce in future)
      if (!isAdmin) {
        formToSend.set("status", "Pending");
      }

      const response = await fetch(
        `${apiBaseUrl}/${isAdmin ? "api/dashboard/plots" : "api/plots"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formToSend,
        }
      );

      if (!response.ok) throw new Error("Failed to add plot");
      const data = await response.json();
      const newPlot = data.data || data;
      setPlots([newPlot, ...plots]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add plot");
    }
  };

  // Image upload handlers (for edit modal)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));
    setUploadedImages([...uploadedImages, ...newImages]);
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
    const newImgs = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImgs);
    const imageUrls = newImgs.map((img) => img.preview);
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

  // Note: Loading state will be shown inline in the table section instead of replacing entire component

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Error Loading Plots
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchPlots}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
          </h2>
          <p className="text-sm md:text-base text-gray-600 truncate">
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap flex-shrink-0"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span>Add Plot</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 mb-6 overflow-hidden">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search plots..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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

            {/* Land Use Filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={landUseFilter}
                onChange={(e) => {
                  setLandUseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value="all">All Land Types</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
                <option value="Mixed Use">Mixed Use</option>
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

            {/* Owner Filter (admin only) */}
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
                  <option value="">All Owners</option>
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
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Card View - Improved Design */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading plots...</p>
            </div>
          ) : paginatedPlots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="mb-3">No plots found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add your first plot</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {paginatedPlots.map((plot) => (
                <div key={plot._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Image Section */}
                  <div className="relative h-40 bg-gray-100">
                    {(() => {
                      const preferredMain = plot.mainImage || (plot.images && plot.images[0]);
                      if (!preferredMain) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <MapPin className="h-12 w-12 text-gray-400" />
                          </div>
                        );
                      }
                      const src = preferredMain.startsWith("http") ? preferredMain : `${apiBaseUrl}${preferredMain}`;
                      return (
                        <img
                          src={src}
                          alt={plot.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      );
                    })()}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(plot.status)}
                    </div>
                    {/* Land Use Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                        {plot.landUse || 'Residential'}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3">
                    {/* Title & Location */}
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{plot.title}</h3>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {plot.district || plot.location}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <p className="text-base font-bold text-orange-600">
                        {formatPriceDisplay(plot.price, plot.discountedPrice)}
                      </p>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        <span className="font-medium">{plot.area}</span> {plot.areaUnit || 'sqm'}
                      </span>
                      {plot.dimensions && (
                        <span className="flex items-center gap-1">
                          {plot.dimensions}
                        </span>
                      )}
                    </div>

                    {/* Owner & Road Access */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {plot.owner?.profileImage ? (
                            <img
                              src={plot.owner.profileImage.startsWith('http') ? plot.owner.profileImage : `${apiBaseUrl}${plot.owner.profileImage}`}
                              alt="Owner"
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <User className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                          {plot.owner?.firstName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {plot.roadAccess || 'No Access Info'}
                      </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2">
                      {isAdmin && (
                        <select
                          value={plot.status}
                          onChange={(e) => handleStatusChange(plot._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white cursor-pointer flex-1 max-w-[100px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Pending">Pending</option>
                        </select>
                      )}
                      <div className="flex items-center gap-1.5">
                        {(isAdmin || user?.permissions?.includes("plots:edit")) && (
                          <button
                            onClick={() => handleEdit(plot)}
                            disabled={!isAdmin && plot.status !== "Pending"}
                            className={`p-2 rounded-lg transition-colors ${!isAdmin && plot.status !== "Pending"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              }`}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            localStorage.setItem("selectedItem", JSON.stringify(plot));
                            localStorage.setItem("selectedItemType", "plot");
                            localStorage.setItem("navigateToSection", "plot");
                            window.location.reload();
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(isAdmin || user?.permissions?.includes("plots:delete")) && (
                          <button
                            onClick={() => handleDelete(plot._id)}
                            disabled={!isAdmin && plot.status !== "Pending"}
                            className={`p-2 rounded-lg transition-colors ${!isAdmin && plot.status !== "Pending"
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
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
      </div>

      {/* Desktop Table View - Properly contained scroll */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  PLOT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  DETAILS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  OWNER
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  LAND TYPE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  POSTED
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
                      <p className="text-sm text-gray-500">Loading plots...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPlots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">No plots found</div>
                  </td>
                </tr>
              ) : paginatedPlots.map((plot) => (
                <tr key={plot._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const preferred =
                            plot.mainImage || (plot.images && plot.images[0]);
                          if (!preferred)
                            return (
                              <MapPin className="h-5 w-5 text-gray-600" />
                            );
                          const src = preferred.startsWith("http")
                            ? preferred
                            : `${apiBaseUrl}${preferred}`;
                          return (
                            <img
                              src={src}
                              alt={plot.title}
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
                          {plot.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center truncate max-w-[140px]">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {plot.sector && plot.district
                              ? `${plot.sector}, ${plot.district}`
                              : plot.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 min-w-0">
                      {formatPriceDisplay(plot.price, plot.discountedPrice)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Ruler className="h-3 w-3 mr-1 flex-shrink-0" />
                      {plot.area} {plot.areaUnit}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">
                      {(() => {
                        const addr = plot.address || {};
                        const parts = [
                          addr.city || plot.province || "",
                          addr.district || plot.district || "",
                          addr.sector || plot.sector || "",
                        ].filter(Boolean);
                        return parts.join(", ");
                      })()}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-[150px] truncate">
                      {plot.owner?.fullName ||
                        (plot.owner?.firstName && plot.owner?.lastName
                          ? `${plot.owner.firstName} ${plot.owner.lastName}`
                          : "No owner")}
                    </div>
                    <div className="text-sm text-gray-500 max-w-[150px] truncate">
                      {plot.owner?.email || ""}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plot.landUse === "Residential" ? "bg-green-100 text-green-800" :
                      plot.landUse === "Commercial" ? "bg-blue-100 text-blue-800" :
                        plot.landUse === "Agricultural" ? "bg-yellow-100 text-yellow-800" :
                          plot.landUse === "Industrial" ? "bg-purple-100 text-purple-800" :
                            "bg-gray-100 text-gray-800"
                      }`}>
                      {plot.landUse || "N/A"}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(plot.status)}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plot.createdAt
                      ? new Date(plot.createdAt).toLocaleDateString()
                      : ""}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <select
                          value={plot.status}
                          onChange={(e) => handleStatusChange(plot._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white cursor-pointer min-w-[85px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Pending">Pending</option>
                        </select>
                      )}

                      {(isAdmin || user?.permissions?.includes("plots:edit")) && (
                        <button
                          onClick={() => handleEdit(plot)}
                          disabled={!isAdmin && plot.status !== "Pending"}
                          className={`p-2 rounded-lg transition-colors ${!isAdmin && plot.status !== "Pending"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          localStorage.setItem("selectedItem", JSON.stringify(plot));
                          localStorage.setItem("selectedItemType", "plot");
                          localStorage.setItem("navigateToSection", "plot");
                          window.location.reload();
                        }}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(isAdmin || user?.permissions?.includes("plots:delete")) && (
                        <button
                          onClick={() => handleDelete(plot._id)}
                          disabled={!isAdmin && plot.status !== "Pending"}
                          className={`p-2 rounded-lg transition-colors ${!isAdmin && plot.status !== "Pending"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          title="Delete"
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
      </div>

      {/* Empty State for Desktop */}
      {!loading && filteredPlots.length === 0 && (
        <div className="text-center py-8 px-4">
          <MapPin className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-500 mb-3">
            No plots found matching your criteria.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2 text-sm md:text-base"
          >
            <Plus className="h-4 w-4" />
            <span>Add your first plot</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredPlots.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 mb-6">
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
      )
      }

      {/* Add Plot Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Plot</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddPlot} className="space-y-4">
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
                      maxLength={32}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.title?.length || 0}/32 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 5000000"
                      required
                    />
                  </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Province</option>
                      {getUniqueProvinces().map((p) => (
                        <option key={p} value={p}>
                          {p}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!formData.province}
                    >
                      <option value="">Select District</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!formData.district}
                    >
                      <option value="">Select Sector</option>
                      {availableSectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Land Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.landUse}
                      onChange={(e) =>
                        setFormData({ ...formData, landUse: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Plot specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Road Access <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.roadAccess}
                      onChange={(e) =>
                        setFormData({ ...formData, roadAccess: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="tarmac">Tarmac (Paved)</option>
                      <option value="murram">Murram (Gravel)</option>
                      <option value="dirt">Dirt</option>
                      <option value="no-access">No Access</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soil Type
                    </label>
                    <select
                      value={formData.soilType}
                      onChange={(e) =>
                        setFormData({ ...formData, soilType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loamy">Loamy</option>
                      <option value="Rocky">Rocky</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nearby Landmarks
                    </label>
                    <input
                      type="text"
                      value={formData.nearbyLandmarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nearbyLandmarks: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., School, Market, Hospital"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.utilitiesWater}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          utilitiesWater: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Water Available
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.utilitiesElectricity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          utilitiesElectricity: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Electricity Available
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    Add a YouTube video link for a plot tour or overview
                  </p>
                </div>

                {/* Image Upload Section */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="plot-images"
                    />
                    <label
                      htmlFor="plot-images"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Images
                    </label>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload multiple images (JPG, PNG, GIF)
                    </p>
                  </div>

                  {/* Image Preview Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className={`w-full h-24 object-cover rounded-lg border-2 cursor-pointer transition-all ${mainImageIndex === index
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
                                ✕
                              </button>
                            </div>
                            {mainImageIndex === index && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                Main
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Click on an image to set it as the main image
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Add Plot
                  </button>
                </div>
              </form>
            </div>
          </div >
        )
      }

      {/* Edit Plot Modal - Fixed Structure */}
      {
        showEditModal && editingPlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Plot</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlot(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdatePlot} className="space-y-4">
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
                      maxLength={32}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.title?.length || 0}/32 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 5000000"
                      required
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Province</option>
                      {getUniqueProvinces().map((p) => (
                        <option key={p} value={p}>
                          {p}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!formData.province}
                    >
                      <option value="">Select District</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!formData.district}
                    >
                      <option value="">Select Sector</option>
                      {availableSectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Land Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.landUse}
                      onChange={(e) =>
                        setFormData({ ...formData, landUse: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Plot specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Road Access <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.roadAccess}
                      onChange={(e) =>
                        setFormData({ ...formData, roadAccess: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="tarmac">Tarmac (Paved)</option>
                      <option value="murram">Murram (Gravel)</option>
                      <option value="dirt">Dirt</option>
                      <option value="no-access">No Access</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soil Type
                    </label>
                    <select
                      value={formData.soilType}
                      onChange={(e) =>
                        setFormData({ ...formData, soilType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loamy">Loamy</option>
                      <option value="Rocky">Rocky</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nearby Landmarks
                    </label>
                    <input
                      type="text"
                      value={formData.nearbyLandmarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nearbyLandmarks: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., School, Market, Hospital"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.utilitiesWater}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          utilitiesWater: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Water Available
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.utilitiesElectricity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          utilitiesElectricity: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Electricity Available
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    Add a YouTube video link for a plot tour or overview
                  </p>
                </div>

                {/* Image Upload Section for Edit Modal */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="plot-edit-images"
                    />
                    <label
                      htmlFor="plot-edit-images"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Images
                    </label>
                    <p className="mt-2 text-sm text-gray-500">
                      Upload multiple images (JPG, PNG, GIF)
                    </p>
                  </div>

                  {/* Image Preview Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className={`w-full h-24 object-cover rounded-lg border-2 cursor-pointer transition-all ${mainImageIndex === index
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
                                ✕
                              </button>
                            </div>
                            {mainImageIndex === index && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                Main
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
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
                      setEditingPlot(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg order-1 sm:order-2"
                  >
                    Update Plot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Warning Modal */}
      {
        showWarningModal && (
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
        )
      }
    </div >
  );
};

export default PlotManagement;
