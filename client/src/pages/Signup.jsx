import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signin, api } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.username || !formData.email || !formData.password) {
        throw new Error("All fields are required");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Username validation
      if (formData.username.length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error("Username can only contain letters, numbers, and underscores");
      }

      // Prepare data in the format expected by the backend
      const signupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      // First register the user
      const response = await api.post('/api/auth/signup', signupData);
      
      if (response.data) {
        // If registration is successful, automatically log the user in
        try {
          await signin({ 
            email: formData.email, 
            password: formData.password 
          });
          navigate('/properties');
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          // If auto-login fails, show success message and redirect to signin
          navigate('/signin', { 
            state: { message: "Registration successful! Please sign in." }
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message || // Server error message
        error.message || // Client-side validation error
        "Failed to register. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center mb-2">Create Account</h1>
          <p className="text-gray-600 text-center mb-8">Please fill in your details to register</p>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex border-b mb-8">
            <NavLink
              to="/signin"
              className={({ isActive }) =>
                `flex-1 pb-4 text-center font-medium ${
                  isActive ? "border-b-2 border-black text-black" : "text-gray-500"
                }`
              }
            >
              Sign In
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `flex-1 pb-4 text-center font-medium ${
                  isActive ? "border-b-2 border-black text-black" : "text-gray-500"
                }`
              }
            >
              Sign Up
            </NavLink>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-3 py-2 border rounded-md text-sm"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              By signing up, you agree to our{" "}
              <NavLink to="/terms" className="text-black hover:underline">
                Terms of Service
              </NavLink>{" "}
              and{" "}
              <NavLink to="/privacy" className="text-black hover:underline">
                Privacy Policy
              </NavLink>
            </div>

            <button 
              type="submit" 
              className="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                "Sign up"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}