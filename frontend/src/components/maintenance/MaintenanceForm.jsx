// frontend/src/components/maintenance/MaintenanceForm.jsx
import { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import propertyService from '../../services/propertyService';
import unitService from '../../services/unitService';
import tenantService from '../../services/tenantService';

const MaintenanceForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    property: '',
    unit: '',
    tenant: '',
    issue: '',
    description: '',
    priority: 'medium',
    category: 'other',
    reportedBy: '',
    scheduledDate: '',
    estimatedCost: '',
    assignedTo: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadProperties();
      if (initialData) {
        setFormData({
          property: initialData.property?._id || '',
          unit: initialData.unit?._id || '',
          tenant: initialData.tenant?._id || '',
          issue: initialData.issue || '',
          description: initialData.description || '',
          priority: initialData.priority || 'medium',
          category: initialData.category || 'other',
          reportedBy: initialData.reportedBy || '',
          scheduledDate: initialData.scheduledDate ? new Date(initialData.scheduledDate).toISOString().split('T')[0] : '',
          estimatedCost: initialData.estimatedCost || '',
          assignedTo: initialData.assignedTo || '',
          notes: ''
        });
      }
    }
  }, [isOpen, initialData]);

  // Load properties
  const loadProperties = async () => {
    try {
      const response = await propertyService.getAllProperties();
      setProperties(response);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  // Load units when property changes
  useEffect(() => {
    if (formData.property) {
      loadUnits(formData.property);
      loadTenants(formData.property);
    } else {
      setUnits([]);
      setTenants([]);
    }
  }, [formData.property]);

  const loadUnits = async (propertyId) => {
    try {
      const response = await unitService.getUnits({ propertyId });
      setUnits(response);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const loadTenants = async (propertyId) => {
    try {
      const response = await tenantService.getTenantsByProperty(propertyId);
      setTenants(response);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.property) newErrors.property = 'Property is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.issue.trim()) newErrors.issue = 'Issue title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.reportedBy.trim()) newErrors.reportedBy = 'Reporter name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        scheduledDate: formData.scheduledDate || undefined
      };
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      setErrors({ submit: 'Failed to create maintenance request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      property: '',
      unit: '',
      tenant: '',
      issue: '',
      description: '',
      priority: 'medium',
      category: 'other',
      reportedBy: '',
      scheduledDate: '',
      estimatedCost: '',
      assignedTo: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Maintenance Request' : 'Create Maintenance Request'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {errors.submit}
            </div>
          )}

          {/* Property and Unit Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property *
              </label>
              <select
                name="property"
                value={formData.property}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.property ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.property && <p className="mt-1 text-sm text-red-600">{errors.property}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                disabled={!formData.property}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                } ${!formData.property ? 'bg-gray-100 dark:bg-gray-600' : ''}`}
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    Unit {unit.unitNumber}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
            </div>
          </div>

          {/* Tenant Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant (Optional)
            </label>
            <select
              name="tenant"
              value={formData.tenant}
              onChange={handleInputChange}
              disabled={!formData.property}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                !formData.property ? 'bg-gray-100 dark:bg-gray-600' : ''
              }`}
            >
              <option value="">Select Tenant (if applicable)</option>
              {tenants.map(tenant => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.firstName} {tenant.lastName} - Unit {tenant.unitId?.unitNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              name="issue"
              value={formData.issue}
              onChange={handleInputChange}
              placeholder="Brief description of the issue"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.issue ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.issue && <p className="mt-1 text-sm text-red-600">{errors.issue}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Detailed description of the maintenance issue"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="structural">Structural</option>
                <option value="appliance">Appliance</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Reported By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reported By *
            </label>
            <input
              type="text"
              name="reportedBy"
              value={formData.reportedBy}
              onChange={handleInputChange}
              placeholder="Name of the person reporting the issue"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.reportedBy ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reportedBy && <p className="mt-1 text-sm text-red-600">{errors.reportedBy}</p>}
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              placeholder="Name of assigned maintenance person/contractor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;