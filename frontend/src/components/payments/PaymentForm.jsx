// frontend/src/components/payments/PaymentForm.jsx
import { useState, useEffect } from "react";
import { DollarSign, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import propertyService from "../../services/propertyService";
import unitService from "../../services/unitService";

const PaymentForm = ({
  onSubmit,
  onCancel,
  tenantOptions,
  initialData = null,
}) => {
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    tenantId: "",
    unitId: "",
    propertyId: "",
    amount: "",
    dueAmount: "",
    dueDate: new Date().toISOString().split("T")[0],
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    type: "rent",
    description: "",
    status: "completed",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Load properties
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getAllProperties();
        setProperties(data);
      } catch (err) {
        console.error("Error loading properties:", err);
        setError("Failed to load properties");
      }
    };

    fetchProperties();

    // Set initial form data if provided
    if (initialData) {
      const paymentDate = initialData.paymentDate
        ? new Date(initialData.paymentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const dueDate = initialData.dueDate
        ? new Date(initialData.dueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      setFormData({
        tenantId: initialData.tenant?._id || initialData.tenantId || "",
        unitId: initialData.unit?._id || initialData.unitId || "",
        propertyId: initialData.property?._id || initialData.propertyId || "",
        amount: initialData.amount || "",
        dueAmount: initialData.dueAmount || initialData.amount || "",
        dueDate,
        paymentDate,
        paymentMethod: initialData.paymentMethod || "cash",
        type: initialData.type || "rent",
        description: initialData.description || "",
        status: initialData.status || "completed",
      });

      // If property is selected, load its units
      if (initialData.property?._id || initialData.propertyId) {
        fetchUnitsForProperty(
          initialData.property?._id || initialData.propertyId
        );
      }
    }
  }, [initialData]);

  // When tenant changes, populate the unit if available
  useEffect(() => {
    if (formData.tenantId && tenantOptions) {
      const selectedTenant = tenantOptions.find(
        (t) => t._id === formData.tenantId
      );

      if (selectedTenant) {
        // Update unit and property
        let unitId = selectedTenant.unitId;
        let propertyId = selectedTenant.propertyId;

        // Handle if unitId and propertyId are objects instead of strings
        if (
          selectedTenant.unitId &&
          typeof selectedTenant.unitId === "object"
        ) {
          unitId = selectedTenant.unitId._id;
        }

        if (
          selectedTenant.propertyId &&
          typeof selectedTenant.propertyId === "object"
        ) {
          propertyId = selectedTenant.propertyId._id;
        }

        setFormData((prev) => ({
          ...prev,
          unitId: unitId || "",
          propertyId: propertyId || "",
          amount: selectedTenant.leaseDetails?.rentAmount || prev.amount,
          dueAmount: selectedTenant.leaseDetails?.rentAmount || prev.dueAmount,
        }));

        // Fetch units for this property to populate the dropdown
        if (propertyId) {
          fetchUnitsForProperty(propertyId);
        }
      }
    }
  }, [formData.tenantId, tenantOptions]);

  const fetchUnitsForProperty = async (propertyId) => {
    try {
      if (!propertyId) return;

      console.log("Fetching units for property:", propertyId);
      const data = await unitService.getUnits({ propertyId: propertyId });
      console.log("Units fetched:", data);
      setUnits(data);
    } catch (err) {
      console.error("Error loading units:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for property change
    if (name === "propertyId") {
      setFormData({
        ...formData,
        [name]: value,
        unitId: "", // Reset unit when property changes
      });

      if (value) {
        fetchUnitsForProperty(value);
      } else {
        setUnits([]);
      }
    }
    // Special handling for tenant change
    else if (name === "tenantId") {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    // Handle all other fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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

      // Format data for API
      const paymentData = {
        tenant: formData.tenantId, // Change tenantId to tenant to match API
        unit: formData.unitId, // Change unitId to unit to match API
        property: formData.propertyId, // Change propertyId to property to match API
        amount: parseFloat(formData.amount),
        dueAmount: parseFloat(formData.dueAmount || formData.amount),
        paymentDate:
          formData.paymentDate || new Date().toISOString().split("T")[0],
        dueDate: formData.dueDate || new Date().toISOString().split("T")[0],
        paymentMethod: formData.paymentMethod || "cash",
        type: formData.type || "rent",
        status: formData.status || "completed",
        description: formData.description || "",
        reference: formData.reference || "",
      };

      await onSubmit(paymentData);
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-medium">
            {initialData ? "Edit Payment" : "Record Payment"}
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tenant <span className="text-red-500">*</span>
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
              Property
            </label>
            <select
              name="propertyId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.propertyId}
              onChange={handleChange}
              disabled={formData.tenantId !== ""}
            >
              <option value="">Select Property</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              name="unitId"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.unitId}
              onChange={handleChange}
              required
            >
              <option value="">Select Unit</option>
              {units.map((unit) => (
                <option key={unit._id} value={unit._id}>
                  Unit {unit.unitNumber}
                </option>
              ))}
            </select>
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
              Due Amount (KES)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="dueAmount"
                className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.dueAmount}
                onChange={handleChange}
                placeholder="Same as Amount"
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

          <div className="md:col-span-2">
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
        </div>

        <div className="flex justify-end space-x-4 mt-6">
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
