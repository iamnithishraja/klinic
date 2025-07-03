import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaChartBar, FaUsers, FaUserMd, FaFlask, FaChartLine, FaCog, FaSignInAlt, FaUserPlus, FaTruck } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on component mount and when token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    
    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for custom authentication event
    const handleAuthSuccess = () => {
      setIsUpdating(true);
      setIsAuthenticated(true);
      // Reset updating state after a short delay
      setTimeout(() => {
        setIsUpdating(false);
      }, 2000);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-success', handleAuthSuccess);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []);

  const authenticatedNavItems = [
    { 
      path: '/home', 
      label: 'Dashboard', 
      icon: <FaChartBar className="text-lg" />,
      description: 'Overview & Analytics'
    },
    { 
      path: '/users', 
      label: 'User Management', 
      icon: <FaUsers className="text-lg" />,
      description: 'Patients & Accounts'
    },
    { 
      path: '/doctors', 
      label: 'Doctors', 
      icon: <FaUserMd className="text-lg" />,
      description: 'Healthcare Professionals'
    },
    { 
      path: '/laboratories', 
      label: 'Laboratory Management', 
      icon: <FaFlask className="text-lg" />,
      description: 'Lab Services & Tests'
    },
    { 
      path: '/delivery-partners', 
      label: 'Delivery Partners', 
      icon: <FaTruck className="text-lg" />,
      description: 'Delivery Staff'
    },
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: <FaChartLine className="text-lg" />,
      description: 'Reports & Insights'
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: <FaCog className="text-lg" />,
      description: 'System Configuration'
    },
  ];

  const unauthenticatedNavItems = [
    { 
      path: '/', 
      label: 'Login', 
      icon: <FaSignInAlt className="text-lg" />,
      description: 'Access your account'
    },
    { 
      path: '/signup', 
      label: 'Sign Up', 
      icon: <FaUserPlus className="text-lg" />,
      description: 'Create new account'
    },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="bg-background h-full w-72 fixed left-0 top-16 mt-0 overflow-y-auto shadow-2xl border-r border-gray-200" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-tint to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #2f95dc, #2563eb)' }}>
            <span className="text-white text-xl font-bold">K</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text" style={{ color: '#11181C' }}>Klinic Admin</h1>
            <p className="text-icon text-sm" style={{ color: '#687076' }}>
              {isAuthenticated ? 'Management Console' : 'Authentication'}
            </p>
          </div>
        </div>
        
        {/* Admin Profile - Only show when authenticated */}
        {isAuthenticated && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-tint to-blue-500 rounded-full flex items-center justify-center mr-3" style={{ background: 'linear-gradient(135deg, #2f95dc, #3b82f6)' }}>
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <div className="flex-1">
                <p className="text-text font-medium text-sm" style={{ color: '#11181C' }}>Administrator</p>
                <p className="text-icon text-xs" style={{ color: '#687076' }}>Super Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-icon hover:text-text transition-colors w-4 h-4 flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm ml-2 text-base p-0"
                style={{ color: '#687076', minWidth: '2rem', minHeight: '2rem' }}
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Welcome message for unauthenticated users */}
        {!isAuthenticated && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">👋</span>
              </div>
              <div className="flex-1">
                <p className="text-blue-900 font-medium text-sm">Welcome to Klinic</p>
                <p className="text-blue-700 text-xs">Please login to access the admin panel</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 overflow-y-auto custom-scrollbar-hide" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link group flex items-center px-3 py-2 rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'sidebar-link-active bg-tint text-white shadow-lg'
                      : 'text-gray-800 hover:bg-gray-100 hover:text-tint'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#2f95dc' : 'transparent',
                  color: isActive ? '#fff' : undefined
                })}
                onClick={() => {}}
              >
                <div className="sidebar-icon mr-2">
                  {React.cloneElement(item.icon, {
                    className: 'text-xl',
                  })}
                </div>
                <div className="flex-1">
                  <span className={`font-semibold text-base transition-all duration-200 ${window.location.pathname === item.path ? 'text-white' : 'text-gray-900 group-hover:text-tint'}`}>{item.label}</span>
                  <p className={`text-xs mt-0.5 transition-all duration-200 ${window.location.pathname === item.path ? 'text-white opacity-90' : 'text-gray-500 group-hover:text-tint'}`}>{item.description}</p>
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-background" style={{ background: '#fff' }}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${isUpdating ? 'bg-yellow-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
            <span className={`text-xs font-medium ${isUpdating ? 'text-yellow-600' : 'text-green-600'}`}>
              {isUpdating ? 'Updating...' : isAuthenticated ? 'System Online' : 'Ready to Connect'}
            </span>
          </div>
          <p className="text-xs text-icon" style={{ color: '#687076' }}>© 2024 Klinic Admin v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;