import axios from 'axios';

const BASE = 'http://localhost:8080/api';

const API = axios.create({ baseURL: BASE });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const verifyOTP = (data) => API.post('/auth/verify-otp', data);
export const loginUser = (data) => API.post('/auth/login', data);

export const getApplicants = () => API.get('/applicants');
export const addApplicant = (name) => API.post('/applicants', { name });
export const deleteApplicant = (applicantId) => API.delete(`/applicants/${applicantId}`);
export const addDocument = (applicantId, name) => API.post(`/applicants/${applicantId}/documents`, { name });
export const deleteDocument = (applicantId, docId) => API.delete(`/applicants/${applicantId}/documents/${docId}`);
export const removeDocumentFile = (applicantId, docId) => API.patch(`/applicants/${applicantId}/documents/${docId}/remove-file`);

export const uploadDocumentFile = (applicantId, docId, file, onProgress) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${BASE}/applicants/${applicantId}/documents/${docId}/upload`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};
