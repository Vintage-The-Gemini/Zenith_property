// frontend/src/pages/Properties.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Building2,
  Loader2,
  AlertTriangle,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import {
  getAllProperties,
  deleteProperty,
  createProperty,
  updateProperty,
} from "../services/propertyService";
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

      console.log("Loading properties from database...");
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
    console.log("Navigating to property details:", id);
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
      // Update local state to reflect deletion
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
      property.address?.street
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      property.address?.city
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      property.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-light-primary-900 dark:text-white">
            Property Portfolio
          </h1>
          <p className="text-light-primary-600 dark:text-dark-primary-300 mt-1">
            Manage and oversee all your properties
          </p>
        </div>
        <button
          onClick={handleAddProperty}
          className="inline-flex items-center px-6 py-3 bg-light-accent-600 dark:bg-dark-accent-600 text-white hover:bg-light-accent-700 dark:hover:bg-dark-accent-700 transition-colors duration-200 font-medium shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={loadProperties}
            className="ml-2 text-red-700 dark:text-red-300 underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-light-primary-400 dark:text-dark-primary-400" />
          <input
            type="text"
            placeholder="Search properties by name, location, or type..."
            className="w-full pl-10 pr-4 py-3 border border-light-primary-200 dark:border-dark-primary-700 focus:outline-none focus:border-light-accent-500 dark:focus:border-dark-accent-500 bg-white dark:bg-dark-primary-900 text-light-primary-900 dark:text-white transition-colors duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No properties
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No matching properties
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or add a new property
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card
              key={property._id}
              className="group overflow-hidden hover:shadow-lg hover:border-light-accent-300 dark:hover:border-dark-accent-600 transition-all duration-200 cursor-pointer"
              onClick={() => handlePropertyClick(property._id)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-light-primary-900 dark:text-white group-hover:text-light-accent-700 dark:group-hover:text-dark-accent-400 transition-colors">
                      {property.name}
                    </h3>
                    <p className="text-sm text-light-primary-600 dark:text-dark-primary-300 mt-1">
                      {property.address?.street}, {property.address?.city}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs font-medium text-light-accent-700 dark:text-dark-accent-400 bg-light-accent-50 dark:bg-dark-accent-900/20 border border-light-accent-200 dark:border-dark-accent-800 mt-2">
                      {property.propertyType?.charAt(0).toUpperCase() +
                        property.propertyType?.slice(1) || "Residential"}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePropertyClick(property._id);
                      }}
                      className="p-2 text-light-primary-400 hover:text-light-accent-600 dark:text-dark-primary-400 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800 transition-colors"
                      aria-label="View property details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleEditProperty(e, property)}
                      className="p-2 text-light-primary-400 hover:text-light-accent-600 dark:text-dark-primary-400 dark:hover:text-dark-accent-400 hover:bg-light-primary-50 dark:hover:bg-dark-primary-800 transition-colors"
                      aria-label="Edit property"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, property._id)}
                      className="p-2 text-light-primary-400 hover:text-red-600 dark:text-dark-primary-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="Delete property"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Units
                    </p>
                    <p className="text-sm font-semibold dark:text-white">
                      {property.units?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <p className="text-sm font-semibold dark:text-white">
                      <span
                        className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${
                          property.status === "active"
                            ? "bg-green-500"
                            : property.status === "maintenance"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      {property.status?.charAt(0).toUpperCase() +
                        property.status?.slice(1) || "Active"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-right border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePropertyClick(property._id);
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
                >
                  View Details →
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      {isModalOpen && (
        <PropertyFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitProperty}
          initialData={selectedProperty}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Property
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this property? This action cannot
              be undone and will remove all associated data including units,
              tenants, and payment records.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
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
