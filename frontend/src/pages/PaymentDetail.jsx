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
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  User,
  Building,
  Receipt,
  DollarSign,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/payments")}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Payment Receipt
                  </h1>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="text-sm font-medium capitalize">
                      {payment.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Reference: <span className="font-mono font-medium">{payment.reference || payment._id || "N/A"}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </button>
              <button
                onClick={() => alert("Download functionality will be implemented soon")}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Payment Amount Highlight */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 mr-2" />
              <span className="text-lg font-medium">Amount Paid</span>
            </div>
            <div className="text-5xl font-bold mb-2">
              {formatCurrency(payment.amountPaid || payment.amount)}
            </div>
            <div className="flex items-center justify-center gap-4 text-primary-100">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDate(payment.paymentDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                <span className="text-sm capitalize">{payment.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Details */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-gray-100">
                <CreditCard className="h-6 w-6 mr-3 text-primary-600" />
                Payment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Payment Date</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatDate(payment.paymentDate)}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Due Date</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatDate(payment.dueDate)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Payment Method</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {payment.paymentMethod?.replace('_', ' ') || 'Cash'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <File className="h-4 w-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Payment Type</h4>
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {payment.type || 'Rent'}
                  </p>
                </div>
              </div>

              {payment.description && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {payment.description}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Payment Period Info */}
          <div className="space-y-6">
            {payment.paymentPeriod && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Payment Period</h3>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {payment.paymentPeriod.month}/{payment.paymentPeriod.year}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monthly Payment #{payment.paymentSequence || 1}
                  </p>
                </div>
                
                {payment.isOverpayment && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Overpayment</span>
                    </div>
                  </div>
                )}
                
                {payment.isUnderpayment && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center">
                      <TrendingDown className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Partial Payment</span>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Tenant and Property Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-gray-100">
            <User className="h-6 w-6 mr-3 text-primary-600" />
            Tenant & Property Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Tenant</h4>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {payment.tenant
                  ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
                  : "Unknown Tenant"}
              </p>
              {payment.tenant?.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.tenant.email}</p>
              )}
              {payment.tenant?.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.tenant.phone}</p>
              )}
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-3">
                <Building className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 uppercase tracking-wide">Property</h4>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {payment.property?.name || "Unknown Property"}
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-3">
                <MapPin className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Unit</h4>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {payment.unit ? `Unit ${payment.unit.unitNumber}` : "Unknown Unit"}
              </p>
            </div>
          </div>
        </Card>

        {/* Balance Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-gray-100">
            <TrendingUp className="h-6 w-6 mr-3 text-primary-600" />
            Balance Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Balance Before</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(payment.balanceBeforePayment || 0)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {formatCurrency(payment.amountPaid || payment.amount)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Amount Due</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(payment.amountDue || payment.monthlyRentDue || 0)}
              </p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              (payment.balanceAfterPayment || 0) > 0
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : (payment.balanceAfterPayment || 0) < 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                (payment.balanceAfterPayment || 0) > 0
                  ? 'text-red-600 dark:text-red-400'
                  : (payment.balanceAfterPayment || 0) < 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                New Balance
              </p>
              <p className={`text-2xl font-bold ${
                (payment.balanceAfterPayment || 0) > 0
                  ? 'text-red-700 dark:text-red-300'
                  : (payment.balanceAfterPayment || 0) < 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {formatCurrency(Math.abs(payment.balanceAfterPayment || 0))}
                {(payment.balanceAfterPayment || 0) < 0 && (
                  <span className="text-sm font-normal text-green-600 dark:text-green-400 ml-1">(Credit)</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Payment breakdown */}
          {(payment.appliedToArears > 0 || payment.appliedToCurrentPeriod > 0) && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Payment Allocation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payment.appliedToArears > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Applied to Arrears</p>
                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                      {formatCurrency(payment.appliedToArears)}
                    </p>
                  </div>
                )}
                
                {payment.appliedToCurrentPeriod > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Applied to Current Period</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(payment.appliedToCurrentPeriod)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaymentDetail;
