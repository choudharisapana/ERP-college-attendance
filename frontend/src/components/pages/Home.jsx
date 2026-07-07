import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      icon: "fa-calendar-plus",
      title: "Create Timetable",
      description: "Build and manage academic timetables efficiently",
      path: "/create-Timetable",
    },
    {
      icon: "fa-users",
      title: "Manage Faculty",
      description: "Add and manage faculty members",
      path: "/faculty",
    },
    {
      icon: "fa-chalkboard-user",
      title: "Classrooms",
      description: "Manage classrooms and resources",
      path: "/classrooms",
    },
    {
      icon: "fa-book-open",
      title: "Subjects",
      description: "Manage subjects and courses",
      path: "/subject",
    },
    {
      icon: "fa-clipboard-list",
      title: "Student Batches",
      description: "Manage student batches",
      path: "/studentBatches",
    },
    {
      icon: "fa-chart-line",
      title: "Dashboard",
      description: "View analytics and reports",
      path: "/dashboard",
    },
  ];

  return (
    <div className="home-page min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to{" "}
            <span className="text-blue-600 dark:text-blue-400">
              EduSchedular
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Smart timetable management system for educational institutions.
            Create, manage, and optimize your schedules effortlessly.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
          >
            Get Started
            <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>
      <div className="py-5 px-1">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything You Need to Manage Schedules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.path}
                className="block bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 group"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <i
                    className={`fas ${feature.icon} text-blue-600 dark:text-blue-400 text-xl`}
                  ></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                  <span>Access Feature</span>
                  <i className="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;