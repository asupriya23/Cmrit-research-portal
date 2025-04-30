import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    googleScholarUrl: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  const signUp = async (
    name: string,
    email: string,
    password: string,
    googleScholarUrl: string
  ) => {
    await axios.post("http://localhost:5000/register", {
      name,
      email,
      password,
      googleScholarUrl,
    });
    // Optionally sign in directly after register
  };

  const signIn = async (email: string, password: string) => {
    const response = await axios.post("http://localhost:5000/login", {
      email,
      password,
    });
    const receivedToken = response.data.token;
    localStorage.setItem("token", receivedToken);
    setToken(receivedToken);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const value = { token, loading, signUp, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
