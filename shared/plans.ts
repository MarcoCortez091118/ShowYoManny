export type PlanType = "photo" | "video";

export interface PlanDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly currency: "USD";
  readonly type: PlanType;
  readonly displayDurationSeconds: number;
  readonly features: readonly string[];
  readonly includesBorder: boolean;
  readonly includesLogo: boolean;
  readonly stripePriceId: string;
  readonly isPopular?: boolean;
}

export const PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  {
    id: "photo-logo",
    title: "Photo with Logo",
    description: "10 seconds display",
    price: 10,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Content protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1S8tkJF6Bz1PoBh55VqRIrC3",
  },
  {
    id: "photo-border-logo",
    title: "Photo with Border + Logo",
    description: "10 seconds display",
    price: 15,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["Custom border", "ShowYo watermark"],
    includesBorder: true,
    includesLogo: true,
    stripePriceId: "price_1S8tn8F6Bz1PoBh5nT9k1JT3",
    isPopular: true,
  },
  {
    id: "photo-clean",
    title: "Clean Photo",
    description: "10 seconds display",
    price: 15,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["No watermarks", "Full flexibility"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1S8tpmF6Bz1PoBh5FA5LLqTK",
  },
  {
    id: "video-logo",
    title: "Video with Logo",
    description: "10 seconds display",
    price: 20,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Brand protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1S8tqdF6Bz1PoBh5PKK3WZe9",
  },
  {
    id: "video-border-logo",
    title: "Video with Border + Logo",
    description: "10 seconds display",
    price: 25,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["Custom border", "ShowYo watermark"],
    includesBorder: true,
    includesLogo: true,
    stripePriceId: "price_1S8trAF6Bz1PoBh5S1knkYcR",
    isPopular: true,
  },
  {
    id: "video-clean",
    title: "Clean Video",
    description: "10 seconds display",
    price: 30,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["Premium quality", "No restrictions"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1S8treF6Bz1PoBh59KkmfJiu",
  },
] as const;

export const PLAN_BY_ID: ReadonlyMap<string, PlanDefinition> = new Map(
  PLAN_DEFINITIONS.map((plan) => [plan.id, plan] as const)
);

export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLAN_BY_ID.get(planId);
}

export function getPlansByType(planType: PlanType): readonly PlanDefinition[] {
  return PLAN_DEFINITIONS.filter((plan) => plan.type === planType);
}

export const PLAN_PRICE_ID_LOOKUP: Readonly<Record<string, string>> = PLAN_DEFINITIONS.reduce(
  (acc, plan) => ({ ...acc, [plan.id]: plan.stripePriceId }),
  {} as Record<string, string>
);
