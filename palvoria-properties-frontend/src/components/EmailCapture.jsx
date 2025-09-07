import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  EnvelopeIcon,
  CheckCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline'

class LeadScoringEngine {
  constructor() {
    this.baseScore = 50
    this.scoringRules = {
      property_view: 5,
      saved_property: 10,
      mortgage_calc_use: 15,
      contact_form: 25,
      phone_call_request: 30,
      email_provided: 20,
      return_visit: 8,
      time_on_site: 0.1, // per second
      newsletter_signup: 15
    }
  }

  calculateScore(actions) {
    let score = this.baseScore
    
    actions.forEach(action => {
      const points = this.scoringRules[action.type] || 0
      const multiplier = action.count || 1
      score += points * multiplier
    })

    // Time-based scoring
    if (actions.timeOnSite) {
      score += actions.timeOnSite * this.scoringRules.time_on_site
    }

    return Math.min(score, 100) // Cap at 100
  }

  categorizeScore(score) {
    if (score > 80) return { level: 'HOT', color: 'red', priority: 'high' }
    if (score >= 50) return { level: 'WARM', color: 'yellow', priority: 'medium' }
    return { level: 'COLD', color: 'blue', priority: 'low' }
  }
}

const EmailCapture = ({ 
  trigger = 'exit_intent', 
  delay = 30000, 
  showAfterPages = 3,
  onCapture,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [userActions, setUserActions] = useState([])
  const [leadScore, setLeadScore] = useState(50)
  const [preferences, setPreferences] = useState({
    propertyType: '',
    location: '',
    priceRange: '',
    newsletter: true
  })

  const leadScorer = new LeadScoringEngine()

  useEffect(() => {
    // Track user behavior for lead scoring
    const trackingData = {
      sessionStart: Date.now(),
      pageViews: parseInt(localStorage.getItem('pageViews') || '0') + 1,
      timeOnSite: 0,
      actions: JSON.parse(localStorage.getItem('userActions') || '[]')
    }

    localStorage.setItem('pageViews', trackingData.pageViews.toString())

    // Show modal based on trigger conditions
    const shouldShow = () => {
      // Don't show if already dismissed recently
      const dismissed = localStorage.getItem('emailCaptureDissmissed')
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
        return false
      }

      // Don't show if email already captured
      const captured = localStorage.getItem('emailCaptured')
      if (captured) return false

      // Show based on page views
      if (trigger === 'page_views' && trackingData.pageViews >= showAfterPages) {
        return true
      }

      return false
    }

    // Exit intent detection
    const handleMouseLeave = (e) => {
      if (trigger === 'exit_intent' && e.clientY <= 0 && !isVisible) {
        setIsVisible(true)
      }
    }

    // Time-based trigger
    const timeoutId = trigger === 'time_delay' ? setTimeout(() => {
      if (shouldShow()) setIsVisible(true)
    }, delay) : null

    if (trigger === 'page_views' && shouldShow()) {
      setTimeout(() => setIsVisible(true), 2000) // Small delay for better UX
    }

    if (trigger === 'exit_intent') {
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    // Update lead score based on current session
    const updateScore = () => {
      const actions = [
        { type: 'property_view', count: trackingData.pageViews },
        { type: 'return_visit', count: Math.max(0, trackingData.pageViews - 1) },
        ...trackingData.actions
      ]

      const score = leadScorer.calculateScore({
        ...trackingData,
        actions
      })

      setLeadScore(score)
    }

    updateScore()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (trigger === 'exit_intent') {
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [trigger, delay, showAfterPages, isVisible])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate email capture API call
      const leadData = {
        email,
        preferences,
        leadScore,
        source: trigger,
        timestamp: new Date().toISOString(),
        sessionData: {
          pageViews: parseInt(localStorage.getItem('pageViews') || '0'),
          timeOnSite: Date.now() - JSON.parse(localStorage.getItem('sessionStart') || Date.now().toString()),
          referrer: document.referrer,
          userAgent: navigator.userAgent
        }
      }

      // In real implementation, this would call your backend API
      await simulateAPICall(leadData)

      // Store capture status
      localStorage.setItem('emailCaptured', 'true')
      localStorage.setItem('leadData', JSON.stringify(leadData))

      // Trigger automation sequence
      await triggerEmailAutomation(leadData)

      setIsSuccess(true)
      
      // Callback for parent component
      if (onCapture) {
        onCapture(leadData)
      }

      // Auto-close after success
      setTimeout(() => {
        handleClose()
      }, 3000)

    } catch (error) {
      console.error('Email capture failed:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    localStorage.setItem('emailCaptureDissmissed', Date.now().toString())
    setIsVisible(false)
    if (onClose) onClose()
  }

  const simulateAPICall = async (data) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log('Lead captured:', data)
    return { success: true, leadId: `lead_${Date.now()}` }
  }

  const triggerEmailAutomation = async (leadData) => {
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    const automationSequence = {
      day1: {
        template: 'welcome',
        subject: 'Welcome to Palvoria Properties Kenya!',
        delay: 0
      },
      day3: {
        template: 'market_insights', 
        subject: 'Kenya Property Market Insights - Week of {date}',
        delay: 3 * 24 * 60 * 60 * 1000
      },
      day7: {
        template: 'agent_introduction',
        subject: 'Meet Your Personal Property Expert',
        delay: 7 * 24 * 60 * 60 * 1000
      },
      day14: {
        template: 'property_recommendations',
        subject: 'Properties Matching Your Preferences',
        delay: 14 * 24 * 60 * 60 * 1000
      }
    }

    // Store automation sequence for processing
    localStorage.setItem('emailAutomation', JSON.stringify({
      leadId: leadData.email,
      sequence: automationSequence,
      status: 'active'
    }))

    console.log('Email automation triggered for:', leadData.email)
  }

  const getIncentiveOffer = () => {
    const offers = [
      {
        title: 'Free Market Report',
        description: 'Get exclusive insights into Kenya\'s real estate market trends',
        icon: '📊'
      },
      {
        title: 'Property Alerts',
        description: 'Be the first to know about new properties in your preferred areas',
        icon: '🏠'
      },
      {
        title: 'Free Consultation',
        description: 'Schedule a complimentary session with our property experts',
        icon: '💬'
      }
    ]

    return offers[Math.floor(Math.random() * offers.length)]
  }

  const incentive = getIncentiveOffer()

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center mb-4">
              <GiftIcon className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Exclusive Offer!</h2>
                <p className="text-primary-100 text-sm">Join 1,200+ Happy Property Owners</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isSuccess ? (
              <>
                {/* Incentive */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{incentive.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {incentive.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {incentive.description}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Quick Preferences */}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={preferences.propertyType}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        propertyType: e.target.value
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Property Type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Commercial">Commercial</option>
                    </select>

                    <select
                      value={preferences.location}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        location: e.target.value
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Location</option>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Nakuru">Nakuru</option>
                    </select>
                  </div>

                  <select
                    value={preferences.priceRange}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      priceRange: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Budget Range</option>
                    <option value="Under KSH 30M">Under KSH 30M</option>
                    <option value="KSH 30M - 50M">KSH 30M - 50M</option>
                    <option value="KSH 50M - 70M">KSH 50M - 70M</option>
                    <option value="Over KSH 70M">Over KSH 70M</option>
                  </select>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newsletter"
                      checked={preferences.newsletter}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        newsletter: e.target.checked
                      }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                      Send me weekly market updates and new property alerts
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Securing Your Offer...' : `Get My ${incentive.title}`}
                  </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  No spam, ever. We respect your privacy and you can unsubscribe anytime.
                </p>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Palvoria Properties!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your {incentive.title.toLowerCase()} is on its way to your inbox.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Exclusive market insights<br/>
                    ✓ Priority property alerts<br/>
                    ✓ Free expert consultation
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmailCapture