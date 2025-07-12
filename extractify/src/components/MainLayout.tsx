// src/components/MainLayout.tsx

import React from 'react';
import PdfViewer from './PdfViewer';
import TemplateSidebar from './TemplateSidebar';

/**
 * @file A primary layout component that structures the main application interface.
 * @component
 *
 * @description
 * MainLayout defines the overall visual structure, creating a two-column view.
 * It renders the `PdfViewer` on the left and `TemplateSidebar` on the right.
 * Its sole responsibility is layout and composition.
 *
 * @returns {JSX.Element} The main two-column layout of the application.
 */
const MainLayout: React.FC = () => {
  return (
    <main className="main-layout">
      <PdfViewer />
      <TemplateSidebar />
    </main>
  );
};

export default MainLayout;