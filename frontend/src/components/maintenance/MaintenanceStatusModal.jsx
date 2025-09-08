// frontend/src/components/maintenance/MaintenanceStatusModal.jsx
import { useState } from 'react';
import { X, Clock, Wrench, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const MaintenanceStatusModal = ({ isOpen, onClose, maintenanceRequest, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(maintenanceRequest?.status || 'pending');
  const [notes, setNotes] = useState('');
  const [actualCost, setActualCost] = useState(maintenanceRequest?.actualCost || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
    { value: 'in_progress', label: 'In Progress', icon: Wrench, color: 'blue' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
  ];

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return Clock;
    return statusOption.icon;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return 'gray';
    return statusOption.color;
  };

  const getStatusBadge = (status) => {
    const Icon = getStatusIcon(status);
    const color = getStatusColor(status);
    
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusOptions.find(option => option.value === status)?.label || status}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData = {
        status: newStatus,
        ...(notes && { notes }),
        ...(actualCost && { actualCost: parseFloat(actualCost) }),
        ...(newStatus === 'completed' && { completionDate: new Date() })
      };

      await onStatusUpdate(maintenanceRequest._id, updateData);
      onClose();
    } catch (err) {
      console.error('Error updating maintenance status:', err);
      setError('Failed to update maintenance status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewStatus(maintenanceRequest?.status || 'pending');
    setNotes('');
    setError('');
    onClose();
  };

  if (!isOpen || !maintenanceRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Update Status
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Request Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {maintenanceRequest.issue}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {maintenanceRequest.description}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {maintenanceRequest.property?.name} - Unit {maintenanceRequest.unit?.unitNumber}
              </span>
              <span className="text-gray-500 dark:text-gray-400">Current Status:</span>
              {getStatusBadge(maintenanceRequest.status)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        newStatus === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={newStatus === option.value}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="sr-only"
                      />
                      <Icon className={`h-4 w-4 mr-2 ${
                        newStatus === option.value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm ${
                        newStatus === option.value 
                          ? 'text-blue-900 dark:text-blue-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actual Cost (for completed status) */}
            {newStatus === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="Enter actual cost"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Estimated Cost: KES {(maintenanceRequest.estimatedCost || 0).toLocaleString()}
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes {newStatus !== maintenanceRequest.status ? '*' : '(Optional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this status change..."
                required={newStatus !== maintenanceRequest.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {newStatus !== maintenanceRequest.status && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Please provide a reason for the status change
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (newStatus !== maintenanceRequest.status && !notes.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceStatusModal;