import { Link } from 'react-router-dom'
import { 
  MapPinIcon, 
  BuildingOffice2Icon, 
  HomeIcon 
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

const PropertyCard = ({ property, viewMode = 'grid' }) => {
  const {
    id,
    title,
    price,
    location,
    bedrooms,
    bathrooms,
    area,
    image,
    type,
    featured
  } = property

  // Property Schema Markup
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "RealEstate",
    "name": title,
    "description": `${bedrooms} bedroom property in ${location}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": location,
      "addressCountry": "KE"
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "KES"
    },
    "numberOfBedrooms": bedrooms,
    "numberOfBathroomsTotal": bathrooms,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": area
    },
    "image": image,
    "url": `https://www.palvoria.com/properties/${id}`
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(propertySchema)}
      </script>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="group h-[480px] w-full"
        style={{ 
          backgroundColor: 'rgb(252, 224, 177)',
          minHeight: '480px'
        }}
      >
        {/* Card Container - Clean Sharp Edges */}
        <div 
          className="h-full w-full overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: 'rgb(252, 224, 177)'
          }}
        >
          
          {/* Image Section - Fixed Height */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={image}
              alt={`${title} - ${bedrooms} bedroom property for ${price} in ${location}, Kenya. Professional property photos by Palvoria Properties.`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Type Badge */}
            <div className="absolute top-4 right-4">
              <span 
                className="px-3 py-1 text-xs font-semibold text-black"
                style={{
                  backgroundColor: 'rgb(252, 224, 177)'
                }}
              >
                {type}
              </span>
            </div>
          </div>
          
          {/* Content Section - Fixed Height with Flex Layout */}
          <div className="h-60 p-6 flex flex-col justify-between">
            <div className="flex-1">
              {/* Price - Fixed Height */}
              <div className="h-8 flex items-center mb-3">
                <div className="text-xl font-bold text-black">{price}</div>
              </div>
              
              {/* Title - Fixed Height with Overflow Handling */}
              <div className="h-12 mb-3">
                <h3 className="text-base font-semibold text-black leading-tight line-clamp-2">
                  {title}
                </h3>
              </div>
              
              {/* Location - Fixed Height */}
              <div className="h-5 flex items-center text-black mb-4">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="text-sm truncate">{location}</span>
              </div>
              
              {/* Property Features - Fixed Height */}
              <div className="h-5 flex items-center justify-center gap-4 text-sm text-black mb-6">
                {bedrooms > 0 && <span>{bedrooms} beds</span>}
                <span>{bathrooms} baths</span>
              </div>
            </div>
            
            {/* Button - Fixed at Bottom */}
            <div>
              <Link
                to={`/properties/${id}`}
                className="block w-full text-center py-3 px-4 font-semibold transition-all duration-300 uppercase tracking-widest text-sm"
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'black'
                }}
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default PropertyCard