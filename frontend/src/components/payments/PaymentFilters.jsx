// frontend/src/components/properties/payments/PaymentFilters.jsx
import React from "react";
import Card from "../ui/Card";

const PaymentFilters = ({
  filters,
  setFilters,
  tenants,
  resetFilters,
  applyFilters,
}) => {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            name="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="rent">Rent</option>
            <option value="deposit">Security Deposit</option>
            <option value="fee">Late Fee</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tenant
          </label>
          <select
            name="tenantId"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.tenantId}
            onChange={(e) =>
              setFilters({ ...filters, tenantId: e.target.value })
            }
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant._id} value={tenant._id}>
                {tenant.firstName} {tenant.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            From Date
          </label>
          <input
            type="date"
            name="startDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            To Date
          </label>
          <input
            type="date"
            name="endDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={resetFilters}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          onClick={applyFilters}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
        >
          Apply Filters
        </button>
      </div>
    </Card>
  );
};

export default PaymentFilters;
