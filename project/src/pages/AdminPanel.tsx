import React, { useState } from 'react';
import axios from 'axios';
import { RefreshCw, Mail, Send, Calendar } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleRescrapeAll = async () => {
    if (!confirm('This will rescrape all faculty profiles. This may take several minutes. Continue?')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5002/api/admin/rescrape-all');
      setMessage(`✅ ${response.data.message}`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAllEmails = async () => {
    if (!confirm('This will send monthly stats emails to all faculty with email addresses. Continue?')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5002/api/admin/send-all-stats-emails');
      setMessage(`✅ ${response.data.message}`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSingleEmail = async () => {
    if (!selectedUserId) {
      setMessage('❌ Please enter a user ID');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`http://localhost:5002/api/admin/send-stats-email/${selectedUserId}`);
      setMessage(`✅ ${response.data.message}`);
      setSelectedUserId('');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Admin Panel</h1>
          <p className="text-gray-400 mb-8">Manage automated tasks and notifications</p>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.startsWith('✅') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Cron Job Info */}
          <div className="bg-gray-700 rounded-xl p-6 mb-8 border border-gray-600">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-maroon-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-100">Scheduled Tasks</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span><strong>Monthly Rescrape:</strong> 1st of every month at 2:00 AM</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span><strong>Monthly Emails:</strong> 1st of every month at 9:00 AM</span>
              </div>
            </div>
          </div>

          {/* Manual Actions */}
          <div className="space-y-6">
            {/* Rescrape All */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-6 w-6 text-maroon-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-100">Rescrape All Profiles</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Manually trigger a full rescrape of all faculty profiles from Google Scholar.
                This will update citations, h-index, and publications for all users.
              </p>
                <button
                onClick={handleRescrapeAll}
                disabled={loading}
                className="bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-300 flex items-center shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Rescrape
                  </>
                )}
              </button>
            </div>

            {/* Send All Emails */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <Mail className="h-6 w-6 text-maroon-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-100">Send Monthly Stats to All</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Send monthly research statistics emails to all faculty members who have registered email addresses.
              </p>
              <button
                onClick={handleSendAllEmails}
                disabled={loading}
                className="bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-300 flex items-center shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send All Emails
                  </>
                )}
              </button>
            </div>

            {/* Send Single Email */}
            <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center mb-4">
                <Send className="h-6 w-6 text-maroon-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-100">Send Stats to Single User</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Send monthly statistics email to a specific faculty member by their user ID.
              </p>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="User ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-600 border border-gray-500 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-maroon-400 transition-colors"
                />
                <button
                  onClick={handleSendSingleEmail}
                  disabled={loading || !selectedUserId}
                  className="bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-300 flex items-center shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Email Configuration Notice */}
          <div className="mt-8 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              <strong>⚠️ Note:</strong> Make sure to configure EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD 
              in your .env file for email functionality to work. For Gmail, you need to use an App Password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
