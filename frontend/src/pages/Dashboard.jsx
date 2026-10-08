import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatients } from '../api/patients';
import { getDoctors } from '../api/doctors';
import { getMappings } from '../api/mappings';
import { getCurrentUser } from '../api/auth';
import { extractErrorMessage } from '../api/axios';
import Loading from '../components/Loading';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [mappings, setMappings] = useState([]);

  const user = getCurrentUser();

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [patientsRes, doctorsRes, mappingsRes] = await Promise.all([
        getPatients(),
        getDoctors(),
        getMappings(),
      ]);
      setPatients(patientsRes || []);
      setDoctors(doctorsRes || []);
      setMappings(mappingsRes || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch dashboard metrics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalPatients = patients.length;
  const totalDoctors = doctors.length;
  const totalMappings = mappings.length;

  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  const recentMappings = [...mappings]
    .sort((a, b) => new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0))
    .slice(0, 5);

  if (loading) {
    return <Loading message="Loading clinical metrics and records..." />;
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2 className="welcome-title">Welcome back, {user?.name || 'Administrator'}</h2>
          <p className="welcome-desc">
            Healthcare Management overview &bull; Live clinical records and active doctor assignments.
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/patients" className="btn btn-primary btn-sm">
            + New Patient
          </Link>
          <Link to="/mappings" className="btn btn-outline btn-sm">
            + Assign Doctor
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" className="btn-retry" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue-subtle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Patients</span>
            <div className="metric-value-row">
              <span className="metric-number">{totalPatients}</span>
              <span className="metric-badge">User Scoped</span>
            </div>
            <span className="metric-subtext">Patients managed in your care</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-emerald-subtle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Doctors</span>
            <div className="metric-value-row">
              <span className="metric-number">{totalDoctors}</span>
              <span className="metric-badge badge-active">Directory</span>
            </div>
            <span className="metric-subtext">Available specialists in registry</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple-subtle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <line x1="8.59" y1="8.59" x2="15.42" y2="15.42" />
              <line x1="14" y1="7" x2="18" y2="7" />
              <line x1="18" y1="7" x2="18" y2="11" />
            </svg>
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Mappings</span>
            <div className="metric-value-row">
              <span className="metric-number">{totalMappings}</span>
              <span className="metric-badge badge-purple">Assignments</span>
            </div>
            <span className="metric-subtext">Active clinical pairings</span>
          </div>
        </div>
      </div>

      {/* Overview Panels Grid */}
      <div className="dashboard-grid">
        {/* Recent Patients */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Recent Patients</h3>
              <p className="panel-subtitle">Latest patients registered under your account</p>
            </div>
            <Link to="/patients" className="panel-header-link">
              View all ({totalPatients}) &rarr;
            </Link>
          </div>

          <div className="panel-body">
            {recentPatients.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">🧑‍⚕️</div>
                <h4 className="empty-title">No patients found.</h4>
                <p className="empty-desc">Add your first patient to start managing clinical records.</p>
                <Link to="/patients" className="btn btn-primary btn-sm">
                  + Add First Patient
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Gender</th>
                      <th>Contact</th>
                      <th>Date of Birth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((pt) => (
                      <tr key={pt.id}>
                        <td>
                          <div className="cell-name-box">
                            <span className="cell-avatar">{pt.name.charAt(0)}</span>
                            <div>
                              <span className="cell-title">{pt.name}</span>
                              <span className="cell-subtitle">{pt.email || 'No email provided'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`gender-badge gender-${pt.gender.toLowerCase()}`}>
                            {pt.gender}
                          </span>
                        </td>
                        <td className="cell-contact">{pt.contact_number}</td>
                        <td className="cell-date">{pt.date_of_birth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Doctor Assignments */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Recent Doctor Assignments</h3>
              <p className="panel-subtitle">Latest patient-specialist mappings</p>
            </div>
            <Link to="/mappings" className="panel-header-link">
              View all ({totalMappings}) &rarr;
            </Link>
          </div>

          <div className="panel-body">
            {recentMappings.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">🔗</div>
                <h4 className="empty-title">No doctor assignments yet.</h4>
                <p className="empty-desc">Assign a doctor to a patient to link specialists.</p>
                <Link to="/mappings" className="btn btn-outline btn-sm">
                  + Assign Doctor to Patient
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMappings.map((m) => (
                      <tr key={m.id}>
                        <td className="cell-title">{m.patient_name}</td>
                        <td className="cell-title">{m.doctor_name}</td>
                        <td>
                          <span className="specialty-badge">
                            {m.doctor_specialization}
                          </span>
                        </td>
                        <td className="cell-date">
                          {m.assigned_at
                            ? new Date(m.assigned_at).toLocaleDateString()
                            : 'Recently'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
