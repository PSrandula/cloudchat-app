import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import logo from '../assets/logo.jpg';
import chatImage from '../assets/pic.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful');
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col md:flex-row max-w-4xl w-full p-6 md:p-10">
        <div className="hidden md:flex w-1/2 justify-center items-center">
          <img src={chatImage} alt="Chat Illustration" className="w-full h-auto" />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4">
          <img src={logo} alt="CloudChat Logo" className="w-16 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Welcome Back</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-800 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border pr-10 dark:bg-gray-800 dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="absolute right-3 top-3.5 cursor-pointer text-xl text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Log In
            </button>
          </form>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-purple-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
