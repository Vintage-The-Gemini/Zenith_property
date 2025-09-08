// backend/scripts/recalculateBalancesProper.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";

dotenv.config();

const recalculateBalancesProper = async () => {
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
        tenant.currentBalance = 0;
        await tenant.save();
        continue;
      }

      const monthlyRent = tenant.leaseDetails.rentAmount;

      // CORRECT LOGIC: Calculate total amount due from lease start to now
      const leaseStart = new Date(tenant.leaseDetails.startDate);
      const now = new Date();
      let totalAmountDue = 0;
      let totalPayments = 0;

      // Calculate total payments made
      totalPayments = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

      // Calculate how many rent periods have passed since lease start
      if (leaseStart <= now) {
        const currentDate = new Date(leaseStart);
        
        // Count complete months from lease start to now
        while (currentDate <= now) {
          totalAmountDue += monthlyRent;
          console.log(`    Month ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}: Added KES ${monthlyRent.toLocaleString()} to total due`);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Current balance = what they owe - what they've paid
      const netBalance = totalAmountDue - totalPayments;

      console.log(`  Lease Start: ${leaseStart.toDateString()}`);
      console.log(`  Total Amount Due: KES ${totalAmountDue.toLocaleString()}`);
      console.log(`  Total Payments Made: KES ${totalPayments.toLocaleString()}`);
      
      if (netBalance > 0) {
        console.log(`  Balance (Amount Owed): KES ${netBalance.toLocaleString()}`);
      } else if (netBalance < 0) {
        console.log(`  Balance (Credit/Overpayment): KES ${Math.abs(netBalance).toLocaleString()}`);
      } else {
        console.log(`  Balance: KES 0 - Fully Paid Up!`);
      }
      

      // Update tenant's current balance
      const oldBalance = tenant.currentBalance || 0;
      tenant.currentBalance = netBalance;
      
      console.log(`  Updated balance from KES ${oldBalance.toLocaleString()} to KES ${netBalance.toLocaleString()}`);
      
      await tenant.save();
    }

    console.log("\n✅ All tenant balances recalculated with proper logic!");

  } catch (error) {
    console.error("❌ Error recalculating tenant balances:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit();
  }
};

recalculateBalancesProper();