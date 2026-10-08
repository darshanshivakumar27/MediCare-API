import apiClient from './axios';

/**
 * Filter out system-managed read-only fields before submission.
 */
const cleanDoctorPayload = (data) => {
  const {
    name,
    specialization,
    contact_number,
    email,
    years_of_experience,
    is_active,
  } = data;

  return {
    name: name?.trim(),
    specialization: specialization?.trim(),
    contact_number: contact_number?.trim(),
    email: email?.trim().toLowerCase(),
    years_of_experience: Number(years_of_experience),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
  };
};

export const getDoctors = async () => {
  const response = await apiClient.get('/doctors/');
  return response.data;
};

export const getDoctor = async (id) => {
  const response = await apiClient.get(`/doctors/${id}/`);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const payload = cleanDoctorPayload(doctorData);
  const response = await apiClient.post('/doctors/', payload);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const payload = cleanDoctorPayload(doctorData);
  const response = await apiClient.put(`/doctors/${id}/`, payload);
  return response.data;
};

export const deleteDoctor = async (id) => {
  const response = await apiClient.delete(`/doctors/${id}/`);
  return response.data;
};
