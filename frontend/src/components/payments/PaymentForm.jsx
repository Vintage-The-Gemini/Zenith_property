// frontend/src/components/payments/PaymentForm.jsx
import { useState, useEffect } from "react";
import { DollarSign, AlertCircle } from "lucide-react";
import Card from "../ui/Card";

const PaymentForm = ({
  onSubmit,
  onCancel,
  tenantOptions,
  unitOptions,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    tenantId: "",
    unitId: "",
    propertyId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    type: "rent",
    description: "",
    status: "completed",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have initial data, populate the form
    if (initialData) {
      const dueDate = initialData.dueDate
        ? new Date(initialData.dueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      setFormData({
        tenantId: initialData.tenant?._id || initialData.tenantId || "",
        unitId: initialData.unit?._id || initialData.unitId || "",
        propertyId: initialData.property?._id || initialData.propertyId || "",
        amount: initialData.amount || "",
        dueDate,
        paymentMethod: initialData.paymentMethod || "cash",
        type: initialData.type || "rent",
        description: initialData.description || "",
        status: initialData.status || "completed",
      });
    }
  }, [initialData]);

  // When tenant changes, populate the unit if available
  useEffect(() => {
    if (formData.tenantId && tenantOptions) {
      const selectedTenant = tenantOptions.find(
        (t) => t._id === formData.tenantId
      );
      if (selectedTenant && selectedTenant.unitId) {
        setFormData((prev) => ({
          ...prev,
          unitId: selectedTenant.unitId,
          propertyId: selectedTenant.propertyId,
          amount: selectedTenant.leaseDetails?.rentAmount || prev.amount,
        }));
      }
    }
  }, [formData.tenantId, tenantOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.tenantId) {
      setError("Please select a tenant");
      return;
    }

    if (!formData.unitId) {
      setError("Please select a unit");
      return;
    }

    if (
      !formData.amount ||
      isNaN(formData.amount) ||
      parseFloat(formData.amount) <= 0
    ) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    } catch (err) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <DollarSign className="h-6 w-6 mr-2 text-primary-600" />
        {initialData ? "Edit Payment" : "Record Payment"}
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tenant
            </label>
            <select
              name="tenantId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.tenantId}
              onChange={handleChange}
              required
            >
              <option value="">Select Tenant</option>
              {tenantOptions?.map((tenant) => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.firstName} {tenant.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit
            </label>
            <select
              name="unitId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.unitId}
              onChange={handleChange}
              required
            >
              <option value="">Select Unit</option>
              {unitOptions?.map((unit) => (
                <option key={unit._id} value={unit._id}>
                  {unit.propertyName || "Property"} - Unit {unit.unitNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="amount"
                className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
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
              required
            />
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
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={formData.description}
            onChange={handleChange}
            placeholder="Payment description"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : initialData
              ? "Update Payment"
              : "Record Payment"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default PaymentForm;
