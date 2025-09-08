// backend/scripts/recalculateTenantBalances.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";

dotenv.config();

const recalculateTenantBalances = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all tenants
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.firstName} ${tenant.lastName}`);
      
      // Get all payments for this tenant, sorted by date
      const payments = await Payment.find({ tenant: tenant._id })
        .sort({ paymentDate: 1, createdAt: 1 });

      console.log(`  Found ${payments.length} payments`);

      if (!tenant.leaseDetails?.rentAmount) {
        console.log(`  Skipping - no lease details/rent amount`);
        continue;
      }

      const monthlyRent = tenant.leaseDetails.rentAmount;
      let runningBalance = 0;

      // Get unique payment periods to calculate what's owed
      const periods = new Map();
      
      payments.forEach(payment => {
        const key = `${payment.paymentPeriod.year}-${payment.paymentPeriod.month}`;
        if (!periods.has(key)) {
          periods.set(key, {
            ...payment.paymentPeriod,
            baseRent: monthlyRent,
            totalPaid: 0,
            payments: []
          });
        }
        
        const period = periods.get(key);
        period.totalPaid += payment.amountPaid;
        period.payments.push(payment);
      });

      // Calculate current balance
      periods.forEach(period => {
        const periodBalance = period.baseRent - period.totalPaid;
        runningBalance += Math.max(0, periodBalance); // Only count positive balances
      });

      // Add any unpaid periods (months where rent was due but no payment made)
      const leaseStart = new Date(tenant.leaseDetails.startDate);
      const now = new Date();
      
      const tempDate = new Date(leaseStart);
      while (tempDate <= now) {
        const year = tempDate.getFullYear();
        const month = tempDate.getMonth() + 1;
        const key = `${year}-${month}`;
        
        if (!periods.has(key)) {
          // This month had no payments, so full rent is owed
          runningBalance += monthlyRent;
        }
        
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      // Update tenant's current balance
      const oldBalance = tenant.currentBalance || 0;
      tenant.currentBalance = runningBalance;
      
      console.log(`  Old balance: KES ${oldBalance.toLocaleString()}`);
      console.log(`  New balance: KES ${runningBalance.toLocaleString()}`);
      
      await tenant.save();
    }

    console.log("\n✅ All tenant balances recalculated successfully!");

  } catch (error) {
    console.error("❌ Error recalculating tenant balances:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit();
  }
};

recalculateTenantBalances();