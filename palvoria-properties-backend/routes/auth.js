import express from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
router.post('/admin-login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Check if user exists and get password field
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Please try again later.'
      })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts()
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = user.getSignedJwtToken()

    // Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    })
  }
})

// @desc    Verify JWT Token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', async (req, res) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid'
      })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    })

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalid'
    })
  }
})

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
})

export default router