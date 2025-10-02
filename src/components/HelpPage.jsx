'use client';

import React, { useState } from 'react';

const HelpPage = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return; // Basic validation

    setIsSubmitting(true);
    const mailtoLink = `mailto:cosmiano.joseph2@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Simulate success (email client opens immediately)
    setTimeout(() => {
      setEmailSent(true);
      setIsSubmitting(false);
      // Reset form after 5 seconds
      setTimeout(() => {    
        setEmailSent(false);
        setSubject('');
        setMessage('');
      }, 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-gray-400">Get assistance or report an issue. We'll respond via email.</p>
        </div>
        <i className="fas fa-question-circle text-3xl text-gray-400"></i>
      </div>

      {/* Contact Form */}
      {!emailSent ? (
        <form onSubmit={handleSubmit} className="bg-[#1e1e1e] p-6 rounded-lg space-y-4 max-w-full">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Issue with registration"
              className="w-full p-3 bg-[#333] border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              className="w-full p-3 bg-[#333] border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !subject || !message}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-md font-medium transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      ) : (
        <div className="bg-green-900/50 border border-green-500 p-6 rounded-lg text-center">
          <i className="fas fa-check-circle text-4xl text-green-400 mb-4"></i>
          <h2 className="text-xl font-semibold mb-2">Email Sent Successfully!</h2>
          <p className="text-gray-300 mb-4">Your message has been sent to our support team. Check your email client if it didn't open automatically. We'll get back to you soon.</p>
          <button
            onClick={() => setEmailSent(false)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Send Another Message
          </button>
        </div>
      )}

      {/* Additional Help Resources */}
      <div className="bg-[#1e1e1e] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Quick Help Resources</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center">
            <i className="fas fa-book mr-2 text-blue-400"></i>
            <a href="#" className="hover:text-blue-400">User Guide</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-video mr-2 text-green-400"></i>
            <a href="#" className="hover:text-green-400">Tutorials</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-phone mr-2 text-purple-400"></i>
            <span>Call Support: +63 123 456 7890</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;