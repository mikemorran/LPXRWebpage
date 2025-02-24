"use client";
import { useState, useEffect, useRef } from "react";

const PASSWORD = "pass"; // Change this or use an env variable
const LOCAL_STORAGE_KEY = "savedPrompts";
const INDEX_STORAGE_KEY = "currentPromptIndex";

export default function Home() {
  const [passwordEntered, setPasswordEntered] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [prompts, setPrompts] = useState([""]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const savedPrompts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [""];
    const savedIndex = parseInt(localStorage.getItem(INDEX_STORAGE_KEY), 10) || 0;
    setPrompts(savedPrompts.length > 0 ? savedPrompts : [""]);
    setCurrentIndex(savedIndex < savedPrompts.length ? savedIndex : 0);
    setCurrentPrompt(savedPrompts[savedIndex] || "");
  }, []);

  useEffect(() => {
    if (passwordEntered) {
      const serverDomain = window.location.href.includes("localhost")
        ? "ws://localhost:4040"
        : "wss://lpxrwebserver-4f50480a74b6.herokuapp.com";

      socketRef.current = new WebSocket(serverDomain);

      socketRef.current.onopen = () => {
        console.log("Connected to WebSocket server");
        socketRef.current.send(JSON.stringify({ type: "loadPrompt", data: currentPrompt }));
      };

      socketRef.current.onmessage = (event) => {
        console.log("Received message:", event.data);
      };

      socketRef.current.onmessage = (event) => {
        console.log("Received message:", event.data);
        if (event.data === "ping") {
            socketRef.current.send("pong"); // Respond to ping
        }
    };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed");
      };

      return () => socketRef.current.close();
    }
  }, [passwordEntered]);

  const sendMessage = (type, data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setPasswordEntered(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handlePromptChange = (e) => {
    const updatedPrompt = e.target.value;
    let updatedPrompts = [...prompts];
    updatedPrompts[currentIndex] = updatedPrompt;
    setPrompts(updatedPrompts);
    setCurrentPrompt(updatedPrompt);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPrompts));
    sendMessage("updatePrompt", updatedPrompt);
  };

  const handleNext = () => {
    let nextIndex = (currentIndex + 1) % prompts.length;
    setCurrentIndex(nextIndex);
    setCurrentPrompt(prompts[nextIndex]);
    localStorage.setItem(INDEX_STORAGE_KEY, nextIndex);
    sendMessage("updatePrompt", prompts[nextIndex]);
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + prompts.length) % prompts.length;
    setCurrentIndex(prevIndex);
    setCurrentPrompt(prompts[prevIndex]);
    localStorage.setItem(INDEX_STORAGE_KEY, prevIndex);
    sendMessage("updatePrompt", prompts[prevIndex]);
  };

  const handleAddPrompt = () => {
    const newPrompts = [...prompts, ""];
    setPrompts(newPrompts);
    const newIndex = newPrompts.length - 1;
    setCurrentIndex(newIndex);
    setCurrentPrompt("");
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrompts));
    localStorage.setItem(INDEX_STORAGE_KEY, newIndex);
  };

  const handleDeletePrompt = () => {
    if (prompts.length > 1) {
      const newPrompts = prompts.filter((_, index) => index !== currentIndex);
      const newIndex = Math.max(0, currentIndex - 1);
      setPrompts(newPrompts);
      setCurrentIndex(newIndex);
      setCurrentPrompt(newPrompts[newIndex] || "");
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrompts));
      localStorage.setItem(INDEX_STORAGE_KEY, newIndex);
      sendMessage("updatePrompt", newPrompts[newIndex] || "");
    }
  };

  if (!passwordEntered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-black">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center">
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="p-2 border border-gray-600"
          />
          <button type="submit" className="mt-4 px-4 py-2 hover:bg-gray-600 text-white">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <div className="absolute left-10 top-1/2 transform -translate-y-1/2">
        <button onClick={handlePrevious} className="text-5xl">{`<`}</button>
      </div>

      <main className="text-center w-full max-w-2xl">
        <textarea
          className="text-white text-2xl outline-none border-none w-full text-center p-8 rounded-lg overflow-auto bg-opacity-55 bg-gray-900"
          style={{ minHeight: "200px", resize: "none" }}
          value={currentPrompt}
          onChange={handlePromptChange}
          autoFocus
        />
        <div className="mt-4 flex gap-2 items-center justify-center">
          <button onClick={handleAddPrompt} className="px-4 py-2">+</button>
          <button onClick={handleDeletePrompt} className="px-4 py-2">-</button>
          <span>Prompt {currentIndex + 1} of {prompts.length}</span>
        </div>
      </main>

      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
        <button onClick={handleNext} className="text-5xl">{`>`}</button>
      </div>
    </div>
  );
}
