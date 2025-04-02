// frontend/src/components/payments/PaymentCalculator.jsx

import React, { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import { calculateCurrentPeriodDue } from "../../utils/paymentCalculator";

const PaymentCalculator = ({ tenant, onAmountSelected }) => {
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant) {
      calculatePayment();
    }
  }, [tenant]);

  const calculatePayment = () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate due amount based on tenant's lease details and payment history
      const paymentDetails = calculateCurrentPeriodDue(tenant);

      setCalculatedAmount(paymentDetails);
    } catch (err) {
      console.error("Error calculating payment:", err);
      setError("Failed to calculate payment amount");
    } finally {
      setLoading(false);
    }
  };

  const handleUseAmount = () => {
    if (calculatedAmount && onAmountSelected) {
      onAmountSelected(calculatedAmount);
    }
  };

  if (!tenant) {
    return null;
  }

  if (loading) {
    return <div className="text-center py-4">Calculating payment...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!calculatedAmount) {
    return null;
  }

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-md font-medium mb-2 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-primary-600" />
        Payment Calculation for Current Period
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Base Rent Amount</p>
          <p className="text-lg font-bold">
            KES {calculatedAmount.baseRentAmount.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Amount Due</p>
          <p className="text-lg font-bold">
            KES {calculatedAmount.amountDue.toLocaleString()}
          </p>
          {calculatedAmount.amountDue !== calculatedAmount.baseRentAmount && (
            <p className="text-xs text-gray-500">
              {calculatedAmount.amountDue < calculatedAmount.baseRentAmount
                ? "Reduced due to previous overpayment"
                : "Increased due to previous underpayment"}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Due Date</p>
          <p className="text-md">
            {new Date(calculatedAmount.dueDate).toLocaleDateString()}
          </p>
          {calculatedAmount.isOverdue && (
            <p className="text-xs text-red-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Payment is overdue
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Carry Forward</p>
          <p
            className={`text-md ${
              calculatedAmount.carryForwardAmount > 0
                ? "text-green-600"
                : calculatedAmount.carryForwardAmount < 0
                ? "text-red-600"
                : ""
            }`}
          >
            {calculatedAmount.carryForwardAmount > 0
              ? `KES ${calculatedAmount.carryForwardAmount.toLocaleString()} (Credit)`
              : calculatedAmount.carryForwardAmount < 0
              ? `KES ${Math.abs(
                  calculatedAmount.carryForwardAmount
                ).toLocaleString()} (Debit)`
              : "None"}
          </p>
        </div>
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={handleUseAmount}
          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Use Calculated Amount
        </button>
      </div>
    </Card>
  );
};

export default PaymentCalculator;
