import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <div className="bg-gradient-to-b from-gray-900 to-background py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16 mr-4" />
                <div className="text-5xl font-bold">
                  <span className="property-text">property</span><span className="text-white">Pal</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">Your Complete Property Management Solution</h1>
              <p className="text-xl text-gray-400 mb-4">
                Simplify your homeownership journey with our all-in-one property management platform.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Part of the <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">palStack</a> ecosystem
              </p>
              <div className="flex space-x-4">
                <Link to="/login" className="btn-primary px-6 py-3 rounded-md text-center">
                  Get Started
                </Link>
                <Link to="/signup" className="btn-secondary px-6 py-3 rounded-md text-center">
                  Sign Up Free
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                  <svg className="absolute inset-0 h-full w-full text-sky-400 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/dashboard.png" alt="propertyPal Dashboard" className="rounded-lg" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-card-bg rounded-lg overflow-hidden shadow-xl flex items-center justify-center">
                  <svg className="h-20 w-20 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-12 text-center">All Your Home Management Needs in One Place</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-sky-400 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Maintenance Tracking</h3>
              <p className="text-gray-400">Keep track of all your home maintenance tasks with seasonal checklists and reminders.</p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Budget & Expenses</h3>
              <p className="text-gray-400">Manage home expenses, set budgets, and generate detailed financial reports.</p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Document Storage</h3>
              <p className="text-gray-400">Securely store and organize all your important home documents in one place.</p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Project Management</h3>
              <p className="text-gray-400">Plan, track, and manage all your home improvement projects from start to finish.</p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-orange-500 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Appliance Tracking</h3>
              <p className="text-gray-400">Track warranties, maintenance schedules, and service history for all your home appliances.</p>
            </div>

            <div className="card p-6">
              <div className="h-12 w-12 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Reports & Analytics</h3>
              <p className="text-gray-400">Generate detailed reports on your home expenses, maintenance history, and project costs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* palStack Ecosystem section */}
      <div className="py-16 px-4 bg-gray-900 bg-opacity-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-4 text-center">The palStack Ecosystem</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            propertyPal is part of the palStack family of open-source tools designed to help you manage every aspect of your life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 border-2 border-sky-500">
              <div className="flex items-center mb-4">
                <img src="/propertyPal.png" alt="propertyPal" className="h-10 w-10 mr-3" />
                <div>
                  <h3 className="text-lg font-bold"><span className="text-sky-400">property</span>Pal</h3>
                  <span className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded">Current</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Manage your home, track maintenance, expenses, and documents all in one place.</p>
            </div>

            <div className="card p-6 opacity-60">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 mr-3 bg-amber-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold"><span className="text-amber-500">car</span>Pal</h3>
                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded">Coming Soon</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Track vehicle maintenance, fuel economy, service history, and more.</p>
            </div>

            <div className="card p-6 opacity-60">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 mr-3 bg-pink-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold"><span className="text-pink-500">pet</span>Pal</h3>
                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded">Coming Soon</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Manage pet health records, vet appointments, medications, and care schedules.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="py-16 px-4 bg-gradient-to-t from-gray-900 to-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your home management?</h2>
          <p className="text-xl text-gray-400 mb-8">Join homeowners who are saving time and reducing stress with propertyPal.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup" className="btn-primary px-8 py-4 rounded-md text-center text-lg">
              Get Started for Free
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-4 rounded-md text-center text-lg">
              Log In
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Open source on{' '}
            <a href="https://github.com/palStack-io/propertypal-core" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              GitHub
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/propertyPal.png" alt="propertyPal" className="h-8 w-8 mr-2" />
              <span className="font-bold"><span className="text-sky-400">property</span>Pal</span>
              <span className="text-gray-500 text-sm ml-2">by palStack</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="hover:text-white">palStack.io</a>
              <a href="https://propertyPal.palstack.io" target="_blank" rel="noopener noreferrer" className="hover:text-white">Docs</a>
              <a href="https://github.com/palStack-io/propertypal-core" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
            </div>
          </div>
          <div className="text-center text-gray-500 text-xs mt-6">
            © 2024 palStack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
