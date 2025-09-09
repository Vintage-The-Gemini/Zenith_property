import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'
import Breadcrumb from '../components/Breadcrumb'

const mockProperties = [
  {
    id: 1,
    title: 'Modern Westlands Apartment',
    price: 'KSH 12,500,000',
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
    price: 'KSH 35,000,000',
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
    price: 'KSH 18,000,000',
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
    price: 'KSH 8,500,000',
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
    price: 'KSH 25,000,000',
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
    price: 'KSH 16,500,000',
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
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <Header />
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ name: 'Properties' }]} />
      
      {/* Hero Section */}
      <section className="relative pt-16 lg:pt-20 pb-32 overflow-hidden min-h-screen" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-10 parallax"
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
            alt="Nairobi architecture"
            style={{ transform: 'scale(1.05)' }}
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
          <div className="pt-20 lg:pt-32 text-center">
            <motion.h1 
              className="text-6xl md:text-8xl lg:text-9xl xl:text-[12rem] font-bold text-black mb-8 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
            >
              NAIROBI
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-16 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              COLLECTION
            </motion.h2>
            
            <motion.div
              className="max-w-4xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-lg md:text-xl lg:text-2xl text-black leading-relaxed" style={{ fontWeight: '300' }}>
                Curated properties across Nairobi's most prestigious neighborhoods — each selected for the discerning few who demand nothing but excellence.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-center gap-12 mb-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{properties.length}</div>
                <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Nairobi Gems</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-black mb-2 vogue-heading">{filteredProperties.length}</div>
                <div className="text-sm text-black uppercase tracking-widest" style={{ fontWeight: '300' }}>Perfect Matches</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filters and View Controls */}
      <section style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Left side - Filter button and active filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest"
              >
                <FunnelIcon className="h-4 w-4" />
                Filter Collection
              </button>

              {/* Active Filters */}
              {Object.entries(selectedFilters).map(([key, value]) => 
                value !== 'All' && (
                  <span
                    key={key}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    {value}
                    <button
                      onClick={() => handleFilterChange(key, 'All')}
                      className="ml-2 text-amber-600 hover:text-amber-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>

            {/* Right side - Sort and view options */}
            <div className="flex items-center gap-4">
              <select className="px-6 py-3 bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest">
                <option>Sort: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
              
              <div className="flex items-center bg-black">
                <button className="p-3 text-white hover:bg-gray-800 transition-all duration-300">
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button className="p-3 text-white hover:bg-gray-800 transition-all duration-300">
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-6 bg-stone-50 rounded-xl border border-stone-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(filters).map(([filterType, options]) => (
                  <div key={filterType}>
                    <label className="block text-sm font-semibold text-stone-700 mb-3 capitalize">
                      {filterType === 'priceRange' ? 'Price Range' : filterType}
                    </label>
                    <select
                      value={selectedFilters[filterType]}
                      onChange={(e) => handleFilterChange(filterType, e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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
      <main className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FunnelIcon className="w-12 h-12 text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-stone-900">Oops! No matches in Nairobi 😢</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">Seems like your dream specs are a bit too specific for our current Nairobi collection. Let's try broadening the search!</p>
              <button 
                onClick={() => setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All' })}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
Show Me Everything! 🎉
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {filteredProperties.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-white text-stone-700 px-8 py-4 rounded-lg font-medium border-2 border-stone-300 hover:border-amber-500 hover:text-amber-600 transition-all">
More Nairobi Gems! 💎
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}