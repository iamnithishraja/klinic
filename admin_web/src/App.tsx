import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './Pages/Home';
import UsersTab from './Pages/UsersTab';
import DoctorsTab from './Pages/DoctorsTab';
import LaboratoriesTab from './Pages/LaboratoriesTab';
import SignLog from './Pages/signlog';
import DeliveryPartnersTab from './Pages/DeliveryPartnersTab';
import RoleManagementTab from './Pages/RoleManagementTab';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = () => {
      const token = localStorage.getItem('admin_token');
      setIsAuthenticated(!!token);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Public Route Component (redirects to home if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
    // Listen for storage changes (e.g., login in another tab)
    const handleStorageChange = () => {
      const token = localStorage.getItem('admin_token');
      setIsAuthenticated(!!token);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Only check authentication on mount and on storage/auth-success events
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token');
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for custom authentication event (e.g., after login)
    const handleAuthSuccess = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-success', handleAuthSuccess);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []);

  return (
    <>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
          {/* Left Sidebar */}
          <Sidebar />
          {/* Main Content Area */}
          <div className="flex-1 ml-72 pt-20"> {/* pt-20 for navbar height */}
            <main className="min-h-screen p-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                  <PublicRoute>
                    <SignLog />
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <SignLog />
                  </PublicRoute>
                } />
                
                {/* Protected Routes */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute>
                    <UsersTab />
                  </ProtectedRoute>
                } />
                <Route path="/doctors" element={
                  <ProtectedRoute>
                    <DoctorsTab />
                  </ProtectedRoute>
                } />
                <Route path="/laboratories" element={
                  <ProtectedRoute>
                    <LaboratoriesTab />
                  </ProtectedRoute>
                } />
                <Route path="/delivery-partners" element={
                  <ProtectedRoute>
                    <DeliveryPartnersTab />
                  </ProtectedRoute>
                } />
                <Route path="/role-management" element={
                  <ProtectedRoute>
                    <RoleManagementTab />
                  </ProtectedRoute>
                } />
                                
                {/* Catch all route - redirect to appropriate page */}
                <Route path="*" element={
                  isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/" replace />
                } />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </>
  );
}

export default App;
