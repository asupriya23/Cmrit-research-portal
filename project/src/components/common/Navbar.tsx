import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap, Search } from "lucide-react";

const Navbar: React.FC = ({ setLoggedID, loggedID }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Inside your component
  const navigate = useNavigate();

  const signOut = () => {
    setLoggedID(-1);
    navigate("/");
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-maroon-700" />
            <span className="font-bold text-xl text-maroon-700">
              CMRIT Research
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-gray-700 hover:text-maroon-600 font-medium"
          >
            Home
          </Link>
          <Link
            to="/faculty"
            className="text-gray-700 hover:text-maroon-600 font-medium"
          >
            Faculty
          </Link>
          {loggedID != -1 ? (
            <>
              <Link
                to={`/dashboard/${loggedID}`}
                className="text-gray-700 hover:text-maroon-600 font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="text-white bg-maroon-600 hover:bg-maroon-700 px-4 py-2 rounded-md font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-maroon-600 font-medium"
              >
                Login
              </Link>
              <Link
                to="/create-profile"
                className="text-white bg-maroon-600 hover:bg-maroon-700 px-4 py-2 rounded-md font-medium"
              >
                Create Profile
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-gray-700 hover:text-maroon-600"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-2 px-4 shadow-lg">
          <Link
            to="/"
            className="block py-2 text-gray-700 hover:text-maroon-600 font-medium"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <Link
            to="/faculty"
            className="block py-2 text-gray-700 hover:text-maroon-600 font-medium"
            onClick={toggleMenu}
          >
            Faculty
          </Link>
          {loggedID != -1 ? (
            <>
              <Link
                to={`/dashboard/${loggedID}`}
                className="block py-2 text-gray-700 hover:text-maroon-600 font-medium"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  signOut();
                  toggleMenu();
                }}
                className="block w-full text-left py-2 text-gray-700 hover:text-maroon-600 font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block py-2 text-gray-700 hover:text-maroon-600 font-medium"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link
                to="/create-profile"
                className="block py-2 text-gray-700 hover:text-maroon-600 font-medium"
                onClick={toggleMenu}
              >
                Create Profile
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
