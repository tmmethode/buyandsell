import React from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Car,
  Wrench,
  FileText,
  Briefcase,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

const ContactUsPage = ({ onSectionChange }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onSectionChange={onSectionChange} activeSection="contact" />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Get in touch with our team. We're here to help with any questions,
            support, or partnership opportunities.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're here to help you with any questions about our services,
              technical support, or business partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Phone Support
              </h3>
              <p className="text-gray-600 mb-2">(+250) 788 820 543</p>
              <p className="text-sm text-gray-500">Mon-Fri: 8AM-6PM</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Email Support
              </h3>
              <p className="text-gray-600 mb-2">announcementafricaltd@gmail.com</p>
              <p className="text-sm text-gray-500">24/7 Response</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                WhatsApp
              </h3>
              <p className="text-gray-600 mb-2">(+250) 788 820 543</p>
              <p className="text-sm text-gray-500">Instant Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Information & Quick Support */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Our Office
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="text-blue-600" size={32} />
                  </div>
                  <p className="text-lg text-gray-700 mb-4">
                    You can contact us for getting the whole information
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <a 
                      href="tel:+250788820543"
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                    >
                      <Phone size={20} />
                      Call Us
                    </a>
                    <a 
                      href="mailto:announcementafricaltd@gmail.com"
                      className="inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                    >
                      <Mail size={20} />
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find quick answers to common questions about our services and
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                How do I list my property?
              </h3>
              <p className="text-gray-600">
                Simply create an account, click "Sell or Rent a House" and
                follow the step-by-step process to upload photos and details of
                your property.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Is it free to list items?
              </h3>
              <p className="text-gray-600">
                Yes! Basic listings are completely free. We offer premium
                features for enhanced visibility and faster sales.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                How do you verify listings?
              </h3>
              <p className="text-gray-600">
                Our team manually reviews all listings and conducts background
                checks on sellers to ensure authenticity and quality.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We support mobile money (M-Pesa, Airtel Money), bank transfers,
                and cash payments for your convenience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default ContactUsPage;
