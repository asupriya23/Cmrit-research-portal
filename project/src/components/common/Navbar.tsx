import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";

interface NavbarProps {
  setLoggedID?: React.Dispatch<React.SetStateAction<number>>;
  loggedID?: number;
}

const Navbar: React.FC<NavbarProps> = ({ setLoggedID, loggedID }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Inside your component
  const navigate = useNavigate();

  const signOut = () => {
    if (setLoggedID) setLoggedID(-1);
    navigate("/");
  };

  // Admin mode for dev: toggles a localStorage flag to show admin-only UI
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem("isAdmin") === "true";
    } catch (e) {
      return false;
    }
  });

  const toggleAdmin = () => {
    const next = !isAdmin;
    setIsAdmin(next);
    try {
      localStorage.setItem("isAdmin", next ? "true" : "false");
    } catch (e) {
      console.warn("Unable to persist admin flag", e);
    }
  };
  
  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-maroon-300" />
            <span className="font-bold text-xl text-maroon-300">
              CMRIT Research
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-gray-200 hover:text-maroon-200 font-medium"
          >
            Home
          </Link>
          <Link
            to="/faculty"
            className="text-gray-200 hover:text-maroon-200 font-medium"
          >
            Faculty
          </Link>
          <Link
            to="/leaderboard"
            className="text-gray-200 hover:text-maroon-200 font-medium"
          >
            Leaderboard
          </Link>
          <Link
            to="/compare"
            className="text-gray-200 hover:text-maroon-200 font-medium"
          >
            Compare
          </Link>
          <Link
            to="/department-analytics"
            className="text-gray-200 hover:text-maroon-200 font-medium"
          >
            Analytics
          </Link>
          {loggedID != -1 ? (
            <>
              <Link
                to={`/dashboard/${loggedID}`}
                className="text-gray-200 hover:text-maroon-200 font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="text-white bg-maroon-600 hover:bg-maroon-700 px-4 py-2 rounded-md font-medium"
              >
                Sign Out
              </button>
              <button
                onClick={toggleAdmin}
                className={`ml-3 px-3 py-2 rounded-md border text-sm ${isAdmin ? 'bg-maroon-300 text-gray-900' : 'text-gray-200 border-gray-600'}`}
              >
                {isAdmin ? 'Admin: ON' : 'Admin: OFF'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-200 hover:text-maroon-200 font-medium"
              >
                Login
              </Link>
              <Link
                to="/create-profile"
                className="text-white bg-maroon-600 hover:bg-maroon-700 px-4 py-2 rounded-md font-medium"
              >
                Create Profile
              </Link>
              <button
                onClick={toggleAdmin}
                className={`ml-3 px-3 py-2 rounded-md border text-sm ${isAdmin ? 'bg-maroon-300 text-gray-900' : 'text-gray-200 border-gray-600'}`}
              >
                {isAdmin ? 'Admin: ON' : 'Admin: OFF'}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-gray-200 hover:text-maroon-300 transition-colors"
            aria-label="Toggle menu"
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
        <div className="md:hidden bg-gray-800 border-t border-gray-700 py-2 px-4 shadow-lg">
          <Link
            to="/"
            className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <Link
            to="/faculty"
            className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
            onClick={toggleMenu}
          >
            Faculty
          </Link>
          <Link
            to="/leaderboard"
            className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
            onClick={toggleMenu}
          >
            Leaderboard
          </Link>
          <Link
            to="/compare"
            className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
            onClick={toggleMenu}
          >
            Compare
          </Link>
          <Link
            to="/department-analytics"
            className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
            onClick={toggleMenu}
          >
            Analytics
          </Link>
          {loggedID != -1 ? (
            <>
              <Link
                to={`/dashboard/${loggedID}`}
                className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  signOut();
                  toggleMenu();
                }}
                className="block w-full text-left py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link
                to="/create-profile"
                className="block py-3 text-gray-200 hover:text-maroon-300 font-medium transition-colors"
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
