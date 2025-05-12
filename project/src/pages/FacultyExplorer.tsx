import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios"; // You need to install axios with npm/yarn
import { Search, Filter, Award, Users, TrendingUp } from "lucide-react";

const departments = [
  "All", // Ensure "All" is consistent
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

const designations = [
  "All", // Ensure "All" is consistent
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Head of Department",
  "Dean",
  "Principal",
];

interface Faculty {
  _id: string;
  name: string;
  designation: string;
  department: string;
  image?: string; // Optional: if image might not always be present
  researchAreas?: string[]; // Optional: if researchAreas might not always be present
  publications?: number; // Assuming publications is a count (number)
  citationCount: number;
  hIndex: number;
  i10Index: number; // Assuming i10Index is available
}

const FacultyExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedDesignation, setSelectedDesignation] = useState("All");
  const [sortBy, setSortBy] = useState("name"); // name, publications, citations, hIndex, i10Index
  const [data, setData] = useState<Faculty[]>([]); // Typed the state
  const [loading, setLoading] = useState(true);

  // Placeholder for token - this should be managed by your auth system (e.g., Context, Redux, localStorage)
  const token = localStorage.getItem("authToken"); // Example: fetching token from localStorage

  // Fetch faculty data from the backend API
  const fetchData = useCallback(async () => {
    // Wrapped with useCallback
    try {
      setLoading(true);
      // Simulate API delay for testing loading state
      // await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await axios.get(
        "http://localhost:5002/api/getAllFaculty",
        {
          // Conditionally add Authorization header if token exists
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setData(response.data as Faculty[]); // Assert type if confident, or validate
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      // Optionally, set an error state here to display to the user
    } finally {
      setLoading(false);
    }
  }, [token]); // Added token as dependency for fetchData

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Corrected dependency array, fetchData will run when it changes (e.g. token changes)

  // Filter and sort faculty data
  const filteredData = data
    .filter((faculty) => {
      const matchesSearch =
        faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (faculty.researchAreas && // Check if researchAreas exist
          faculty.researchAreas.some((area) =>
            area.toLowerCase().includes(searchTerm.toLowerCase())
          )); // Added search by research area

      const matchesDepartment =
        selectedDepartment === "All" ||
        faculty.department === selectedDepartment;
      const matchesDesignation =
        selectedDesignation === "All" ||
        faculty.designation === selectedDesignation;

      return matchesSearch && matchesDepartment && matchesDesignation;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "publications") {
        return (b.publications || 0) - (a.publications || 0); // Handle potential undefined
      } else if (sortBy === "citations") {
        return b.citationCount - a.citationCount;
      } else if (sortBy === "hIndex") {
        return b.hIndex - a.hIndex;
      } else if (sortBy === "i10Index") {
        return b.i10Index - a.i10Index;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Faculty Research Explorer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative lg:col-span-1">
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
          <div className="relative lg:col-span-1">
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
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Designation Filter - ADDED */}
          <div className="relative lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
            >
              {designations.map((desg) => (
                <option key={desg} value={desg}>
                  {desg === "All" ? "All Designations" : desg}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="lg:col-span-1">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 sm:text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="publications">Sort by Publications</option> {/* Now handled in sort logic */}
              <option value="citations">Sort by Citations</option>
              <option value="hIndex">Sort by h-index</option>
              <option value="i10Index">Sort by i10-index</option> {/* Added UI for i10Index */}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredData.length} faculty members
        </p>
      </div>

      {/* Faculty Grid */}
      {loading ? (
        <div className="text-center text-gray-600 py-10">Loading faculty data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredData.map((faculty) => (
            <div
              key={faculty._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col" // Added flex flex-col
            >
              <div className="p-6 flex-grow"> {/* Added flex-grow */}
                <div className="flex items-center mb-4">
                  {faculty.image ? ( // Conditionally render image
                    <img
                      src={faculty.image}
                      alt={faculty.name}
                      className="h-16 w-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 mr-4 flex items-center justify-center text-gray-500">
                      <Users size={32} /> {/* Placeholder icon */}
                    </div>
                  )}
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

                {faculty.researchAreas && faculty.researchAreas.length > 0 && ( // Conditionally render research areas
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
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
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-xs"> {/* Adjusted grid for 4 items */}
                  {/* <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <Award className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-gray-500">Publications</span>
                      <span className="font-semibold text-sm">
                        {faculty.publications !== undefined ? faculty.publications : "N/A"}
                      </span>
                    </div>
                  </div> */}
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <Users className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-gray-500">Citations</span>
                      <span className="font-semibold text-sm">{faculty.citationCount}</span>
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex flex-col items-center">
                      <Award className="h-4 w-4 text-maroon-600 mb-1" />
                      <span className="text-gray-500">h-index</span>
                      <span className="font-semibold text-sm">{faculty.hIndex}</span>
                    </div>
                  </div>
                   <div className="text-center p-2 bg-gray-50 rounded"> {/* Added i10-index display */}
                    <div className="flex flex-col items-center">
                      <TrendingUp className="h-4 w-4 text-maroon-600 mb-1" /> {/* Consider a different icon if available */}
                      <span className="text-gray-500">i10-index</span>
                      <span className="font-semibold text-sm">{faculty.i10Index}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto"> {/* Ensure button is at the bottom */}
                <Link
                  to={`/dashboard/${faculty.user_id}`}
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
      {filteredData.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500 mb-4">
            No faculty members found matching your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDepartment("All"); // Corrected value
              setSelectedDesignation("All"); // Added designation reset
              setSortBy("name"); // Optionally reset sort
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