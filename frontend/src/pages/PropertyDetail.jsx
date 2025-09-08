// frontend/src/pages/PropertyDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash,
  Building2,
  Users,
  Home,
  Banknote,
  Loader2,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  CreditCard,
} from "lucide-react";
import Card from "../components/ui/Card";
import PropertyFormModal from "../components/properties/PropertyFormModal";
import UnitFormModal from "../components/properties/UnitFormModal";
import FloorManagement from "../components/properties/FloorManagement";
import PropertyTenantList from "../components/properties/PropertyTenantList";
import PropertyPaymentsList from "../components/properties/PropertyPaymentsList";
import PropertyExpensesList from "../components/properties/PropertyExpensesList";
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
import floorService from "../services/floorService";
import expenseService from "../services/expenseService";
import paymentService from "../services/paymentService";
import tenantService from "../services/tenantService";
import { exportPropertyPaymentsToCSV } from '../utils/paymentReportExporter';
import { exportToCSV } from '../utils/csvExporter';
import { exportPaymentsToEnhancedCSV, generatePaymentReportFileName } from '../utils/enhancedPaymentExporter';
// Move this inside the PropertyDetail component



const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get active tab from URL params, default to overview
  const activeTab = searchParams.get("tab") || "overview";
  const [isPropertyFormModalOpen, setIsPropertyFormModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  // Removed unused selectedFloor state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "",
    id: null,
  });
  
  // Refresh trigger for cross-component communication
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const handleExportPayments = async () => {
    try {
      setExporting(true);
      
      // Load comprehensive data for export
      const [payments, tenants, expenses] = await Promise.all([
        paymentService.getPaymentsByProperty(id),
        tenantService.getTenantsByProperty(id),
        expenseService.getExpensesByProperty(id)
      ]);

      // Prepare filter information
      const exportFilters = {
        timeFilter: 'all', // Default to all time for comprehensive export
        propertyId: id
      };

      // Generate enhanced CSV data
      const csvData = exportPaymentsToEnhancedCSV(
        payments,
        expenses,
        tenants,
        property,
        exportFilters
      );

      // Generate filename
      const fileName = generatePaymentReportFileName(property, exportFilters);

      // Export the data
      exportToCSV(csvData, fileName);
      
      setExporting(false);
    } catch (error) {
      console.error('Error exporting payments:', error);
      setError('Failed to export payments');
      setExporting(false);
    }
  };

  // Function to handle tab changes and update URL
  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Function to trigger refresh across components
  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load property details
  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPropertyById(id);
      setProperty(data);

      // Load floors if they're not included in the property data
      if (!data.floors || data.floors.length === 0) {
        loadFloors(data._id);
      }
    } catch (err) {
      console.error("Error loading property:", err);
      setError("Failed to load property details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Explicitly load floors for this property
  const loadFloors = async (propertyId) => {
    try {
      const floorsData = await floorService.getFloorsByProperty(
        propertyId || id
      );
      setProperty((prev) => ({
        ...prev,
        floors: floorsData,
      }));
    } catch (err) {
      console.error("Error loading floors:", err);
      // Don't set the error state here to avoid conflicting with property loading errors
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

  const handleAddUnit = (floorId) => {
    // Verify floors exist before trying to add a unit
    if (!property.floors || property.floors.length === 0) {
      setError("Please add a floor before adding units");
      return;
    }

    setSelectedUnit(null);
    const floor = property.floors.find((f) => f._id === floorId);
    if (floor) {
      setSelectedFloor(floor);
      setIsUnitModalOpen(true);
    } else {
      setError("Selected floor not found. Please try again.");
    }
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setIsUnitModalOpen(true);
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

        // Update local state - find and replace the updated unit
        if (property.units && property.units.length > 0) {
          const updatedUnits = property.units.map((unit) =>
            unit._id === selectedUnit._id ? updatedUnit : unit
          );

          setProperty({
            ...property,
            units: updatedUnits,
          });
        }
      } else {
        // Add new unit
        const newUnit = await addUnitToProperty(id, unitData);

        // Update local state to include the new unit
        setProperty({
          ...property,
          units: [...(property.units || []), newUnit],
        });
      }

      // Close the modal and reload floors to get the updated unit data
      setIsUnitModalOpen(false);
      loadFloors();
    } catch (error) {
      console.error("Error saving unit:", error);
      throw new Error(error.message || "Failed to save unit");
    }
  };

  const handleDeleteUnit = async () => {
    try {
      await deleteUnit(deleteConfirm.id);

      // Update local state by removing the deleted unit
      if (property.units && property.units.length > 0) {
        const updatedUnits = property.units.filter(
          (unit) => unit._id !== deleteConfirm.id
        );

        setProperty({
          ...property,
          units: updatedUnits,
        });
      }

      setDeleteConfirm({ show: false, type: "", id: null });
      // Reload floors to sync the UI
      loadFloors();
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
      {/* Back Button - Keep minimal header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/properties")}
          className="p-3 text-light-primary-500 dark:text-dark-primary-400 hover:bg-light-primary-100 dark:hover:bg-dark-primary-800 rounded-full transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-light-primary-900 dark:text-white">
          {property.name}
        </h1>
      </div>

      {/* Enhanced Tabs - Moved to top */}
      <Card className="p-1 rounded-xl">
        <nav className="flex space-x-1">
          <button
            onClick={() => handleTabChange("overview")}
            className={`py-3 px-6 inline-flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-light-accent-600 dark:bg-dark-accent-600 text-white shadow-sm"
                : "text-light-primary-600 dark:text-dark-primary-300 hover:text-light-accent-600 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800"
            }`}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => handleTabChange("units")}
            className={`py-3 px-6 inline-flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "units"
                ? "bg-light-accent-600 dark:bg-dark-accent-600 text-white shadow-sm"
                : "text-light-primary-600 dark:text-dark-primary-300 hover:text-light-accent-600 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800"
            }`}
          >
            <Home className="mr-2 h-4 w-4" />
            Units
          </button>
          <button
            onClick={() => handleTabChange("tenants")}
            className={`py-3 px-6 inline-flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "tenants"
                ? "bg-light-accent-600 dark:bg-dark-accent-600 text-white shadow-sm"
                : "text-light-primary-600 dark:text-dark-primary-300 hover:text-light-accent-600 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800"
            }`}
          >
            <Users className="mr-2 h-4 w-4" />
            Tenants
          </button>
          <button
            onClick={() => handleTabChange("payments")}
            className={`py-3 px-6 inline-flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "payments"
                ? "bg-light-accent-600 dark:bg-dark-accent-600 text-white shadow-sm"
                : "text-light-primary-600 dark:text-dark-primary-300 hover:text-light-accent-600 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800"
            }`}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </button>
          <button
            onClick={() => handleTabChange("expenses")}
            className={`py-3 px-6 inline-flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === "expenses"
                ? "bg-light-accent-600 dark:bg-dark-accent-600 text-white shadow-sm"
                : "text-light-primary-600 dark:text-dark-primary-300 hover:text-light-accent-600 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800"
            }`}
          >
            <Banknote className="mr-2 h-4 w-4" />
            Expenses
          </button>
        </nav>
      </Card>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "overview" && (
          <PropertyOverview 
            property={property} 
            stats={stats}
            onEditProperty={() => setIsPropertyFormModalOpen(true)}
            onDeleteProperty={() => setDeleteConfirm({ show: true, type: "property", id: property._id })}
          />
        )}

        {activeTab === "units" && (
          <FloorManagement
            propertyId={property._id}
            propertyType={property.propertyType}
            onUpdate={loadFloors}
          />
        )}

        {activeTab === "tenants" && (
          <PropertyTenantList
            propertyId={property._id}
            propertyName={property.name}
            onDataChange={handleDataRefresh}
          />
        )}

{activeTab === "payments" && (
  <PropertyPaymentsTab
    property={property}
    onExportPayments={handleExportPayments}
    exporting={exporting}
    refreshTrigger={refreshTrigger}
  />
)}

        {activeTab === "expenses" && (
          <PropertyExpensesTab
            property={property}
            refreshTrigger={refreshTrigger}
          />
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
      {isUnitModalOpen && (
        <UnitFormModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          onSubmit={handleSubmitUnit}
          initialData={selectedUnit}
          propertyId={property._id}
          propertyType={property.propertyType}
          floors={property.floors || []}
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


// Enhanced PropertyOverview Component
const PropertyOverview = ({ property, stats, onEditProperty, onDeleteProperty }) => {
  return (
    <div className="space-y-8">
      {/* Property Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-light-primary-900 dark:text-white">
            {property.name}
          </h1>
          <p className="text-light-primary-600 dark:text-dark-primary-300 mt-1">
            {property.address?.street}, {property.address?.city},{" "}
            {property.address?.state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onEditProperty}
            className="inline-flex items-center px-4 py-2.5 border border-light-primary-300 dark:border-dark-primary-600 rounded-lg text-sm font-medium text-light-primary-700 dark:text-dark-primary-300 bg-white dark:bg-dark-primary-900 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800 transition-colors duration-200"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </button>
          <button
            onClick={onDeleteProperty}
            className="inline-flex items-center px-4 py-2.5 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-dark-primary-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-xl hover:shadow-lg transition-all duration-200">
          <div className="flex items-center">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
              <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
                Total Units
              </p>
              <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                {stats.totalUnits}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl hover:shadow-lg transition-all duration-200">
          <div className="flex items-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
                Occupancy Rate
              </p>
              <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                {stats.occupancyRate}%
              </p>
              <p className="text-xs text-light-primary-400 dark:text-dark-primary-500">
                {stats.occupiedUnits} of {stats.totalUnits} units
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl hover:shadow-lg transition-all duration-200">
          <div className="flex items-center">
            <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-4">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
                Vacant Units
              </p>
              <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                {stats.vacantUnits}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl hover:shadow-lg transition-all duration-200">
          <div className="flex items-center">
            <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-4">
              <Banknote className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
                Monthly Revenue
              </p>
              <p className="text-2xl font-bold text-light-primary-900 dark:text-white">
                KES {stats.totalRent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8 rounded-xl">
        <h3 className="text-2xl font-bold text-light-primary-900 dark:text-white mb-6">
          Property Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Property Type
            </h4>
            <p className="mt-2 text-lg text-light-primary-900 dark:text-white">
              {property.propertyType?.charAt(0).toUpperCase() +
                property.propertyType?.slice(1) || "Residential"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Address
            </h4>
            <p className="mt-2 text-lg text-light-primary-900 dark:text-white">
              {property.address?.street}, {property.address?.city},{" "}
              {property.address?.state}, {property.address?.zipCode}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Status
            </h4>
            <p className="mt-2 flex items-center">
              <span
                className={`inline-block h-3 w-3 rounded-full mr-2 ${
                  property.status === "active"
                    ? "bg-green-500 dark:bg-green-400"
                    : property.status === "maintenance"
                    ? "bg-yellow-500 dark:bg-yellow-400"
                    : "bg-gray-500 dark:bg-gray-400"
                }`}
              ></span>
              <span className="text-lg text-light-primary-900 dark:text-white">
                {property.status?.charAt(0).toUpperCase() +
                  property.status?.slice(1) || "Active"}
              </span>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Date Added
            </h4>
            <p className="mt-2 text-lg text-light-primary-900 dark:text-white">
              {property.createdAt
                ? new Date(property.createdAt).toLocaleDateString()
                : "-"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Floors
            </h4>
            <p className="mt-2 text-lg text-light-primary-900 dark:text-white">
              {property.floors?.length || 0} floors
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Total Units
            </h4>
            <p className="mt-2 text-lg text-light-primary-900 dark:text-white">
              {property.units?.length || 0} units
            </p>
          </div>
        </div>
        {property.description && (
          <div className="mt-8 pt-8 border-t border-light-primary-200 dark:border-dark-primary-700">
            <h4 className="text-sm font-semibold text-light-primary-500 dark:text-dark-primary-400 uppercase tracking-wide">
              Description
            </h4>
            <p className="mt-2 text-lg text-light-primary-700 dark:text-dark-primary-200">
              {property.description}
            </p>
          </div>
        )}
      </Card>

      {/* Enhanced Property Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <Card className="p-8 rounded-xl">
          <h3 className="text-2xl font-bold text-light-primary-900 dark:text-white mb-6">
            Property Amenities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {property.amenities.map((amenity, index) => (
              <div
                key={index}
                className="bg-light-primary-50 dark:bg-dark-primary-800 rounded-xl p-4 text-center border border-light-primary-100 dark:border-dark-primary-700 hover:bg-light-primary-100 dark:hover:bg-dark-primary-700 transition-colors duration-200"
              >
                <p className="text-sm font-medium text-light-primary-700 dark:text-dark-primary-200">
                  {amenity.name || amenity}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enhanced Financial Summary */}
      <Card className="p-8 rounded-xl">
        <h3 className="text-2xl font-bold text-light-primary-900 dark:text-white mb-6">
          Financial Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 p-6 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
              Potential Monthly Income
            </h4>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              KES {getPropertyIncome(property).potential.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
              Actual Monthly Income
            </h4>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              KES {getPropertyIncome(property).actual.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 p-6 rounded-xl border border-red-200 dark:border-red-800">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
              Vacancy Loss
            </h4>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              KES {getPropertyIncome(property).vacancy.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Enhanced Recent Activity */}
      <Card className="p-8 rounded-xl">
        <h3 className="text-2xl font-bold text-light-primary-900 dark:text-white mb-6">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-light-primary-400 dark:text-dark-primary-400 mb-4" />
          <p className="text-light-primary-500 dark:text-dark-primary-400">
            No recent activity found.
          </p>
          <p className="text-sm text-light-primary-400 dark:text-dark-primary-500 mt-1">
            Activity will appear here as you manage your property
          </p>
        </div>
      </Card>
    </div>
  );
};

// Helper function to calculate property income
const getPropertyIncome = (property) => {
  if (!property.units || property.units.length === 0) {
    return { potential: 0, actual: 0, vacancy: 0 };
  }

  const potential = property.units.reduce(
    (sum, unit) => sum + (unit.monthlyRent || 0),
    0
  );

  const actual = property.units
    .filter((unit) => unit.status === "occupied")
    .reduce((sum, unit) => sum + (unit.monthlyRent || 0), 0);

  return {
    potential,
    actual,
    vacancy: potential - actual,
  };
};

// PropertyPaymentsTab Component with Time Filters
const PropertyPaymentsTab = ({ property, onExportPayments, exporting, refreshTrigger }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timeFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="space-y-6">
      {/* Time Filters Section */}
      <Card className="p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Time:
            </h4>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {timeFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="lg:ml-auto">
            <button
              onClick={onExportPayments}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Payments'}
            </button>
          </div>
        </div>
      </Card>

      {/* Payments Content */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Property Payments
        </h3>
        <PropertyPaymentsList
          propertyId={property._id}
          propertyName={property.name}
          refreshTrigger={refreshTrigger}
          timeFilter={timeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </div>
    </div>
  );
};

// PropertyExpensesTab Component with Time Filters
const PropertyExpensesTab = ({ property, refreshTrigger }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timeFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExportExpenses = async () => {
    try {
      const data = await expenseService.getExpensesByProperty(property._id);
      const expensesArray = Array.isArray(data) ? data : [];

      // Apply time filtering for export
      const { startDate, endDate } = getDateRange();
      let filteredExpenses = expensesArray;

      if (startDate && endDate) {
        filteredExpenses = expensesArray.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }

      const exportData = filteredExpenses.map(expense => ({
        Date: new Date(expense.date).toLocaleDateString(),
        Category: expense.category === 'custom' ? expense.customCategory : expense.category,
        Amount: expense.amount,
        Status: expense.paymentStatus,
        Description: expense.description,
        Vendor: expense.vendor?.name || 'N/A',
        Invoice: expense.vendor?.invoiceNumber || 'N/A',
        Unit: expense.unit ? `Unit ${expense.unit.unitNumber}` : 'N/A',
        Recurring: expense.recurring?.isRecurring ? 'Yes' : 'No',
        Frequency: expense.recurring?.isRecurring ? expense.recurring.frequency : 'N/A',
      }));

      const fileName = `${property.name}_expenses_${timeFilter !== 'all' ? timeFilter + '_' : ''}${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(exportData, fileName);
    } catch (error) {
      console.error('Error exporting expenses:', error);
    }
  };

  // Helper function for time range calculation (same as in PropertyExpensesList)
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = null;
          endDate = null;
        }
        break;
      default:
        startDate = null;
        endDate = null;
    }

    return { startDate, endDate };
  };

  return (
    <div className="space-y-6">
      {/* Time Filters Section */}
      <Card className="p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Time:
            </h4>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {timeFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="lg:ml-auto">
            <button
              onClick={handleExportExpenses}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-md transition-colors duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Expenses
            </button>
          </div>
        </div>
      </Card>

      {/* Expenses Content */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Property Expenses
        </h3>
        <PropertyExpensesList
          propertyId={property._id}
          propertyName={property.name}
          refreshTrigger={refreshTrigger}
          timeFilter={timeFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </div>
    </div>
  );
};

export default PropertyDetail;
