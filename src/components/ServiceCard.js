import React from 'react';

const ServiceCard = ({ icon: Icon, title, description, buttonText, color, onClick, number }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group cursor-pointer relative">
            {/* Number Badge */}
            {number && (
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {number}
                </div>
            )}
            
            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${color} group-hover:scale-110 transition-transform duration-300`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
                </p>

                {/* Button */}
                <button
                    onClick={onClick}
                    className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm transform w-full"
                >
                    {buttonText}
                </button>
            </div>

            {/* Bottom border animation */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transform scale-x-0 transition-transform duration-500 group-hover:scale-x-100 origin-center mt-4 sm:mt-6"></div>
        </div>
    );
};

export default ServiceCard;
