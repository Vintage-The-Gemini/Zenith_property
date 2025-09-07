// Advanced Property Search Algorithm for Palvoria Properties Kenya
class PropertySearchEngine {
  constructor() {
    this.properties = []
    this.searchHistory = []
    this.userPreferences = {}
  }

  // Initialize with property data
  setProperties(properties) {
    this.properties = properties.map(property => ({
      ...property,
      searchScore: 0,
      locationCoords: this.getLocationCoordinates(property.location)
    }))
  }

  // Main search function implementing the algorithm from the document
  search(criteria) {
    const {
      location,
      priceRange,
      propertyType,
      bedrooms,
      bathrooms,
      lifestyle = 'general',
      radius = 10, // km
      sortBy = 'relevance'
    } = criteria

    let results = [...this.properties]

    // Primary filters
    results = this.applyPrimaryFilters(results, {
      location,
      priceRange,
      propertyType,
      bedrooms,
      bathrooms,
      radius
    })

    // Lifestyle-based filtering
    results = this.applyLifestyleFilters(results, lifestyle, criteria)

    // Calculate relevance scores
    results = this.calculateRelevanceScores(results, criteria)

    // Sort results
    results = this.sortResults(results, sortBy)

    // Store search for analytics and personalization
    this.storeSearch(criteria, results.length)

    return {
      results: results.slice(0, 50), // Limit to top 50 results
      totalCount: results.length,
      searchId: this.generateSearchId(),
      filters: this.generateSuggestedFilters(results),
      recommendations: this.generateRecommendations(results, criteria)
    }
  }

  // Primary filtering logic
  applyPrimaryFilters(properties, filters) {
    let filtered = properties

    // Location filtering with intelligent expansion
    if (filters.location && filters.location.trim()) {
      filtered = filtered.filter(property => {
        const locationMatch = this.checkLocationMatch(
          property.location,
          filters.location,
          filters.radius
        )
        return locationMatch.score > 0.3 // 30% minimum match
      })
    }

    // Price range filtering
    if (filters.priceRange && filters.priceRange !== 'All') {
      filtered = filtered.filter(property => 
        this.checkPriceRange(property.price, filters.priceRange)
      )
    }

    // Property type filtering
    if (filters.propertyType && filters.propertyType !== 'All') {
      filtered = filtered.filter(property => 
        property.type === filters.propertyType
      )
    }

    // Bedroom filtering
    if (filters.bedrooms && filters.bedrooms !== 'All') {
      const minBedrooms = parseInt(filters.bedrooms.replace('+', ''))
      filtered = filtered.filter(property => 
        property.bedrooms >= minBedrooms
      )
    }

    // Bathroom filtering
    if (filters.bathrooms && filters.bathrooms !== 'All') {
      const minBathrooms = parseInt(filters.bathrooms.replace('+', ''))
      filtered = filtered.filter(property => 
        property.bathrooms >= minBathrooms
      )
    }

    return filtered
  }

  // Lifestyle-based filtering as per algorithm
  applyLifestyleFilters(properties, lifestyle, criteria) {
    if (lifestyle === 'general') return properties

    return properties.filter(property => {
      switch (lifestyle) {
        case 'family_oriented':
          return this.checkFamilyFriendly(property)
        
        case 'young_professional':
          return this.checkProfessionalFriendly(property)
        
        case 'retiree':
          return this.checkRetireesFriendly(property)
        
        case 'investment':
          return this.checkInvestmentPotential(property)
        
        default:
          return true
      }
    })
  }

  // Calculate relevance scores based on algorithm
  calculateRelevanceScores(properties, criteria) {
    return properties.map(property => {
      let baseScore = 100
      
      // Location match bonus (30% weight)
      const locationBonus = this.calculateLocationScore(property, criteria.location) * 0.3
      
      // Price competitiveness (20% weight)
      const priceBonus = this.calculatePriceCompetitiveness(property) * 0.2
      
      // Feature match percentage (10% weight)
      const featureBonus = this.calculateFeatureMatch(property, criteria) * 0.1
      
      // Base relevance (40% weight)
      const baseRelevance = baseScore * 0.4

      property.searchScore = baseRelevance + locationBonus + priceBonus + featureBonus

      return property
    })
  }

