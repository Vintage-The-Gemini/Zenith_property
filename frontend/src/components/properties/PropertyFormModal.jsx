// frontend/src/components/properties/PropertyFormModal.jsx
import { useState, useEffect } from "react";
import { X, Building2, Plus, Trash } from "lucide-react";
import Card from "../ui/Card";

const PropertyFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    propertyType: "apartment",
    description: "",
    floors: [{ number: 1, name: "Ground Floor", units: [] }],
    amenities: [],
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // If editing an existing property, use its data
      const initialFloors =
        initialData.floors && initialData.floors.length > 0
          ? initialData.floors
          : [{ number: 1, name: "Ground Floor", units: [] }];

      setFormData({
        name: initialData.name || "",
        address: initialData.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        propertyType: initialData.propertyType || "apartment",
        description: initialData.description || "",
        floors: initialFloors,
        amenities: initialData.amenities || [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const addFloor = () => {
    // Find the highest floor number
    const maxFloorNumber = Math.max(
      ...formData.floors.map((floor) => floor.number),
      0
    );
    setFormData({
      ...formData,
      floors: [
        ...formData.floors,
        {
          number: maxFloorNumber + 1,
          name: `Floor ${maxFloorNumber + 1}`,
          units: [],
        },
      ],
    });
  };

  const removeFloor = (index) => {
    const updatedFloors = [...formData.floors];
    updatedFloors.splice(index, 1);
    setFormData({
      ...formData,
      floors: updatedFloors,
    });
  };

  const handleFloorChange = (index, field, value) => {
    const updatedFloors = [...formData.floors];
    updatedFloors[index][field] = value;
    setFormData({
      ...formData,
      floors: updatedFloors,
    });
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setFormData({
        ...formData,
        amenities: [
          ...formData.amenities,
          { name: newAmenity.trim(), description: "" },
        ],
      });
      setNewAmenity("");
    }
  };

  const removeAmenity = (index) => {
    const updatedAmenities = [...formData.amenities];
    updatedAmenities.splice(index, 1);
    setFormData({
      ...formData,
      amenities: updatedAmenities,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.name.trim()) {
      setError("Property name is required");
      return;
    }

    if (
      !formData.address.street.trim() ||
      !formData.address.city.trim() ||
      !formData.address.state.trim() ||
      !formData.address.zipCode.trim() ||
      !formData.address.country.trim()
    ) {
      setError("All address fields are required");
      return;
    }

    // Make sure floor numbers are unique
    const floorNumbers = formData.floors.map((floor) => floor.number);
    if (new Set(floorNumbers).size !== floorNumbers.length) {
      setError("Floor numbers must be unique");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to save property");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Property" : "Add New Property"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isLoading}
            aria-label="Close"
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

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Property Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={formData.name}
                onChange={handleChange}
                placeholder="Sunset Apartments"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                name="propertyType"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={formData.propertyType}
                onChange={handleChange}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="commercial">Commercial</option>
                <option value="mixed-use">Mixed Use</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the property"
                rows="3"
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Address
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address.street"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.city"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  State/Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.state"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zip/Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="Zip Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.country"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Floors */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Floors
              </h3>
              <button
                type="button"
                onClick={addFloor}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Floor
              </button>
            </div>

            {formData.floors.map((floor, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-4 relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Floor Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={floor.number}
                      onChange={(e) =>
                        handleFloorChange(
                          index,
                          "number",
                          parseInt(e.target.value)
                        )
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Floor Name
                    </label>
                    <input
                      type="text"
                      value={floor.name}
                      onChange={(e) =>
                        handleFloorChange(index, "name", e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. Ground Floor, First Floor, etc."
                    />
                  </div>
                </div>

                {formData.floors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFloor(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Amenities
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Swimming Pool, Gym, etc."
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Add
              </button>
            </div>

            {formData.amenities.length > 0 ? (
              <div className="mt-2 space-y-2">
                {formData.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <span>{amenity.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-1">
                No amenities added yet. Add amenities like gym, pool, parking,
                etc.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyFormModal;
