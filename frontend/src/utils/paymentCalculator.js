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
