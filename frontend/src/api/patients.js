import apiClient from './axios';

/**
 * Filter out system-managed read-only fields before submission.
 */
const cleanPatientPayload = (data) => {
  const {
    name,
    date_of_birth,
    gender,
    contact_number,
    email,
    address,
    medical_history,
  } = data;

  const payload = {
    name: name?.trim(),
    date_of_birth,
    gender,
    contact_number: contact_number?.trim(),
  };

  if (email !== undefined && email !== null) {
    payload.email = email.trim();
  }
  if (address !== undefined && address !== null) {
    payload.address = address.trim();
  }
  if (medical_history !== undefined && medical_history !== null) {
    payload.medical_history = medical_history.trim();
  }

  return payload;
};

export const getPatients = async () => {
  const response = await apiClient.get('/patients/');
  return response.data;
};

export const getPatient = async (id) => {
  const response = await apiClient.get(`/patients/${id}/`);
  return response.data;
};

export const createPatient = async (patientData) => {
  const payload = cleanPatientPayload(patientData);
  const response = await apiClient.post('/patients/', payload);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const payload = cleanPatientPayload(patientData);
  const response = await apiClient.put(`/patients/${id}/`, payload);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await apiClient.delete(`/patients/${id}/`);
  return response.data;
};
