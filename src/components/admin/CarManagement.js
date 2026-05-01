import React, { useState, useEffect, useMemo } from "react";
import {
  Car,
  Search,
  Edit,
  Trash2,
  Eye,
  Plus,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  User,
} from "lucide-react";
import locationDataImport from "../data/location.json";
import apiBaseUrl from "../../config";
const locationData = locationDataImport.locations;
const CarManagement = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const isAdmin = user?.role === "admin";
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    discountedPrice: "",
    location: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    mileage: "",
    fuelType: "Petrol",
    transmission: "Automatic",
    color: "",
    // performance & specs fields
    performancePower: "",
    performanceTorque: "",
    performanceAcceleration: "",
    performanceTopSpeed: "",
    fuelConsumption: "",
    drivetrain: "",
    seats: "",
    status:
      typeof window !== "undefined" &&
        localStorage.getItem("user") &&
        JSON.parse(localStorage.getItem("user"))?.role === "admin"
        ? "Available"
        : "Pending",
    images: [],
    mainImage: "",
    youtubeUrl: "",
  });

  // Core list/loading state
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // default 5 per page

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  // Location dropdown helpers
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableSectors, setAvailableSectors] = useState([]);
  const [availableCells, setAvailableCells] = useState([]);
  const [availableVillages, setAvailableVillages] = useState([]);

  // Users list for owner change (admin only)
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // apiBaseUrl is imported from src/config which validates the environment at startup

  useEffect(() => {
    fetchCars();
  }, []);

  // Fetch available users on mount (admin only)
  useEffect(() => {
    if (isAdmin) {
      fetchAvailableUsers();
    }
  }, [isAdmin]);

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

  // Location helpers (mirror HouseManagement)
  const getUniqueProvinces = () => {
    const provinces = [...new Set(locationData.map((item) => item.Province))];
    return provinces;
  };

  const getUniqueBrands = () => {
    // Only return brands that actually have cars in the current data
    try {
      const brandsFromCars = Array.isArray(cars)
        ? cars.map((c) => c.brand).filter(Boolean)
        : [];
      const uniqueBrands = [...new Set(brandsFromCars)].sort((a, b) => a.localeCompare(b));
      return uniqueBrands;
    } catch (err) {
      return [];
    }
  };

  const getYearOptions = (start = 1980) => {
    const years = [];
    const current = new Date().getFullYear();
    // Ensure options extend at least until 2040 (helps future-proof listings)
    const maxYear = Math.max(current + 1, 2040);
    for (let y = maxYear; y >= start; y--) {
      years.push(y);
    }
    return years;
  };

  const COLOR_OPTIONS = [
    "Black",
    "White",
    "Silver",
    "Gray",
    "Blue",
    "Red",
    "Green",
    "Brown",
    "Beige",
    "Yellow",
    "Orange",
    "Gold",
    "Pearl White",
  ];

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

  const getCategoryBadge = (brand) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}
      >
        {brand || "Car"}
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

  const fetchCars = async () => {
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
      // Admin lists all cars; non-admin lists only their cars
      const endpoint = isAdmin
        ? `${apiBaseUrl}/api/dashboard/cars`
        : `${apiBaseUrl}/api/cars/my-cars`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cars");
      }

      const data = await response.json();
      // admin endpoint returns { success: true, data: [...] }, user endpoint returns an array
      setCars(Array.isArray(data) ? data : data.cars || data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (carId, newStatus) => {
    if (!isAdmin) {
      setError("Only admins can change status");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/cars/${carId}/status`,
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
        fetchCars(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating car status:", error);
    }
  };

  // Edit functionality
  const handleEdit = (car) => {
    // For non-admin users, only allow editing when status is Pending
    if (!isAdmin && car?.status !== "Pending") {
      setWarningMessage("You can only edit a car while its status is Pending. Please contact an administrator if you need to make changes.");
      setShowWarningModal(true);
      return;
    }
    setEditingCar(car);
    setFormData({
      title: car.title || "",
      description: car.description || "",
      brand: car.brand || "",
      model: car.model || "",
      year: car.year || "",
      price: car.price || "",
      discountedPrice: car.discountedPrice || "",
      location: car.location || "",
      province:
        car.address?.province || car.province || car.address?.city || "",
      district: car.address?.district || car.district || "",
      sector: car.address?.sector || car.sector || "",
      cell: car.address?.cell || car.cell || "",
      village: car.address?.village || car.village || "",
      mileage: car.mileage || "",
      fuelType: car.fuelType || "Petrol",
      transmission: car.transmission || "Automatic",
      color: car.color || "",
      // populate performance/specs from nested specifications when available
      performancePower:
        car.specifications?.performance?.power || car.power || "",
      performanceTorque:
        car.specifications?.performance?.torque || car.torque || "",
      performanceAcceleration:
        car.specifications?.performance?.acceleration || car.acceleration || "",
      performanceTopSpeed:
        car.specifications?.performance?.topSpeed || car.topSpeed || "",
      fuelConsumption:
        car.specifications?.performance?.fuelConsumption ||
        car.fuelConsumption ||
        "",
      drivetrain: car.specifications?.transmission?.drivetrain || "",
      seats: car.seats || "",
      status: car.status || "Available",
      images: car.images || [],
      mainImage: car.mainImage || "",
      youtubeUrl: car.youtubeUrl || "",
      owner: car.owner?._id || car.owner || "",
    });

    // Fetch available users for owner change (admin only)
    if (isAdmin) {
      fetchAvailableUsers();
    }

    // Populate cascading dropdowns for editing
    const provinceVal =
      car.address?.province || car.province || car.address?.city || "";
    const districtVal = car.address?.district || car.district || "";
    const sectorVal = car.address?.sector || car.sector || "";
    const cellVal = car.address?.cell || car.cell || "";
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
    // Load existing images for editing
    if (car.images && car.images.length > 0) {
      const existingImages = car.images.map((imageUrl, index) => ({
        file: null, // No file object for existing images
        preview:
          imageUrl && imageUrl.startsWith("http")
            ? imageUrl
            : `${apiBaseUrl}${imageUrl}`,
        isExisting: true,
        originalUrl: imageUrl,
      }));
      setUploadedImages(existingImages);

      // Set main image index
      const mainImageIndex = car.images.findIndex(
        (img) => img === car.mainImage
      );
      setMainImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
    } else {
      setUploadedImages([]);
      setMainImageIndex(0);
    }

    setShowEditModal(true);
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    try {
      // Safety: block non-admin updates when status is not Pending
      if (!isAdmin && editingCar && editingCar.status !== "Pending") {
        setError("You can only update a car while its status is Pending");
        return;
      }
      const token = localStorage.getItem("token");
      // Create FormData for file upload (mirror HouseManagement)
      const formDataToSend = new FormData();

      // Add text fields except images/main/specifications (we append specs separately)
      Object.keys(formData).forEach((key) => {
        if (["images", "mainImage", "specifications"].includes(key)) return;
        formDataToSend.append(key, formData[key] ?? "");
      });

      // Build specifications object from performance/drivetrain fields
      const specCopy = {
        performance: {
          power: formData.performancePower || "",
          torque: formData.performanceTorque || "",
          acceleration: formData.performanceAcceleration || "",
          topSpeed: formData.performanceTopSpeed || "",
          fuelConsumption: formData.fuelConsumption || "",
        },
        transmission: {
          drivetrain: formData.drivetrain || "",
        },
      };
      formDataToSend.append("specifications", JSON.stringify(specCopy));

      // seats numeric
      if (formData.seats)
        formDataToSend.set("seats", String(Number(formData.seats)));

      // Compose location if missing and send address payload
      const address = {
        province: formData.province || "",
        district: formData.district || "",
        sector: formData.sector || "",
        cell: formData.cell || "",
        village: formData.village || "",
      };
      formDataToSend.append("address", JSON.stringify(address));
      if (!formData.location || String(formData.location).trim() === "") {
        const composed = [
          address.province,
          address.district,
          address.sector,
          address.cell,
          address.village,
        ]
          .filter(Boolean)
          .join(", ");
        formDataToSend.set("location", composed);
      }

      // Extract numeric price
      if (formData.price) {
        const m = String(formData.price).match(/\d+/g);
        if (m) formDataToSend.append("priceNumeric", parseInt(m.join("")));
      }

      // Hint backend destination
      formDataToSend.append("uploadContext", "cars");

      // Send all existing images in current order
      uploadedImages.forEach((img) => {
        if (img.isExisting && img.originalUrl) {
          formDataToSend.append("existingImages", img.originalUrl);
        }
      });

      // Add new images: one main, others gallery
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img, idx) => {
          if (img.file) {
            if (idx === mainImageIndex)
              formDataToSend.append("mainImage", img.file);
            else formDataToSend.append("carImages", img.file);
          }
        });
      }

      const url = isAdmin
        ? `${apiBaseUrl}/api/dashboard/cars/${editingCar._id}`
        : `${apiBaseUrl}/api/cars/${editingCar._id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        let serverMsg = "Failed to update car";
        try {
          const e = await response.json();
          serverMsg = e?.message || serverMsg;
        } catch (_) { }
        throw new Error(serverMsg);
      }

      await fetchCars();
      setShowEditModal(false);
      setEditingCar(null);
      resetForm();
    } catch (error) {
      setError(error.message);
    }
  };

  // Add functionality
  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload (mirror HouseManagement)
      const formDataToSend = new FormData();

      // Add text fields except images/main/specifications
      Object.keys(formData).forEach((key) => {
        if (["images", "mainImage", "specifications"].includes(key)) return;
        formDataToSend.append(key, formData[key] ?? "");
      });

      // Build and append specifications object
      const specCopy = {
        performance: {
          power: formData.performancePower || "",
          torque: formData.performanceTorque || "",
          acceleration: formData.performanceAcceleration || "",
          topSpeed: formData.performanceTopSpeed || "",
          fuelConsumption: formData.fuelConsumption || "",
        },
        transmission: { drivetrain: formData.drivetrain || "" },
      };
      formDataToSend.append("specifications", JSON.stringify(specCopy));

      // seats numeric
      if (formData.seats)
        formDataToSend.set("seats", String(Number(formData.seats)));

      // priceNumeric from price string
      if (formData.price) {
        const m = String(formData.price).match(/\d+/g);
        if (m) formDataToSend.append("priceNumeric", parseInt(m.join("")));
      }

      // upload context hint
      formDataToSend.append("uploadContext", "cars");

      // Append address payload so backend persists Province/District/Sector/Cell/Village
      const addressAdd = {
        province: formData.province || "",
        district: formData.district || "",
        sector: formData.sector || "",
        cell: formData.cell || "",
        village: formData.village || "",
      };
      formDataToSend.append("address", JSON.stringify(addressAdd));

      // Contact defaults
      formDataToSend.append(
        "contactPhone",
        formData.contactPhone && String(formData.contactPhone).trim()
          ? formData.contactPhone
          : "+250 78 123 4567"
      );
      formDataToSend.append(
        "contactEmail",
        formData.contactEmail && String(formData.contactEmail).trim()
          ? formData.contactEmail
          : "admin@example.com"
      );

      // Add images
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img, idx) => {
          if (img.file) {
            if (idx === mainImageIndex)
              formDataToSend.append("mainImage", img.file);
            else formDataToSend.append("carImages", img.file);
          }
        });
      }

      const url = isAdmin
        ? `${apiBaseUrl}/api/dashboard/cars`
        : `${apiBaseUrl}/api/cars`;
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!response.ok) {
        let serverMsg = "Failed to add car";
        try {
          const errBody = await response.json();
          serverMsg = errBody?.message || serverMsg;
        } catch (_) {
          try {
            const t = await response.text();
            if (t) serverMsg = `${serverMsg}: ${t}`;
          } catch (_) { }
        }
        throw new Error(serverMsg);
      }

      await fetchCars();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      setError(error.message);
    }
  };

  // Image upload functions
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
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

  // Helper to set which uploaded image is main
  const setMainImage = (index) => {
    setMainImageIndex(index);
    const imageUrls = uploadedImages.map((img) => img.preview);
    setFormData({
      ...formData,
      images: imageUrls,
      mainImage: imageUrls[index] || imageUrls[0] || "",
    });
  };

  // Reset form to initial state (used after add/update or closing modals)
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      brand: "",
      model: "",
      year: "",
      price: "",
      discountedPrice: "",
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
      location: "",
      mileage: "",
      fuelType: "Petrol",
      transmission: "Automatic",
      color: "",
      performancePower: "",
      performanceTorque: "",
      performanceAcceleration: "",
      performanceTopSpeed: "",
      fuelConsumption: "",
      drivetrain: "",
      seats: "",
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
    setIsAddingNewBrand(false);
    setNewBrandInput("");
  };

  // Delete a car by id
  const handleDelete = async (carId) => {
    if (!window.confirm("Are you sure you want to delete this car?")) return;
    try {
      const token = localStorage.getItem("token");
      let url;
      if (isAdmin) {
        url = `${apiBaseUrl}/api/dashboard/cars/${carId}`;
      } else {
        const car = (cars || []).find((c) => c._id === carId);
        if (car && car.status !== "Pending") {
          setError("You can only delete a car while its status is Pending");
          return;
        }
        url = `${apiBaseUrl}/api/cars/${carId}`;
      }
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        fetchCars();
      } else {
        let serverMsg = "Failed to delete car";
        try {
          const e = await response.json();
          serverMsg = e?.message || serverMsg;
        } catch { }
        setError(serverMsg);
      }
    } catch (error) {
      console.error("Error deleting car:", error);
      setError("Error deleting car");
    }
  };

  // Filtering for search, status, brand, and owner (used by pagination and table)
  const toLower = (v) => (typeof v === "string" ? v.toLowerCase() : "");
  const filteredCars = (Array.isArray(cars) ? cars : []).filter((car) => {
    const target = toLower(searchTerm);
    const matchesSearch =
      toLower(car?.title).includes(target) ||
      toLower(car?.brand).includes(target) ||
      toLower(car?.model).includes(target) ||
      toLower(car?.location).includes(target);
    const matchesStatus =
      statusFilter === "all" || car?.status === statusFilter;
    const matchesBrand =
      brandFilter === "all" || car?.brand === brandFilter;
    const matchesOwner =
      ownerFilter === "" || car?.owner?._id === ownerFilter;
    return matchesSearch && matchesStatus && matchesBrand && matchesOwner;
  });

  // Pagination calculations (client-side)
  const totalPages = Math.max(1, Math.ceil(filteredCars.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCars.length, pageSize]);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Note: Loading state will be shown inline in the table section instead of replacing entire component

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Error Loading Cars
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchCars}
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
          <span>Add Car</span>
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
                placeholder="Search cars..."
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

            {/* Brand Filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value="all">All Brands</option>
                {getUniqueBrands().map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
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

      {/* Cars Table/Grid */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden mb-6">
        {/* Mobile & Tablet Card View - Improved Design */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading cars...</p>
            </div>
          ) : paginatedCars.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No cars found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {paginatedCars.map((car) => (
                <div key={car._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Image Section */}
                  <div className="relative h-40 bg-gray-100">
                    {(() => {
                      const preferredMain = car.mainImage || (car.images && car.images[0]);
                      if (!preferredMain) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Car className="h-12 w-12 text-gray-400" />
                          </div>
                        );
                      }
                      const src = preferredMain.startsWith("http") ? preferredMain : `${apiBaseUrl}${preferredMain}`;
                      return (
                        <img
                          src={src}
                          alt={car.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      );
                    })()}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(car.status)}
                    </div>
                    {/* Brand Badge */}
                    <div className="absolute top-2 right-2">
                      {getCategoryBadge(car.brand)}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3">
                    {/* Title & Location */}
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{car.title}</h3>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {car.district || car.location}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <p className="text-base font-bold text-purple-600">
                        {formatPriceDisplay(car.price, car.discountedPrice)}
                      </p>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{car.year}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        {car.mileage?.toLocaleString() || 0} km
                      </span>
                      <span className="flex items-center gap-1">
                        {car.transmission}
                      </span>
                    </div>

                    {/* Owner & Fuel Type */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {car.owner?.profileImage ? (
                            <img
                              src={car.owner.profileImage.startsWith('http') ? car.owner.profileImage : `${apiBaseUrl}${car.owner.profileImage}`}
                              alt="Owner"
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <User className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                          {car.owner?.firstName || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {car.fuelType}
                      </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-2">
                      {isAdmin && (
                        <select
                          value={car.status}
                          onChange={(e) => handleStatusChange(car._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white cursor-pointer flex-1 max-w-[100px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Pending">Pending</option>
                        </select>
                      )}
                      <div className="flex items-center gap-1.5">
                        {(isAdmin || user?.permissions?.includes("cars:edit")) && (
                          <button
                            onClick={() => handleEdit(car)}
                            disabled={!isAdmin && car.status !== "Pending"}
                            className={`p-2 rounded-lg transition-colors ${!isAdmin && car.status !== "Pending"
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
                            localStorage.setItem("selectedItem", JSON.stringify(car));
                            localStorage.setItem("selectedItemType", "car");
                            localStorage.setItem("navigateToSection", "car");
                            window.location.reload();
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(isAdmin || user?.permissions?.includes("cars:delete")) && (
                          <button
                            onClick={() => handleDelete(car._id)}
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


        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  CAR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  DETAILS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  OWNER
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  BRAND
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
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-sm text-gray-500">Loading cars...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCars.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">No cars found</div>
                  </td>
                </tr>
              ) : paginatedCars.map((car) => (
                <tr key={car._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const preferred =
                            car.mainImage || (car.images && car.images[0]);
                          if (!preferred)
                            return <Car className="h-5 w-5 text-gray-600" />;
                          const src = preferred.startsWith("http")
                            ? preferred
                            : `${apiBaseUrl}${preferred}`;
                          return (
                            <img
                              src={src}
                              alt={car.title}
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
                          {car.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[140px]">
                          {car.sector && car.district
                            ? `${car.sector}, ${car.district}`
                            : car.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 min-w-0">
                      {formatPriceDisplay(car.price, car.discountedPrice)}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-32">
                      {car.mileage} km • {car.transmission}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-[150px] truncate">
                      {car.owner?.fullName ||
                        `${car.owner?.firstName} ${car.owner?.lastName}` ||
                        "No owner"}
                    </div>
                    <div className="text-sm text-gray-500 max-w-[150px] truncate">
                      {car.owner?.email}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    {getCategoryBadge(car.brand)}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(car.status)}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {car.createdAt
                      ? new Date(car.createdAt).toLocaleDateString()
                      : ""}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <select
                          value={car.status}
                          onChange={(e) => handleStatusChange(car._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white cursor-pointer min-w-[85px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Sold">Sold</option>
                          <option value="Pending">Pending</option>
                        </select>
                      )}

                      {(isAdmin || user?.permissions?.includes("cars:edit")) && (
                        <button
                          onClick={() => handleEdit(car)}
                          disabled={!isAdmin && car.status !== "Pending"}
                          className={`p-2 rounded-lg transition-colors ${!isAdmin && car.status !== "Pending"
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
                          localStorage.setItem("selectedItem", JSON.stringify(car));
                          localStorage.setItem("selectedItemType", "car");
                          localStorage.setItem("navigateToSection", "car");
                          window.location.reload();
                        }}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(isAdmin || user?.permissions?.includes("cars:delete")) && (
                        <button
                          onClick={() => handleDelete(car._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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

        {/* Empty State */}
        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-8 px-4">
            <Car className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm md:text-base text-gray-500 mb-3">
              No cars found matching your criteria.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2 text-sm md:text-base"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first car</span>
            </button>
          </div>
        )
        }
      </div >

      {/* Pagination */}
      {
        filteredCars.length > 0 && totalPages > 1 && (
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
        )
      }

      {/* Add Car Modal */}
      {
        showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Car</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddCar} className="space-y-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.title?.length || 0}/32 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    {isAddingNewBrand ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBrandInput}
                          onChange={(e) => setNewBrandInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Type new brand name"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBrandInput.trim()) {
                              setFormData({ ...formData, brand: newBrandInput.trim() });
                              setIsAddingNewBrand(false);
                              setNewBrandInput("");
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewBrand(false);
                            setNewBrandInput("");
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.brand}
                        onChange={(e) => {
                          if (e.target.value === "__new__") {
                            setIsAddingNewBrand(true);
                            setNewBrandInput("");
                          } else {
                            setFormData({ ...formData, brand: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Brand</option>
                        {getUniqueBrands().map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                        {formData.brand &&
                          !getUniqueBrands().includes(formData.brand) && (
                            <option value={formData.brand}>{formData.brand}</option>
                          )}
                        <option value="__new__">+ Add New Brand</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Year</option>
                      {getYearOptions(1980).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25000000"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage
                    </label>
                    <input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mileage: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) =>
                        setFormData({ ...formData, fuelType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <select
                      value={formData.transmission}
                      onChange={(e) =>
                        setFormData({ ...formData, transmission: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Color</option>
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {formData.color &&
                        !COLOR_OPTIONS.includes(formData.color) && (
                          <option value={formData.color}>{formData.color}</option>
                        )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horsepower (hp)
                    </label>
                    <input
                      type="text"
                      value={formData.performancePower}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performancePower: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 340"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Torque (Nm)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceTorque}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceTorque: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 450"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acceleration (0–100 km/h)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceAcceleration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceAcceleration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 5.2s"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Top Speed (km/h)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceTopSpeed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceTopSpeed: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Consumption (km/L)
                    </label>
                    <input
                      type="text"
                      value={formData.fuelConsumption}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fuelConsumption: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 11.8 km/L or 8.5L/100km"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drivetrain
                    </label>
                    <input
                      type="text"
                      value={formData.drivetrain}
                      onChange={(e) =>
                        setFormData({ ...formData, drivetrain: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., xDrive All-Wheel Drive"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Seats <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.seats}
                      onChange={(e) =>
                        setFormData({ ...formData, seats: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 5"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
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
                    Add a YouTube video link for a car tour or review
                  </p>
                </div>

                {/* Image Upload Section */}
                <div>
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
                      id="car-images"
                    />
                    <label
                      htmlFor="car-images"
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
                                <X className="h-3 w-3" />
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
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Car
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Edit Car Modal */}
      {
        showEditModal && editingCar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Car</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCar(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateCar} className="space-y-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.title?.length || 0}/32 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    {isAddingNewBrand ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBrandInput}
                          onChange={(e) => setNewBrandInput(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Type new brand name"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBrandInput.trim()) {
                              setFormData({ ...formData, brand: newBrandInput.trim() });
                              setIsAddingNewBrand(false);
                              setNewBrandInput("");
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewBrand(false);
                            setNewBrandInput("");
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.brand}
                        onChange={(e) => {
                          if (e.target.value === "__new__") {
                            setIsAddingNewBrand(true);
                            setNewBrandInput("");
                          } else {
                            setFormData({ ...formData, brand: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Brand</option>
                        {getUniqueBrands().map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                        {formData.brand &&
                          !getUniqueBrands().includes(formData.brand) && (
                            <option value={formData.brand}>{formData.brand}</option>
                          )}
                        <option value="__new__">+ Add New Brand</option>
                      </select>
                    )}
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
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Year</option>
                      {getYearOptions(1990).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25000000"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage
                    </label>
                    <input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mileage: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) =>
                        setFormData({ ...formData, fuelType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <select
                      value={formData.transmission}
                      onChange={(e) =>
                        setFormData({ ...formData, transmission: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Color</option>
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {formData.color &&
                        !COLOR_OPTIONS.includes(formData.color) && (
                          <option value={formData.color}>{formData.color}</option>
                        )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horsepower (hp)
                    </label>
                    <input
                      type="text"
                      value={formData.performancePower}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performancePower: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 340"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Torque (Nm)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceTorque}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceTorque: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 450"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acceleration (0–100 km/h)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceAcceleration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceAcceleration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 5.2s"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Top Speed (km/h)
                    </label>
                    <input
                      type="text"
                      value={formData.performanceTopSpeed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          performanceTopSpeed: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Consumption (km/L)
                    </label>
                    <input
                      type="text"
                      value={formData.fuelConsumption}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fuelConsumption: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 11.8 km/L or 8.5L/100km"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drivetrain
                    </label>
                    <input
                      type="text"
                      value={formData.drivetrain}
                      onChange={(e) =>
                        setFormData({ ...formData, drivetrain: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., xDrive All-Wheel Drive"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Seats <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.seats}
                      onChange={(e) =>
                        setFormData({ ...formData, seats: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 5"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Add a YouTube video link for a car tour or review
                  </p>
                </div>

                {/* Image Upload Section */}
                <div>
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
                      id="car-images"
                    />
                    <label
                      htmlFor="car-images"
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
                                <X className="h-3 w-3" />
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
                      setShowEditModal(false);
                      setEditingCar(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Car
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

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

export default CarManagement;
