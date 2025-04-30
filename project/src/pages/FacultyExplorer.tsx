import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios"; // You need to install axios with npm/yarn
import { Search, Filter, Award, Users, TrendingUp } from "lucide-react";

// Departments for filtering
const departments = [
  "All Departments",
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Management Studies",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Humanities",
];

const FacultyExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [sortBy, setSortBy] = useState("name"); // name, publications, citations, hIndex
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch faculty data from the backend API
  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://your-backend-url/api/faculty", {
        params: {
          searchTerm,
          selectedDepartment,
          sortBy,
        },
      });
      setFacultyData(response.data);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load and whenever filters change
  useEffect(() => {
    fetchFacultyData();
  }, [searchTerm, selectedDepartment, sortBy]);

  // Filter and sort faculty data (now from backend)
  const filteredFaculty = facultyData
    .filter((faculty) => {
      const matchesSearch =
        faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.researchAreas.some((area) =>
          area.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesDepartment =
        selectedDepartment === "All Departments" ||
        faculty.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "publications") {
        return b.publications - a.publications;
      } else if (sortBy === "citations") {
        return b.citations - a.citations;
      } else if (sortBy === "hIndex") {
        return b.hIndex - a.hIndex;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Faculty Research Explorer
        </h1>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-6">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              placeholder="Search by name or research area"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="w-full md:w-64">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="publications">Sort by Publications</option>
              <option value="citations">Sort by Citations</option>
              <option value="hIndex">Sort by h-index</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredFaculty.length} faculty members
        </p>
      </div>

      {/* Faculty Grid */}
      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredFaculty.map((faculty) => (
            <div
              key={faculty._id} // Updated to _id for MongoDB compatibility
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={faculty.image}
                    alt={faculty.name}
                    className="h-16 w-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {faculty.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {faculty.designation}
                    </p>
                    <p className="text-sm text-gray-500">
                      {faculty.department}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Research Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {faculty.researchAreas.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-maroon-100 text-maroon-800"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <Award className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-xs text-gray-500">
                        Publications
                      </span>
                      <span className="font-semibold">
                        {faculty.publications}
                      </span>
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <Users className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-xs text-gray-500">Citations</span>
                      <span className="font-semibold">{faculty.citations}</span>
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-xs text-gray-500">h-index</span>
                      <span className="font-semibold">{faculty.hIndex}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/dashboard/${faculty._id}`} // Updated to use _id for MongoDB
                  className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-maroon-600 hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {filteredFaculty.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500 mb-4">
            No faculty members found matching your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDepartment("All Departments");
            }}
            className="text-maroon-600 hover:text-maroon-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FacultyExplorer;
