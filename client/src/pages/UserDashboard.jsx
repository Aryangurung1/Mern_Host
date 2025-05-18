import { Heart, MessageSquare, User, Bell } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Sabin!</h1>
          <p className="text-gray-500 text-sm">Last login: Today at 9:30 AM</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
            <div className="mr-4 text-gray-900">
              <Heart size={24} />
            </div>
            <div>
              <div className="text-xl font-bold">8</div>
              <div className="text-gray-500">Saved Properties</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
            <div className="mr-4 text-gray-900">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="text-xl font-bold">3</div>
              <div className="text-gray-500">Active Inquiries</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
            <div className="mr-4 text-gray-900">
              <User size={24} />
            </div>
            <div>
              <div className="text-xl font-bold">65%</div>
              <div className="text-gray-500">Profile Complete</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <a
              href="#"
              className="border-b-2 border-indigo-600 py-4 px-1 text-center w-1/3 md:w-auto md:pr-8 font-medium text-indigo-600"
            >
              Saved Properties
            </a>
            <a
              href="#"
              className="border-b-2 border-transparent py-4 px-1 text-center w-1/3 md:w-auto md:px-8 font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Inquiry History
            </a>
            <a
              href="#"
              className="border-b-2 border-transparent py-4 px-1 text-center w-1/3 md:w-auto md:pl-8 font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Profile Settings
            </a>
          </nav>
        </div>

        {/* Property Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Property 1 */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative h-48 overflow-hidden">
              <img
                src="/placeholder.svg?height=200&width=400"
                alt="Modern Villa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">Modern Villa</h3>
              <p className="text-gray-500 text-sm mb-3">123 Main Street, New York</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  4 Beds
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  3 Baths
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                  2,500 sqft
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">₹850,000</div>
                <button className="bg-black text-white px-4 py-2 rounded text-sm">View Details</button>
              </div>
            </div>
          </div>

          {/* Property 2 */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative h-48 overflow-hidden">
              <img
                src="/placeholder.svg?height=200&width=400"
                alt="Luxury Apartment"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">Luxury Apartment</h3>
              <p className="text-gray-500 text-sm mb-3">456 Park Avenue, New York</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  3 Beds
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  2 Baths
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                  1,800 sqft
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">₹650,000</div>
                <button className="bg-black text-white px-4 py-2 rounded text-sm">View Details</button>
              </div>
            </div>
          </div>

          {/* Property 3 */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative h-48 overflow-hidden">
              <img
                src="/placeholder.svg?height=200&width=400"
                alt="Classic Townhouse"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">Classic Townhouse</h3>
              <p className="text-gray-500 text-sm mb-3">789 Broadway, New York</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  5 Beds
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  4 Baths
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                  3,200 sqft
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">₹1,200,000</div>
                <button className="bg-black text-white px-4 py-2 rounded text-sm">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

