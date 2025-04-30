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

const ProfileCreation: React.FC = () => {
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
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "profilePicture" && value) {
          formPayload.append(key, value);
        } else {
          formPayload.append(key, value as string);
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          body: formPayload,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register");
      }

      const { token, user } = await response.json();
      localStorage.setItem("token", token);
      navigate(`/dashboard/${user._id}`);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-maroon-700 text-white">
          <h2 className="text-xl font-semibold">Faculty Profile Creation</h2>
          <p className="mt-1 text-sm">
            Create your research profile to showcase your academic work
          </p>
        </div>

        {error && (
          <div
            className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
          {/* Inputs (same as previous code) */}
          {/* Name, Email, Passwords, Department, Designation, Intro, Scholar URL, Image Upload */}

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-maroon-600 hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon-500 disabled:bg-maroon-400 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;
