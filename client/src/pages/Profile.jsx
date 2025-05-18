import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { API_URL } from '../config/api';

export default function Profile() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');

  // Debug user photo info
  useEffect(() => {
    if (user) {
      console.log('User in Profile component:', {
        username: user.username,
        photo: user.photo,
        isAgent: user.isAgent,
        agentPhotoUrl: user.isAgent ? user.agentRequest?.profilePhotoUrl : null
      });
    }
  }, [user]);

  useEffect(() => {
    // Check for any messages passed via location state
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSignOut = async () => {
    try {
      await signout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAgentStatusBadge = () => {
    // First, log the current user status for debugging
    console.log('User status check:', {
      id: user?._id,
      username: user?.username,
      isAgent: user?.isAgent, 
      hasAgentRequest: !!user?.agentRequest,
      agentRequestStatus: user?.agentRequest?.status
    });
    
    // Check if user is an agent
    if (user?.isAgent) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle w-3 h-3 mr-1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Verified Agent
        </span>
      );
    } 
    // Check if user has a pending agent request
    else if (user?.agentRequest?.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3 h-3 mr-1">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Agent Application Pending
        </span>
      );
    }
    // Check if user has a rejected agent request
    else if (user?.agentRequest?.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle w-3 h-3 mr-1">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Agent Application Rejected
        </span>
      );
    }
    
    // Default case for regular users
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-3 h-3 mr-1">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Regular User
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to view your profile.
          </p>
          <button 
            onClick={() => navigate('/signin')}
            className="w-full bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                {user.isAgent && user.agentRequest?.profilePhotoUrl ? (
                  <img 
                    src={`${API_URL}${user.agentRequest.profilePhotoUrl}`} 
                    alt={user.username} 
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                    }}
                  />
                ) : user.photo ? (
                  <img 
                    src={user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo}`} 
                    alt={user.username} 
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                    }}
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <p className="text-gray-300">{user.email}</p>
                <div className="mt-2">
                  {getAgentStatusBadge()}
                </div>
              </div>
              <div className="ml-auto mt-4 md:mt-0">
                <button
                  onClick={handleSignOut}
                  className="bg-transparent border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-gray-900 transition duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p>{user.username}</p>
                  </div>
                </div>
                
                {user.isAdmin && (
                  <div className="flex items-start">
                    <Award className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p>Administrator</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Regular User Profile Photo */}
              {!user.isAgent && user.photo && (
                <div className="space-y-4">
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Profile Photo</p>
                    <div className="h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo}`}
                        alt="Profile" 
                        className="h-full w-full object-cover"
                        onError={(e) => e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Agent Information */}
              {user.isAgent && user.agentRequest && (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{user.agentRequest.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p>{user.agentRequest.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className="w-5 h-5 text-gray-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p>{user.agentRequest.experience} years</p>
                    </div>
                  </div>

                  {user.agentRequest.profilePhotoUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Profile Photo</p>
                      <div className="h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={`${API_URL}${user.agentRequest.profilePhotoUrl}`}
                          alt="Profile" 
                          className="h-full w-full object-cover"
                          onError={(e) => e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Agent Application Status */}
            {user.agentRequest && user.agentRequest.status && !user.isAgent && (
              <div className="mt-8 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Agent Application Status</h3>
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    user.agentRequest.status === 'pending' ? 'bg-yellow-500' : 
                    user.agentRequest.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <p className="capitalize">{user.agentRequest.status}</p>
                </div>
                
                {user.agentRequest.status === 'pending' && (
                  <p className="text-sm text-gray-500">
                    Your application is currently under review. We will notify you once it has been processed.
                  </p>
                )}
                
                {user.agentRequest.status === 'rejected' && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Unfortunately, your application was not approved.
                    </p>
                    {user.agentRequest.reason && (
                      <p className="text-sm mb-4">
                        <span className="font-medium">Reason:</span> {user.agentRequest.reason}
                      </p>
                    )}
                    <button
                      onClick={() => navigate('/joinagent')}
                      className="mt-2 bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                    >
                      Apply Again
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Your previous application will be cleared automatically when you apply again.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {user.isAdmin && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Admin Dashboard
                </button>
              )}
              
              {user.isAgent && (
                <>
                  <button
                    onClick={() => navigate('/edit-agent-profile')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Edit Agent Profile
                  </button>
                  <button
                    onClick={() => navigate(`/agent/${user._id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    View Public Profile
                  </button>
                </>
              )}
              
              {!user.isAgent && !user.isAdmin && (
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Edit Profile
                </button>
              )}
              
              {!user.isAgent && !user.agentRequest?.status && (
                <button
                  onClick={() => navigate('/joinagent')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Become an Agent
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
