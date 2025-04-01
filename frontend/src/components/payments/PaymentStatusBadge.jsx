// frontend/src/components/payments/PaymentStatusBadge.jsx
import React from "react";
import { CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";

const PaymentStatusBadge = ({ status }) => {
  switch (status) {
    case "completed":
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    case "partial":
      return (
        <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          <DollarSign className="w-3 h-3 mr-1" />
          Partial
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default PaymentStatusBadge;
