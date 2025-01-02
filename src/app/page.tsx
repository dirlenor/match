"use client";

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-h1 font-league-gothic text-text-light leading-none">MATCH</h1>
        <h2 className="text-h2 font-league-gothic text-text-light leading-none">TIME</h2>
        <p className="text-text-light mt-4">Check in your time and request payment app.</p>
      </div>

      <div className="w-full max-w-md">
        <div className="flex mb-8">
          <button 
            className={`flex-1 py-2 text-h4 font-league-gothic ${activeTab === 'login' ? 'text-text-light' : 'text-gray-500'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-2 text-h4 font-league-gothic ${activeTab === 'register' ? 'text-text-light' : 'text-gray-500'}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'login' ? (
            // Login Form
            <form className="space-y-4">
              <div>
                <label className="block text-text-light mb-2">Email</label>
                <input 
                  type="email" 
                  className="input w-full"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">Password</label>
                <input 
                  type="password" 
                  className="input w-full"
                  placeholder="Enter your password"
                />
              </div>
              <button 
                type="submit" 
                className="btn w-full mt-8 h-12 rounded-full"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          ) : (
            // Register Form
            <form className="space-y-4">
              <div>
                <label className="block text-text-light mb-2">Email</label>
                <input 
                  type="email" 
                  className="input w-full"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">Password</label>
                <input 
                  type="password" 
                  className="input w-full"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-text-light mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  className="input w-full"
                  placeholder="Confirm your password"
                />
              </div>
              <button 
                type="submit" 
                className="btn w-full mt-8 h-12 rounded-full"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
