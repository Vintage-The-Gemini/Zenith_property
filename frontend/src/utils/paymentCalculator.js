// frontend/src/utils/paymentCalculator.js
/**
 * Calculate the amount due for a tenant based on previous payments and rent amount
 * @param {Object} tenant - Tenant data with payment history
 * @param {Date} dueDateForMonth - The due date for the month
 * @returns {Object} Due amount calculations
 */
export const calculateDueAmount = (tenant, dueDateForMonth = new Date()) => {
  if (!tenant) return { dueAmount: 0, overdue: 0, carryForward: 0 };

  const baseRentAmount = tenant.leaseDetails?.rentAmount || 0;
  const currentBalance = tenant.currentBalance || 0;

  // Calculate carry forward (positive means credit, negative means debt)
  const carryForward = -currentBalance; // Negate because positive balance means tenant owes money

  // Calculate amount due (base rent adjusted by carry forward)
  let dueAmount = baseRentAmount - (carryForward > 0 ? carryForward : 0);
  dueAmount = Math.max(0, dueAmount); // Don't go below zero

  // Calculate overdue amount (if tenant has negative carry forward and past due date)
  const today = new Date();
  const isDueDate = today > dueDateForMonth;
  const overdue = isDueDate && carryForward < 0 ? Math.abs(carryForward) : 0;

  return {
    baseRentAmount,
    dueAmount,
    carryForward,
    overdue,
    currentBalance,
  };
};

/**
 * Calculate payment period dates based on custom due day
 * @param {number} dueDay - Day of month when payment is due (1-31)
 * @param {Date} referenceDate - Reference date (defaults to today)
 * @returns {Object} Payment period information
 */
export const calculatePaymentPeriod = (
  dueDay = 1,
  referenceDate = new Date()
) => {
  const today = new Date(referenceDate);

  // Normalize due day (1-28 for consistency across months)
  const normalizedDueDay = Math.min(Math.max(1, dueDay), 28);

  // Current month's due date
  const currentMonthDueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    normalizedDueDay
  );

  // Next month's due date
  const nextMonthDueDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    normalizedDueDay
  );

  // Previous month's due date
  const prevMonthDueDate = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    normalizedDueDay
  );

  // Determine current payment period
  let periodStart, periodEnd;

  // If today is before current month due date, period is from prev month to current month
  if (today < currentMonthDueDate) {
    periodStart = prevMonthDueDate;
    periodEnd = currentMonthDueDate;
  } else {
    // Otherwise period is from current month to next month
    periodStart = currentMonthDueDate;
    periodEnd = nextMonthDueDate;
  }

  // Check if payment is overdue (past due date but still in current period)
  const isOverdue = today > periodStart && today < periodEnd;

  // Calculate days until payment is due
  const daysUntilDue = Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24));

  return {
    periodStart,
    periodEnd,
    currentDueDate: currentMonthDueDate,
    nextDueDate: nextMonthDueDate,
    isOverdue,
    daysUntilDue,
    isCurrentPeriod: today >= periodStart && today < periodEnd,
  };
};

/**
 * Calculate carry forward amounts between payment periods
 * @param {Array} payments - List of payments for a tenant
 * @param {number} rentAmount - Monthly rent amount
 * @returns {Object} Carry forward information
 */
