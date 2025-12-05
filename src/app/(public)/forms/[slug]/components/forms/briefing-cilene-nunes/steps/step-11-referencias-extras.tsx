/**
 * Step 11: Referências Extras + Upload (DEC-29)
 * Faz upload real para R2 storage
 */

"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StepHeader } from "../ui-components";
import { FORM_THEME, type UploadedFileInfo } from "../types";
import { generatePublicUploadUrl } from "@/features/upload/actions-public";
import { toast } from "sonner";

interface Step11Props {
  brandReferences: string;
  uploadedFiles: File[];
  uploadedFilesUrls: UploadedFileInfo[];
  formSlug: string;
  onBrandReferencesChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onFilesUrlsChange: (urls: UploadedFileInfo[]) => void;
}

interface FilePreview {
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  uploadedInfo?: UploadedFileInfo;
}

export function Step11ReferenciasExtras({
  brandReferences,
  uploadedFilesUrls,
  formSlug,
  onBrandReferencesChange,
  onFilesUrlsChange,
}: Step11Props) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadedFileInfo | null> => {
    try {
      // 1. Obter URL pré-assinada
      const result = await generatePublicUploadUrl(file.name, file.type, formSlug);
      
      if (!result.success) {
        setUploadError(result.error);
        toast.error(result.error);
        return null;
      }

      // 2. Upload direto para o R2
      const uploadResponse = await fetch(result.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        const errorMsg = `Erro no upload: ${uploadResponse.status}`;
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      setUploadError(null);
      return {
        name: file.name,
        publicUrl: result.publicUrl,
        key: result.key,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido no upload";
      console.error("Upload error:", error);
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return null;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Create previews with uploading status
      const newPreviews: FilePreview[] = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: "uploading" as const,
      }));
      
      setPreviews((prev) => [...prev, ...newPreviews]);

      // Upload each file
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const uploadedInfo = await uploadFile(file);
        
        setPreviews((prev) => {
          const newPreviews = [...prev];
          const previewIndex = prev.findIndex((p) => p.file === file);
          if (previewIndex !== -1) {
            newPreviews[previewIndex] = {
              ...newPreviews[previewIndex],
              status: uploadedInfo ? "success" : "error",
              uploadedInfo: uploadedInfo || undefined,
            };
          }
          return newPreviews;
        });

        return uploadedInfo;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is UploadedFileInfo => r !== null);
      
      if (successfulUploads.length > 0) {
        onFilesUrlsChange([...uploadedFilesUrls, ...successfulUploads]);
      }
      
      if (successfulUploads.length < acceptedFiles.length) {
        toast.error("Alguns arquivos não puderam ser enviados");
      }
    },
    [formSlug, uploadedFilesUrls, onFilesUrlsChange]
  );

  const removeFile = (preview: FilePreview) => {
    // Revoke object URL
    URL.revokeObjectURL(preview.preview);
    
    // Remove from previews
    setPreviews((prev) => prev.filter((p) => p !== preview));
    
    // Remove from uploaded URLs if it was successfully uploaded
    if (preview.uploadedInfo) {
      onFilesUrlsChange(
        uploadedFilesUrls.filter((u) => u.key !== preview.uploadedInfo?.key)
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div>
      <StepHeader
        title="Referências Extras"
        description="Fora a imagem que você me mandou, existe alguma outra marca (pode ser de outra área, tipo loja de roupa ou café) que você acha linda?"
      />

      {/* Text Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Textarea
          value={brandReferences}
          onChange={(e) => onBrandReferencesChange(e.target.value)}
          placeholder="Escreva o nome de marcas que você admira..."
          className="min-h-[100px] resize-none text-base"
          style={{
            backgroundColor: FORM_THEME.badgeBackground,
            borderColor: "transparent",
            color: FORM_THEME.title,
          }}
        />
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span
          className="text-sm font-medium"
          style={{ color: FORM_THEME.description }}
        >
          ou
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label
          className="text-sm font-medium mb-2 block"
          style={{ color: FORM_THEME.title }}
        >
          Faça upload de marcas ou referências que goste:
        </Label>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive ? "border-solid scale-[1.02]" : "hover:border-solid"}
          `}
          style={{
            borderColor: isDragActive
              ? FORM_THEME.progressBar
              : `${FORM_THEME.progressBar}80`,
            backgroundColor: isDragActive
              ? `${FORM_THEME.progressBar}10`
              : "transparent",
          }}
        >
          <input {...getInputProps()} />
          <Upload
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: FORM_THEME.progressBar }}
          />
          <p className="font-medium" style={{ color: FORM_THEME.title }}>
            {isDragActive
              ? "Solte as imagens aqui..."
              : "Arraste imagens ou clique para selecionar"}
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: FORM_THEME.description }}
          >
            PNG, JPG, GIF até 10MB
          </p>
        </div>

        {/* Error Message */}
        {uploadError && (
          <div 
            className="mt-3 p-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
            }}
          >
            <p className="font-medium mb-1">⚠️ Erro no upload</p>
            <p className="text-xs opacity-80">{uploadError}</p>
            <p className="text-xs mt-2 opacity-60">
              Você pode continuar sem enviar imagens - este campo é opcional.
            </p>
          </div>
        )}
      </motion.div>

      {/* Uploaded Files Preview */}
      {previews.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {previews.map((preview, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-lg overflow-hidden group"
              style={{ backgroundColor: FORM_THEME.badgeBackground }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.preview}
                alt={preview.file.name}
                className="w-full h-full object-cover"
              />
              
              {/* Upload status overlay */}
              {preview.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {preview.status === "success" && (
                <div className="absolute top-1 left-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-lg" />
                </div>
              )}
              
              {preview.status === "error" && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">Erro</span>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(preview);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white
                  flex items-center justify-center opacity-0 group-hover:opacity-100
                  transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          {/* Add more indicator */}
          <div
            {...getRootProps()}
            className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-solid transition-all"
            style={{ borderColor: `${FORM_THEME.progressBar}60` }}
          >
            <ImageIcon
              className="w-8 h-8"
              style={{ color: `${FORM_THEME.progressBar}60` }}
            />
          </div>
        </motion.div>
      )}

      <p
        className="text-sm mt-4 text-center"
        style={{ color: FORM_THEME.description }}
      >
        Este campo é opcional
      </p>
    </div>
  );
}
