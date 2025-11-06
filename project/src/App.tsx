import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import LandingPage from "./pages/LandingPage";
import ProfileCreation from "./pages/ProfileCreation";
import Dashboard from "./pages/Dashboard";
import FacultyExplorer from "./pages/FacultyExplorer";
import Login from "./pages/Login";
import FacultyComparison from "./pages/FacultyComparison";
import DepartmentAnalytics from "./pages/DepartmentAnalytics";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPanel from "./pages/AdminPanel";
import { AuthProvider } from "./context/AuthContext";

function App() {

  const [loggedID, setLoggedID] = useState(-1);

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
          <Navbar setLoggedID = {setLoggedID} loggedID = {loggedID}/>
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login setLoggedID={setLoggedID} />} />
              <Route path="/create-profile" element={<ProfileCreation setLoggedID={setLoggedID} />} />
              <Route path="/dashboard/:id" element={<Dashboard/>} />
              <Route path="/faculty" element={<FacultyExplorer />} />
              <Route path="/compare" element={<FacultyComparison />} />
              <Route path="/department-analytics" element={<DepartmentAnalytics />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
