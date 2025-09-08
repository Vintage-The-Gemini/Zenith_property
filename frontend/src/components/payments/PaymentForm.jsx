// frontend/src/components/payments/PaymentForm.jsx

import { useState, useEffect } from "react";
import { X, Banknote, AlertCircle, Calculator, Info, Clock, CheckCircle } from "lucide-react";
import Card from "../ui/Card";
import api from "../../services/api";

const PaymentForm = ({ onSubmit, onCancel, tenantOptions = [], initialData = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    property: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    type: "rent",
    description: "",
    reference: "",
  });
  
  // Progressive balance tracking state
  const [balanceInfo, setBalanceInfo] = useState({
    currentBalance: 0,
    amountDueNow: 0,
    baseRentAmount: 0,
    currentPeriod: null,
    currentPeriodDue: 0,
    currentPeriodPaid: 0,
    remainingForPeriod: 0,
    balanceAfterPayment: 0,
    paymentSequence: 1,
    isOverpayment: false,
    isUnderpayment: false,
    paymentHistory: []
  });

  // Handle initial data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      // Pre-populate form with initial data
      setFormData(prev => ({
        ...prev,
        tenant: initialData.tenant || "",
        unit: initialData.unit || "",
        property: initialData.property || "",
      }));
    }
  }, [initialData]);

  // Fetch tenant balance when tenant is selected
  useEffect(() => {
    if (formData.tenant) {
      const tenant = tenantOptions.find(t => t._id === formData.tenant);
      if (tenant) {
        setSelectedTenant(tenant);
        fetchTenantBalance(tenant._id);
        
        // Auto-populate unit and property from tenant data
        setFormData(prev => ({
          ...prev,
          unit: tenant.unitId?._id || tenant.unitId || "",
          property: tenant.propertyId?._id || tenant.propertyId || ""
        }));
      }
    } else {
      setSelectedTenant(null);
      resetBalanceInfo();
    }
  }, [formData.tenant, tenantOptions]);

  // Recalculate balance when payment amount changes
  useEffect(() => {
    if (selectedTenant && balanceInfo.baseRentAmount > 0) {
      calculatePaymentAllocation();
    }
  }, [formData.amountPaid, balanceInfo.currentBalance]);

  // Fetch tenant's current balance and payment info
  const fetchTenantBalance = async (tenantId) => {
    try {
      setLoadingBalance(true);
      const response = await api.get(`/payments/tenant/${tenantId}/balance`);
      const data = response.data;
      
      setBalanceInfo({
        currentBalance: data.currentBalance,
        amountDueNow: data.amountDueNow,
        baseRentAmount: data.baseRentAmount,
        currentPeriod: data.currentPeriod,
        currentPeriodDue: data.currentPeriodDue,
        currentPeriodPaid: data.currentPeriodPaid,
        remainingForPeriod: data.remainingForPeriod,
        balanceAfterPayment: data.currentBalance,
        paymentSequence: data.paymentHistory?.length + 1 || 1,
        isOverpayment: false,
        isUnderpayment: false,
        paymentHistory: data.paymentHistory || []
      });
      
    } catch (error) {
      console.error('Error fetching tenant balance:', error);
      setError('Failed to fetch tenant balance information');
    } finally {
      setLoadingBalance(false);
    }
  };

  const resetBalanceInfo = () => {
    setBalanceInfo({
      currentBalance: 0,
      amountDueNow: 0,
      baseRentAmount: 0,
      currentPeriod: null,
      currentPeriodDue: 0,
      currentPeriodPaid: 0,
      remainingForPeriod: 0,
      balanceAfterPayment: 0,
      paymentSequence: 1,
      isOverpayment: false,
      isUnderpayment: false,
      paymentHistory: []
    });
  };

  const calculatePaymentAllocation = () => {
    if (!selectedTenant || !balanceInfo.baseRentAmount) return;
    
    const paidAmount = parseFloat(formData.amountPaid) || 0;
    const currentDue = balanceInfo.amountDueNow;
    
    // Calculate new balance after this payment
    const newBalance = Math.max(0, currentDue - paidAmount);
    
    // Determine if overpayment or underpayment
    const isOverpayment = paidAmount > currentDue;
    const isUnderpayment = paidAmount < currentDue && paidAmount > 0;
    
    setBalanceInfo(prev => ({
      ...prev,
      balanceAfterPayment: newBalance,
      isOverpayment,
      isUnderpayment
    }));
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
      
      const paymentData = {
        ...formData,
        amountPaid: parseFloat(formData.amountPaid),
        inSamePeriod: balanceInfo.paymentSequence > 1
      };

      await onSubmit(paymentData);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Record Payment
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Payment Details
              </h3>

              {/* Tenant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant *
                </label>
                <select
                  name="tenant"
                  value={formData.tenant}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a tenant</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.firstName} {tenant.lastName} - Unit {tenant.unitId?.unitNumber || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Paid *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Banknote className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="no-spinners w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="fee">Fee</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Payment description or notes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column - Balance Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Balance Information
              </h3>

              {loadingBalance ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading balance...</span>
                </div>
              ) : selectedTenant ? (
                <div className="space-y-4">
                  {/* Current Balance Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Base Rent Amount</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(balanceInfo.baseRentAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                        <p className={`text-lg font-semibold ${
                          balanceInfo.currentBalance > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(balanceInfo.currentBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount Due Now */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Amount Due Now</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {formatCurrency(balanceInfo.amountDueNow)}
                    </p>
                    {balanceInfo.paymentSequence > 1 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Payment #{balanceInfo.paymentSequence} for {balanceInfo.currentPeriod?.month}/{balanceInfo.currentPeriod?.year}
                      </p>
                    )}
                  </div>

                  {/* Payment Preview */}
                  {formData.amountPaid && parseFloat(formData.amountPaid) > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Calculator className="w-4 h-4 mr-2" />
                        Payment Preview
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Amount Paying:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(formData.amountPaid))}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">New Balance:</span>
                          <span className={`font-medium ${
                            balanceInfo.balanceAfterPayment === 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {formatCurrency(balanceInfo.balanceAfterPayment)}
                          </span>
                        </div>
                        
                        {balanceInfo.isOverpayment && (
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>Overpayment - credit will be applied</span>
                          </div>
                        )}
                        
                        {balanceInfo.isUnderpayment && (
                          <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span>Partial payment - balance remains</span>
                          </div>
                        )}
                        
                        {balanceInfo.balanceAfterPayment === 0 && !balanceInfo.isOverpayment && (
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>Full payment - account balanced</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Current Period Summary */}
                  {balanceInfo.currentPeriod && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Current Period ({balanceInfo.currentPeriod.month}/{balanceInfo.currentPeriod.year})
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Due:</span>
                          <span>{formatCurrency(balanceInfo.currentPeriodDue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                          <span>{formatCurrency(balanceInfo.currentPeriodPaid)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                          <span className={balanceInfo.remainingForPeriod > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                            {formatCurrency(balanceInfo.remainingForPeriod)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <Info className="w-5 h-5 mr-2" />
                  Select a tenant to view balance information
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingBalance || !selectedTenant}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PaymentForm;