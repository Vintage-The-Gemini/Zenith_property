// backend/scripts/resetPaymentsAndBalances.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createInterface } from 'readline';
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import logger from "../utils/logger.js";

dotenv.config();

const resetPaymentsAndBalances = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to MongoDB");
    logger.info("Starting payment and balance reset process...");

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all payments
      const paymentDeleteResult = await Payment.deleteMany({}).session(session);
      console.log(`Deleted ${paymentDeleteResult.deletedCount} payments`);
      logger.info(`Deleted ${paymentDeleteResult.deletedCount} payments`);

      // 2. Reset all tenant balances and payment history
      const tenantUpdateResult = await Tenant.updateMany(
        {},
        {
          $set: {
            currentBalance: 0,
            paymentHistory: []
          }
        },
        { session }
      );
      console.log(`Reset balances for ${tenantUpdateResult.modifiedCount} tenants`);
      logger.info(`Reset balances for ${tenantUpdateResult.modifiedCount} tenants`);

      // 3. Reset unit balances and last payment dates
      const unitUpdateResult = await Unit.updateMany(
        {},
        {
          $set: {
            balance: 0,
            lastPaymentDate: null
          }
        },
        { session }
      );
      console.log(`Reset balances for ${unitUpdateResult.modifiedCount} units`);
      logger.info(`Reset balances for ${unitUpdateResult.modifiedCount} units`);

      // Commit the transaction
      await session.commitTransaction();
      console.log("Successfully reset all payments and balances");
      logger.info("Successfully reset all payments and balances");

      // Optional: Verify the reset
      const remainingPayments = await Payment.countDocuments();
      const tenantsWithBalance = await Tenant.countDocuments({ currentBalance: { $ne: 0 } });
      
      console.log("\nVerification:");
      console.log(`Remaining payments: ${remainingPayments}`);
      console.log(`Tenants with non-zero balance: ${tenantsWithBalance}`);
      
      if (remainingPayments === 0 && tenantsWithBalance === 0) {
        console.log("✓ Reset successful - all payments deleted and balances cleared");
      } else {
        console.log("⚠ Warning: Some data may not have been reset properly");
      }

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      console.error("Error during reset:", error);
      logger.error(`Error during reset: ${error.message}`);
      throw error;
    } finally {
      // End session
      await session.endSession();
    }

    // Disconnect from database
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);

  } catch (error) {
    console.error("Fatal error:", error);
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
};

// Add confirmation prompt for safety
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("⚠️  WARNING: This will delete ALL payments and reset ALL tenant balances!");
console.log("This action cannot be undone.");
console.log("");

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    console.log("Starting reset process...\n");
    rl.close();
    resetPaymentsAndBalances();
  } else {
    console.log("Reset cancelled.");
    rl.close();
    process.exit(0);
  }
});