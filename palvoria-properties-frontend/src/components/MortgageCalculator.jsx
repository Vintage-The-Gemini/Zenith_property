import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const MortgageCalculator = ({ propertyPrice = 0, onResultsChange }) => {
  const [formData, setFormData] = useState({
    propertyPrice: propertyPrice || 45000000, // Default KSH 45M
    downPayment: 4500000, // 10% default
    loanTerm: 25, // years
    interestRate: 12.5, // Kenya average rate
    propertyTax: 0, // Kenya doesn't have property tax like US
    insurance: 50000, // Annual insurance KSH
    hoaFees: 0, // Monthly HOA fees
  })

  const [results, setResults] = useState({
    monthlyPayment: 0,
    totalLoanAmount: 0,
    totalInterest: 0,
    totalCost: 0,
    monthlyBreakdown: {},
    affordabilityAnalysis: {}
  })

  const [currentRates, setCurrentRates] = useState({
    prime: 12.5,
    commercial: 13.2,
    sacco: 11.8,
    mortgage: 12.1
  })

  // Simulate fetching current rates from Kenyan financial institutions
  useEffect(() => {
    const fetchCurrentRates = async () => {
      // In real implementation, this would fetch from CBK or bank APIs
      const mockRates = {
        prime: 12.5 + (Math.random() - 0.5), // ±0.5% variation
        commercial: 13.2 + (Math.random() - 0.5),
        sacco: 11.8 + (Math.random() - 0.5),
        mortgage: 12.1 + (Math.random() - 0.5)
      }
      setCurrentRates(mockRates)
    }

    fetchCurrentRates()
    const interval = setInterval(fetchCurrentRates, 300000) // Update every 5 minutes
    return () => clearInterval(interval)
  }, [])

  // Calculate mortgage payments using Kenyan lending standards
  useEffect(() => {
    calculateMortgage()
  }, [formData, currentRates])

  const calculateMortgage = () => {
    const {
      propertyPrice,
      downPayment,
      loanTerm,
      interestRate,
      insurance,
      hoaFees
    } = formData

    // Principal loan amount
    const principal = propertyPrice - downPayment
    
    // Monthly interest rate
    const monthlyRate = (interestRate / 100) / 12
    
    // Number of payments
    const numPayments = loanTerm * 12
    
    // Calculate monthly payment using standard mortgage formula
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)

    // Additional monthly costs
    const monthlyInsurance = insurance / 12
    const totalMonthlyPayment = monthlyPayment + monthlyInsurance + hoaFees

    // Total amounts
    const totalInterest = (monthlyPayment * numPayments) - principal
    const totalCost = principal + totalInterest + (insurance * loanTerm) + (hoaFees * numPayments)

    // Affordability analysis based on Kenyan banking standards
    const recommendedIncome = totalMonthlyPayment * 3.5 // 28% of gross income rule
    const maxAffordablePrice = recommendedIncome * 0.28 * numPayments / 
      (monthlyRate * (Math.pow(1 + monthlyRate, numPayments)) / 
       (Math.pow(1 + monthlyRate, numPayments) - 1)) + downPayment

    const newResults = {
      monthlyPayment: totalMonthlyPayment,
      totalLoanAmount: principal,
      totalInterest,
      totalCost,
      monthlyBreakdown: {
        principal: monthlyPayment,
        insurance: monthlyInsurance,
        hoa: hoaFees,
        total: totalMonthlyPayment
      },
      affordabilityAnalysis: {
        recommendedIncome,
        maxAffordablePrice,
        debtToIncomeRatio: (totalMonthlyPayment / (recommendedIncome / 12)) * 100
      }
    }

    setResults(newResults)
    
    // Callback for parent component
    if (onResultsChange) {
      onResultsChange(newResults)
    }
  }

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0
    
    setFormData(prev => {
      const newData = { ...prev, [field]: numValue }
      
      // Auto-calculate down payment percentage if property price changes
      if (field === 'propertyPrice') {
        const downPaymentPercentage = (prev.downPayment / prev.propertyPrice) * 100
        newData.downPayment = (numValue * downPaymentPercentage) / 100
      }
      
      return newData
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const downPaymentPercentage = ((formData.downPayment / formData.propertyPrice) * 100).toFixed(1)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
        <h3 className="text-xl font-bold text-gray-900">Mortgage Calculator</h3>
      </div>

      {/* Current Rates Display */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg">
        <h4 className="font-semibold text-primary-900 mb-3">Current Kenya Interest Rates</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Prime Rate:</span>
            <span className="block font-bold text-primary-600">{currentRates.prime.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Commercial:</span>
            <span className="block font-bold text-primary-600">{currentRates.commercial.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">SACCO:</span>
            <span className="block font-bold text-primary-600">{currentRates.sacco.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Mortgage:</span>
            <span className="block font-bold text-primary-600">{currentRates.mortgage.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Price (KES)
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={formData.propertyPrice}
                onChange={(e) => handleInputChange('propertyPrice', e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="45,000,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Down Payment (KES) - {downPaymentPercentage}%
            </label>
            <input
              type="number"
              value={formData.downPayment}
              onChange={(e) => handleInputChange('downPayment', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="4,500,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Term (Years)
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.loanTerm}
                onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={15}>15 years</option>
                <option value={20}>20 years</option>
                <option value={25}>25 years</option>
                <option value={30}>30 years</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Insurance (KES)
            </label>
            <input
              type="number"
              value={formData.insurance}
              onChange={(e) => handleInputChange('insurance', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="50,000"
            />
          </div>
        </div>

        {/* Results Display */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl"
          >
            <h4 className="text-lg font-bold text-primary-900 mb-4">Monthly Payment</h4>
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {formatCurrency(results.monthlyPayment)}
            </div>
            <div className="text-sm text-primary-700">
              Principal & Interest: {formatCurrency(results.monthlyBreakdown.principal)}
            </div>
            {results.monthlyBreakdown.insurance > 0 && (
              <div className="text-sm text-primary-700">
                Insurance: {formatCurrency(results.monthlyBreakdown.insurance)}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Loan</div>
              <div className="font-bold text-gray-900">
                {formatCurrency(results.totalLoanAmount)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Interest</div>
              <div className="font-bold text-gray-900">
                {formatCurrency(results.totalInterest)}
              </div>
            </div>
          </div>

          {/* Affordability Analysis */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center mb-2">
              <InformationCircleIcon className="h-5 w-5 text-amber-600 mr-2" />
              <h5 className="font-semibold text-amber-800">Affordability Analysis</h5>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700">Recommended Income:</span>
                <span className="font-medium text-amber-800">
                  {formatCurrency(results.affordabilityAnalysis.recommendedIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Debt-to-Income:</span>
                <span className="font-medium text-amber-800">
                  {results.affordabilityAnalysis.debtToIncomeRatio?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Kenyan Banking Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2">Kenya Mortgage Info</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Minimum down payment: 10-20%</li>
              <li>• Maximum loan term: 25-30 years</li>
              <li>• Processing fee: 1-2% of loan amount</li>
              <li>• Valuation fee: KES 15,000-30,000</li>
              <li>• Legal fees: 1-1.5% of property value</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MortgageCalculator