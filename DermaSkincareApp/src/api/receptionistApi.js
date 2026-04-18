// src/api/receptionistApi.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Get receptionist dashboard data including today's appointments and stats
 * @param {number} receptionistId - The receptionist's ID
 * @returns {Promise<Object>} Dashboard data
 */
export const getReceptionistDashboard = async (receptionistId) => {
  try {
    console.log('[ReceptionistAPI] Fetching dashboard for receptionist:', receptionistId);
    const response = await axios.get(`${API_BASE_URL}/receptionists/${receptionistId}/dashboard/`);
    console.log('[ReceptionistAPI] Dashboard response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching dashboard:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch dashboard data'
    };
  }
};

/**
 * Get all appointments with optional filters
 * @param {Object} params - Query parameters (date, status, etc.)
 * @returns {Promise<Object>} List of appointments
 */
export const getAppointments = async (params = {}) => {
  try {
    console.log('[ReceptionistAPI] Fetching appointments with params:', params);
    const response = await axios.get(`${API_BASE_URL}/appointments/`, { params });
    console.log('[ReceptionistAPI] Appointments response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching appointments:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch appointments'
    };
  }
};

/**
 * Get today's appointments
 * @returns {Promise<Object>} Today's appointments
 */
export const getTodaysAppointments = async () => {
  const today = new Date().toISOString().split('T')[0];
  return getAppointments({ date: today });
};

/**
 * Update appointment status
 * @param {number} appointmentId - The appointment ID
 * @param {string} status - New status (booked, checked_in, completed, cancelled)
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    console.log('[ReceptionistAPI] Updating appointment status:', appointmentId, status);
    const response = await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      status
    });
    console.log('[ReceptionistAPI] Update response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error updating appointment:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update appointment'
    };
  }
};

/**
 * Get all patients
 * @returns {Promise<Object>} List of patients
 */
export const getPatients = async () => {
  try {
    console.log('[ReceptionistAPI] Fetching patients');
    const response = await axios.get(`${API_BASE_URL}/patients/`);
    console.log('[ReceptionistAPI] Patients response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching patients:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch patients'
    };
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise<Object>} Created patient
 */
export const createPatient = async (patientData) => {
  try {
    console.log('[ReceptionistAPI] Creating patient:', patientData);
    const response = await axios.post(`${API_BASE_URL}/patients/`, patientData);
    console.log('[ReceptionistAPI] Create patient response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error creating patient:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create patient'
    };
  }
};

/**
 * Get a specific patient by ID
 * @param {number} patientId - The patient ID
 * @returns {Promise<Object>} Patient data
 */
export const getPatient = async (patientId) => {
  try {
    console.log('[ReceptionistAPI] Fetching patient:', patientId);
    const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/`);
    console.log('[ReceptionistAPI] Patient response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching patient:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch patient'
    };
  }
};

/**
 * Update a patient
 * @param {number} patientId - The patient ID
 * @param {Object} patientData - Updated patient data
 * @returns {Promise<Object>} Updated patient
 */
export const updatePatient = async (patientId, patientData) => {
  try {
    console.log('[ReceptionistAPI] Updating patient:', patientId);
    console.log('[ReceptionistAPI] Update data:', JSON.stringify(patientData));
    console.log('[ReceptionistAPI] URL:', `${API_BASE_URL}/patients/${patientId}/`);
    
    const response = await axios.patch(`${API_BASE_URL}/patients/${patientId}/`, patientData);
    console.log('[ReceptionistAPI] Update patient response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error updating patient:', error);
    console.error('[ReceptionistAPI] Error response:', error.response?.data);
    console.error('[ReceptionistAPI] Error status:', error.response?.status);
    
    // Get more detailed error message
    let errorMessage = 'Failed to update patient';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else {
        // Handle field-specific errors
        const fieldErrors = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Delete a patient
 * @param {number} patientId - The patient ID
 * @returns {Promise<Object>} Success status
 */
export const deletePatient = async (patientId) => {
  try {
    console.log('[ReceptionistAPI] Deleting patient:', patientId);
    await axios.delete(`${API_BASE_URL}/patients/${patientId}/`);
    console.log('[ReceptionistAPI] Patient deleted successfully');
    return {
      success: true
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error deleting patient:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete patient'
    };
  }
};

/**
 * Get all doctors
 * @returns {Promise<Object>} List of doctors
 */
export const getDoctors = async () => {
  try {
    console.log('[ReceptionistAPI] Fetching doctors');
    const response = await axios.get(`${API_BASE_URL}/doctors/`);
    console.log('[ReceptionistAPI] Doctors response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching doctors:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch doctors'
    };
  }
};

/**
 * Create doctor account
 * @param {Object} doctorData
 * @returns {Promise<Object>}
 */
export const createDoctor = async (doctorData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/doctors/`, doctorData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create doctor account'
    };
  }
};

