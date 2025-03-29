// frontend/src/components/tenants/TenantFormModal.jsx
import { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import Card from "../ui/Card";

const TenantFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  units = [],
  propertyId,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unitId: "",
    leaseStartDate: "",
    leaseEndDate: "",
    rentAmount: "",
    securityDeposit: "",
    status: "pending",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Format the dates properly for date inputs
      const startDate = initialData.leaseDetails?.startDate
        ? new Date(initialData.leaseDetails.startDate)
            .toISOString()
            .split("T")[0]
        : "";

      const endDate = initialData.leaseDetails?.endDate
        ? new Date(initialData.leaseDetails.endDate).toISOString().split("T")[0]
        : "";

      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        unitId: initialData.unitId || "",
        leaseStartDate: startDate,
        leaseEndDate: endDate,
        rentAmount: initialData.leaseDetails?.rentAmount || "",
        securityDeposit: initialData.leaseDetails?.securityDeposit || "",
        status: initialData.status || "pending",
        emergencyContact: {
          name: initialData.emergencyContact?.name || "",
          relationship: initialData.emergencyContact?.relationship || "",
          phone: initialData.emergencyContact?.phone || "",
          email: initialData.emergencyContact?.email || "",
        },
      });
    } else if (units.length > 0) {
      // Pre-select the first available unit if no tenant data is provided
      // Also pre-fill rent amount from unit data if available
      const availableUnit =
        units.find((unit) => unit.status === "available") || units[0];
      if (availableUnit) {
        setFormData((prevData) => ({
          ...prevData,
          unitId: availableUnit._id || "",
          rentAmount: availableUnit.monthlyRent || "",
          securityDeposit: availableUnit.securityDeposit || "",
        }));
      }
    }
  }, [initialData, units]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested emergency contact fields
    if (name.startsWith("emergency.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact,
          [field]: value,
        },
      });
    } else if (name === "unitId") {
      // When unit is changed, auto-populate rent amount if available
      const selectedUnit = units.find((unit) => unit._id === value);
      if (selectedUnit) {
        setFormData({
          ...formData,
          unitId: value,
          rentAmount: selectedUnit.monthlyRent || formData.rentAmount,
          securityDeposit:
            selectedUnit.securityDeposit || formData.securityDeposit,
        });
      } else {
        setFormData({
          ...formData,
          unitId: value,
        });
      }
    } else {
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
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First and last name are required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    if (!formData.unitId) {
      setError("Please select a unit");
      return;
    }

    try {
      setIsLoading(true);

      // Format data for API
      const tenantData = {
        ...formData,
        propertyId,
        leaseDetails: {
          startDate: formData.leaseStartDate,
          endDate: formData.leaseEndDate,
          rentAmount: parseFloat(formData.rentAmount) || 0,
          securityDeposit: parseFloat(formData.securityDeposit) || 0,
          paymentFrequency: "monthly", // Default to monthly
        },
      };

      // Remove the flat properties that are now nested
      delete tenantData.leaseStartDate;
      delete tenantData.leaseEndDate;
      delete tenantData.rentAmount;
      delete tenantData.securityDeposit;

      await onSubmit(tenantData);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to save tenant");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Tenant" : "Add New Tenant"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">
              Unit & Lease Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unitId"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.unitId}
                  onChange={handleChange}
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      Unit {unit.unitNumber} -{" "}
                      {unit.status === "available" ? "Available" : unit.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lease Start Date
                </label>
                <input
                  type="date"
                  name="leaseStartDate"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.leaseStartDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lease End Date
                </label>
                <input
                  type="date"
                  name="leaseEndDate"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.leaseEndDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Rent (KES)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    name="rentAmount"
                    className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.rentAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Security Deposit (KES)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    name="securityDeposit"
                    className="pl-12 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="emergency.name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergency.relationship"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  name="emergency.phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="emergency.email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.emergencyContact.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : isEditMode
                ? "Update Tenant"
                : "Add Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantFormModal;
