import React, { useState, useEffect } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import {
  Users,
  Home,
  Car,
  MapPin,
  Briefcase,
  BarChart3,
  TrendingUp,
  Activity,
  Eye,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
} from "lucide-react";

// ...existing code...
import AdminSidebar from "./AdminSidebar";
// import LoginPage from '../LoginPage';
import UserManagement from "./UserManagement";
import HouseManagement from "./HouseManagement";
import CarManagement from "./CarManagement";
import PlotManagement from "./PlotManagement";
import JobManagement from "./JobManagement";
import UserSettings from "./UserSettings";
import SignedContracts from "./SignedContracts";
import apiBaseUrl from "../../config";

const AdminDashboard = ({ onSectionChange }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkAuthentication();
  }, []);

  // Keep activeTab in sync with the URL path (/admin/:tab)
  const location = useLocation();
  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const sub = parts[1] || "dashboard";
    setActiveTab(sub);
  }, [location]);

  useEffect(() => {
    if (
      isAuthenticated &&
      activeTab === "dashboard" &&
      user?.role === "admin"
    ) {
      fetchDashboardData();

      // Auto-refresh dashboard data every 60 seconds
      const refreshInterval = setInterval(() => {
        fetchDashboardData();
      }, 60000);

      return () => clearInterval(refreshInterval);
    }
  }, [activeTab, isAuthenticated, user]);

  const checkAuthentication = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Allow both admin and user to access this panel; features gated downstream
        if (parsedUser.role === "admin" || parsedUser.role === "user") {
          setIsAuthenticated(true);
          setUser(parsedUser);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setAuthChecked(true);
  };

  const handleLoginSuccess = () => {
    checkAuthentication();
  };

  const fetchDashboardData = async () => {
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
      const response = await fetch(`${apiBaseUrl}/api/dashboard/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (error) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {loading ? (
            // Loading skeleton for stats cards
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="mt-2 md:mt-3 lg:mt-4 flex items-center">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </>
          ) : dashboardData ? (
            <>
              <StatCard
                title="Total Users"
                value={dashboardData.counts.users}
                icon={Users}
                color="bg-blue-500"
                change={dashboardData.monthlyComparison?.users?.change !== undefined
                  ? `${dashboardData.monthlyComparison.users.change >= 0 ? '+' : ''}${dashboardData.monthlyComparison.users.change}%`
                  : 'N/A'}
                changeType={dashboardData.monthlyComparison?.users?.change >= 0 ? "positive" : "negative"}
              />
              <StatCard
                title="Total Houses"
                value={dashboardData.counts.houses}
                icon={Home}
                color="bg-green-500"
                change={dashboardData.monthlyComparison?.houses?.change !== undefined
                  ? `${dashboardData.monthlyComparison.houses.change >= 0 ? '+' : ''}${dashboardData.monthlyComparison.houses.change}%`
                  : 'N/A'}
                changeType={dashboardData.monthlyComparison?.houses?.change >= 0 ? "positive" : "negative"}
              />
              <StatCard
                title="Total Cars"
                value={dashboardData.counts.cars}
                icon={Car}
                color="bg-purple-500"
                change={dashboardData.monthlyComparison?.cars?.change !== undefined
                  ? `${dashboardData.monthlyComparison.cars.change >= 0 ? '+' : ''}${dashboardData.monthlyComparison.cars.change}%`
                  : 'N/A'}
                changeType={dashboardData.monthlyComparison?.cars?.change >= 0 ? "positive" : "negative"}
              />
              <StatCard
                title="Total Plots"
                value={dashboardData.counts.plots}
                icon={MapPin}
                color="bg-orange-500"
                change={dashboardData.monthlyComparison?.plots?.change !== undefined
                  ? `${dashboardData.monthlyComparison.plots.change >= 0 ? '+' : ''}${dashboardData.monthlyComparison.plots.change}%`
                  : 'N/A'}
                changeType={dashboardData.monthlyComparison?.plots?.change >= 0 ? "positive" : "negative"}
              />
              <StatCard
                title="Website Visitors"
                value={dashboardData.counts.visitors || 0}
                icon={Eye}
                color="bg-indigo-500"
                change={dashboardData.monthlyComparison?.visitors?.change !== undefined
                  ? `${dashboardData.monthlyComparison.visitors.change >= 0 ? '+' : ''}${dashboardData.monthlyComparison.visitors.change}%`
                  : 'N/A'}
                changeType={dashboardData.monthlyComparison?.visitors?.change >= 0 ? "positive" : "negative"}
              />
            </>
          ) : null}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Trends
              </h3>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : dashboardData?.monthlyStats ? (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Users</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Houses</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Cars</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded"></div> Plots</div>
                </div>
                {/* Chart - Last 4 months */}
                <div className="h-52 flex items-end justify-around gap-4">
                  {dashboardData.monthlyStats?.slice(-4).map((stat, index) => {
                    const last4Stats = dashboardData.monthlyStats.slice(-4);
                    const maxVal = Math.max(
                      ...last4Stats.flatMap(s => [s.users || 0, s.houses || 0, s.cars || 0, s.plots || 0]),
                      1
                    );
                    const getHeight = (val) => Math.max((val / maxVal) * 140, val > 0 ? 10 : 0);
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 max-w-24">
                        <div className="flex items-end gap-1 h-40 group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            <div>Users: {stat.users || 0}</div>
                            <div>Houses: {stat.houses || 0}</div>
                            <div>Cars: {stat.cars || 0}</div>
                            <div>Plots: {stat.plots || 0}</div>
                          </div>
                          <div className="w-4 bg-blue-500 rounded-t transition-all cursor-pointer hover:opacity-80" style={{ height: `${getHeight(stat.users || 0)}px` }}></div>
                          <div className="w-4 bg-green-500 rounded-t transition-all cursor-pointer hover:opacity-80" style={{ height: `${getHeight(stat.houses || 0)}px` }}></div>
                          <div className="w-4 bg-purple-500 rounded-t transition-all cursor-pointer hover:opacity-80" style={{ height: `${getHeight(stat.cars || 0)}px` }}></div>
                          <div className="w-4 bg-orange-500 rounded-t transition-all cursor-pointer hover:opacity-80" style={{ height: `${getHeight(stat.plots || 0)}px` }}></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 font-semibold">{stat.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dashboardData?.recentActivities?.slice(0, 8).map((activity, index) => {
                  const getIconAndColor = (type) => {
                    switch (type) {
                      case 'user': return { icon: Users, bg: 'bg-blue-100', text: 'text-blue-600' };
                      case 'house': return { icon: Home, bg: 'bg-green-100', text: 'text-green-600' };
                      case 'car': return { icon: Car, bg: 'bg-purple-100', text: 'text-purple-600' };
                      case 'plot': return { icon: MapPin, bg: 'bg-orange-100', text: 'text-orange-600' };
                      default: return { icon: Activity, bg: 'bg-gray-100', text: 'text-gray-600' };
                    }
                  };
                  const { icon: Icon, bg, text } = getIconAndColor(activity.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
                {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                  <div className="text-center py-4 text-gray-500">No recent activity</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers - 3 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Houses */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Top Houses</h3>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="h-4 w-4 text-green-600" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.topPerformers?.houses?.slice(0, 5).map((house, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer group">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700">{house.title}</p>
                      <p className="text-xs text-gray-500 truncate">{house.location || house.district}</p>
                      <p className="text-xs font-semibold text-green-600">{house.price ? `${Number(house.price).toLocaleString()} RWF` : 'Price N/A'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                      <Eye className="h-3 w-3" />
                      {house.views || 0}
                    </div>
                  </div>
                ))}
                {(!dashboardData?.topPerformers?.houses || dashboardData.topPerformers.houses.length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-sm">No houses data</div>
                )}
              </div>
            )}
          </div>

          {/* Top Cars */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Top Cars</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.topPerformers?.cars?.slice(0, 5).map((car, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer group">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700">{car.title || `${car.brand} ${car.model}`}</p>
                      <p className="text-xs text-gray-500 truncate">{car.brand} • {car.year || 'N/A'}</p>
                      <p className="text-xs font-semibold text-purple-600">{car.price ? `${Number(car.price).toLocaleString()} RWF` : 'Price N/A'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                      <Eye className="h-3 w-3" />
                      {car.views || 0}
                    </div>
                  </div>
                ))}
                {(!dashboardData?.topPerformers?.cars || dashboardData.topPerformers.cars.length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-sm">No cars data</div>
                )}
              </div>
            )}
          </div>

          {/* Top Plots */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Top Plots</h3>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.topPerformers?.plots?.slice(0, 5).map((plot, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-700">{plot.title || 'Plot'}</p>
                      <p className="text-xs text-gray-500 truncate">{plot.area} {plot.areaUnit || 'sqm'} • {plot.district || plot.location}</p>
                      <p className="text-xs font-semibold text-orange-600">{plot.price ? `${Number(plot.price).toLocaleString()} RWF` : 'Price N/A'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                      <Eye className="h-3 w-3" />
                      {plot.views || 0}
                    </div>
                  </div>
                ))}
                {(!dashboardData?.topPerformers?.plots || dashboardData.topPerformers.plots.length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-sm">No plots data</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // We'll render nested routes for admin sub-pages so each has a canonical URL.
  const renderContent = () => (
    <Routes>
      {user?.role === "admin" && (
        <>
          <Route path="" element={renderDashboard()} />
          <Route path="dashboard" element={renderDashboard()} />
          <Route path="users" element={<UserManagement />} />
        </>
      )}
      {/* Visible for both roles; subpages guard functionality internally */}
      <Route path="houses" element={<HouseManagement />} />
      <Route path="cars" element={<CarManagement />} />
      <Route path="plots" element={<PlotManagement />} />
      <Route path="jobs" element={<JobManagement />} />
      <Route path="signed-contracts" element={<SignedContracts />} />
      <Route path="settings" element={<UserSettings />} />
      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              user?.role === "admin"
                ? "/dashboard/"
                : "/dashboard/houses"
            }
            replace
          />
        }
      />
    </Routes>
  );

  // Wait until we check localStorage once to avoid redirecting before state initializes
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // If not authenticated after check, redirect to login route
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar user={user} />
        <main className="flex-1 p-3 md:p-6 ml-0 md:ml-0 pl-4 md:pl-6 pt-20 md:pt-6">
          <div className="max-w-7xl mx-auto">
            {/* Horizontal Header Bar */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-3 md:p-4 mb-4 md:mb-6">
              {/* Left: User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage.startsWith('http') ? user.profileImage : `${apiBaseUrl}${user.profileImage}`}
                      alt={user.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg md:text-xl font-bold text-gray-600">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>

              {/* Right: Date, Time and Logout */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <div className="flex flex-col text-right">
                    <span className="font-medium">{currentTime.toLocaleDateString('en-US', {
                      timeZone: 'Africa/Kigali',
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    <span className="text-xs text-gray-500">{currentTime.toLocaleTimeString('en-US', {
                      timeZone: 'Africa/Kigali',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })} (UTC+2)</span>
                  </div>
                </div>
                <a
                  href="/"
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, change, changeType }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 lg:p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div
          className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${color} rounded-lg flex items-center justify-center`}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
        </div>
      </div>
      <div className="mt-2 md:mt-3 lg:mt-4 flex items-center">
        <span
          className={`text-xs md:text-sm font-medium ${changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}
        >
          {change}
        </span>
        <span className="text-xs md:text-sm text-gray-500 ml-2">
          from last month
        </span>
      </div>
    </div>
  );
};

export default AdminDashboard;
