import apiClient from './axios';

export const getMappings = async () => {
  const response = await apiClient.get('/mappings/');
  return response.data;
};

export const getPatientMappings = async (patientId) => {
  const response = await apiClient.get(`/mappings/${patientId}/`);
  return response.data;
};

export const createMapping = async (patientId, doctorId) => {
  const response = await apiClient.post('/mappings/', {
    patient: Number(patientId),
    doctor: Number(doctorId),
  });
  return response.data;
};

export const deleteMapping = async (id) => {
  const response = await apiClient.delete(`/mappings/${id}/`);
  return response.data;
};
