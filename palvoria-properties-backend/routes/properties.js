import express from 'express'
import { body, validationResult, query } from 'express-validator'
import logger from '../utils/logger.js'

const router = express.Router()

// In-memory storage for demo (replace with database in production)
let properties = [
  {
    id: 1,
    title: '4BR Villa in Karen',
    description: 'Luxurious 4-bedroom villa in the prestigious Karen area. Features include a swimming pool, manicured garden, and modern finishes throughout. Perfect for families seeking elegance and comfort.',
    location: 'Karen, Nairobi',
    price: 'KSH 65,000,000',
    type: 'Villa',
    bedrooms: 4,
    bathrooms: 3,
    area: '3500 sqft',
    yearBuilt: '2020',
    features: ['Swimming Pool', 'Garden', 'Parking', 'Security', 'Gym', 'Backup Generator'],
    status: 'Available',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
    ],
    coordinates: { lat: '-1.3197', lng: '36.7046' },
    contactAgent: 'Sarah Wanjiku',
    agentPhone: '+254-700-123-456',
    agentEmail: 'sarah@palvoriaproperties.com',
    views: 234,
    inquiries: 12,
    dateAdded: '2025-01-15T10:00:00Z',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z')
  },
  {
    id: 2,
    title: '3BR Apartment in Kilimani',
    description: 'Modern 3-bedroom apartment in the heart of Kilimani. Close to shopping centers, restaurants, and business district. Excellent for young professionals.',
    location: 'Kilimani, Nairobi',
    price: 'KSH 28,500,000',
    type: 'Apartment',
    bedrooms: 3,
    bathrooms: 2,
    area: '1800 sqft',
    yearBuilt: '2018',
    features: ['Elevator', 'Parking', 'Security', 'WiFi', 'Balcony'],
    status: 'Available',
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
    ],
    coordinates: { lat: '-1.3057', lng: '36.7885' },
    contactAgent: 'Michael Ochieng',
    agentPhone: '+254-700-123-457',
    agentEmail: 'michael@palvoriaproperties.com',
    views: 156,
    inquiries: 8,
    dateAdded: '2025-01-10T14:30:00Z',
    createdAt: new Date('2025-01-10T14:30:00Z'),
    updatedAt: new Date('2025-01-10T14:30:00Z')
  },
  {
    id: 3,
    title: '2BR Penthouse in Westlands',
    description: 'Stunning penthouse with panoramic city views. Premium finishes, spacious layout, and exclusive amenities. Located in the vibrant Westlands area.',
    location: 'Westlands, Nairobi',
    price: 'KSH 45,000,000',
    type: 'Penthouse',
    bedrooms: 2,
    bathrooms: 2,
    area: '2200 sqft',
    yearBuilt: '2019',
    features: ['City View', 'Balcony', 'Elevator', 'Parking', 'Security', 'Air Conditioning'],
    status: 'Available',
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop'
    ],
    coordinates: { lat: '-1.2676', lng: '36.8108' },
    contactAgent: 'Grace Mutindi',
    agentPhone: '+254-700-123-458',
    agentEmail: 'grace@palvoriaproperties.com',
    views: 189,
    inquiries: 15,
    dateAdded: '2025-01-08T09:15:00Z',
    createdAt: new Date('2025-01-08T09:15:00Z'),
    updatedAt: new Date('2025-01-08T09:15:00Z')
  }
]

let nextId = 4

