import { useState, useEffect } from 'react';
import axios from 'axios';
import ReportDashboard from '../components/reports/ReportDashboard';
import ScrewdriverOverview from '../components/reports/ScrewdriverOverview';
import ActivityLog from '../components/reports/ActivityLog';

const ReportsPage = () => {
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    counts: {
      total: 0,
      active: 0,
      inactive: 0
    },
    dailyCreation: [],
    topAttributes: [],
    recentActivity: []
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get('/api/screwdrivers/statistics/overview');
        setStatistics(response.data);
      } catch (err) {
        setError('Fehler beim Laden der Statistiken. Bitte versuchen Sie es später erneut.');
        console.error('Error fetching statistics:', err);
      } finally {
        // setLoading(false); // Remove if not needed
      }
    };

    const fetchActivityLogs = async () => {
      try {
        const response = await axios.get('/api/activity-logs');
        setActivityLogs(response.data);
      } catch (err) {
        setError('Fehler beim Laden der Aktivitäten. Bitte versuchen Sie es später erneut.');
        console.error('Error fetching activity logs:', err);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchStatistics();
    fetchActivityLogs();
  }, []);

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="container w-full mx-auto px-4 py-5 max-w-full">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <ReportDashboard title="Schraubendreher Übersicht">
            {statistics.counts ? (
              <ScrewdriverOverview
                totalCount={statistics.counts.total}
                activeCount={statistics.counts.active}
                inactiveCount={statistics.counts.inactive}
              />
            ) : (
              <p className="text-gray-600">Statistiken werden geladen...</p>
            )}
          </ReportDashboard>

          <ReportDashboard title="Aktivitätsprotokoll">
            <ActivityLog logs={activityLogs} loading={logsLoading} />
          </ReportDashboard>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
