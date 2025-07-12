// src/components/TemplateSidebar.tsx

import React from 'react';

/**
 * @file Renders the sidebar for creating and managing extraction templates.
 * @component
 *
 * @description
 * The TemplateSidebar provides the user interface for all template-related
 * actions. This includes:
 * - A list of currently defined extraction zones (bounding boxes).
 * - Controls to edit the name of or delete an existing zone.
 * - Buttons to save the current template to a file or load an existing one.
 *
 * In this initial implementation, all UI elements are static placeholders
 * to establish the layout.
 *
 * @returns {JSX.Element} The rendered Template Sidebar component.
 */
const TemplateSidebar: React.FC = () => {
  return (
    <aside className="template-sidebar-container">
      <h2>Template Management</h2>
      
      <div className="template-list">
        <h4>Extraction Zones</h4>
        <ul>
          <li>
            <span>Vendor Name</span>
            <div className="zone-actions">
              <button disabled>Edit</button>
              <button disabled>Delete</button>
            </div>
          </li>
          <li>
            <span>Invoice Date</span>
            <div className="zone-actions">
              <button disabled>Edit</button>
              <button disabled>Delete</button>
            </div>
          </li>
          <li>
            <span>Total Amount</span>
            <div className="zone-actions">
              <button disabled>Edit</button>
              <button disabled>Delete</button>
            </div>
          </li>
        </ul>
      </div>

      <div className="template-actions">
        <button disabled>Save Template</button>
        <button disabled>Load Template</button>
      </div>
    </aside>
  );
};

export default TemplateSidebar;