// GET /api/properties - Get all properties with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
  query('status').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('search').optional().isString()
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const {
      page = 1,
      limit = 20,
      type,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      search,
      featured
    } = req.query

    let filteredProperties = [...properties]

    // Apply filters
    if (type) {
      filteredProperties = filteredProperties.filter(p => 
        p.type.toLowerCase() === type.toLowerCase()
      )
    }

    if (status) {
      filteredProperties = filteredProperties.filter(p => 
        p.status.toLowerCase() === status.toLowerCase()
      )
    }

    if (featured === 'true') {
      filteredProperties = filteredProperties.filter(p => p.featured)
    }

    if (bedrooms) {
      filteredProperties = filteredProperties.filter(p => 
        p.bedrooms >= parseInt(bedrooms)
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredProperties = filteredProperties.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }

    // Price filtering (extract numbers from price string)
    if (minPrice || maxPrice) {
      filteredProperties = filteredProperties.filter(p => {
        const price = parseFloat(p.price.replace(/[^0-9.]/g, ''))
        if (minPrice && price < parseFloat(minPrice)) return false
        if (maxPrice && price > parseFloat(maxPrice)) return false
        return true
      })
    }

    // Sort by featured first, then by date added
    filteredProperties.sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return new Date(b.dateAdded) - new Date(a.dateAdded)
    })

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit)
    const endIndex = startIndex + parseInt(limit)
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex)

    // Log property views for analytics
    logger.info('Properties retrieved', {
      total: filteredProperties.length,
      page: parseInt(page),
      limit: parseInt(limit),
      filters: { type, status, bedrooms, search, featured }
    })

    res.json({
      success: true,
      data: {
        properties: paginatedProperties,
        pagination: {
          total: filteredProperties.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredProperties.length / parseInt(limit))
        },
        filters: {
          types: [...new Set(properties.map(p => p.type))],
          statuses: [...new Set(properties.map(p => p.status))],
          locations: [...new Set(properties.map(p => p.location.split(',')[0].trim()))]
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching properties:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties'
    })
  }
})

// GET /api/properties/:id - Get single property
router.get('/:id', (req, res) => {
  try {
    const property = properties.find(p => p.id === parseInt(req.params.id))

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    // Increment view count (in production, this would be more sophisticated)
    property.views = (property.views || 0) + 1

    // Log property view
    logger.info('Property viewed', {
      propertyId: property.id,
      title: property.title,
      views: property.views
    })

    res.json({
      success: true,
      data: property
    })

  } catch (error) {
    logger.error('Error fetching property:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property'
    })
  }
})

// POST /api/properties - Create new property
router.post('/', [
  body('title').notEmpty().trim().isLength({ min: 10, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('location').notEmpty().trim(),
  body('price').notEmpty(),
  body('type').notEmpty().isIn(['Apartment', 'House', 'Villa', 'Penthouse', 'Townhouse', 'Studio', 'Commercial', 'Land', 'Office']),
  body('bedrooms').isInt({ min: 0, max: 50 }),
  body('bathrooms').isInt({ min: 0, max: 50 }),
  body('status').optional().isIn(['Available', 'Sold', 'Rented', 'Pending', 'Off Market']),
  body('featured').optional().isBoolean(),
  body('features').optional().isArray(),
  body('images').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const propertyData = {
      id: nextId++,
      ...req.body,
      views: 0,
      inquiries: 0,
      dateAdded: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    properties.push(propertyData)

    logger.info('Property created', {
      propertyId: propertyData.id,
      title: propertyData.title,
      location: propertyData.location,
      price: propertyData.price
    })

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: propertyData
    })

  } catch (error) {
    logger.error('Error creating property:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create property'
    })
  }
})

// PUT /api/properties/:id - Update property
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 10, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('location').optional().trim(),
  body('price').optional(),
  body('type').optional().isIn(['Apartment', 'House', 'Villa', 'Penthouse', 'Townhouse', 'Studio', 'Commercial', 'Land', 'Office']),
  body('bedrooms').optional().isInt({ min: 0, max: 50 }),
  body('bathrooms').optional().isInt({ min: 0, max: 50 }),
  body('status').optional().isIn(['Available', 'Sold', 'Rented', 'Pending', 'Off Market']),
  body('featured').optional().isBoolean(),
  body('features').optional().isArray(),
  body('images').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const propertyIndex = properties.findIndex(p => p.id === parseInt(req.params.id))

    if (propertyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    // Update property
    properties[propertyIndex] = {
      ...properties[propertyIndex],
      ...req.body,
      updatedAt: new Date()
    }

    logger.info('Property updated', {
      propertyId: properties[propertyIndex].id,
      title: properties[propertyIndex].title,
      changes: Object.keys(req.body)
    })

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: properties[propertyIndex]
    })

  } catch (error) {
    logger.error('Error updating property:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update property'
    })
  }
})

