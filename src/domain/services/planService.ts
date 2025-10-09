import {
  PLAN_DEFINITIONS,
  PLAN_PRICE_ID_LOOKUP,
  PlanDefinition,
  PlanType,
  getPlanById,
  getPlansByType,
} from "../../../shared/plans";

export type { PlanDefinition, PlanType } from "../../../shared/plans";

export interface PlanSummary {
  id: string;
  title: string;
  description: string;
  price: number;
  type: PlanType;
  isPopular: boolean;
  features: readonly string[];
}

export const planService = {
  getAllPlans(): readonly PlanDefinition[] {
    return PLAN_DEFINITIONS;
  },

  getPlansByType(planType: PlanType): readonly PlanDefinition[] {
    return getPlansByType(planType);
  },

  getPlan(planId: string): PlanDefinition | undefined {
    return getPlanById(planId);
  },

  getDefaultPlanForType(planType: PlanType): PlanDefinition | undefined {
    const plans = this.getPlansByType(planType);
    if (!plans.length) {
      return undefined;
    }
    return plans.find((plan) => plan.isPopular) ?? plans[0];
  },

  getPlanSummariesByType(planType: PlanType): readonly PlanSummary[] {
    return this.getPlansByType(planType).map((plan) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      price: plan.price,
      type: plan.type,
      isPopular: Boolean(plan.isPopular),
      features: this.getDisplayFeatures(plan),
    }));
  },

  planRequiresBorder(planId: string): boolean {
    const plan = this.getPlan(planId);
    return plan?.includesBorder ?? false;
  },

  planIncludesLogo(planId: string): boolean {
    const plan = this.getPlan(planId);
    return plan?.includesLogo ?? false;
  },

  planSupportsBorderSelection(planId: string): boolean {
    const plan = this.getPlan(planId);
    return Boolean(plan?.includesBorder);
  },

  getStripePriceId(planId: string): string | undefined {
    return PLAN_PRICE_ID_LOOKUP[planId];
  },

  getDisplayFeatures(plan: PlanDefinition): readonly string[] {
    return [
      `${plan.displayDurationSeconds} seconds display`,
      ...plan.features,
    ];
  },

  validateAssetForPlan(planId: string, mimeType: string): {
    valid: boolean;
    expectedType: PlanType | null;
  } {
    const plan = this.getPlan(planId);
    if (!plan) {
      return { valid: false, expectedType: null };
    }

    const type = mimeType.startsWith("video/") ? "video" : mimeType.startsWith("image/") ? "photo" : null;
    if (!type) {
      return { valid: false, expectedType: plan.type };
    }

    return {
      valid: plan.type === type,
      expectedType: plan.type,
    };
  },
};
