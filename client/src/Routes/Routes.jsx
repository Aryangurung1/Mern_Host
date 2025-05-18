import React from 'react'
import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom'
import HomePage from '../pages/Home';
import Properties from '../pages/Properties';
import PropertyDetail from '../pages/PropertyDetail';
import AddProperty from '../pages/AddProperty';
import EditProperty from '../pages/EditProperty';
import Agents from '../pages/Agents';
import Blog from '../pages/Blog';
import Signin from '../pages/Signin';
import Signup from '../pages/Signup';
import Agentprofile from '../pages/Agentprofile';
import Joinagent from '../pages/JoinAgent';
import UserDashboard from '../pages/UserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import AgentDashboard from '../pages/AgentDashboard';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import EditAgentProfile from '../pages/EditAgentProfile';
import Chat from '../pages/Chat';
import { useAuth } from '../context/AuthContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

const PrivateRoute = ({ children, adminOnly = false, agentOnly = false }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while auth state is being checked
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" />;
  }

  if (agentOnly && !user.isAgent) {
    return <Navigate to="/profile" />;
  }

  return children;
};

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<HomePage />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/properties/:id" element={<PropertyDetail />} />
      <Route path="/properties/:id/edit" element={
        <PrivateRoute agentOnly>
          <EditProperty />
        </PrivateRoute>
      } />
      <Route path="/add-property" element={
        <PrivateRoute agentOnly>
          <AddProperty />
        </PrivateRoute>
      } />
      <Route path="/agents" element={<Agents />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/agent/:id" element={<Agentprofile />} />
      <Route path="/agent/:id/listings" element={<Agentprofile />} />
      <Route path="/joinagent" element={<Joinagent />} />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      
      <Route path="/edit-profile" element={
        <PrivateRoute>
          <EditProfile />
        </PrivateRoute>
      } />
      
      <Route path="/edit-agent-profile" element={
        <PrivateRoute agentOnly>
          <EditAgentProfile />
        </PrivateRoute>
      } />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <UserDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/agent/dashboard" element={
        <PrivateRoute agentOnly>
          <AgentDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/admin/dashboard" element={
        <PrivateRoute adminOnly>
          <AdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/chat" element={
        <PrivateRoute>
          <Chat />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  )
}

export default Routes;