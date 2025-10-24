import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Assignments = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data.data.tasks);

      // Try to get team members if user has a team
      try {
        const teamRes = await api.get('/teams/my-team');
        const teamMembers = teamRes.data.data.team?.members || [];
        setUsers(teamMembers);
      } catch (teamErr) {
        // User doesn't have a team, set empty users array
        if (teamErr.response?.status === 404) {
          setUsers([]);
          console.log('User is not assigned to a team');
        } else {
          throw teamErr;
        }
      }

      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedTask || !selectedUser) {
      setError('Please select both task and user');
      return;
    }

    try {
      await api.put(`/tasks/${selectedTask}/assign`, {
        assignedTo: selectedUser,
      });
      setError('');
      alert('Task assigned successfully!');
      setSelectedTask(null);
      setSelectedUser('');
      setMessage('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
      console.error(err);
    }
  };

  const handleUnassignTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to unassign this task?')) return;
    try {
      await api.put(`/tasks/${taskId}`, {
        assignedTo: null,
      });
      alert('Task unassigned successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign task');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  const canManageAssignments = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Task Assignments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and assign tasks to team members
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        {canManageAssignments && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Task</h2>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Task <span className="text-red-500">*</span>
                </label>
                <select
                  id="task"
                  value={selectedTask || ''}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select a task --</option>
                  {tasks.map((task) => (
                    <option key={task._id} value={task._id}>
                      {task.title} (Status: {task.status}, Priority: {task.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                  disabled={users.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {users.length === 0 ? '-- No team members available --' : '-- Select a user --'}
                  </option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username || u.email} ({u.role})
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    You are not assigned to a team. Contact an admin to be added to a team.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message for the assignee..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Tasks</h2>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks available</h3>
                <p className="mt-1 text-sm text-gray-500">Tasks will appear here once created.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                      <p className="text-gray-600 mb-3">{task.description}</p>

                      {/* Priority and Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Assignment Info */}
                      {task.assignedTo && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-2">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-indigo-900">
                                Assigned to: {task.assignedTo.username || task.assignedTo.email}
                              </p>
                              <p className="text-xs text-indigo-700">{task.assignedTo.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Creator Info */}
                      {task.createdBy && (
                        <p className="text-sm text-gray-500">
                          Created by: <span className="font-medium text-gray-700">{task.createdBy.username || task.createdBy.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Unassign Button */}
                    {canManageAssignments && task.assignedTo && (
                      <button
                        onClick={() => handleUnassignTask(task._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-yellow-900 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                        Unassign
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
