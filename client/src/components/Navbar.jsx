import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="ml-2 text-white text-xl font-bold">TaskManager</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex md:space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </div>
              </Link>
              <Link
                to="/assignments"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/assignments')
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Assignments
                </div>
              </Link>
              {user?.role === 'Manager' && (
                <>
                  <Link
                    to="/users"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/users')
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Users
                    </div>
                  </Link>
                  <Link
                    to="/team-members"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/team-members')
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Team Members
                    </div>
                  </Link>
                </>
              )}
              {user?.role === 'Admin' && (
                <>
                  <Link
                    to="/users"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/users')
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Users
                    </div>
                  </Link>
                  <Link
                    to="/teams"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/teams')
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Teams
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                <p className="text-xs text-indigo-200">{user.role}{user.team ? ` - ${user.team.name || user.team}` : ''}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user.username || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-y-1">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/assignments"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/assignments')
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
            }`}
          >
            Assignments
          </Link>
          {user?.role === 'Manager' && (
            <Link
              to="/team-members"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/team-members')
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Team Members
            </Link>
          )}
          {user?.role === 'Admin' && (
            <>
              <Link
                to="/users"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/users')
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                Users
              </Link>
              <Link
                to="/teams"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/teams')
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                Teams
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
