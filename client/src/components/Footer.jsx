import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
              Gharelu
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Your trusted partner in finding the perfect home. Experience seamless property dealings with Gharelu.
            </p>
            <div className="flex space-x-5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transform hover:scale-110 transition-all"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transform hover:scale-110 transition-all"
              >
                <FaTwitter size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transform hover:scale-110 transition-all"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transform hover:scale-110 transition-all"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative inline-block">
              Quick Links
              <div className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-indigo-600"></div>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/properties" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all inline-block">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/agents" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all inline-block">
                  Agents
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative inline-block">
              Contact Us
              <div className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-indigo-600"></div>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-400">
                <FaPhone className="text-indigo-500" />
                <span>+977 1234567890</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <FaEnvelope className="text-indigo-500" />
                <span>contact@gharelu.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <FaMapMarkerAlt className="text-indigo-500" />
                <span>Kathmandu, Nepal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Gharelu. All rights reserved. | Made with ❤️ in Nepal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

