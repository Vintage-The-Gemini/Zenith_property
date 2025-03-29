// frontend/src/pages/TenantDetails.jsx
import { useState } from "react";
import {
  User,
  Home,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Card from "../components/ui/Card";
import tenantService from "../services/tenantService";

const TenantDetails = ({ tenant, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recordPayment = async (paymentData) => {
    try {
      setLoading(true);
      setError(null);

      await tenantService.recordPayment(tenant._id, paymentData);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      setError("Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-gray-500" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Full Name
            </p>
            <p className="mt-1">
              {tenant.firstName} {tenant.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </p>
            <p className="mt-1 flex items-center">
              <Mail className="h-4 w-4 mr-1 text-gray-400" />
              {tenant.email}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Phone
            </p>
            <p className="mt-1 flex items-center">
              <Phone className="h-4 w-4 mr-1 text-gray-400" />
              {tenant.phone}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </p>
            <p className="mt-1 capitalize">{tenant.status}</p>
          </div>
        </div>

        {tenant.emergencyContact && tenant.emergencyContact.name && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </p>
                <p className="mt-1">{tenant.emergencyContact.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Relationship
                </p>
                <p className="mt-1">
                  {tenant.emergencyContact.relationship || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="mt-1">
                  {tenant.emergencyContact.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="mt-1">
                  {tenant.emergencyContact.email || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Home className="h-5 w-5 mr-2 text-gray-500" />
          Lease Details
        </h3>

        {tenant.leaseDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Unit
              </p>
              <p className="mt-1">
                {tenant.unitId ? (
                  <>
                    Unit {tenant.unitId.unitNumber},{" "}
                    {tenant.unitId.propertyId?.name || "Unknown Property"}
                  </>
                ) : (
                  "No unit assigned"
                )}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Lease Period
              </p>
              <p className="mt-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {tenant.leaseDetails.startDate ? (
                  <>
                    {new Date(
                      tenant.leaseDetails.startDate
                    ).toLocaleDateString()}{" "}
                    -
                    {tenant.leaseDetails.endDate
                      ? new Date(
                          tenant.leaseDetails.endDate
                        ).toLocaleDateString()
                      : "Present"}
                  </>
                ) : (
                  "No lease dates specified"
                )}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Rent
              </p>
              <p className="mt-1 flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                KES {tenant.leaseDetails.rentAmount?.toLocaleString() || 0}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Security Deposit
              </p>
              <p className="mt-1 flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                KES {tenant.leaseDetails.securityDeposit?.toLocaleString() || 0}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payment Frequency
              </p>
              <p className="mt-1 capitalize">
                {tenant.leaseDetails.paymentFrequency || "Monthly"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No lease details available
          </p>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            Payment History
          </h3>

          <button
            onClick={() => {
              // Show payment form modal or implement inline form
              // This is just a placeholder
              const paymentData = {
                amount: tenant.leaseDetails?.rentAmount || 0,
                date: new Date(),
                type: "rent",
                status: "completed",
                reference: `REF-${Date.now().toString().slice(-6)}`,
              };
              recordPayment(paymentData);
            }}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Record Payment
          </button>
        </div>

        {tenant.paymentHistory && tenant.paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tenant.paymentHistory.map((payment, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      KES {payment.amount?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                      {payment.type || "rent"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                      >
                        {payment.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {payment.reference || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No payment history available
          </p>
        )}
      </Card>
    </div>
  );
};

export default TenantDetails;