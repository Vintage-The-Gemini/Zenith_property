import { Server } from 'socket.io'
import Redis from 'ioredis'
import jwt from 'jsonwebtoken'

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
      MARKET_UPDATES: 'market_updates'
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
      transports: ['websocket', 'polling']
    })

    // Initialize Redis for connection pooling and scalability
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })

    this.setupMiddleware()
    this.setupEventHandlers()
    this.startHeartbeat()
    
    console.log('WebSocket service initialized successfully')
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await this.getUserFromToken(decoded)
        
        if (!user) {
          return next(new Error('Invalid user'))
        }

        socket.userId = user.id
        socket.userRole = user.role
        socket.userData = user
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.userId
      const now = Date.now()
      const windowMs = 60 * 1000 // 1 minute window
      const maxMessages = 100

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
    
    console.log(`User ${userId} connected with role: ${userRole}`)
    
    // Store connection info
    this.connections.set(socket.id, {
      userId,
      userRole,
      connectedAt: new Date(),
      lastActivity: new Date()
    })

    // Subscribe to relevant channels based on user role
    this.subscribeUserToChannels(socket, userRole)

    // Setup message queuing for offline users
    this.deliverQueuedMessages(userId)

    // Handle user inquiries
    socket.on('user_inquiry', (data) => this.handleUserInquiry(socket, data))
    
    // Handle property status changes (admin only)
    socket.on('property_status_change', (data) => this.handlePropertyStatusChange(socket, data))
    
    // Handle chat messages
    socket.on('chat_message', (data) => this.handleChatMessage(socket, data))
    
    // Handle join property room for updates
    socket.on('join_property', (propertyId) => this.joinPropertyRoom(socket, propertyId))
    
    // Handle leave property room
    socket.on('leave_property', (propertyId) => this.leavePropertyRoom(socket, propertyId))

    // Handle lead scoring events
    socket.on('lead_activity', (data) => this.handleLeadActivity(socket, data))

    // Heartbeat response
    socket.on('pong', () => {
      if (this.connections.has(socket.id)) {
        this.connections.get(socket.id).lastActivity = new Date()
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket))
  }

  subscribeUserToChannels(socket, userRole) {
    // All users get notifications
    socket.join(this.channels.NOTIFICATIONS)
    
    // All users get market updates
    socket.join(this.channels.MARKET_UPDATES)
    
    // Role-specific subscriptions
    if (userRole === 'admin' || userRole === 'agent') {
      socket.join(this.channels.PROPERTY_UPDATES)
      socket.join(this.channels.LEAD_ACTIVITY)
    }
    
    // User-specific room
    socket.join(`user_${socket.userId}`)
  }

  async handleUserInquiry(socket, data) {
    try {
      // Update rate limiter
      this.updateRateLimit(socket.userId)
      
      const inquiryData = {
        id: this.generateId(),
        userId: socket.userId,
        propertyId: data.propertyId,
        message: data.message,
        timestamp: new Date(),
        status: 'new'
      }

      // Store in database
      await this.storeInquiry(inquiryData)
      
      // Route to appropriate agent
      const agent = await this.findAvailableAgent(data.propertyId)
      
      if (agent && agent.isOnline) {
        // Send to agent immediately
        this.io.to(`user_${agent.id}`).emit('new_inquiry', inquiryData)
      } else {
        // Queue for when agent comes online
        await this.queueMessage(`user_${agent?.id || 'admin'}`, {
          type: 'inquiry',
          data: inquiryData
        })
        
        // Send automated response
        this.sendAutomatedResponse(socket, data.propertyId)
      }

      // Log activity for analytics
      this.logActivity({
        userId: socket.userId,
        action: 'user_inquiry',
        propertyId: data.propertyId,
        timestamp: new Date()
      })

      socket.emit('inquiry_received', { inquiryId: inquiryData.id })
      
    } catch (error) {
      console.error('Error handling user inquiry:', error)
      socket.emit('error', { message: 'Failed to send inquiry' })
    }
  }

  async handlePropertyStatusChange(socket, data) {
    try {
      // Only allow admins and agents
      if (!['admin', 'agent'].includes(socket.userRole)) {
        return socket.emit('error', { message: 'Unauthorized' })
      }

      const { propertyId, status, price, availability } = data
      
      // Update database
      await this.updatePropertyStatus(propertyId, { status, price, availability })
      
      // Broadcast to all subscribed clients
      this.io.to(this.channels.PROPERTY_UPDATES).emit('property_updated', {
        propertyId,
        status,
        price,
        availability,
        updatedBy: socket.userId,
        timestamp: new Date()
      })
      
      // Notify users who saved this property
      await this.notifyInterestedUsers(propertyId, {
        type: 'property_update',
        message: `Property ${propertyId} has been updated`,
        data: { status, price, availability }
      })

      // Log activity for analytics
      this.logActivity({
        userId: socket.userId,
        action: 'property_status_change',
        propertyId,
        changes: { status, price, availability },
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Error handling property status change:', error)
      socket.emit('error', { message: 'Failed to update property' })
    }
  }

  async handleChatMessage(socket, data) {
    try {
      this.updateRateLimit(socket.userId)
      
      const message = {
        id: this.generateId(),
        fromUserId: socket.userId,
        toUserId: data.toUserId,
        message: data.message,
        timestamp: new Date(),
        read: false
      }

      // Store in database
      await this.storeChatMessage(message)
      
      // Send to recipient if online
      this.io.to(`user_${data.toUserId}`).emit('chat_message', message)
      
      // Send confirmation to sender
      socket.emit('message_sent', { messageId: message.id })

    } catch (error) {
      console.error('Error handling chat message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  }

  joinPropertyRoom(socket, propertyId) {
    socket.join(`property_${propertyId}`)
    console.log(`User ${socket.userId} joined property room: ${propertyId}`)
  }

  leavePropertyRoom(socket, propertyId) {
    socket.leave(`property_${propertyId}`)
    console.log(`User ${socket.userId} left property room: ${propertyId}`)
  }

  async handleLeadActivity(socket, data) {
    try {
      const activityData = {
        userId: socket.userId,
        action: data.action, // 'property_view', 'saved_property', 'mortgage_calc_use', etc.
        propertyId: data.propertyId,
        metadata: data.metadata,
        timestamp: new Date()
      }

      // Store activity
      await this.storeLeadActivity(activityData)
      
      // Broadcast to agents for real-time lead tracking
      this.io.to(this.channels.LEAD_ACTIVITY).emit('lead_activity', activityData)

      // Update lead score
      await this.updateLeadScore(socket.userId, data.action)

    } catch (error) {
      console.error('Error handling lead activity:', error)
    }
  }

  handleDisconnection(socket) {
    const userId = socket.userId
    console.log(`User ${userId} disconnected`)
    
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
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('ping')
      
      // Clean up dead connections
      const now = new Date()
      for (const [socketId, connection] of this.connections) {
        if (now - connection.lastActivity > 60000) { // 1 minute timeout
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

  // Database operations (to be implemented)
  async getUserFromToken(decoded) {
    // TODO: Implement user lookup from database
    return { id: decoded.userId, role: decoded.role }
  }

  async storeInquiry(inquiry) {
    // TODO: Store inquiry in database
    console.log('Storing inquiry:', inquiry)
  }

  async findAvailableAgent(propertyId) {
    // TODO: Find available agent for property
    return { id: 'agent1', isOnline: false }
  }

  async queueMessage(userId, message) {
    // Queue message in Redis for offline users
    await this.redis.lpush(`messages:${userId}`, JSON.stringify(message))
    await this.redis.expire(`messages:${userId}`, 86400) // 24 hours
  }

  async deliverQueuedMessages(userId) {
    const messages = await this.redis.lrange(`messages:${userId}`, 0, -1)
    if (messages.length > 0) {
      for (const message of messages) {
        this.io.to(`user_${userId}`).emit('queued_message', JSON.parse(message))
      }
      await this.redis.del(`messages:${userId}`)
    }
  }

  sendAutomatedResponse(socket, propertyId) {
    const response = {
      id: this.generateId(),
      type: 'automated',
      message: 'Thank you for your inquiry! One of our agents will get back to you shortly.',
      timestamp: new Date()
    }
    
    socket.emit('chat_message', response)
  }

  async updatePropertyStatus(propertyId, updates) {
    // TODO: Update property in database
    console.log('Updating property:', propertyId, updates)
  }

  async notifyInterestedUsers(propertyId, notification) {
    // TODO: Find users who saved/viewed this property and notify them
    console.log('Notifying interested users for property:', propertyId)
  }

  async storeChatMessage(message) {
    // TODO: Store chat message in database
    console.log('Storing chat message:', message)
  }

  async storeLeadActivity(activity) {
    // TODO: Store lead activity in database
    console.log('Storing lead activity:', activity)
  }

  async updateLeadScore(userId, action) {
    // TODO: Update user's lead score based on action
    const scores = {
      'property_view': 5,
      'saved_property': 10,
      'mortgage_calc_use': 15,
      'contact_form': 25,
      'phone_call_request': 30
    }
    
    const scoreIncrease = scores[action] || 0
    console.log(`Updating lead score for user ${userId}: +${scoreIncrease}`)
  }

  logActivity(activity) {
    // Log to Redis for analytics
    this.redis.lpush('analytics:activities', JSON.stringify(activity))
    console.log('Activity logged:', activity)
  }

  // Public methods for other services to use
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
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity
    }))
  }

  isUserOnline(userId) {
    return Array.from(this.connections.values()).some(conn => conn.userId === userId)
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
  }
}

export default new SocketService()