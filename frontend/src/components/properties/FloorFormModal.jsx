// frontend/src/components/properties/FloorFormModal.jsx
import { useState, useEffect } from "react";
import { X, Building2 } from "lucide-react";
import Card from "../ui/Card";

const FloorFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  propertyId,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        number: initialData.number || "",
        name: initialData.name || "",
        notes: initialData.notes || "",
      });
    } else {
      // Reset for new floor
      setFormData({
        number: "",
        name: "",
        notes: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.number) {
      setError("Floor number is required");
      return;
    }

    try {
      setIsLoading(true);

      // Format data for API
      const floorData = {
        ...formData,
        propertyId,
        number: parseInt(formData.number),
      };

      // If name is not provided, generate one
      if (!floorData.name.trim()) {
        floorData.name = `Floor ${floorData.number}`;
      }

      await onSubmit(floorData);
      onClose();
    } catch (error) {
      console.error("Error saving floor:", error);
      setError(error.message || "Failed to save floor");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? "Edit Floor" : "Add New Floor"}
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

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Floor Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={formData.number}
              onChange={handleChange}
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
              name="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ground Floor, First Floor, etc."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If left blank, "Floor {number}" will be used
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </label>
            <textarea
              name="notes"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional information about this floor"
            />
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
                ? "Update Floor"
                : "Add Floor"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FloorFormModal;
