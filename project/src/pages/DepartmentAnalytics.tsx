import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PublicationTrendChart from '../components/charts/PublicationTrendChart';
import TopicDistributionChart from '../components/charts/TopicDistributionChart';
import { Users, Award, BookOpen, TrendingUp } from 'lucide-react';

interface DepartmentData {
  department: string;
  facultyCount: number;
  totalPublications: number;
  totalCitations: number;
  avgHIndex: number;
  avgI10Index: number;
  publicationTrends: Array<{ year: number; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
}

const departments = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Management Studies",
  "Mathematics",
  "Physics",
  "Chemistry"
];

const DepartmentAnalytics: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0]);
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartmentData(selectedDepartment);
  }, [selectedDepartment]);

  const fetchDepartmentData = async (department: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5002/api/analytics/department/${encodeURIComponent(department)}`
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching department analytics:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Department Analytics Dashboard</h1>
        
        {/* Department Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="block w-full md:w-1/2 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-maroon-400 focus:border-maroon-400"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center text-gray-300 py-10">Loading department data...</div>
        )}

        {!loading && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-gray-600 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-maroon-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-100">{data.facultyCount}</span>
                </div>
                <p className="text-sm text-gray-300">Faculty Members</p>
              </div>

              <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-gray-600 p-2 rounded-lg">
                    <BookOpen className="h-6 w-6 text-maroon-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-100">{data.totalPublications}</span>
                </div>
                <p className="text-sm text-gray-300">Total Publications</p>
              </div>

              <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-gray-600 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-maroon-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-100">{data.totalCitations}</span>
                </div>
                <p className="text-sm text-gray-300">Total Citations</p>
              </div>

              <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-gray-600 p-2 rounded-lg">
                    <Award className="h-6 w-6 text-maroon-400" />
                  </div>
                  <span className="text-3xl font-bold text-gray-100">{data.avgHIndex}</span>
                </div>
                <p className="text-sm text-gray-300">Avg h-index</p>
                <p className="text-xs text-gray-400 mt-1">i10: {data.avgI10Index}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PublicationTrendChart 
                data={data.publicationTrends} 
                title="Publications Per Year"
              />
              
              <TopicDistributionChart 
                data={data.topTopics.slice(0, 10)} 
                title="Top Research Topics"
              />
            </div>

            {/* Top Topics Table */}
            <div className="bg-gray-700 p-6 rounded-xl border border-gray-600 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Research Keywords</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {data.topTopics.map((topic, idx) => (
                  <div key={idx} className="bg-gray-600 px-3 py-2 rounded-lg text-center border border-gray-500 hover:border-maroon-400 transition-colors">
                    <p className="text-sm font-medium text-gray-100 capitalize">{topic.topic}</p>
                    <p className="text-xs text-gray-400">{topic.count} papers</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && !data && (
          <div className="text-center text-gray-400 py-10">No data available for this department</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
