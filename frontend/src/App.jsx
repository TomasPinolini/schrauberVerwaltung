import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import ScrewdriversPage from './pages/ScrewdriversPage';
import AttributesPage from './pages/AttributesPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<ScrewdriversPage />} />
          <Route path="/attributes" element={<AttributesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

