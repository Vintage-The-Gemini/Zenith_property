import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTenants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    
    console.log('=== TENANT DATA ANALYSIS ===\n');
    
    tenants.forEach((tenant, i) => {
      console.log(`${i+1}. ${tenant.firstName} ${tenant.lastName}`);
      console.log(`   Current Balance: KES ${(tenant.currentBalance || 0).toLocaleString()}`);
      console.log(`   Lease Start: ${tenant.leaseDetails?.startDate || 'NOT SET'}`);
      console.log(`   Monthly Rent: KES ${(tenant.leaseDetails?.rentAmount || 0).toLocaleString()}`);
      console.log(`   Created: ${tenant.createdAt}`);
      console.log(`   Updated: ${tenant.updatedAt}`);
      
      // Check if lease details are missing
      if (!tenant.leaseDetails?.startDate || !tenant.leaseDetails?.rentAmount) {
        console.log(`   ⚠️  MISSING LEASE DATA!`);
      }
      
      // Check if balance was updated recently
      const now = new Date();
      const updatedRecently = (now - tenant.updatedAt) < (1000 * 60 * 60); // Within 1 hour
      if (updatedRecently) {
        console.log(`   ✅ Recently updated`);
      }
      
      console.log('---');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTenants();