/**
 * Projects Types
 *
 * Tipos TypeScript para a feature de projetos.
 * Separados dos schemas Zod para melhor organização.
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  tenantId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "active" | "archived" | "deleted";

export interface ProjectWithMeta extends Project {
  createdBy: {
    id: string;
    name: string;
  };
  _count: {
    tasks: number;
    members: number;
  };
}

export interface ProjectsListResult {
  projects: ProjectWithMeta[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProjectActionResult {
  success: boolean;
  message?: string;
  project?: Project;
}
