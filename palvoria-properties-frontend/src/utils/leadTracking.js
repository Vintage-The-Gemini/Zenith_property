// Lead Tracking Utility for Palvoria Properties Frontend
class LeadTracker {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5001/api'
    this.userId = localStorage.getItem('userId')
    this.sessionStartTime = Date.now()
    this.trackingQueue = []
    this.isProcessing = false
    
    this.initializeTracking()
  }

  initializeTracking() {
    // Track page views
    this.trackActivity('property_view', null, {
      page: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date()
    })

    // Track time on site
    this.startTimeTracking()

    // Track exit intent
    this.setupExitIntent()

    // Process queue periodically
    setInterval(() => {
      this.processTrackingQueue()
    }, 5000) // Process every 5 seconds
  }

  // Track various lead activities
  async trackActivity(action, propertyId = null, metadata = {}) {
    if (!this.userId) {
      // Store activity for when user ID becomes available
      this.trackingQueue.push({
        action,
        propertyId,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          sessionId: this.getSessionId()
        },
        queued: true
      })
      return
    }

    const activityData = {
      userId: this.userId,
      action,
      propertyId,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        timeOnPage: this.getTimeOnPage(),
        scrollDepth: this.getScrollDepth()
      }
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/leads/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local lead score if returned
        if (result.success && result.data) {
          this.updateLocalLeadScore(result.data)
        }
      } else {
        // Add to queue for retry if failed
        this.trackingQueue.push(activityData)
      }
    } catch (error) {
      console.error('Failed to track activity:', error)
      // Add to queue for retry
      this.trackingQueue.push(activityData)
    }
  }

  // Specific tracking methods for common activities
  trackPropertyView(propertyId, metadata = {}) {
    return this.trackActivity('property_view', propertyId, {
      ...metadata,
      source: 'property_listing'
    })
  }

  trackPropertySave(propertyId) {
    return this.trackActivity('saved_property', propertyId, {
      action_type: 'save',
      source: 'property_detail'
    })
  }

  trackPropertyUnsave(propertyId) {
    return this.trackActivity('saved_property', propertyId, {
      action_type: 'unsave',
      source: 'property_detail'
    })
  }

  trackMortgageCalculation(propertyId, calculationData) {
    return this.trackActivity('mortgage_calc_use', propertyId, {
      ...calculationData,
      source: 'mortgage_calculator'
    })
  }

  trackContactForm(propertyId, formData) {
    return this.trackActivity('contact_form', propertyId, {
      contact_method: formData.method || 'email',
      message_length: formData.message?.length || 0,
      source: 'contact_form'
    })
  }

  trackPhoneCallRequest(propertyId) {
    return this.trackActivity('phone_call_request', propertyId, {
      source: 'property_detail'
    })
  }

  trackPropertyInquiry(propertyId, inquiryData) {
    return this.trackActivity('property_inquiry', propertyId, {
      inquiry_type: inquiryData.type || 'general',
      source: 'property_detail'
    })
  }

  trackSearch(searchQuery, results) {
    return this.trackActivity('property_search', null, {
      query: searchQuery,
      results_count: results.length,
      filters_used: Object.keys(searchQuery.filters || {}),
      source: 'search_page'
    })
  }

  trackVirtualTour(propertyId, tourData) {
    return this.trackActivity('virtual_tour', propertyId, {
      tour_duration: tourData.duration,
      rooms_viewed: tourData.roomsViewed || [],
      completion_percentage: tourData.completionPercentage || 0,
      source: 'virtual_tour'
    })
  }

  trackNewsletterSignup(source = 'footer') {
    return this.trackActivity('newsletter_signup', null, {
      source,
      signup_location: source
    })
  }

  trackPriceAlertSignup(propertyId) {
    return this.trackActivity('price_alert_signup', propertyId, {
      source: 'property_detail'
    })
  }

  // Email interaction tracking
  trackEmailOpen(emailId, campaignId) {
    return this.trackActivity('email_open', null, {
      email_id: emailId,
      campaign_id: campaignId,
      source: 'email'
    })
  }

  trackEmailClick(emailId, campaignId, linkUrl) {
    return this.trackActivity('email_click', null, {
      email_id: emailId,
      campaign_id: campaignId,
      link_url: linkUrl,
      source: 'email'
    })
  }

  // Set user ID after email capture or login
  setUserId(userId) {
    this.userId = userId
    localStorage.setItem('userId', userId)
    
    // Process any queued activities
    this.processTrackingQueue()
  }

  // Get current lead score
  async getLeadScore() {
    if (!this.userId) return null

    try {
      const response = await fetch(`${this.apiBaseUrl}/leads/${this.userId}/score`)
      if (response.ok) {
        const result = await response.json()
        return result.success ? result.data : null
      }
    } catch (error) {
      console.error('Failed to get lead score:', error)
    }
    return null
  }

  // Process queued tracking activities
  async processTrackingQueue() {
    if (this.isProcessing || this.trackingQueue.length === 0 || !this.userId) {
      return
    }

    this.isProcessing = true

    const batch = this.trackingQueue.splice(0, 10) // Process up to 10 at a time

    for (const activity of batch) {
      try {
        // Remove queued flag and update user ID
        delete activity.queued
        activity.userId = this.userId

        const response = await fetch(`${this.apiBaseUrl}/leads/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activity)
        })

        if (!response.ok) {
          // Re-queue if failed
          this.trackingQueue.push(activity)
        }
      } catch (error) {
        // Re-queue if failed
        this.trackingQueue.push(activity)
      }
    }

    this.isProcessing = false
  }

  // Utility methods
  getSessionId() {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  getTimeOnPage() {
    return Date.now() - this.sessionStartTime
  }

  getScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0
  }

  startTimeTracking() {
    // Track time milestones
    const milestones = [30, 60, 120, 300] // 30s, 1m, 2m, 5m
    
    milestones.forEach(seconds => {
      setTimeout(() => {
        this.trackActivity('time_on_site', null, {
          milestone: `${seconds}s`,
          total_time: this.getTimeOnPage(),
          source: 'time_tracking'
        })
      }, seconds * 1000)
    })
  }

  setupExitIntent() {
    let hasTriggered = false
    
    const handleMouseLeave = (e) => {
      if (!hasTriggered && e.clientY <= 0) {
        hasTriggered = true
        this.trackActivity('exit_intent', null, {
          time_on_page: this.getTimeOnPage(),
          scroll_depth: this.getScrollDepth(),
          source: 'exit_intent'
        })
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackActivity('page_exit', null, {
        time_on_page: this.getTimeOnPage(),
        scroll_depth: this.getScrollDepth(),
        source: 'page_unload'
      })
    })
  }

  updateLocalLeadScore(scoreData) {
    localStorage.setItem('leadScore', JSON.stringify(scoreData))
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('leadScoreUpdated', {
      detail: scoreData
    }))
  }

  // Get analytics for current user
  getLocalAnalytics() {
    const sessionId = this.getSessionId()
    const timeOnSite = this.getTimeOnPage()
    const scrollDepth = this.getScrollDepth()
    const pageViews = parseInt(localStorage.getItem('pageViews') || '0')
    
    return {
      sessionId,
      userId: this.userId,
      timeOnSite,
      scrollDepth,
      pageViews,
      queuedActivities: this.trackingQueue.length
    }
  }
}

// Create global instance
const leadTracker = new LeadTracker()

// Convenience functions for easy importing
export const trackPropertyView = (propertyId, metadata) => leadTracker.trackPropertyView(propertyId, metadata)
export const trackPropertySave = (propertyId) => leadTracker.trackPropertySave(propertyId)
export const trackPropertyUnsave = (propertyId) => leadTracker.trackPropertyUnsave(propertyId)
export const trackMortgageCalculation = (propertyId, data) => leadTracker.trackMortgageCalculation(propertyId, data)
export const trackContactForm = (propertyId, formData) => leadTracker.trackContactForm(propertyId, formData)
export const trackPhoneCallRequest = (propertyId) => leadTracker.trackPhoneCallRequest(propertyId)
export const trackSearch = (query, results) => leadTracker.trackSearch(query, results)
export const trackVirtualTour = (propertyId, tourData) => leadTracker.trackVirtualTour(propertyId, tourData)
export const trackNewsletterSignup = (source) => leadTracker.trackNewsletterSignup(source)
export const setUserId = (userId) => leadTracker.setUserId(userId)
export const getLeadScore = () => leadTracker.getLeadScore()
export const getLocalAnalytics = () => leadTracker.getLocalAnalytics()

export default leadTracker