// frontend/src/pages/PaymentDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  File,
  Download,
  Printer,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Card from "../components/ui/Card";
import paymentService from "../services/paymentService";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getPaymentById(id);
      setPayment(data);
    } catch (err) {
      console.error("Error loading payment:", err);
      setError("Failed to load payment details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
          <button onClick={loadPayment} className="ml-2 text-red-700 underline">
            Try Again
          </button>
        </div>
        <button
          onClick={() => navigate("/payments")}
          className="mt-4 flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Payments
        </button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Payment Not Found
          </h3>
          <p className="mt-2 text-gray-500">
            The payment you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/payments")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Payments
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
            onClick={() => navigate("/payments")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Details
            </h1>
            <p className="text-gray-500">
              Reference: {payment.reference || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </button>
          <button
            onClick={() =>
              alert("Download functionality will be implemented soon")
            }
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </button>
        </div>
      </div>

      {/* Payment Details */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
          Payment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Amount</h4>
            <p className="mt-1 text-lg font-semibold">
              KES {payment.amount?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1">
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  payment.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : payment.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : payment.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {payment.status?.charAt(0).toUpperCase() +
                  payment.status?.slice(1) || "Unknown"}
              </span>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Payment Date</h4>
            <p className="mt-1">{formatDate(payment.paymentDate)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
            <p className="mt-1">{formatDate(payment.dueDate)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Payment Method
            </h4>
            <p className="mt-1 capitalize">
              {payment.paymentMethod?.replace("_", " ") || "Not specified"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Payment Type</h4>
            <p className="mt-1 capitalize">{payment.type || "Not specified"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Reference</h4>
            <p className="mt-1">{payment.reference || "N/A"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              Receipt Number
            </h4>
            <p className="mt-1">{payment.receiptNumber || "N/A"}</p>
          </div>
        </div>

        {payment.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="mt-1 text-gray-700">{payment.description}</p>
          </div>
        )}
      </Card>

      {/* Tenant Information */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">
          Tenant and Property Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tenant</h4>
            <p className="mt-1">
              {payment.tenant
                ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                : "Unknown"}
            </p>
            {payment.tenant && payment.tenant.email && (
              <p className="text-sm text-gray-500">{payment.tenant.email}</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Property</h4>
            <p className="mt-1">{payment.property?.name || "Unknown"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Unit</h4>
            <p className="mt-1">
              {payment.unit ? `Unit ${payment.unit.unitNumber}` : "Unknown"}
            </p>
          </div>
        </div>
      </Card>

    {/* Payment Balance Information */}
{(payment.previousBalance !== undefined || payment.newBalance !== undefined) && (
  <Card className="p-6">
    <h2 className="text-lg font-medium mb-4">Balance Information</h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <h4 className="text-sm font-medium text-gray-500">Previous Balance</h4>
        <p className="mt-1">KES {payment.previousBalance?.toLocaleString() || 0}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500">Payment Amount</h4>
        <p className="mt-1">KES {payment.amount?.toLocaleString() || 0}</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500">New Balance</h4>
        <p className="mt-1">KES {payment.newBalance?.toLocaleString() || 0}</p>
      </div>
      
      {payment.paymentVariance !== 0 && (
        <div className="md:col-span-3">
          <h4 className="text-sm font-medium text-gray-500">Payment Variance</h4>
          <p className={`mt-1 ${payment.paymentVariance > 0 ? 'text-green-600' : payment.paymentVariance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {payment.paymentVariance > 0 ? 'Overpaid: ' : payment.paymentVariance < 0 ? 'Underpaid: ' : ''}
            KES {Math.abs(payment.paymentVariance)?.toLocaleString() || 0}
            {payment.paymentVariance > 0 ? ' (Credit)' : payment.paymentVariance < 0 ? ' (Balance Due)' : ''}
          </p>
        </div>
      )}
    </div>
  </Card>
)}
    </div>
  );
};

export default PaymentDetail;
