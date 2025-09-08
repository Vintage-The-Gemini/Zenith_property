import logger from '../utils/logger.js'
import emailService from './emailService.js'

class LeadScoringService {
  constructor() {
    this.scoreWeights = {
      property_view: 5,
      saved_property: 10,
      mortgage_calc_use: 15,
      contact_form: 25,
      phone_call_request: 30,
      email_open: 2,
      email_click: 5,
      return_visit: 3,
      time_on_site: 1, // per minute
      property_inquiry: 20,
      agent_chat: 15,
      virtual_tour: 12,
      price_alert_signup: 8,
      newsletter_signup: 6,
      profile_completion: 10
    }
    
    this.leadCategories = {
      COLD: { min: 0, max: 49, color: '#6c757d' },
      WARM: { min: 50, max: 79, color: '#ffc107' },
      HOT: { min: 80, max: 150, color: '#dc3545' }
    }
    
    this.automationTriggers = {
      welcome_sequence: { delay: 0 }, // Immediate
      market_insights: { delay: 3 * 24 * 60 * 60 * 1000 }, // 3 days
      agent_introduction: { delay: 7 * 24 * 60 * 60 * 1000 }, // 7 days
      property_recommendations: { delay: 14 * 24 * 60 * 60 * 1000 }, // 14 days
      market_report: { delay: 30 * 24 * 60 * 60 * 1000 } // 30 days
    }
    
    this.leadDatabase = new Map() // In production, this would be a real database
    this.automationQueue = new Map()
    
    this.initialize()
  }

  async initialize() {
    // Start automation processor
    this.startAutomationProcessor()
    
    // Initialize email service
    await emailService.initialize()
    
    logger.info('Lead Scoring Service initialized successfully')
  }

  // Calculate lead score based on activities
  calculateLeadScore(activities = []) {
    let totalScore = 50 // Base score
    
    activities.forEach(activity => {
      const weight = this.scoreWeights[activity.action] || 0
      let score = weight
      
      // Apply time decay - recent activities worth more
      const daysSinceActivity = (Date.now() - new Date(activity.timestamp)) / (1000 * 60 * 60 * 24)
      const decayFactor = Math.max(0.5, 1 - (daysSinceActivity * 0.1)) // 10% decay per day, minimum 50%
      
      score *= decayFactor
      
      // Apply frequency bonus - repeated actions get diminishing returns
      const sameActionCount = activities.filter(a => a.action === activity.action).length
      if (sameActionCount > 1) {
        const frequencyFactor = Math.max(0.3, 1 - ((sameActionCount - 1) * 0.1)) // Diminishing returns
        score *= frequencyFactor
      }
      
      totalScore += score
    })
    
    return Math.min(150, Math.max(0, Math.round(totalScore))) // Cap at 150, minimum 0
  }

  // Get lead category based on score
  getLeadCategory(score) {
    for (const [category, range] of Object.entries(this.leadCategories)) {
      if (score >= range.min && score <= range.max) {
        return { category, ...range }
      }
    }
    return { category: 'UNKNOWN', min: 0, max: 0, color: '#000000' }
  }

