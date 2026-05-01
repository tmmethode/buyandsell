import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Car,
  MapPin,
  Briefcase,
  Settings,
  Menu,
  X,
  FileText,
} from "lucide-react";

const AdminSidebar = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentTab = pathParts[1] || "dashboard";
  const isAdmin = user?.role === "admin";

  const baseItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview and analytics",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage users and roles",
    },
    {
      id: "houses",
      label: "House Management",
      icon: Home,
      description: "Manage house listings",
    },
    {
      id: "cars",
      label: "Car Management",
      icon: Car,
      description: "Manage car listings",
    },
    {
      id: "plots",
      label: "Plot Management",
      icon: MapPin,
      description: "Manage plot listings",
    },
    {
      id: "jobs",
      label: "Job Management",
      icon: Briefcase,
      description: "Manage job listings",
    },
    {
      id: "signed-contracts",
      label: "Signed Contracts",
      icon: FileText,
      description: "Submitted contract forms",
    },

    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Platform configuration",
    },
  ];

  // Filter menu items based on role and permissions
  const menuItems = isAdmin
    ? baseItems
    : baseItems.filter((item) => {
      // Non-admins only see items they have permissions for
      const userPermissions = user?.permissions || [];

      // Always show dashboard and settings if user has any permissions
      if ((item.id === "dashboard" || item.id === "settings") && userPermissions.length > 0) {
        return true;
      }

      // Check if user has any permission for this category
      // Support both old format (e.g., "houses") and new format (e.g., "houses:view")
      if (["houses", "cars", "plots", "signed-contracts"].includes(item.id)) {
        return userPermissions.some(perm =>
          perm === item.id || perm.startsWith(`${item.id}:`)
        );
      }

      // Hide admin-only items for non-admins
      return false;
    });

  const handleNavigation = (itemId) => {
    // Navigate to /dashboard/ for dashboard, otherwise /dashboard/{itemId}
    const path = itemId === "dashboard" ? "/dashboard/" : `/dashboard/${itemId}`;
    navigate(path);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {isAdmin ? "Admin Panel" : "Dashboard"}
            </h2>
            <p className="text-sm text-gray-500">Rwanda Marketplace</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <nav className="space-y-1 md:space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-left transition-all duration-200 group ${isActive
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${isActive
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-600"
                  }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm md:text-base truncate ${isActive
                    ? "text-blue-700"
                    : "text-gray-700 group-hover:text-gray-900"
                    }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-xs hidden md:block ${isActive ? "text-blue-500" : "text-gray-500"
                    }`}
                >
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white shadow-lg min-h-screen">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white shadow-xl transform transition-transform">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
