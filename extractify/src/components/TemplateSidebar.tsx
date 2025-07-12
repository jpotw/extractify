// src/components/TemplateSidebar.tsx

import React from 'react';
import { useTemplateStore } from '../store/templateStore';

/**
 * @file Renders the sidebar for creating and managing extraction templates.
 * @component
 *
 * @description
 * The TemplateSidebar is now a dynamic component driven by the `useTemplateStore`.
 * It subscribes to the `templates` array and automatically re-renders when the
 * state changes. It provides UI controls to add (for testing), and delete templates,
 * dispatching actions to the central store.
 *
 * @returns {JSX.Element} The rendered Template Sidebar component.
 */
const TemplateSidebar: React.FC = () => {
  // Connect to the Zustand store
  const { templates, addTemplate, removeTemplate } = useTemplateStore();

  /**
   * Handler for adding a new dummy template for testing purposes.
   */
  const handleAddDummyTemplate = () => {
    const newId = `template_${Date.now()}`;
    addTemplate({
      id: newId,
      name: `New Zone ${templates.length + 1}`,
      bbox: { x1: 0, y1: 0, x2: 100, y2: 50 }, // Dummy coordinates
    });
  };

  return (
    <aside className="template-sidebar-container">
      <h2>Template Management</h2>

      <div className="template-list">
        <div className="template-list-header">
          <h4>Extraction Zones</h4>
          {/* This button is temporary for testing state management */}
          <button onClick={handleAddDummyTemplate} title="Add a test zone">
            + Add
          </button>
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

      <div className="template-actions">
        {/* Disable buttons if there are no templates to save */}
        <button disabled={templates.length === 0}>Save Template</button>
        <button>Load Template</button>
      </div>
    </aside>
  );
};

export default TemplateSidebar;