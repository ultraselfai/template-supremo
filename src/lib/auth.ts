/**
 * Better Auth - Server Configuration
 *
 * Configuração principal do Better-Auth para o Decode Console.
 * Este arquivo roda apenas no servidor.
 *
 * Plugins habilitados:
 * - organization: Multi-tenancy (subdomínios por tenant)
 * - twoFactor: Autenticação de dois fatores
 * - nextCookies: Integração com Next.js cookies
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/db";

export const auth = betterAuth({
  // Configuração do banco de dados via Prisma
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Autenticação por email/senha habilitada
  emailAndPassword: {
    enabled: true,
    // TODO: Configurar envio de email de verificação
    // sendResetPassword: async ({ user, url }) => { ... },
  },

  // Plugins
  plugins: [
    // Multi-tenancy via Organizations
    organization({
      // Permite qualquer usuário criar organização (ajustar depois para planos)
      allowUserToCreateOrganization: true,

      // Limite de organizações por usuário (ajustar para planos)
      organizationLimit: 5,

      // Schema customizado para usar nossa tabela "organizations" existente
      schema: {
        organization: {
          modelName: "organization", // Mapeia para tabela organizations
        },
      },

      // Roles padrão
      // owner: Dono da organização, pode tudo
      // admin: Administrador, pode gerenciar membros
      // member: Membro comum, apenas acesso
    }),

    // Two-Factor Authentication
    twoFactor({
      issuer: "Decode Console",
      // Métodos de 2FA disponíveis
      otpOptions: {
        // TOTP (Google Authenticator, etc)
        async sendOTP({ user, otp }) {
          // TODO: Enviar OTP por email quando configurar serviço de email
          console.log(`[DEV] OTP para ${user.email}: ${otp}`);
        },
      },
    }),

    // Integração com Next.js (deve ser o último plugin)
    nextCookies(),
  ],

  // Configurações de sessão
  session: {
    // Tempo de expiração: 7 dias
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    // Atualizar sessão quando faltar 1 dia para expirar
    updateAge: 60 * 60 * 24, // 1 day in seconds
  },

  // URLs de redirecionamento
  // TODO: Ajustar para produção
  // baseURL: process.env.BETTER_AUTH_URL,
});

// Exporta o tipo do auth para inferência no cliente
export type Auth = typeof auth;