/**
 * Delete doctor account
 * @param {number} doctorId
 * @returns {Promise<Object>}
 */
export const deleteDoctor = async (doctorId) => {
  try {
    await axios.delete(`${API_BASE_URL}/doctors/${doctorId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete doctor account'
    };
  }
};

/**
 * Get all receptionists
 * @returns {Promise<Object>}
 */
export const getReceptionists = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/receptionists/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch receptionist accounts'
    };
  }
};

/**
 * Create receptionist account
 * @param {Object} receptionistData
 * @returns {Promise<Object>}
 */
export const createReceptionist = async (receptionistData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/receptionists/`, receptionistData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create receptionist account'
    };
  }
};

/**
 * Delete receptionist account
 * @param {number} receptionistId
 * @returns {Promise<Object>}
 */
export const deleteReceptionist = async (receptionistId) => {
  try {
    await axios.delete(`${API_BASE_URL}/receptionists/${receptionistId}/`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete receptionist account'
    };
  }
};

/**
 * Ensure one admin receptionist exists (set current one if none)
 * @param {number} receptionistId
 * @returns {Promise<Object>}
 */
export const ensureReceptionistAdmin = async (receptionistId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/receptionists/ensure_admin/`, {
      receptionist_id: receptionistId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to ensure admin receptionist'
    };
  }
};

/**
 * Get clinic schedules
 * @returns {Promise<Object>}
 */
export const getClinicSchedules = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clinic-schedules/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch clinic schedules'
    };
  }
};

/**
 * Upsert clinic schedule for default or doctor
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const upsertClinicSchedule = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/clinic-schedules/upsert/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to save clinic schedule'
    };
  }
};

/**
 * Get resolved schedule for a doctor (fallbacks to default schedule)
 * @param {number | null} doctorId
 * @returns {Promise<Object>}
 */
export const getResolvedClinicSchedule = async (doctorId = null) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clinic-schedules/resolved/`, {
      params: doctorId ? { doctor: doctorId } : {},
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch resolved clinic schedule'
    };
  }
};

/**
 * Get all services
 * @returns {Promise<Object>} List of services
 */
export const getServices = async () => {
  try {
    console.log('[ReceptionistAPI] Fetching services');
    const response = await axios.get(`${API_BASE_URL}/services/`);
    console.log('[ReceptionistAPI] Services response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching services:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch services'
    };
  }
};

// ==================== INSURANCE COMPANY API FUNCTIONS ====================

/**
 * Get all insurance companies
 * @returns {Promise<Object>} List of insurance companies
 */
export const getInsuranceCompanies = async () => {
  try {
    console.log('[ReceptionistAPI] Fetching insurance companies');
    const response = await axios.get(`${API_BASE_URL}/insurance-companies/`);
    console.log('[ReceptionistAPI] Insurance companies response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching insurance companies:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch insurance companies'
    };
  }
};

/**
 * Create a new insurance company
 * @param {Object} companyData - Company data
 * @returns {Promise<Object>} Created company
 */
export const createInsuranceCompany = async (companyData) => {
  try {
    console.log('[ReceptionistAPI] Creating insurance company:', companyData);
    const response = await axios.post(`${API_BASE_URL}/insurance-companies/`, companyData);
    console.log('[ReceptionistAPI] Create insurance company response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error creating insurance company:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create insurance company'
    };
  }
};

/**
 * Update an insurance company
 * @param {number} companyId - Company ID
 * @param {Object} companyData - Updated data
 * @returns {Promise<Object>} Updated company
 */
