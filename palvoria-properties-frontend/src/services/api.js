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

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
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

  async createProperty(propertyData) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    })
  }

  async updateProperty(id, propertyData) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    })
  }

  async deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE'
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