/**
 * Prisma Seed Script
 * 
 * Cria dados iniciais para desenvolvimento:
 * - Organização "Decode" como tenant principal
 * - Usuário admin com credenciais padrão
 * - Member vinculando admin à organização
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { randomBytes } from "crypto";

// Configuração do Prisma 7 com adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Converte bytes para hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash de senha usando scrypt (algoritmo padrão do Better Auth)
 * Formato: salt:hash (ambos em hex)
 * Usa os mesmos parâmetros do Better Auth: N=16384, r=16, p=1, dkLen=64
 */
async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(randomBytes(16));
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(key)}`;
}

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Criar organização Decode
  const org = await prisma.organization.upsert({
    where: { slug: "decode" },
    update: {},
    create: {
      id: "org-decode-001",
      name: "Decode",
      slug: "decode",
      logo: null,
      metadata: {
        plan: "enterprise",
        domain: "decode.ink",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Organização criada:");
  console.log(`   Nome: ${org.name}`);
  console.log(`   Slug: ${org.slug}`);
  console.log(`   ID: ${org.id}\n`);

  // 2. Criar usuário admin
  const adminEmail = "admin@decode.ink";
  const adminPassword = "Admin@123";
  const hashedPassword = await hashPassword(adminPassword);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: "user-admin-001",
      name: "Decode Admin",
      email: adminEmail,
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Usuário admin criado:");
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // 3. Criar account (credenciais de login)
  await prisma.account.upsert({
    where: {
      id: "account-admin-001",
    },
    update: {
      password: hashedPassword,
    },
    create: {
      id: "account-admin-001",
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Account (credenciais) criada");
  console.log(`   Provider: credential`);
  console.log(`   Senha: ${adminPassword}\n`);

  // 4. Criar member (vínculo user-organization)
  await prisma.member.upsert({
    where: {
      id: "member-admin-001",
    },
    update: {},
    create: {
      id: "member-admin-001",
      userId: user.id,
      organizationId: org.id,
      role: "owner",
      createdAt: new Date(),
    },
  });

  console.log("✅ Member criado (vínculo usuário-organização)");
  console.log(`   Role: owner\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Seed concluído com sucesso!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Credenciais de acesso:\n");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminPassword}`);
  console.log("\n   🌐 URLs:");
  console.log("      Login: http://localhost:3000/sign-in");
  console.log("      Org:   http://decode.localhost:3000");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
