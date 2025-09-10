import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  MapIcon,
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const PropertyForm = ({ property = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    address: property?.location?.address || '',
    city: property?.location?.city || 'Nairobi',
    county: property?.location?.county || 'Nairobi',
    neighborhood: property?.location?.neighborhood || '',
    price: property?.price?.amount || '',
    currency: property?.price?.currency || 'KES',
    propertyType: property?.propertyType || 'apartment',
    category: property?.category || 'sale',
    bedrooms: property?.features?.bedrooms || 1,
    bathrooms: property?.features?.bathrooms || 1,
    area: property?.features?.area?.size || '',
    areaUnit: property?.features?.area?.unit || 'sqft',
    yearBuilt: property?.yearBuilt || '',
    amenities: property?.amenities || [],
    status: property?.status || 'draft',
    featured: property?.featured || false,
    images: property?.images || [],
    virtualTourUrl: property?.virtualTourUrl || '',
    coordinates: property?.location?.coordinates ? { lat: property.location.coordinates.latitude, lng: property.location.coordinates.longitude } : { lat: '', lng: '' },
    contactAgent: property?.contactAgent || '',
    agentPhone: property?.agentPhone || '',
    agentEmail: property?.agentEmail || ''
  })

  const [newFeature, setNewFeature] = useState('')
  const [imagePreview, setImagePreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef()

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up all blob URLs when component unmounts
      imagePreview.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imagePreview])

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' },
    { value: 'shop', label: 'Shop' }
  ]

  const propertyStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' },
    { value: 'inactive', label: 'Inactive' }
  ]

  const propertyCategories = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
    { value: 'lease', label: 'For Lease' }
  ]

  const currencies = [
    { value: 'KES', label: 'KES (Kenyan Shilling)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'EUR', label: 'EUR (Euro)' }
  ]

  const commonFeatures = [
    'Swimming Pool',
    'Gym',
    'Parking',
    'Security',
    'Garden',
    'Balcony',
    'Air Conditioning',
    'Furnished',
    'WiFi',
    'Elevator',
    'Backup Generator',
    'CCTV',
    'Gated Community',
    'Playground',
    'Shopping Mall Nearby',
    'Hospital Nearby',
    'School Nearby'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCoordinateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: value
      }
    }))
  }

  const addAmenity = (amenityName) => {
    if (!formData.amenities.find(a => a.name === amenityName)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, { name: amenityName, icon: '', description: '' }]
      }))
    }
  }

  const removeAmenity = (amenityName) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a.name !== amenityName)
    }))
  }

  const addCustomAmenity = () => {
    if (newFeature.trim() && !formData.amenities.find(a => a.name === newFeature.trim())) {
      addAmenity(newFeature.trim())
      setNewFeature('')
    }
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    
    // Create preview URLs for immediate display
    const previews = files.map(file => URL.createObjectURL(file))
    setImagePreview(prev => [...prev, ...previews])
    
    // Use the real preview URLs instead of placeholders
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...previews]
    }))
  }

  const removeImage = (index) => {
    // Clean up the object URL to prevent memory leaks
    const imageToRemove = formData.images[index]
    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove)
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Basic validation
      if (!formData.title || !formData.address || !formData.city || !formData.county || !formData.price) {
        alert('Please fill in all required fields: title, address, city, county, and price')
        return
      }

      // Transform data to match backend schema
      const transformedData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        category: formData.category,
        location: {
          address: formData.address,
          city: formData.city,
          county: formData.county,
          neighborhood: formData.neighborhood,
          coordinates: formData.coordinates.lat && formData.coordinates.lng ? {
            latitude: parseFloat(formData.coordinates.lat),
            longitude: parseFloat(formData.coordinates.lng)
          } : undefined
        },
        price: {
          amount: parseFloat(formData.price),
          currency: formData.currency,
          period: formData.category === 'sale' ? 'one-time' : 'month'
        },
        features: {
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          area: formData.area ? {
            size: parseFloat(formData.area),
            unit: formData.areaUnit
          } : undefined
        },
        amenities: formData.amenities,
        status: formData.status,
        featured: formData.featured,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        images: [], // Temporarily disable images to focus on data validation
        owner: '507f1f77bcf86cd799439011' // Temporary owner ID
      }
      
      console.log('Form Data:', formData)
      console.log('Transformed Data:', transformedData)

      await onSave(transformedData)
      
    } catch (error) {
      console.error('Error saving property:', error)
      alert('Failed to save property. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., 4BR Villa in Karen with Swimming Pool"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  >
                    {propertyCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  >
                    {propertyStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., 123 Karen Road"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.county}
                    onChange={(e) => handleInputChange('county', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., Nairobi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neighborhood
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., Karen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., 65000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>{currency.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Size
                  </label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Unit
                  </label>
                  <select
                    value={formData.areaUnit}
                    onChange={(e) => handleInputChange('areaUnit', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  >
                    <option value="sqft">Square Feet</option>
                    <option value="sqm">Square Meters</option>
                    <option value="acres">Acres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Description</h3>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                placeholder="Describe the property, its unique features, neighborhood, and any other relevant information..."
              />
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Amenities</h3>
              
              {/* Selected Amenities */}
              {formData.amenities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Amenities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-200 text-black"
                      >
                        {amenity.name}
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity.name)}
                          className="ml-2 hover:text-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Amenities */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Common Amenities:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {commonFeatures.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => addAmenity(amenity)}
                      disabled={formData.amenities.find(a => a.name === amenity)}
                      className={`text-left px-3 py-2 text-sm rounded-lg border ${
                        formData.amenities.find(a => a.name === amenity)
                          ? 'border-yellow-400 bg-yellow-900 text-yellow-300'
                          : 'border-gray-600 text-gray-300 hover:border-yellow-400 hover:bg-gray-700'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amenity */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                  placeholder="Add custom amenity..."
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  className="btn-primary px-4 py-2 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Property Images</h3>
              
              {/* Image Upload */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 hover:bg-gray-800 transition-colors"
                >
                  <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300">Click to upload property images</p>
                  <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB each</p>
                </button>
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location & Coordinates */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={formData.coordinates.lat}
                    onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="-1.2921"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={formData.coordinates.lng}
                    onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="36.8219"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Virtual Tour URL
                  </label>
                  <input
                    type="url"
                    value={formData.virtualTourUrl}
                    onChange={(e) => handleInputChange('virtualTourUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Agent Contact */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Agent Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactAgent}
                    onChange={(e) => handleInputChange('contactAgent', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="Agent Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.agentPhone}
                    onChange={(e) => handleInputChange('agentPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="+254-700-123-456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Email
                  </label>
                  <input
                    type="email"
                    value={formData.agentEmail}
                    onChange={(e) => handleInputChange('agentEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-white placeholder-gray-400"
                    placeholder="agent@palvoriaproperties.com"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Additional Options</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-600 bg-gray-800 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-300">
                  Mark as Featured Property
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700 bg-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : property ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default PropertyForm