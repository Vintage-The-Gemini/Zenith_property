// frontend/src/components/payments/ExpenseForm.jsx
import { useState, useEffect } from "react";
import { X, DollarSign, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import propertyService from "../../services/propertyService";

const ExpenseForm = ({ onSubmit, onCancel, initialData = null, defaultPropertyId = null }) => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    property: defaultPropertyId || "",
    unit: "",
    category: "maintenance",
    customCategory: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentStatus: "pending",
    vendor: {
      name: "",
      contact: "",
      invoiceNumber: "",
    },
    recurring: {
      isRecurring: false,
      frequency: "monthly",
    },
  });

  useEffect(() => {
    // Load properties
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getAllProperties();
        setProperties(data);
        
        // If defaultPropertyId is provided, fetch its units
        if (defaultPropertyId) {
          fetchUnitsForProperty(defaultPropertyId);
          
          // Find the selected property details
          const property = data.find(p => p._id === defaultPropertyId);
          if (property) {
            setSelectedProperty(property);
          }
        }
      } catch (err) {
        console.error("Error loading properties:", err);
        setError("Failed to load properties");
      }
    };

    fetchProperties();

    // Set initial form data if provided
    if (initialData) {
      setFormData({
        property: initialData.property?._id || initialData.property || defaultPropertyId || "",
        unit: initialData.unit?._id || initialData.unit || "",
        category: initialData.category || "maintenance",
        customCategory: initialData.customCategory || "",
        amount: initialData.amount || "",
        date: initialData.date
          ? new Date(initialData.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: initialData.description || "",
        paymentStatus: initialData.paymentStatus || "pending",
        vendor: {
          name: initialData.vendor?.name || "",
          contact: initialData.vendor?.contact || "",
          invoiceNumber: initialData.vendor?.invoiceNumber || "",
        },
        recurring: {
          isRecurring: initialData.recurring?.isRecurring || false,
          frequency: initialData.recurring?.frequency || "monthly",
        },
      });

      // If property is selected, load its units
      if (initialData.property) {
        fetchUnitsForProperty(
          initialData.property?._id || initialData.property
        );
      }
    }
  }, [initialData, defaultPropertyId]);

  const fetchUnitsForProperty = async (propertyId) => {
    try {
      const data = await propertyService.getPropertyUnits(propertyId);
      setUnits(data);
    } catch (err) {
      console.error("Error loading units:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested vendor fields
    if (name.startsWith("vendor.")) {
      const field = name.replace("vendor.", "");
      setFormData({
        ...formData,
        vendor: {
          ...formData.vendor,
          [field]: value,
        },
      });
    }
    // Handle recurring checkbox
    else if (name === "recurring.isRecurring") {
      setFormData({
        ...formData,
        recurring: {
          ...formData.recurring,
          isRecurring: checked,
        },
      });
    }
    // Handle recurring frequency
    else if (name === "recurring.frequency") {
      setFormData({
        ...formData,
        recurring: {
          ...formData.recurring,
          frequency: value,
        },
      });
    }
    // Handle property change and load units
    else if (name === "property") {
      setFormData({
        ...formData,
        [name]: value,
        unit: "", // Reset unit when property changes
      });

      if (value) {
        fetchUnitsForProperty(value);
        
        // Update selected property
        const property = properties.find(p => p._id === value);
        if (property) {
          setSelectedProperty(property);
        }
      } else {
        setUnits([]);
        setSelectedProperty(null);
      }
    }
    // Handle all other fields
    else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.property) {
      setError("Property is required");
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

    if (!formData.date) {
      setError("Date is required");
      return;
    }

    if (!formData.description) {
      setError("Description is required");
      return;
    }

    // Additional validation for custom category
    if (formData.category === "custom" && !formData.customCategory) {
      setError("Custom category name is required");
      return;
    }

    try {
      setLoading(true);

      // Format data for API
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await onSubmit(expenseData);
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message || "Failed to save expense");
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
          <h2 className="text-xl font-medium">
            {initialData ? "Edit Expense" : "Add New Expense"}
          </h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              name="property"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.property}
              onChange={handleChange}
              required
              disabled={defaultPropertyId !== null} // Disable if defaultPropertyId is provided
            >
              <option value="">Select Property</option>
              {properties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
            {defaultPropertyId && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Property is pre-selected based on current context
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit
            </label>
            <select
              name="unit"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.unit}
              onChange={handleChange}
              disabled={!formData.property}
            >
              <option value="">Select Unit (Optional)</option>
              {units.map((unit) => (
                <option key={unit._id} value={unit._id}>
                  Unit {unit.unitNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="maintenance">Maintenance</option>
              <option value="utilities">Utilities</option>
              <option value="taxes">Taxes</option>
              <option value="insurance">Insurance</option>
              <option value="mortgage">Mortgage</option>
              <option value="payroll">Payroll</option>
              <option value="marketing">Marketing</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {formData.category === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customCategory"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={formData.customCategory}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="amount"
                className="pl-12 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.paymentStatus}
              onChange={handleChange}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the expense"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Vendor Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendor.name"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={formData.vendor.name}
                onChange={handleChange}
                placeholder="Name of service provider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vendor Contact
              </label>
              <input
                type="text"
                name="vendor.contact"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={formData.vendor.contact}
                onChange={handleChange}
                placeholder="Phone or email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Invoice Number
              </label>
              <input
                type="text"
                name="vendor.invoiceNumber"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={formData.vendor.invoiceNumber}
                onChange={handleChange}
                placeholder="Invoice reference"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center mb-3">
            <input
              id="recurring"
              name="recurring.isRecurring"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
              checked={formData.recurring.isRecurring}
              onChange={handleChange}
            />
            <label
              htmlFor="recurring"
              className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              This is a recurring expense
            </label>
          </div>

          {formData.recurring.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frequency
              </label>
              <select
                name="recurring.frequency"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={formData.recurring.frequency}
                onChange={handleChange}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          )}
        </div>

        {/* Summary Card */}
        {selectedProperty && formData.amount && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium mb-3">Expense Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Property</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProperty.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(formData.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {formData.category === "custom" ? formData.customCategory : formData.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(formData.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-4">
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
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Expense"
              : "Add Expense"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ExpenseForm;