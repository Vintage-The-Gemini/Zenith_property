// frontend/src/utils/enhancedPaymentExporter.js
import { exportToCSV } from './csvExporter';

export const exportPaymentsToEnhancedCSV = (payments, expenses, tenants, property, filters = {}) => {
  const csvData = [];
  
  // Header section
  csvData.push(['PROPERTY PAYMENT REPORT']);
  csvData.push([]);
  csvData.push(['Report Generation Details']);
  csvData.push(['Generated On:', new Date().toLocaleDateString()]);
  csvData.push(['Generated At:', new Date().toLocaleTimeString()]);
  csvData.push(['Property:', property?.name || 'Multiple Properties']);
  
  // Handle address object or string
  let propertyAddress = 'N/A';
  if (property) {
    if (typeof property.address === 'object') {
      propertyAddress = `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zipCode || ''}`;
    } else {
      propertyAddress = `${property.address || ''}, ${property.city || ''}, ${property.state || ''}`;
    }
  }
  csvData.push(['Property Address:', propertyAddress]);
  csvData.push([]);

  // Filter information
  if (filters.timeFilter && filters.timeFilter !== 'all') {
    csvData.push(['Applied Filters']);
    csvData.push(['Time Period:', filters.timeFilter]);
    if (filters.customStartDate && filters.customEndDate) {
      csvData.push(['Start Date:', filters.customStartDate]);
      csvData.push(['End Date:', filters.customEndDate]);
    }
    csvData.push([]);
  }

  // Summary statistics
  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const overduePayments = payments.filter(p => p.status === 'pending' && new Date(p.dueDate) < new Date());
  
  const totalAmountDue = payments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  const totalAmountPaid = completedPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);

  csvData.push(['PAYMENT SUMMARY']);
  csvData.push(['Total Payment Records:', totalPayments]);
  csvData.push(['Completed Payments:', completedPayments.length]);
  csvData.push(['Pending Payments:', pendingPayments.length]);
  csvData.push(['Overdue Payments:', overduePayments.length]);
  csvData.push([]);
  csvData.push(['FINANCIAL SUMMARY']);
  csvData.push(['Total Amount Due:', `KES ${totalAmountDue.toLocaleString()}`]);
  csvData.push(['Total Amount Paid:', `KES ${totalAmountPaid.toLocaleString()}`]);
  csvData.push(['Total Pending Amount:', `KES ${totalPending.toLocaleString()}`]);
  csvData.push(['Total Overdue Amount:', `KES ${totalOverdue.toLocaleString()}`]);
  csvData.push(['Collection Rate:', `${totalAmountDue > 0 ? ((totalAmountPaid / totalAmountDue) * 100).toFixed(2) : 0}%`]);
  csvData.push([]);

  // Payment status breakdown
  const statusBreakdown = {};
  payments.forEach(payment => {
    statusBreakdown[payment.status] = (statusBreakdown[payment.status] || 0) + 1;
  });

  csvData.push(['PAYMENT STATUS BREAKDOWN']);
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    csvData.push([`${status.charAt(0).toUpperCase() + status.slice(1)} Payments:`, count]);
  });
  csvData.push([]);

  // Payment type breakdown
  const typeBreakdown = {};
  payments.forEach(payment => {
    const type = payment.type || 'Rent';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  csvData.push(['PAYMENT TYPE BREAKDOWN']);
  Object.entries(typeBreakdown).forEach(([type, count]) => {
    csvData.push([`${type} Payments:`, count]);
  });
  csvData.push([]);

  // Payment method breakdown
  const methodBreakdown = {};
  completedPayments.forEach(payment => {
    const method = payment.paymentMethod || 'Not Specified';
    methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
  });

  if (Object.keys(methodBreakdown).length > 0) {
    csvData.push(['PAYMENT METHOD BREAKDOWN']);
    Object.entries(methodBreakdown).forEach(([method, count]) => {
      csvData.push([`${method}:`, count]);
    });
    csvData.push([]);
  }

  // Monthly breakdown (if data spans multiple months)
  const monthlyBreakdown = {};
  payments.forEach(payment => {
    const date = new Date(payment.paymentDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyBreakdown[monthKey]) {
      monthlyBreakdown[monthKey] = { count: 0, totalDue: 0, totalPaid: 0 };
    }
    monthlyBreakdown[monthKey].count++;
    monthlyBreakdown[monthKey].totalDue += payment.amountDue || 0;
    if (payment.status === 'completed') {
      monthlyBreakdown[monthKey].totalPaid += payment.amountPaid || 0;
    }
  });

  if (Object.keys(monthlyBreakdown).length > 1) {
    csvData.push(['MONTHLY BREAKDOWN']);
    csvData.push(['Month', 'Payment Count', 'Total Amount Due', 'Total Amount Paid', 'Collection Rate']);
    Object.entries(monthlyBreakdown).forEach(([month, data]) => {
      const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(2) : 0;
      csvData.push([
        month,
        data.count,
        `KES ${data.totalDue.toLocaleString()}`,
        `KES ${data.totalPaid.toLocaleString()}`,
        `${collectionRate}%`
      ]);
    });
    csvData.push([]);
  }

  // Detailed payment records
  csvData.push(['DETAILED PAYMENT RECORDS']);
  csvData.push([
    'Payment ID',
    'Date',
    'Due Date',
    'Tenant Name',
    'Tenant Email',
    'Tenant Phone',
    'Unit Number',
    'Property Name',
    'Payment Type',
    'Description',
    'Amount Due',
    'Amount Paid',
    'Balance',
    'Status',
    'Payment Method',
    'Transaction Reference',
    'Late Fee',
    'Penalty',
    'Discount',
    'Payment Notes',
    'Created Date',
    'Updated Date',
    'Days Overdue',
    'Is Partial Payment',
    'Is Overpayment',
    'Is Underpayment',
    'Overpayment Amount',
    'Underpayment Amount'
  ]);

  payments.forEach(payment => {
    const tenant = tenants.find(t => t._id === payment.tenant) || {};
    const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
    const today = new Date();
    const daysOverdue = dueDate && payment.status === 'pending' && dueDate < today 
      ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
      : 0;

    const balance = (payment.amountDue || 0) - (payment.amountPaid || 0);
    const isPartialPayment = payment.status === 'completed' && (payment.amountPaid || 0) < (payment.amountDue || 0) && (payment.amountPaid || 0) > 0;

    csvData.push([
      payment._id,
      new Date(payment.paymentDate).toLocaleDateString(),
      dueDate ? dueDate.toLocaleDateString() : '',
      `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
      tenant.email || '',
      tenant.phone || '',
      payment.unit?.unitNumber || tenant.unitId?.unitNumber || '',
      property?.name || '',
      payment.type || 'Rent',
      payment.description || '',
      payment.amountDue || 0,
      payment.amountPaid || 0,
      balance,
      payment.status,
      payment.paymentMethod || '',
      payment.reference || '',
      payment.lateFee || 0,
      payment.penalty || 0,
      payment.discount || 0,
      payment.notes || '',
      payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '',
      payment.updatedAt ? new Date(payment.updatedAt).toLocaleDateString() : '',
      daysOverdue,
      isPartialPayment ? 'Yes' : 'No',
      payment.isOverpayment ? 'Yes' : 'No',
      payment.isUnderpayment ? 'Yes' : 'No',
      payment.overpayment || 0,
      payment.underpayment || 0
    ]);
  });

  csvData.push([]);

  // Tenant balance summary
  if (tenants.length > 0) {
    csvData.push(['TENANT BALANCE SUMMARY']);
    csvData.push([
      'Tenant Name',
      'Email',
      'Phone',
      'Unit Number',
      'Current Balance',
      'Monthly Rent',
      'Last Payment Date',
      'Last Payment Amount',
      'Total Payments Made',
      'Total Amount Due',
      'Balance Status'
    ]);

    tenants.forEach(tenant => {
      const tenantPayments = payments.filter(p => p.tenant === tenant._id);
      const lastPayment = tenantPayments
        .filter(p => p.status === 'completed')
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
      
      const totalPaid = tenantPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      
      const totalDue = tenantPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
      
      const balanceStatus = tenant.currentBalance > 1000 ? 'Outstanding' : 
                           tenant.currentBalance < -100 ? 'Credit' : 'Balanced';

      csvData.push([
        `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
        tenant.email || '',
        tenant.phone || '',
        tenant.unitId?.unitNumber || '',
        tenant.currentBalance || 0,
        tenant.leaseDetails?.rentAmount || 0,
        lastPayment ? new Date(lastPayment.paymentDate).toLocaleDateString() : '',
        lastPayment ? (lastPayment.amountPaid || 0) : 0,
        totalPaid,
        totalDue,
        balanceStatus
      ]);
    });
  }

  return csvData;
};

export const generatePaymentReportFileName = (property, filters) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const propertyName = property?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'AllProperties';
  
  let filterSuffix = '';
  if (filters.timeFilter && filters.timeFilter !== 'all') {
    filterSuffix = `_${filters.timeFilter}`;
  }
  
  return `${propertyName}_payments_detailed_report${filterSuffix}_${timestamp}.csv`;
};