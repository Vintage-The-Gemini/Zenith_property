import { Link } from 'react-router-dom'
import { 
  MapPinIcon, 
  BuildingOffice2Icon, 
  HomeIcon,
  CurrencyDollarIcon 
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

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ x: 5 }}
        className="property-card group flex flex-col md:flex-row"
      >
        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center rounded-full bg-accent-500 px-3 py-1 text-sm font-medium text-white">
              Featured
            </span>
          </div>
        )}
        
        <div className="relative overflow-hidden md:w-80 flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="h-64 md:h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              type === 'Apartment' ? 'bg-blue-100 text-blue-800' :
              type === 'House' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {type === 'Apartment' ? (
                <BuildingOffice2Icon className="h-3 w-3 mr-1" />
              ) : type === 'House' ? (
                <HomeIcon className="h-3 w-3 mr-1" />
              ) : (
                <BuildingOffice2Icon className="h-3 w-3 mr-1" />
              )}
              {type}
            </span>
            <div className="flex items-center text-primary-600 font-bold text-2xl">
              <CurrencyDollarIcon className="h-6 w-6 mr-1" />
              {price.replace('$', '')}
            </div>
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center text-gray-600 mb-4">
            <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-base">{location}</span>
          </div>
          
          <div className="flex items-center gap-6 text-gray-500 mb-6">
            {bedrooms > 0 && (
              <div className="flex items-center">
                <span className="font-medium text-lg">{bedrooms}</span>
                <span className="ml-1">bed{bedrooms > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="font-medium text-lg">{bathrooms}</span>
              <span className="ml-1">bath{bathrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-lg">{area}</span>
            </div>
          </div>
          
          <Link
            to={`/properties/${id}`}
            className="btn-primary inline-block px-6 py-3"
          >
            View Details
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="property-card group"
    >
      {featured && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center rounded-full bg-accent-500 px-3 py-1 text-sm font-medium text-white">
            Featured
          </span>
        </div>
      )}
      
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            type === 'Apartment' ? 'bg-blue-100 text-blue-800' :
            type === 'House' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {type === 'Apartment' ? (
              <BuildingOffice2Icon className="h-3 w-3 mr-1" />
            ) : type === 'House' ? (
              <HomeIcon className="h-3 w-3 mr-1" />
            ) : (
              <BuildingOffice2Icon className="h-3 w-3 mr-1" />
            )}
            {type}
          </span>
          <div className="flex items-center text-primary-600 font-bold text-xl">
            <CurrencyDollarIcon className="h-5 w-5 mr-1" />
            {price.replace('$', '')}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center text-gray-600 mb-4">
          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm truncate">{location}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          {bedrooms > 0 && (
            <div className="flex items-center">
              <span className="font-medium">{bedrooms}</span>
              <span className="ml-1">bed{bedrooms > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center">
            <span className="font-medium">{bathrooms}</span>
            <span className="ml-1">bath{bathrooms > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{area}</span>
          </div>
        </div>
        
        <Link
          to={`/properties/${id}`}
          className="w-full btn-primary text-center block"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}

export default PropertyCard