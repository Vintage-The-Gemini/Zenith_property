import { useState, useEffect } from "react";
import { X, Plus, Trash2, Building2 } from "lucide-react";
import Card from "../ui/Card";

const PropertyFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    type: "residential",
    floors: [
      {
        floorNumber: 1,
        units: [{ unitNumber: "", monthlyRent: "" }],
      },
    ],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        address: initialData.address || "",
        description: initialData.description || "",
        type: initialData.type || "residential",
        floors:
          initialData.floors?.length > 0
            ? initialData.floors
            : [
                {
                  floorNumber: 1,
                  units: [{ unitNumber: "", monthlyRent: "" }],
                },
              ],
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim() || !formData.address.trim()) {
      setError("Property name and address are required");
      return;
    }

    // Validate each floor has at least valid units
    const hasInvalidUnits = formData.floors.some((floor) =>
      floor.units.some((unit) => !unit.unitNumber.trim() || !unit.monthlyRent)
    );

    if (hasInvalidUnits) {
      setError("All units must have a unit number and monthly rent");
      return;
    }

    try {
      setError("");

      // Format data properly for API
      const propertyData = {
        ...formData,
        floors: formData.floors.map((floor) => ({
          ...floor,
          floorNumber: parseInt(floor.floorNumber),
          units: floor.units.map((unit) => ({
            ...unit,
            unitNumber: unit.unitNumber.trim(),
            monthlyRent: parseFloat(unit.monthlyRent),
            isOccupied: unit.isOccupied || false,
          })),
        })),
      };

      await onSubmit(propertyData);
    } catch (error) {
      console.error("Error with property:", error);
      setError(error.message || "Failed to save property. Please try again.");
    }
  };

  const addFloor = () => {
    setFormData((prev) => ({
      ...prev,
      floors: [
        ...prev.floors,
        {
          floorNumber:
            prev.floors.length > 0
              ? Math.max(...prev.floors.map((f) => f.floorNumber)) + 1
              : 1,
          units: [{ unitNumber: "", monthlyRent: "" }],
        },
      ],
    }));
  };

  const removeFloor = (index) => {
    if (formData.floors.length > 1) {
      setFormData((prev) => ({
        ...prev,
        floors: prev.floors.filter((_, i) => i !== index),
      }));
    }
  };

  const addUnit = (floorIndex) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      newFloors[floorIndex].units.push({ unitNumber: "", monthlyRent: "" });
      return { ...prev, floors: newFloors };
    });
  };

  const removeUnit = (floorIndex, unitIndex) => {
    if (formData.floors[floorIndex].units.length > 1) {
      setFormData((prev) => {
        const newFloors = [...prev.floors];
        newFloors[floorIndex].units = newFloors[floorIndex].units.filter(
          (_, i) => i !== unitIndex
        );
        return { ...prev, floors: newFloors };
      });
    }
  };

  const updateUnit = (floorIndex, unitIndex, field, value) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      newFloors[floorIndex].units[unitIndex][field] = value;
      return { ...prev, floors: newFloors };
    });
  };

  const updateFloor = (index, value) => {
    setFormData((prev) => {
      const newFloors = [...prev.floors];
      newFloors[index].floorNumber = value;
      return { ...prev, floors: newFloors };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Edit Property" : "Add New Property"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Property Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Sunset Apartments"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the property"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Property Type
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed Use</option>
              </select>
            </div>
          </div>

          {/* Floors and Units */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Floors and Units
              </h3>
              <button
                type="button"
                onClick={addFloor}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Floor
              </button>
            </div>

            {formData.floors.map((floor, floorIndex) => (
              <Card key={floorIndex} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Floor
                    </label>
                    <input
                      type="number"
                      className="w-16 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={floor.floorNumber}
                      onChange={(e) => updateFloor(floorIndex, e.target.value)}
                      min="1"
                    />
                  </div>
                  {formData.floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFloor(floorIndex)}
                      className="text-red-600 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700">Units</h4>
                    <button
                      type="button"
                      onClick={() => addUnit(floorIndex)}
                      className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                      disabled={isLoading}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Unit
                    </button>
                  </div>

                  {floor.units.map((unit, unitIndex) => (
                    <div
                      key={unitIndex}
                      className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={unit.unitNumber}
                          onChange={(e) =>
                            updateUnit(
                              floorIndex,
                              unitIndex,
                              "unitNumber",
                              e.target.value
                            )
                          }
                          placeholder="101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Monthly Rent
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500"
                            value={unit.monthlyRent}
                            onChange={(e) =>
                              updateUnit(
                                floorIndex,
                                unitIndex,
                                "monthlyRent",
                                e.target.value
                              )
                            }
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        {floor.units.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUnit(floorIndex, unitIndex)}
                            className="text-red-600 hover:text-red-700 mb-1"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3">
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
