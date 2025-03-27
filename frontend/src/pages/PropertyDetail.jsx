// frontend/src/pages/PropertyDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash,
  Building2,
  Users,
  Home,
  DollarSign,
  Loader2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../services/propertyService";
import {
  addUnitToProperty,
  updateUnit,
  deleteUnit,
} from "../services/unitService";
import PropertyFormModal from "../components/properties/PropertyFormModal";
import UnitFormModal from "../components/properties/UnitFormModal";
import Card from "../components/ui/Card";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPropertyFormModalOpen, setIsPropertyFormModalOpen] = useState(false);
  const [isUnitFormModalOpen, setIsUnitFormModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "",
    id: null,
  });

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPropertyById(id);
      setProperty(data);
    } catch (err) {
      console.error("Error loading property:", err);
      setError("Failed to load property details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (updatedData) => {
    try {
      const updated = await updateProperty(id, updatedData);
      setProperty(updated);
      setIsPropertyFormModalOpen(false);
    } catch (error) {
      console.error("Error updating property:", error);
      throw new Error("Failed to update property");
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await deleteProperty(id);
      navigate("/properties");
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Failed to delete property. Please try again.");
    }
  };

  const handleAddUnit = () => {
    setSelectedUnit(null);
    setIsUnitFormModalOpen(true);
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setIsUnitFormModalOpen(true);
  };

  const handleDeleteUnitClick = (unitId) => {
    setDeleteConfirm({
      show: true,
      type: "unit",
      id: unitId,
    });
  };

  const handleSubmitUnit = async (unitData) => {
    try {
      if (selectedUnit) {
        // Update existing unit
        const updatedUnit = await updateUnit(selectedUnit._id, unitData);

        // Update local state
        const updatedUnits = property.units.map((unit) =>
          unit._id === selectedUnit._id ? updatedUnit : unit
        );

        setProperty({
          ...property,
          units: updatedUnits,
        });
      } else {
        // Add new unit
        const newUnit = await addUnitToProperty(id, unitData);

        // Update local state
        setProperty({
          ...property,
          units: [...(property.units || []), newUnit],
        });
      }
      setIsUnitFormModalOpen(false);
    } catch (error) {
      console.error("Error saving unit:", error);
      throw new Error(error.message || "Failed to save unit");
    }
  };

  const handleDeleteUnit = async () => {
    try {
      await deleteUnit(deleteConfirm.id);

      // Update local state
      const updatedUnits = property.units.filter(
        (unit) => unit._id !== deleteConfirm.id
      );

      setProperty({
        ...property,
        units: updatedUnits,
      });

      setDeleteConfirm({ show: false, type: "", id: null });
    } catch (error) {
      console.error("Error deleting unit:", error);
      setError("Failed to delete unit. Please try again.");
    }
  };

  // Calculate property statistics
  const calculateStats = () => {
    if (!property) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        occupancyRate: 0,
        totalRent: 0,
      };
    }

    const totalUnits = property.units?.length || 0;
    const occupiedUnits =
      property.units?.filter((unit) => unit.status === "occupied").length || 0;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const totalRent =
      property.units?.reduce((acc, unit) => {
        return unit.status === "occupied" ? acc + (unit.monthlyRent || 0) : acc;
      }, 0) || 0;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      totalRent,
    };
  };

  // Get badge for unit status
  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </span>
        );
      case "occupied":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <Users className="w-3 h-3 mr-1" />
            Occupied
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Maintenance
          </span>
        );
      case "reserved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
            <Clock className="w-3 h-3 mr-1" />
            Reserved
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadProperty}
            className="ml-2 text-red-700 underline"
          >
            Try Again
          </button>
        </div>
        <button
          onClick={() => navigate("/properties")}
          className="mt-4 flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Property Not Found
          </h3>
          <p className="mt-2 text-gray-500">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/properties")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/properties")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {property.name}
            </h1>
            <p className="text-gray-500">
              {property.address?.street}, {property.address?.city},{" "}
              {property.address?.state}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPropertyFormModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() =>
              setDeleteConfirm({
                show: true,
                type: "property",
                id: property._id,
              })
            }
            className="inline-flex items-center px-3.5 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-xl font-semibold">{stats.totalUnits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupancy</p>
              <p className="text-xl font-semibold">
                {stats.occupiedUnits}/{stats.totalUnits} ({stats.occupancyRate}
                %)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Vacant Units</p>
              <p className="text-xl font-semibold">{stats.vacantUnits}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-xl font-semibold">
                KES {stats.totalRent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "units"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Units
          </button>
          <button
            onClick={() => setActiveTab("tenants")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "tenants"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
              activeTab === "payments"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "overview" && <PropertyOverview property={property} />}

        {activeTab === "units" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Units</h3>
              <button
                onClick={handleAddUnit}
                className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Unit
              </button>
            </div>

            {property.units && property.units.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.units.map((unit) => (
                  <Card
                    key={unit._id}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between">
                      <h5 className="font-medium">Unit {unit.unitNumber}</h5>
                      {getStatusBadge(unit.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Rent: KES {unit.monthlyRent?.toLocaleString() || 0}/month
                    </p>
                    <p className="text-sm text-gray-500">
                      {unit.bedrooms} bed, {unit.bathrooms} bath
                      {unit.squareFootage
                        ? `, ${unit.squareFootage} sq ft`
                        : ""}
                    </p>

                    {unit.status === "occupied" && unit.currentTenant && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm">
                          Tenant: {unit.currentTenant.firstName}{" "}
                          {unit.currentTenant.lastName}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-2">
                      <button
                        onClick={() => handleEditUnit(unit)}
                        className="px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUnitClick(unit._id)}
                        className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-500">No units added yet.</p>
                <button
                  onClick={handleAddUnit}
                  className="mt-4 inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Unit
                </button>
              </Card>
            )}
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Tenant management will be implemented soon.
            </p>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Payment tracking will be implemented soon.
            </p>
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      {isPropertyFormModalOpen && (
        <PropertyFormModal
          isOpen={isPropertyFormModalOpen}
          onClose={() => setIsPropertyFormModalOpen(false)}
          onSubmit={handleUpdateProperty}
          initialData={property}
        />
      )}

      {/* Unit Form Modal */}
      {isUnitFormModalOpen && (
        <UnitFormModal
          isOpen={isUnitFormModalOpen}
          onClose={() => setIsUnitFormModalOpen(false)}
          onSubmit={handleSubmitUnit}
          initialData={selectedUnit}
          propertyId={property._id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete {deleteConfirm.type === "property" ? "Property" : "Unit"}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this{" "}
              {deleteConfirm.type === "property" ? "property" : "unit"}? This
              action cannot be undone
              {deleteConfirm.type === "property"
                ? " and will remove all associated data including units, tenants, and payment records."
                : "."}
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
                onClick={
                  deleteConfirm.type === "property"
                    ? handleDeleteProperty
                    : handleDeleteUnit
                }
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

// PropertyOverview Component
const PropertyOverview = ({ property }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Property Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Property Type</h4>
            <p className="mt-1">
              {property.propertyType?.charAt(0).toUpperCase() +
                property.propertyType?.slice(1) || "Residential"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Address</h4>
            <p className="mt-1">
              {property.address?.street}, {property.address?.city},{" "}
              {property.address?.state}, {property.address?.zipCode}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1">
              <span
                className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${
                  property.status === "active"
                    ? "bg-green-500"
                    : property.status === "maintenance"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              ></span>
              {property.status?.charAt(0).toUpperCase() +
                property.status?.slice(1) || "Active"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date Added</h4>
            <p className="mt-1">
              {property.createdAt
                ? new Date(property.createdAt).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
        {property.description && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="mt-1 text-gray-700">{property.description}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-500">No recent activity found.</p>
        </div>
      </Card>
    </div>
  );
};

export default PropertyDetail;
