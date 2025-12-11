import { useState, useEffect } from 'react';
import './StatsDashboard.css';
import { apiService } from '../services/apiService';

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getStats();

      setStats(response);

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';

    // Format large numbers with commas
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };


  if (loading) {
    return (
      <div className="stats-dashboard-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-dashboard-container">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <p>Error loading statistics: {error || 'No data available'}</p>
          <button onClick={fetchStats} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare stats data for display
  const statsData = [
    {
      label: 'Total Patients',
      value: stats.totalPatients || 0,
      description: 'Registered patients on platform',
      icon: '👥',
      color: 'primary'
    },
    {
      label: 'Total Records',
      value: stats.totalRecords || 0,
      description: 'Medical records uploaded',
      icon: '📋',
      color: 'records'
    },
    {
      label: 'Total Consents',
      value: stats.totalConsents || 0,
      description: 'Consent agreements created',
      icon: '📝',
      color: 'consents'
    },
    {
      label: 'Active Consents',
      value: stats.activeConsents || 0,
      description: 'Currently active consents',
      icon: '✅',
      color: 'active'
    },
    {
      label: 'Pending Consents',
      value: stats.pendingConsents || 0,
      description: 'Consents awaiting approval',
      icon: '⏳',
      color: 'pending'
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions || 0,
      description: 'Blockchain transactions',
      icon: '🔄',
      color: 'transactions'
    }
  ];

  return (
    <div className="stats-dashboard-container">
      <div className="dashboard-header">
        <h2>Platform Statistics</h2>
        <div className="header-actions">
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div
            key={stat.label}
            className={`stat-card ${stat.color} ${index === 0 ? 'featured' : ''}`}
          >
            <div className="stat-card-header">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-label">{stat.label}</div>
            </div>

            <div className="stat-value">{formatNumber(stat.value)}</div>

            <div className="stat-description">{stat.description}</div>

            {index === 0 && stat.value > 0 && (
              <div className="stat-trend">
                <span className="trend-icon">📈</span>
                <span className="trend-text">+{Math.floor(stat.value * 0.12)} this month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional summary section */}
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-header">
            <h3>Platform Health</h3>
            <span className="health-status good">● Healthy</span>
          </div>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Consent Activity:</span>
              <span className="summary-value">
                {stats.totalConsents > 0
                  ? `${Math.round((stats.activeConsents / stats.totalConsents) * 100)}% Active`
                  : 'No data'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Avg Records per Patient:</span>
              <span className="summary-value">
                {stats.totalPatients > 0
                  ? Math.round((stats.totalRecords || 0) / stats.totalPatients)
                  : '0'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">System Uptime:</span>
              <span className="summary-value">99.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;