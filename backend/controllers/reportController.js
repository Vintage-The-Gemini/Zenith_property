// backend/controllers/reportController.js
import mongoose from "mongoose";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import logger from "../utils/logger.js";

/**
 * Get financial summary report
 */
export const getFinancialSummary = async (req, res) => {
    try {
      // Extract filter parameters
      const { startDate, endDate, propertyId } = req.query;
  
      // Build date filter
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
  
      // Build property filter
      const propertyFilter = {};
      if (propertyId) {
        // Fix the ObjectId usage
        try {
          propertyFilter.property = mongoose.Types.ObjectId.createFromHexString(propertyId);
        } catch (error) {
          // If there's an issue with the ObjectId, use a safer approach
          propertyFilter.property = propertyId;
        }
      }
  
      // Query payments
      const payments = await Payment.find({
        ...(Object.keys(dateFilter).length > 0
          ? { paymentDate: dateFilter }
          : {}),
        ...propertyFilter,
      })
        .populate("tenant")
        .populate("property")
        .populate("unit");
  
      // Query expenses
      const expenses = await Expense.find({
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        ...propertyFilter,
      }).populate("property");
  
      // Calculate totals
      const totalRevenue = payments
        .filter((payment) => payment.status === "completed")
        .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
  
      const pendingRevenue = payments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => sum + (payment.amountDue || 0), 0);
  
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
  
      // Group revenue by month
      const revenueByMonth = {};
      payments.forEach((payment) => {
        if (payment.status !== "completed") return;
  
        const date = new Date(payment.paymentDate);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
  
        if (!revenueByMonth[monthYear]) {
          revenueByMonth[monthYear] = {
            month: new Date(
              date.getFullYear(),
              date.getMonth(),
              1
            ).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            revenue: 0,
            expenses: 0,
          };
        }
  
        revenueByMonth[monthYear].revenue += (payment.amountPaid || 0);
      });
  
      // Group expenses by month
      expenses.forEach((expense) => {
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
  
        if (!revenueByMonth[monthYear]) {
          revenueByMonth[monthYear] = {
            month: new Date(
              date.getFullYear(),
              date.getMonth(),
              1
            ).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            revenue: 0,
            expenses: 0,
          };
        }
  
        revenueByMonth[monthYear].expenses += expense.amount;
      });
  
      // Group revenue by property
      const revenueByProperty = {};
  
      payments.forEach((payment) => {
        if (payment.status !== "completed") return;
        const propertyId = payment.property?._id || payment.property;
        if (!propertyId) return;
  
        const propId = propertyId.toString(); // Convert ObjectId to string for consistent keys
        
        if (!revenueByProperty[propId]) {
          revenueByProperty[propId] = {
            propertyId: propId,
            name: payment.property?.name || "Unknown Property",
            revenue: 0,
            expenses: 0,
            profit: 0,
          };
        }
  
        revenueByProperty[propId].revenue += (payment.amountPaid || 0);
      });
  
      // Add expenses to property revenue
      expenses.forEach((expense) => {
        const propertyId = expense.property?._id || expense.property;
        if (!propertyId) return;
  
        const propId = propertyId.toString(); // Convert ObjectId to string for consistent keys
        
        if (!revenueByProperty[propId]) {
          revenueByProperty[propId] = {
            propertyId: propId,
            name: expense.property?.name || "Unknown Property",
            revenue: 0,
            expenses: 0,
            profit: 0,
          };
        }
  
        revenueByProperty[propId].expenses += expense.amount;
      });
  
      // Calculate profit
      Object.keys(revenueByProperty).forEach((key) => {
        revenueByProperty[key].profit =
          revenueByProperty[key].revenue - revenueByProperty[key].expenses;
      });
  
      res.json({
        summary: {
          totalRevenue,
          pendingRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
        },
        revenueByMonth: Object.values(revenueByMonth),
        revenueByProperty: Object.values(revenueByProperty),
        payments,
      });
    } catch (error) {
      logger.error(`Error in getFinancialSummary: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
/**
 * Get occupancy report
 */
export const getOccupancyReport = async (req, res) => {
  try {
    const { propertyId } = req.query;

    // Build property filter
    const propertyFilter = {};
    if (propertyId) propertyFilter._id = mongoose.Types.ObjectId(propertyId);

    // Get properties
    const properties = await Property.find(propertyFilter);

    // Get units
    const units = await Unit.find(
      propertyId ? { propertyId: mongoose.Types.ObjectId(propertyId) } : {}
    ).populate("propertyId");

    // Calculate overall occupancy
    const totalUnits = units.length;
    const occupiedUnits = units.filter(
      (unit) => unit.status === "occupied"
    ).length;
    const availableUnits = units.filter(
      (unit) => unit.status === "available"
    ).length;
    const maintenanceUnits = units.filter(
      (unit) => unit.status === "maintenance"
    ).length;

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Calculate occupancy by property
    const occupancyByProperty = {};

    properties.forEach((property) => {
      occupancyByProperty[property._id] = {
        propertyId: property._id,
        name: property.name,
        total: 0,
        occupied: 0,
        available: 0,
        maintenance: 0,
        rate: 0,
      };
    });

    units.forEach((unit) => {
      const propertyId = unit.propertyId?._id || unit.propertyId;
      if (!propertyId || !occupancyByProperty[propertyId]) return;

      occupancyByProperty[propertyId].total += 1;

      if (unit.status === "occupied") {
        occupancyByProperty[propertyId].occupied += 1;
      } else if (unit.status === "available") {
        occupancyByProperty[propertyId].available += 1;
      } else if (unit.status === "maintenance") {
        occupancyByProperty[propertyId].maintenance += 1;
      }
    });

    // Calculate occupancy rates
    Object.keys(occupancyByProperty).forEach((key) => {
      const property = occupancyByProperty[key];
      property.rate =
        property.total > 0
          ? Math.round((property.occupied / property.total) * 100)
          : 0;
    });

    // Get tenants with lease expiration data
    const tenants = await Tenant.find({ status: "active" })
      .populate("unitId")
      .populate("propertyId");

    // Filter tenants with valid lease end dates
    const tenantsWithLeases = tenants.filter(
      (tenant) => tenant.leaseDetails && tenant.leaseDetails.endDate
    );

    // Calculate lease expiration
    const leaseExpirations = tenantsWithLeases.map((tenant) => {
      const endDate = new Date(tenant.leaseDetails.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24)
      );

      return {
        tenantId: tenant._id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        propertyName: tenant.propertyId?.name || "Unknown",
        unitNumber: tenant.unitId?.unitNumber || "Unknown",
        leaseStartDate: tenant.leaseDetails.startDate,
        leaseEndDate: tenant.leaseDetails.endDate,
        daysRemaining: daysRemaining,
      };
    });

    // Sort by expiration date (ascending)
    leaseExpirations.sort(
      (a, b) => new Date(a.leaseEndDate) - new Date(b.leaseEndDate)
    );

    res.json({
      summary: {
        totalUnits,
        occupiedUnits,
        availableUnits,
        maintenanceUnits,
        occupancyRate,
      },
      occupancyByProperty: Object.values(occupancyByProperty),
      leaseExpirations,
    });
  } catch (error) {
    logger.error(`Error in getOccupancyReport: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get tenant payment report
 */
export const getTenantPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, propertyId } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get tenants
    const tenantFilter = {};
    if (propertyId)
      tenantFilter.propertyId = mongoose.Types.ObjectId(propertyId);

    const tenants = await Tenant.find(tenantFilter)
      .populate("unitId")
      .populate("propertyId");

    // Get payments
    const paymentFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      paymentFilter.paymentDate = dateFilter;
    }
    if (propertyId) {
      paymentFilter.property = mongoose.Types.ObjectId(propertyId);
    }

    const payments = await Payment.find(paymentFilter)
      .populate("tenant")
      .populate("unit")
      .populate("property");

    // Group payments by tenant
    const tenantPayments = {};

    tenants.forEach((tenant) => {
      tenantPayments[tenant._id] = {
        tenantId: tenant._id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
        phone: tenant.phone,
        unit: tenant.unitId?.unitNumber || "Unknown",
        property: tenant.propertyId?.name || "Unknown",
        totalPaid: 0,
        totalDue: 0,
        lastPaymentDate: null,
        balance: tenant.currentBalance || 0,
        paymentHistory: [],
      };
    });

    // Add payment data
    payments.forEach((payment) => {
      const tenantId = payment.tenant?._id || payment.tenant;
      if (!tenantId || !tenantPayments[tenantId]) return;

      if (payment.status === "completed") {
        tenantPayments[tenantId].totalPaid += payment.amount;

        // Update last payment date
        const paymentDate = new Date(payment.paymentDate);
        if (
          !tenantPayments[tenantId].lastPaymentDate ||
          paymentDate > new Date(tenantPayments[tenantId].lastPaymentDate)
        ) {
          tenantPayments[tenantId].lastPaymentDate = payment.paymentDate;
        }

        // Add to payment history
        tenantPayments[tenantId].paymentHistory.push({
          date: payment.paymentDate,
          amount: payment.amount,
          status: payment.status,
          type: payment.type,
          reference: payment.reference,
        });
      } else if (payment.status === "pending") {
        tenantPayments[tenantId].totalDue += payment.amount;
      }
    });

    // Calculate payment timeliness
    const onTimePayments = payments.filter((payment) => {
      if (payment.status !== "completed" || !payment.dueDate) return false;
      const dueDate = new Date(payment.dueDate);
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate <= dueDate;
    }).length;

    const latePayments = payments.filter((payment) => {
      if (payment.status !== "completed" || !payment.dueDate) return false;
      const dueDate = new Date(payment.dueDate);
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate > dueDate;
    }).length;

    const totalCompletedPayments = onTimePayments + latePayments;
    const onTimeRate =
      totalCompletedPayments > 0
        ? Math.round((onTimePayments / totalCompletedPayments) * 100)
        : 0;

    res.json({
      summary: {
        totalTenants: tenants.length,
        activeTenants: tenants.filter((tenant) => tenant.status === "active")
          .length,
        onTimePayments,
        latePayments,
        onTimeRate,
      },
      tenantPayments: Object.values(tenantPayments),
    });
  } catch (error) {
    logger.error(`Error in getTenantPaymentReport: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get revenue vs expenses report
 */
export const getRevenueVsExpenses = async (req, res) => {
  try {
    const { startDate, endDate, propertyId, period } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build property filter
    const propertyFilter = {};
    if (propertyId)
      propertyFilter.property = mongoose.Types.ObjectId(propertyId);

    // Get payments
    const payments = await Payment.find({
      ...(Object.keys(dateFilter).length > 0
        ? { paymentDate: dateFilter }
        : {}),
      ...propertyFilter,
      status: "completed",
    });

    // Get expenses
    const expenses = await Expense.find({
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      ...propertyFilter,
    });

    // Group by period (daily, weekly, monthly, quarterly, yearly)
    const getPeriodKey = (date, periodType) => {
      const d = new Date(date);
      switch (periodType) {
        case "daily":
          return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        case "weekly":
          const weekNumber = Math.ceil(
            (d.getDate() +
              new Date(d.getFullYear(), d.getMonth(), 1).getDay()) /
              7
          );
          return `${d.getFullYear()}-${d.getMonth() + 1}-W${weekNumber}`;
        case "monthly":
          return `${d.getFullYear()}-${d.getMonth() + 1}`;
        case "quarterly":
          const quarter = Math.floor(d.getMonth() / 3) + 1;
          return `${d.getFullYear()}-Q${quarter}`;
        case "yearly":
          return `${d.getFullYear()}`;
        default:
          return `${d.getFullYear()}-${d.getMonth() + 1}`;
      }
    };

    const getPeriodLabel = (key, periodType) => {
      switch (periodType) {
        case "daily":
          const [year, month, day] = key.split("-");
          return `${month}/${day}/${year}`;
        case "weekly":
          const [weekYear, weekMonth, week] = key.split("-");
          return `${weekMonth}/${week} ${weekYear}`;
        case "monthly":
          const [monthYear, monthNum] = key.split("-");
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${monthNames[parseInt(monthNum) - 1]} ${monthYear}`;
        case "quarterly":
          const [qYear, quarter] = key.split("-");
          return `${quarter} ${qYear}`;
        case "yearly":
          return key;
        default:
          const [mYear, mMonth] = key.split("-");
          const mNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${mNames[parseInt(mMonth) - 1]} ${mYear}`;
      }
    };

    const periodData = {};
    const periodType = period || "monthly";

    // Group payments by period
    payments.forEach((payment) => {
      const periodKey = getPeriodKey(payment.paymentDate, periodType);

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: getPeriodLabel(periodKey, periodType),
          revenue: 0,
          expenses: 0,
          profit: 0,
        };
      }

      periodData[periodKey].revenue += payment.amount;
    });

    // Group expenses by period
    expenses.forEach((expense) => {
      const periodKey = getPeriodKey(expense.date, periodType);

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: getPeriodLabel(periodKey, periodType),
          revenue: 0,
          expenses: 0,
          profit: 0,
        };
      }

      periodData[periodKey].expenses += expense.amount;
    });

    // Calculate profit
    Object.keys(periodData).forEach((key) => {
      periodData[key].profit =
        periodData[key].revenue - periodData[key].expenses;
    });

    // Convert to array and sort by period
    const result = Object.values(periodData).sort((a, b) => {
      // Extract dates for comparison based on period type
      const getDateFromPeriod = (period, type) => {
        switch (type) {
          case "daily":
            const [month, day, year] = period.split("/");
            return new Date(year, month - 1, day);
          case "weekly":
            const [weekMonth, weekInfo, weekYear] = period.split(" ");
            return new Date(weekYear, weekMonth.split("/")[0] - 1, 1);
          case "monthly":
            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const monthIndex = monthNames.indexOf(period.split(" ")[0]);
            return new Date(period.split(" ")[1], monthIndex, 1);
          case "quarterly":
            const quarterYear = period.split(" ")[1];
            const quarterNum = period.split(" ")[0][1];
            return new Date(quarterYear, (quarterNum - 1) * 3, 1);
          case "yearly":
            return new Date(period, 0, 1);
          default:
            const mNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const mIndex = mNames.indexOf(period.split(" ")[0]);
            return new Date(period.split(" ")[1], mIndex, 1);
        }
      };

      return (
        getDateFromPeriod(a.period, periodType) -
        getDateFromPeriod(b.period, periodType)
      );
    });

    res.json({
      summary: {
        totalRevenue: payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        ),
        totalExpenses: expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
        netProfit:
          payments.reduce((sum, payment) => sum + payment.amount, 0) -
          expenses.reduce((sum, expense) => sum + expense.amount, 0),
      },
      periodType,
      data: result,
    });
  } catch (error) {
    logger.error(`Error in getRevenueVsExpenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get lease expiration report
 */
export const getLeaseExpirationReport = async (req, res) => {
  try {
    const { propertyId } = req.query;

    // Build property filter
    const propertyFilter = {};
    if (propertyId)
      propertyFilter.propertyId = mongoose.Types.ObjectId(propertyId);

    // Get active tenants
    const tenants = await Tenant.find({
      ...propertyFilter,
      status: "active",
    })
      .populate("unitId")
      .populate("propertyId");

    // Filter tenants with valid lease end dates
    const tenantsWithLeases = tenants.filter(
      (tenant) => tenant.leaseDetails && tenant.leaseDetails.endDate
    );

    // Calculate lease expiration
    const today = new Date();

    const leaseExpirations = tenantsWithLeases.map((tenant) => {
      const endDate = new Date(tenant.leaseDetails.endDate);
      const daysRemaining = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24)
      );

      let expiryCategory;
      if (daysRemaining <= 0) {
        expiryCategory = "expired";
      } else if (daysRemaining <= 30) {
        expiryCategory = "critical";
      } else if (daysRemaining <= 90) {
        expiryCategory = "warning";
      } else {
        expiryCategory = "good";
      }

      return {
        tenantId: tenant._id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
        phone: tenant.phone,
        propertyName: tenant.propertyId?.name || "Unknown",
        unitNumber: tenant.unitId?.unitNumber || "Unknown",
        leaseStartDate: tenant.leaseDetails.startDate,
        leaseEndDate: tenant.leaseDetails.endDate,
        rentAmount: tenant.leaseDetails.rentAmount,
        daysRemaining,
        expiryCategory,
      };
    });

    // Sort by days remaining (ascending)
    leaseExpirations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Calculate summary
    const expiredCount = leaseExpirations.filter(
      (lease) => lease.expiryCategory === "expired"
    ).length;
    const criticalCount = leaseExpirations.filter(
      (lease) => lease.expiryCategory === "critical"
    ).length;
    const warningCount = leaseExpirations.filter(
      (lease) => lease.expiryCategory === "warning"
    ).length;
    const goodCount = leaseExpirations.filter(
      (lease) => lease.expiryCategory === "good"
    ).length;

    res.json({
      summary: {
        totalLeases: leaseExpirations.length,
        expired: expiredCount,
        critical: criticalCount,
        warning: warningCount,
        good: goodCount,
      },
      leases: leaseExpirations,
    });
  } catch (error) {
    logger.error(`Error in getLeaseExpirationReport: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Export report to CSV or PDF
 */
export const exportReport = async (req, res) => {
  try {
    const { type, format } = req.params;
    const filters = req.query;

    logger.info(
      `Report export requested: ${type} in ${format} format with filters: ${JSON.stringify(
        filters
      )}`
    );

    // For now, we'll just return a placeholder response
    // In a real implementation, you would generate a CSV or PDF file
    // based on the report type and format

    res.status(200).json({
      message: "Report export functionality is not yet implemented",
      details: {
        type,
        format,
        filters,
      },
    });
  } catch (error) {
    logger.error(`Error in exportReport: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
