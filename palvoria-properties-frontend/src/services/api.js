const API_BASE_URL = 'http://localhost:5000/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    console.log('🔗 API Request:', { url, config })

    try {
      const response = await fetch(url, config)
      
      console.log('📡 API Response:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ API Success:', { endpoint, dataLength: data?.data?.length })
      return data
    } catch (error) {
      console.error(`❌ API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Property Management Operations
  async getProperties(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/properties?${queryString}` : '/properties'
    return this.request(endpoint)
  }

  async getProperty(id) {
    return this.request(`/properties/${id}`)
  }

  async createProperty(propertyData, images = []) {
    console.log('API Service - Creating property with data:', propertyData)
    
    // For now, filter out blob URLs as they are not real files
    const cleanPropertyData = {
      ...propertyData,
      images: [] // Remove blob URLs for now
    }
    
    console.log('API Service - Clean property data:', cleanPropertyData)
    
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(cleanPropertyData)
    })
  }

  async updateProperty(id, propertyData, images = []) {
    const formData = new FormData()
    
    // Add property data
    Object.keys(propertyData).forEach(key => {
      if (key !== 'images') {
        if (typeof propertyData[key] === 'object') {
          formData.append(key, JSON.stringify(propertyData[key]))
        } else {
          formData.append(key, propertyData[key])
        }
      }
    })
    
    // Add new images
    images.forEach((image, index) => {
      formData.append('images', image)
    })
    
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {} // Don't set Content-Type, let browser set it with boundary
    })
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE'
    })
  }

  // Image management for properties
  async deletePropertyImage(propertyId, imageId) {
    return this.request(`/properties/${propertyId}/images/${imageId}`, {
      method: 'DELETE'
    })
  }

  async setPrimaryImage(propertyId, imageId) {
    return this.request(`/properties/${propertyId}/images/${imageId}/primary`, {
      method: 'PUT'
    })
  }

  // Analytics endpoints
  async getPropertyAnalytics() {
    return this.request('/properties/analytics')
  }

  async getPropertyStats() {
    return this.request('/properties/stats')
  }

  // User management operations (for future use)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/users?${queryString}` : '/users'
    return this.request(endpoint)
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export default new ApiService()