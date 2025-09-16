import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FunnelIcon,
  Squares2X2Icon,
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


const filters = {
  type: ['All', 'Apartment', 'House', 'Villa', 'Townhouse', 'Commercial', 'Office', 'Shop', 'Land'],
  priceRange: ['All', 'Under KSH 10M', 'KSH 10M - 20M', 'KSH 20M - 30M', 'KSH 30M - 50M', 'Over KSH 50M'],
  bedrooms: ['All', '1+', '2+', '3+', '4+', '5+'],
  area: ['All', 'Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Kilimani', 'Upperhill', 'Runda', 'Muthaiga', 'CBD', 'Parklands', 'Hurlingham', 'South C', 'South B', 'Garden Estate', 'Kasarani', 'Other Areas'],
  offPlan: ['All', 'Ready to Move', 'Off-Plan Only']
}

export default function PropertiesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    priceRange: 'All',
    bedrooms: 'All',
    area: 'All',
    offPlan: 'All'
  })
  const [customArea, setCustomArea] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const areaParam = urlParams.get('area')

    if (areaParam && filters.area.includes(areaParam)) {
      setSelectedFilters(prev => ({
        ...prev,
        area: areaParam
      }))
    }
  }, [location.search])

  // Fetch properties from admin panel on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setError(null)
        
        // Fetch all properties from Palvoria's own database
        const response = await apiService.getProperties({})
        console.log('Fetched properties:', response)
        
        if (response.success && response.data) {
          console.log('Raw API response - total properties:', response.data.length)
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
            amenities: property.amenities || [],
            isOffPlan: property.isOffPlan || false
          }))

          console.log('Transformed properties:', transformedProperties.length)
          console.log('First few properties:', transformedProperties.slice(0, 3))
          setProperties(transformedProperties)
          setFilteredProperties(transformedProperties)
        } else {
          console.warn('API returned no data')
          setProperties([])
          setFilteredProperties([])
        }
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Failed to load properties')
        setProperties([])
        setFilteredProperties([])
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

    // Filter by off-plan status
    if (selectedFilters.offPlan !== 'All') {
      if (selectedFilters.offPlan === 'Off-Plan Only') {
        filtered = filtered.filter(property => property.isOffPlan === true)
      } else if (selectedFilters.offPlan === 'Ready to Move') {
        filtered = filtered.filter(property => property.isOffPlan === false)
      }
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

    console.log('Filtering results:', {
      originalCount: properties.length,
      filteredCount: filtered.length,
      filters: selectedFilters,
      searchQuery
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

      {/* Compact Header */}
      <section className="pt-20 lg:pt-24 pb-8" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 vogue-heading leading-none">
              NAIROBI PROPERTIES
            </h1>
            <div className="flex items-center justify-center gap-8 text-sm text-black/70 font-light">
              <span>{properties.length} Available</span>
              <div className="w-px h-4 bg-black/20"></div>
              <span>{filteredProperties.length} Matches</span>
            </div>
          </div>
        </div>
      </section>

      {/* Elegant Filters Section */}
      <section className="pb-12" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Desktop Filters - Elegant Card Layout */}
          <motion.div
            className="hidden lg:block mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-black p-8 shadow-2xl">
              {/* Search Bar - Full Width */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search properties by name, location, or type..."
                    className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-sm border border-amber-400/30 focus:border-amber-400 focus:outline-none text-white placeholder-white/60 font-light text-lg transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
                {/* Area Filter Card */}
                <div className="group">
                  <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Location</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                      value={selectedFilters.area}
                      onChange={(e) => handleFilterChange('area', e.target.value)}
                    >
                      <option value="All" className="text-black">All Areas</option>
                      {filters.area.slice(1).map(area => (
                        <option key={area} value={area} className="text-black">{area}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Type Filter Card */}
                <div className="group">
                  <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Property Type</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                      value={selectedFilters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      {filters.type.map(type => (
                        <option key={type} value={type} className="text-black">{type === 'All' ? 'All Types' : type}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Price Filter Card */}
                <div className="group">
                  <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Price Range</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                      value={selectedFilters.priceRange}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    >
                      {filters.priceRange.map(range => (
                        <option key={range} value={range} className="text-black">{range === 'All' ? 'Any Price' : range}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Bedrooms Filter Card */}
                <div className="group">
                  <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Bedrooms</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                      value={selectedFilters.bedrooms}
                      onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    >
                      {filters.bedrooms.map(bedroom => (
                        <option key={bedroom} value={bedroom} className="text-black">{bedroom === 'All' ? 'Any Beds' : bedroom}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </div>
                </div>

                {/* Off-plan Filter Card */}
                <div className="group">
                  <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Availability</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                      value={selectedFilters.offPlan}
                      onChange={(e) => handleFilterChange('offPlan', e.target.value)}
                    >
                      {filters.offPlan.map(option => (
                        <option key={option} value={option} className="text-black">{option}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Sort and Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/20">
                <div className="flex items-center gap-6">
                  <div>
                    <label className="block text-amber-400 text-sm font-semibold mb-2 uppercase tracking-wider">Sort By</label>
                    <div className="relative">
                      <select
                        className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300 hover:bg-white/20"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="featured" className="text-black">Featured First</option>
                        <option value="price-low" className="text-black">Price: Low to High</option>
                        <option value="price-high" className="text-black">Price: High to Low</option>
                        <option value="bedrooms" className="text-black">Most Bedrooms</option>
                        <option value="area" className="text-black">By Location</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Properties Count and Clear Filters */}
                <div className="flex items-center justify-between w-full">
                  <div className="text-white/80 font-light">
                    <span className="text-amber-400 font-semibold">{filteredProperties.length}</span> properties found
                  </div>

                  {(Object.values(selectedFilters).some(val => val !== 'All') || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All', offPlan: 'All' })
                        setCustomArea('')
                        setSearchQuery('')
                      }}
                      className="px-4 py-2 bg-amber-400 text-black font-semibold hover:bg-amber-500 transition-all duration-300"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Filters */}
          <div className="lg:hidden mb-8">
            {/* Mobile Search Bar - Always Visible */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-12 pr-6 py-4 bg-black text-white border border-amber-400/30 focus:border-amber-400 focus:outline-none placeholder-white/60 font-light transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-3 bg-black px-6 py-3 hover:bg-gray-800 transition-all duration-300"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold tracking-wider uppercase text-white">
                  Filters ({Object.values(selectedFilters).filter(val => val !== 'All').length})
                </span>
              </button>

              <div className="text-white/80 font-light text-sm">
                <span className="text-amber-400 font-semibold">{filteredProperties.length}</span> found
              </div>
            </div>

            {/* Clear All Button - Mobile */}
            {(Object.values(selectedFilters).some(val => val !== 'All') || searchQuery) && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All', offPlan: 'All' })
                    setCustomArea('')
                    setSearchQuery('')
                  }}
                  className="w-full py-3 bg-amber-400 text-black font-semibold hover:bg-amber-500 transition-all duration-300"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black p-6 shadow-2xl"
                >
                  <div className="space-y-6">
                    {/* Location */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Location</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={selectedFilters.area}
                          onChange={(e) => handleFilterChange('area', e.target.value)}
                        >
                          <option value="All" className="text-black">All Areas</option>
                          {filters.area.slice(1).map(area => (
                            <option key={area} value={area} className="text-black">{area}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Property Type</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={selectedFilters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                          {filters.type.map(type => (
                            <option key={type} value={type} className="text-black">{type === 'All' ? 'All Types' : type}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Price Range</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={selectedFilters.priceRange}
                          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                        >
                          {filters.priceRange.map(range => (
                            <option key={range} value={range} className="text-black">{range === 'All' ? 'Any Price' : range}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Bedrooms */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Bedrooms</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={selectedFilters.bedrooms}
                          onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                        >
                          {filters.bedrooms.map(bedroom => (
                            <option key={bedroom} value={bedroom} className="text-black">{bedroom === 'All' ? 'Any Beds' : bedroom}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Availability</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={selectedFilters.offPlan}
                          onChange={(e) => handleFilterChange('offPlan', e.target.value)}
                        >
                          {filters.offPlan.map(option => (
                            <option key={option} value={option} className="text-black">{option}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-amber-400 text-sm font-semibold mb-3 uppercase tracking-wider">Sort By</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 focus:border-amber-400 focus:outline-none text-white font-light appearance-none transition-all duration-300"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="featured" className="text-black">Featured First</option>
                          <option value="price-low" className="text-black">Price: Low to High</option>
                          <option value="price-high" className="text-black">Price: High to Low</option>
                          <option value="bedrooms" className="text-black">Most Bedrooms</option>
                          <option value="area" className="text-black">By Location</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-20 left-8 w-1 h-24 bg-black/10"></div>
        <div className="absolute bottom-20 right-8 w-24 h-1 bg-black/10"></div>
      </section>

      {/* Properties Grid/List */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">


        {/* Properties Display */}
        {error ? (
          <motion.div
            className="text-center py-32"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/20 backdrop-blur-sm p-12 max-w-2xl mx-auto"
                 style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)' }}>
              <div className="border-l-4 border-black pl-6">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-black text-2xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-6 vogue-heading">Connection Issue</h3>
                <p className="text-black/70 font-light mb-8 leading-relaxed">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-black text-white px-8 py-3 font-medium tracking-wider uppercase hover:bg-black/90 transition-all duration-300"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </motion.div>
        ) : filteredProperties.length === 0 ? (
          <motion.div
            className="text-center py-32"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/20 backdrop-blur-sm p-12 max-w-2xl mx-auto"
                 style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)' }}>
              <div className="border-l-4 border-black pl-6">
                <div className="w-20 h-20 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <FunnelIcon className="w-10 h-10 text-black/60" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-6 vogue-heading">No Matches Found</h3>
                <p className="text-black/70 font-light mb-8 leading-relaxed max-w-md mx-auto">
                  We couldn't find any properties matching your refined criteria.
                  Perhaps expand your search parameters to discover more opportunities.
                </p>
                <button
                  onClick={() => {
                    setSelectedFilters({ type: 'All', priceRange: 'All', bedrooms: 'All', area: 'All' })
                    setCustomArea('')
                    setSearchQuery('')
                  }}
                  className="bg-black text-white px-8 py-3 font-medium tracking-wider uppercase hover:bg-black/90 transition-all duration-300"
                >
                  Show All Properties
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
          >
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-700 overflow-hidden"
                     style={{
                       clipPath: index % 3 === 0 ? 'polygon(0 0, 90% 0, 100% 100%, 0 100%)' :
                                index % 3 === 1 ? 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' :
                                'polygon(5% 0, 95% 0, 100% 100%, 0 100%)'
                     }}>
                  <PropertyCard property={property} viewMode="grid" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Call to Action Section */}
      {filteredProperties.length > 0 && (
        <section className="py-32 relative overflow-hidden" style={{ backgroundColor: 'rgb(252, 224, 177)' }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block border-l-4 border-black pl-6 mb-8">
                <span className="text-sm font-light tracking-[0.3em] text-black/70 uppercase">Found What You Need?</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-black mb-8 vogue-heading leading-none">
                SCHEDULE A
                <br />
                <span className="italic font-light text-3xl md:text-5xl">Private Viewing</span>
              </h2>
              <p className="text-lg text-black/80 max-w-2xl mx-auto leading-relaxed font-light mb-12">
                Experience these exceptional properties in person. Our team will arrange exclusive viewings
                at your convenience.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-black text-white px-12 py-4 font-medium tracking-wider uppercase hover:bg-black/90 transition-all duration-300">
                  Contact Our Team
                </button>
                <button className="border-2 border-black text-black px-12 py-4 font-medium tracking-wider uppercase hover:bg-black hover:text-white transition-all duration-300">
                  Schedule Viewing
                </button>
              </div>
            </motion.div>
          </div>

          {/* Background Art */}
          <div className="absolute top-32 right-16 w-32 h-32 border-4 border-black/5 rotate-12"></div>
          <div className="absolute bottom-32 left-16 w-2 h-40 bg-black/5 rotate-45"></div>
        </section>
      )}

      <Footer />
    </div>
  )
}