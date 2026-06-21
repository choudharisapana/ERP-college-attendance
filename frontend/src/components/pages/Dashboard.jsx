import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard();
      console.log('Dashboard API Response:', response.data); // Debug log

      if (response.data?.data) {
        setDashboardData(response.data.data);
      } else if (response.data) {
        // Handle case where data might be directly in response
        setDashboardData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dashboardAPI.refreshDashboard();
      await fetchDashboardData();
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter activities based on selected filter
  const getFilteredActivities = () => {
    const activities = dashboardData?.recentActivities || [];
    if (!activities.length) return [];

    if (activityFilter === 'all') return activities;
    return activities.filter(a => a.type === activityFilter);
  };

  // Prepare timetable chart data with fallback values
  const prepareTimetableChartData = () => {
    const timetablesByStatus = dashboardData?.charts?.timetablesByStatus || [];

    // If no data, return default structure with zero values
    if (!timetablesByStatus.length) {
      return {
        labels: ['Active', 'Draft', 'Archived'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(107, 114, 128, 0.5)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(107, 114, 128)'
          ],
          borderWidth: 1
        }]
      };
    }

    // Map status labels to user-friendly names
    const statusLabels = timetablesByStatus.map(t => {
      const status = t.status?.toLowerCase();
      if (status === 'active') return 'Active';
      if (status === 'draft') return 'Draft';
      if (status === 'archived') return 'Archived';
      return t.status || 'Unknown';
    });

    return {
      labels: statusLabels,
      datasets: [{
        data: timetablesByStatus.map(t => t.count || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(107, 114, 128, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.5)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(107, 114, 128)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      }]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-3"></i>
            <h3 className="text-lg font-semibold text-red-800 mb-2">{error}</h3>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const charts = dashboardData?.charts || {};
  const activities = dashboardData?.recentActivities || [];
  const filteredActivities = getFilteredActivities();

  // Prepare all chart data with fallbacks
  const batchesChartData = {
    labels: charts.batchesByDepartment?.map(d => d.department) || [],
    datasets: [
      {
        label: 'Number of Batches',
        data: charts.batchesByDepartment?.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Total Students',
        data: charts.batchesByDepartment?.map(d => d.students) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  const facultyChartData = {
    labels: charts.facultyByDepartment?.map(f => f.department) || [],
    datasets: [
      {
        label: 'Faculty Count',
        data: charts.facultyByDepartment?.map(f => f.count) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }
    ]
  };

  const subjectsChartData = {
    labels: charts.subjectsByType?.map(s => s.type) || [],
    datasets: [
      {
        data: charts.subjectsByType?.map(s => s.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.5)',
          'rgba(236, 72, 153, 0.5)',
          'rgba(6, 182, 212, 0.5)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(6, 182, 212)'
        ],
        borderWidth: 1
      }
    ]
  };

  const classroomsChartData = {
    labels: charts.classroomsByType?.map(c => c.type) || [],
    datasets: [
      {
        label: 'Count',
        data: charts.classroomsByType?.map(c => c.count) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      }
    ]
  };

  const timetablesChartData = prepareTimetableChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-600">Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">
              Welcome back! Here's what's happening with your institute.
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last 12 months</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <i className={`fas fa-sync-alt mr-2 ${refreshing ? 'animate-spin' : ''}`}></i>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {dashboardData?.lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        )}

        {/* Statistics Cards - 6 Cards in 2 Rows (3 each) as per image */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Batches */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBatches || 0}</p>
                <p className="text-sm text-green-600 mt-2">
                  <span className="font-semibold">{stats.activeBatches || 0}</span> active
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <i className="fas fa-users text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Across all batches</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <i className="fas fa-user-graduate text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Faculty */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Faculty</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFaculty || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Teaching staff</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <i className="fas fa-chalkboard-teacher text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Classrooms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classrooms</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClassrooms || 0}</p>
                <p className="text-sm text-green-600 mt-2">
                  <span className="font-semibold">{stats.availableClassrooms || 0}</span> available
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <i className="fas fa-chalkboard text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Subjects */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSubjects || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Active courses</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <i className="fas fa-book text-indigo-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Timetables */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Timetables</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTimetables || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Active {stats.totalTimetables || 0}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <i className="fas fa-calendar-alt text-pink-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Batches by Department */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Batches by Department</h3>
            {charts.batchesByDepartment?.length > 0 ? (
              <Bar
                data={batchesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No batch data available</p>
            )}
          </div>

          {/* Faculty Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Faculty by Department</h3>
            {charts.facultyByDepartment?.length > 0 ? (
              <Bar
                data={facultyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No faculty data available</p>
            )}
          </div>

          {/* Subjects by Type */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Subjects by Type</h3>
            {charts.subjectsByType?.length > 0 ? (
              <div className="flex justify-center">
                <div className="w-64 h-64">
                  <Pie
                    data={subjectsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No subject data available</p>
            )}
          </div>

          {/* Classrooms by Type */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Classrooms by Type</h3>
            {charts.classroomsByType?.length > 0 ? (
              <Bar
                data={classroomsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No classroom data available</p>
            )}
          </div>

         

          {/*  Timetables by Status chart ke liye better display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Timetables by Status</h3>
            {charts.timetablesByStatus && charts.timetablesByStatus.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="w-64 h-64">
                    <Doughnut
                      data={timetablesChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Total timetables summary */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Total Timetables: <span className="font-semibold">{stats.totalTimetables || 0}</span>
                    {stats.activeTimetables > 0 && (
                      <span className="ml-2 text-green-600">
                        | Active: {stats.activeTimetables}
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-calendar-alt text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-500">No timetable data available</p>
                <p className="text-sm text-gray-400 mt-2">Create a timetable to see statistics</p>
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-600">Recent Activities</h3>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Activities</option>
                <option value="batch">Batches</option>
                <option value="faculty">Faculty</option>
                <option value="subject">Subjects</option>
                <option value="classroom">Classrooms</option>
                <option value="timetable">Timetables</option>
              </select>
            </div>

            {filteredActivities.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {filteredActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`p-2 rounded-full flex-shrink-0 ${activity.type === 'batch' ? 'bg-blue-100' :
                        activity.type === 'faculty' ? 'bg-purple-100' :
                          activity.type === 'subject' ? 'bg-green-100' :
                            activity.type === 'classroom' ? 'bg-orange-100' :
                              'bg-pink-100'
                      }`}>
                      <i className={`fas fa-${activity.type === 'batch' ? 'users' :
                          activity.type === 'faculty' ? 'chalkboard-teacher' :
                            activity.type === 'subject' ? 'book' :
                              activity.type === 'classroom' ? 'chalkboard' :
                                'calendar-alt'
                        } text-sm ${activity.type === 'batch' ? 'text-blue-600' :
                          activity.type === 'faculty' ? 'text-purple-600' :
                            activity.type === 'subject' ? 'text-green-600' :
                              activity.type === 'classroom' ? 'text-orange-600' :
                                'text-pink-600'
                        }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-5600">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${activity.action === 'created' ? 'bg-green-100 text-green-800' :
                        activity.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {activity.action}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No activities found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;