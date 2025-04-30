import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  Award,
  Telescope,
} from "lucide-react";

const collegeImages = [
  "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg",
  "https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg",
  "https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg",
  "https://images.pexels.com/photos/207691/pexels-photo-207691.jpeg",
];

const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === collegeImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? collegeImages.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="flex flex-col">
      {/* Hero Section with Carousel */}
      <section className="relative h-[70vh]">
        {collegeImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`College campus ${index + 1}`}
              className="w-full h-full object-cover"
              onLoad={() => setIsHovered(false)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  CMRIT Research Portal
                </h1>
                <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto mb-8">
                  Showcasing faculty excellence and research innovations
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/create-profile"
                    className="bg-maroon-600 hover:bg-maroon-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300"
                  >
                    Create Profile
                  </Link>
                  <Link
                    to="/faculty"
                    className="bg-gold-500 hover:bg-gold-600 text-gray-900 font-semibold py-3 px-6 rounded-md transition-colors duration-300"
                  >
                    Explore Faculty
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {collegeImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            About CMRIT Research
          </h2>
          <div className="w-20 h-1 bg-maroon-600 mx-auto mb-8"></div>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
            CMRIT is dedicated to fostering a culture of innovation and research
            excellence. Our faculty members are engaged in groundbreaking
            research across various disciplines, contributing significantly to
            the advancement of knowledge and technology.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-maroon-600 mb-4">
              <BookOpen className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Academic Excellence
            </h3>
            <p className="text-gray-600 text-center">
              Pioneering research initiatives across multiple disciplines.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-maroon-600 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Collaborative Network
            </h3>
            <p className="text-gray-600 text-center">
              Building partnerships with global institutions and industry
              leaders.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-maroon-600 mb-4">
              <Award className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Recognition
            </h3>
            <p className="text-gray-600 text-center">
              Celebrating scholarly achievements and research excellence.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-maroon-600 mb-4">
              <Telescope className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Innovation
            </h3>
            <p className="text-gray-600 text-center">
              Developing cutting-edge solutions to complex problems.
            </p>
          </div>
        </div>
      </section>

      {/* Research Vision */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src="https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg"
                  alt="Research vision"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Our Research Vision
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  CMRIT envisions becoming a center of excellence in research
                  and innovation, fostering an environment where faculty and
                  students can pursue cutting-edge research that addresses
                  real-world challenges and contributes to society's
                  advancement.
                </p>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We strive to create a vibrant research ecosystem that promotes
                  interdisciplinary collaboration, critical thinking, and the
                  pursuit of knowledge that transcends traditional boundaries.
                </p>
                <div>
                  <Link
                    to="/faculty"
                    className="inline-block bg-maroon-600 hover:bg-maroon-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-300"
                  >
                    Meet Our Researchers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 text-center bg-gradient-to-r from-maroon-700 to-maroon-900 text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Join Our Research Community
          </h2>
          <p className="text-lg mb-8 text-gray-100">
            Are you a faculty member looking to showcase your research? Create
            your profile today and become part of our growing research
            community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create-profile"
              className="bg-white text-maroon-700 hover:bg-gray-100 font-semibold py-3 px-6 rounded-md transition-colors duration-300"
            >
              Create Profile
            </Link>
            <Link
              to="/faculty"
              className="bg-gold-500 hover:bg-gold-600 text-gray-900 font-semibold py-3 px-6 rounded-md transition-colors duration-300"
            >
              Explore Faculty
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
