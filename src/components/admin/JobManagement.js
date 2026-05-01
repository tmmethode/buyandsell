import React from 'react';
import { Briefcase, Clock } from 'lucide-react';

const JobManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon Container */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5 text-yellow-800" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          Job Management
        </h2>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Clock className="w-4 h-4" />
          Coming Soon
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          We're working hard to bring you powerful job management features.
          Stay tuned for updates!
        </p>

        {/* Feature Preview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Upcoming Features
          </h3>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Post and manage job listings
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Review job seeker profiles
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Manage service providers
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Track applications and responses
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobManagement;
