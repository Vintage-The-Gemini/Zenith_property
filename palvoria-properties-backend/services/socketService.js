import { Server } from 'socket.io'
import Redis from 'ioredis'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

class SocketService {
  constructor() {
    this.io = null
    this.redis = null
    this.connections = new Map()
    this.channels = {
      PROPERTY_UPDATES: 'property_updates',
      USER_CHAT: 'user_chat', 
      NOTIFICATIONS: 'notifications',
      LEAD_ACTIVITY: 'lead_activity',
      MARKET_UPDATES: 'market_updates',
      PROPERTY_VIEWS: 'property_views',
      PRICE_ALERTS: 'price_alerts'
    }
    this.rateLimiter = new Map()
    this.heartbeatInterval = null
  }

  initialize(server) {
    // Initialize Socket.IO with CORS configuration
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000
    })

    // Initialize Redis for connection pooling and scalability
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      this.redis.on('connect', () => {
        logger.info('Redis connected for WebSocket service')
      })

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err)
      })
    } catch (error) {
      logger.warn('Redis not available, running in standalone mode:', error.message)
    }

    this.setupMiddleware()
    this.setupEventHandlers()
    this.startHeartbeat()
    
    logger.info('WebSocket service initialized successfully')
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || 
                     socket.handshake.headers?.authorization?.replace('Bearer ', '')
        
        if (!token) {
          socket.isGuest = true
          socket.userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          socket.userRole = 'guest'
          return next()
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await this.getUserFromToken(decoded)
        
        if (!user) {
          return next(new Error('Invalid user'))
        }

        socket.userId = user.id
        socket.userRole = user.role || 'user'
        socket.userData = user
        socket.isGuest = false
        next()
      } catch (error) {
        // Allow guests but with limited functionality
        socket.isGuest = true
        socket.userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        socket.userRole = 'guest'
        next()
      }
    })

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.userId
      const now = Date.now()
      const windowMs = 60 * 1000 // 1 minute window
      const maxMessages = socket.isGuest ? 20 : 100 // Guests have lower limit

      if (!this.rateLimiter.has(userId)) {
        this.rateLimiter.set(userId, { count: 0, resetTime: now + windowMs })
      }

      const userLimiter = this.rateLimiter.get(userId)
      
      if (now > userLimiter.resetTime) {
        userLimiter.count = 0
        userLimiter.resetTime = now + windowMs
      }

      if (userLimiter.count >= maxMessages) {
        return next(new Error('Rate limit exceeded'))
      }

      next()
    })
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket)
    })
  }

  handleConnection(socket) {
    const userId = socket.userId
    const userRole = socket.userRole
    const isGuest = socket.isGuest
    
    logger.info(`${isGuest ? 'Guest' : 'User'} ${userId} connected with role: ${userRole}`)
    
    // Store connection info
    this.connections.set(socket.id, {
      userId,
      userRole,
      isGuest,
      connectedAt: new Date(),
      lastActivity: new Date()
    })

    // Subscribe to relevant channels based on user role
    this.subscribeUserToChannels(socket, userRole, isGuest)

    // Setup message queuing for registered users
    if (!isGuest) {
      this.deliverQueuedMessages(userId)
    }

    // Handle property viewing (tracking for analytics)
    socket.on('property_view', (data) => this.handlePropertyView(socket, data))
    
    // Handle user inquiries
    socket.on('user_inquiry', (data) => this.handleUserInquiry(socket, data))
    
    // Handle property status changes (admin/agent only)
    socket.on('property_status_change', (data) => this.handlePropertyStatusChange(socket, data))
    
    // Handle chat messages
    socket.on('chat_message', (data) => this.handleChatMessage(socket, data))
    
    // Handle join property room for updates
    socket.on('join_property', (propertyId) => this.joinPropertyRoom(socket, propertyId))
    
    // Handle leave property room
    socket.on('leave_property', (propertyId) => this.leavePropertyRoom(socket, propertyId))

    // Handle lead scoring events
    socket.on('lead_activity', (data) => this.handleLeadActivity(socket, data))

    // Handle mortgage calculator usage
    socket.on('mortgage_calculation', (data) => this.handleMortgageCalculation(socket, data))

    // Handle search events
    socket.on('property_search', (data) => this.handlePropertySearch(socket, data))

    // Handle property favorites
    socket.on('property_favorite', (data) => this.handlePropertyFavorite(socket, data))

    // Heartbeat response
    socket.on('pong', () => {
      if (this.connections.has(socket.id)) {
        this.connections.get(socket.id).lastActivity = new Date()
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket))
  }

  subscribeUserToChannels(socket, userRole, isGuest) {
    // All users (including guests) get basic updates
    socket.join(this.channels.PROPERTY_UPDATES)
    socket.join(this.channels.MARKET_UPDATES)
    
    if (!isGuest) {
      // Registered users get notifications
      socket.join(this.channels.NOTIFICATIONS)
      socket.join(`user_${socket.userId}`)
      
      // Role-specific subscriptions
      if (userRole === 'admin' || userRole === 'agent') {
        socket.join(this.channels.LEAD_ACTIVITY)
        socket.join(this.channels.USER_CHAT)
      }
    }
  }

  async handlePropertyView(socket, data) {
    try {
      const viewData = {
        userId: socket.userId,
        propertyId: data.propertyId,
        timestamp: new Date(),
        isGuest: socket.isGuest,
        sessionId: socket.id,
        source: data.source || 'web',
        referrer: data.referrer,
        userAgent: socket.handshake.headers['user-agent']
      }

      // Track property view for analytics
      await this.trackPropertyView(viewData)
      
      // Broadcast to property room (for real-time view count)
      socket.to(`property_${data.propertyId}`).emit('property_view_update', {
        propertyId: data.propertyId,
        viewCount: await this.getPropertyViewCount(data.propertyId)
      })

      // Lead scoring for registered users
      if (!socket.isGuest) {
        await this.handleLeadActivity(socket, {
          action: 'property_view',
          propertyId: data.propertyId,
          metadata: { source: data.source, referrer: data.referrer }
        })
      }

      socket.emit('property_view_tracked', { propertyId: data.propertyId })

    } catch (error) {
      logger.error('Error handling property view:', error)
    }
  }

  async handleUserInquiry(socket, data) {
    try {
      this.updateRateLimit(socket.userId)
      
      if (socket.isGuest) {
        return socket.emit('error', { 
          message: 'Please register to send inquiries',
          code: 'AUTHENTICATION_REQUIRED' 
        })
      }
      
      const inquiryData = {
        id: this.generateId(),
        userId: socket.userId,
        propertyId: data.propertyId,
        message: data.message,
        contactMethod: data.contactMethod || 'chat',
        phone: data.phone,
        email: data.email,
        timestamp: new Date(),
        status: 'new',
        source: 'websocket'
      }

      // Store inquiry in database
      await this.storeInquiry(inquiryData)
      
      // Find and route to appropriate agent
      const agent = await this.findAvailableAgent(data.propertyId)
      
      if (agent && this.isUserOnline(agent.id)) {
        // Send to agent immediately
        this.io.to(`user_${agent.id}`).emit('new_inquiry', inquiryData)
        logger.info(`Inquiry routed to online agent: ${agent.id}`)
      } else {
        // Queue for when agent comes online
        await this.queueMessage(`user_${agent?.id || 'admin'}`, {
          type: 'inquiry',
          data: inquiryData
        })
        
        // Send automated response
        this.sendAutomatedResponse(socket, data.propertyId)
        logger.info(`Inquiry queued for offline agent: ${agent?.id || 'admin'}`)
      }

      // Lead scoring
      await this.handleLeadActivity(socket, {
        action: 'contact_form',
        propertyId: data.propertyId,
        metadata: { contactMethod: data.contactMethod }
      })

      // Log activity for analytics
      this.logActivity({
        userId: socket.userId,
        action: 'user_inquiry',
        propertyId: data.propertyId,
        timestamp: new Date()
      })

      socket.emit('inquiry_received', { inquiryId: inquiryData.id })
      
    } catch (error) {
      logger.error('Error handling user inquiry:', error)
      socket.emit('error', { message: 'Failed to send inquiry' })
    }
  }

  async handlePropertyStatusChange(socket, data) {
    try {
      // Only allow admins and agents
      if (!['admin', 'agent'].includes(socket.userRole)) {
        return socket.emit('error', { message: 'Unauthorized' })
      }

      const { propertyId, status, price, availability, features } = data
      
      // Update property in database
      await this.updatePropertyStatus(propertyId, { status, price, availability, features })
      
      const updateData = {
        propertyId,
        status,
        price,
        availability,
        features,
        updatedBy: socket.userId,
        timestamp: new Date()
      }

      // Broadcast to all property subscribers
      this.io.to(this.channels.PROPERTY_UPDATES).emit('property_updated', updateData)
      this.io.to(`property_${propertyId}`).emit('property_updated', updateData)
      
      // Notify users who favorited this property
      await this.notifyInterestedUsers(propertyId, {
        type: 'property_update',
        title: 'Property Updated',
        message: `A property you're interested in has been updated`,
        data: updateData
      })

      // Log activity for analytics
      this.logActivity({
        userId: socket.userId,
        action: 'property_status_change',
        propertyId,
        changes: { status, price, availability, features },
        timestamp: new Date()
      })

      socket.emit('property_update_success', { propertyId })

    } catch (error) {
      logger.error('Error handling property status change:', error)
      socket.emit('error', { message: 'Failed to update property' })
    }
  }

  async handleChatMessage(socket, data) {
    try {
      this.updateRateLimit(socket.userId)
      
      if (socket.isGuest) {
        return socket.emit('error', { 
          message: 'Please register to send messages',
          code: 'AUTHENTICATION_REQUIRED' 
        })
      }
      
      const message = {
        id: this.generateId(),
        fromUserId: socket.userId,
        toUserId: data.toUserId,
        message: data.message,
        propertyId: data.propertyId,
        timestamp: new Date(),
        read: false,
        type: data.type || 'text'
      }

      // Store in database
      await this.storeChatMessage(message)
      
      // Send to recipient if online
      this.io.to(`user_${data.toUserId}`).emit('chat_message', message)
      
      // Send confirmation to sender
      socket.emit('message_sent', { messageId: message.id })

    } catch (error) {
      logger.error('Error handling chat message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  }

  joinPropertyRoom(socket, propertyId) {
    socket.join(`property_${propertyId}`)
    logger.info(`User ${socket.userId} joined property room: ${propertyId}`)
  }

  leavePropertyRoom(socket, propertyId) {
    socket.leave(`property_${propertyId}`)
    logger.info(`User ${socket.userId} left property room: ${propertyId}`)
  }

  async handleLeadActivity(socket, data) {
    try {
      if (socket.isGuest) return // Don't track guest activities for lead scoring

      const activityData = {
        userId: socket.userId,
        action: data.action, // 'property_view', 'saved_property', 'mortgage_calc_use', etc.
        propertyId: data.propertyId,
        metadata: data.metadata || {},
        timestamp: new Date(),
        sessionId: socket.id
      }

      // Store activity
      await this.storeLeadActivity(activityData)
      
      // Broadcast to agents for real-time lead tracking
      this.io.to(this.channels.LEAD_ACTIVITY).emit('lead_activity', activityData)

      // Update lead score
      const newScore = await this.updateLeadScore(socket.userId, data.action)
      
      // Notify user of score milestone
      if (newScore >= 80) {
        socket.emit('lead_status_update', { status: 'hot', score: newScore })
      } else if (newScore >= 50) {
        socket.emit('lead_status_update', { status: 'warm', score: newScore })
      }

    } catch (error) {
      logger.error('Error handling lead activity:', error)
    }
  }

  async handleMortgageCalculation(socket, data) {
    try {
      const calculationData = {
        userId: socket.userId,
        propertyPrice: data.propertyPrice,
        downPayment: data.downPayment,
        loanTerm: data.loanTerm,
        interestRate: data.interestRate,
        monthlyPayment: data.monthlyPayment,
        timestamp: new Date()
      }

      // Store calculation for analytics
      await this.storeMortgageCalculation(calculationData)
      
      // Lead scoring for registered users
      if (!socket.isGuest) {
        await this.handleLeadActivity(socket, {
          action: 'mortgage_calc_use',
          propertyId: data.propertyId,
          metadata: { calculationData }
        })
      }

    } catch (error) {
      logger.error('Error handling mortgage calculation:', error)
    }
  }

  async handlePropertySearch(socket, data) {
    try {
      const searchData = {
        userId: socket.userId,
        query: data.query,
        filters: data.filters,
        results: data.results,
        timestamp: new Date()
      }

      // Store search for analytics
      await this.storePropertySearch(searchData)

    } catch (error) {
      logger.error('Error handling property search:', error)
    }
  }

  async handlePropertyFavorite(socket, data) {
    try {
      if (socket.isGuest) {
        return socket.emit('error', { 
          message: 'Please register to save favorites',
          code: 'AUTHENTICATION_REQUIRED' 
        })
      }

      // Lead scoring
      await this.handleLeadActivity(socket, {
        action: 'saved_property',
        propertyId: data.propertyId,
        metadata: { action: data.action } // 'add' or 'remove'
      })

      socket.emit('favorite_updated', { 
        propertyId: data.propertyId, 
        action: data.action 
      })

    } catch (error) {
      logger.error('Error handling property favorite:', error)
    }
  }

  handleDisconnection(socket) {
    const userId = socket.userId
    const isGuest = socket.isGuest
    logger.info(`${isGuest ? 'Guest' : 'User'} ${userId} disconnected`)
    
    this.connections.delete(socket.id)
    
    // Clean up rate limiter after some time
    setTimeout(() => {
      this.rateLimiter.delete(userId)
    }, 300000) // 5 minutes
  }

  // Utility methods
  updateRateLimit(userId) {
    const userLimiter = this.rateLimiter.get(userId)
    if (userLimiter) {
      userLimiter.count++
    }
  }

  startHeartbeat() {
    // Send heartbeat every 30 seconds as per algorithm
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('ping')
      
      // Clean up dead connections
      const now = new Date()
      for (const [socketId, connection] of this.connections) {
        if (now - connection.lastActivity > 90000) { // 90 seconds timeout
          const socket = this.io.sockets.sockets.get(socketId)
          if (socket) {
            socket.disconnect()
          }
          this.connections.delete(socketId)
        }
      }
    }, 30000)
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Database operations (to be implemented with actual models)
  async getUserFromToken(decoded) {
    // TODO: Implement user lookup from database
    return { id: decoded.userId, role: decoded.role, email: decoded.email }
  }

  async storeInquiry(inquiry) {
    // TODO: Store inquiry in database
    logger.info('Storing inquiry:', inquiry.id)
  }

  async findAvailableAgent(propertyId) {
    // TODO: Find available agent for property
    return { id: 'agent1', isOnline: false }
  }

  async queueMessage(userId, message) {
    if (!this.redis) return
    try {
      await this.redis.lpush(`messages:${userId}`, JSON.stringify(message))
      await this.redis.expire(`messages:${userId}`, 86400) // 24 hours
    } catch (error) {
      logger.error('Error queuing message:', error)
    }
  }

  async deliverQueuedMessages(userId) {
    if (!this.redis) return
    try {
      const messages = await this.redis.lrange(`messages:${userId}`, 0, -1)
      if (messages.length > 0) {
        for (const message of messages) {
          this.io.to(`user_${userId}`).emit('queued_message', JSON.parse(message))
        }
        await this.redis.del(`messages:${userId}`)
      }
    } catch (error) {
      logger.error('Error delivering queued messages:', error)
    }
  }

  sendAutomatedResponse(socket, propertyId) {
    const responses = [
      'Thank you for your inquiry! One of our agents will get back to you within 24 hours.',
      'We appreciate your interest! A property specialist will contact you shortly.',
      'Your inquiry has been received. We\'ll respond with detailed information soon.'
    ]
    
    const response = {
      id: this.generateId(),
      type: 'automated',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      propertyId
    }
    
    socket.emit('chat_message', response)
  }

  // Placeholder methods for database operations
  async updatePropertyStatus(propertyId, updates) {
    logger.info('Updating property:', propertyId, updates)
  }

  async notifyInterestedUsers(propertyId, notification) {
    logger.info('Notifying interested users for property:', propertyId)
  }

  async storeChatMessage(message) {
    logger.info('Storing chat message:', message.id)
  }

  async storeLeadActivity(activity) {
    logger.info('Storing lead activity:', activity.userId, activity.action)
  }

  async updateLeadScore(userId, action) {
    const scores = {
      'property_view': 5,
      'saved_property': 10,
      'mortgage_calc_use': 15,
      'contact_form': 25,
      'phone_call_request': 30
    }
    
    const scoreIncrease = scores[action] || 0
    logger.info(`Updating lead score for user ${userId}: +${scoreIncrease}`)
    return 50 + scoreIncrease // Mock return
  }

  async trackPropertyView(viewData) {
    logger.info('Tracking property view:', viewData.propertyId)
  }

  async getPropertyViewCount(propertyId) {
    return Math.floor(Math.random() * 100) + 1 // Mock count
  }

  async storeMortgageCalculation(data) {
    logger.info('Storing mortgage calculation for user:', data.userId)
  }

  async storePropertySearch(data) {
    logger.info('Storing property search for user:', data.userId)
  }

  logActivity(activity) {
    // Log to Redis for analytics
    if (this.redis) {
      this.redis.lpush('analytics:activities', JSON.stringify(activity))
    }
    logger.info('Activity logged:', activity.action)
  }

  // Public methods for other services
  broadcastPropertyUpdate(propertyId, data) {
    this.io.to(`property_${propertyId}`).emit('property_updated', data)
    this.io.to(this.channels.PROPERTY_UPDATES).emit('property_updated', data)
  }

  broadcastMarketUpdate(data) {
    this.io.to(this.channels.MARKET_UPDATES).emit('market_update', data)
  }

  sendNotificationToUser(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', notification)
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data)
  }

  getConnectedUsers() {
    return Array.from(this.connections.values()).map(conn => ({
      userId: conn.userId,
      userRole: conn.userRole,
      isGuest: conn.isGuest,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity
    }))
  }

  isUserOnline(userId) {
    return Array.from(this.connections.values()).some(conn => conn.userId === userId)
  }

  getConnectionStats() {
    const connections = Array.from(this.connections.values())
    return {
      total: connections.length,
      registered: connections.filter(c => !c.isGuest).length,
      guests: connections.filter(c => c.isGuest).length,
      admins: connections.filter(c => c.userRole === 'admin').length,
      agents: connections.filter(c => c.userRole === 'agent').length,
      users: connections.filter(c => c.userRole === 'user').length
    }
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.redis) {
      this.redis.disconnect()
    }
    if (this.io) {
      this.io.close()
    }
    logger.info('WebSocket service cleaned up')
  }
}

export default new SocketService()