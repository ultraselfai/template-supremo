/**
 * Projects Feature - Public API
 *
 * Este arquivo exporta apenas o que deve ser acessível
 * por outras partes da aplicação.
 */

// Types
export type {
  Project,
  ProjectStatus,
  ProjectWithMeta,
  ProjectsListResult,
  ProjectActionResult,
} from "./types";

// Schemas & Validation Types
export {
  createProjectSchema,
  updateProjectSchema,
  projectFilterSchema,
} from "./schemas";

export type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterInput,
} from "./schemas";

// Server Actions
// export { createProject, updateProject, deleteProject } from "./actions";
