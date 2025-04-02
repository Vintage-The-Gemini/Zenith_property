// frontend/src/components/properties/UnitFormModal.jsx
import { useState, useEffect } from "react";
import { X, Home } from "lucide-react";
import Card from "../ui/Card";

const UnitFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  propertyId,
  floors = [],
  propertyType = "apartment", // Default property type
}) => {
  const isEditMode = !!initialData;
  const isCommercial =
    propertyType === "commercial" || propertyType === "mixed-use";
  const isBnB = propertyType === "bnb";

  const [formData, setFormData] = useState({
    unitNumber: "",
    type: "rental",
    status: "available",
    bedrooms: isCommercial ? 0 : 1,
    bathrooms: isCommercial ? 0 : 1,
    squareFootage: "",
    monthlyRent: "",
    securityDeposit: "",
    furnished: false,
    description: "",
    // Commercial specific fields
    commercialUnitType: isCommercial ? "office" : "",
    // BnB specific fields
    nightlyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    // Floor relationship
    floorId: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        unitNumber: initialData.unitNumber || "",
        type: initialData.type || "rental",
        status: initialData.status || "available",
        bedrooms: initialData.bedrooms ?? (isCommercial ? 0 : 1),
        bathrooms: initialData.bathrooms ?? (isCommercial ? 0 : 1),
        squareFootage: initialData.squareFootage || "",
        monthlyRent: initialData.monthlyRent || "",
        securityDeposit: initialData.securityDeposit || "",
        furnished: initialData.furnished || false,
        description: initialData.description || "",
        commercialUnitType:
          initialData.commercialUnitType || (isCommercial ? "office" : ""),
        nightlyRate: initialData.nightlyRate || "",
        weeklyRate: initialData.weeklyRate || "",
        monthlyRate: initialData.monthlyRate || "",
        checkInTime: initialData.checkInTime || "14:00",
        checkOutTime: initialData.checkOutTime || "11:00",
        floorId: initialData.floorId || "",
      });
    } else {
      // Reset form for new unit, but populate floorId if floors are available
      setFormData({
        unitNumber: "",
        type: "rental",
        status: "available",
        bedrooms: isCommercial ? 0 : 1,
        bathrooms: isCommercial ? 0 : 1,
        squareFootage: "",
        monthlyRent: "",
        securityDeposit: "",
        furnished: false,
        description: "",
        commercialUnitType: isCommercial ? "office" : "",
        nightlyRate: "",
        weeklyRate: "",
        monthlyRate: "",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        floorId: floors.length > 0 ? floors[0]._id : "",
      });
    }
  }, [initialData, floors, isCommercial, isBnB]);

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

    // Basic validation
    if (!formData.unitNumber.trim()) {
      setError("Unit number is required");
      return;
    }

    if (!formData.monthlyRent && !formData.nightlyRate) {
      setError(isBnB ? "Nightly rate is required" : "Monthly rent is required");
      return;
    }

    if (!formData.floorId) {
      setError("Please select a floor");
      return;
    }

    try {
      setIsLoading(true);

      // Format data for API
      const unitData = {
        ...formData,
        propertyId,
        monthlyRent: parseFloat(formData.monthlyRent) || 0,
        securityDeposit: formData.securityDeposit
          ? parseFloat(formData.securityDeposit)
          : 0,
        bedrooms: parseInt(formData.bedrooms || 0),
        bathrooms: parseFloat(formData.bathrooms || 0),
        squareFootage: formData.squareFootage
          ? parseInt(formData.squareFootage)
          : null,
      };

      // Add BnB specific fields if applicable
      if (isBnB) {
        unitData.nightlyRate = parseFloat(formData.nightlyRate) || 0;
        unitData.weeklyRate = parseFloat(formData.weeklyRate) || 0;
        unitData.monthlyRate = parseFloat(formData.monthlyRate) || 0;
        unitData.checkInTime = formData.checkInTime;
        unitData.checkOutTime = formData.checkOutTime;
      }

      // Remove any fields that shouldn't be sent for the property type
      if (isCommercial) {
        // Commercial units don't need residential specifics
        unitData.bedrooms = 0;
        unitData.bathrooms = 0;
        unitData.furnished = false;
      } else {
        // Residential units don't need commercial specifics
        delete unitData.commercialUnitType;
      }

      console.log("Submitting unit data:", unitData);
      await onSubmit(unitData);
      onClose();
    } catch (error) {
      console.error("Error saving unit:", error);
      setError(error.message || "Failed to save unit");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium">
              {isEditMode ? "Edit Unit" : "Add New Unit"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Floor <span className="text-red-500">*</span>
              </label>
              <select
                name="floorId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.floorId}
                onChange={handleChange}
                required
              >
                <option value="">Select Floor</option>
                {floors.map((floor) => (
                  <option key={floor._id} value={floor._id}>
                    {floor.name || `Floor ${floor.number}`}
                  </option>
                ))}
              </select>
              {floors.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  No floors available. Please add a floor first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="unitNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.unitNumber}
                onChange={handleChange}
                placeholder="101"
                required
              />
            </div>

            {isBnB ? (
              // BnB pricing fields
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nightly Rate (KES) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">KES</span>
                    </div>
                    <input
                      type="number"
                      name="nightlyRate"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.nightlyRate}
                      onChange={handleChange}
                      placeholder="2500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weekly Rate (KES)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">KES</span>
                    </div>
                    <input
                      type="number"
                      name="weeklyRate"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.weeklyRate}
                      onChange={handleChange}
                      placeholder="15000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional discounted rate for weekly stays
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monthly Rate (KES)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">KES</span>
                    </div>
                    <input
                      type="number"
                      name="monthlyRate"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.monthlyRate}
                      onChange={handleChange}
                      placeholder="60000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional discounted rate for monthly stays
                  </p>
                </div>
                
                <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      name="checkInTime"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.checkInTime}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check-out Time
                    </label>
                    <input
                      type="time"
                      name="checkOutTime"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.checkOutTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Normal rental unit pricing
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monthly Rent (KES) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">KES</span>
                  </div>
                  <input
                    type="number"
                    name="monthlyRent"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    placeholder="15000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Type
                </label>
                <select
                  name="type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="rental