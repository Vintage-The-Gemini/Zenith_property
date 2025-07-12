// backend/scripts/seedRoles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Fixed: Changed from MONGO_URI to MONGODB_URI to match .env file
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Seed default roles
const seedRoles = async () => {
  try {
    console.log('Starting role seeding...');
    
    // Use the static method from the Role model
    await Role.seedDefaultRoles();
    
    console.log('✅ Default roles seeded successfully!');
    
    // List all roles
    const roles = await Role.find().sort({ hierarchy: 1 });
    console.log('\n📋 Available roles:');
    roles.forEach(role => {
      console.log(`  - ${role.displayName} (${role.name}) - Level ${role.hierarchy}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedRoles();
  
  console.log('\n🎉 Role seeding completed!');
  process.exit(0);
};

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { seedRoles };