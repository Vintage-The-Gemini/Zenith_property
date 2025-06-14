// backend/controllers/dashboardController.js
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import logger from "../utils/logger.js";

export const getDashboardSummary = async (req, res) => {
  try {
    // Get basic counts
    const totalProperties = await Property.countDocuments();
    const totalUnits = await Unit.countDocuments();
    const totalTenants = await Tenant.countDocuments({ status: "active" });
    const occupiedUnits = await Unit.countDocuments({ status: "occupied" });
    const availableUnits = await Unit.countDocuments({ status: "available" });

    // Calculate occupancy rate
    const occupancyRate = totalUnits > 0 
      ? Math.round((occupiedUnits / totalUnits) * 100) 
      : 0;

    // Get financial data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get this month's payments
    const monthlyPayments = await Payment.find({
      paymentDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lte: new Date(currentYear, currentMonth + 1, 0)
      },
      status: "completed"
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => 
      sum + (payment.amountPaid || 0), 0
    );

    // Get all completed payments
    const totalPayments = await Payment.find({ status: "completed" });
    const totalRevenue = totalPayments.reduce((sum, payment) => 
      sum + (payment.amountPaid || 0), 0
    );

    // Get expenses
    const expenses = await Expense.find({ paymentStatus: "paid" });
    const totalExpenses = expenses.reduce((sum, expense) => 
      sum + (expense.amount || 0), 0
    );

    // Calculate net income
    const netIncome = totalRevenue - totalExpenses;

    // Get outstanding payments
    const outstandingPayments = await Payment.find({ status: "pending" });
    const outstandingAmount = outstandingPayments.reduce((sum, payment) => 
      sum + (payment.amountDue || 0), 0
    );

    // Return summary
    res.json({
      totalProperties,
      totalUnits,
      totalTenants,
      occupiedUnits,
      availableUnits,
      occupancyRate,
      monthlyRevenue,
      totalRevenue,
      totalExpenses,
      netIncome,
      outstandingPayments: outstandingAmount,
    });
  } catch (error) {
    logger.error(`Error fetching dashboard summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};