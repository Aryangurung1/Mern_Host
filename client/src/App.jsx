import React from "react";
import Routes from "./Routes/Routes.jsx";
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import ChatHead from "./components/chat/ChatHead";

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes />
      </main>
      <Footer />
      <ChatHead />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;