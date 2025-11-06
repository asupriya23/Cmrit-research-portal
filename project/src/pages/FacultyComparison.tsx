import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, BookOpen, Users } from 'lucide-react';

interface Faculty {
  user_id: number;
  name: string;
  department: string;
  designation: string;
  citationCount: number;
  hIndex: number;
  i10Index: number;
}

interface ComparisonData {
  userId: number;
  name: string;
  department: string;
  designation: string;
  citationCount: number;
  hIndex: number;
  i10Index: number;
  publicationCount: number;
  publicationTrends: Array<{ year: number; count: number }>;
}

const FacultyComparison: React.FC = () => {
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all faculty for selection
    axios.get('http://localhost:5002/api/getAllFaculty')
      .then(res => setAllFaculty(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 faculty members to compare');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5002/api/analytics/compare', {
        userIds: selectedIds
      });
      setComparisonData(response.data.comparison || []);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      alert('Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (userId: number) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter(id => id !== userId));
    } else {
      setSelectedIds([...selectedIds, userId]);
    }
  };

  // Prepare data for combined publication trends chart
  const prepareYearlyData = () => {
    if (comparisonData.length === 0) return [];
    
    const allYears = new Set<number>();
    comparisonData.forEach(faculty => {
      faculty.publicationTrends.forEach(trend => allYears.add(trend.year));
    });

    const sortedYears = Array.from(allYears).sort();
    
    return sortedYears.map(year => {
      const dataPoint: any = { year };
      comparisonData.forEach(faculty => {
        const trend = faculty.publicationTrends.find(t => t.year === year);
        dataPoint[faculty.name] = trend ? trend.count : 0;
      });
      return dataPoint;
    });
  };

  const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Faculty Comparison Dashboard</h1>
        
        {/* Faculty Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Select Faculty to Compare (min 2)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 bg-gray-700 rounded-lg border border-gray-600">
            {allFaculty.map(faculty => (
              <div
                key={faculty.user_id}
                onClick={() => toggleSelection(faculty.user_id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedIds.includes(faculty.user_id)
                    ? 'bg-maroon-600 text-white shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                <p className="font-medium">{faculty.name}</p>
                <p className="text-xs opacity-80">{faculty.department}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || selectedIds.length < 2}
            className="mt-4 px-6 py-3 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-lg"
          >
            {loading ? 'Loading...' : 'Compare Selected Faculty'}
          </button>
        </div>

        {/* Comparison Results */}
        {comparisonData.length > 0 && (
          <>
            {/* Metrics Comparison Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {comparisonData.map((faculty) => (
                <div key={faculty.userId} className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">{faculty.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{faculty.designation}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-maroon-400 mr-2" />
                        <span className="text-sm text-gray-300">Citations</span>
                      </div>
                      <span className="font-bold text-gray-100">{faculty.citationCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-maroon-400 mr-2" />
                        <span className="text-sm text-gray-300">h-index</span>
                      </div>
                      <span className="font-bold text-gray-100">{faculty.hIndex}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-maroon-400 mr-2" />
                        <span className="text-sm text-gray-300">i10-index</span>
                      </div>
                      <span className="font-bold text-gray-100">{faculty.i10Index}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-maroon-400 mr-2" />
                        <span className="text-sm text-gray-300">Publications</span>
                      </div>
                      <span className="font-bold text-gray-100">{faculty.publicationCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Combined Publication Trends Chart */}
            <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Publication Trends Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareYearlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  {comparisonData.map((faculty, idx) => (
                    <Bar key={faculty.userId} dataKey={faculty.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyComparison;
