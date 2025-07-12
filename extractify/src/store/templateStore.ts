// src/store/templateStore.ts

import { create } from 'zustand';
import type { Template, BoundingBox } from '../types';

/**
 * @interface TemplateState
 * @description Defines the shape of the state managed by the template store.
 */
interface TemplateState {
  /**
   * An array of all extraction zones (templates) created by the user.
   */
  templates: Template[];
  /**
   * The ID of the currently selected template, or null if none is selected.
   */
  selectedTemplateId: string | null;
}

/**
 * @interface TemplateActions
 * @description Defines the actions that can be performed on the template store's state.
 */
interface TemplateActions {
  /**
   * Replaces the entire list of templates with a new one.
   */
  setTemplates: (templates: Template[]) => void;
  /**
   * Adds a new template to the list.
   */
  addTemplate: (newTemplate: Template) => void;
  /**
   * Removes a template from the list based on its unique ID.
   */
  removeTemplate: (templateId: string) => void;
  /**
   * Updates the name of an existing template.
   */
  updateTemplateName: (templateId: string, newName: string) => void;
  /**
   * Sets the currently selected template.
   * @param {string | null} templateId - The ID of the template to select, or null to deselect.
   */
  setSelectedTemplateId: (templateId: string | null) => void;
  /**
   * Updates the bounding box of an existing template.
   * @param {string} templateId - The ID of the template to update.
   * @param {BoundingBox} newBbox - The new bounding box for the template.
   */
  updateTemplateBbox: (templateId: string, newBbox: BoundingBox) => void;
}

/**
 * Custom hook for managing the state of extraction templates.
 */
export const useTemplateStore = create<TemplateState & TemplateActions>((set) => ({
  // Initial state
  templates: [],
  selectedTemplateId: null,

  // --- ACTIONS ---

  setTemplates: (templates) => set({ templates, selectedTemplateId: null }), // Deselect on load

  addTemplate: (newTemplate) =>
    set((state) => ({
      templates: [...state.templates, newTemplate],
    })),

  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== templateId),
      // If the removed template was selected, deselect it.
      selectedTemplateId: state.selectedTemplateId === templateId ? null : state.selectedTemplateId,
    })),

  updateTemplateName: (templateId, newName) =>
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === templateId ? { ...template, name: newName } : template
      ),
    })),

  setSelectedTemplateId: (templateId) => set({ selectedTemplateId: templateId }),

  updateTemplateBbox: (templateId, newBbox) =>
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === templateId ? { ...template, bbox: newBbox } : template
      ),
    })),
}));