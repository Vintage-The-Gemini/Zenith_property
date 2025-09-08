import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.templates = {
      welcome: 'welcome',
      marketInsights: 'market-insights',
      agentIntroduction: 'agent-introduction',
      propertyRecommendations: 'property-recommendations',
      priceAlert: 'price-alert',
      marketReport: 'market-report'
    }
    this.initialized = false
  }

  async initialize() {
    try {
      // Configure email transporter based on provider
      const provider = process.env.EMAIL_PROVIDER || 'sendgrid'
      
      if (provider === 'sendgrid') {
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        })
      } else if (provider === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        })
      } else {
        // Default SMTP configuration
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        })
      }

      // Verify connection
      if (process.env.SENDGRID_API_KEY || process.env.EMAIL_USER || process.env.SMTP_USER) {
        await this.transporter.verify()
        logger.info('Email service initialized successfully')
        this.initialized = true
      } else {
        logger.warn('Email service not configured - running in demo mode')
        this.initialized = false
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error.message)
      this.initialized = false
    }
  }

  async sendEmail(to, subject, htmlContent, templateData = {}) {
    try {
      if (!this.initialized) {
        logger.info(`Demo mode - Email would be sent to: ${to}, Subject: ${subject}`)
        return { success: true, messageId: `demo_${Date.now()}`, mode: 'demo' }
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@palvoriaproperties.com',
        to,
        subject,
        html: htmlContent,
        // Add tracking headers
        headers: {
          'X-Campaign-Name': templateData.campaign || 'general',
          'X-User-ID': templateData.userId || 'unknown'
        }
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        subject,
        campaign: templateData.campaign
      })

      return {
        success: true,
        messageId: result.messageId,
        mode: 'production'
      }
    } catch (error) {
      logger.error('Failed to send email:', error.message, {
        to,
        subject,
        campaign: templateData.campaign
      })
      throw error
    }
  }

  // Welcome email sequence
  async sendWelcomeEmail(userEmail, userData) {
    const subject = '🏡 Welcome to Palvoria Properties Kenya!'
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Palvoria Properties</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏡 Palvoria Properties</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">Advanced Real Estate Platform</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Karibu ${userData.name || 'Valued Client'}! 🎉</h2>
        
        <p>Welcome to Kenya's most advanced real estate platform! We're thrilled to have you join our community of savvy property seekers.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">🚀 What's Next?</h3>
          <ul style="padding-left: 20px;">
            <li><strong>Explore Properties:</strong> Browse our curated selection of premium properties across Kenya</li>
            <li><strong>Smart Search:</strong> Use our AI-powered search to find your dream property</li>
            <li><strong>Mortgage Calculator:</strong> Get instant calculations with real Kenyan bank rates</li>
            <li><strong>Market Insights:</strong> Access exclusive neighborhood analytics and trends</li>
          </ul>
        </div>

        <div style="background: #e8f2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #2c5aa0;">🏠 Featured Properties Just for You</h4>
          <p style="margin-bottom: 0;">Based on current market trends, here are some properties you might love:</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/properties" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Explore Properties Now 🏡
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
          <p><strong>Need Help?</strong></p>
          <p>Our property experts are here to help you find the perfect home. Reply to this email or call us at +254-700-000-000.</p>
          <p style="margin-bottom: 0;">Best regards,<br>The Palvoria Properties Team</p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'welcome_sequence',
      userId: userData.id,
      template: this.templates.welcome
    })
  }

  // Market insights newsletter
  async sendMarketInsights(userEmail, userData, insights) {
    const subject = '📊 Kenya Property Market Insights - Weekly Update'
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Market Insights</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2c5aa0; padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📊 Market Insights</h1>
        <p style="color: #b3d1ff; margin: 5px 0 0 0;">Your Weekly Property Market Update</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c5aa0;">Hello ${userData.name || 'Property Investor'}!</h2>
        
        <p>Here's your personalized weekly update on the Kenyan property market:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c5aa0; margin-top: 0;">🏙️ Market Trends</h3>
          <div style="display: grid; gap: 15px;">
            <div style="border-left: 3px solid #28a745; padding-left: 15px;">
              <strong>Average Price Growth:</strong> +${insights?.priceGrowth || '5.2'}% YoY
            </div>
            <div style="border-left: 3px solid #ffc107; padding-left: 15px;">
              <strong>Most Active Areas:</strong> ${insights?.activeAreas || 'Westlands, Karen, Kileleshwa'}
            </div>
            <div style="border-left: 3px solid #17a2b8; padding-left: 15px;">
              <strong>Investment Hotspot:</strong> ${insights?.hotspot || 'Tatu City - New Infrastructure Development'}
            </div>
          </div>
        </div>

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #28a745;">💡 Expert Tip</h4>
          <p style="margin-bottom: 0;">${insights?.tip || 'Properties near the upcoming BRT line are showing strong appreciation potential. Consider areas along Thika Road and Outering Road for investment opportunities.'}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/market-insights" 
             style="background: #2c5aa0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Full Market Report 📈
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #666;">
          <p>Want to change how often you receive these insights? <a href="#" style="color: #2c5aa0;">Update your preferences</a></p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'market_insights',
      userId: userData.id,
      template: this.templates.marketInsights
    })
  }

  // Agent introduction email
  async sendAgentIntroduction(userEmail, userData, agentData) {
    const subject = `👋 Meet Your Property Expert - ${agentData.name}`
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">👋 Meet Your Property Expert</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #f5576c;">Hello ${userData.name || 'Valued Client'}!</h2>
        
        <p>I've been assigned as your dedicated property consultant to help you find your perfect home in Kenya.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; display: flex; align-items: center; gap: 20px;">
          <div style="flex-shrink: 0;">
            <img src="${agentData.photo || 'https://via.placeholder.com/80x80/667eea/white?text=👨‍💼'}" 
                 alt="${agentData.name}" 
                 style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #f5576c;">
          </div>
          <div>
            <h3 style="margin: 0 0 5px 0; color: #f5576c;">${agentData.name}</h3>
            <p style="margin: 0; color: #666; font-style: italic;">${agentData.title || 'Senior Property Consultant'}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">📞 ${agentData.phone || '+254-700-123-456'}</p>
          </div>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">🎯 My Expertise</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>${agentData.specialties?.[0] || 'Luxury residential properties in Karen & Runda'}</li>
            <li>${agentData.specialties?.[1] || 'Investment properties with high rental yield'}</li>
            <li>${agentData.specialties?.[2] || 'First-time homebuyer guidance and financing'}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:${agentData.phone || '+254700123456'}" 
             style="background: #f5576c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">
            📞 Call Me Now
          </a>
          <a href="mailto:${agentData.email || 'agent@palvoriaproperties.com'}" 
             style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block;">
            ✉️ Send Email
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 25px; color: #666; font-size: 14px;">
          <p><strong>What's Next?</strong></p>
          <p>I'll be reaching out within 24 hours to discuss your property preferences and schedule a personalized property tour.</p>
          <p style="margin-bottom: 0;">Looking forward to helping you find your dream home!</p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'agent_introduction',
      userId: userData.id,
      agentId: agentData.id,
      template: this.templates.agentIntroduction
    })
  }

  // Property recommendations
  async sendPropertyRecommendations(userEmail, userData, properties) {
    const subject = '🏡 New Properties Matching Your Preferences'
    
    const propertiesHtml = properties.slice(0, 3).map(property => `
      <div style="background: white; border-radius: 8px; overflow: hidden; margin: 15px 0; border: 1px solid #ddd;">
        <img src="${property.images?.[0] || 'https://via.placeholder.com/300x200/667eea/white?text=🏡'}" 
             alt="${property.title}" 
             style="width: 100%; height: 200px; object-fit: cover;">
        <div style="padding: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #667eea;">${property.title}</h3>
          <p style="margin: 5px 0; color: #666;">📍 ${property.location}</p>
          <p style="margin: 5px 0; color: #28a745; font-weight: bold; font-size: 18px;">KSH ${property.price}</p>
          <p style="margin: 10px 0; font-size: 14px; color: #666;">${property.bedrooms} bed • ${property.bathrooms} bath • ${property.size || 'N/A'}</p>
          <div style="text-align: center; margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/properties/${property.id}" 
               style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        </div>
      </div>
    `).join('')

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏡 New Property Matches</h1>
        <p style="color: #e0e0ff; margin: 5px 0 0 0;">Handpicked properties just for you</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea;">Hello ${userData.name || 'Property Seeker'}!</h2>
        
        <p>Great news! We found ${properties.length} new properties that match your search criteria:</p>

        ${propertiesHtml}

        <div style="background: #e8f2ff; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <h4 style="margin-top: 0; color: #2c5aa0;">Want to see more?</h4>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/properties" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Browse All Properties
          </a>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #666;">
          <p>These recommendations are based on your preferences and search history. <a href="#" style="color: #667eea;">Update your preferences</a> to get more relevant matches.</p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'property_recommendations',
      userId: userData.id,
      propertyCount: properties.length,
      template: this.templates.propertyRecommendations
    })
  }

  // Price alert notification
  async sendPriceAlert(userEmail, userData, property, priceChange) {
    const isIncrease = priceChange.newPrice > priceChange.oldPrice
    const changeAmount = Math.abs(priceChange.newPrice - priceChange.oldPrice)
    const changePercent = ((changeAmount / priceChange.oldPrice) * 100).toFixed(1)
    
    const subject = `🚨 Price ${isIncrease ? 'Increase' : 'Drop'} Alert - ${property.title}`
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${isIncrease ? '#dc3545' : '#28a745'}; padding: 25px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🚨 Price ${isIncrease ? 'Increase' : 'Drop'} Alert</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: ${isIncrease ? '#dc3545' : '#28a745'};">Price Update for Your Saved Property</h2>
        
        <div style="background: white; border-radius: 8px; overflow: hidden; margin: 20px 0; border: 1px solid #ddd;">
          <img src="${property.images?.[0] || 'https://via.placeholder.com/400x250/667eea/white?text=🏡'}" 
               alt="${property.title}" 
               style="width: 100%; height: 250px; object-fit: cover;">
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #667eea;">${property.title}</h3>
            <p style="margin: 5px 0; color: #666;">📍 ${property.location}</p>
            
            <div style="background: ${isIncrease ? '#f8d7da' : '#d4edda'}; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid ${isIncrease ? '#f5c6cb' : '#c3e6cb'};">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 14px; color: #666;">Previous Price:</p>
                  <p style="margin: 0; text-decoration: line-through; color: #999;">KSH ${priceChange.oldPrice.toLocaleString()}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-size: 14px; color: #666;">New Price:</p>
                  <p style="margin: 0; font-weight: bold; font-size: 20px; color: ${isIncrease ? '#dc3545' : '#28a745'};">
                    KSH ${priceChange.newPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 10px;">
                <span style="background: ${isIncrease ? '#dc3545' : '#28a745'}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                  ${isIncrease ? '↗️' : '↘️'} ${changePercent}% ${isIncrease ? 'increase' : 'decrease'} (KSH ${changeAmount.toLocaleString()})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/properties/${property.id}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Property Details
          </a>
        </div>

        ${isIncrease ? 
          `<div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
             <p style="margin: 0; color: #856404;"><strong>💡 Tip:</strong> Price increases often indicate high demand. Consider viewing this property soon if you're interested!</p>
           </div>` :
          `<div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
             <p style="margin: 0; color: #155724;"><strong>💰 Great News:</strong> This price drop might be a perfect opportunity to negotiate an even better deal!</p>
           </div>`
        }

        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #666;">
          <p>You're receiving this alert because you saved this property. <a href="#" style="color: #667eea;">Manage your price alerts</a></p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'price_alert',
      userId: userData.id,
      propertyId: property.id,
      priceChange: `${isIncrease ? '+' : '-'}${changePercent}%`,
      template: this.templates.priceAlert
    })
  }

  // Market report email
  async sendMarketReport(userEmail, userData) {
    const subject = '📈 Your Monthly Kenya Property Market Report'
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(45deg, #2c5aa0 0%, #667eea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📈 Market Report</h1>
        <p style="color: #b3d1ff; margin: 5px 0 0 0;">Monthly Property Market Analysis</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c5aa0;">Hello ${userData.name || 'Investor'}!</h2>
        
        <p>Here's your comprehensive monthly market analysis with actionable insights for the Kenyan property market:</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c5aa0; margin-top: 0;">📊 Market Performance</h3>
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <span>Average Property Price:</span>
              <strong style="color: #28a745;">KSH 45.2M (+3.1%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <span>Properties Sold:</span>
              <strong>1,247 units (+15%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <span>Average Days on Market:</span>
              <strong style="color: #28a745;">89 days (-7 days)</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Rental Yield:</span>
              <strong>7.2% (Stable)</strong>
            </div>
          </div>
        </div>

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #28a745;">🚀 Investment Opportunities</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li><strong>Tatu City:</strong> New phase launch - 20% price appreciation expected</li>
            <li><strong>Kitengela:</strong> Infrastructure development driving 15% growth</li>
            <li><strong>Thika Road:</strong> Commercial properties showing strong rental demand</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/market-report" 
             style="background: #2c5aa0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Full Report 📋
          </a>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">💡 Personal Recommendation</h4>
          <p style="margin-bottom: 0;">Based on your search history, consider exploring properties in Kiambu County. The area is showing consistent growth with new infrastructure projects.</p>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 25px; font-size: 12px; color: #666;">
          <p><strong>Ready to invest?</strong> Our property experts can help you identify the best opportunities. <a href="tel:+254700000000" style="color: #2c5aa0;">Call us now!</a></p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail(userEmail, subject, htmlContent, {
      campaign: 'market_report',
      userId: userData.id,
      template: this.templates.marketReport
    })
  }

  // Utility method to send bulk emails
  async sendBulkEmails(emailList, template, templateData = {}) {
    const results = []
    const batchSize = 10 // Send in batches to avoid rate limiting
    
    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize)
      const batchPromises = batch.map(async (emailData) => {
        try {
          const result = await this[`send${template}`](emailData.email, emailData.userData, templateData)
          return { email: emailData.email, success: true, result }
        } catch (error) {
          logger.error(`Failed to send ${template} email to ${emailData.email}:`, error.message)
          return { email: emailData.email, success: false, error: error.message }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Add delay between batches
      if (i + batchSize < emailList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      }
    }
    
    return results
  }

  // Get email statistics
  getEmailStats() {
    return {
      initialized: this.initialized,
      provider: process.env.EMAIL_PROVIDER || 'none',
      templatesAvailable: Object.keys(this.templates).length,
      mode: this.initialized ? 'production' : 'demo'
    }
  }
}

export default new EmailService()