import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Mail, Lock } from "lucide-react";

export default function Signin() {
  const { user, signin, authInitialized, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Check for message from registration success
  const message = location.state?.message;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Use the signin function from the AuthContext
      await signin({
        email: formData.email,
        password: formData.password
      });
      
      // Navigate to home or the original destination
      const from = location.state?.from || "/";
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while authentication is initializing
  if (!authInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to home if already logged in
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center mb-2">Sign In</h1>
          <p className="text-gray-600 text-center mb-8">Please enter your credentials to continue</p>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 text-sm rounded">
              {message}
            </div>
          )}

          <div className="flex border-b mb-8">
            <Link
              to="/signin"
              className="flex-1 pb-4 text-center font-medium border-b-2 border-black text-black"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex-1 pb-4 text-center font-medium text-gray-500"
            >
              Sign Up
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  required
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link to="/signup" className="text-black hover:underline">
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium flex justify-center items-center"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}