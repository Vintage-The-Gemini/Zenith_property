import express from 'express'
import { body, validationResult } from 'express-validator'
import leadScoringService from '../services/leadScoringService.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Email capture endpoint
router.post('/capture', [
  body('email').isEmail().normalizeEmail(),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().trim(),
  body('source').optional().trim(),
  body('campaign').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email, name, phone, source = 'website', campaign = 'general' } = req.body
    const userId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    // Process lead activity
    const result = await leadScoringService.processLeadActivity(userId, {
      action: 'email_capture',
      email,
      name,
      phone,
      source,
      campaign,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referrer: req.get('Referrer')
      }
    })

    logger.info('Email captured successfully', {
      userId,
      email,
      name,
      source,
      campaign
    })

    res.json({
      success: true,
      message: 'Email captured successfully',
      data: {
        userId,
        leadScore: result.newScore,
        category: result.category
      }
    })

  } catch (error) {
    logger.error('Email capture failed:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process email capture'
    })
  }
})

// Track lead activity
router.post('/activity', [
  body('userId').notEmpty(),
  body('action').notEmpty(),
  body('propertyId').optional(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { userId, action, propertyId, metadata = {} } = req.body

    const result = await leadScoringService.processLeadActivity(userId, {
      action,
      propertyId,
      metadata: {
        ...metadata,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referrer: req.get('Referrer')
      }
    })

    res.json({
      success: true,
      message: 'Activity tracked successfully',
      data: result
    })

  } catch (error) {
    logger.error('Activity tracking failed:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to track activity'
    })
  }
})

// Get lead score and profile
router.get('/:userId/score', (req, res) => {
  try {
    const { userId } = req.params
    const profile = leadScoringService.getLeadProfile(userId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Lead profile not found'
      })
    }

    res.json({
      success: true,
      data: {
        userId: profile.userId,
        totalScore: profile.totalScore,
        category: profile.category,
        lastActivity: profile.lastActivity,
        activitiesCount: profile.activities.length,
        automationStatus: profile.automationStatus
      }
    })

  } catch (error) {
    logger.error('Failed to get lead score:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead score'
    })
  }
})

// Get all leads (admin/agent only)
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0

    const result = leadScoringService.getAllLeads(limit, offset)

    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('Failed to get leads:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads'
    })
  }
})

// Get lead analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = leadScoringService.getLeadAnalytics()

    res.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    logger.error('Failed to get lead analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    })
  }
})

// Manual email trigger (for testing)
router.post('/email/welcome', [
  body('userId').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { userId, email, name } = req.body

    const result = await leadScoringService.triggerWelcomeEmail(userId, email, name)

    res.json({
      success: true,
      message: 'Welcome email sent successfully',
      data: result
    })

  } catch (error) {
    logger.error('Failed to send welcome email:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error.message
    })
  }
})

export default router