export const calculateCarryForward = (payments, rentAmount) => {
  if (!payments || payments.length === 0) {
    return {
      carryForwardAmount: 0,
      currentPeriodPayments: 0,
      previousPeriodPayments: 0,
      hasOverpayment: false,
      hasUnderpayment: false,
    };
  }

  // Sort payments by date
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(a.date || a.paymentDate) - new Date(b.date || b.paymentDate)
  );

  // Current date to determine periods
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Separate current and previous period payments
  const currentPeriodPayments = sortedPayments.filter((payment) => {
    const paymentDate = new Date(payment.date || payment.paymentDate);
    return (
      paymentDate.getMonth() === currentMonth &&
      paymentDate.getFullYear() === currentYear &&
      (payment.status === "completed" || payment.status === "partial")
    );
  });

  const previousPeriodPayments = sortedPayments.filter((payment) => {
    const paymentDate = new Date(payment.date || payment.paymentDate);
    return (
      (paymentDate.getMonth() < currentMonth ||
        paymentDate.getFullYear() < currentYear) &&
      (payment.status === "completed" || payment.status === "partial")
    );
  });

  // Calculate totals
  const currentPeriodTotal = currentPeriodPayments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );

  const previousPeriodTotal = previousPeriodPayments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );

  // Calculate previous periods expected rent
  const previousPeriodsCount =
    previousPeriodPayments.length > 0
      ? Math.ceil(previousPeriodPayments.length / 2)
      : 0;

  const expectedPreviousPeriodTotal = previousPeriodsCount * rentAmount;

  // Calculate carry forward
  const carryForwardAmount = previousPeriodTotal - expectedPreviousPeriodTotal;

  return {
    carryForwardAmount,
    currentPeriodPayments: currentPeriodTotal,
    previousPeriodPayments: previousPeriodTotal,
    expectedPreviousPeriodTotal,
    hasOverpayment: carryForwardAmount > 0,
    hasUnderpayment: carryForwardAmount < 0,
  };
};

/**
 * Calculate amount due for the current payment period
 * @param {Object} tenant - Tenant data
 * @returns {Object} Due amount for current period
 */
export const calculateCurrentPeriodDue = (tenant) => {
  if (!tenant || !tenant.leaseDetails) {
    return {
      amountDue: 0,
      dueDate: new Date(),
      isOverdue: false,
    };
  }

  // Get rent amount from lease details
  const rentAmount = tenant.leaseDetails.rentAmount || 0;

  // Get custom due day or default to 1st of month
  const dueDay = tenant.leaseDetails.paymentDueDay || 1;

  // Calculate payment period
  const period = calculatePaymentPeriod(dueDay);

  // Get carry forward from previous periods
  const carryForward = calculateCarryForward(
    tenant.paymentHistory || [],
    rentAmount
  );

  // Calculate amount due for current period
  let amountDue = rentAmount;

  // Adjust for carry forward - reduce if overpayment, increase if underpayment
  if (carryForward.hasOverpayment) {
    amountDue = Math.max(0, rentAmount - carryForward.carryForwardAmount);
  } else if (carryForward.hasUnderpayment) {
    amountDue = rentAmount + Math.abs(carryForward.carryForwardAmount);
  }

  // Calculate current period payments
  const currentPeriodPayments = (tenant.paymentHistory || [])
    .filter((payment) => {
      const paymentDate = new Date(payment.date || payment.paymentDate);
      return (
        paymentDate >= period.periodStart &&
        paymentDate < period.periodEnd &&
        (payment.status === "completed" || payment.status === "partial")
      );
    })
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Adjust amount due based on payments already made in current period
  amountDue = Math.max(0, amountDue - currentPeriodPayments);

  return {
    amountDue,
    baseRentAmount: rentAmount,
    dueDate: period.currentDueDate,
    nextDueDate: period.nextDueDate,
    isOverdue: period.isOverdue && amountDue > 0,
    daysUntilDue: period.daysUntilDue,
    currentPeriodPayments,
    carryForwardAmount: carryForward.carryForwardAmount,
    hasCarryForward: carryForward.carryForwardAmount !== 0,
  };
};


