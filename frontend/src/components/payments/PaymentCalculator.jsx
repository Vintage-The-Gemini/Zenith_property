// frontend/src/components/properties/payments/PaymentCalculator.js

/**
 * Calculate summary data from payment data
 * @param {Array} paymentsData - List of payments
 * @param {Array} tenantsData - List of tenants
 * @returns {Object} Summary statistics
 */
export const calculatePaymentSummary = (paymentsData, tenantsData = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
    // Current month completed payments
    const monthlyPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });
  
    // Last month payments
    const lastMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return (
        payment.status === "completed" &&
        paymentDate.getMonth() === lastMonth &&
        paymentDate.getFullYear() === lastMonthYear
      );
    });
  
    // Pending payments
    const pendingPayments = paymentsData.filter(
      (payment) => payment.status === "pending"
    );
  
    // Overdue payments
    const overduePayments = pendingPayments.filter(
      (payment) => payment.dueDate && new Date(payment.dueDate) < now
    );
  
    // Calculate totals
    const monthlyTotal = monthlyPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
  
    const lastMonthTotal = lastMonthPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
  
    const pendingTotal = pendingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    
    const overdueTotal = overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
  
    // Calculate payment variance (total of all payment variances)
    const varianceTotal = paymentsData
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + (payment.paymentVariance || 0), 0);
  
    // Calculate growth rate
    const growthRate =
      lastMonthTotal > 0
        ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;
  
    // Calculate net balance (from tenant current balances)
    const netBalanceTotal = tenantsData.reduce(
      (sum, tenant) => sum + (tenant.currentBalance || 0),
      0
    );
  
    return {
      monthlyTotal,
      pendingTotal,
      lastMonthRevenue: lastMonthTotal,
      varianceTotal,
      growthRate,
      overdueTotal,
      netBalanceTotal,
    };
  };
  
  /**
   * Calculate monthly breakdown of payment data
   * @param {Array} paymentsData - List of payments
   * @returns {Array} Monthly breakdown data
   */
  export const calculateMonthlyBreakdown = (paymentsData) => {
    // Group payments by month
    const groupedByMonth = {};
    
    paymentsData.forEach(payment => {
      if (!payment.paymentDate) return;
      
      const date = new Date(payment.paymentDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          completed: 0,
          pending: 0,
          overdue: 0,
          totalPayments: 0
        };
      }
      
      if (payment.status === 'completed') {
        groupedByMonth[monthYear].completed += payment.amount;
      } else if (payment.status === 'pending') {
        groupedByMonth[monthYear].pending += payment.amount;
        
        // Check if payment is overdue
        if (payment.dueDate && new Date(payment.dueDate) < new Date()) {
          groupedByMonth[monthYear].overdue += payment.amount;
        }
      }
      
      groupedByMonth[monthYear].totalPayments++;
    });
    
    // Convert to array and sort by date
    return Object.entries(groupedByMonth)
      .map(([key, value]) => ({ ...value, monthKey: key }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Sort newest first
  };
  
  /**
   * Filter payments based on search and filters
   * @param {Array} payments - List of payments
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered payments
   */
  export const filterPayments = (payments, searchTerm, filters) => {
    return payments.filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
  
      // Search in tenant name, unit number, or reference
      const tenantName = payment.tenant
        ? `${payment.tenant.firstName} ${payment.tenant.lastName}`.toLowerCase()
        : "";
      const unitNumber = payment.unit?.unitNumber?.toLowerCase() || "";
      const reference = payment.reference?.toLowerCase() || "";
  
      const matchesSearch =
        tenantName.includes(searchLower) ||
        unitNumber.includes(searchLower) ||
        reference.includes(searchLower);
  
      if (searchTerm && !matchesSearch) return false;
  
      // Apply status filter
      if (filters.status && payment.status !== filters.status) return false;
  
      // Apply type filter
      if (filters.type && payment.type !== filters.type) return false;
  
      // Apply tenant filter
      if (filters.tenantId && payment.tenant?._id !== filters.tenantId) return false;
  
      // Apply date range filters
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