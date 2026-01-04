import React, { useState, useEffect } from "react";
import { supabase } from "../services/api"; // Make sure to export your supabase client

const ConnectionStatus = ({ detailed = false }) => {
  const [supabaseStatus, setSupabaseStatus] = useState({
    connected: false,
    message: "Checking Supabase...",
    checking: true,
  });

  const checkSupabase = async () => {
    setSupabaseStatus({
      connected: false,
      message: "Checking Supabase...",
      checking: true,
    });
    try {
      // Example: simple DB call to `users` or any lightweight table/view
      const { error } = await supabase.from("users").select("id").limit(1);
      if (!error) {
        setSupabaseStatus({
          connected: true,
          message: "Supabase Connected",
          checking: false,
        });
      } else {
        setSupabaseStatus({
          connected: false,
          message: "Supabase Error: " + error.message,
          checking: false,
        });
      }
    } catch (err) {
      setSupabaseStatus({
        connected: false,
        message: "Supabase Unreachable",
        checking: false,
      });
    }
  };

  useEffect(() => {
    checkSupabase();
    const interval = setInterval(checkSupabase, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!detailed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              supabaseStatus.connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs">
            {supabaseStatus.connected
              ? "Connected"
              : "No Cennection"}
          </span>
          <button
            onClick={checkSupabase}
            className="text-xs text-blue-400 hover:text-blue-300"
            title="Refresh status"
          >
            ↻
          </button>
        </div>
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Supabase Status</h3>
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <div
            className={`w-3 h-3 rounded-full ${
              supabaseStatus.connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="font-medium">Supabase API</span>
        </div>
        <p className="text-sm text-gray-300 ml-5">
          {supabaseStatus.checking ? "Checking..." : supabaseStatus.message}
        </p>
      </div>
      <button
        onClick={checkSupabase}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm transition-colors"
      >
        Refresh Status
      </button>
    </div>
  );
};

export default ConnectionStatus;

