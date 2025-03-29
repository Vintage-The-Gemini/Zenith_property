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
    // Floor relationship
    floorId: floors.length > 0 ? floors[0]._id : "",
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
        floorId:
          initialData.floorId || (floors.length > 0 ? floors[0]._id : ""),
      });
    } else if (floors.length > 0) {
      // Pre-select the first floor for new units
      setFormData((prev) => ({
        ...prev,
        floorId: floors[0]._id,
      }));
    }
  }, [initialData, floors, isCommercial]);

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

    if (!formData.monthlyRent) {
      setError("Monthly rent is required");
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
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: formData.securityDeposit
          ? parseFloat(formData.securityDeposit)
          : 0,
        bedrooms: parseInt(formData.bedrooms || 0),
        bathrooms: parseFloat(formData.bathrooms || 0),
        squareFootage: formData.squareFootage
          ? parseInt(formData.squareFootage)
          : null,
      };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
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

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Floor
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Number
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Monthly Rent (KES)
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

          <div className="grid grid-cols-2 gap-4">
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
                <option value="rental">Rental</option>
                <option value="bnb">BnB/Short Stay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>

          {/* Residential specific fields */}
          {!isCommercial && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          )}

          {/* Commercial specific fields */}
          {isCommercial && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commercial Unit Type
              </label>
              <select
                name="commercialUnitType"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.commercialUnitType}
                onChange={handleChange}
              >
                <option value="office">Office</option>
                <option value="retail">Retail</option>
                <option value="warehouse">Warehouse</option>
                <option value="industrial">Industrial</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit (KES)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">KES</span>
              </div>
              <input
                type="number"
                name="securityDeposit"
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.securityDeposit}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Square Footage
            </label>
            <input
              type="number"
              name="squareFootage"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.squareFootage}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          {!isCommercial && (
            <div className="flex items-center">
              <input
                id="furnished"
                name="furnished"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.furnished}
                onChange={handleChange}
              />
              <label
                htmlFor="furnished"
                className="ml-2 block text-sm text-gray-700"
              >
                Furnished
              </label>
            </div>
          )}

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
              placeholder="Unit description..."
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
              {isLoading
                ? "Saving..."
                : isEditMode
                ? "Update Unit"
                : "Add Unit"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UnitFormModal;
