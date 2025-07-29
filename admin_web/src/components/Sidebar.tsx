import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartBar, FaUsers, FaUserMd, FaFlask, FaSignInAlt, FaTruck, FaUserShield, FaClipboardList, FaBox } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      setIsAuthenticated(true);
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
      path: '/orders', 
      label: 'Orders', 
      icon: <FaClipboardList className="text-lg" />, // or FaBoxOpen for package
      description: 'Medicine Orders'
    },
    { 
      path: '/products', 
      label: 'Products', 
      icon: <FaBox className="text-lg" />,
      description: 'Medicine Products'
    },
    { 
      path: '/role-management', 
      label: 'Role Management', 
      icon: <FaUserShield className="text-lg" />,
      description: 'Manage User Roles & Permissions'
    },
  ];

  const unauthenticatedNavItems = [
    { 
      path: '/', 
      label: 'Login',
      icon: <FaSignInAlt className="text-lg" />,
      description: 'Access your admin account'
    },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <div className="bg-background h-full w-72 fixed left-0 top-0 mt-0 shadow-xl rounded-r-2xl border-r border-border flex flex-col" style={{ background: 'var(--color-card)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background rounded-tr-2xl p-6 border-b border-border flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
          <img 
            src="/logo.png" 
            alt="Klinic Logo" 
            className="w-8 h-8 object-contain rounded-lg"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('span');
              fallback.className = 'text-white text-2xl font-bold';
              fallback.textContent = 'K';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </div>
        <span className="text-xl font-bold text-primary tracking-tight">Klinic Admin</span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 overflow-y-auto custom-scrollbar-hide">
        <div className="space-y-2">
          {navItems.map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative font-semibold text-base shadow-sm ${
                    isActive
                      ? 'sidebar-link-active bg-primary text-white shadow-lg'
                      : 'text-icon hover:bg-muted hover:text-primary'
                  }`
                }
              >
                <div className="sidebar-icon mr-3">
                  {React.cloneElement(item.icon, {
                    className: 'text-xl',
                  })}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-base transition-all duration-200">{item.label}</span>
                  <p className="text-xs mt-0.5 text-muted">{item.description}</p>
                </div>
              </NavLink>
            </div>
          ))}
        </div>
      </nav>
      {/* Logout button for authenticated users */}
      {isAuthenticated && (
        <div className="p-6 mt-auto">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-danger text-white font-semibold shadow hover:bg-red-600 transition"
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;