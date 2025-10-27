"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    // Simple test to verify the page is working
    setTimeout(() => {
      setMessage("Test page loaded successfully!");
    }, 1000);
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Fixary Test Page</h1>
      <p>{message}</p>
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setMessage("Button clicked!")}
          style={{ padding: "10px 20px", fontSize: "16px" }}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}
