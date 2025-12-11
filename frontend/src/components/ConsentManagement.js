import { useState, useEffect } from 'react';
import './ConsentManagement.css';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../hooks/useWeb3';
import { formatDate } from '../utils/formatDate';


const ConsentManagement = ({ account }) => {
  const { signMessage } = useWeb3();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    purpose: '',
  });
  const [processing, setProcessing] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState(null);

  const fetchConsents = async () => {
    setLoading(true);
    setError(null);

    try {
  
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await apiService.getConsents(null, params.status || null);

      setConsents(response.consents || []);

    } catch (err) {
      console.error('Error fetching consents:', err);
      setError(err.message || 'Failed to fetch consents');
      setConsents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, [filterStatus]);

  const showConfirmation = (consentId, newStatus) => {
    setSelectedConsentId(consentId);
    setSelectedNewStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!selectedConsentId || !selectedNewStatus) return;

    try {
      // Call apiService.updateConsent to update the status
      const updates = { status: selectedNewStatus };
      await apiService.updateConsent(selectedConsentId, updates);

      // Refresh consents list
      await fetchConsents();

      // Show success message
      alert(`Consent status updated to ${selectedNewStatus}`);

    } catch (err) {
      console.error('Error updating consent:', err);
      alert('Failed to update consent: ' + err.message);
    } finally {
      // Reset confirmation state
      setShowConfirmDialog(false);
      setSelectedConsentId(null);
      setSelectedNewStatus(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedConsentId(null);
    setSelectedNewStatus(null);
  };

  const handleCreateConsent = async (e) => {
    e.preventDefault();

    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.patientId || !formData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessing(true);

    try {
      // 1. Create a message to sign
      const message = `I consent to: ${formData.purpose} for patient: ${formData.patientId}`;

      // 2. Sign the message using signMessage
      const signature = await signMessage(message);
      console.log('Message signed with signature:', signature);

      // 3. Call apiService.createConsent with patientId, purpose, account, and signature
      const consentData = {
        patientId: formData.patientId,
        purpose: formData.purpose,
        patientWalletAddress: account,
        signature: signature,
        message: message
      };

      console.log('Creating consent with data:', consentData);

      const newConsent = await apiService.createConsent(consentData);
      console.log('Consent created:', newConsent);

      // 4. Refresh consents and reset form
      await fetchConsents();
      setFormData({ patientId: '', purpose: '' });
      setShowCreateForm(false);

      alert('Consent created successfully!');

    } catch (err) {
      console.error('Error creating consent:', err);
      alert('Failed to create consent: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-badge active';
      case 'pending':
        return 'status-badge pending';
      case 'revoked':
        return 'status-badge revoked';
      case 'expired':
        return 'status-badge expired';
      default:
        return 'status-badge unknown';
    }
  };

  const getPurposeType = (purpose) => {
    if (purpose.toLowerCase().includes('research')) return 'research';
    if (purpose.toLowerCase().includes('data sharing')) return 'data-sharing';
    if (purpose.toLowerCase().includes('analytics')) return 'analytics';
    if (purpose.toLowerCase().includes('insurance')) return 'insurance';
    return 'other';
  };

  if (loading && consents.length === 0) {
    return (
      <div className="consent-management-container">
        <div className="loading">Loading consents...</div>
      </div>
    );
  }

  if (error && consents.length === 0) {
    return (
      <div className="consent-management-container">
        <div className="error">Error: {error}</div>
        <button onClick={fetchConsents} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="consent-management-container">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog card">
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to change the consent status to{' '}
              <strong>{selectedNewStatus}</strong>?
            </p>
            <div className="dialog-actions">
              <button
                className="dialog-btn cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="dialog-btn confirm-btn"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="consent-header">
        <h2>Consent Management</h2>
        <div className="header-actions">
          <span className="consent-count">
            {consents.length} consent{consents.length !== 1 ? 's' : ''}
          </span>
          <button
            className="create-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!account}
          >
            {showCreateForm ? 'Cancel' : 'Create New Consent'}
          </button>
        </div>
      </div>

      {!account && (
        <div className="warning">
          Please connect your MetaMask wallet to manage consents
        </div>
      )}

      {showCreateForm && account && (
        <div className="create-consent-form card">
          <h3>Create New Consent</h3>
          <p className="form-description">
            Create a new consent by signing a message with your wallet.
          </p>

          <form onSubmit={handleCreateConsent}>
            <div className="form-group">
              <label>Patient ID *</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                placeholder="e.g., patient-001 or P-2024-001"
                disabled={processing}
              />
              <small className="form-hint">Enter the patient's unique ID</small>
            </div>

            <div className="form-group">
              <label>Purpose *</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
                disabled={processing}
              >
                <option value="">Select purpose...</option>
                <option value="Research Study Participation">Research Study Participation</option>
                <option value="Data Sharing with Research Institution">Data Sharing with Research Institution</option>
                <option value="Third-Party Analytics Access">Third-Party Analytics Access</option>
                <option value="Insurance Provider Access">Insurance Provider Access</option>
                <option value="Clinical Trial Participation">Clinical Trial Participation</option>
                <option value="Medical Education and Training">Medical Education and Training</option>
                <option value="Healthcare Quality Improvement">Healthcare Quality Improvement</option>
              </select>
              <small className="form-hint">Select the purpose for data access</small>
            </div>

            <div className="form-info">
              <div className="info-item">
                <span className="info-label">Signer Wallet:</span>
                <code className="info-value">{formatAddress(account)}</code>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Sign & Create Consent'
                )}
              </button>
            </div>

            <div className="signature-notice">
              <p>⚠️ You will be prompted to sign a message with your wallet. This signature verifies your consent.</p>
            </div>
          </form>
        </div>
      )}

      <div className="consent-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filterStatus === 'revoked' ? 'active' : ''}`}
          onClick={() => setFilterStatus('revoked')}
        >
          Revoked
        </button>
        <button
          className={`filter-btn ${filterStatus === 'expired' ? 'active' : ''}`}
          onClick={() => setFilterStatus('expired')}
        >
          Expired
        </button>
      </div>

      {consents.length === 0 ? (
        <div className="no-consents card">
          <p>No consents found{filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}.</p>
          {account && !showCreateForm && (
            <button
              className="create-first-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Consent
            </button>
          )}
        </div>
      ) : (
        <div className="consents-list">
          {consents.map((consent) => (
            <div key={consent.id} className="consent-card card">
              <div className="consent-header-row">
                <div className="consent-meta">
                  <span className={`purpose-badge ${getPurposeType(consent.purpose)}`}>
                    {consent.purpose}
                  </span>
                  <span className={getStatusBadgeClass(consent.status)}>
                    {consent.status}
                  </span>
                </div>

                {consent.status === 'pending' && (
                  <div className="consent-actions">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => showConfirmation(consent.id, 'active')}
                      title="Approve consent"
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => showConfirmation(consent.id, 'revoked')}
                      title="Reject consent"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {consent.status === 'active' && (
                  <div className="consent-actions">
                    <button
                      className="action-btn revoke-btn"
                      onClick={() => showConfirmation(consent.id, 'revoked')}
                      title="Revoke consent"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>

              <div className="consent-details">
                <div className="detail-row">
                  <span className="detail-label">Patient ID:</span>
                  <span className="detail-value">{consent.patientId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Patient Wallet:</span>
                  <code className="detail-value wallet" title={consent.patientWalletAddress}>
                    {formatAddress(consent.patientWalletAddress)}
                  </code>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(consent.createdAt)}</span>
                </div>

                {consent.updatedAt && consent.updatedAt !== consent.createdAt && (
                  <div className="detail-row">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">{formatDate(consent.updatedAt)}</span>
                  </div>
                )}

                {consent.expiresAt && (
                  <div className="detail-row">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">{formatDate(consent.expiresAt)}</span>
                  </div>
                )}

                {consent.blockchainTxHash && (
                  <div className="detail-row">
                    <span className="detail-label">Transaction Hash:</span>
                    <div className="hash-container">
                      <code className="detail-value hash" title={consent.blockchainTxHash}>
                        {formatAddress(consent.blockchainTxHash)}
                      </code>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(consent.blockchainTxHash)}
                        title="Copy transaction hash"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {consent.signature && (
                  <div className="detail-row">
                    <span className="detail-label">Signature:</span>
                    <div className="hash-container">
                      <code className="detail-value signature" title={consent.signature}>
                        {formatAddress(consent.signature)}
                      </code>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(consent.signature)}
                        title="Copy signature"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {consent.message && (
                  <div className="detail-row full-width">
                    <span className="detail-label">Signed Message:</span>
                    <p className="signed-message">{consent.message}</p>
                  </div>
                )}
              </div>

              <div className="consent-footer">
                <span className="consent-id">ID: {consent.id}</span>
                {consent.creator && (
                  <span className="creator">Created by: {consent.creator}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsentManagement;