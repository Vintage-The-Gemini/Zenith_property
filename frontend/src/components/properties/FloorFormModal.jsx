// frontend/src/components/properties/FloorFormModal.jsx
import { useState, useEffect } from "react";
import { X, Building2, AlertCircle } from "lucide-react";

const FloorFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  propertyId,
}) => {
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        number: initialData.number || "",
        name: initialData.name || "",
        notes: initialData.notes || "",
      });
    } else {
      // Reset form for new floor
      setFormData({
        number: "",
        name: "",
        notes: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.number) {
      setError("Floor number is required");
      return;
    }

    try {
      setLoading(true);

      // If name is empty, generate one based on number
      const floorData = { ...formData };
      if (!floorData.name) {
        floorData.name = `Floor ${floorData.number}`;
      }

      await onSubmit({
        ...floorData,
        propertyId,
      });

      onClose();
    } catch (err) {
      console.error("Error saving floor:", err);
      setError(err.message || "Failed to save floor");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium text-gray-900">
              {initialData ? "Edit Floor" : "Add New Floor"}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Floor Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.number}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Floor Name
              </label>
              <input
                type="text"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Ground Floor, First Floor, etc."
              />
              <p className="mt-1 text-xs text-gray-500">
                If left blank, will default to "Floor [Number]"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about this floor"
              />
            </div>

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
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : initialData
                  ? "Update Floor"
                  : "Add Floor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FloorFormModal;
