import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Building,
  Car,
  Home,
  Map,
} from "lucide-react";

const Footer = ({ onSectionChange }) => {
  return (
    <footer className="bg-blue-600 text-white py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src={require('./images/buyandsell250-logo.png')} 
                alt="BuyandSell250 Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h3 className="font-semibold text-base">
                  BUY AND SELL
                </h3>
                <p className="text-sm text-purple-200">
                  Your trusted partner for all your needs
                </p>
              </div>
            </div>
            <p className="text-sm text-purple-200">
              We provide comprehensive solutions for property, vehicles, and
              career opportunities in Rwanda.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: "Home", icon: Home, key: "home" },
                { label: "Car Sales", icon: Car, key: "car" },
                { label: "House Sales", icon: Building, key: "house" },
                { label: "Plot Sales", icon: Map, key: "plot" },
              ].map(({ label, icon: Icon, key }) => (
                <li key={key}>
                  <button
                    onClick={() => onSectionChange && onSectionChange(key)}
                    className="flex items-center space-x-2 text-sm hover:text-purple-200 transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Services</h3>
            <ul className="space-y-3 text-sm text-purple-200">
              <li className="flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>Car Rentals</span>
              </li>
              <li className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>House Listings</span>
              </li>
              <li className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span>Plot Sales</span>
              </li>

              <li className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Property Management</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Info</h3>
            <div className="space-y-3 text-sm text-purple-200">
              <a
                href="mailto:announcementafrica@Email.com"
                className="flex items-center space-x-2 hover:text-white transition duration-200"
              >
                <Mail size={16} />
                <span>announcementafrica@Email.com</span>
              </a>
              <a
                href="tel:+250788820543"
                className="flex items-center space-x-2 hover:text-white transition duration-200"
              >
                <Phone size={16} />
                <span>(+250) 788 820 543</span>
              </a>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Kigali, Rwanda</span>
              </div>

              {/* Social Icons */}
              <div className="flex space-x-4 mt-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center transition-transform hover:scale-110 hover:bg-opacity-30"
                    aria-label="Social Icon"
                  >
                    <Icon size={18} className="text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-purple-500 mt-12 pt-6 text-center">
          <p className="text-purple-200 text-sm">
            © 2024 Announcement Africa Ltd. All rights reserved.
          </p>
          <p className="text-purple-200 text-sm mt-2">
            Developed by{" "}
            <a
              href="https://memiserve.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-200 underline transition-colors"
            >
              Memiserve
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
