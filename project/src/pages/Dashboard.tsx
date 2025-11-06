import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PublicationTrendChart from "../components/charts/PublicationTrendChart";
import TopicDistributionChart from "../components/charts/TopicDistributionChart";
import CitationTrendChart from "../components/charts/CitationTrendChart";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [publicationsList, setPublicationsList] = useState([]);
  const [publicationTrends, setPublicationTrends] = useState<Array<{ year: number; count: number }>>([]);
  const [topics, setTopics] = useState<Array<{ topic: string; count: number }>>([]);

  console.log(id);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch publications
        let response = await axios.get(
          `http://localhost:5002/api/faculty/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPublicationsList(response.data);

        // Fetch profile details
        response = await axios.get(`http://localhost:5002/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data);

        // Fetch publication trends
        response = await axios.get(`http://localhost:5002/api/analytics/faculty/${id}/trends`);
        setPublicationTrends(response.data.trends || []);

        // Fetch research topics
        response = await axios.get(`http://localhost:5002/api/analytics/faculty/${id}/topics`);
        setTopics(response.data.topics || []);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading || !profileData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-maroon-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-gray-800 shadow-xl overflow-hidden rounded-xl mb-8 border border-gray-700">
        <div className="px-6 py-5 bg-gradient-to-r from-maroon-600 to-maroon-800 text-white">
          <h3 className="text-xl leading-6 font-semibold">
            Research Dashboard
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-100">
            Personal research metrics and analytics
          </p>
        </div>
        <div className="border-t border-gray-700 px-6 py-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:space-x-6">
              <div className="mt-4 sm:mt-0">
                <h1 className="text-3xl font-bold text-gray-100">
                  {profileData.name}
                </h1>
                <p className="text-gray-300 mt-1">
                  {profileData.designation}, {profileData.department}
                </p>
                <div className="mt-3 flex items-center text-sm text-gray-400">
                  <BookOpen className="mr-2 h-4 w-4 text-maroon-400" />
                  <a 
                    href={profileData.googleScholarUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-maroon-400 transition-colors"
                  >
                    Google Scholar Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: <Users className="h-8 w-8 text-maroon-400" />,
            label: "Total Citations",
            value: profileData.citationCount,
          },
          {
            icon: <Award className="h-8 w-8 text-maroon-400" />,
            label: "h-index",
            value: profileData.hIndex,
          },
          {
            icon: <TrendingUp className="h-8 w-8 text-maroon-400" />,
            label: "i10-index",
            value: profileData.i10Index,
          },
        ].map((item, i) => (
          <div key={i} className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700 hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-700 p-3 rounded-lg">{item.icon}</div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      {item.label}
                    </dt>
                    <dd>
                      <div className="text-2xl font-bold text-gray-100 mt-1">
                        {item.value || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Citations Over Time */}
        {profileData.citationHistory && profileData.citationHistory.length > 0 && (
          <CitationTrendChart 
            data={profileData.citationHistory} 
            title="Citations by Year"
          />
        )}

        {/* Publications Trend */}
        {publicationTrends.length > 0 && (
          <PublicationTrendChart 
            data={publicationTrends} 
            title="Publications by Year"
          />
        )}
      </div>

      {/* Research Topics */}
      {topics.length > 0 && (
        <div className="mb-8">
          <TopicDistributionChart 
            data={topics} 
            title="Research Topics Distribution"
          />
        </div>
      )}

      {/* Citations Over Time */}
      {/* <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Citations Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={citations}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="citations"
                  stroke="#8E354A"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div> */}

      {/* Research Areas */}
      {/* <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Research Areas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={researchAreas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {researchAreas.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}

      {/* Co-author Network */}
      {/* <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Co-author Network</h3>
          <div className="h-80 flex flex-col items-center justify-center">
            <Network className="h-16 w-16 text-maroon-600 mb-4" />
            <p className="text-gray-500 text-center">
              Interactive network visualization of your co-authors and their
              connections.
            </p>
            <button className="mt-4 px-4 py-2 bg-maroon-600 text-white rounded hover:bg-maroon-700 transition-colors">
              View Full Network
            </button>
          </div>
        </div>
      </div> */}

      {/* Recent Publications Table */}
      <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden mb-8 border border-gray-700">
        <div className="px-6 py-5 bg-gradient-to-r from-maroon-600 to-maroon-800 text-white">
          <h3 className="text-xl leading-6 font-semibold">
            Most Cited Publications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Journal
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Authors
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Citations
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {publicationsList.map((pub: any) => (
                <tr key={pub._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-100">
                    {pub.paper_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {pub.paper_journal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {pub.paper_year}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-300">
                    {pub.paper_authors?.join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-maroon-400">
                    {pub.paper_citations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
