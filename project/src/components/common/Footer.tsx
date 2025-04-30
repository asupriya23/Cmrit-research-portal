import React from 'react';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-gold-500" />
              <span className="font-bold text-xl">CMRIT Research</span>
            </div>
            <p className="mt-4 text-gray-300">
              Showcasing and celebrating the research excellence of CMRIT faculty members.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/faculty" className="text-gray-300 hover:text-white">Faculty</Link>
              </li>
              <li>
                <Link to="/create-profile" className="text-gray-300 hover:text-white">Create Profile</Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gold-500" />
                <span className="text-gray-300">CMRIT Campus, Bengaluru, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-gold-500" />
                <span className="text-gray-300">+91 1234567890</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-gold-500" />
                <span className="text-gray-300">research@cmrit.ac.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} CMRIT Research Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;