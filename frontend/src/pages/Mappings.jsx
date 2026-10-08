import React, { useState, useEffect } from 'react';
import { getMappings, createMapping, deleteMapping } from '../api/mappings';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import { extractErrorMessage } from '../api/axios';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const Mappings = () => {
  const [mappings, setMappings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [errorBanner, setErrorBanner] = useState('');
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [currentMapping, setCurrentMapping] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const fetchMappingsList = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const data = await getMappings();
      setMappings(data || []);
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to retrieve doctor-patient assignments.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappingsList();
  }, []);

  const showSuccess = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const openAssignModal = async () => {
    setFormError('');
    setSelectedPatientId('');
    setSelectedDoctorId('');
    setIsAssignOpen(true);
    setDropdownLoading(true);
    try {
      const [pts, docs] = await Promise.all([getPatients(), getDoctors()]);
      setPatients(pts || []);
      setDoctors(docs || []);
      if (pts?.length > 0) setSelectedPatientId(pts[0].id);
      if (docs?.length > 0) setSelectedDoctorId(docs[0].id);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not load patient or doctor options.'));
    } finally {
      setDropdownLoading(false);
    }
  };

  const openDeleteModal = (mapping) => {
    setCurrentMapping(mapping);
    setIsDeleteOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!selectedDoctorId) {
      setFormError('Please select a doctor.');
      return;
    }

    setActionLoading(true);
    try {
      await createMapping(selectedPatientId, selectedDoctorId);
      setIsAssignOpen(false);
      showSuccess('Doctor successfully assigned to patient.');
      fetchMappingsList();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to create assignment.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentMapping) return;
    setActionLoading(true);
    try {
      await deleteMapping(currentMapping.id);
      setIsDeleteOpen(false);
      showSuccess(`Assignment between "${currentMapping.patient_name}" and Dr. "${currentMapping.doctor_name}" removed.`);
      fetchMappingsList();
    } catch (err) {
      setErrorBanner(extractErrorMessage(err, 'Failed to delete assignment.'));
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-heading">Patient-Doctor Mappings</h2>
          <p className="page-subheading">
            Link patients under your care with medical specialists and care teams.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAssignModal}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Assign Doctor</span>
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
          <button type="button" className="btn-retry" onClick={fetchMappingsList}>
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading message="Loading assignment records..." />
      ) : mappings.length === 0 ? (
        <div className="empty-state-box full-card">
          <div className="empty-icon">🤝</div>
          <h3 className="empty-title">No doctor assignments yet.</h3>
          <p className="empty-desc">
            Assign a doctor to a patient to establish clinical coordination.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAssignModal}
          >
            + Assign Doctor to Patient
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Assigned Doctor</th>
                  <th>Specialization</th>
                  <th>Doctor Email</th>
                  <th>Assigned At</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="cell-name-box">
                        <span className="cell-avatar">{m.patient_name?.charAt(0)}</span>
                        <div>
                          <span className="cell-title">{m.patient_name}</span>
                          <span className="cell-subtitle">Patient ID #{m.patient}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-name-box">
                        <span className="cell-avatar cell-avatar-doc">Dr</span>
                        <div>
                          <span className="cell-title">{m.doctor_name}</span>
                          <span className="cell-subtitle">Doctor ID #{m.doctor}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="specialty-badge">
                        {m.doctor_specialization}
                      </span>
                    </td>
                    <td className="cell-email">{m.doctor_email}</td>
                    <td className="cell-date">
                      {m.assigned_at
                        ? new Date(m.assigned_at).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => openDeleteModal(m)}
                        title="Remove assignment"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {mappings.length} active assignment(s)</span>
          </div>
        </div>
      )}

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => !actionLoading && setIsAssignOpen(false)}
        title="Assign Doctor to Patient"
        maxWidth="540px"
      >
        {dropdownLoading ? (
          <Loading message="Loading patient & doctor records..." />
        ) : (
          <>
            {formError && (
              <div className="alert alert-danger" role="alert">
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleAssignSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="select-patient">
                  Select Patient <span className="text-required">*</span>
                </label>
                {patients.length === 0 ? (
                  <p className="text-warning">
                    No patients available. Please create a patient first.
                  </p>
                ) : (
                  <select
                    id="select-patient"
                    className="form-control"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    disabled={actionLoading}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (DOB: {p.date_of_birth}, Gender: {p.gender})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-doctor">
                  Select Doctor <span className="text-required">*</span>
                </label>
                {doctors.length === 0 ? (
                  <p className="text-warning">
                    No doctors available in directory. Please add a doctor first.
                  </p>
                ) : (
                  <select
                    id="select-doctor"
                    className="form-control"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    disabled={actionLoading}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} — {d.specialization} ({d.years_of_experience} yrs exp)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAssignOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    actionLoading ||
                    patients.length === 0 ||
                    doctors.length === 0
                  }
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Delete Mapping Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !actionLoading && setIsDeleteOpen(false)}
        title="Confirm Removal of Assignment"
        maxWidth="460px"
      >
        <div className="confirm-delete-box">
          <div className="confirm-delete-icon">⚠️</div>
          <p className="confirm-delete-message">
            Are you sure you want to remove the assignment between{' '}
            <strong>{currentMapping?.patient_name}</strong> and{' '}
            <strong>Dr. {currentMapping?.doctor_name}</strong>?
          </p>
          <p className="confirm-delete-subtext">
            This disassociates the specialist from this patient. Patient and doctor records will not be deleted.
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
              type="submit"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Removing...' : 'Remove Assignment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Mappings;
