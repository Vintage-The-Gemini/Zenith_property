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
