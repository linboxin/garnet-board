// The page layout: the sidebar on the left, and the current page on the
// right. There are two pages: the dashboard ("/") and the event form ("/post").

import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PostEvent from './pages/PostEvent.jsx';

export default function App() {
  return (
    <>
      <Sidebar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/post" element={<PostEvent />} />
        </Routes>
        <footer>A student project for CSC 240. Not an official Union College site.</footer>
      </main>
    </>
  );
}
