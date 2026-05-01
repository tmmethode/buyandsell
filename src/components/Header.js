import React, { useState } from "react";
import ContractModal from "./ContractModal";
import {
  Facebook,
  Twitter,
  Instagram,
  Phone,
  Mail,
  Menu,
  X,
  FileText,
} from "lucide-react";

const Header = ({
  onSectionChange,
  activeSection = "home",
  hideAuthButtons = false,
  onOpenContract = null,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (section) => {
    onSectionChange && onSectionChange(section);
    setIsMobileMenuOpen(false);
  };

  const handleOpenContract = () => {
    if (onOpenContract) {
      onOpenContract();
      return;
    }

    setShowContractModal(true);
  };

  return (
    <>
      <div className="container mx-auto max-w-[97rem]">
        <div className="bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-b-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Mail className="w-4 h-4 text-white" />
                <span className="text-xs sm:text-sm font-medium">
                  announcementafricaltd@gmail.com
                </span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="w-4 h-4 text-white" />
                <span className="text-xs sm:text-sm font-medium">
                  (+250) 788 820 543
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 cursor-pointer">
                <Facebook className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 cursor-pointer">
                <Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 cursor-pointer">
                <Instagram className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 cursor-pointer">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white py-4 sm:py-6 px-4 sm:px-6 shadow-md">
        <div className="container mx-auto">
          {/* Top row - Logo and Search */}
          <div className="flex justify-between items-center mb-4">
            {/* Logo */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              <img 
                src={require('./images/buyandsell250-logo.png')} 
                alt="BuyandSell250 Logo" 
                className="h-16 sm:h-20 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-800 tracking-wide">
                  BUY AND SELL
                </div>
                <div className="text-sm text-gray-600">
                  Your trusted partner in real estate
                </div>
              </div>
            </div>

            {/* Login (no Admin button) */}
            {!hideAuthButtons && (
              <div className="hidden lg:flex items-center space-x-4">
                <button
                  onClick={handleOpenContract}
                  className="px-5 py-3 bg-orange-100 text-orange-700 rounded-full font-semibold shadow hover:bg-orange-200 transition-all duration-200 text-sm inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Sign Contract</span>
                </button>
                <button
                  onClick={() => onSectionChange && onSectionChange("login")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-all duration-200 text-sm">
                  Login
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex justify-center space-x-8 xl:space-x-12 border-t border-gray-200 pt-4">
            <button
              onClick={() => handleNavClick("home")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "home"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              HOME
              {activeSection === "home" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => handleNavClick("car")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "car"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              CAR
              {activeSection === "car" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => handleNavClick("house")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "house"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              HOUSE
              {activeSection === "house" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => handleNavClick("plot")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "plot"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              PLOT SALES
              {activeSection === "plot" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>

            <button
              onClick={() => handleNavClick("about")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "about"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              ABOUT US
              {activeSection === "about" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => handleNavClick("contact")}
              className={`font-semibold text-sm transition-colors duration-200 py-2 relative ${activeSection === "contact"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
                }`}
            >
              CONTACT US
              {activeSection === "contact" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <nav className="flex flex-col space-y-1 p-4">
              <button
                onClick={() => handleNavClick("home")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "home"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                HOME
              </button>
              <button
                onClick={() => handleNavClick("car")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "car"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                CAR
              </button>
              <button
                onClick={() => handleNavClick("house")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "house"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                HOUSE
              </button>
              <button
                onClick={() => handleNavClick("plot")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "plot"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                PLOT SALES
              </button>

              <button
                onClick={() => handleNavClick("about")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "about"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                ABOUT US
              </button>
              <button
                onClick={() => handleNavClick("contact")}
                className={`text-left px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 ${activeSection === "contact"
                    ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                    : "text-gray-800 hover:text-blue-600 hover:bg-gray-50"
                  }`}
              >
                CONTACT US
              </button>
              {!hideAuthButtons && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <button
                    onClick={() => {
                      handleOpenContract();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full mb-3 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 transition-all duration-200 text-sm inline-flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Sign Contract</span>
                  </button>
                  <button
                    onClick={() => onSectionChange && onSectionChange("login")}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 text-sm">
                    Login
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        item={null}
        itemType="General"
      />
    </>
  );
};

export default Header;
