// frontend/src/components/properties/UnitStatusModal.jsx
import { useState, useEffect } from "react";
import { X, Home, User, AlertCircle } from "lucide-react";
import Card from "../ui/Card";
import TenantFormModal from "../tenants/TenantFormModal";
import { updateUnitStatus } from "../../services/unitService";

const UnitStatusModal = ({
  isOpen,
  onClose,
  unit,
  onStatusChange,
  propertyId,
}) => {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);

  useEffect(() => {
    if (unit) {
      setStatus(unit.status || "available");
    }
  }, [unit]);

  const handleStatusChange = async () => {
    // If attempting to mark as occupied, show tenant form instead of changing status directly
    if (status === "occupied" && !unit.currentTenant) {
      setShowTenantForm(true);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateUnitStatus(unit._id, { status });

      if (onStatusChange) {
        onStatusChange(status);
      }

      onClose();
    } catch (err) {
      console.error("Error updating unit status:", err);
      setError(err.message || "Failed to update unit status");
    } finally {
      setLoading(false);
    }
  };

  const handleTenantAdded = () => {
    if (onStatusChange) {
      onStatusChange("occupied");
    }
    setShowTenantForm(false);
    onClose();
  };

  if (!isOpen || !unit) return null;

  if (showTenantForm) {
    return (
      <TenantFormModal
        isOpen={true}
        onClose={() => setShowTenantForm(false)}
        onSubmit={handleTenantAdded}
        propertyId={propertyId}
        unitInfo={{
          id: unit._id,
          unitNumber: unit.unitNumber,
          floorNumber: unit.floorId?.number,
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-medium">
              Update Unit Status - {unit.unitNumber}
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
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Status
            </label>
            <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
              {unit.status || "available"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>

            {status === "occupied" && !unit.currentTenant && (
              <p className="mt-1 text-sm text-yellow-600">
                <User className="inline h-4 w-4 mr-1" />
                You'll need to assign a tenant to mark this unit as occupied.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStatusChange}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Status"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default UnitStatusModal;
