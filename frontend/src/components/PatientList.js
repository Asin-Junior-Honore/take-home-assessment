import { useState, useEffect, useCallback } from 'react';
import './PatientList.css';
import { apiService } from '../services/apiService';

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call API with appropriate parameters
      const response = await apiService.getPatients(currentPage, 10, searchTerm);

      // Update patients state with response data
      setPatients(response.patients || []);

      // Update pagination state
      setPagination({
        limit: response.pagination.limit,
        page: response.pagination.page,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch patients');
      setPatients([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    handleSearchChange(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination?.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading && patients.length === 0) {
    return (
      <div className="patient-list-container">
        <div className="loading">Loading patients...</div>
      </div>
    );
  }

  if (error && patients.length === 0) {
    return (
      <div className="patient-list-container">
        <div className="error">Error: {error}</div>
        <button onClick={fetchPatients} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>Patients</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search patients by name, email, or patient ID..."
            className="search-input"
            onChange={handleSearch}
            defaultValue={searchTerm}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="no-patients">
          <p>No patients found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="patient-list">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="patient-card"
                onClick={() => onSelectPatient(patient.id)}
              >
                <div className="patient-card-header">
                  <h3 className="patient-name">{patient.name}</h3>
                  <span className="patient-id">{patient.patientId}</span>
                </div>

                <div className="patient-details">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{patient.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{patient.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Birth:</span>
                    <span className="detail-value">
                      {formatDate(patient.dateOfBirth)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{patient.gender}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{patient.address}</span>
                  </div>
                  {patient.walletAddress && (
                    <div className="detail-row">
                      <span className="detail-label">Wallet:</span>
                      <span className="detail-value wallet-address" title={patient.walletAddress}>
                        {formatWalletAddress(patient.walletAddress)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="patient-card-footer">
                  <span className="created-date">
                    Created: {formatDate(patient.createdAt)}
                  </span>
                  <button className="select-button">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="page-info">
                Page {currentPage} of {pagination.totalPages}
                <span className="total-count">
                  ({pagination.total} total patients)
                </span>
              </div>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="page-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientList;