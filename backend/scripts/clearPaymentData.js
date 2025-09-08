// scripts/clearPaymentData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import Expense from '../models/Expense.js';

const clearPaymentData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Starting payment and expense data cleanup...');
    
    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all payment records
      const paymentResult = await Payment.deleteMany({}).session(session);
      console.log(`🗃️  Deleted ${paymentResult.deletedCount} payment records`);

      // 2. Reset tenant balances and clear payment history
      const tenantResult = await Tenant.updateMany(
        {},
        {
          $set: {
            currentBalance: 0
          },
          $unset: {
            paymentHistory: "",
            checkoutDetails: ""
          }
        }
      ).session(session);
      console.log(`👥 Reset balances for ${tenantResult.modifiedCount} tenants`);

      // 3. Reset unit balances and payment dates
      const unitResult = await Unit.updateMany(
        {},
        {
          $set: {
            balance: 0
          },
          $unset: {
            lastPaymentDate: "",
            lastCheckoutDate: ""
          }
        }
      ).session(session);
      console.log(`🏠 Reset balances for ${unitResult.modifiedCount} units`);

      // 4. Delete all expense records
      const expenseResult = await Expense.deleteMany({}).session(session);
      console.log(`💰 Deleted ${expenseResult.deletedCount} expense records`);

      // Commit the transaction
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');

      // Display summary
      console.log('\n📊 CLEANUP SUMMARY:');
      console.log('====================');
      console.log(`✅ Payment records deleted: ${paymentResult.deletedCount}`);
      console.log(`✅ Expense records deleted: ${expenseResult.deletedCount}`);
      console.log(`✅ Tenant balances reset: ${tenantResult.modifiedCount}`);
      console.log(`✅ Unit balances reset: ${unitResult.modifiedCount}`);
      console.log('✅ All payment history cleared');
      console.log('✅ All checkout details cleared');
      console.log('\n🎉 Payment and expense data cleanup completed successfully!');
      console.log('📝 Your system is now ready for fresh financial data entry.');

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('❌ Error clearing payment data:', error);
    console.error('\n🚨 Cleanup failed! Please check the error above.');
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Add confirmation prompt
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚨 WARNING: FINANCIAL DATA DELETION');
console.log('====================================');
console.log('This will permanently delete:');
console.log('• All payment records');
console.log('• All expense records');
console.log('• All tenant payment history');
console.log('• All tenant balances (reset to 0)');
console.log('• All unit balances (reset to 0)');
console.log('• All checkout details');
console.log('\nThis action CANNOT be undone!\n');

rl.question('Are you sure you want to proceed? Type "YES" to confirm: ', (answer) => {
  rl.close();
  
  if (answer === 'YES') {
    console.log('\n🚀 Starting payment and expense data cleanup...\n');
    clearPaymentData();
  } else {
    console.log('\n❌ Operation cancelled. No data was deleted.');
    process.exit(0);
  }
});