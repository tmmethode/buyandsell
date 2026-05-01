import React from "react";
import {
  Home,
  Target,
  Eye,
  Handshake,
  Lightbulb,
  Globe,
  Star,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

const AboutUsPage = ({ onSectionChange }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onSectionChange={onSectionChange} activeSection="about" />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connecting people with their perfect opportunities in Rwanda's
            premier marketplace for cars, houses, plots, and jobs.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2020, we started with a simple mission: to make
                buying, selling, and finding opportunities easier for everyone
                in Rwanda. What began as a small local platform has grown into
                the country's most trusted marketplace.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We understand the unique needs of Rwandan communities and have
                built our platform to serve both urban and rural areas, ensuring
                everyone has access to quality listings and reliable services.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    200+
                  </div>
                  <div className="text-sm text-gray-600">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    100+
                  </div>
                  <div className="text-sm text-gray-600">Successful Sales</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <Home size={64} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Building Communities
                </h3>
                <p className="text-gray-600">
                  We believe in the power of connection and community. Every
                  listing, every transaction, and every job placement helps
                  build stronger neighborhoods across Rwanda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission & Vision
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to transforming how people connect, trade, and
              grow in Rwanda's digital economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To provide a seamless, trustworthy platform that empowers
                Rwandans to buy, sell, and connect with opportunities that
                improve their lives. We strive to make every transaction safe,
                transparent, and beneficial for all parties involved.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Vision
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To become Rwanda's leading digital marketplace, fostering
                economic growth and community development through innovative
                technology and exceptional service. We envision a future where
                every Rwandan has easy access to quality opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our
              relationships with users, partners, and communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Handshake className="text-green-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trust</h3>
              <p className="text-gray-600">
                We build and maintain trust through transparency, security, and
                reliable service in every interaction.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="text-blue-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Innovation
              </h3>
              <p className="text-gray-600">
                We continuously improve our platform with cutting-edge
                technology and user-focused solutions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="text-blue-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Community
              </h3>
              <p className="text-gray-600">
                We foster strong communities by connecting people and supporting
                local economic growth.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="text-orange-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Excellence
              </h3>
              <p className="text-gray-600">
                We strive for excellence in every aspect of our service, from
                user experience to customer support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our dedicated team of professionals is committed to making your
              experience exceptional.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">EU</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Eric UKURANYISHEMA
              </h3>
              <p className="text-blue-600 font-semibold mb-4 text-lg">CEO & Founder</p>
              <p className="text-gray-600">
                Visionary leader committed to transforming Rwanda's digital marketplace and connecting communities through innovative solutions.
              </p>
            </div>
          </div>
        </div>
      </section>


      <Footer onSectionChange={onSectionChange} />
    </div>
  );
};

export default AboutUsPage;
