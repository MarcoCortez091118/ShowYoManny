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
};
