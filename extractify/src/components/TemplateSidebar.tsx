// src/components/TemplateSidebar.tsx

import React from 'react';
import { useTemplateStore } from '../store/templateStore';
import PdfUploader from './PdfUploader';
import TemplateLoader from './TemplateLoader'; // Import the new component

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

  /**
   * Handles the "Save Template" button click.
   * Converts the current templates to a JSON string and triggers a download.
   */
  const handleSaveTemplate = () => {
    if (templates.length === 0) return;

    // Create a JSON string from the templates array.
    const jsonString = JSON.stringify(templates, null, 2); // Pretty print the JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download.
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${Date.now()}.json`; // e.g., template-1678886400000.json
    document.body.appendChild(a);
    a.click();

    // Clean up by revoking the object URL and removing the anchor.
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="template-sidebar-container">
      <div className="sidebar-section">
        <h2>File Management</h2>
        <PdfUploader />
      </div>

      <div className="sidebar-section">
        <div className="template-list-header">
          <h2>Extraction Zones</h2>
        </div>
        <div className="template-list">
          <ul>
            {templates.length === 0 && (
              <li className="empty-list-item">
                <p>No zones created yet. Draw on the PDF to begin.</p>
              </li>
            )}
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
        <button onClick={handleSaveTemplate} disabled={templates.length === 0}>
          Save Template
        </button>
        <TemplateLoader />
      </div>
    </aside>
  );
};

export default TemplateSidebar;