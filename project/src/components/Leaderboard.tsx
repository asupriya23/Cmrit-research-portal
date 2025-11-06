import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Researcher {
  user_id: number;
  name: string;
  department: string;
  designation: string;
  citationCount: number;
  hIndex: number;
  i10Index: number;
  profilePic?: string;
}

interface MostActiveDept {
  department: string;
  publicationsThisYear: number;
  facultyCount: number;
  totalCitations: number;
  avgHIndex: number;
}

interface LeaderboardProps {
  limit?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 5 }) => {
  const [topResearchers, setTopResearchers] = useState<Researcher[]>([]);
  const [mostActiveDept, setMostActiveDept] = useState<MostActiveDept | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchLeaderboardData();
  }, [limit]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const [researchersRes, deptRes] = await Promise.all([
        axios.get(`http://localhost:5002/api/analytics/leaderboard/top-researchers?limit=${limit}`),
        axios.get(`http://localhost:5002/api/analytics/leaderboard/most-active-department`)
      ]);
      
      setTopResearchers(researchersRes.data.topResearchers || []);
      setMostActiveDept(deptRes.data.mostActiveDepartment || null);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'text-yellow-400'; // Gold
      case 1: return 'text-gray-400'; // Silver
      case 2: return 'text-orange-600'; // Bronze
      default: return 'text-gray-500';
    }
  };

  const getMedalBg = (position: number) => {
    switch (position) {
      case 0: return 'bg-yellow-100 border-yellow-400';
      case 1: return 'bg-gray-100 border-gray-400';
      case 2: return 'bg-orange-100 border-orange-600';
      default: return 'bg-gray-700 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-400"></div>
        <p className="text-gray-400 mt-2">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Researchers */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <div className="flex items-center mb-6">
          <Award className="h-8 w-8 text-maroon-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-100">Top {limit} Researchers by Citations</h2>
        </div>
        
        <div className="space-y-4">
          {topResearchers.map((researcher, index) => (
            <div
              key={researcher.user_id}
              onClick={() => navigate(`/dashboard/${researcher.user_id}`)}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-lg ${
                index < 3 ? getMedalBg(index) : 'bg-gray-700 border-gray-600 hover:border-maroon-400'
              }`}
            >
              {/* Position */}
              <div className={`text-3xl font-bold w-12 ${index < 3 ? getMedalColor(index) : 'text-gray-400'}`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              
              {/* Profile Picture */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 ml-4 flex-shrink-0">
                {researcher.profilePic ? (
                  <img 
                    src={researcher.profilePic} 
                    alt={researcher.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                    {researcher.name.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Researcher Info */}
              <div className="ml-4 flex-grow">
                <h3 className={`text-lg font-semibold ${index < 3 ? 'text-gray-900' : 'text-gray-100'}`}>
                  {researcher.name}
                </h3>
                <p className={`text-sm ${index < 3 ? 'text-gray-700' : 'text-gray-400'}`}>
                  {researcher.designation} • {researcher.department}
                </p>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${index < 3 ? 'text-gray-900' : 'text-maroon-400'}`}>
                    {researcher.citationCount || 0}
                  </div>
                  <div className={`text-xs ${index < 3 ? 'text-gray-600' : 'text-gray-500'}`}>
                    Citations
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${index < 3 ? 'text-gray-900' : 'text-maroon-400'}`}>
                    {researcher.hIndex || 0}
                  </div>
                  <div className={`text-xs ${index < 3 ? 'text-gray-600' : 'text-gray-500'}`}>
                    h-index
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${index < 3 ? 'text-gray-900' : 'text-maroon-400'}`}>
                    {researcher.i10Index || 0}
                  </div>
                  <div className={`text-xs ${index < 3 ? 'text-gray-600' : 'text-gray-500'}`}>
                    i10-index
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Active Department */}
      {mostActiveDept && (
        <div className="bg-gradient-to-br from-maroon-600 to-maroon-800 rounded-xl shadow-xl p-6 border border-maroon-700">
          <div className="flex items-center mb-6">
            <TrendingUp className="h-8 w-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">Most Active Department ({currentYear})</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-4">
              {mostActiveDept.department}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-xl p-4 border border-white/30 hover:bg-white/25 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white text-center">
                  {mostActiveDept.publicationsThisYear}
                </div>
                <div className="text-sm text-white/80 text-center mt-1">
                  Publications This Year
                </div>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 border border-white/30 hover:bg-white/25 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white text-center">
                  {mostActiveDept.facultyCount}
                </div>
                <div className="text-sm text-white/80 text-center mt-1">
                  Faculty Members
                </div>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 border border-white/30 hover:bg-white/25 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white text-center">
                  {mostActiveDept.totalCitations.toLocaleString()}
                </div>
                <div className="text-sm text-white/80 text-center mt-1">
                  Total Citations
                </div>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4 border border-white/30 hover:bg-white/25 transition-colors">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white text-center">
                  {mostActiveDept.avgHIndex}
                </div>
                <div className="text-sm text-white/80 text-center mt-1">
                  Avg h-index
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