// DELETE /api/properties/:id - Delete property
router.delete('/:id', async (req, res) => {
  try {
    const propertyIndex = properties.findIndex(p => p.id === parseInt(req.params.id))

    if (propertyIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    const deletedProperty = properties[propertyIndex]
    properties.splice(propertyIndex, 1)

    logger.info('Property deleted', {
      propertyId: deletedProperty.id,
      title: deletedProperty.title
    })

    res.json({
      success: true,
      message: 'Property deleted successfully',
      data: deletedProperty
    })

  } catch (error) {
    logger.error('Error deleting property:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete property'
    })
  }
})

// GET /api/properties/:id/analytics - Get property analytics
router.get('/:id/analytics', (req, res) => {
  try {
    const property = properties.find(p => p.id === parseInt(req.params.id))

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    const analytics = {
      views: property.views || 0,
      inquiries: property.inquiries || 0,
      conversionRate: property.views > 0 ? ((property.inquiries || 0) / property.views * 100).toFixed(2) : 0,
      daysOnMarket: Math.floor((new Date() - new Date(property.dateAdded)) / (1000 * 60 * 60 * 24)),
      status: property.status,
      featured: property.featured
    }

    res.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    logger.error('Error fetching property analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    })
  }
})

// POST /api/properties/:id/inquiry - Record property inquiry
router.post('/:id/inquiry', [
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().trim(),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const property = properties.find(p => p.id === parseInt(req.params.id))

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      })
    }

    // Increment inquiry count
    property.inquiries = (property.inquiries || 0) + 1

    const inquiry = {
      id: `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      propertyId: property.id,
      ...req.body,
      timestamp: new Date(),
      status: 'new'
    }

    logger.info('Property inquiry received', {
      propertyId: property.id,
      inquiryId: inquiry.id,
      email: inquiry.email
    })

    res.json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        inquiryId: inquiry.id,
        propertyTitle: property.title,
        agentContact: {
          name: property.contactAgent,
          phone: property.agentPhone,
          email: property.agentEmail
        }
      }
    })

  } catch (error) {
    logger.error('Error processing inquiry:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry'
    })
  }
})

// GET /api/properties/stats/overview - Get overall property statistics
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      totalProperties: properties.length,
      availableProperties: properties.filter(p => p.status === 'Available').length,
      soldProperties: properties.filter(p => p.status === 'Sold').length,
      rentedProperties: properties.filter(p => p.status === 'Rented').length,
      pendingProperties: properties.filter(p => p.status === 'Pending').length,
      featuredProperties: properties.filter(p => p.featured).length,
      totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
      totalInquiries: properties.reduce((sum, p) => sum + (p.inquiries || 0), 0),
      averagePrice: properties.length > 0 ? 
        properties.reduce((sum, p) => {
          const price = parseFloat(p.price.replace(/[^0-9.]/g, ''))
          return sum + price
        }, 0) / properties.length : 0,
      propertyTypes: properties.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1
        return acc
      }, {}),
      locationDistribution: properties.reduce((acc, p) => {
        const location = p.location.split(',')[0].trim()
        acc[location] = (acc[location] || 0) + 1
        return acc
      }, {})
    }

    stats.conversionRate = stats.totalViews > 0 ? 
      ((stats.totalInquiries / stats.totalViews) * 100).toFixed(2) : 0

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logger.error('Error fetching property stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    })
  }
})

export default router