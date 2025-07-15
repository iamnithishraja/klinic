import React, { useState } from 'react';
import axios from 'axios';
import { FaUserTimes, FaUserCheck, FaTimes } from 'react-icons/fa';

interface SuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  isCurrentlySuspended: boolean;
  onSuspensionChange: () => void;
}

const SuspensionModal: React.FC<SuspensionModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userPhone,
  isCurrentlySuspended,
  onSuspensionChange
}) => {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + '/api/v1/admin/users/suspend';
      
      const response = await axios.post(apiUrl, {
        userId,
        reason,
        expiresAt: expiresAt || undefined,
        notes: notes || undefined
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.status === 200) {
        onSuspensionChange();
        onClose();
        // Reset form
        setReason('');
        setExpiresAt('');
        setNotes('');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = (import.meta.env.VITE_FRONTEND_API_KEY || 'http://localhost:3000') + `/api/v1/admin/users/${userId}/unsuspend`;
      
      const response = await axios.put(apiUrl, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.status === 200) {
        onSuspensionChange();
        onClose();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to unsuspend user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {isCurrentlySuspended ? (
              <>
                <FaUserCheck className="text-green-600" />
                Unsuspend User
              </>
            ) : (
              <>
                <FaUserTimes className="text-red-600" />
                Suspend User
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">Name:</span> {userName}</div>
              <div><span className="font-medium">Email:</span> {userEmail}</div>
              <div><span className="font-medium">Phone:</span> {userPhone}</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {isCurrentlySuspended ? (
            // Unsuspend Form
            <div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to unsuspend this user? They will be able to access the platform again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnsuspend}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Unsuspending...
                    </>
                  ) : (
                    <>
                      <FaUserCheck />
                      Unsuspend User
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Suspend Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter the reason for suspending this user..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent suspension
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Suspending...
                    </>
                  ) : (
                    <>
                      <FaUserTimes />
                      Suspend User
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuspensionModal; 