// components/ItemCard.jsx
import React, { useMemo, useState, useEffect } from "react";
import apiBaseUrl from '../config';
import { MapPin, Bed, Bath, Maximize2, Gauge, Fuel, Settings, Home as HomeIcon, Share2 } from "lucide-react";

const ItemCard = ({
  id,
  image,
  mainImage,
  title,
  description,
  category,
  listingType,
  numberOfDoors,
  price,
  originalPrice,
  discountedPrice,
  location,
  district,
  sector,
  mileage,
  fuelType,
  transmission,
  bedrooms,
  bathrooms,
  area,
  areaUnit,
  landUse,
  label,
  onClick,
  onCardClick,
}) => {
  // Normalize main image URL; fall back to provided image prop
  const initialSrc = useMemo(() => {
    if (!mainImage) return image || "";
    if (typeof mainImage === "string") {
      return mainImage.startsWith("http")
        ? mainImage
        : `${apiBaseUrl}${mainImage.startsWith('/') ? mainImage : '/' + mainImage}`;
    }
    return mainImage;
  }, [mainImage, image]);

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [triedAlt, setTriedAlt] = useState(false);

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setTriedAlt(false);
  }, [initialSrc]);

  const handleCardClick = (e) => {
    // Don't trigger card click if button is clicked
    if (e.target.closest('button')) {
      return;
    }
    if (onCardClick) {
      onCardClick();
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative"
      onClick={handleCardClick}
    >
      {/* Image Section with Enhanced Overlay */}
      <div className="relative overflow-hidden h-56 sm:h-64">
        <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
          {currentSrc ? (
            <img
              src={currentSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                if (!triedAlt) {
                  // Try swapping between absolute and relative URL forms
                  const current = e.currentTarget.getAttribute('src') || '';
                  let next = '';
                  try {
                    if (current.startsWith(apiBaseUrl)) {
                      const rel = current.replace(apiBaseUrl, '');
                      next = rel.startsWith('/') ? rel : `/${rel}`;
                    } else {
                      next = current.startsWith('http')
                        ? current
                        : `${apiBaseUrl}${current.startsWith('/') ? current : `/${current}`}`;
                    }
                  } catch (_) { }
                  setTriedAlt(true);
                  if (next && next !== current) {
                    setCurrentSrc(next);
                    return;
                  }
                }
                // Final fallback: hide image and show emoji layer
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="text-gray-400 text-xl transition-colors duration-300 group-hover:text-gray-600">
              No Image
            </div>
          )}

          {/* Fallback emoji for failed images */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center hidden">
            <HomeIcon className="w-20 h-20 text-white opacity-50" />
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Listing Type Badge */}
        {listingType && (
          <div className={`absolute top-4 left-4 rounded-full px-3 py-1.5 shadow-lg ${listingType === 'For Rent' ? 'bg-green-500' : 'bg-blue-500'}`}>
            <span className="text-xs font-bold text-white">{listingType}</span>
          </div>
        )}

        {/* Discount Badge */}
        {(() => {
          const rawDiscount = discountedPrice;
          const rawOriginal = originalPrice || price;
          const hasRawDiscount = rawDiscount !== undefined && rawDiscount !== null && String(rawDiscount).trim() !== '';
          const originalNum = isFinite(Number(rawOriginal)) ? Number(rawOriginal) : 0;
          const discountNum = hasRawDiscount && isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;
          const hasDiscount = hasRawDiscount && discountNum > 0 && originalNum > 0 && discountNum < originalNum;

          if (hasDiscount) {
            const discountPercent = Math.round(100 * (originalNum - discountNum) / originalNum);
            return (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full px-3 py-1.5 shadow-lg animate-pulse">
                <span className="text-xs font-bold text-white">-{discountPercent}% OFF</span>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Price Section - More Prominent */}
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const rawDiscount = discountedPrice;
            const rawOriginal = originalPrice || price;
            const hasRawDiscount = rawDiscount !== undefined && rawDiscount !== null && String(rawDiscount).trim() !== '';
            const originalNum = isFinite(Number(rawOriginal)) ? Number(rawOriginal) : 0;
            const discountNum = hasRawDiscount && isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;
            const hasDiscount = hasRawDiscount && discountNum > 0 && originalNum > 0 && discountNum < originalNum;

            if (hasDiscount) {
              return (
                <>
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {Number(originalNum).toLocaleString('en-US')} RWF
                  </span>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {Number(discountNum).toLocaleString('en-US')} RWF
                  </span>
                </>
              );
            }

            if (originalNum > 0) {
              return (
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {Number(originalNum).toLocaleString('en-US')} RWF
                </span>
              );
            }

            return (
              <span className="text-base font-semibold text-gray-500">Price on request</span>
            );
          })()}
          {listingType === "For Rent" && (
            <span className="text-sm text-green-600 font-medium">/month</span>
          )}
        </div>

        {/* Icon-Based Quick Stats */}
        {/* For Houses: Beds, Baths, Area OR Number of Doors for Commercial */}
        {(bedrooms !== undefined || bathrooms !== undefined || numberOfDoors !== undefined || (area !== undefined && !mileage && !landUse)) && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-3 border-t border-b border-gray-100">
            {category?.toLowerCase() === 'commercial property' ? (
              // Commercial Property: Show Number of Doors
              <>
                <div className="flex items-center gap-2 justify-center col-span-2">
                  <HomeIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">{numberOfDoors || 0} Doors</span>
                </div>
                {area !== undefined && (
                  <div className="flex items-center gap-2 justify-center">
                    <Maximize2 className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">{area} {areaUnit || 'sqm'}</span>
                  </div>
                )}
              </>
            ) : (
              // Residential: Show Bedrooms, Bathrooms, Area
              <>
                {bedrooms !== undefined && (
                  <div className="flex items-center gap-2 justify-center">
                    <Bed className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">{bedrooms}</span>
                  </div>
                )}
                {bathrooms !== undefined && (
                  <div className="flex items-center gap-2 justify-center">
                    <Bath className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">{bathrooms}</span>
                  </div>
                )}
                {area !== undefined && (
                  <div className="flex items-center gap-2 justify-center">
                    <Maximize2 className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">{area} {areaUnit || 'sqm'}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* For Cars: Mileage, Fuel, Transmission */}
        {(mileage !== undefined || fuelType || transmission) && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-3 border-t border-b border-gray-100">
            {mileage !== undefined && (
              <div className="flex items-center gap-2 justify-center">
                <Gauge className="w-5 h-5 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">{Number(mileage).toLocaleString()} km</span>
              </div>
            )}
            {fuelType && (
              <div className="flex items-center gap-2 justify-center">
                <Fuel className="w-5 h-5 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">{fuelType}</span>
              </div>
            )}
            {transmission && (
              <div className="flex items-center gap-2 justify-center">
                <Settings className="w-5 h-5 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">{transmission}</span>
              </div>
            )}
          </div>
        )}

        {/* For Plots: Area and Land Use */}
        {landUse && area !== undefined && !bedrooms && !mileage && (
          <div className="py-2 sm:py-3 border-t border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">{area} {areaUnit}</span>
              </div>
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{landUse}</span>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 pt-1 sm:pt-2">
          <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm text-gray-600 truncate group-hover:text-gray-800 transition-colors duration-300">
            {district && <span>{district}</span>}
            {district && sector && <span>, </span>}
            {sector && <span>{sector}</span>}
            {!district && !sector && <span>Location TBD</span>}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          {/* Details Button - Full Width */}
          <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs"
            title="View Details"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Details</span>
          </button>

          {/* Email, Share, WhatsApp - Same Row */}
          <div className="flex gap-2">
            {/* Email Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const subject = encodeURIComponent(`Inquiry about: ${title}`);
                const body = encodeURIComponent(`Hello,\n\nI am interested in the following listing:\n\nTitle: ${title}\nPrice: ${(discountedPrice || originalPrice || price || 0).toLocaleString('en-US')} RWF\nLocation: ${district || 'N/A'}${sector ? ', ' + sector : ''}\n\nPlease provide more information.\n\nThank you.`);
                window.location.href = `mailto:announcementsafricaltd@gmail.com?subject=${subject}&body=${body}`;
              }}
              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs"
              title="Send Email"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email</span>
            </button>

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const priceText = (() => {
                  const rawDiscount = discountedPrice;
                  const rawOriginal = originalPrice || price;
                  const hasRawDiscount = rawDiscount !== undefined && rawDiscount !== null && String(rawDiscount).trim() !== '';
                  const originalNum = isFinite(Number(rawOriginal)) ? Number(rawOriginal) : 0;
                  const discountNum = hasRawDiscount && isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;
                  const hasDiscount = hasRawDiscount && discountNum > 0 && originalNum > 0 && discountNum < originalNum;
                  if (hasDiscount) return `${Number(discountNum).toLocaleString('en-US')} RWF`;
                  return originalNum > 0 ? `${Number(originalNum).toLocaleString('en-US')} RWF` : 'Price on request';
                })();
                const categoryLower = category?.toLowerCase() || '';
                const categoryPath = categoryLower.includes('car') ? 'car' : categoryLower.includes('house') ? 'house' : categoryLower.includes('plot') ? 'plot' : 'job';
                const shareUrl = `${window.location.origin}/${categoryPath}/${id}`;
                const shareData = {
                  title: title,
                  text: `${title}\nPrice: ${priceText}\n\n${description || 'Check out this amazing ' + (category || 'item') + '!'}`,
                  url: shareUrl
                };
                // Add image if available
                if (currentSrc && currentSrc !== '') {
                  fetch(currentSrc)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], 'item.jpg', { type: 'image/jpeg' });
                      if (navigator.share) {
                        navigator.share({
                          ...shareData,
                          files: [file]
                        }).catch(() => {
                          if (navigator.share) {
                            navigator.share(shareData);
                          }
                        });
                      } else {
                        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                        alert('Content copied to clipboard!');
                      }
                    })
                    .catch(() => {
                      if (navigator.share) {
                        navigator.share(shareData);
                      } else {
                        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                        alert('Content copied to clipboard!');
                      }
                    });
                } else {
                  if (navigator.share) {
                    navigator.share(shareData);
                  } else {
                    navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
                    alert('Content copied to clipboard!');
                  }
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs"
              title="Share"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>

            {/* WhatsApp Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const message = encodeURIComponent(`Hello, I am interested in:\n\n${title}\nPrice: ${(discountedPrice || originalPrice || price || 0).toLocaleString('en-US')} RWF\nLocation: ${district || 'N/A'}${sector ? ', ' + sector : ''}\n\nPlease provide more details.`);
                const phoneNumber = '250788820543'; // Replace with actual WhatsApp number
                window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
              }}
              className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-xs"
              title="WhatsApp"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Animated Bottom Border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transform scale-x-0 transition-transform duration-500 group-hover:scale-x-100 origin-center"></div>
    </div>
  );
};

export default ItemCard;
