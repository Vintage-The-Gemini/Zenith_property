import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  HomeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const propertyTypes = [
  { value: 'any', label: 'Any Type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
]

const priceRanges = [
  { value: 'any', label: 'Any Price' },
  { value: '0-200000', label: 'Under $200k' },
  { value: '200000-400000', label: '$200k - $400k' },
  { value: '400000-600000', label: '$400k - $600k' },
  { value: '600000-800000', label: '$600k - $800k' },
  { value: '800000+', label: '$800k+' },
]

const SearchForm = ({ compact = false }) => {
  const [searchData, setSearchData] = useState({
    location: '',
    propertyType: 'any',
    priceRange: 'any',
    bedrooms: '',
    requirements: ''
  })
  const [isAiSearch, setIsAiSearch] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    
    if (!searchData.location && !searchData.requirements) {
      toast.error('Please enter a location or describe your requirements')
      return
    }

    // Navigate to search page with query parameters
    const searchParams = new URLSearchParams()
    Object.entries(searchData).forEach(([key, value]) => {
      if (value && value !== 'any') {
        searchParams.set(key, value)
      }
    })
    
    if (isAiSearch) {
      searchParams.set('ai', 'true')
      toast.success('🤖 AI search activated! Finding your perfect match...')
    }

    navigate(`/search?${searchParams.toString()}`)
  }

  const handleAiSearch = () => {
    if (!searchData.requirements) {
      toast.error('Please describe what you\'re looking for to use AI search')
      return
    }
    
    setIsAiSearch(true)
    handleSearch({ preventDefault: () => {} })
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter location..."
              value={searchData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-8"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </form>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto"
    >
      <form onSubmit={handleSearch} className="space-y-6">
        {/* Traditional Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="City, neighborhood..."
                value={searchData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type
            </label>
            <div className="relative">
              <HomeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={searchData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={searchData.priceRange}
                onChange={(e) => handleInputChange('priceRange', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              placeholder="Any"
              min="0"
              value={searchData.bedrooms}
              onChange={(e) => handleInputChange('bedrooms', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* AI Search Section */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-accent-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI-Powered Search
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your ideal property
              </label>
              <textarea
                placeholder="I'm looking for a modern 3-bedroom apartment with a balcony, near public transport, pet-friendly, with parking space..."
                value={searchData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be as specific as possible. Our AI will match you with properties that meet your exact needs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Traditional Search
          </button>
          
          <button
            type="button"
            onClick={handleAiSearch}
            className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-6 py-3 rounded-lg font-medium hover:from-accent-600 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <SparklesIcon className="h-5 w-5" />
            AI Search
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default SearchForm