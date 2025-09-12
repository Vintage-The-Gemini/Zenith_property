import React from 'react';
import { Globe, Star, MapPin } from 'lucide-react';

const GoogleSearchPreview = ({ property, seo }) => {
  const generatePreviewUrl = () => {
    if (seo?.canonicalUrl) return seo.canonicalUrl;
    if (seo?.slug) return `https://www.palvoria.com/property/${seo.slug}`;
    return `https://www.palvoria.com/property/${property?._id}`;
  };

  const getMetaTitle = () => {
    return seo?.metaTitle || property?.title || 'Property for Sale/Rent';
  };

  const getMetaDescription = () => {
    if (seo?.metaDescription) return seo.metaDescription;
    
    const { propertyType, category, location, price, features } = property || {};
    const area = location?.area === 'Other' ? location?.customArea : location?.area;
    
    return `${features?.bedrooms || 'Multiple'} bedroom ${propertyType || 'property'} for ${category || 'sale'} in ${area || 'prime location'}, ${location?.city || 'Kenya'}. Contact us for viewing.`;
  };

  const generateStructuredData = () => {
    if (!property) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": getMetaTitle(),
      "description": getMetaDescription(),
      "url": generatePreviewUrl(),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": property.location?.address,
        "addressLocality": property.location?.area === 'Other' ? property.location?.customArea : property.location?.area,
        "addressRegion": property.location?.county,
        "addressCountry": "Kenya"
      },
      "geo": property.location?.coordinates ? {
        "@type": "GeoCoordinates",
        "latitude": property.location.coordinates.latitude,
        "longitude": property.location.coordinates.longitude
      } : null,
      "floorSize": property.features?.area ? {
        "@type": "QuantitativeValue",
        "value": property.features.area.size,
        "unitCode": property.features.area.unit?.toUpperCase()
      } : null,
      "numberOfRooms": property.features?.bedrooms,
      "numberOfBedrooms": property.features?.bedrooms,
      "numberOfBathroomsTotal": property.features?.bathrooms,
      "petsAllowed": false,
      "yearBuilt": property.yearBuilt,
      "offers": {
        "@type": "Offer",
        "price": property.price?.amount,
        "priceCurrency": property.price?.currency || "KES",
        "availability": property.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "validFrom": property.createdAt,
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": property.price?.amount,
          "priceCurrency": property.price?.currency || "KES",
          "unitCode": property.price?.period === 'month' ? "MON" : property.price?.period === 'year' ? "ANN" : null
        }
      },
      "image": property.images?.filter(img => img.url).map(img => img.url) || [],
      "datePosted": property.createdAt,
      "category": property.category === 'sale' ? 'https://schema.org/Product' : 'https://schema.org/RentAction'
    };

    // Clean up null values
    return JSON.stringify(structuredData, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Desktop Search Result Preview */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Google Search Result Preview
        </h4>
        
        <div className="bg-white border rounded-lg p-4 max-w-2xl">
          {/* URL Breadcrumb */}
          <div className="text-sm text-gray-600 mb-1">
            www.palvoria.com › property › {seo?.slug || 'property-details'}
          </div>
          
          {/* Title */}
          <div className="text-blue-600 text-xl hover:underline cursor-pointer leading-tight mb-1">
            {getMetaTitle()}
          </div>
          
          {/* URL */}
          <div className="text-green-700 text-sm mb-2">
            {generatePreviewUrl()}
          </div>
          
          {/* Description */}
          <div className="text-gray-700 text-sm leading-relaxed">
            {getMetaDescription()}
          </div>
          
          {/* Rich Snippets */}
          {property && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {property.price && (
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold text-green-600">
                    {property.price.currency} {property.price.amount?.toLocaleString()}
                  </span>
                  {property.price.period !== 'one-time' && (
                    <span className="ml-1">/{property.price.period}</span>
                  )}
                </div>
              )}
              
              {property.features?.bedrooms && (
                <div className="text-gray-600">
                  {property.features.bedrooms} bed
                </div>
              )}
              
              {property.features?.bathrooms && (
                <div className="text-gray-600">
                  {property.features.bathrooms} bath
                </div>
              )}
              
              {property.location?.area && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {property.location.area === 'Other' ? property.location.customArea : property.location.area}
                </div>
              )}
              
              <div className="flex items-center text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3" />
                <span className="ml-1 text-gray-600">4.2</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Result Preview */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">
          Mobile Search Result Preview
        </h4>
        
        <div className="bg-white border rounded-lg p-3 max-w-sm">
          <div className="text-blue-600 text-base hover:underline cursor-pointer leading-tight mb-1">
            {getMetaTitle().substring(0, 50)}...
          </div>
          
          <div className="text-green-600 text-xs mb-2">
            www.palvoria.com
          </div>
          
          <div className="text-gray-700 text-sm leading-relaxed">
            {getMetaDescription().substring(0, 120)}...
          </div>
          
          {property && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="text-green-600 font-semibold">
                {property.price?.currency} {property.price?.amount?.toLocaleString()}
              </div>
              <div className="text-gray-500">
                {property.features?.bedrooms}BR • {property.location?.area === 'Other' ? property.location?.customArea : property.location?.area}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Media Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook Preview */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Facebook Preview
          </h4>
          
          <div className="bg-white border rounded-lg overflow-hidden max-w-md">
            {property?.images?.[0]?.url && (
              <img 
                src={property.images[0].url} 
                alt="Property preview"
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-3">
              <div className="text-gray-500 text-xs uppercase mb-1">
                PALVORIA.COM
              </div>
              <div className="text-gray-900 font-medium text-sm leading-tight mb-1">
                {seo?.ogTitle || getMetaTitle()}
              </div>
              <div className="text-gray-600 text-xs">
                {seo?.ogDescription || getMetaDescription().substring(0, 100)}...
              </div>
            </div>
          </div>
        </div>

        {/* Twitter Preview */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Twitter Preview
          </h4>
          
          <div className="bg-white border rounded-lg overflow-hidden max-w-md">
            {property?.images?.[0]?.url && (
              <img 
                src={property.images[0].url} 
                alt="Property preview"
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-3">
              <div className="text-gray-900 font-medium text-sm leading-tight mb-1">
                {seo?.twitterTitle || getMetaTitle()}
              </div>
              <div className="text-gray-600 text-xs mb-2">
                {seo?.twitterDescription || getMetaDescription().substring(0, 100)}...
              </div>
              <div className="text-gray-500 text-xs flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                palvoria.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data Preview */}
      <div>
        <h4 className="text-lg font-medium text-gray-800 mb-3">
          Structured Data (JSON-LD)
        </h4>
        
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-auto max-h-60">
          <pre>{generateStructuredData()}</pre>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          This structured data helps Google understand your property listing and may show rich snippets in search results.
        </div>
      </div>
    </div>
  );
};

export default GoogleSearchPreview;