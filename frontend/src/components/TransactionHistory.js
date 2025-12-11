import { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatDate';
import './TransactionHistory.css';
import { apiService } from '../services/apiService';

const TransactionHistory = ({ account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterByAccount, setFilterByAccount] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call apiService.getTransactions with account address if available
      const walletAddress = filterByAccount && account ? account : null;
      const response = await apiService.getTransactions(walletAddress, 50);

      // Update transactions state
      setTransactions(response.transactions || []);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [account, filterByAccount]);

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };


  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return '';
    }
  };

  const formatAmount = (amount, currency = 'ETH') => {
    if (!amount) return '0';

    const amountNum = parseFloat(amount);

    if (amountNum > 1e15) {
      return `${(amountNum / 1e18).toFixed(4)} ${currency}`;
    }


    return `${amount} ${currency}`;
  };

  const getTransactionTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'consent_created':
        return 'Consent Created';
      case 'record_uploaded':
        return 'Record Uploaded';
      case 'access_granted':
        return 'Access Granted';
      case 'transfer':
        return 'Token Transfer';
      case 'contract_interaction':
        return 'Contract Interaction';
      case 'deployment':
        return 'Contract Deployment';
      default:
        return type || 'Unknown';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'consent_created':
        return '📝';
      case 'record_uploaded':
        return '🏥';
      case 'access_granted':
        return '🔓';
      case 'transfer':
        return '🔄';
      case 'contract_interaction':
        return '🤝';
      case 'deployment':
        return '🚀';
      default:
        return '📄';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'success':
        return 'status-badge success';
      case 'pending':
        return 'status-badge pending';
      case 'failed':
      case 'error':
        return 'status-badge failed';
      default:
        return 'status-badge unknown';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'success':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'failed':
      case 'error':
        return 'Failed';
      default:
        return status || 'Unknown';
    }
  };

  const isUserAddress = (address) => {
    return account && address && address.toLowerCase() === account.toLowerCase();
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-history-container">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="transaction-history-container">
        <div className="error">
          Error: {error}
          <button onClick={fetchTransactions} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-container">
      <div className="transaction-header">
        <div className="header-main">
          <h2>Transaction History</h2>
          <span className="transaction-count">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="header-controls">
          {account && (
            <div className="filter-toggle">
              <span className="filter-label">Filter by my wallet:</span>
              <button
                className={`toggle-btn ${filterByAccount ? 'active' : ''}`}
                onClick={() => setFilterByAccount(true)}
                title="Show only my transactions"
              >
                On
              </button>
              <button
                className={`toggle-btn ${!filterByAccount ? 'active' : ''}`}
                onClick={() => setFilterByAccount(false)}
                title="Show all transactions"
              >
                Off
              </button>
            </div>
          )}
        </div>
      </div>

      {account && filterByAccount && (
        <div className="wallet-info">
          <span className="wallet-label">Filtering for:</span>
          <code className="wallet-address" title={account}>
            {formatAddress(account)}
          </code>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(account)}
            title="Copy wallet address"
          >
            Copy
          </button>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="no-transactions card">
          <p>
            {account && filterByAccount
              ? 'No transactions found for your wallet address.'
              : 'No transactions found.'}
          </p>
          {account && filterByAccount && (
            <button
              className="show-all-btn"
              onClick={() => setFilterByAccount(false)}
            >
              Show All Transactions
            </button>
          )}
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id || tx.blockchainTxHash} className="transaction-card card">
              <div className="transaction-header-row">
                <div className="transaction-type">
                  <span className="type-icon">
                    {getTransactionTypeIcon(tx.type)}
                  </span>
                  <span className="type-label">
                    {getTransactionTypeLabel(tx.type)}
                  </span>
                </div>

                <div className="transaction-meta">
                  <span className="timestamp" title={formatDate(tx.timestamp)}>
                    {formatTimeAgo(tx.timestamp)}
                  </span>
                  <span className={getStatusBadgeClass(tx.status)}>
                    {getStatusLabel(tx.status)}
                  </span>
                </div>
              </div>

              <div className="transaction-details">
                {tx.blockchainTxHash && (
                  <div className="detail-row">
                    <span className="detail-label">Transaction Hash:</span>
                    <div className="hash-container">
                      <code className="detail-value hash" title={tx.blockchainTxHash}>
                        {formatAddress(tx.blockchainTxHash)}
                      </code>
                      <button
                        className="copy-btn"
                        onClick={() => navigator.clipboard.writeText(tx.blockchainTxHash)}
                        title="Copy transaction hash"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {tx.from && (
                  <div className="detail-row">
                    <span className="detail-label">From:</span>
                    <code
                      className={`detail-value address ${isUserAddress(tx.from) ? 'user-address' : ''}`}
                      title={tx.from}
                    >
                      {formatAddress(tx.from)}
                      {isUserAddress(tx.from) && (
                        <span className="you-badge">(you)</span>
                      )}
                    </code>
                  </div>
                )}

                {tx.to && (
                  <div className="detail-row">
                    <span className="detail-label">To:</span>
                    <code
                      className={`detail-value address ${isUserAddress(tx.to) ? 'user-address' : ''}`}
                      title={tx.to}
                    >
                      {formatAddress(tx.to)}
                      {isUserAddress(tx.to) && (
                        <span className="you-badge">(you)</span>
                      )}
                    </code>
                  </div>
                )}

                {(tx.amount || tx.amount === 0) && (
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">
                      {formatAmount(tx.amount, tx.currency)}
                    </span>
                  </div>
                )}

                {tx.gasUsed && (
                  <div className="detail-row">
                    <span className="detail-label">Gas Used:</span>
                    <span className="detail-value gas">
                      {tx.gasUsed} Wei
                    </span>
                  </div>
                )}

                {tx.blockNumber && (
                  <div className="detail-row">
                    <span className="detail-label">Block:</span>
                    <span className="detail-value block">
                      #{tx.blockNumber}
                    </span>
                  </div>
                )}

                {tx.description && (
                  <div className="detail-row full-width">
                    <span className="detail-label">Description:</span>
                    <p className="description">{tx.description}</p>
                  </div>
                )}
              </div>

              <div className="transaction-footer">
                <span className="full-date">
                  {formatDate(tx.timestamp)}
                </span>
                {tx.contractAddress && (
                  <span className="contract-info">
                    Contract: {formatAddress(tx.contractAddress)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;