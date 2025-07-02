import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { path: '/laboratories', label: 'Laboratories', icon: '🏥' },
  ];

  return (
    <div className="bg-white shadow-lg h-full w-64 fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Klinic Admin</h1>
        <p className="text-sm text-gray-600">Management Panel</p>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">© 2024 Klinic Admin</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 