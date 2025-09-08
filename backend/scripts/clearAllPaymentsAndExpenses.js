// backend/scripts/clearAllPaymentsAndExpenses.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";

dotenv.config();

const clearAllData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n🗑️  Deleting all payments...");
    const paymentsDeleted = await Payment.deleteMany({});
    console.log(`✅ Deleted ${paymentsDeleted.deletedCount} payments`);

    console.log("\n🗑️  Deleting all expenses...");
    const expensesDeleted = await Expense.deleteMany({});
    console.log(`✅ Deleted ${expensesDeleted.deletedCount} expenses`);

    console.log("\n🔄 Resetting tenant balances to zero...");
    const tenantsUpdated = await Tenant.updateMany({}, { 
      $set: { 
        currentBalance: 0,
        paymentHistory: []
      }
    });
    console.log(`✅ Reset ${tenantsUpdated.modifiedCount} tenant balances`);

    console.log("\n🔄 Resetting unit balances...");
    const unitsUpdated = await Unit.updateMany({}, { 
      $set: { 
        balance: 0,
        lastPaymentDate: null
      }
    });
    console.log(`✅ Reset ${unitsUpdated.modifiedCount} unit balances`);

    console.log("\n✨ ALL PAYMENTS AND EXPENSES DATA CLEARED!");
    console.log("You can now start fresh with clean data.");

  } catch (error) {
    console.error("❌ Error clearing data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit();
  }
};

clearAllData();