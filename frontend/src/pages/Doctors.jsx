import React, { useState, useEffect } from 'react';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../api/doctors';
import { extractErrorMessage } from '../api/axios';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const initialFormData = {
  name: '',
  specialization: '',
  contact_number: '',
  email: '',
  years_of_experience: 0,
  is_active: true,
};

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
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

  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchDoctorsList = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const data = await getDoctors();
      setDoctors(data || []);
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to retrieve doctor directory.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorsList();
  }, []);

  const showSuccess = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formError) setFormError('');
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData(initialFormData);
    setFormError('');
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (doctor) => {
    setCurrentDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      contact_number: doctor.contact_number || '',
      email: doctor.email || '',
      years_of_experience: doctor.years_of_experience ?? 0,
      is_active: doctor.is_active ?? true,
    });
    setFormError('');
    setIsEditOpen(true);
  };

  // Open View Modal
  const openViewModal = (doctor) => {
    setCurrentDoctor(doctor);
    setIsViewOpen(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (doctor) => {
    setCurrentDoctor(doctor);
    setIsDeleteOpen(true);
  };

  // Handle Create Doctor
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Doctor name is required (minimum 2 characters).');
      return;
    }
    if (!formData.specialization.trim()) {
      setFormError('Medical specialization is required.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setFormError('Contact number is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Professional email address is required.');
      return;
    }
    if (Number(formData.years_of_experience) < 0) {
      setFormError('Years of experience cannot be negative.');
      return;
    }

    setActionLoading(true);
    try {
      await createDoctor(formData);
      setIsAddOpen(false);
      showSuccess(`Dr. "${formData.name}" added to directory.`);
      fetchDoctorsList();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not create doctor profile.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Doctor
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Doctor name is required (minimum 2 characters).');
      return;
    }
    if (!formData.specialization.trim()) {
      setFormError('Specialization is required.');
      return;
    }
    if (!formData.contact_number.trim()) {
      setFormError('Contact number is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (Number(formData.years_of_experience) < 0) {
      setFormError('Years of experience cannot be negative.');
      return;
    }

    setActionLoading(true);
    try {
      await updateDoctor(currentDoctor.id, formData);
      setIsEditOpen(false);
      showSuccess(`Dr. "${formData.name}" updated successfully.`);
      fetchDoctorsList();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not update doctor profile.'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Doctor
  const handleDeleteConfirm = async () => {
    if (!currentDoctor) return;
    setActionLoading(true);
    try {
      await deleteDoctor(currentDoctor.id);
      setIsDeleteOpen(false);
      showSuccess(`Dr. "${currentDoctor.name}" removed from directory.`);
      fetchDoctorsList();
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to delete doctor.'));
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
          <h2 className="page-heading">Doctor Directory</h2>
          <p className="page-subheading">
            Browse registered medical practitioners, specialties, and active assignments.
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
          <span>Add Doctor</span>
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
          <button type="button" className="btn-retry" onClick={fetchDoctorsList}>
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading message="Loading doctor directory..." />
      ) : doctors.length === 0 ? (
        <div className="empty-state-box full-card">
          <div className="empty-icon">🩺</div>
          <h3 className="empty-title">No doctors found.</h3>
          <p className="empty-desc">
            Add a doctor to get started with patient-specialist allocations.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
          >
            + Add First Doctor
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="cell-name-box">
                        <span className="cell-avatar cell-avatar-doc">Dr</span>
                        <div>
                          <span className="cell-title">{doc.name}</span>
                          <span className="cell-subtitle">ID #{doc.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="specialty-badge">
                        {doc.specialization}
                      </span>
                    </td>
                    <td className="cell-contact">{doc.contact_number}</td>
                    <td className="cell-email">{doc.email}</td>
                    <td>
                      <span className="exp-badge">
                        {doc.years_of_experience} {doc.years_of_experience === 1 ? 'yr' : 'yrs'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${doc.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {doc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-action btn-view"
                        onClick={() => openViewModal(doc)}
                        title="View details"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => openEditModal(doc)}
                        title="Edit doctor"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => openDeleteModal(doc)}
                        title="Delete doctor"
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
            <span>Showing {doctors.length} doctor profile(s)</span>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !actionLoading && setIsAddOpen(false)}
        title="Add New Doctor"
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
              <label className="form-label" htmlFor="add-doc-name">
                Doctor Name <span className="text-required">*</span>
              </label>
              <input
                id="add-doc-name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Dr. Sarah Wilson"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-doc-specialty">
                Specialization <span className="text-required">*</span>
              </label>
              <input
                id="add-doc-specialty"
                name="specialization"
                type="text"
                className="form-control"
                placeholder="Cardiology"
                value={formData.specialization}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-doc-contact">
                Contact Number <span className="text-required">*</span>
              </label>
              <input
                id="add-doc-contact"
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
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-doc-email">
                Professional Email <span className="text-required">*</span>
              </label>
              <input
                id="add-doc-email"
                name="email"
                type="email"
                className="form-control"
                placeholder="sarah.wilson@hospital.org"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="add-doc-exp">
                Years of Experience <span className="text-required">*</span>
              </label>
              <input
                id="add-doc-exp"
                name="years_of_experience"
                type="number"
                min="0"
                max="70"
                className="form-control"
                value={formData.years_of_experience}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1 flex-center-bottom">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  disabled={actionLoading}
                />
                <span>Active in Practice</span>
              </label>
            </div>
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
              {actionLoading ? 'Saving...' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !actionLoading && setIsEditOpen(false)}
        title={`Edit Doctor: ${currentDoctor?.name || ''}`}
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
              <label className="form-label" htmlFor="edit-doc-name">
                Doctor Name <span className="text-required">*</span>
              </label>
              <input
                id="edit-doc-name"
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
              <label className="form-label" htmlFor="edit-doc-specialty">
                Specialization <span className="text-required">*</span>
              </label>
              <input
                id="edit-doc-specialty"
                name="specialization"
                type="text"
                className="form-control"
                value={formData.specialization}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-doc-contact">
                Contact Number <span className="text-required">*</span>
              </label>
              <input
                id="edit-doc-contact"
                name="contact_number"
                type="text"
                className="form-control"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-doc-email">
                Professional Email <span className="text-required">*</span>
              </label>
              <input
                id="edit-doc-email"
                name="email"
                type="email"
                className="form-control"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="edit-doc-exp">
                Years of Experience <span className="text-required">*</span>
              </label>
              <input
                id="edit-doc-exp"
                name="years_of_experience"
                type="number"
                min="0"
                max="70"
                className="form-control"
                value={formData.years_of_experience}
                onChange={handleInputChange}
                required
                disabled={actionLoading}
              />
            </div>
            <div className="form-group flex-1 flex-center-bottom">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  disabled={actionLoading}
                />
                <span>Active in Practice</span>
              </label>
            </div>
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
              {actionLoading ? 'Saving...' : 'Update Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Doctor Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Doctor Profile"
        maxWidth="540px"
      >
        {currentDoctor && (
          <div className="detail-view">
            <div className="detail-header-card">
              <div className="detail-avatar detail-avatar-doc">
                Dr
              </div>
              <div>
                <h3 className="detail-title">{currentDoctor.name}</h3>
                <span className="specialty-badge">
                  {currentDoctor.specialization}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Registry ID</span>
                <span className="detail-val">#{currentDoctor.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Practice Status</span>
                <span className={`status-badge ${currentDoctor.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {currentDoctor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience</span>
                <span className="detail-val">{currentDoctor.years_of_experience} Years</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contact</span>
                <span className="detail-val">{currentDoctor.contact_number}</span>
              </div>
              <div className="detail-item span-2">
                <span className="detail-label">Email</span>
                <span className="detail-val">{currentDoctor.email}</span>
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

      {/* Delete Doctor Confirmation Modal with Cascade Warning */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !actionLoading && setIsDeleteOpen(false)}
        title="Confirm Doctor Deletion"
        maxWidth="480px"
      >
        <div className="confirm-delete-box">
          <div className="confirm-delete-icon">⚠️</div>
          <p className="confirm-delete-message">
            Are you sure you want to delete <strong>{currentDoctor?.name}</strong>?
          </p>
          <div className="cascade-warning-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Deleting this doctor may remove their patient assignments due to backend cascade rules. Continue?
            </span>
          </div>

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
              type="submit"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Doctor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Doctors;
