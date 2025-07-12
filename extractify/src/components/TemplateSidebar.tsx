// src/components/TemplateSidebar.tsx

import React from 'react';
import { useTemplateStore } from '../store/templateStore';
import PdfUploader from './PdfUploader'; // Import the new component

/**
 * @file Renders the sidebar for creating and managing extraction templates.
 * @component
 *
 * @description
 * The TemplateSidebar is the main control panel. It allows users to upload a PDF,
 * view the list of extraction zones, and save/load templates. It is fully
 * driven by the `useTemplateStore`.
 *
 * @returns {JSX.Element} The rendered Template Sidebar component.
 */
const TemplateSidebar: React.FC = () => {
  const { templates, removeTemplate } = useTemplateStore();

  return (
    <aside className="template-sidebar-container">
      <div>
        <h2>File</h2>
        <PdfUploader /> {/* Add the uploader component here */}
      </div>

      <div>
        <h2>Template Management</h2>
        <div className="template-list">
          <div className="template-list-header">
            <h4>Extraction Zones</h4>
          </div>

          <ul>
            {/* If there are no templates, show a message */}
            {templates.length === 0 && (
              <li className="empty-list-item">
                <p>No zones created yet. Draw on the PDF to begin.</p>
              </li>
            )}
            {/* Dynamically render the list of templates from the store */}
            {templates.map((template) => (
              <li key={template.id}>
                <span>{template.name}</span>
                <div className="zone-actions">
                  <button disabled>Edit</button>
                  <button onClick={() => removeTemplate(template.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="template-actions">
        <button disabled={templates.length === 0}>Save Template</button>
        <button>Load Template</button>
      </div>
    </aside>
  );
};

export default TemplateSidebar;