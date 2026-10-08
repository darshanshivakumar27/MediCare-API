import React, { useState, useEffect } from 'react';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../api/patients';
import { extractErrorMessage } from '../api/axios';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const initialFormData = {
  name: '',
  date_of_birth: '',
  gender: 'MALE',
  contact_number: '',
  email: '',
  address: '',
  medical_history: '',
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [currentPatient, setCurrentPatient] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchPatientsList = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const data = await getPatients();
      setPatients(data || []);
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to retrieve patient records.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  const showSuccess = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData(initialFormData);
    setFormError('');
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (patient) => {
    setCurrentPatient(patient);
    setFormData({
      name: patient.name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'MALE',
      contact_number: patient.contact_number || '',
      email: patient.email || '',
      address: patient.address || '',
      medical_history: patient.medical_history || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  // Open View Modal
  const openViewModal = (patient) => {
    setCurrentPatient(patient);
    setIsViewOpen(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (patient) => {
    setCurrentPatient(patient);
    setIsDeleteOpen(true);
  };

  // Handle Create Patient
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Patient name is required (minimum 2 characters).');
      return;
    }
    if (!formData.date_of_birth) {
      setFormError('Date of birth is required.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setFormError('Contact number is required.');
      return;
    }

    setActionLoading(true);
    try {
      await createPatient(formData);
      setIsAddOpen(false);
      showSuccess(`Patient "${formData.name}" added successfully.`);
      fetchPatientsList();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not create patient record.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Patient
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Patient name is required (minimum 2 characters).');
      return;
    }
    if (!formData.date_of_birth) {
      setFormError('Date of birth is required.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setFormError('Contact number is required.');
      return;
    }

    setActionLoading(true);
    try {
      await updatePatient(currentPatient.id, formData);
      setIsEditOpen(false);
      showSuccess(`Patient record for "${formData.name}" updated successfully.`);
      fetchPatientsList();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not update patient record.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Patient
  const handleDeleteConfirm = async () => {
    if (!currentPatient) return;
    setActionLoading(true);
    try {
      await deletePatient(currentPatient.id);
      setIsDeleteOpen(false);
      showSuccess(`Patient "${currentPatient.name}" deleted successfully.`);
      fetchPatientsList();
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to delete patient.'));
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">Patient Records</h2>
          <p className="page-subheading">
            Manage your patient demographics, medical history, and contact details.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Patient</span>
        </button>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="alert alert-success" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="alert alert-danger" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorBanner}</span>
          <button type="button" className="btn-retry" onClick={fetchPatientsList}>
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading message="Loading patient records..." />
      ) : patients.length === 0 ? (
        <div className="empty-state-box full-card">
          <div className="empty-icon">👥</div>
          <h3 className="empty-title">No patients found.</h3>
          <p className="empty-desc">
            Add your first patient to begin tracking their medical profiles and doctor assignments.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
          >
            + Add First Patient
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((pt) => (
                  <tr key={pt.id}>
                    <td>
                      <div className="cell-name-box">
                        <span className="cell-avatar">{pt.name.charAt(0)}</span>
                        <div>
                          <span className="cell-title">{pt.name}</span>
                          <span className="cell-subtitle">ID #{pt.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="cell-date">{pt.date_of_birth}</td>
                    <td>
                      <span className={`gender-badge gender-${pt.gender.toLowerCase()}`}>
                        {pt.gender}
                      </span>
                    </td>
                    <td className="cell-contact">{pt.contact_number}</td>
                    <td className="cell-email">{pt.email || '—'}</td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-action btn-view"
                        onClick={() => openViewModal(pt)}
                        title="View details"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => openEditModal(pt)}
                        title="Edit patient"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => openDeleteModal(pt)}
                        title="Delete patient"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {patients.length} patient record(s)</span>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !actionLoading && setIsAddOpen(false)}
        title="Add New Patient"
        maxWidth="620px"
      >
        {formError && (
          <div className="alert alert-danger" role="alert">
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-name">
                Full Name <span className="text-required">*</span>
              </label>
              <input
                id="add-name"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-dob">
                Date of Birth <span className="text-required">*</span>
              </label>
              <input
                id="add-dob"
                name="date_of_birth"
                type="date"
                className="form-control"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-gender">
                Gender <span className="text-required">*</span>
              </label>
              <select
                id="add-gender"
                name="gender"
                className="form-control"
                value={formData.gender}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-contact">
                Contact Number <span className="text-required">*</span>
              </label>
              <input
                id="add-contact"
                name="contact_number"
                type="text"
                className="form-control"
                placeholder="+919876543210"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-email">
              Email Address (Optional)
            </label>
            <input
              id="add-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-address">
              Residential Address (Optional)
            </label>
            <textarea
              id="add-address"
              name="address"
              rows="2"
              className="form-control"
              placeholder="Flat 402, Green Avenue, City"
              value={formData.address}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-history">
              Medical History (Optional)
            </label>
            <textarea
              id="add-history"
              name="medical_history"
              rows="2"
              className="form-control"
              placeholder="Allergies, chronic conditions, prior surgeries..."
              value={formData.medical_history}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsAddOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !actionLoading && setIsEditOpen(false)}
        title={`Edit Patient: ${currentPatient?.name || ''}`}
        maxWidth="620px"
      >
        {formError && (
          <div className="alert alert-danger" role="alert">
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-name">
                Full Name <span className="text-required">*</span>
              </label>
              <input
                id="edit-name"
                name="name"
                type="text"
                className="form-control"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-dob">
                Date of Birth <span className="text-required">*</span>
              </label>
              <input
                id="edit-dob"
                name="date_of_birth"
                type="date"
                className="form-control"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-gender">
                Gender <span className="text-required">*</span>
              </label>
              <select
                id="edit-gender"
                name="gender"
                className="form-control"
                value={formData.gender}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-contact">
                Contact Number <span className="text-required">*</span>
              </label>
              <input
                id="edit-contact"
                name="contact_number"
                type="text"
                className="form-control"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">
              Email Address (Optional)
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-address">
              Residential Address (Optional)
            </label>
            <textarea
              id="edit-address"
              name="address"
              rows="2"
              className="form-control"
              value={formData.address}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-history">
              Medical History (Optional)
            </label>
            <textarea
              id="edit-history"
              name="medical_history"
              rows="2"
              className="form-control"
              value={formData.medical_history}
              onChange={handleInputChange}
              disabled={actionLoading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Patient Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Patient Details"
        maxWidth="540px"
      >
        {currentPatient && (
          <div className="detail-view">
            <div className="detail-header-card">
              <div className="detail-avatar">
                {currentPatient.name.charAt(0)}
              </div>
              <div>
                <h3 className="detail-title">{currentPatient.name}</h3>
                <span className={`gender-badge gender-${currentPatient.gender.toLowerCase()}`}>
                  {currentPatient.gender}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Record ID</span>
                <span className="detail-val">#{currentPatient.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-val">{currentPatient.date_of_birth}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contact</span>
                <span className="detail-val">{currentPatient.contact_number}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-val">{currentPatient.email || 'None'}</span>
              </div>
              <div className="detail-item span-2">
                <span className="detail-label">Address</span>
                <span className="detail-val">{currentPatient.address || 'None provided'}</span>
              </div>
              <div className="detail-item span-2">
                <span className="detail-label">Medical History</span>
                <span className="detail-val">{currentPatient.medical_history || 'No recorded history'}</span>
              </div>
              <div className="detail-item span-2">
                <span className="detail-label">Managed By</span>
                <span className="detail-val text-muted">{currentPatient.created_by}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsViewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Patient Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !actionLoading && setIsDeleteOpen(false)}
        title="Confirm Patient Deletion"
        maxWidth="460px"
      >
        <div className="confirm-delete-box">
          <div className="confirm-delete-icon">⚠️</div>
          <p className="confirm-delete-message">
            Are you sure you want to delete patient <strong>{currentPatient?.name}</strong>?
          </p>
          <p className="confirm-delete-subtext">
            This action cannot be undone. All clinical mappings associated with this patient will also be removed.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsDeleteOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Patient'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Patients;
