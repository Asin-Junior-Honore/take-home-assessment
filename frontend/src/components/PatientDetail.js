import { useState, useEffect } from 'react';
import './PatientDetail.css';
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/formatDate';


const PatientDetail = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;

      setLoading(true);
      setError(null);

      try {

        const patientData = await apiService.getPatient(patientId);
        setPatient(patientData);


        const recordsData = await apiService.getPatientRecords(patientId);
        setRecords(recordsData.records || []);

      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError(err.message || 'Failed to load patient data');
        setPatient(null);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);


  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'status-badge verified';
      case 'pending':
        return 'status-badge pending';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge unknown';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'diagnostic':
        return 'type-badge diagnostic';
      case 'lab results':
        return 'type-badge lab-results';
      case 'prescription':
        return 'type-badge prescription';
      case 'surgery':
        return 'type-badge surgery';
      default:
        return 'type-badge other';
    }
  };

  if (loading) {
    return (
      <div className="patient-detail-container">
        <div className="loading">Loading patient details...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patient-detail-container">
        <div className="error-container">
          <div className="error">Error loading patient: {error || 'Patient not found'}</div>
          <button onClick={onBack} className="back-btn">Back to List</button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-header">
        <button onClick={onBack} className="back-btn">← Back to List</button>
        <h1 className="patient-main-title">Patient Details</h1>
      </div>

      <div className="patient-detail-content">
        {/* Patient Information Section */}
        <div className="patient-info-section card">
          <h2 className="section-title">
            Patient Information
            <span className="patient-id-badge">{patient.patientId}</span>
          </h2>

          <div className="patient-info-grid">
            <div className="info-group">
              <h3 className="info-label">Full Name</h3>
              <p className="info-value">{patient.name}</p>
            </div>

            <div className="info-group">
              <h3 className="info-label">Email Address</h3>
              <p className="info-value">
                <a href={`mailto:${patient.email}`} className="email-link">
                  {patient.email}
                </a>
              </p>
            </div>

            <div className="info-group">
              <h3 className="info-label">Phone Number</h3>
              <p className="info-value">
                <a href={`tel:${patient.phone}`} className="phone-link">
                  {patient.phone}
                </a>
              </p>
            </div>

            <div className="info-group">
              <h3 className="info-label">Date of Birth</h3>
              <p className="info-value">{formatDateShort(patient.dateOfBirth)}</p>
            </div>

            <div className="info-group">
              <h3 className="info-label">Gender</h3>
              <p className="info-value">{patient.gender}</p>
            </div>

            <div className="info-group full-width">
              <h3 className="info-label">Address</h3>
              <p className="info-value">{patient.address}</p>
            </div>

            {patient.walletAddress && (
              <div className="info-group full-width">
                <h3 className="info-label">Wallet Address</h3>
                <div className="wallet-container">
                  <code className="wallet-address" title={patient.walletAddress}>
                    {formatWalletAddress(patient.walletAddress)}
                  </code>
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(patient.walletAddress)}
                    title="Copy to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="info-group">
              <h3 className="info-label">Patient Since</h3>
              <p className="info-value">{formatDateShort(patient.createdAt)}</p>
            </div>

            <div className="info-group">
              <h3 className="info-label">Patient ID</h3>
              <p className="info-value mono">{patient.id}</p>
            </div>
          </div>
        </div>

        {/* Medical Records Section */}
        <div className="patient-records-section card">
          <h2 className="section-title">
            Medical Records ({records.length})
          </h2>

          {records.length === 0 ? (
            <div className="no-records">
              <p>No medical records found for this patient.</p>
            </div>
          ) : (
            <div className="records-grid">
              {records.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-header">
                    <div className="record-title-row">
                      <h3 className="record-title">{record.title}</h3>
                      <span className={getStatusBadgeClass(record.status)}>
                        {record.status}
                      </span>
                    </div>
                    <span className={getTypeBadgeClass(record.type)}>
                      {record.type}
                    </span>
                  </div>

                  <div className="record-details">
                    <div className="record-detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(record.date)}</span>
                    </div>

                    <div className="record-detail-row">
                      <span className="detail-label">Doctor:</span>
                      <span className="detail-value">{record.doctor}</span>
                    </div>

                    <div className="record-detail-row">
                      <span className="detail-label">Hospital:</span>
                      <span className="detail-value">{record.hospital}</span>
                    </div>

                    <div className="record-description">
                      <h4 className="description-label">Description:</h4>
                      <p className="description-text">{record.description}</p>
                    </div>

                    {record.blockchainHash && (
                      <div className="blockchain-info">
                        <div className="record-detail-row">
                          <span className="detail-label">Blockchain Hash:</span>
                          <div className="hash-container">
                            <code className="hash-value" title={record.blockchainHash}>
                              {`${record.blockchainHash.substring(0, 10)}...${record.blockchainHash.substring(record.blockchainHash.length - 8)}`}
                            </code>
                            <button
                              className="copy-btn small"
                              onClick={() => navigator.clipboard.writeText(record.blockchainHash)}
                              title="Copy hash to clipboard"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="record-footer">
                    <span className="record-id">ID: {record.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;