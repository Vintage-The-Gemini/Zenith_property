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
    "url": `https://palvoriaproperties.co.ke/properties/${id}`
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(propertySchema)}
      </script>
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
      style={{ backgroundColor: '#FFEAD4' }}
    >
      
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={`${title} - ${bedrooms} bedroom property for ${price} in ${location}, Kenya. Professional property photos by Palvoria Properties.`}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 text-gray-700 px-2 py-1 rounded text-xs font-medium">
            {type}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-2">
          <div className="text-2xl font-bold text-amber-600 mb-2">{price}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center text-gray-600 mb-4">
          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          {bedrooms > 0 && <span>{bedrooms} beds</span>}
          <span>{bathrooms} baths</span>
          <span>{area}</span>
        </div>
        
        <Link
          to={`/properties/${id}`}
          className="w-full bg-black hover:bg-gray-800 text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          style={{ color: '#D4721A' }}
        >
          View Details
        </Link>
      </div>
    </motion.div>
    </>
  )
}

export default PropertyCard