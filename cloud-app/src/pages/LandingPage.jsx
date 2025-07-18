import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/logo.jpg';
import heroImage from '../assets/pic.jpg';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 to-black text-white px-6 py-8 relative overflow-hidden">
      <ThemeToggle />
      <div className="flex items-center gap-4 mb-10">
        <img src={logo} alt="CloudChat Logo" className="w-12 h-12 rounded-full" />
        <h1 className="text-3xl font-bold">CloudChat</h1>
      </div>
      <div className="grid md:grid-cols-2 items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-5xl font-extrabold mb-6">Chat Freely. Instantly. Anywhere.</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-md">
            Join the cloud revolution in real-time chatting. Share files, images, and stay connected with friends and groups.
          </p>
          <div className="flex gap-4">
            <Link to="/signup" className="bg-primary text-white px-6 py-3 rounded-full hover:bg-blue-500 transition">
              Get Started
            </Link>
            <Link to="/login" className="border border-white px-6 py-3 rounded-full hover:bg-white hover:text-black transition">
              Login
            </Link>
          </div>
        </motion.div>
        <motion.img
          src={heroImage}
          alt="Chat Illustration"
          className="w-full max-w-lg rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
};

export default LandingPage;
