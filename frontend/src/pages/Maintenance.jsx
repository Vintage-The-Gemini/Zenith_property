// src/pages/Maintenance.jsx
import { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Edit,
  Eye,
} from "lucide-react";
import Card from "../components/ui/Card";
import MaintenanceForm from "../components/maintenance/MaintenanceForm";
import MaintenanceStatusModal from "../components/maintenance/MaintenanceStatusModal";
import maintenanceService from "../services/maintenanceService";

function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [filters]);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceService.getMaintenanceRequests(filters);
      setRequests(data);
    } catch (err) {
      console.error("Error fetching maintenance requests:", err);
      setError("Failed to load maintenance requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (formData) => {
    try {
      await maintenanceService.createMaintenanceRequest(formData);
      await fetchMaintenanceRequests(); // Refresh the list
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      throw error; // Let the form handle the error
    }
  };

  const handleStatusUpdate = async (requestId, updateData) => {
    try {
      await maintenanceService.updateMaintenanceRequest(requestId, updateData);
      await fetchMaintenanceRequests(); // Refresh the list
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      throw error; // Let the modal handle the error
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsStatusModalOpen(true);
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.issue.toLowerCase().includes(searchLower) ||
      (request.unit?.unitNumber || '').toString().toLowerCase().includes(searchLower) ||
      (request.property?.name || '').toLowerCase().includes(searchLower) ||
      request.priority.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower) ||
      request.reportedBy.toLowerCase().includes(searchLower) ||
      (request.description || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Wrench className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            High
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Low
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Maintenance Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage property maintenance issues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="structural">Structural</option>
                <option value="appliance">Appliance</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search maintenance requests..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No maintenance requests
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create a new maintenance request to get started
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Request
            </button>
          </div>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No matching maintenance requests
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <Card
              key={request._id || request.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                      {request.issue}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.property?.name || 'Unknown Property'} - Unit {request.unit?.unitNumber || 'N/A'}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-4">
                  {request.description}
                </p>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Reported By
                    </p>
                    <p className="font-medium">{request.reportedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Priority</p>
                    <div className="mt-1">
                      {getPriorityBadge(request.priority)}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium">
                      {formatDate(request.reportedDate || request.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => handleViewRequest(request)}
                  className="w-full text-sm text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Maintenance Form Modal */}
      <MaintenanceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Maintenance Status Modal */}
      <MaintenanceStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        maintenanceRequest={selectedRequest}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}

export default Maintenance;
