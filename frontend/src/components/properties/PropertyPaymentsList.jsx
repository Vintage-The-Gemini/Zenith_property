// frontend/src/components/properties/PropertyPaymentsList.jsx
import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import PaymentForm from "../payments/PaymentForm";
import paymentService from "../../services/paymentService";
import tenantService from "../../services/tenantService";
import { exportPropertyPaymentsToCSV } from "../../utils/paymentReportExporter";

// Import our components
import PaymentSummaryCards from "../payments/PaymentSummaryCards";
import PaymentFilterBar from "../payments/PaymentFilterBar";
import PaymentTable from "../payments/PaymentTable";
import TenantBalanceTable from "../payments/TenantBalanceTable";

const PropertyPaymentsList = ({ propertyId, propertyName }) => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: "",
    endDate: "",
    hasOverpayment: false,
    hasUnderpayment: false,
  });

  const [summary, setSummary] = useState({
    monthlyTotal: 0,
    pendingTotal: 0,
    overdueTotal: 0,
    lastMonthRevenue: 0,
    growthRate: 0,
    totalOverpayments: 0,
    totalUnderpayments: 0,
    netBalance: 0,
    criticalAccounts: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    if (propertyId) {
      loadData();
    }
  }, [propertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [paymentsData, propertyTenantsData] = await Promise.all([
        paymentService.getPaymentsByProperty(propertyId),
        tenantService.getTenantsByProperty(propertyId),
      ]);

      setPayments(paymentsData);