  // Process new lead activity
  async processLeadActivity(userId, activity) {
    try {
      // Get or create lead profile
      let leadProfile = this.leadDatabase.get(userId) || {
        userId,
        email: activity.email,
        name: activity.name,
        phone: activity.phone,
        createdAt: new Date(),
        lastActivity: new Date(),
        totalScore: 50,
        activities: [],
        automationStatus: {},
        preferences: {},
        assignedAgent: null
      }

      // Add new activity
      leadProfile.activities.push({
        ...activity,
        timestamp: new Date(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      })

      // Update last activity
      leadProfile.lastActivity = new Date()

      // Recalculate score
      const newScore = this.calculateLeadScore(leadProfile.activities)
      const oldScore = leadProfile.totalScore
      leadProfile.totalScore = newScore

      // Get lead categories
      const oldCategory = this.getLeadCategory(oldScore).category
      const newCategory = this.getLeadCategory(newScore).category

      // Save updated profile
      this.leadDatabase.set(userId, leadProfile)

      // Log score change
      logger.info(`Lead score updated for user ${userId}: ${oldScore} -> ${newScore} (${newCategory})`, {
        userId,
        action: activity.action,
        scoreChange: newScore - oldScore,
        category: newCategory
      })

      // Trigger automations based on score milestones
      await this.checkAutomationTriggers(leadProfile, oldScore, newScore)

      // Notify agents if lead became hot
      if (oldCategory !== 'HOT' && newCategory === 'HOT') {
        await this.notifyAgentsOfHotLead(leadProfile)
      }

      return {
        userId,
        previousScore: oldScore,
        newScore,
        category: newCategory,
        scoreIncrease: newScore - oldScore
      }

    } catch (error) {
      logger.error('Error processing lead activity:', error)
      throw error
    }
  }

  // Check and trigger automations
  async checkAutomationTriggers(leadProfile, oldScore, newScore) {
    try {
      // New lead welcome sequence
      if (!leadProfile.automationStatus.welcome_sequence && leadProfile.email) {
        await this.scheduleAutomation(leadProfile, 'welcome_sequence')
      }

      // Score-based triggers
      if (newScore >= 80 && oldScore < 80) {
        // Became hot lead - immediate agent assignment
        await this.assignAgentToLead(leadProfile)
      }

      if (newScore >= 50 && oldScore < 50 && !leadProfile.automationStatus.agent_introduction) {
        // Became warm lead - introduce agent
        await this.scheduleAutomation(leadProfile, 'agent_introduction')
      }

      // Activity-based triggers
      const recentMortgageCalc = leadProfile.activities.some(a => 
        a.action === 'mortgage_calc_use' && 
        (Date.now() - new Date(a.timestamp)) < 24 * 60 * 60 * 1000 // Within 24 hours
      )

      if (recentMortgageCalc && !leadProfile.automationStatus.property_recommendations) {
        await this.scheduleAutomation(leadProfile, 'property_recommendations')
      }

    } catch (error) {
      logger.error('Error checking automation triggers:', error)
    }
  }

  // Schedule email automation
  async scheduleAutomation(leadProfile, automationType) {
    try {
      if (!leadProfile.email) {
        logger.warn(`Cannot schedule ${automationType} for user ${leadProfile.userId}: no email`)
        return
      }

      const trigger = this.automationTriggers[automationType]
      const scheduleTime = Date.now() + trigger.delay

      // Add to automation queue
      const automationId = `${leadProfile.userId}_${automationType}_${Date.now()}`
      
      this.automationQueue.set(automationId, {
        id: automationId,
        userId: leadProfile.userId,
        type: automationType,
        scheduledFor: scheduleTime,
        leadData: {
          email: leadProfile.email,
          name: leadProfile.name,
          score: leadProfile.totalScore,
          category: this.getLeadCategory(leadProfile.totalScore).category
        },
        status: 'scheduled'
      })

      // Mark as scheduled in lead profile
      leadProfile.automationStatus[automationType] = {
        scheduled: true,
        scheduledAt: new Date(),
        scheduledFor: new Date(scheduleTime),
        automationId
      }

      logger.info(`Scheduled ${automationType} automation for user ${leadProfile.userId}`, {
        userId: leadProfile.userId,
        type: automationType,
        scheduledFor: new Date(scheduleTime)
      })

    } catch (error) {
      logger.error(`Error scheduling ${automationType} automation:`, error)
    }
  }

  // Process automation queue
  startAutomationProcessor() {
    setInterval(async () => {
      const now = Date.now()
      
      for (const [automationId, automation] of this.automationQueue) {
        if (automation.status === 'scheduled' && now >= automation.scheduledFor) {
          try {
            await this.executeAutomation(automation)
            
            // Update status
            automation.status = 'completed'
            automation.executedAt = new Date()
            
            // Update lead profile
            const leadProfile = this.leadDatabase.get(automation.userId)
            if (leadProfile && leadProfile.automationStatus[automation.type]) {
              leadProfile.automationStatus[automation.type].completed = true
              leadProfile.automationStatus[automation.type].completedAt = new Date()
            }

            logger.info(`Automation executed: ${automation.type} for user ${automation.userId}`)
            
          } catch (error) {
            logger.error(`Failed to execute automation ${automationId}:`, error)
            automation.status = 'failed'
            automation.error = error.message
          }
        }
      }
      
      // Clean up completed/failed automations older than 7 days
      const cleanupThreshold = now - (7 * 24 * 60 * 60 * 1000)
      for (const [automationId, automation] of this.automationQueue) {
        if ((automation.status === 'completed' || automation.status === 'failed') && 
            automation.scheduledFor < cleanupThreshold) {
          this.automationQueue.delete(automationId)
        }
      }
      
    }, 60000) // Check every minute
  }

  // Execute specific automation
  async executeAutomation(automation) {
    const { type, leadData, userId } = automation
    const leadProfile = this.leadDatabase.get(userId)
    
    if (!leadProfile) {
      throw new Error(`Lead profile not found for user ${userId}`)
    }

    switch (type) {
      case 'welcome_sequence':
        await emailService.sendWelcomeEmail(leadData.email, {
          id: userId,
          name: leadData.name
        })
        break

      case 'market_insights':
        await emailService.sendMarketInsights(leadData.email, {
          id: userId,
          name: leadData.name
        }, {
          priceGrowth: '5.2',
          activeAreas: 'Westlands, Karen, Kileleshwa',
          hotspot: 'Tatu City - New Infrastructure Development',
          tip: 'Properties near the upcoming BRT line are showing strong appreciation potential.'
        })
        break

      case 'agent_introduction':
        const agent = await this.getAssignedAgent(userId)
        await emailService.sendAgentIntroduction(leadData.email, {
          id: userId,
          name: leadData.name
        }, agent)
        break

      case 'property_recommendations':
        const recommendations = await this.getPropertyRecommendations(userId)
        await emailService.sendPropertyRecommendations(leadData.email, {
          id: userId,
          name: leadData.name
        }, recommendations)
        break

      case 'market_report':
        await emailService.sendMarketReport(leadData.email, {
          id: userId,
          name: leadData.name
        })
        break

      default:
        throw new Error(`Unknown automation type: ${type}`)
    }
  }

  // Assign agent to high-value lead
  async assignAgentToLead(leadProfile) {
    try {
      // Simple round-robin agent assignment (in production, this would be more sophisticated)
      const availableAgents = [
        {
          id: 'agent_1',
          name: 'Sarah Wanjiku',
          email: 'sarah@palvoriaproperties.com',
          phone: '+254-700-123-456',
          specialties: ['Luxury residential properties in Karen & Runda', 'Investment properties with high rental yield'],
          photo: 'https://via.placeholder.com/80x80/667eea/white?text=SW'
        },
        {
          id: 'agent_2',
          name: 'Michael Ochieng',
          email: 'michael@palvoriaproperties.com',
          phone: '+254-700-123-457',
          specialties: ['Commercial properties', 'First-time homebuyer guidance'],
          photo: 'https://via.placeholder.com/80x80/28a745/white?text=MO'
        },
        {
          id: 'agent_3',
          name: 'Grace Mutindi',
          email: 'grace@palvoriaproperties.com',
          phone: '+254-700-123-458',
          specialties: ['Affordable housing', 'Rental property management'],
          photo: 'https://via.placeholder.com/80x80/dc3545/white?text=GM'
        }
      ]

      // Select agent (simple random selection for demo)
      const selectedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
      
      leadProfile.assignedAgent = selectedAgent.id
      
      logger.info(`Assigned agent ${selectedAgent.name} to hot lead ${leadProfile.userId}`)
      
      return selectedAgent
    } catch (error) {
      logger.error('Error assigning agent to lead:', error)
      return null
    }
  }

  // Get assigned agent details
  async getAssignedAgent(userId) {
    const leadProfile = this.leadDatabase.get(userId)
    
    // Mock agent data - in production, this would come from database
    return {
      id: leadProfile?.assignedAgent || 'agent_1',
      name: 'Sarah Wanjiku',
      title: 'Senior Property Consultant',
      email: 'sarah@palvoriaproperties.com',
      phone: '+254-700-123-456',
      specialties: [
        'Luxury residential properties in Karen & Runda',
        'Investment properties with high rental yield',
        'First-time homebuyer guidance and financing'
      ],
      photo: 'https://via.placeholder.com/80x80/667eea/white?text=SW'
    }
  }

  // Get property recommendations for user
  async getPropertyRecommendations(userId) {
    // Mock property recommendations - in production, this would be based on user preferences
    return [
      {
        id: 'prop_1',
        title: '4BR Villa in Karen',
        location: 'Karen, Nairobi',
        price: '65,000,000',
        bedrooms: 4,
        bathrooms: 3,
        size: '0.5 acres',
        images: ['https://via.placeholder.com/300x200/667eea/white?text=Villa+Karen']
      },
      {
        id: 'prop_2',
        title: '3BR Apartment in Kilimani',
        location: 'Kilimani, Nairobi',
        price: '28,500,000',
        bedrooms: 3,
        bathrooms: 2,
        size: '1,200 sqft',
        images: ['https://via.placeholder.com/300x200/28a745/white?text=Apartment+Kilimani']
      },
      {
        id: 'prop_3',
        title: '2BR Penthouse in Westlands',
        location: 'Westlands, Nairobi',
        price: '45,000,000',
        bedrooms: 2,
        bathrooms: 2,
        size: '1,500 sqft',
        images: ['https://via.placeholder.com/300x200/dc3545/white?text=Penthouse+Westlands']
      }
    ]
  }

  // Notify agents of hot leads
  async notifyAgentsOfHotLead(leadProfile) {
    try {
      // In production, this would notify agents via WebSocket or email
      logger.info(`🔥 HOT LEAD ALERT: User ${leadProfile.userId} scored ${leadProfile.totalScore}`, {
        userId: leadProfile.userId,
        email: leadProfile.email,
        name: leadProfile.name,
        score: leadProfile.totalScore,
        lastActivity: leadProfile.lastActivity
      })

      // You could also send a Slack notification, email to agents, etc.
      
    } catch (error) {
      logger.error('Error notifying agents of hot lead:', error)
    }
  }

  // Get lead analytics
  getLeadAnalytics() {
    const leads = Array.from(this.leadDatabase.values())
    const totalLeads = leads.length
    
    const categoryCounts = {
      COLD: leads.filter(l => this.getLeadCategory(l.totalScore).category === 'COLD').length,
      WARM: leads.filter(l => this.getLeadCategory(l.totalScore).category === 'WARM').length,
      HOT: leads.filter(l => this.getLeadCategory(l.totalScore).category === 'HOT').length
    }

    const averageScore = totalLeads > 0 ? 
      leads.reduce((sum, lead) => sum + lead.totalScore, 0) / totalLeads : 0

    const automationStats = {
      total: this.automationQueue.size,
      scheduled: Array.from(this.automationQueue.values()).filter(a => a.status === 'scheduled').length,
      completed: Array.from(this.automationQueue.values()).filter(a => a.status === 'completed').length,
      failed: Array.from(this.automationQueue.values()).filter(a => a.status === 'failed').length
    }

    return {
      totalLeads,
      categoryCounts,
      averageScore: Math.round(averageScore * 10) / 10,
      automationStats,
      conversionRate: totalLeads > 0 ? Math.round((categoryCounts.HOT / totalLeads) * 100 * 10) / 10 : 0
    }
  }

  // Get lead profile
  getLeadProfile(userId) {
    const profile = this.leadDatabase.get(userId)
    if (!profile) return null

    return {
      ...profile,
      category: this.getLeadCategory(profile.totalScore)
    }
  }

  // Get all leads (for admin dashboard)
  getAllLeads(limit = 100, offset = 0) {
    const allLeads = Array.from(this.leadDatabase.values())
    
    // Sort by score (descending) and last activity
    const sortedLeads = allLeads.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore
      }
      return new Date(b.lastActivity) - new Date(a.lastActivity)
    })

    const paginatedLeads = sortedLeads.slice(offset, offset + limit)

    return {
      leads: paginatedLeads.map(lead => ({
        ...lead,
        category: this.getLeadCategory(lead.totalScore)
      })),
      total: allLeads.length,
      limit,
      offset
    }
  }

  // Manual trigger for testing
  async triggerWelcomeEmail(userId, email, name) {
    if (!email) throw new Error('Email required')
    
    try {
      const result = await emailService.sendWelcomeEmail(email, { id: userId, name })
      logger.info(`Manually triggered welcome email for ${email}`)
      return result
    } catch (error) {
      logger.error(`Failed to send manual welcome email to ${email}:`, error)
      throw error
    }
  }
}

export default new LeadScoringService()