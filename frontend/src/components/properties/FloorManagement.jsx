// frontend/src/components/properties/FloorManagement.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash,
  Building2,
  Home,
  AlertTriangle,
} from "lucide-react";
import Card from "../ui/Card";
import UnitFormModal from "./UnitFormModal";
import UnitStatusModal from "./UnitStatusModal";
import floorService from "../../services/floorService";
import unitService from "../../services/unitService";

const FloorManagement = ({
  propertyId,
  propertyType = "apartment",
  onUpdate,
}) => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "",
    id: null,
  });
  const isCommercial =
    propertyType === "commercial" || propertyType === "mixed-use";

  useEffect(() => {
    if (propertyId) {
      loadFloors();
    }
  }, [propertyId]);

  const loadFloors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get floors for this property
      const data = await floorService.getFloorsByProperty(propertyId);
      setFloors(data);
    } catch (err) {
      console.error("Error loading floors:", err);
      setError("Failed to load floors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = (floorId) => {
    setSelectedUnit(null);
    setSelectedFloor(floors.find((floor) => floor._id === floorId));
    setIsUnitModalOpen(true);
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setIsUnitModalOpen(true);
  };

  const handleChangeUnitStatus = (unit) => {
    setSelectedUnit(unit);
    setIsStatusModalOpen(true);
  };

  const handleDeleteUnit = async () => {
    try {
      await unitService.deleteUnit(deleteConfirm.id);
      loadFloors();
      if (onUpdate) onUpdate();
      setDeleteConfirm({ show: false, type: "", id: null });
    } catch (error) {
      console.error("Error deleting unit:", error);
      setError(error.message || "Failed to delete unit");
    }
  };

  const handleSubmitUnit = async (unitData) => {
    try {
      if (selectedUnit) {
        // Update existing unit
        await unitService.updateUnit(selectedUnit._id, unitData);
      } else {
        // Create new unit
        await unitService.addUnitToProperty(propertyId, {
          ...unitData,
          floorId: selectedFloor?._id || unitData.floorId,
        });
      }
      setIsUnitModalOpen(false);
      loadFloors();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving unit:", error);
      throw new Error(error.message || "Failed to save unit");
    }
  };

  const handleStatusChange = async (newStatus) => {
    // After successful status change, reload floors
    await loadFloors();
    if (onUpdate) onUpdate();
  };

  // Check if floors are loaded
  const hasFloors = floors && floors.length > 0;

  if (loading) {
    return <div className="text-center py-4">Loading units...</div>;
  }

  // Render a simple "Add Unit" button if no floors exist yet
  if (!hasFloors) {
    return (
      <Card className="p-6 text-center">
        <Home className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 mb-4">
          No units added yet. Add your first unit to this property.
        </p>
        <button
          onClick={() => setIsUnitModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Unit
        </button>

        {isUnitModalOpen && (
          <UnitFormModal
            isOpen={isUnitModalOpen}
            onClose={() => setIsUnitModalOpen(false)}
            onSubmit={handleSubmitUnit}
            propertyId={propertyId}
            propertyType={propertyType}
            floors={floors}
          />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadFloors} className="ml-2 text-red-700 underline">
            Try Again
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Units</h3>
        <button
          onClick={() => setIsUnitModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Unit
        </button>
      </div>

      <div className="space-y-4">
        {floors.map((floor) => (
          <Card key={floor._id} className="p-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
              <h4 className="text-md font-semibold flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-gray-500" />
                {floor.name || `Floor ${floor.number}`}
              </h4>
              <button
                onClick={() => handleAddUnit(floor._id)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Unit
              </button>
            </div>

            {floor.units && floor.units.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {floor.units.map((unit) => (
                  <div
                    key={unit._id}
                    className="border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Unit {unit.unitNumber}</p>
                        {!isCommercial && (
                          <p className="text-sm text-gray-500">
                            {unit.bedrooms} bed, {unit.bathrooms} bath
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          KES {unit.monthlyRent?.toLocaleString() || 0}/month
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEditUnit(unit)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              show: true,
                              type: "unit",
                              id: unit._id,
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full cursor-pointer
                          ${
                            unit.status === "available"
                              ? "bg-green-100 text-green-800"
                              : unit.status === "occupied"
                              ? "bg-blue-100 text-blue-800"
                              : unit.status === "maintenance"
                              ? "bg-yellow-100 text-yellow-800"
                              : unit.status === "reserved"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        onClick={() => handleChangeUnitStatus(unit)}
                      >
                        {unit.status?.charAt(0).toUpperCase() +
                          unit.status?.slice(1) || "Available"}
                      </span>

                      {unit.currentTenant && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tenant: {unit.currentTenant.firstName}{" "}
                          {unit.currentTenant.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Home className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No units on this floor</p>
                <button
                  onClick={() => handleAddUnit(floor._id)}
                  className="mt-2 inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Unit
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Unit Form Modal */}
      {isUnitModalOpen && (
        <UnitFormModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          onSubmit={handleSubmitUnit}
          initialData={selectedUnit}
          propertyId={propertyId}
          propertyType={propertyType}
          floors={floors}
        />
      )}

      {/* Unit Status Modal */}
      {isStatusModalOpen && (
        <UnitStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          unit={selectedUnit}
          propertyId={propertyId}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Unit
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this unit? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, type: "", id: null })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FloorManagement;
