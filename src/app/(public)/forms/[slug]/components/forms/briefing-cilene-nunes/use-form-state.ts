/**
 * Custom hook for managing form state (DEC-29)
 */

import { useState, useCallback } from "react";
import { BriefingFormData, LOGO_REFERENCES, TYPOGRAPHY_REFERENCES, BRAND_ELEMENTS } from "./types";

const TOTAL_STEPS = 12; // 11 steps + completion

interface FormStateOptions {
  skipWelcome?: boolean;
}

const initialFormData: BriefingFormData = {
  // Step 1
  brandKeywords: [],
  customKeywords: [],
  
  // Step 2
  clientConcern: null,
  clientConcernCustom: "",
  
  // Step 3
  careerPositioning: null,
  
  // Step 4 & 5
  logoReferences: LOGO_REFERENCES.map(ref => ({ id: ref.id, liked: null })),
  logoRanking: [],
  
  // Step 6 & 7
  typographyReferences: TYPOGRAPHY_REFERENCES.map(ref => ({ id: ref.id, liked: null })),
  typographyRanking: [],
  
  // Step 8
  selectedPalettes: [],
  
  // Step 9
  elementsRanking: BRAND_ELEMENTS.map(e => e.id),
  
  // Step 10
  absoluteNo: "",
  
  // Step 11
  extraBrandReferences: "",
  uploadedFiles: [],
  uploadedFilesUrls: [],
};

export function useFormState(options: FormStateOptions = {}) {
  const [showWelcome, setShowWelcome] = useState(!options.skipWelcome);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BriefingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const startForm = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const updateFormData = useCallback(<K extends keyof BriefingFormData>(
    key: K,
    value: BriefingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setDirection("forward");
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setDirection("backward");
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setDirection(step > currentStep ? "forward" : "backward");
      setCurrentStep(step);
    }
  }, [currentStep]);

  // Get liked logos for ranking step
  const getLikedLogos = useCallback(() => {
    return formData.logoReferences
      .filter(ref => ref.liked === true)
      .map(ref => ref.id);
  }, [formData.logoReferences]);

  // Get liked typography for ranking step
  const getLikedTypography = useCallback(() => {
    return formData.typographyReferences
      .filter(ref => ref.liked === true)
      .map(ref => ref.id);
  }, [formData.typographyReferences]);

  // Check if step is valid to proceed
  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // DNA da Marca
        return formData.brandKeywords.length > 0 || formData.customKeywords.length > 0;
      case 2: // Perfil do Cliente
        return formData.clientConcern !== null || formData.clientConcernCustom.trim() !== "";
      case 3: // Transição de Carreira
        return formData.careerPositioning !== null;
      case 4: // Referências Visuais
        return formData.logoReferences.some(ref => ref.liked !== null);
      case 5: // Ranking Logos
        return getLikedLogos().length === 0 || formData.logoRanking.length > 0;
      case 6: // Tipografia
        return formData.typographyReferences.some(ref => ref.liked !== null);
      case 7: // Ranking Tipografias
        return getLikedTypography().length === 0 || formData.typographyRanking.length > 0;
      case 8: // Paleta de Cores
        return formData.selectedPalettes.length > 0;
      case 9: // Ranking Elementos
        return formData.elementsRanking.length > 0;
      case 10: // O "Não" Absoluto
        return true; // Optional
      case 11: // Referências Extras
        return true; // Optional
      default:
        return true;
    }
  }, [formData, getLikedLogos, getLikedTypography]);

  const completeForm = useCallback(() => {
    setIsCompleted(true);
    setCurrentStep(TOTAL_STEPS);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setIsCompleted(false);
    setIsSubmitting(false);
    setShowWelcome(true);
  }, []);

  return {
    showWelcome,
    currentStep,
    formData,
    isSubmitting,
    isCompleted,
    direction,
    progress,
    totalSteps: TOTAL_STEPS,
    startForm,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    getLikedLogos,
    getLikedTypography,
    canProceed,
    completeForm,
    resetForm,
    setIsSubmitting,
  };
}
