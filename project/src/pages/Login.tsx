import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import axios from "axios"; // Import axios

const Login: React.FC = (props) => {
  const {setLoggedID} = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      const response = await axios.post("http://localhost:5002/login", {
        email,
        password,
      });

      const { userId } = response.data;
      console.log(userId);
      setLoggedID(userId);
      // Persist logged in user id for UI-level checks (e.g., show delete)
      try {
        localStorage.setItem('userId', String(userId));
      } catch (e) {
        console.warn('Unable to persist userId to localStorage', e);
      }
      navigate(`/dashboard/${userId}`);
    } catch (err) {
      setError("Failed to sign in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
        <div>
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-maroon-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{" "}
            <Link
              to="/create-profile"
              className="font-medium text-maroon-400 hover:text-maroon-300 transition-colors"
            >
              create your faculty profile
            </Link>
          </p>
        </div>

        {error && (
          <div
            className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative flex items-center"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm transition-colors"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-600 bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm transition-colors"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-maroon-600 hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-maroon-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
