// frontend/src/components/payments/PaymentForm.jsx
import { useState, useEffect } from "react";
import { X, DollarSign, AlertCircle, Calculator, Info } from "lucide-react";
import Card from "../ui/Card";

const PaymentForm = ({ onSubmit, onCancel, tenantOptions = [], initialData = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isNewPaymentPeriod, setIsNewPaymentPeriod] = useState(false);
  
  // Get end of current month as default due date
  const getEndOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
  };
  
  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    property: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    dueDate: getEndOfMonth(),
    paymentMethod: "cash",
    type: "rent",
    description: "",
    reference: "",
  });
  
  // Balance calculation state
  const [balanceInfo, setBalanceInfo] = useState({
    baseRentAmount: 0,
    previousBalance: 0,
    totalAmountDue: 0,
    appliedToPreviousBalance: 0,
    appliedToCurrentRent: 0,
    overpayment: 0,
    underpayment: 0,
    paymentVariance: 0,
    newBalance: 0,
    willBeOverpayment: false,
    willBeUnderpayment: false,
  });

  useEffect(() => {
    if (formData.tenant) {
      const tenant = tenantOptions.find(t => t._id === formData.tenant);
      if (tenant) {
        setSelectedTenant(tenant);
        calculatePaymentAllocation(tenant);
      }
    } else {
      setSelectedTenant(null);
      resetBalanceInfo();
    }
  }, [formData.tenant, tenantOptions]);

  useEffect(() => {
    calculatePaymentAllocation();
  }, [formData.amountPaid, selectedTenant, formData.type, isNewPaymentPeriod]);

  const resetBalanceInfo = () => {
    setBalanceInfo({
      baseRentAmount: 0,
      previousBalance: 0,
      totalAmountDue: 0,
      appliedToPreviousBalance: 0,
      appliedToCurrentRent: 0,
      overpayment: 0,
      underpayment: 0,
      paymentVariance: 0,
      newBalance: 0,
      willBeOverpayment: false,
      willBeUnderpayment: false,
    });
  };

  const calculatePaymentAllocation = (tenant = selectedTenant) => {
    if (!tenant) {
      resetBalanceInfo();
      return;
    }
    
    const baseRentAmount = tenant.leaseDetails?.rentAmount || 0;
    const previousBalance = tenant.currentBalance || 0;
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    
    // Calculate amount due based on payment period
    let totalAmountDue;
    
    if (!isNewPaymentPeriod) {
      // If in the same payment period, the amount due is the previous balance
      totalAmountDue = previousBalance;
    } else {
      // If new payment period, add current rent to previous balance
      totalAmountDue = previousBalance + baseRentAmount;
    }
    
    // Calculate new balance - amount due minus amount paid
    const newBalance = totalAmountDue - amountPaid;
    
    // Calculate payment allocation
    let appliedToPreviousBalance = Math.min(previousBalance, amountPaid);
    let appliedToCurrentRent = 0;
    
    // If in a new payment period and there's payment left after covering previous balance,
    // apply the remainder to current rent
    if (isNewPaymentPeriod && amountPaid > previousBalance) {
      appliedToCurrentRent = Math.min(baseRentAmount, amountPaid - previousBalance);
    }
    
    // Calculate overpayment/underpayment
    const paymentVariance = amountPaid - totalAmountDue;
    const overpayment = paymentVariance > 0 ? paymentVariance : 0;
    const underpayment = paymentVariance < 0 ? Math.abs(paymentVariance) : 0;
    
    setBalanceInfo({
      baseRentAmount,
      previousBalance,
      totalAmountDue,
      appliedToPreviousBalance,
      appliedToCurrentRent,
      overpayment,
      underpayment,
      paymentVariance,
      newBalance,
      willBeOverpayment: newBalance < 0,
      willBeUnderpayment: newBalance > 0,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // When tenant changes, update property and unit from selected tenant
    if (name === 'tenant' && value) {
      const tenant = tenantOptions.find(t => t._id === value);
      if (tenant) {
        setFormData(prev => ({
          ...prev,
          unit: tenant.unitId?._id || tenant.unitId || "",
          property: tenant.propertyId?._id || tenant.propertyId || "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.tenant) {
      setError("Please select a tenant");
      return;
    }
    
    if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare payment data
      const paymentData = {
        tenant: formData.tenant,
        unit: formData.unit,
        property: formData.property,
        amountPaid: parseFloat(formData.amountPaid),
        paymentDate: formData.paymentDate,
        dueDate: formData.dueDate,
        paymentMethod: formData.paymentMethod,
        type: formData.type,
        description: formData.description,
        reference: formData.reference,
        // Add balance information for backend calculations
        previousBalance: balanceInfo.previousBalance,
        baseRentAmount: balanceInfo.baseRentAmount,
        totalAmountDue: balanceInfo.totalAmountDue,
        newBalance: balanceInfo.newBalance,
        // Flag to indicate payment period
        inSamePeriod: !isNewPaymentPeriod
      };
      
      await onSubmit(paymentData);
    } catch (err) {
      console.error("Error submitting payment:", err);
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-medium">Record Payment</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant and Payment Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tenant <span className="text-red-500">*</span>
            </label>
            <select
              name="tenant"
              value={formData.tenant}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              required
            >
              <option value="">Select Tenant</option>
              {tenantOptions.map(tenant => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.firstName} {tenant.lastName} - Unit {tenant.unitId?.unitNumber || 'N/A'}
                  {tenant.currentBalance ? ` (Balance: KES ${tenant.currentBalance.toLocaleString()})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="rent">Rent</option>
              <option value="deposit">Security Deposit</option>
              <option value="fee">Late Fee</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Payment Period Toggle */}
        {selectedTenant && (
          <div className="flex items-center">
            <input
              id="new-period"
              type="checkbox"
              checked={isNewPaymentPeriod}
              onChange={() => setIsNewPaymentPeriod(!isNewPaymentPeriod)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
            />
            <label htmlFor="new-period" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              This is a payment for a new period (includes current rent)
            </label>
          </div>
        )}

        {/* Balance Information Card */}
        {selectedTenant && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-primary-600" />
              Current Balance Information
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Previous Balance</p>
                <p className={`text-lg font-semibold ${
                  balanceInfo.previousBalance > 0 ? 'text-red-600 dark:text-red-400' : 
                  balanceInfo.previousBalance < 0 ? 'text-green-600 dark:text-green-400' : 
                  'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatCurrency(balanceInfo.previousBalance)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {balanceInfo.previousBalance > 0 ? 'Amount owed' : 
                   balanceInfo.previousBalance < 0 ? 'Credit balance' : 'No balance'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(balanceInfo.baseRentAmount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isNewPaymentPeriod ? 'To be charged' : 'For reference'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount Due Now</p>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {formatCurrency(balanceInfo.totalAmountDue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isNewPaymentPeriod ? 'Previous + current rent' : 'Previous balance only'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">New Balance After Payment</p>
                <p className={`text-lg font-semibold ${
                  balanceInfo.newBalance < 0 ? 'text-green-600 dark:text-green-400' : 
                  balanceInfo.newBalance > 0 ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatCurrency(Math.abs(balanceInfo.newBalance))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {balanceInfo.newBalance < 0 ? 'Credit' : 
                   balanceInfo.newBalance > 0 ? 'Outstanding' : 'Balanced'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Amount and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount Paid (KES) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="amountPaid"
                value={formData.amountPaid}
                onChange={handleChange}
                className="pl-12 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="check">Check</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Date
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Payment Allocation Preview */}
        {formData.amountPaid && selectedTenant && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Payment Allocation Preview
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount to be Paid:</span>
                <span className="font-medium">{formatCurrency(parseFloat(formData.amountPaid) || 0)}</span>
              </div>
              
              {balanceInfo.appliedToPreviousBalance > 0 && (
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <span>Applied to Previous Balance:</span>
                  <span className="font-medium">{formatCurrency(balanceInfo.appliedToPreviousBalance)}</span>
                </div>
              )}
              
              {balanceInfo.appliedToCurrentRent > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>Applied to Current Rent:</span>
                  <span className="font-medium">{formatCurrency(balanceInfo.appliedToCurrentRent)}</span>
                </div>
              )}
              
              {balanceInfo.overpayment > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Overpayment (Credit):</span>
                  <span className="font-medium">{formatCurrency(balanceInfo.overpayment)}</span>
                </div>
              )}
              
              {balanceInfo.underpayment > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Underpayment (Still Due):</span>
                  <span className="font-medium">{formatCurrency(balanceInfo.underpayment)}</span>
                </div>
              )}
              
              <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>New Balance After Payment:</span>
                  <span className={
                    balanceInfo.newBalance < 0 ? 'text-green-600 dark:text-green-400' : 
                    balanceInfo.newBalance > 0 ? 'text-red-600 dark:text-red-400' : 
                    'text-gray-900 dark:text-gray-100'
                  }>
                    {formatCurrency(Math.abs(balanceInfo.newBalance))}
                    {balanceInfo.newBalance < 0 ? ' (Credit)' : 
                     balanceInfo.newBalance > 0 ? ' (Owed)' : ''}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            placeholder="Additional payment details or notes..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            disabled={loading || !formData.tenant || !formData.amountPaid}
          >
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default PaymentForm;