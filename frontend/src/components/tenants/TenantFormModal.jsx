// frontend/src/components/tenants/TenantFormModal.jsx
import { useState, useEffect } from "react";
import { X, User, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import { getAvailableUnits } from "../../services/unitService";
import { createTenant, updateTenant } from "../../services/tenantService";

const TenantFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  propertyId,
  unitInfo = null,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unitId: unitInfo?.id || "",
    propertyId: propertyId || "",
    leaseDetails: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 12))
        .toISOString()
        .split("T")[0],
      rentAmount: "",
      securityDeposit: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUnits();

      if (initialData) {
        // Format dates for the form
        const leaseStartDate = initialData.leaseDetails?.startDate
          ? new Date(initialData.leaseDetails.startDate)
              .toISOString()
              .split("T")[0]
          : "";

        const leaseEndDate = initialData.leaseDetails?.endDate
          ? new Date(initialData.leaseDetails.endDate)
              .toISOString()
              .split("T")[0]
          : "";

        setFormData({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          unitId:
            initialData.unitId?._id || initialData.unitId || unitInfo?.id || "",
          propertyId:
            initialData.propertyId?._id ||
            initialData.propertyId ||
            propertyId ||
            "",
          leaseDetails: {
            startDate: leaseStartDate,
            endDate: leaseEndDate,
            rentAmount: initialData.leaseDetails?.rentAmount || "",
            securityDeposit: initialData.leaseDetails?.securityDeposit || "",
          },
          emergencyContact: {
            name: initialData.emergencyContact?.name || "",
            relationship: initialData.emergencyContact?.relationship || "",
            phone: initialData.emergencyContact?.phone || "",
            email: initialData.emergencyContact?.email || "",
          },
        });
      } else if (unitInfo) {
        // Pre-set the unit if provided via unitInfo
        setFormData((prev) => ({
          ...prev,
          unitId: unitInfo.id,
          propertyId: propertyId,
        }));
      }
    }
  }, [isOpen, initialData, unitInfo, propertyId]);

  const fetchAvailableUnits = async () => {
    try {
      setLoading(true);
      const response = await getAvailableUnits(propertyId);
      setAvailableUnits(response);

      // If we have unitInfo but no other form data, try to get rent and deposit from the unit
      if (unitInfo && !initialData && response.length > 0) {
        const selectedUnit = response.find((unit) => unit._id === unitInfo.id);
        if (selectedUnit) {
          setFormData((prev) => ({
            ...prev,
            leaseDetails: {
              ...prev.leaseDetails,
              rentAmount:
                selectedUnit.monthlyRent || prev.leaseDetails.rentAmount,
              securityDeposit:
                selectedUnit.securityDeposit ||
                prev.leaseDetails.securityDeposit,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching available units:", err);
      setError("Failed to load available units");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested fields
    if (name.startsWith("leaseDetails.")) {
      const field = name.replace("leaseDetails.", "");
      setFormData((prev) => ({
        ...prev,
        leaseDetails: {
          ...prev.leaseDetails,
          [field]: value,
        },
      }));
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.replace("emergencyContact.", "");
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setError("First and last name are required");
      return;
    }

    if (!formData.email) {
      setError("Email is required");
      return;
    }

    if (!formData.unitId) {
      setError("Please select a unit");
      return;
    }

    if (!formData.propertyId) {
      setError("Property ID is required");
      return;
    }

    try {
      setLoading(true);

      // Format data for API
      const tenantData = {
        ...formData,
        leaseDetails: {
          ...formData.leaseDetails,
          rentAmount: parseFloat(formData.leaseDetails.rentAmount) || 0,
          securityDeposit:
            parseFloat(formData.leaseDetails.securityDeposit) || 0,
        },
      };

      console.log("Submitting tenant data:", tenantData);

      let result;
      if (isEditMode) {
        result = await updateTenant(initialData._id, tenantData);
      } else {
        result = await createTenant(tenantData);
      }

      if (onSubmit) {
        onSubmit(result);
      }

      onClose();
    } catch (err) {
      console.error("Error saving tenant:", err);
      setError(err.message || "Failed to save tenant");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
              {isEditMode ? "Edit Tenant" : "Add New Tenant"}
              {unitInfo && !isEditMode && ` for Unit ${unitInfo.unitNumber}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tenant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Unit Assignment
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unitId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.unitId}
                  onChange={handleChange}
                  required
                  disabled={unitInfo !== null || loading}
                >
                  <option value="">Select a unit</option>
                  {availableUnits.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.propertyId?.name || "Property"} - Unit{" "}
                      {unit.unitNumber}
                    </option>
                  ))}
                  {unitInfo && (
                    <option value={unitInfo.id}>
                      Unit {unitInfo.unitNumber}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Lease Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="leaseDetails.startDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.leaseDetails.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="leaseDetails.endDate"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.leaseDetails.endDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monthly Rent (KES)
                  </label>
                  <input
                    type="number"
                    name="leaseDetails.rentAmount"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.leaseDetails.rentAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Security Deposit (KES)
                  </label>
                  <input
                    type="number"
                    name="leaseDetails.securityDeposit"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.leaseDetails.securityDeposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
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
                    name="emergencyContact.relationship"
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
                    name="emergencyContact.phone"
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
                    name="emergencyContact.email"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Tenant"
                  : "Add Tenant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantFormModal;
