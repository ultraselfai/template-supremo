/**
 * Database Client - Prisma Singleton
 *
 * Exporta uma instância única do Prisma Client para uso em toda a aplicação.
 * Evita criar múltiplas conexões em ambiente de desenvolvimento (hot reload).
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Exporta como default também para conveniência
export default prisma;

// Re-exporta tipos úteis do Prisma
export type { Prisma } from "@prisma/client";
