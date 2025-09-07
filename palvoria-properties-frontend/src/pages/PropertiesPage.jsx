import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'

const mockProperties = [
  {
    id: 1,
    title: 'Modern Westlands Apartment',
    price: 'KSH 45M',
    location: 'Westlands, Nairobi',
    bedrooms: 2,
    bathrooms: 2,
    area: '1,200 sq ft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    type: 'Apartment',
    featured: true
  },
  {
    id: 2,
    title: 'Luxury Karen Villa',
    price: 'KSH 85M',
    location: 'Karen, Nairobi',
    bedrooms: 4,
    bathrooms: 3,
    area: '2,800 sq ft',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80',
    type: 'House',
    featured: false
  },
  {
    id: 3,
    title: 'CBD Office Space',
    price: 'KSH 65M',
    location: 'CBD, Nairobi',
    bedrooms: 0,
    bathrooms: 2,
    area: '1,800 sq ft',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    type: 'Commercial',
    featured: false
  },
  {
    id: 4,
    title: 'Cozy Kileleshwa Studio',
    price: 'KSH 28.5M',
    location: 'Kileleshwa, Nairobi',
    bedrooms: 1,
    bathrooms: 1,
    area: '650 sq ft',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    type: 'Apartment',
    featured: false
  },
  {
    id: 5,
    title: 'Runda Family Home',
    price: 'KSH 72M',
    location: 'Runda, Nairobi',
    bedrooms: 5,
    bathrooms: 3,
    area: '3,200 sq ft',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=2065&q=80',
    type: 'House',
    featured: false
  },
  {
    id: 6,
    title: 'Modern Mombasa Loft',
    price: 'KSH 53.5M',
    location: 'Nyali, Mombasa',
    bedrooms: 2,
    bathrooms: 2,
    area: '1,450 sq ft',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2080&q=80',
    type: 'Loft',
    featured: false
  }
]

const filters = {
  type: ['All', 'Apartment', 'House', 'Commercial', 'Loft'],
  priceRange: ['All', 'Under KSH 30M', 'KSH 30M - 50M', 'KSH 50M - 70M', 'Over KSH 70M'],
  bedrooms: ['All', '1+', '2+', '3+', '4+', '5+']
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState(mockProperties)
  const [filteredProperties, setFilteredProperties] = useState(mockProperties)
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    priceRange: 'All',
    bedrooms: 'All'
  })
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let filtered = properties

    // Filter by type
    if (selectedFilters.type !== 'All') {
      filtered = filtered.filter(property => property.type === selectedFilters.type)
    }

    // Filter by price range
    if (selectedFilters.priceRange !== 'All') {
      filtered = filtered.filter(property => {
        const price = parseFloat(property.price.replace(/[KSH\s,]/g, ''))
        switch (selectedFilters.priceRange) {
          case 'Under KSH 30M': return price < 30
          case 'KSH 30M - 50M': return price >= 30 && price <= 50
          case 'KSH 50M - 70M': return price >= 50 && price <= 70
          case 'Over KSH 70M': return price > 70
          default: return true
        }
      })
    }

    // Filter by bedrooms
    if (selectedFilters.bedrooms !== 'All') {
      const minBedrooms = parseInt(selectedFilters.bedrooms.replace('+', ''))
      filtered = filtered.filter(property => property.bedrooms >= minBedrooms)
    }

    setFilteredProperties(filtered)
  }, [selectedFilters, properties])

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  return (
    <div className="bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Find Your Perfect Property in Kenya
            </h1>
            <p className="mt-4 text-xl text-primary-100">
              Browse our extensive collection of premium properties across Kenya
            </p>
            <div className="mt-6 text-primary-100">
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters and View Controls */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
              </button>
              
              {/* Quick Filters */}
              <div className="hidden md:flex items-center gap-2">
                {Object.entries(selectedFilters).map(([key, value]) => 
                  value !== 'All' && (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {value}
                      <button
                        onClick={() => handleFilterChange(key, 'All')}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(filters).map(([filterType, options]) => (
                  <div key={filterType}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {filterType === 'priceRange' ? 'Price Range' : filterType}
                    </label>
                    <select
                      value={selectedFilters[filterType]}
                      onChange={(e) => handleFilterChange(filterType, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Properties Grid */}
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                : 'space-y-6'
              }
            >
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={viewMode === 'list' ? 'w-full' : ''}
                >
                  <PropertyCard 
                    property={property} 
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}