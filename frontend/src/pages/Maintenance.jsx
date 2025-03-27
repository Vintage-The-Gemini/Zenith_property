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
} from "lucide-react";
import Card from "../components/ui/Card";

function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Simulate API call with a timeout
    const fetchMaintenance = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data for development
        const mockData = [
          {
            id: 1,
            issue: "Plumbing leak in bathroom",
            description: "Water leaking from under the sink",
            unit: "101",
            property: "Sunset Apartments",
            priority: "High",
            status: "pending",
            reportedBy: "John Doe",
            reportedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: 2,
            issue: "HVAC not working",
            description: "Air conditioning stopped working yesterday",
            unit: "202",
            property: "Ocean View Condos",
            priority: "Medium",
            status: "in_progress",
            reportedBy: "Jane Smith",
            reportedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: 3,
            issue: "Broken window",
            description: "Window cracked during the storm",
            unit: "304",
            property: "Sunset Apartments",
            priority: "Low",
            status: "completed",
            reportedBy: "Mike Johnson",
            reportedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        ];

        setRequests(mockData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching maintenance requests:", err);
        setError("Failed to load maintenance requests");
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, []);

  // Filter requests based on search term
  const filteredRequests = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.issue.toLowerCase().includes(searchLower) ||
      request.unit.toLowerCase().includes(searchLower) ||
      request.property.toLowerCase().includes(searchLower) ||
      request.priority.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower) ||
      request.reportedBy.toLowerCase().includes(searchLower)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Maintenance Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage property maintenance issues
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Request
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search maintenance requests..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
              onClick={() => setIsModalOpen(true)}
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
              key={request.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                      {request.issue}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.property} - Unit {request.unit}
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
                      {formatDate(request.reportedDate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full text-sm text-center text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-6">
              Create Maintenance Request
            </h2>
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              Maintenance request form will be implemented soon.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
