// frontend/src/components/tenants/TenantStatementModal.jsx
import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import paymentService from '../../services/paymentService';
import expenseService from '../../services/expenseService';
import { getPropertyById } from '../../services/propertyService';
import { generateTenantStatementPDF, generateTenantStatementCSV } from '../../utils/tenantStatementGenerator';
import { exportToCSV } from '../../utils/csvExporter';

const TenantStatementModal = ({ tenant, isOpen, onClose }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const timeFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Calculate date range based on time filter
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = null;
          endDate = null;
        }
        break;
      default:
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  const loadStatementData = async () => {
    if (!tenant?.unitId?.propertyId) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Load property, payments, and expenses
      const [property, payments, expenses] = await Promise.all([
        getPropertyById(tenant.unitId.propertyId),
        paymentService.getPaymentsByTenant(tenant._id),
        expenseService.getExpensesByProperty(tenant.unitId.propertyId)
      ]);

      // Filter payments by date range
      let filteredPayments = payments;
      let filteredExpenses = expenses;

      if (startDate && endDate) {
        filteredPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= startDate && paymentDate <= endDate;
        });

        filteredExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }

      const data = {
        property,
        payments: filteredPayments,
        expenses: filteredExpenses,
        dateRange: { startDate, endDate }
      };

      setPreviewData(data);
    } catch (error) {
      console.error('Error loading statement data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tenant) {
      loadStatementData();
    }
  }, [isOpen, tenant, timeFilter, customStartDate, customEndDate]);

  const handleGeneratePDF = async () => {
    if (!previewData) {
      await loadStatementData();
      return;
    }

    generateTenantStatementPDF(
      tenant,
      previewData.payments,
      previewData.expenses,
      previewData.property,
      previewData.dateRange
    );
  };

  const handleGenerateCSV = async () => {
    if (!previewData) {
      await loadStatementData();
      return;
    }

    const csvData = generateTenantStatementCSV(
      tenant,
      previewData.payments,
      previewData.expenses,
      previewData.property,
      previewData.dateRange
    );

    const periodText = previewData.dateRange.startDate && previewData.dateRange.endDate 
      ? `${new Date(previewData.dateRange.startDate).toISOString().split('T')[0]}_to_${new Date(previewData.dateRange.endDate).toISOString().split('T')[0]}`
      : 'all_time';
    
    const fileName = `${tenant.firstName}_${tenant.lastName}_statement_${periodText}.csv`;
    exportToCSV(csvData, fileName);
  };

  const formatCurrency = (amount) => `KES ${(amount || 0).toLocaleString()}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium">
              Tenant Statement - {tenant.firstName} {tenant.lastName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Time Filter Section */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Statement Period:
                </h4>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {timeFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              {timeFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Download Buttons */}
              <div className="lg:ml-auto flex gap-2">
                <button
                  onClick={handleGeneratePDF}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleGenerateCSV}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'Download CSV'}
                </button>
              </div>
            </div>
          </Card>

          {/* Statement Preview */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              {/* Tenant Info */}
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Property:</span> {previewData.property?.name}</p>
                      <p><span className="font-medium">Address:</span> {
                        typeof previewData.property?.address === 'object' 
                          ? `${previewData.property?.address?.street || ''}, ${previewData.property?.address?.city || ''}, ${previewData.property?.address?.state || ''} ${previewData.property?.address?.zipCode || ''}`
                          : previewData.property?.address || 'N/A'
                      }</p>
                      <p><span className="font-medium">City:</span> {
                        typeof previewData.property?.address === 'object'
                          ? `${previewData.property?.address?.city || ''}, ${previewData.property?.address?.state || ''}`
                          : `${previewData.property?.city || ''}, ${previewData.property?.state || ''}`
                      }</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tenant Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {tenant.firstName} {tenant.lastName}</p>
                      <p><span className="font-medium">Unit:</span> {tenant.unitId?.unitNumber || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {tenant.email}</p>
                      <p><span className="font-medium">Phone:</span> {tenant.phone}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Account Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Charges</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {formatCurrency(previewData.payments.reduce((sum, p) => sum + (p.amountDue || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Payments</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {formatCurrency(previewData.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amountPaid || 0), 0))}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${tenant.currentBalance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <p className={`text-sm font-medium ${tenant.currentBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      Current Balance
                    </p>
                    <p className={`text-2xl font-bold ${tenant.currentBalance > 0 ? 'text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-gray-300'}`}>
                      {formatCurrency(Math.abs(tenant.currentBalance || 0))} {tenant.currentBalance < 0 ? '(Credit)' : ''}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Payment History */}
              {previewData.payments.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Payment History ({previewData.payments.length} transactions)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Due</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Paid</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {payment.type || 'Rent'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {payment.reference || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(payment.amountDue)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(payment.amountPaid)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {previewData.payments.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No payment transactions found for the selected period.</p>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TenantStatementModal;