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
    // Connect to database - Fixed: Changed from MONGO_URI to MONGODB_URI
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

      // 3. Reset unit payment statuses
      const unitUpdateResult = await Unit.updateMany(
        {},
        {
          $set: {
            lastPaymentDate: null,
            nextPaymentDue: null
          }
        },
        { session }
      );
      console.log(`Reset payment status for ${unitUpdateResult.modifiedCount} units`);
      logger.info(`Reset payment status for ${unitUpdateResult.modifiedCount} units`);

      // Commit the transaction
      await session.commitTransaction();
      console.log('\n✅ All payments and balances have been reset successfully!');
      logger.info('Payment and balance reset completed successfully');

    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('❌ Error during reset process:', error);
    logger.error('Error during payment and balance reset:', error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Create readline interface for user confirmation
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main execution with user confirmation
const main = async () => {
  console.log('⚠️  WARNING: This will delete ALL payments and reset ALL tenant balances!');
  console.log('This action cannot be undone.\n');

  rl.question('Are you sure you want to continue? (type "yes" to confirm): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      await resetPaymentsAndBalances();
    } else {
      console.log('Operation cancelled.');
    }
    rl.close();
  });
};

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    rl.close();
    process.exit(1);
  });
}

export { resetPaymentsAndBalances };