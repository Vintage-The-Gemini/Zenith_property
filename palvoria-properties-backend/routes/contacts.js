import express from 'express'
import { body, validationResult } from 'express-validator'
import Contact from '../models/Contact.js'
import logger from '../utils/logger.js'

const router = express.Router()

// @desc    Submit contact form
// @route   POST /api/contacts
// @access  Public
export const submitContact = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { firstName, lastName, email, phone, subject, message } = req.body

    // Create contact submission
    const contactData = {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referrer') || req.get('Referer')
    }

    const contact = new Contact(contactData)
    await contact.save()

    logger.info('Contact form submitted successfully', {
      contactId: contact._id,
      email: contact.email,
      subject: contact.subject
    })

    res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    })

  } catch (error) {
    logger.error('Contact form submission failed:', error)

    // Handle duplicate email (if we want to prevent spam)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A submission with this email already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing your message'
    })
  }
}

// @desc    Get all contact submissions (Admin only)
// @route   GET /api/contacts
// @access  Admin
export const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Build filter object
    const filter = {}

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status
    }

    // Filter by subject
    if (req.query.subject) {
      filter.subject = req.query.subject
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {}
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate)
      }
    }

    // Text search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i')
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { message: searchRegex }
      ]
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')

    const total = await Contact.countDocuments(filter)

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Get contacts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    })
  }
}

// @desc    Get single contact submission
// @route   GET /api/contacts/:id
// @access  Admin
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      })
    }

    res.json({
      success: true,
      data: contact
    })

  } catch (error) {
    logger.error('Get contact error:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching contact'
    })
  }
}

// @desc    Update contact status/notes
// @route   PUT /api/contacts/:id
// @access  Admin
export const updateContact = async (req, res) => {
  try {
    const { status, notes, assignedTo, followUpDate, priority } = req.body

    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      })
    }

    // Update fields
    if (status) contact.status = status
    if (assignedTo) contact.assignedTo = assignedTo
    if (followUpDate) contact.followUpDate = followUpDate
    if (priority) contact.priority = priority

    // Add note if provided
    if (notes) {
      contact.notes.push({
        content: notes,
        addedBy: req.user?.name || 'admin', // Assumes auth middleware
        addedAt: new Date()
      })
    }

    await contact.save()

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    })

  } catch (error) {
    logger.error('Update contact error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while updating contact'
    })
  }
}

// @desc    Delete contact submission
// @route   DELETE /api/contacts/:id
// @access  Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      })
    }

    await Contact.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    })

  } catch (error) {
    logger.error('Delete contact error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while deleting contact'
    })
  }
}

// @desc    Get contact analytics
// @route   GET /api/contacts/analytics
// @access  Admin
export const getContactAnalytics = async (req, res) => {
  try {
    const analytics = await Contact.aggregate([
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          subjectCounts: [
            { $group: { _id: '$subject', count: { $sum: 1 } } }
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          totalContacts: [
            { $count: 'total' }
          ],
          recentContacts: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                email: 1,
                subject: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ])

    const result = analytics[0]

    res.json({
      success: true,
      data: {
        statusCounts: result.statusCounts,
        subjectCounts: result.subjectCounts,
        monthlyTrend: result.monthlyTrend,
        totalContacts: result.totalContacts[0]?.total || 0,
        recentContacts: result.recentContacts
      }
    })

  } catch (error) {
    logger.error('Contact analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    })
  }
}

// Routes with validation
router.post('/', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('subject').isIn(['general', 'buying', 'selling', 'renting', 'commercial', 'investment']).withMessage('Invalid subject'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters')
], submitContact)

router.get('/', getContacts)
router.get('/analytics', getContactAnalytics)
router.get('/:id', getContact)
router.put('/:id', updateContact)
router.delete('/:id', deleteContact)

export default router