// frontend/src/pages/TenantDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Edit, Trash, AlertCircle, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import TenantDetails from "./TenantDetails";
import PaymentFormModal from "../components/tenants/PaymentFormModal";
import tenantService from "../services/tenantService";

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.getTenantById(id);
      setTenant(data);
    } catch (err) {
      console.error("Error loading tenant:", err);
      setError("Failed to load tenant details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      await tenantService.recordPayment(id, paymentData);
      loadTenant(); // Reload tenant data to reflect the new payment
      setShowPaymentForm(false);
    } catch (err) {
      console.error("Error recording payment:", err);
      setError("Failed to record payment. Please try again.");
    }
  };

  const handleDeleteTenant = async () => {
    try {
      await tenantService.deleteTenant(id);
      navigate("/tenants");
    } catch (err) {
      console.error("Error deleting tenant:", err);
      setError("Failed to delete tenant. Please try again.");
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
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={loadTenant}
            className="ml-2 text-red-700 underline"
          >
            Try Again
          </button>
        </div>
        <button
          onClick={() => navigate("/tenants")}
          className="mt-4 flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tenants
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Tenant Not Found
          </h3>
          <p className="mt-2 text-gray-500">
            The tenant you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/tenants")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tenants")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tenant.firstName} {tenant.lastName}
            </h1>
            <p className="text-gray-500">
              {tenant.email} • {tenant.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Record Payment
          </button>
          <button
            onClick={() => navigate(`/tenants/edit/${tenant._id}`)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex items-center px-3.5 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
          >
            <Trash className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Tenant Details Component */}
      <TenantDetails tenant={tenant} onUpdate={loadTenant} />

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentFormModal
          isOpen={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          onSubmit={handleRecordPayment}
          tenant={tenant}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Tenant
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this tenant? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTenant}
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

export default TenantDetail;