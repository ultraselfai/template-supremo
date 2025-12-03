import { z } from "zod";

/**
 * Projects Validation Schemas
 *
 * Schemas Zod para validação de dados de projetos.
 * Use estes schemas nas Server Actions para garantir type-safety.
 */

export const createProjectSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  tenantId: z.string().uuid("Tenant ID inválido"),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid("Project ID inválido"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
  description: z.string().optional(),
  status: z.enum(["active", "archived", "deleted"]).optional(),
});

export const projectFilterSchema = z.object({
  tenantId: z.string().uuid("Tenant ID inválido"),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

// Tipos inferidos dos schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
