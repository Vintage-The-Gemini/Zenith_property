import mongoose from 'mongoose'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@palvoria.com' },
        { role: 'admin' }
      ]
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      process.exit(0)
    }

    // Create admin user
    const adminUser = new User({
      name: 'Palvoria Administrator',
      email: 'admin@palvoria.com',
      phone: '+254700000000',
      password: 'palv2024!',
      role: 'admin',
      permissions: [
        'property.create',
        'property.read',
        'property.update',
        'property.delete',
        'user.manage',
        'analytics.view',
        'system.admin'
      ],
      isVerified: true,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      subscription: {
        plan: 'enterprise',
        isActive: true
      }
    })

    await adminUser.save()
    console.log('✅ Admin user created successfully!')
    console.log('Email: admin@palvoria.com')
    console.log('Password: palv2024!')
    console.log('Role: admin')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  } finally {
    mongoose.connection.close()
  }
}

createAdminUser()