import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapIcon,
  PhotoIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassCircleIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  StarIcon as StarSolid,
  CheckCircleIcon as CheckSolid
} from '@heroicons/react/24/solid'
import apiService from '../services/api'
import PropertyForm from '../components/PropertyForm'
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard'
import SEOManager from '../components/admin/SEOManager'

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'properties')
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    conversionRate: 0,
    availableProperties: 0,
    soldProperties: 0,
    featuredProperties: 0
  })
  const [loading, setLoading] = useState(false)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = properties

    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter)
    }

    setFilteredProperties(filtered)
  }, [properties, searchTerm, statusFilter, typeFilter])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Admin Dashboard: Loading properties...')
      
      // Load properties from API
      const response = await apiService.getProperties()
      console.log('📋 Admin Dashboard: API Response:', response)
      
      const apiProperties = response.data || response || []
      console.log('🏠 Admin Dashboard: API Properties:', apiProperties)
      
      // Transform API data to match component format
      const transformedProperties = apiProperties.map(property => ({
        id: property._id,
        title: property.title,
        description: property.description,
        location: `${property.location?.city || ''}, ${property.location?.county || ''}`.replace(/^,\s*|,\s*$/g, '') || property.location?.address || 'Location not specified',
        price: `KSH ${property.price?.amount?.toLocaleString() || 'Price on request'}`,
        type: property.propertyType || property.category || 'Property',
        bedrooms: property.features?.bedrooms || 0,
        bathrooms: property.features?.bathrooms || 0,
        area: property.features?.area?.size ? `${property.features.area.size} ${property.features.area.unit || 'sq ft'}` : 'Area not specified',
        status: property.status === 'active' ? 'Available' : property.status || 'Available',
        featured: property.featured || false,
        views: property.views || 0,
        inquiries: property.inquiries?.length || 0,
        dateAdded: property.createdAt || property.dateAdded || new Date().toISOString(),
        images: property.images ? 
          property.images
            .sort((a, b) => {
              // Sort by order first, then by isPrimary (primary first), then by upload date
              if (a.isPrimary && !b.isPrimary) return -1;
              if (!a.isPrimary && b.isPrimary) return 1;
              return (a.order || 0) - (b.order || 0);
            })
            .map(img => img.url) 
          : [],
        // Store original property data for editing
        originalData: property
      }))

      setProperties(transformedProperties)
      
      // Calculate analytics
      const totalViews = transformedProperties.reduce((sum, prop) => sum + prop.views, 0)
      const totalInquiries = transformedProperties.reduce((sum, prop) => sum + prop.inquiries, 0)
      const availableCount = transformedProperties.filter(p => p.status === 'Available').length
      const soldCount = transformedProperties.filter(p => p.status === 'Sold').length
      const featuredCount = transformedProperties.filter(p => p.featured).length

      setAnalytics({
        totalProperties: transformedProperties.length,
        totalViews,
        totalInquiries,
        conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0,
        availableProperties: availableCount,
        soldProperties: soldCount,
        featuredProperties: featuredCount
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProperty = () => {
    setEditingProperty(null)
    setShowPropertyForm(true)
  }

  const handleEditProperty = (property) => {
    // Use original backend data for editing to preserve correct field values
    const editData = property.originalData || property
    console.log('✏️ Admin Dashboard: Editing property:', editData)
    setEditingProperty(editData)
    setShowPropertyForm(true)
  }

  const handleViewProperty = (property) => {
    setSelectedProperty(property)
    setCurrentImageIndex(0) // Reset to first image
    setShowPropertyDetails(true)
  }

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setSearchParams({ tab: tabName })
  }

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await apiService.deleteProperty(propertyId)
        setProperties(prev => prev.filter(p => p.id !== propertyId))
        loadDashboardData() // Refresh data
      } catch (error) {
        console.error('Error deleting property:', error)
        setError('Failed to delete property')
      }
    }
  }

  const handleSaveProperty = async (propertyData) => {
    try {
      console.log('💾 Admin Dashboard: Saving property with data:', propertyData)
      
      // Extract images from property data - check both images and newImages
      const images = propertyData.newImages || propertyData.images || []
      const cleanPropertyData = { ...propertyData }
      delete cleanPropertyData.images // Remove images from main data as they're handled separately
      delete cleanPropertyData.newImages // Remove newImages from main data as they're handled separately
      
      console.log('📷 Admin Dashboard: Images to upload:', images)
      console.log('📋 Admin Dashboard: Clean property data:', cleanPropertyData)
      
      if (editingProperty) {
        // Update existing property
        const propertyId = editingProperty._id || editingProperty.id
        console.log('🔄 Admin Dashboard: Updating property with ID:', propertyId)
        await apiService.updateProperty(propertyId, cleanPropertyData, images)
      } else {
        // Create new property
        await apiService.createProperty(cleanPropertyData, images)
      }
      
      // Only close form and reload data on successful save
      setShowPropertyForm(false)
      setEditingProperty(null)
      loadDashboardData() // Refresh all data
      
    } catch (error) {
      console.error('Error saving property:', error)
      setError('Failed to save property')
      // Don't close the form - let user fix the issues and try again
      throw error // Re-throw so PropertyForm can handle it
    }
  }

  const toggleFeatured = async (propertyId) => {
    try {
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        await apiService.updateProperty(propertyId, { featured: !property.featured })
        setProperties(prev => prev.map(p => 
          p.id === propertyId ? { ...p, featured: !p.featured } : p
        ))
      }
    } catch (error) {
      console.error('Error updating featured status:', error)
      setError('Failed to update featured status')
    }
  }

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon, count: null },
    { id: 'properties', name: 'Properties', icon: HomeIcon, count: analytics.totalProperties },
    { id: 'seo', name: 'SEO Management', icon: MagnifyingGlassCircleIcon, count: null },
    { id: 'users', name: 'Users', icon: UsersIcon, count: 0 },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, count: null },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, count: null }
  ]

  const statsCards = [
    {
      title: 'Total Properties',
      value: analytics.totalProperties,
      change: '+12%',
      changeType: 'increase',
      icon: HomeIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Views',
      value: analytics.totalViews.toLocaleString(),
      change: '+23%',
      changeType: 'increase',
      icon: EyeIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Inquiries',
      value: analytics.totalInquiries,
      change: '+8%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: ChartBarIcon,
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

  const propertyTypes = [...new Set(properties.map(p => p.type))]
  const propertyStatuses = [...new Set(properties.map(p => p.status))]

  if (showPropertyForm) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 min-h-screen">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">PALVORIA</h1>
                  <p className="text-xs text-yellow-400">Admin Panel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <button
                  onClick={() => setShowPropertyForm(false)}
                  className="btn-secondary mb-4"
                >
                  ← Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </h2>
                <p className="text-gray-400">
                  {editingProperty ? 'Update property details and settings' : 'Create a new property listing'}
                </p>
              </div>

              <PropertyForm
                property={editingProperty}
                onSave={handleSaveProperty}
                onCancel={() => setShowPropertyForm(false)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -250 }}
          animate={{ x: 0 }}
          className="w-64 bg-gray-900 min-h-screen fixed left-0 top-0 z-40"
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white vogue-heading">PALVORIA</h1>
                <p className="text-xs text-yellow-400">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-4">
            {sidebarItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-xl text-left transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.count !== null && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === item.id ? 'bg-black text-yellow-400' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {item.count}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Header */}
          <header className="bg-gray-900 border-b border-gray-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white capitalize">{activeTab} Dashboard</h1>
                <p className="text-gray-400 mt-1">
                  {activeTab === 'overview' && 'Welcome back, manage your properties efficiently'}
                  {activeTab === 'properties' && `Manage your ${analytics.totalProperties} properties`}
                  {activeTab === 'seo' && 'Optimize SEO for all your properties'}
                  {activeTab === 'users' && 'User management and permissions'}
                  {activeTab === 'analytics' && 'Performance metrics and insights'}
                  {activeTab === 'settings' && 'System configuration and preferences'}
                </p>
              </div>
              
              {activeTab === 'properties' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateProperty}
                  className="btn-primary flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Property
                </motion.button>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="p-8">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6"
              >
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900 rounded-xl p-6 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          stat.changeType === 'increase' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {stat.changeType === 'increase' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                          {stat.change}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Property Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-gray-300">Available</span>
                        </div>
                        <span className="text-white font-semibold">{analytics.availableProperties}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300">Sold</span>
                        </div>
                        <span className="text-white font-semibold">{analytics.soldProperties}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <span className="text-gray-300">Featured</span>
                        </div>
                        <span className="text-white font-semibold">{analytics.featuredProperties}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm">New property added</p>
                          <p className="text-gray-400 text-xs">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <EyeIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm">Property viewed 15 times</p>
                          <p className="text-gray-400 text-xs">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm">New inquiry received</p>
                          <p className="text-gray-400 text-xs">6 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    >
                      <option value="all">All Status</option>
                      {propertyStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    >
                      <option value="all">All Types</option>
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <FunnelIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 text-sm">
                        {filteredProperties.length} of {properties.length} properties
                      </span>
                    </div>
                  </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredProperties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all"
                    >
                      <div className="relative">
                        <img
                          src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop'}
                          alt={property.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            property.status === 'Available' 
                              ? 'bg-green-500/90 text-white' 
                              : property.status === 'Sold'
                              ? 'bg-blue-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => toggleFeatured(property.id)}
                            className={`p-2 rounded-full ${
                              property.featured 
                                ? 'bg-yellow-400 text-black' 
                                : 'bg-gray-800/90 text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            {property.featured ? <StarSolid className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{property.title}</h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1">
                              <MapIcon className="w-4 h-4" />
                              {property.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-yellow-400 font-bold">{property.price}</p>
                            <p className="text-gray-400 text-xs">{property.type}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-400">Bedrooms</p>
                            <p className="text-white font-semibold">{property.bedrooms}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400">Bathrooms</p>
                            <p className="text-white font-semibold">{property.bathrooms}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-400">Area</p>
                            <p className="text-white font-semibold">{property.area}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4 text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-gray-400">
                              <EyeIcon className="w-4 h-4" />
                              <span>{property.views}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <UsersIcon className="w-4 h-4" />
                              <span>{property.inquiries}</span>
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(property.dateAdded).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditProperty(property)}
                              className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteProperty(property.id)}
                              className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                          
                          <button 
                            onClick={() => handleViewProperty(property)}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredProperties.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <HomeIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No properties found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Get started by adding your first property'}
                    </p>
                    <button
                      onClick={handleCreateProperty}
                      className="btn-primary"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Add Your First Property
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SEO Management Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">SEO Management</h2>
                  <p className="text-gray-400 mb-6">
                    Auto-generate and optimize SEO for all your properties. Select a property to manage its SEO settings.
                  </p>
                  
                  {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {properties.slice(0, 6).map((property) => (
                        <motion.div
                          key={property._id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-yellow-500 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowPropertyDetails(true)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <MagnifyingGlassCircleIcon className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{property.title}</h3>
                              <p className="text-gray-400 text-sm truncate">{property.location?.area || 'No area'}, {property.location?.city}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  property.seo?.metaTitle 
                                    ? 'bg-green-900 text-green-300' 
                                    : 'bg-red-900 text-red-300'
                                }`}>
                                  {property.seo?.metaTitle ? 'SEO Ready' : 'Needs SEO'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MagnifyingGlassCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No Properties Found</h3>
                      <p className="text-gray-500">Create some properties first to manage their SEO</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <AnalyticsDashboard />
              </div>
            )}

            {/* Other tabs placeholder */}
            {(activeTab === 'users' || activeTab === 'settings') && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'users' && <UsersIcon className="w-8 h-8 text-gray-400" />}
                  {activeTab === 'settings' && <Cog6ToothIcon className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2 capitalize">{activeTab} Coming Soon</h3>
                <p className="text-gray-500">This section is under development</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={() => setShowPropertyForm(false)}
        />
      )}

      {/* Property Details Modal */}
      {showPropertyDetails && selectedProperty && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-80 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowPropertyDetails(false)}
          ></div>
            
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedProperty.title}</h3>
                <p className="text-gray-400 mt-1">{selectedProperty.location}</p>
              </div>
              <button
                onClick={() => setShowPropertyDetails(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image and Basic Info */}
                <div>
                  {/* Image Gallery */}
                  <div className="relative mb-4">
                    {selectedProperty.images && selectedProperty.images.length > 0 ? (
                      <>
                        {/* Main Image */}
                        <div className="relative">
                          <img
                            src={selectedProperty.images[currentImageIndex]?.url || selectedProperty.images[currentImageIndex]}
                            alt={`${selectedProperty.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-64 object-cover rounded-lg shadow-lg"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop'
                            }}
                          />
                          
                          {/* Navigation arrows - only show if more than 1 image */}
                          {selectedProperty.images.length > 1 && (
                            <>
                              <button
                                onClick={() => setCurrentImageIndex(prev => 
                                  prev === 0 ? selectedProperty.images.length - 1 : prev - 1
                                )}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                              >
                                <ChevronLeftIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setCurrentImageIndex(prev => 
                                  prev === selectedProperty.images.length - 1 ? 0 : prev + 1
                                )}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                              >
                                <ChevronRightIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {/* Image counter */}
                          {selectedProperty.images.length > 1 && (
                            <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                              {currentImageIndex + 1} / {selectedProperty.images.length}
                            </div>
                          )}

                          {/* Featured badge */}
                          {selectedProperty.featured && (
                            <div className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                              Featured
                            </div>
                          )}
                        </div>

                        {/* Thumbnail navigation - only show if more than 1 image */}
                        {selectedProperty.images.length > 1 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            {selectedProperty.images.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  currentImageIndex === index 
                                    ? 'border-yellow-500 ring-2 ring-yellow-500 ring-opacity-50' 
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                <img
                                  src={image?.url || image}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=64&h=64&fit=crop'
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback image when no images available */
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop"
                          alt={selectedProperty.title}
                          className="w-full h-64 object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-70" />
                            <p className="text-sm opacity-90">No images uploaded</p>
                          </div>
                        </div>
                        {selectedProperty.featured && (
                          <div className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                            Featured
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Property Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="text-white font-medium capitalize">{selectedProperty.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className={`font-medium ${selectedProperty.status === 'Available' ? 'text-green-400' : 'text-blue-400'}`}>
                          {selectedProperty.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bedrooms</p>
                        <p className="text-white font-medium">{selectedProperty.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bathrooms</p>
                        <p className="text-white font-medium">{selectedProperty.bathrooms}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Area</p>
                        <p className="text-white font-medium">{selectedProperty.area}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Price</p>
                        <p className="text-yellow-400 font-bold">{selectedProperty.price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <EyeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Views:</span>
                        <span className="text-white font-medium">{selectedProperty.views}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Inquiries:</span>
                        <span className="text-white font-medium">{selectedProperty.inquiries}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarIcon className={`w-4 h-4 ${selectedProperty.featured ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-gray-400">Featured:</span>
                        <span className="text-white font-medium">{selectedProperty.featured ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Added:</span>
                        <span className="text-white font-medium text-xs">
                          {new Date(selectedProperty.dateAdded).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Description and Amenities */}
                <div>
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedProperty.description}
                    </p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Location</h4>
                    <div className="flex items-start gap-2 text-gray-300">
                      <MapIcon className="w-5 h-5 mt-1 text-gray-400" />
                      <div>
                        <p>{selectedProperty.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-700 bg-gray-900">
              <button
                onClick={() => {
                  setShowPropertyDetails(false)
                  handleEditProperty(selectedProperty)
                }}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Property
              </button>
              <button
                onClick={() => setShowPropertyDetails(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard