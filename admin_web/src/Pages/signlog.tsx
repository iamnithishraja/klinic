import React, { useState } from 'react';
import axios from 'axios';

const SignLog: React.FC = () => {
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  // Role is fixed to admin for this panel, so we don't need state for it
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState('');

  // Toggle between login and signup
  const [isLogin, setIsLogin] = useState(true);

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

  // Signup handler
  // Properly written sign up (register) handler with console.log for response data
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess('');
    try {
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/register';
      // Only allow admin signup from this panel
      const payload = {
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        role: 'admin',
      };
      const response = await axios.post(apiUrl, payload);
      console.log('Signup response data:', response.data); // Log the response data
      setSignupSuccess('Signup successful! Please login.');
      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupPassword('');
      setIsLogin(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSignupError(err.response?.data?.message || 'Signup failed');
      } else {
        setSignupError('Signup failed');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 w-96">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Klinic Admin</h1>
          <p className="text-gray-600 text-sm">Management Console</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-center mb-8 bg-gray-100 rounded-xl p-1">
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isLogin 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              !isLogin 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Signup
          </button>
        </div>
        {isLogin ? (
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
        ) : (
          <form onSubmit={handleSignup}>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-900">Admin Signup</h2>
            {signupError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {signupError}
              </div>
            )}
            {signupSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {signupSuccess}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={e => setSignupPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your phone number"
                  required
                  minLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password (min 8 characters)"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={signupLoading}
            >
              {signupLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing up...
                </div>
              ) : (
                'Signup'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignLog;
