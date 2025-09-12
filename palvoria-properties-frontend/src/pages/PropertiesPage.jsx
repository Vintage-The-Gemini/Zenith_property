import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PropertyCard from '../components/PropertyCard'
import SEOHead from '../components/SEOHead'
import EnhancedLocationFilter from '../components/EnhancedLocationFilter'
import apiService from '../services/api'

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
  },
  {
    id: 7,
    title: 'Elegant Loresho Villa',
    price: 'KSH 42,000,000',
    location: 'Loresho, Nairobi',
    bedrooms: 5,
    bathrooms: 4,
    area: '3,500 sq ft',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80',
    type: 'House',
    featured: true
  }
]

const filters = {
  type: ['All', 'Apartment', 'House', 'Villa', 'Townhouse', 'Commercial', 'Office', 'Shop', 'Land'],
  priceRange: ['All', 'Under KSH 10M', 'KSH 10M - 20M', 'KSH 20M - 30M', 'KSH 30M - 50M', 'Over KSH 50M'],
  bedrooms: ['All', '1+', '2+', '3+', '4+', '5+'],
  area: ['All', 'Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Kilimani', 'Upperhill', 'Runda', 'Muthaiga', 'CBD', 'Parklands', 'Hurlingham', 'South C', 'South B', 'Garden Estate', 'Kasarani', 'Other Areas']
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    priceRange: 'All',
    bedrooms: 'All',
    area: 'All'
  })
  const [customArea, setCustomArea] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch properties from admin panel on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch from Palvoria's own database
        const response = await apiService.getProperties({ status: 'active' })
        console.log('Fetched properties:', response)
        
        if (response.success && response.data) {
          // Transform Palvoria backend data to match frontend format
          const transformedProperties = response.data.map(property => ({
            id: property._id,
            title: property.title,
            price: `KSH ${property.price?.amount?.toLocaleString() || 'Price on Request'}`,
            priceAmount: property.price?.amount || 0, // For filtering
            location: `${property.location?.area || property.location?.city || ''}, ${property.location?.county || 'Kenya'}`,
            locationArea: property.location?.area || property.location?.customArea || 'Other Areas',
            bedrooms: property.features?.bedrooms || 0,
            bathrooms: property.features?.bathrooms || 0,
            area: property.features?.area ? `${property.features.area.size} ${property.features.area.unit}` : 'N/A',
            image: property.images && property.images.length > 0 ? 
              (property.images.find(img => img.isPrimary) || property.images[0]).url : 
              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            type: property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1) || 'Property',
            featured: property.featured || false,
            description: property.description,
            amenities: property.amenities || []
          }))
          
          setProperties(transformedProperties)
          setFilteredProperties(transformedProperties)
        } else {
          // Fallback to mock data if API fails
          console.warn('API returned no data, using mock data')
          setProperties(mockProperties)
          setFilteredProperties(mockProperties)
        }
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Failed to load properties')
        // Fallback to mock data
        setProperties(mockProperties)
        setFilteredProperties(mockProperties)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    let filtered = properties

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        property.type.toLowerCase().includes(query)
      )
    }

    // Filter by type
    if (selectedFilters.type !== 'All') {
      filtered = filtered.filter(property => property.type === selectedFilters.type)
    }

    // Filter by area
    if (selectedFilters.area !== 'All') {
      filtered = filtered.filter(property => {
        if (selectedFilters.area === 'Other Areas') {
          // Show properties that don't match any of the predefined areas
          const predefinedAreas = ['Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Kilimani', 'Upperhill', 'Runda', 'Muthaiga', 'CBD', 'Parklands', 'Hurlingham', 'South C', 'South B', 'Garden Estate', 'Kasarani', 'Loresho', 'Spring Valley', 'Gigiri', 'Ridgeways', 'Riverside', 'Woodley', 'Nairobi West', 'Donholm', 'Pipeline', 'Embakasi', 'Kahawa', 'Thome', 'Zimmerman', 'Roysambu', 'Mwiki']
          return !predefinedAreas.includes(property.locationArea)
        }
        // Handle custom area search with partial matching
        const searchArea = selectedFilters.area.toLowerCase()
        const propertyLocation = property.location.toLowerCase()
        const propertyArea = (property.locationArea || '').toLowerCase()
        
        return propertyArea === searchArea || 
               propertyArea.includes(searchArea) ||
               propertyLocation.includes(searchArea)
      })
    }

    // Filter by price range
    if (selectedFilters.priceRange !== 'All') {
      filtered = filtered.filter(property => {
        const price = property.priceAmount
        switch (selectedFilters.priceRange) {
          case 'Under KSH 10M': return price < 10000000
          case 'KSH 10M - 20M': return price >= 10000000 && price <= 20000000
          case 'KSH 20M - 30M': return price >= 20000000 && price <= 30000000
          case 'KSH 30M - 50M': return price >= 30000000 && price <= 50000000
          case 'Over KSH 50M': return price > 50000000
          default: return true
        }
      })
    }

    // Filter by bedrooms
    if (selectedFilters.bedrooms !== 'All') {
      const minBedrooms = parseInt(selectedFilters.bedrooms.replace('+', ''))
      filtered = filtered.filter(property => property.bedrooms >= minBedrooms)
    }

    // Sort properties
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.priceAmount || 0) - (b.priceAmount || 0)
        case 'price-high':
          return (b.priceAmount || 0) - (a.priceAmount || 0)
        case 'bedrooms':
          return (b.bedrooms || 0) - (a.bedrooms || 0)
        case 'area':
          return a.location.localeCompare(b.location)
        case 'featured':
        default:
          return b.featured ? 1 : -1
      }
    })

    setFilteredProperties(filtered)
  }, [selectedFilters, properties, searchQuery, sortBy])

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleAreaChange = (area) => {
    setSelectedFilters(prev => ({
      ...prev,
      area: area
    }))
  }

  const handleCustomAreaChange = (customAreaValue) => {
    setCustomArea(customAreaValue)
  }

  return (
    <div style={{ backgroundColor: 'rgb(252, 224, 177)', minHeight: '100vh' }}>
      <SEOHead 
        customTitle="Properties for Sale & Rent in Nairobi | Palvoria Properties"
        customDescription="Browse premium properties for sale and rent in Nairobi. Find your perfect home in Westlands, Karen, Kilimani, CBD and other prime locations across Kenya."
        customKeywords={['properties for sale nairobi', 'apartments for rent', 'houses for sale kenya', 'nairobi real estate', 'westlands properties', 'karen properties', 'kilimani apartments']}
        pageType="listings"
      />
      <Header />
      
      {/* Hero Section - NAIROBI COLLECTION */}
      <section className="relative pt-16 lg:pt-20 pb-16 overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
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
          <div className="pt-16 lg:pt-24 text-center">
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-black mb-6 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
            >
              NAIROBI
            </motion.h1>
            <motion.h2 
              className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-12 vogue-heading leading-none"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              COLLECTION
            </motion.h2>
            
            <motion.div
              className="max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-lg md:text-xl lg:text-2xl text-black leading-relaxed" style={{ fontWeight: '300' }}>
                Curated properties across Nairobi's most prestigious neighborhoods — each selected for the discerning few who demand nothing but excellence.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-center gap-12 mb-12"
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

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        
        {/* Filters and Controls Bar - Compact */}
        <div className="bg-black shadow-xl border-2 border-amber-600 mb-8">
          <div className="p-4">
            
            {/* Mobile-First Compact Controls */}
            <div className="space-y-4">
              
              {/* Mobile: Filter Toggle + Clear All */}
              <div className="flex items-center justify-between lg:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border-2 border-amber-600 text-sm font-medium text-amber-600 hover:bg-amber-600 hover:text-black transition-colors"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                  Filters ({Object.values(selectedFilters).filter(val => val !== 'All').length})
                </button>
                
                {(Object.values(selectedFilters).some(val => val !== 'All') || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All' })
                      setCustomArea('')
                      setSearchQuery('')
                    }}
                    className="text-sm text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Mobile: Search Bar (Full Width) */}
              <div className="lg:hidden">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    className="w-full pl-10 pr-4 py-3 text-sm border-2 border-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-black font-medium"
                    style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Mobile: Sort + View Toggle */}
              <div className="flex items-center justify-between lg:hidden">
                <select 
                  className="flex-1 px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mr-3"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="bedrooms">Most Bedrooms</option>
                  <option value="area">By Location</option>
                </select>
                
                <div className="flex items-center border-2 border-amber-600">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-black' : 'text-amber-600 hover:bg-amber-600 hover:text-black'}`}
                    style={{ backgroundColor: viewMode === 'grid' ? '#D97706' : 'rgb(252, 224, 177)' }}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-l-2 border-amber-600 transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-black' : 'text-amber-600 hover:bg-amber-600 hover:text-black'}`}
                    style={{ backgroundColor: viewMode === 'list' ? '#D97706' : 'rgb(252, 224, 177)' }}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Desktop: All in one row */}
              <div className="hidden lg:flex lg:items-center lg:justify-between">
                
                {/* Left: Active Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedFilters).map(([key, value]) => 
                      value !== 'All' && (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-600 text-black"
                        >
                          {value}
                          <button
                            onClick={() => handleFilterChange(key, 'All')}
                            className="ml-1 text-black hover:text-white"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    )}
                    {(Object.values(selectedFilters).some(val => val !== 'All') || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All' })
                          setCustomArea('')
                          setSearchQuery('')
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Search + Sort + View Toggle */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      className="pl-10 pr-4 py-2 text-sm border-2 border-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-black font-medium w-48"
                      style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    className="px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="bedrooms">Most Bedrooms</option>
                    <option value="area">By Location</option>
                  </select>
                  
                  <div className="flex items-center border-2 border-amber-600">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-black' : 'text-amber-600 hover:bg-amber-600 hover:text-black'}`}
                      style={{ backgroundColor: viewMode === 'grid' ? '#D97706' : 'rgb(252, 224, 177)' }}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 border-l-2 border-amber-600 transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-black' : 'text-amber-600 hover:bg-amber-600 hover:text-black'}`}
                      style={{ backgroundColor: viewMode === 'list' ? '#D97706' : 'rgb(252, 224, 177)' }}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Filter Bar */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-3">
              {/* Location Filter */}
              <div className="relative">
                <select 
                  className="w-full px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={selectedFilters.area}
                  onChange={(e) => handleFilterChange('area', e.target.value)}
                >
                  <option value="All">All Areas</option>
                  {filters.area.slice(1).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
              </div>

              {/* Property Type Filter */}
              <div className="relative">
                <select 
                  className="w-full px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={selectedFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  {filters.type.map(type => (
                    <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
              </div>

              {/* Price Range Filter */}
              <div className="relative">
                <select 
                  className="w-full px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={selectedFilters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  {filters.priceRange.map(range => (
                    <option key={range} value={range}>{range === 'All' ? 'Any Price' : range}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
              </div>

              {/* Bedrooms Filter */}
              <div className="relative">
                <select 
                  className="w-full px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none"
                  style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                  value={selectedFilters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                >
                  {filters.bedrooms.map(bedroom => (
                    <option key={bedroom} value={bedroom}>{bedroom === 'All' ? 'Any Beds' : bedroom}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
              </div>
            </div>

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="sm:hidden mt-4 pt-4 border-t-2 border-amber-600"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(filters).map(([filterType, options]) => (
                      <div key={filterType}>
                        <label className="block text-sm font-medium text-amber-400 mb-2 capitalize">
                          {filterType === 'priceRange' ? 'Price Range' : filterType}
                        </label>
                        <select 
                          className="w-full px-3 py-2 border-2 border-amber-600 text-sm font-medium text-black focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          style={{ backgroundColor: 'rgb(252, 224, 177)' }}
                          value={selectedFilters[filterType]}
                          onChange={(e) => handleFilterChange(filterType, e.target.value)}
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
            </AnimatePresence>
          </div>
        </div>

        {/* Properties Grid/List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Loading Properties...</h3>
            <p className="text-gray-600">Finding the perfect matches for you</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Error Loading Properties</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FunnelIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">No Properties Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any properties matching your criteria. Try adjusting your filters.
            </p>
            <button 
              onClick={() => {
                setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All' })
                setCustomArea('')
                setSearchQuery('')
              }}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Show All Properties
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
              : "space-y-6"
          }>
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PropertyCard property={property} viewMode={viewMode} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}