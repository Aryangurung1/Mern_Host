import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from "react-toastify";
import { API_URL } from '../config/api';

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user, api } = useAuth();
  const navigate = useNavigate();
  
  // API base URL for images - using config value
  const apiBaseUrl = API_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Fetch approved agents
        const agentsRes = await api.get('/api/admin/agents');
        
        // Filter out any malformed data
        const validAgents = (agentsRes.data || []).filter(agent => 
          agent && agent._id
        );
        
        setAgents(validAgents);

        // Fetch pending agent requests
        const pendingRes = await api.get('/api/admin/pending-requests');
        
        // Filter out any malformed data
        const validPendingRequests = (pendingRes.data || []).filter(request => 
          request && request._id && request.agentRequest && request.agentRequest.status === 'pending'
        );
        
        setPendingRequests(validPendingRequests);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(prev => prev + " " + (error.message || "Error fetching data"));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!user) {
      navigate('/signin', { state: { from: '/admin' } });
      return;
    }

    if (!user.isAdmin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate, api]);

  const handleDeleteAgent = async (userId) => {
    if (!window.confirm("Are you sure you want to revoke this agent's access? They will no longer be able to list properties as an agent and all agent data will be removed.")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // First revoke the agent status
      await api.post(`/api/admin/revoke/${userId}`);
      
      // Then completely clear the agent data
      await api.delete(`/api/admin/clear-agent-data/${userId}`);

      // Update local state to reflect the change
      const revokedAgent = agents.find(agent => agent._id === userId);
      setAgents(prev => prev.filter(agent => agent._id !== userId));
      
      if (revokedAgent) {
        toast.warning(`Agent access for ${revokedAgent.username || revokedAgent.email} has been revoked and all agent data has been removed.`);
      }
    } catch (error) {
      console.error("Error revoking agent access:", error);
      setError(error.message);
      toast.error(`Failed to revoke access: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewAgentDetails = (agent) => {
    // Ensure the agent object has required structure
    if (!agent.agentRequest || typeof agent.agentRequest !== 'object') {
      agent.agentRequest = {};
    }
    
    // Clean up photo URLs if they contain full file paths
    if (agent.agentRequest?.profilePhotoUrl && agent.agentRequest.profilePhotoUrl.includes('C:/Users')) {
      // Extract just the filename from the path
      const profileFilename = agent.agentRequest.profilePhotoUrl.split('/').pop();
      agent.agentRequest.profilePhotoUrl = `/uploads/${profileFilename}`;
    }
    
    if (agent.agentRequest?.citizenshipPhotoUrl && agent.agentRequest.citizenshipPhotoUrl.includes('C:/Users')) {
      // Extract just the filename from the path
      const citizenshipFilename = agent.agentRequest.citizenshipPhotoUrl.split('/').pop();
      agent.agentRequest.citizenshipPhotoUrl = `/uploads/${citizenshipFilename}`;
    }
    
    setSelectedAgent(agent);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAgent(null);
  };

  const getUserTypeBadge = (user) => {
    if (user.isAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-shield w-3 h-3 mr-1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Admin
        </span>
      );
    } else if (user.isAgent) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-check-circle w-3 h-3 mr-1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Agent
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-user w-3 h-3 mr-1">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Regular User
        </span>
      );
    }
  };

  const handleApproveAgent = async (userId) => {
    if (!window.confirm("Are you sure you want to approve this agent?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      await api.put(`/api/admin/agent-status/${userId}`, {
        status: 'approved'
      });

      // Update local state to reflect the change
      const approvedAgent = pendingRequests.find(request => request._id === userId);
      setPendingRequests(prev => prev.filter(request => request._id !== userId));
      
      // Refresh data to see the newly approved agent in the agents list
      fetchData();
      
      if (approvedAgent) {
        toast.success(`Agent application for ${approvedAgent.username || approvedAgent.email} has been approved.`);
      }
    } catch (error) {
      console.error("Error approving agent:", error);
      setError(error.message);
      toast.error(`Failed to approve agent: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAgent = async (userId) => {
    const reason = window.prompt("Please provide a reason for rejection (will be shown to the user):");
    if (reason === null) {
      return; // User cancelled the prompt
    }
    
    try {
      setLoading(true);
      
      // First, update the agent status to rejected
      await api.put(`/api/admin/agent-status/${userId}`, {
        status: 'rejected',
        reason: reason || 'Application did not meet our requirements.'
      });
      
      // Then completely clear the agent data
      await api.delete(`/api/admin/clear-agent-data/${userId}`);

      // Update local state to reflect the change
      const rejectedAgent = pendingRequests.find(request => request._id === userId);
      setPendingRequests(prev => prev.filter(request => request._id !== userId));
      
      if (rejectedAgent) {
        toast.warning(`Agent application for ${rejectedAgent.username || rejectedAgent.email} has been rejected and removed.`);
      }
    } catch (error) {
      console.error("Error rejecting agent:", error);
      setError(error.message);
      toast.error(`Failed to reject agent: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !agents.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Pending Agent Requests Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pending Agent Requests</h2>
          {loading && pendingRequests.length === 0 ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending agent requests found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted On
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.username || request.agentRequest?.fullName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.email || request.agentRequest?.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.agentRequest?.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {request.agentRequest?.specialization || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.agentRequest?.submittedAt
                          ? new Date(request.agentRequest.submittedAt).toLocaleDateString()
                          : new Date(request.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewAgentDetails(request)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleApproveAgent(request._id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectAgent(request._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Registered Agents Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Registered Agents</h2>
          {loading && agents.length === 0 ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : agents.length === 0 ? (
            <p className="text-gray-500">No registered agents found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered On
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.username || agent.agentRequest?.fullName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.email || agent.agentRequest?.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.agentRequest?.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {agent.agentRequest?.specialization || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.agentApprovedAt
                          ? new Date(agent.agentApprovedAt).toLocaleDateString()
                          : new Date(agent.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewAgentDetails(agent)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                            disabled={loading}
                          >
                            Revoke Access
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Agent Details Modal */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold">
                  {selectedAgent.agentRequest?.fullName || selectedAgent.username || "Agent Details"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                    <p className="text-gray-900">
                      {selectedAgent.agentRequest?.fullName || selectedAgent.username || "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="text-gray-900">
                      {selectedAgent.agentRequest?.email || selectedAgent.email || "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <p className="text-gray-900">
                      {selectedAgent.agentRequest?.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Specialization</h4>
                    <p className="text-gray-900 capitalize">
                      {selectedAgent.agentRequest?.specialization || "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created Date</h4>
                    <p className="text-gray-900">
                      {new Date(selectedAgent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">User Type</h4>
                    <p className="text-gray-900">
                      {getUserTypeBadge(selectedAgent)}
                    </p>
                  </div>
                </div>

                {/* Image Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {selectedAgent.agentRequest?.profilePhotoUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Profile Photo</h4>
                      <div className="h-56 w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={selectedAgent.agentRequest?.profilePhotoUrl
                            ? `${apiBaseUrl}${selectedAgent.agentRequest.profilePhotoUrl}`
                            : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                          alt="Profile" 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedAgent.agentRequest?.citizenshipPhotoUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Citizenship Photo</h4>
                      <div className="h-56 w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={selectedAgent.agentRequest?.citizenshipPhotoUrl
                            ? `${apiBaseUrl}${selectedAgent.agentRequest.citizenshipPhotoUrl}`
                            : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                          alt="Citizenship" 
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Experience</h4>
                  <p className="text-gray-900 whitespace-pre-line">
                    {selectedAgent.agentRequest?.experience || "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">License Information</h4>
                  <p className="text-gray-900">
                    {selectedAgent.agentRequest?.licenseInfo || "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Citizenship Number</h4>
                  <p className="text-gray-900">
                    {selectedAgent.agentRequest?.citizenshipNo || "—"}
                  </p>
                </div>

                <div className="flex space-x-2 mt-6">
                  <button
                    onClick={() => {
                      closeModal();
                      handleDeleteAgent(selectedAgent._id);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    disabled={loading}
                  >
                    Revoke Access
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}