export const updateInsuranceCompany = async (companyId, companyData) => {
  try {
    console.log('[ReceptionistAPI] Updating insurance company:', companyId);
    const response = await axios.patch(`${API_BASE_URL}/insurance-companies/${companyId}/`, companyData);
    console.log('[ReceptionistAPI] Update insurance company response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error updating insurance company:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update insurance company'
    };
  }
};

/**
 * Delete an insurance company
 * @param {number} companyId - Company ID
 * @returns {Promise<Object>} Success status
 */
export const deleteInsuranceCompany = async (companyId) => {
  try {
    console.log('[ReceptionistAPI] Deleting insurance company:', companyId);
    await axios.delete(`${API_BASE_URL}/insurance-companies/${companyId}/`);
    console.log('[ReceptionistAPI] Insurance company deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[ReceptionistAPI] Error deleting insurance company:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete insurance company'
    };
  }
};

// ==================== INVOICE API FUNCTIONS ====================

/**
 * Get all invoices
 * @returns {Promise<Object>} List of invoices
 */
export const getInvoices = async () => {
  try {
    console.log('[ReceptionistAPI] Fetching invoices');
    const response = await axios.get(`${API_BASE_URL}/invoices/`);
    console.log('[ReceptionistAPI] Invoices response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching invoices:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch invoices'
    };
  }
};

/**
 * Get a specific invoice by ID
 * @param {number} invoiceId - The invoice ID
 * @returns {Promise<Object>} Invoice data
 */
export const getInvoice = async (invoiceId) => {
  try {
    console.log('[ReceptionistAPI] Fetching invoice:', invoiceId);
    const response = await axios.get(`${API_BASE_URL}/invoices/${invoiceId}/`);
    console.log('[ReceptionistAPI] Invoice response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error fetching invoice:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch invoice'
    };
  }
};

/**
 * Create a new invoice
 * @param {Object} invoiceData - Invoice data including items
 * @returns {Promise<Object>} Created invoice
 */
export const createInvoice = async (invoiceData) => {
  try {
    console.log('[ReceptionistAPI] Creating invoice:', invoiceData);
    const response = await axios.post(`${API_BASE_URL}/invoices/`, invoiceData);
    console.log('[ReceptionistAPI] Create invoice response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error creating invoice:', error);
    console.error('[ReceptionistAPI] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create invoice'
    };
  }
};

/**
 * Update an existing invoice
 * @param {number} invoiceId - The invoice ID
 * @param {Object} invoiceData - Updated invoice data
 * @returns {Promise<Object>} Updated invoice
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    console.log('[ReceptionistAPI] Updating invoice:', invoiceId, invoiceData);
    const response = await axios.patch(`${API_BASE_URL}/invoices/${invoiceId}/`, invoiceData);
    console.log('[ReceptionistAPI] Update invoice response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error updating invoice:', error);
    console.error('[ReceptionistAPI] Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update invoice'
    };
  }
};

/**
 * Mark an invoice as paid
 * @param {number} invoiceId - The invoice ID
 * @param {string} paymentMethod - Payment method used
 * @returns {Promise<Object>} Response
 */
export const markInvoicePaid = async (invoiceId, paymentMethod) => {
  try {
    console.log('[ReceptionistAPI] Marking invoice as paid:', invoiceId);
    const response = await axios.post(`${API_BASE_URL}/invoices/${invoiceId}/mark_paid/`, {
      payment_method: paymentMethod
    });
    console.log('[ReceptionistAPI] Mark paid response:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error marking invoice as paid:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to mark invoice as paid'
    };
  }
};

/**
 * Delete an invoice
 * @param {number} invoiceId - The invoice ID
 * @returns {Promise<Object>} Response
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    console.log('[ReceptionistAPI] Deleting invoice:', invoiceId);
    await axios.delete(`${API_BASE_URL}/invoices/${invoiceId}/`);
    console.log('[ReceptionistAPI] Invoice deleted successfully');
    return {
      success: true
    };
  } catch (error) {
    console.error('[ReceptionistAPI] Error deleting invoice:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete invoice'
    };
  }
};
