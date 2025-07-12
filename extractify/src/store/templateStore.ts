// src/store/templateStore.ts

import { create } from 'zustand';
import type { Template } from '../types';

/**
 * @interface TemplateState
 * @description Defines the shape of the state managed by the template store.
 */
interface TemplateState {
  /**
   * An array of all extraction zones (templates) created by the user.
   */
  templates: Template[];
}

/**
 * @interface TemplateActions
 * @description Defines the actions that can be performed on the template store's state.
 */
interface TemplateActions {
  /**
   * Adds a new template to the list.
   * @param {Template} newTemplate - The template object to add.
   */
  addTemplate: (newTemplate: Template) => void;

  /**
   * Removes a template from the list based on its unique ID.
   * @param {string} templateId - The ID of the template to remove.
   */
  removeTemplate: (templateId: string) => void;

  /**
   * Updates the name of an existing template.
   * @param {string} templateId - The ID of the template to update.
   * @param {string} newName - The new name for the template.
   */
  updateTemplateName: (templateId: string, newName: string) => void;
}

/**
 * Custom hook for managing the state of extraction templates.
 *
 * This store holds the array of all user-defined templates and provides
 * actions to add, remove, and update them. It uses Zustand for simple
 * and efficient state management across components.
 *
 * @returns {object} The store's state and actions.
 */
export const useTemplateStore = create<TemplateState & TemplateActions>((set) => ({
  // Initial state
  templates: [],

  // --- ACTIONS ---

  addTemplate: (newTemplate) =>
    set((state) => ({
      templates: [...state.templates, newTemplate],
    })),

  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== templateId),
    })),

  updateTemplateName: (templateId, newName) =>
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === templateId ? { ...template, name: newName } : template
      ),
    })),
}));