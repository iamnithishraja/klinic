import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignLog: React.FC = () => {
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const loginEmailRef = useRef<HTMLInputElement>(null);



  // Focus first input and clear errors/fields on tab switch
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setLoginSuccess('');
    setLoginLoading(false);
    if (loginEmailRef.current) loginEmailRef.current.focus();
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setLoginSuccess('');
    try {
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/login';
      const res = await axios.post(apiUrl, { email: loginEmail, password: loginPassword });
      console.log(res.data); // <-- Add this
      if (res.data.user.role !== 'admin') {
        setLoginError('Access denied: Not an admin');
        setLoginLoading(false);
        return;
      }
      
      setLoginSuccess('Login successful! Redirecting...');
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('justAuthenticated', 'true');
      // Dispatch custom event to trigger page refresh
      window.dispatchEvent(new CustomEvent('auth-success'));
      
      // Navigate to home page
      setTimeout(() => {
        window.location.href = '/home';
      }, 1000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setLoginError(err.response?.data?.message || 'Login failed');
      } else {
        setLoginError('Login failed');
      }
    } finally {
      setLoginLoading(false);
    }
  };



  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-2">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md transition-all duration-300 animate-fadein">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Klinic Admin</h1>
          <p className="text-gray-600 text-sm">Management Console</p>
        </div>

        <form onSubmit={handleLogin}>
          <h2 className="text-xl font-bold mb-6 text-center text-gray-900">Admin Login</h2>
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {loginError}
            </div>
          )}
          {loginSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {loginSuccess}
            </div>
          )}
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
                ref={loginEmailRef}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaLock />
              </span>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg focus:outline-none"
                onClick={() => setShowLoginPassword(v => !v)}
              >
                {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loginLoading}
          >
            {loginLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignLog;

// Add fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadein { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
.animate-fadein { animation: fadein 0.5s; }
`;
document.head.appendChild(style);
