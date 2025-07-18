import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import logo from '../assets/logo.jpg';
import chatImage from '../assets/pic.jpg';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signup successful!');
      navigate('/login');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already in use.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('Failed to create account. Try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-blue-600 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex max-w-4xl w-full p-6 md:p-10">
        <div className="hidden md:block w-1/2">
          <img
            src={chatImage}
            alt="Chat Illustration"
            className="w-full h-full object-cover rounded-l-2xl"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6">
          <img src={logo} alt="Logo" className="w-16 mb-6 mx-auto" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Create Your Account
          </h2>
          <form onSubmit={handleSignup} className="space-y-5">
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
                minLength={6}
              />
              <span
                className="absolute right-3 top-3 cursor-pointer text-xl text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition"
            >
              Sign Up
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600 dark:text-gray-300 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
