import { embed } from "ai";
import { getEmbeddingModel } from "@/lib/ai";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { resumeService } from "@/server/modules/resume/resume.service";

export const profileService = {
  async generateProfileEmbedding(profile: ResumeProfile): Promise<number[]> {
    const profileText = resumeService.prepareResumeForEmbedding(profile);

    const { embedding } = await embed({
      model: getEmbeddingModel().model,
      value: profileText,
      providerOptions: getEmbeddingModel().providerOptions,
    });

    return embedding;
  },

  async validateProfile(profile: ResumeProfile): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate personal info
    if (!profile.personalInfo.name?.trim()) {
      errors.push("Name is required");
    }

    if (!profile.personalInfo.email?.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.personalInfo.email)) {
      errors.push("Invalid email format");
    }

    // Validate experience dates if present
    if (profile.experience) {
      profile.experience.forEach((exp, index) => {
        if (exp.startDate && !/^\d{4}-\d{2}$/.test(exp.startDate)) {
          errors.push(`Experience ${index + 1}: Invalid start date format (YYYY-MM required)`);
        }
        if (exp.endDate && !exp.isCurrent && !/^\d{4}-\d{2}$/.test(exp.endDate)) {
          errors.push(`Experience ${index + 1}: Invalid end date format (YYYY-MM required)`);
        }
      });
    }

    // Validate education dates if present
    if (profile.education) {
      profile.education.forEach((edu, index) => {
        if (edu.startDate && !/^\d{4}-\d{2}$/.test(edu.startDate)) {
          errors.push(`Education ${index + 1}: Invalid start date format (YYYY-MM required)`);
        }
        if (edu.endDate && !/^\d{4}-\d{2}$/.test(edu.endDate)) {
          errors.push(`Education ${index + 1}: Invalid end date format (YYYY-MM required)`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