  // Location matching with fuzzy search
  checkLocationMatch(propertyLocation, searchLocation, radius) {
    const propertyLower = propertyLocation.toLowerCase()
    const searchLower = searchLocation.toLowerCase()

    // Direct match
    if (propertyLower.includes(searchLower) || searchLower.includes(propertyLower)) {
      return { score: 1.0, reason: 'direct_match' }
    }

    // Kenyan location aliases
    const kenyaAliases = {
      'nairobi': ['nbi', 'nrb', 'capital', 'city'],
      'mombasa': ['msa', 'coast', 'coastal'],
      'kisumu': ['ksm', 'lake', 'western'],
      'nakuru': ['nkr', 'rift valley'],
      'eldoret': ['eld', 'north rift'],
      'thika': ['thk', 'kiambu'],
      'westlands': ['westie', 'westi'],
      'karen': ['karen estate'],
      'kibera': ['kib'],
      'kangemi': ['kange'],
      'kasarani': ['kasa'],
      'embakasi': ['emba'],
      'langata': ['lang']
    }

    // Check aliases
    for (const [location, aliases] of Object.entries(kenyaAliases)) {
      if (propertyLower.includes(location) && 
          aliases.some(alias => searchLower.includes(alias))) {
        return { score: 0.8, reason: 'alias_match' }
      }
    }

    // Geographic proximity (if coordinates available)
    if (propertyLocation.coordinates && searchLocation.coordinates) {
      const distance = this.calculateDistance(
        propertyLocation.coordinates,
        searchLocation.coordinates
      )
      
      if (distance <= radius) {
        return { 
          score: Math.max(0.5, (radius - distance) / radius),
          reason: 'proximity_match',
          distance 
        }
      }
    }

    return { score: 0, reason: 'no_match' }
  }

  // Price range checking for Kenyan market
  checkPriceRange(price, range) {
    const numPrice = parseFloat(price.replace(/[KSH\s,M]/g, ''))
    
    switch (range) {
      case 'Under KSH 30M':
        return numPrice < 30
      case 'KSH 30M - 50M':
        return numPrice >= 30 && numPrice <= 50
      case 'KSH 50M - 70M':
        return numPrice >= 50 && numPrice <= 70
      case 'Over KSH 70M':
        return numPrice > 70
      default:
        return true
    }
  }

  // Lifestyle filtering implementations
  checkFamilyFriendly(property) {
    const familyKeywords = [
      'school', 'playground', 'park', 'family', 'safe', 'quiet',
      'garden', 'yard', 'children', 'hospital', 'clinic'
    ]
    
    const description = `${property.description} ${property.features?.join(' ')}`.toLowerCase()
    const keywordCount = familyKeywords.filter(keyword => 
      description.includes(keyword)
    ).length

    // Properties in family-friendly areas
    const familyAreas = ['karen', 'runda', 'muthaiga', 'lavington', 'kileleshwa']
    const inFamilyArea = familyAreas.some(area => 
      property.location.toLowerCase().includes(area)
    )

    return keywordCount >= 2 || inFamilyArea || property.bedrooms >= 3
  }

  checkProfessionalFriendly(property) {
    const professionalKeywords = [
      'cbd', 'business', 'office', 'transport', 'modern', 'gym',
      'internet', 'security', 'elevator', 'parking', 'mall'
    ]

    const description = `${property.description} ${property.features?.join(' ')}`.toLowerCase()
    const keywordCount = professionalKeywords.filter(keyword => 
      description.includes(keyword)
    ).length

    // Properties in business-friendly areas
    const businessAreas = ['westlands', 'upperhill', 'kilimani', 'parklands', 'cbd']
    const inBusinessArea = businessAreas.some(area => 
      property.location.toLowerCase().includes(area)
    )

    return keywordCount >= 2 || inBusinessArea
  }

  checkRetireesFriendly(property) {
    const retirementKeywords = [
      'quiet', 'peaceful', 'healthcare', 'hospital', 'accessible',
      'ground floor', 'garden', 'mature', 'established', 'serene'
    ]

    const description = `${property.description} ${property.features?.join(' ')}`.toLowerCase()
    const keywordCount = retirementKeywords.filter(keyword => 
      description.includes(keyword)
    ).length

    const retirementAreas = ['karen', 'runda', 'muthaiga', 'lavington']
    const inRetirementArea = retirementAreas.some(area => 
      property.location.toLowerCase().includes(area)
    )

    return keywordCount >= 2 || inRetirementArea
  }

  checkInvestmentPotential(property) {
    // Investment scoring based on:
    // - Location growth potential
    // - Rental yield estimates
    // - Infrastructure development
    const growthAreas = [
      'tatu city', 'konza', 'two rivers', 'garden city',
      'thika road', 'outering road', 'northern bypass'
    ]

    const hasGrowthPotential = growthAreas.some(area =>
      property.location.toLowerCase().includes(area)
    )

    const investmentKeywords = ['commercial', 'rental', 'yield', 'appreciation']
    const description = property.description?.toLowerCase() || ''
    const hasInvestmentFeatures = investmentKeywords.some(keyword =>
      description.includes(keyword)
    )

    return hasGrowthPotential || hasInvestmentFeatures || property.type === 'Commercial'
  }

