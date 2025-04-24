import { useState, useEffect } from 'react';
import axios from 'axios';
import ReportDashboard from '../components/reports/ReportDashboard';
import ScrewdriverOverview from '../components/reports/ScrewdriverOverview';
import ActivityLog from '../components/reports/ActivityLog';

const ReportsPage = () => {
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get('/api/screwdrivers?include_inactive=true');
        const screwdrivers = response.data;
        
        setStatistics({
          total: screwdrivers.length,
          active: screwdrivers.filter(s => s.state === 'on').length,
          inactive: screwdrivers.filter(s => s.state === 'off').length
        });
      } catch (err) {
        setError('Fehler beim Laden der Statistiken. Bitte versuchen Sie es später erneut.');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchActivityLogs = async () => {
      try {
        const response = await axios.get('/api/screwdriver-logs');
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

  return (
    <div className="w-full h-full">
      <div className="container w-full mx-auto px-4 py-5 max-w-full">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <ReportDashboard title="Übersicht Schraubendreher">
            {loading ? (
              <p className="text-gray-600">Statistiken werden geladen...</p>
            ) : (
              <ScrewdriverOverview
                totalCount={statistics.total}
                activeCount={statistics.active}
                inactiveCount={statistics.inactive}
              />
            )}
          </ReportDashboard>

          <ReportDashboard title="Attribute Analyse">
            {/* Attribute analysis will go here */}
            <p className="text-gray-600">Analyse wird geladen...</p>
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
