// frontend/src/services/maintenanceService.js
import api from "./api";

const maintenanceService = {
  // Get all maintenance requests
  async getMaintenanceRequests(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters if provided
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.unitId) params.append('unitId', filters.unitId);
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      
      const queryString = params.toString();
      const url = queryString ? `/maintenance?${queryString}` : '/maintenance';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      throw error;
    }
  },

  // Get maintenance request by ID
  async getMaintenanceRequestById(id) {
    try {
      const response = await api.get(`/maintenance/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance request:", error);
      throw error;
    }
  },

  // Create new maintenance request
  async createMaintenanceRequest(maintenanceData) {
    try {
      const response = await api.post("/maintenance", maintenanceData);
      return response.data;
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      throw error;
    }
  },

  // Update maintenance request
  async updateMaintenanceRequest(id, updateData) {
    try {
      const response = await api.put(`/maintenance/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating maintenance request:", error);
      throw error;
    }
  },

  // Update maintenance request status
  async updateMaintenanceStatus(id, status, notes = '') {
    try {
      const response = await api.put(`/maintenance/${id}`, { 
        status,
        ...(notes && { notes: [{ content: notes, createdBy: 'System' }] })
      });
      return response.data;
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      throw error;
    }
  },

  // Add note to maintenance request
  async addNoteToMaintenanceRequest(id, note) {
    try {
      const response = await api.post(`/maintenance/${id}/notes`, {
        content: note.content,
        createdBy: note.createdBy || 'User'
      });
      return response.data;
    } catch (error) {
      console.error("Error adding note to maintenance request:", error);
      throw error;
    }
  },

  // Get maintenance requests by property
  async getMaintenanceByProperty(propertyId) {
    try {
      const response = await api.get(`/maintenance/property/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance by property:", error);
      throw error;
    }
  },

  // Get maintenance requests by unit
  async getMaintenanceByUnit(unitId) {
    try {
      const response = await api.get(`/maintenance/unit/${unitId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance by unit:", error);
      throw error;
    }
  },

  // Get maintenance requests by tenant
  async getMaintenanceByTenant(tenantId) {
    try {
      const response = await api.get(`/maintenance/tenant/${tenantId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance by tenant:", error);
      throw error;
    }
  },

  // Get maintenance statistics
  async getMaintenanceStats() {
    try {
      const response = await api.get("/maintenance/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance stats:", error);
      throw error;
    }
  },

  // Delete maintenance request (if needed)
  async deleteMaintenanceRequest(id) {
    try {
      const response = await api.delete(`/maintenance/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting maintenance request:", error);
      throw error;
    }
  },

  // Upload maintenance images (if implementing file upload)
  async uploadMaintenanceImages(id, formData) {
    try {
      const response = await api.post(`/maintenance/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading maintenance images:", error);
      throw error;
    }
  }
};

export default maintenanceService;