import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faCog, 
  faPhoneAlt, 
  faChartLine,
  faCalendarPlus, 
  faUsers, 
  faChalkboardUser,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              EduScheduler
            </h2>
            <p className="text-gray-300 mb-4 text-sm">
              Intelligent classroom and timetable management for higher education institutions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="/suggestions"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                Suggestions
              </Link>
              <Link 
                to="/settings"
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Settings
              </Link>
              <Link 
                to="/contact"
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <FontAwesomeIcon icon={faPhoneAlt} className="mr-2" />
                Contact
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition flex items-center group">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 group-hover:scale-150 transition-transform"></span>
                  <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-400 group-hover:text-white transition-colors" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/create-timetable" className="text-gray-300 hover:text-white transition flex items-center group">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 group-hover:scale-150 transition-transform"></span>
                  <FontAwesomeIcon icon={faCalendarPlus} className="mr-2 text-green-400 group-hover:text-white transition-colors" />
                  Timetables
                </Link>
              </li>
              <li>
                <Link to="/faculty" className="text-gray-300 hover:text-white transition flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:scale-150 transition-transform"></span>
                  <FontAwesomeIcon icon={faUsers} className="mr-2 text-purple-400 group-hover:text-white transition-colors" />
                  Faculty
                </Link>
              </li>
              <li>
                <Link to="/classrooms" className="text-gray-300 hover:text-white transition flex items-center group">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2 group-hover:scale-150 transition-transform"></span>
                  <FontAwesomeIcon icon={faChalkboardUser} className="mr-2 text-orange-400 group-hover:text-white transition-colors" />
                  Classrooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Get Help</h3>
            <div className="space-y-3 text-sm">
              <Link to="/contact" className="flex items-center space-x-2 p-2 bg-blue-800/30 rounded-md hover:bg-blue-800/50 transition">
                <div className="text-lg">
                  <FontAwesomeIcon icon={faPhoneAlt} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-xs text-gray-300">24/7 assistance available</p>
                </div>
              </Link>
              <div className="p-3 bg-gradient-to-r from-blue-800/40 to-purple-800/40 rounded-md border border-blue-500/30">
                <p className="text-xs text-gray-200">
                  <FontAwesomeIcon icon={faLightbulb} className="mr-1 text-yellow-400" />
                  <strong>Pro Tip:</strong> Use our smart scheduling features to optimize resources.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-blue-700 mt-6 pt-4 text-center text-xs">
          <p className="text-gray-300">
            © 2025 <span className="text-white font-semibold">Smart Scheduler</span>. All rights reserved.
          </p>
          <p className="text-gray-400 mt-1">
            Built with <FontAwesomeIcon icon={faHeart} className="text-red-500 mx-1" /> for educational institutions
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;