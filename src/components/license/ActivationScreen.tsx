"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { validateLicenseKey } from "@/lib/license";

export function ActivationScreen({ onActivated }: { onActivated: () => void }) {
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const isValid = await validateLicenseKey(licenseKey);
      if (isValid) {
        setStatus("success");
        setMessage("Activation successful! Redirecting...");
        setTimeout(() => {
            onActivated();
        }, 1500);
      } else {
        setStatus("error");
        setMessage("Invalid license key or machine limit reached.");
      }
    } catch (err: any) {
        console.error(err);
      setStatus("error");
      setMessage(err.message || "An error occurred during activation.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20"
          >
            F
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Activate Fixary
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Please enter your license key to continue.
          </p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-V3"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm"
            />
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`p-4 rounded-xl text-sm font-medium ${
                status === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                  : status === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-900/50"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
              }`}
            >
              {message}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleActivate}
            disabled={status === "loading" || !licenseKey}
            className={`w-full py-4 px-4 rounded-xl text-white font-bold transition-all shadow-lg ${
              status === "loading" || !licenseKey
                ? "bg-gray-400 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:shadow-inner"
            }`}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Activating...
              </span>
            ) : "Activate License"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
