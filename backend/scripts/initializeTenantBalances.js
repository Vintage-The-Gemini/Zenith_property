// backend/scripts/initializeTenantBalances.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/Tenant.js";

dotenv.config();

const initializeBalances = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n🏠 Setting tenant balances to their monthly rent amounts...");
    
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants`);

    let updated = 0;
    
    for (const tenant of tenants) {
      if (tenant.leaseDetails?.rentAmount) {
        const monthlyRent = tenant.leaseDetails.rentAmount;
        tenant.currentBalance = monthlyRent;
        await tenant.save();
        
        console.log(`✅ ${tenant.firstName} ${tenant.lastName}: KES ${monthlyRent.toLocaleString()}`);
        updated++;
      } else {
        console.log(`⚠️  ${tenant.firstName} ${tenant.lastName}: No rent amount set`);
      }
    }

    console.log(`\n✨ Updated ${updated} tenant balances to their monthly rent amounts!`);
    console.log("Now tenants owe their monthly rent and balances will decrease as they pay.");

  } catch (error) {
    console.error("❌ Error initializing balances:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit();
  }
};

initializeBalances();