import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import TwoFA from './components/TwoFA';
import ForgotPassword from './components/ForgotPassword';
import Home from './components/Home';
import AuthLayout from './components/AuthLayout';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="2fa" element={<TwoFA />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
