/**
 * Cloudflare R2 Client
 *
 * Cliente S3-compatible para upload de arquivos no Cloudflare R2.
 * Usa Presigned URLs para upload direto do browser (sem passar pelo servidor).
 *
 * Uso:
 * ```ts
 * import { getPresignedUploadUrl, getPublicUrl } from "@/lib/r2";
 *
 * // Gerar URL para upload
 * const { url, key } = await getPresignedUploadUrl("avatar.jpg", "image/jpeg");
 *
 * // Upload direto do browser
 * await fetch(url, { method: "PUT", body: file });
 *
 * // Obter URL pública
 * const publicUrl = getPublicUrl(key);
 * ```
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuração do cliente R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Endpoint do R2 (formato S3-compatible)
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Cliente S3 configurado para R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Tipos de arquivos permitidos
export const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: ["application/pdf"],
  all: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"],
} as const;

// Tamanho máximo de arquivo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Gera uma key única para o arquivo
 */
function generateFileKey(filename: string, folder?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = filename.split(".").pop() || "";
  const safeFilename = filename
    .replace(/\.[^/.]+$/, "") // Remove extensão
    .replace(/[^a-zA-Z0-9-_]/g, "-") // Remove caracteres especiais
    .substring(0, 50); // Limita tamanho

  const key = `${safeFilename}-${timestamp}-${random}.${extension}`;
  
  return folder ? `${folder}/${key}` : key;
}

/**
 * Gera uma Presigned URL para upload direto do browser
 *
 * @param filename - Nome original do arquivo
 * @param contentType - Tipo MIME do arquivo
 * @param folder - Pasta opcional (ex: "avatars", "logos")
 * @param expiresIn - Tempo de expiração em segundos (padrão: 5 minutos)
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder?: string,
  expiresIn = 300
): Promise<{ url: string; key: string }> {
  const key = generateFileKey(filename, folder);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn });

  return { url, key };
}

/**
 * Retorna a URL pública de um arquivo
 *
 * @param key - Key do arquivo no R2
 */
export function getPublicUrl(key: string): string {
  // Remove barra inicial se existir
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

/**
 * Verifica se um arquivo existe no R2
 *
 * @param key - Key do arquivo no R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Deleta um arquivo do R2
 *
 * @param key - Key do arquivo no R2
 */
export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Valida o tipo e tamanho do arquivo
 */
export function validateFile(
  file: { type: string; size: number },
  allowedTypes: readonly string[] = ALLOWED_FILE_TYPES.image,
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