export const calculateMonthlyBreakdown = (payments) => {
  if (!payments || payments.length === 0) {
    return [];
  }

  // Group payments by month
  const monthlyData = {};

  payments.forEach(payment => {
    if (!payment.paymentDate) return;
    
    const date = new Date(payment.paymentDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        monthKey,
        completed: 0,
        pending: 0,
        overdue: 0,
        totalPayments: 0
      };
    }
    
    if (payment.status === 'completed' || payment.status === 'partial') {
      monthlyData[monthKey].completed += payment.amount || 0;
    } else if (payment.status === 'pending') {
      const now = new Date();
      const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
      
      if (dueDate && dueDate < now) {
        monthlyData[monthKey].overdue += payment.amount || 0;
      } else {
        monthlyData[monthKey].pending += payment.amount || 0;
      }
    }
    
    monthlyData[monthKey].totalPayments++;
  });

  // Convert to array and sort by date (newest first)
  return Object.values(monthlyData).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
};


/**
 * Filter payments based on search and filters
 * @param {Array} payments - List of payments
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered payments
 */
export const filterPayments = (payments, searchTerm, filters) => {
    if (!payments) return [];
    
    return payments.filter(payment => {
      // Apply search filter
      const searchLower = searchTerm.toLowerCase();
      const tenantName = payment.tenant
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
        : "";
      const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
      const reference = payment.reference?.toLowerCase() || "";
      const propertyName = payment.property?.name?.toLowerCase() || "";
      
      const searchMatch =
        tenantName.includes(searchLower) ||
        unitNumber.includes(searchLower) ||
        reference.includes(searchLower) ||
        propertyName.includes(searchLower);
      
      if (searchTerm && !searchMatch) return false;
      
      // Apply tenant filter
      if (filters.tenantId && payment.tenant?._id !== filters.tenantId) {
        return false;
      }
      
      // Apply status filter
      if (filters.status && payment.status !== filters.status) {
        return false;
      }
      
      // Apply type filter
      if (filters.type && payment.type !== filters.type) {
        return false;
      }
      
      // Apply date filters
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate > endDate) return false;
      }
      
      return true;
    });
  };

 
export const calculatePaymentSummary = (payments, tenants = []) => {
  if (!payments || payments.length === 0) {
    return {
      monthlyTotal: 0,
      pendingTotal: 0,
      varianceTotal: 0,
      lastMonthRevenue: 0,
      growthRate: 0,
      overdueTotal: 0,
      netBalanceTotal: 0
    };
  }
  
  // Get current date info
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Last month date range
  const lastMonthDate = new Date(now);
  lastMonthDate.setMonth(currentMonth - 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();
  
  // Calculate total by status
  // Removed unused variable 'completed'
    
  const pending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const variance = payments
    .filter(p => p.status === 'completed' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.paymentVariance || 0), 0);
    
  // Calculate monthly revenue
  const currentMonthPayments = payments.filter(p => {
    const date = new Date(p.paymentDate);
    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear &&
      (p.status === 'completed' || p.status === 'partial')
    );
  });
  
  const monthlyTotal = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Calculate last month's revenue for growth rate
  const lastMonthPayments = payments.filter(p => {
    const date = new Date(p.paymentDate);
    return (
      date.getMonth() === lastMonth &&
      date.getFullYear() === lastMonthYear &&
      (p.status === 'completed' || p.status === 'partial')
    );
  });
  
  const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Calculate growth rate
  const growthRate = lastMonthRevenue > 0
    ? ((monthlyTotal - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;
    
  // Calculate overdue payments
  const overdueTotal = payments
    .filter(p => {
      if (p.status !== 'pending') return false;
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      return dueDate && dueDate < now;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  // Calculate net balance - collect tenant balances
  let netBalanceTotal = 0;
  if (tenants && tenants.length > 0) {
    netBalanceTotal = tenants.reduce((sum, tenant) => sum + (tenant.currentBalance || 0), 0);
  } else {
    // Fallback calculation based on payments if tenants aren't provided
    netBalanceTotal = variance;
  }
  
  return {
    monthlyTotal,
    pendingTotal: pending,
    varianceTotal: variance,
    lastMonthRevenue,
    growthRate,
    overdueTotal,
    netBalanceTotal
  };
};