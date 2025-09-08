import { useState, useEffect } from 'react'
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
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import apiService from '../services/api'
import PropertyForm from '../components/PropertyForm'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [properties, setProperties] = useState([])
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [error, setError] = useState(null)

  // Load real data from API
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load properties
      const propertiesResponse = await apiService.getProperties()
      if (propertiesResponse.success) {
        setProperties(propertiesResponse.data.properties)
        
        // Calculate analytics from properties data
        const props = propertiesResponse.data.properties
        const totalViews = props.reduce((sum, prop) => sum + prop.views, 0)
        const totalInquiries = props.reduce((sum, prop) => sum + prop.inquiries, 0)
        const availableCount = props.filter(p => p.status === 'Available').length
        const soldCount = props.filter(p => p.status === 'Sold').length
        const averagePrice = props.length > 0 ? 
          props.reduce((sum, prop) => sum + parseFloat(prop.price.replace(/[^0-9]/g, '')), 0) / props.length : 0

        setAnalytics({
          totalProperties: props.length,
          availableProperties: availableCount,
          soldProperties: soldCount,
          totalViews,
          totalInquiries,
          conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0,
          averagePrice,
          hotLeads: 1, // Sample data for now
          warmLeads: 1,
          coldLeads: 0
        })
      }

      // Sample users data for now
      setUsers([
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+254-700-123-456',
          leadScore: 85,
          category: 'HOT',
          lastActivity: '2025-01-15',
          interests: ['Karen', 'Villa', 'KSH 50M-70M']
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          phone: '+254-700-123-457',
          leadScore: 62,
          category: 'WARM',
          lastActivity: '2025-01-14',
          interests: ['Kilimani', 'Apartment', 'Under KSH 30M']
        }
      ])

    } catch (error) {
      setError(`Failed to load dashboard data: ${error.message}`)
      console.error('Dashboard data loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Property management functions
  const handleAddProperty = () => {
    setEditingProperty(null)
    setShowPropertyForm(true)
  }

  const handleEditProperty = (property) => {
    setEditingProperty(property)
    setShowPropertyForm(true)
  }

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    try {
      await apiService.deleteProperty(propertyId)
      await loadDashboardData() // Reload data
    } catch (error) {
      setError(`Failed to delete property: ${error.message}`)
    }
  }

  const handleSaveProperty = async (propertyData) => {
    try {
      if (editingProperty) {
        await apiService.updateProperty(editingProperty.id, propertyData)
      } else {
        await apiService.createProperty(propertyData)
      }
      
      setShowPropertyForm(false)
      setEditingProperty(null)
      await loadDashboardData() // Reload data
    } catch (error) {
      setError(`Failed to save property: ${error.message}`)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'properties', name: 'Properties', icon: HomeIcon },
    { id: 'users', name: 'Users & Leads', icon: UsersIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800'
      case 'Sold': return 'bg-red-100 text-red-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadCategoryColor = (category) => {
    switch (category) {
      case 'HOT': return 'bg-red-100 text-red-800'
      case 'WARM': return 'bg-yellow-100 text-yellow-800'
      case 'COLD': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="admin-card p-6">
          <div className="flex items-center">
            <HomeIcon className="h-8 w-8 gold-text" />
            <div className="ml-4">
              <h3 className="text-sm font-medium" style={{ color: 'var(--white-muted)' }}>Total Properties</h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--white-primary)' }}>{analytics.totalProperties}</p>
            </div>
          </div>
        </div>
        
        <div className="admin-card p-6">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 gold-text" />
            <div className="ml-4">
              <h3 className="text-sm font-medium" style={{ color: 'var(--white-muted)' }}>Total Views</h3>
              <p className="text-2xl font-bold gold-text">{analytics.totalViews?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Inquiries</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalInquiries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Properties</h3>
          </div>
          <div className="p-6 space-y-4">
            {properties.slice(0, 3).map((property) => (
              <div key={property.id} className="flex items-center space-x-4">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {property.title}
                  </p>
                  <p className="text-sm text-gray-500">{property.location}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lead Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hot Leads</span>
                <span className="text-sm font-medium text-red-600">{analytics.hotLeads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Warm Leads</span>
                <span className="text-sm font-medium text-yellow-600">{analytics.warmLeads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cold Leads</span>
                <span className="text-sm font-medium text-blue-600">{analytics.coldLeads}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const PropertiesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
        <button 
          onClick={handleAddProperty}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Property
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="relative">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              {property.featured && (
                <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 text-xs font-medium rounded">
                  Featured
                </span>
              )}
              <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(property.status)}`}>
                {property.status}
              </span>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{property.title}</h3>
              <p className="text-gray-600 text-sm mb-2 flex items-center">
                <MapIcon className="h-4 w-4 mr-1" />
                {property.location}
              </p>
              <p className="text-primary-600 font-bold text-xl mb-3">{property.price}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>{property.bedrooms} bed</span>
                <span>{property.bathrooms} bath</span>
                <span>{property.type}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {property.views} views
                </span>
                <span className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  {property.inquiries} inquiries
                </span>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                <button 
                  onClick={() => handleEditProperty(property)}
                  className="flex-1 btn-primary text-xs py-2 flex items-center justify-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProperty(property.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Users & Leads Management</h2>
        <div className="flex space-x-3">
          <button className="btn-secondary">Export CSV</button>
          <button className="btn-primary">Import Leads</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{user.leadScore}</div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(user.leadScore / 100) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeadCategoryColor(user.category)}`}>
                    {user.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastActivity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-900">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Contact</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Views per Property</span>
              <span className="text-sm font-medium">{Math.round(analytics.totalViews / analytics.totalProperties)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Inquiries per Property</span>
              <span className="text-sm font-medium">{Math.round(analytics.totalInquiries / analytics.totalProperties)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Property Price</span>
              <span className="text-sm font-medium">KSH {(analytics.averagePrice / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Hot Leads</span>
              </div>
              <span className="text-sm font-medium">{analytics.hotLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Warm Leads</span>
              </div>
              <span className="text-sm font-medium">{analytics.warmLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Cold Leads</span>
              </div>
              <span className="text-sm font-medium">{analytics.coldLeads}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--black-primary)' }}>
      {/* Header */}
      <div className="admin-card shadow-lg border-b" style={{ borderBottomColor: 'var(--gold-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 gold-text mr-3" />
              <h1 className="text-xl font-bold gold-accent">🏢 Palvoria Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: 'var(--white-muted)' }}>Welcome back, Admin</span>
              <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--gold-primary)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--black-primary)' }}>A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'tab-active'
                      : 'tab-inactive'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'properties' && <PropertiesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="float-right ml-4 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          onSave={handleSaveProperty}
          onCancel={() => {
            setShowPropertyForm(false)
            setEditingProperty(null)
          }}
        />
      )}
    </div>
  )
}

export default AdminDashboard