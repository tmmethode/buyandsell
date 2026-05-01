import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import apiBaseUrl from "../../config";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
    isActive: true,
    isVerified: false,
    permissions: [],
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        setError("Missing API base URL");
        setLoading(false);
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        setError("Missing API base URL");
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusToggle = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        setError("Missing API base URL");
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle user status");
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !user.isActive } : user
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!apiBaseUrl) {
        console.error(
          "REACT_APP_API_BASE_URL is not set in environment variables. Please set it in your .env file."
        );
        setError("Missing API base URL");
        return;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/dashboard/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from local state
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: "bg-red-100 text-red-800", icon: Shield },
      user: { color: "bg-blue-100 text-blue-800", icon: Users },
    };

    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {role}
      </span>
    );
  };

  const getStatusBadge = (isActive, isVerified) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <UserX className="h-3 w-3 mr-1" />
          Inactive
        </span>
      );
    }

    if (!isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unverified
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitAddUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");
      setFormLoading(true);
      const payload = { ...formData };
      // Basic validation
      const required = ["firstName", "lastName", "email", "phone", "password"];
      for (const k of required) {
        if (!String(payload[k] || "").trim()) {
          throw new Error(`Missing ${k}`);
        }
      }
      const res = await fetch(`${apiBaseUrl}/api/dashboard/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create user");
      }
      await fetchUsers();
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (!selectedUser) throw new Error("No user selected");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");
      setFormLoading(true);
      const payload = { ...formData };
      if (!String(payload.password || "").trim()) {
        delete payload.password; // keep old password
      }
      const res = await fetch(
        `${apiBaseUrl}/api/dashboard/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update user");
      }
      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Note: Loading state will be shown inline in the table section instead of replacing entire component

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl md:text-6xl mb-4">⚠️</div>
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">
          Error Loading Users
        </h2>
        <p className="text-sm md:text-base text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchUsers}
          className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">

          </h2>
          <p className="text-sm md:text-base text-gray-600">

          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              password: "",
              role: "user",
              isActive: true,
              isVerified: false,
              permissions: [],
            });
            setShowAddModal(true);
          }}
          className="bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search users by name or email..."
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {/* Custom dropdown arrow */}
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

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
              {/* Custom dropdown arrow */}
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
              className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 text-sm md:text-base whitespace-nowrap flex-shrink-0"
            >
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span>Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users Grid/Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div className="truncate">Phone: {user.phone}</div>
                  <div className="truncate">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Mobile Card View - Alternative flex approach */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-shrink-0 min-w-0">
                    {getStatusBadge(user.isActive, user.isVerified)}
                  </div>

                  {/* Actions container with max width */}
                  <div className="flex items-center space-x-1 max-w-[200px] overflow-hidden">
                    <div className="relative flex-shrink-0">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="px-1 py-1 pr-4 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer appearance-none"
                        style={{ width: "48px" }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pointer-events-none">
                        <svg
                          className="w-2 h-2 text-gray-400"
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
                      onClick={() => handleStatusToggle(user._id)}
                      className={`px-1 py-1 text-xs rounded flex-shrink-0 ${user.isActive
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      style={{ width: "36px" }}
                    >
                      {user.isActive ? "Off" : "On"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({
                          firstName: user.firstName || "",
                          lastName: user.lastName || "",
                          email: user.email || "",
                          phone: user.phone || "",
                          password: "",
                          role: user.role || "user",
                          isActive: !!user.isActive,
                          isVerified: !!user.isVerified,
                          permissions: user.permissions || [],
                        });
                        setFormError(null);
                        setShowEditModal(true);
                      }}
                      className="p-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex-shrink-0"
                    >
                      <Edit className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="p-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-3"></div>
                        <p className="text-sm text-gray-500">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">No users found</div>
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center min-w-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            ID: {user._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-48">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-48">
                        {user.phone}
                      </div>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive, user.isVerified)}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium relative">
                      <div className="flex items-center space-x-1">
                        {/* Fix: Wrap select in relative div and add custom arrow */}
                        <div className="relative">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="px-2 py-1 pr-6 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer appearance-none w-16"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          {/* Add the custom dropdown arrow */}
                          <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                            <svg
                              className="w-3 h-3 text-gray-400"
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
                          onClick={() => handleStatusToggle(user._id)}
                          className={`px-2 py-1 text-xs rounded whitespace-nowrap ${user.isActive
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                        >
                          {user.isActive ? "Deact" : "Activ"}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              firstName: user.firstName || "",
                              lastName: user.lastName || "",
                              email: user.email || "",
                              phone: user.phone || "",
                              password: "",
                              role: user.role || "user",
                              isActive: !!user.isActive,
                              isVerified: !!user.isVerified,
                              permissions: user.permissions || [],
                            });
                            setFormError(null);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          <Edit className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Add User
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {formError && (
                <div className="mb-3 text-sm text-red-600">{formError}</div>
              )}
              <form onSubmit={submitAddUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />{" "}
                    Active
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                    />{" "}
                    Verified
                  </label>
                </div>
                {formData.role === "user" && (
                  <div className="border-t pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions (for regular users)
                    </label>
                    <div className="space-y-4">
                      {/* Houses Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Houses</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`houses:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`houses:${action}`)}
                                onChange={(e) => {
                                  const perm = `houses:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Cars Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Cars</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`cars:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`cars:${action}`)}
                                onChange={(e) => {
                                  const perm = `cars:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Plots Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Plots</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`plots:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`plots:${action}`)}
                                onChange={(e) => {
                                  const perm = `plots:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg border text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    {formLoading ? "Saving..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Edit User
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {formError && (
                <div className="mb-3 text-sm text-red-600">{formError}</div>
              )}
              <form onSubmit={submitEditUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />{" "}
                    Active
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                    />{" "}
                    Verified
                  </label>
                </div>
                {formData.role === "user" && (
                  <div className="border-t pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions (for regular users)
                    </label>
                    <div className="space-y-4">
                      {/* Houses Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Houses</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`houses:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`houses:${action}`)}
                                onChange={(e) => {
                                  const perm = `houses:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Cars Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Cars</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`cars:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`cars:${action}`)}
                                onChange={(e) => {
                                  const perm = `cars:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Plots Permissions */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-sm text-gray-800 mb-2">Plots</div>
                        <div className="flex flex-wrap gap-4">
                          {["view", "edit", "delete"].map((action) => (
                            <label key={`plots:${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(`plots:${action}`)}
                                onChange={(e) => {
                                  const perm = `plots:${action}`;
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm]
                                      : prev.permissions.filter(p => p !== perm)
                                  }));
                                }}
                              />
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    {formLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
