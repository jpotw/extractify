// src/App.tsx

import MainLayout from './components/MainLayout';
import './App.css';

/**
 * @file The root component of the entire React application.
 * @component
 *
 * @description
 * This is the primary entry point for the application's UI. Its main
 * responsibility is to set up the global styles and render the top-level
 * layout component, `MainLayout`. All other UI components are children
 * of `MainLayout`.
 *
 * @returns {JSX.Element} The root element of the application.
 */
function App() {
  return (
    <div className="app-container">
      <MainLayout />
    </div>
  );
}

export default App;