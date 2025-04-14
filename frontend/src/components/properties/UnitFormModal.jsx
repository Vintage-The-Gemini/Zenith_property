// frontend/src/components/properties/UnitFormModal.jsx
import { useState, useEffect } from "react";
import { X, Home, AlertCircle } from "lucide-react";
import Card from "../ui/Card";

const UnitFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  propertyId,
  propertyType = "residential",
  floors = [],
}) => {
  const [formData, setFormData] = useState({
    unitNumber: "",
    floorId: "",
    status: "available",
    description: "",
    monthlyRent: "",
    securityDeposit: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    amenities: [],
    furnished: false,
    unitType: "rental",
    nightlyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useDefaultAmenities, setUseDefaultAmenities] = useState(true);
  const [customAmenity, setCustomAmenity] = useState("");

  // Default amenities based on property type
  const defaultAmenities =
    propertyType === "residential"
      ? ["Wi-Fi", "Water", "Security", "Parking"]
      : propertyType === "commercial"
      ? ["Reception", "Meeting Room", "Elevator", "Parking"]
      : ["Wi-Fi", "Parking", "Security"];

  useEffect(() => {
    if (initialData) {
      // Format the data for the form
      const amenitiesList = Array.isArray(initialData.amenities)
        ? initialData.amenities
        : initialData.amenities?.split(",").map((a) => a.trim()) || [];

      setFormData({
        unitNumber: initialData.unitNumber || "",
        floorId: initialData.floorId || initialData.floor?._id || "",
        status: initialData.status || "available",
        description: initialData.description || "",
        monthlyRent: initialData.monthlyRent || "",
        securityDeposit: initialData.securityDeposit || "",
        size: initialData.size || "",
        bedrooms: initialData.bedrooms || "",
        bathrooms: initialData.bathrooms || "",
        amenities: amenitiesList,
        furnished: initialData.furnished || false,
        unitType: initialData.unitType || "rental",
        nightlyRate: initialData.nightlyRate || "",
        weeklyRate: initialData.weeklyRate || "",
        monthlyRate: initialData.monthlyRate || "",
        checkInTime: initialData.checkInTime || "14:00",
        checkOutTime: initialData.checkOutTime || "11:00",
      });

      // If the unit has custom amenities, switch to custom mode
      setUseDefaultAmenities(
        amenitiesList.length === 0 ||
          amenitiesList.every((a) => defaultAmenities.includes(a))
      );
    } else {
      // For new units, initialize with default amenities
      setFormData((prev) => ({
        ...prev,
        amenities: [...defaultAmenities],
        propertyId,
      }));
    }
  }, [initialData, propertyId, defaultAmenities]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAmenityChange = (amenity) => {
    const updatedAmenities = [...formData.amenities];
    if (updatedAmenities.includes(amenity)) {
      // Remove the amenity
      const index = updatedAmenities.indexOf(amenity);
      updatedAmenities.splice(index, 1);
    } else {
      // Add the amenity
      updatedAmenities.push(amenity);
    }
    setFormData({
      ...formData,
      amenities: updatedAmenities,
    });
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;

    if (!formData.amenities.includes(customAmenity)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, customAmenity],
      });
    }

    setCustomAmenity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.unitNumber) {
      setError("Unit number is required");
      return;
    }

    if (!formData.floorId && floors.length > 0) {
      setError("Please select a floor");
      return;
    }

    if (formData.unitType === "bnb" && !formData.nightlyRate) {
      setError("Nightly rate is required for BnB units");
      return;
    }

    try {
      setLoading(true);

      // Create data object to submit
      const unitData = {
        ...formData,
        propertyId,
        // Convert numeric fields to numbers
        monthlyRent: formData.monthlyRent
          ? parseFloat(formData.monthlyRent)
          : undefined,
        securityDeposit: formData.securityDeposit
          ? parseFloat(formData.securityDeposit)
          : undefined,
        size: formData.size ? parseFloat(formData.size) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms
          ? parseFloat(formData.bathrooms)
          : undefined,
        nightlyRate: formData.nightlyRate
          ? parseFloat(formData.nightlyRate)
          : undefined,
        weeklyRate: formData.weeklyRate
          ? parseFloat(formData.weeklyRate)
          : undefined,
        monthlyRate: formData.monthlyRate
          ? parseFloat(formData.monthlyRate)
          : undefined,
      };

      // Submit the data
      await onSubmit(unitData);
    } catch (err) {
      console.error("Error saving unit:", err);
      setError(err.message || "Failed to save unit");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium">
              {initialData ? "Edit Unit" : "Add Unit"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    required
                  />
                </div>

                {floors.length > 0 && (
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
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit Type
                  </label>
                  <select
                    name="unitType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={formData.unitType}
                    onChange={handleChange}
                  >
                    <option value="rental">Regular Rental</option>
                    <option value="bnb">BnB/Short Stay</option>
                    <option value="office">Office Space</option>
                    <option value="retail">Retail Space</option>
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
            </div>

            {/* Financial Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Financial Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monthly Rent (KES)
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Security Deposit (KES)
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* BnB Rates (Show only for BnB units) */}
            {formData.unitType === "bnb" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  BnB/Short Stay Rates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nightly Rate (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="nightlyRate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.nightlyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required={formData.unitType === "bnb"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Weekly Rate (KES)
                    </label>
                    <input
                      type="number"
                      name="weeklyRate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.weeklyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Optional discount rate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monthly Rate (KES)
                    </label>
                    <input
                      type="number"
                      name="monthlyRate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={formData.monthlyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Optional discount rate"
                    />
                  </div>

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
            )}

            {/* Property Details (based on type) */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Unit Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Size (sq. m)
                  </label>
                  <input
                    type="number"
                    name="size"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={formData.size}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                {propertyType === "residential" && (
                  <>
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
                        step="1"
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
                  </>
                )}

                <div className="md:col-span-3">
                  <div className="flex items-center mb-2">
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
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Amenities
              </h3>

              <div className="flex items-center mb-4">
                <input
                  id="useDefaultAmenities"
                  name="useDefaultAmenities"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={useDefaultAmenities}
                  onChange={() => setUseDefaultAmenities(!useDefaultAmenities)}
                />
                <label
                  htmlFor="useDefaultAmenities"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Use standard amenities
                </label>
              </div>

              {useDefaultAmenities ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {defaultAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <input
                        id={`amenity-${amenity}`}
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                      />
                      <label
                        htmlFor={`amenity-${amenity}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2"
                      >
                        {amenity}
                        <button
                          type="button"
                          className="ml-1.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                          onClick={() => handleAmenityChange(amenity)}
                        >
                          <span className="sr-only">Remove</span>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add amenity"
                      className="flex-grow rounded-l-md border-r-0 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="bg-primary-600 text-white px-3 py-1 rounded-r-md hover:bg-primary-700"
                      onClick={handleAddCustomAmenity}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
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
                placeholder="Describe the unit..."
              />
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : initialData
                  ? "Update Unit"
                  : "Add Unit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnitFormModal;
