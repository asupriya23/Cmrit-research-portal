import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  FileText,
  Network,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#5DADE2",
];

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [publications, setPublications] = useState([]);
  const [citations, setCitations] = useState([]);
  const [researchAreas, setResearchAreas] = useState([]);
  const [publicationsList, setPublicationsList] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5002/api/faculty/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = response.data;
        setProfileData(data.profile);
        setPublications(data.publicationsByYear);
        setCitations(data.citationsOverTime);
        setResearchAreas(data.researchAreas);
        setPublicationsList(data.recentPublications);
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
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-maroon-600 to-maroon-800 text-white">
          <h3 className="text-lg leading-6 font-semibold">
            Research Dashboard
          </h3>
          <p className="mt-1 max-w-2xl text-sm">
            Personal research metrics and analytics
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:space-x-6">
              <div className="flex-shrink-0">
                <img
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                  src={
                    profileData.profilePic ||
                    "https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg"
                  }
                  alt="Profile"
                />
              </div>
              <div className="mt-4 sm:mt-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.name}
                </h1>
                <p className="text-gray-600">
                  {profileData.designation}, {profileData.department}
                </p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <BookOpen className="mr-1.5 h-4 w-4 text-maroon-600" />
                  Google Scholar ID: {profileData.scholarId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: <FileText className="h-6 w-6 text-maroon-600" />,
            label: "Total Publications",
            value: profileData.metrics.publications,
          },
          {
            icon: <Users className="h-6 w-6 text-maroon-600" />,
            label: "Total Citations",
            value: profileData.metrics.citations,
          },
          {
            icon: <Award className="h-6 w-6 text-maroon-600" />,
            label: "h-index",
            value: profileData.metrics.hIndex,
          },
          {
            icon: <TrendingUp className="h-6 w-6 text-maroon-600" />,
            label: "i10-index",
            value: profileData.metrics.i10Index,
          },
        ].map((item, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.label}
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {item.value}
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
        {/* Publications by Year */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Publications by Year</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={publications}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8E354A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citations Over Time */}
        <div className="bg-white p-6 rounded-lg shadow">
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
        </div>

        {/* Research Areas */}
        <div className="bg-white p-6 rounded-lg shadow">
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
        </div>

        {/* Co-author Network */}
        <div className="bg-white p-6 rounded-lg shadow">
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
      </div>

      {/* Recent Publications Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 bg-maroon-600 text-white">
          <h3 className="text-lg leading-6 font-semibold">
            Recent Publications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Journal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citations
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {publicationsList.map((pub: any) => (
                <tr key={pub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900">
                    {pub.title}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {pub.journal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pub.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pub.citations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-maroon-700 bg-white hover:bg-gray-100 border-maroon-300 hover:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500">
            View All Publications
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
