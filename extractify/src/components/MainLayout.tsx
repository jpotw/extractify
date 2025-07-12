// src/components/MainLayout.tsx

import React from 'react';
import PdfViewer from './PdfViewer';
import TemplateSidebar from './TemplateSidebar';

/**
 * @file A primary layout component that structures the main application interface.
 * @component
 *
 * @description
 * MainLayout defines the overall visual structure of the application,
 * creating a two-column view. It renders the `PdfViewer` component in the
 * main, larger area on the left, and the `TemplateSidebar` component in the
 * fixed-width panel on the right.
 *
 * This component does not manage state; its sole responsibility is layout.
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