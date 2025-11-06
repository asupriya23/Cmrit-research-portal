// ProfileCreation.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, AlertCircle } from "lucide-react";

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
  "Chemistry",
  "Humanities",
];

const designations = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Head of Department",
  "Dean",
  "Principal",
];

const ProfileCreation: React.FC = (props) => {
  const {setLoggedID} = props;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    designation: "",
    introduction: "",
    scholarProfileUrl: "",
    profilePicture: null as File | null,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile picture must be less than 5MB");
        return;
      }
      setFormData((prevData) => ({ ...prevData, profilePicture: file }));

      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError("");
      setLoading(true);

      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("email", formData.email);
      formPayload.append("password", formData.password);
      formPayload.append("department", formData.department);
      formPayload.append("designation", formData.designation);
      formPayload.append("introduction", formData.introduction);
      formPayload.append("scholarProfileUrl", formData.scholarProfileUrl);
      if (formData.profilePicture) {
        formPayload.append("profilePicture", formData.profilePicture);
      }

      const response = await fetch("http://localhost:5002/register", {
        method: "POST",
        body: formPayload, // Send as FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to register");
        throw new Error(errorData.error || "Failed to register");
      }

      const { userId } = await response.json(); // Expecting userId in the response
      console.log(userId);
      setLoggedID(userId);
      navigate(`/dashboard/${userId}`); // Navigate to the dashboard with the user ID
    } catch (err: any) {
      setError(err.message || "Unexpected error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700">
        <div className="px-6 py-5 bg-gradient-to-r from-maroon-600 to-maroon-800 text-white">
          <h2 className="text-2xl font-semibold">Faculty Profile Creation</h2>
          <p className="mt-1 text-sm text-gray-100">
            Create your research profile to showcase your academic work
          </p>
        </div>

        {error && (
          <div className="m-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
              placeholder="Enter your email address"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
              placeholder="Enter a password (min 6 characters)"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
              placeholder="Confirm your password"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Designation
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
            >
              <option value="">Select designation</option>
              {designations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          {/* Introduction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Introduction
            </label>
            <textarea
              name="introduction"
              value={formData.introduction}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors resize-none"
              placeholder="Brief introduction about yourself and your research interests"
            ></textarea>
          </div>

          {/* Scholar Profile URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Scholar Profile URL
            </label>
            <input
              type="url"
              name="scholarProfileUrl"
              value={formData.scholarProfileUrl}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-colors"
              placeholder="https://scholar.google.com/citations?user=..."
            />
          </div>

          {/* Profile Picture */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-2 h-20 w-20 object-cover rounded-full border"
              />
            )}
          </div> */}

          {/* Buttons */}
          <div className="pt-5 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? "Creating..." : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;