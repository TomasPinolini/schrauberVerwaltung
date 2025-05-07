import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/NavBar';
import ScrewdriversPage from './pages/ScrewdriversPage';
import AttributesPage from './pages/AttributesPage';
import ReportsPage from './pages/ReportsPage';
import AuftraegePage from './pages/AuftraegePage';
import Toast from './components/ui/Toast';

function App() {
  return (
    <BrowserRouter>
      {/* Toast component for notifications */}
      <Toast />
      
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow py-6">
          <div className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<ScrewdriversPage />} />
              <Route path="/attributes" element={<AttributesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/auftraege" element={<AuftraegePage />} />
              {/* Fallback route for any unmatched paths */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <footer className="bg-gray-800 text-white py-4 text-center text-sm">
          <div className="container mx-auto">
            Schrauber Verwaltung &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
