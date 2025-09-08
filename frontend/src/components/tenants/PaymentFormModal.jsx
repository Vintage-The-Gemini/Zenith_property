// frontend/src/components/tenants/PaymentFormModal.jsx
import { useState, useEffect } from "react";
import { X, Banknote, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import unitService from "../../services/unitService";

const PaymentFormModal = ({ isOpen, onClose, onSubmit, tenant }) => {
  const [formData, setFormData] = useState({
    tenantId: tenant?._id || "",
    unitId: tenant?.unitId?._id || tenant?.unitId || "",
    propertyId: tenant?.propertyId?._id || tenant?.propertyId || "",
    amount: 0,
    dueAmount: 0,
    type: "rent",
    status: "completed",
    paymentMethod: "cash",
    reference: "",
    description: "",
    paymentDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unitDetails, setUnitDetails] = useState(null);

  useEffect(() => {
    if (tenant) {
      // Determine tenant's unit ID
      let unitId = tenant.unitId;
      if (tenant.unitId && typeof tenant.unitId === "object") {
        unitId = tenant.unitId._id;
      }

      // Determine tenant's property ID
      let propertyId = tenant.propertyId;
      if (tenant.propertyId && typeof tenant.propertyId === "object") {
        propertyId = tenant.propertyId._id;
      }

      setFormData({
        tenantId: tenant._id || "",
        unitId: unitId || "",
        propertyId: propertyId || "",
        amount: tenant.leaseDetails?.rentAmount || 0,
        dueAmount: tenant.leaseDetails?.rentAmount || 0,
        type: "rent",
        status: "completed",
        paymentMethod: "cash",
        reference: `REF-${Date.now().toString().slice(-6)}`,
        description: `Rent payment for ${tenant.firstName} ${tenant.lastName}`,
        paymentDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
      });

      // If unit ID is available, fetch unit details
      if (unitId) {
        fetchUnitDetails(unitId);
      }
    }
  }, [tenant]);

  const fetchUnitDetails = async (unitId) => {
    try {
      const unit = await unitService.getUnitById(unitId);
      setUnitDetails(unit);
    } catch (error) {
      console.error("Error fetching unit details:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Payment amount must be greater than zero");
      return;
    }

    try {
      setIsLoading(true);

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        dueAmount: parseFloat(formData.dueAmount || formData.amount),
        date: new Date(),
      };

      await onSubmit(paymentData);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Banknote className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium">Record Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            <AlertCircle className="h-5 w-5 mr-2 inline-block" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tenant
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-100"
              value={`${tenant?.firstName || ""} ${tenant?.lastName || ""}`}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-100"
              value={
                unitDetails
                  ? `Unit ${unitDetails.unitNumber}`
                  : tenant?.unitId?.unitNumber
                  ? `Unit ${tenant.unitId.unitNumber}`
                  : "Loading..."
              }
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="amount"
                className="no-spinners pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Amount (KES)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="dueAmount"
                className="no-spinners pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.dueAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              If left blank, will default to Amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              name="type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="rent">Rent</option>
              <option value="deposit">Security Deposit</option>
              <option value="fee">Late Fee</option>
              <option value="utility">Utility</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.paymentMethod}
              onChange={handleChange}
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
            <label className="block text-sm font-medium text-gray-700">
              Reference Number
            </label>
            <input
              type="text"
              name="reference"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Payment reference number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Date
            </label>
            <input
              type="date"
              name="paymentDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.paymentDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Additional details about this payment"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PaymentFormModal;
