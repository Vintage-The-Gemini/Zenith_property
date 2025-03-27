import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Building2, Loader2, AlertTriangle } from "lucide-react";
import { getAllProperties, deleteProperty } from "../services/propertyService";
import PropertyFormModal from "../components/properties/PropertyFormModal";
import Card from "../components/ui/Card";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProperties();
      setProperties(data);
    } catch (err) {
      console.error("Error loading properties:", err);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (id) => {
    navigate(`/properties/${id}`);
  };

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setIsModalOpen(true);
  };

  const handleEditProperty = (e, property) => {
    e.stopPropagation();
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await deleteProperty(deleteConfirm.id);
      setProperties(properties.filter((p) => p._id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Failed to delete property. Please try again.");
    }
  };

  const handleSubmitProperty = async (propertyData) => {
    try {
      // If we have a selected property, it means we're editing
      if (selectedProperty) {
        const updatedProperty = await updateProperty(
          selectedProperty._id,
          propertyData
        );
        setProperties(
          properties.map((p) =>
            p._id === selectedProperty._id ? updatedProperty : p
          )
        );
      } else {
        // Otherwise, we're creating a new property
        const newProperty = await createProperty(propertyData);
        setProperties([...properties, newProperty]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving property:", error);
      throw new Error(error.response?.data?.message || "Error saving property");
    }
  };

  // Filter properties based on search term
  const filteredProperties = properties.filter(
    (property) =>
      property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate property stats
  const calculatePropertyStats = (property) => {
    if (!property.floors)
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        occupancyRate: 0,
        totalRent: 0,
      };

    const totalUnits = property.floors.reduce(
      (acc, floor) => acc + (floor.units?.length || 0),
      0
    );

    const occupiedUnits = property.floors.reduce(
      (acc, floor) =>
        acc + (floor.units?.filter((unit) => unit.isOccupied)?.length || 0),
      0
    );

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const totalRent = property.floors.reduce(
      (acc, floor) =>
        acc +
          floor.units?.reduce(
            (sum, unit) =>
              unit.isOccupied ? sum + (unit.monthlyRent || 0) : sum,
            0
          ) || 0,
      0
    );

    return { totalUnits, occupiedUnits, occupancyRate, totalRent };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your properties and view details
          </p>
        </div>
        <button
          onClick={handleAddProperty}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadProperties}
            className="ml-2 text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search properties by name or address..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No properties
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first property
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddProperty}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </button>
          </div>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">
            No matching properties
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or add a new property
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const stats = calculatePropertyStats(property);
            return (
              <Card
                key={property._id}
                onClick={() => handlePropertyClick(property._id)}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {property.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {property.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleEditProperty(e, property)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, property._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Units</p>
                      <p className="text-sm font-semibold">
                        {stats.totalUnits}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupied</p>
                      <p className="text-sm font-semibold">
                        {stats.occupiedUnits} ({stats.occupancyRate}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Revenue</p>
                      <p className="text-sm font-semibold">
                        ${stats.totalRent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold">
                        <span
                          className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${
                            stats.occupancyRate > 80
                              ? "bg-green-500"
                              : stats.occupancyRate > 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {stats.occupancyRate > 80
                          ? "Good"
                          : stats.occupancyRate > 50
                          ? "Average"
                          : "Low Occupancy"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-right">
                  <span className="text-xs text-primary-600 font-medium">
                    View Details →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Property Form Modal */}
      <PropertyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitProperty}
        initialData={selectedProperty}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Property
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this property? This action cannot
              be undone and will remove all associated data including units,
              tenants, and payment records.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

export default Properties;
