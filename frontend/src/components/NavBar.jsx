import { Link } from 'react-router-dom';

const NavBar = () => (
  <nav className="bg-gray-800 text-white p-4 shadow">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <span className="text-lg font-semibold">Schrauber Verwaltung</span>
      <div className="space-x-4">
        <Link className="hover:text-gray-300" to="/">Schraubendreher</Link>
        <Link className="hover:text-gray-300" to="/attributes">Attribute</Link>
        <Link className="hover:text-gray-300" to="/reports">Berichte</Link>
      </div>
    </div>
  </nav>
);

export default NavBar;
