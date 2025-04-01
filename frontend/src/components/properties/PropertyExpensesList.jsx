// frontend/src/components/properties/ImprovedPropertyExpensesList.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import Card from "../ui/Card";
import ExpenseForm from "../payments/ExpenseForm";
import expenseService from "../../services/expenseService";
import propertyService from "../../services/propertyService";
import { CSVDownloadButton } from "../common/CSVDownloadButton";

const ImprovedPropertyExpensesList = ({ propertyId, propertyName }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(true); // Show filters by default
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    unitId: ""
  });
  const [units, setUnits] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState({
    totalExpenses: 0,
    monthlyExpenses: 0,
    pendingExpenses: 0,
    categoryBreakdown: {},
    monthlyBreakdown: {}
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

      // Get expenses for this property
      const expensesData = await expenseService.getExpensesByProperty(propertyId);
      setExpenses(expensesData);

      // Get units for this property for filtering
      const propertyDetails = await propertyService.getPropertyById(propertyId);
      if (propertyDetails && propertyDetails.units) {
        setUnits(propertyDetails.units);
      }

      // Calculate summary data
      calculateSummaryData(expensesData);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryData = (expensesData) => {
    // Get current month's start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate total expenses
    const totalExpenses = expensesData.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate current month expenses
    const