  // Scoring functions
  calculateLocationScore(property, searchLocation) {
    if (!searchLocation) return 50

    const match = this.checkLocationMatch(property.location, searchLocation, 10)
    return match.score * 100
  }

  calculatePriceCompetitiveness(property) {
    // Compare to market average for similar properties
    const similarProperties = this.properties.filter(p => 
      p.type === property.type && 
      p.bedrooms === property.bedrooms &&
      p.id !== property.id
    )

    if (similarProperties.length === 0) return 50

    const avgPrice = similarProperties.reduce((sum, p) => 
      sum + parseFloat(p.price.replace(/[KSH\s,M]/g, '')), 0
    ) / similarProperties.length

    const propertyPrice = parseFloat(property.price.replace(/[KSH\s,M]/g, ''))
    
    // Lower price = higher competitiveness score
    if (propertyPrice <= avgPrice * 0.9) return 100 // 10% below average
    if (propertyPrice <= avgPrice) return 75
    if (propertyPrice <= avgPrice * 1.1) return 50 // 10% above average
    return 25
  }

  calculateFeatureMatch(property, criteria) {
    let matches = 0
    let total = 0

    // Check each criteria
    if (criteria.propertyType) {
      total++
      if (property.type === criteria.propertyType) matches++
    }

    if (criteria.bedrooms) {
      total++
      const minBed = parseInt(criteria.bedrooms.replace('+', ''))
      if (property.bedrooms >= minBed) matches++
    }

    if (criteria.bathrooms) {
      total++
      const minBath = parseInt(criteria.bathrooms.replace('+', ''))
      if (property.bathrooms >= minBath) matches++
    }

    return total > 0 ? (matches / total) * 100 : 50
  }

  // Sort results
  sortResults(results, sortBy) {
    switch (sortBy) {
      case 'price_low':
        return results.sort((a, b) => 
          parseFloat(a.price.replace(/[KSH\s,M]/g, '')) - 
          parseFloat(b.price.replace(/[KSH\s,M]/g, ''))
        )
      
      case 'price_high':
        return results.sort((a, b) => 
          parseFloat(b.price.replace(/[KSH\s,M]/g, '')) - 
          parseFloat(a.price.replace(/[KSH\s,M]/g, ''))
        )
      
      case 'newest':
        return results.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
      
      case 'relevance':
      default:
        return results.sort((a, b) => b.searchScore - a.searchScore)
    }
  }

  // Helper functions
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateSuggestedFilters(results) {
    const suggestions = {}

    // Analyze results for filter suggestions
    const locations = [...new Set(results.map(p => p.location.split(',')[0]).slice(0, 5))]
    const types = [...new Set(results.map(p => p.type))]
    const priceRanges = this.analyzePriceRanges(results)

    return {
      locations,
      types,
      priceRanges,
      bedrooms: [...new Set(results.map(p => p.bedrooms))].sort(),
      bathrooms: [...new Set(results.map(p => p.bathrooms))].sort()
    }
  }

  generateRecommendations(results, criteria) {
    if (results.length === 0) return []

    // Similar properties based on top result
    const topResult = results[0]
    const similar = this.properties
      .filter(p => 
        p.id !== topResult.id &&
        p.type === topResult.type &&
        Math.abs(p.bedrooms - topResult.bedrooms) <= 1
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    return similar
  }

  analyzePriceRanges(results) {
    const prices = results.map(p => parseFloat(p.price.replace(/[KSH\s,M]/g, '')))
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length

    return { min, max, avg }
  }

  getLocationCoordinates(location) {
    // Mock coordinates - in real app, would use geocoding API
    const mockCoords = {
      'westlands': { lat: -1.2676, lng: 36.8108 },
      'karen': { lat: -1.3197, lng: 36.7046 },
      'cbd': { lat: -1.2921, lng: 36.8219 },
      'kileleshwa': { lat: -1.2921, lng: 36.7833 },
      'runda': { lat: -1.2167, lng: 36.7833 }
    }

    const area = location.toLowerCase().split(',')[0].trim()
    return mockCoords[area] || { lat: -1.2921, lng: 36.8219 } // Default to Nairobi
  }

  calculateDistance(coord1, coord2) {
    // Haversine formula for calculating distance
    const R = 6371 // Earth's radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat)
    const dLng = this.deg2rad(coord2.lng - coord1.lng)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  storeSearch(criteria, resultCount) {
    this.searchHistory.push({
      criteria,
      resultCount,
      timestamp: new Date(),
      searchId: this.generateSearchId()
    })

    // Keep only last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(-50)
    }
  }
}

export default PropertySearchEngine