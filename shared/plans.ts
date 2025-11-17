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
  readonly stripePriceIdTest: string;
  readonly isPopular?: boolean;
  readonly hidden?: boolean;
}

export type StripeMode = "test" | "live";

export const PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  {
    id: "photo-logo",
    title: "Photo with Logo",
    description: "10 seconds display",
    price: 20,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Content protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1SUXkXF6Bz1PoBh54S0YTgXp",
    stripePriceIdTest: "price_1SUXkXF6Bz1PoBh54S0YTgXp",
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
    stripePriceIdTest: "price_1ST53eF6Bz1PoBh5ysdQt2n3",
    isPopular: true,
    hidden: true,
  },
  {
    id: "photo-clean",
    title: "Clean Photo",
    description: "10 seconds display",
    price: 25,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["No watermarks", "Full flexibility"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1SUXlIF6Bz1PoBh5RXPGlSEJ",
    stripePriceIdTest: "price_1SUXlIF6Bz1PoBh5RXPGlSEJ",
  },
  {
    id: "video-logo",
    title: "Video with Logo",
    description: "10 seconds display",
    price: 30,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Brand protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1SUXm0F6Bz1PoBh5UNrchYks",
    stripePriceIdTest: "price_1SUXm0F6Bz1PoBh5UNrchYks",
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
    stripePriceIdTest: "price_1ST56HF6Bz1PoBh5bOS27LXL",
    isPopular: true,
    hidden: true,
  },
  {
    id: "video-clean",
    title: "Clean Video",
    description: "10 seconds display",
    price: 35,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["Premium quality", "No restrictions"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1SUXmLF6Bz1PoBh56uVMv8RC",
    stripePriceIdTest: "price_1SUXmLF6Bz1PoBh56uVMv8RC",
  },
] as const;

export const PLAN_BY_ID: ReadonlyMap<string, PlanDefinition> = new Map(
  PLAN_DEFINITIONS.map((plan) => [plan.id, plan] as const)
);

export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLAN_BY_ID.get(planId);
}

export function getPlansByType(planType: PlanType): readonly PlanDefinition[] {
  return PLAN_DEFINITIONS.filter((plan) => plan.type === planType && !plan.hidden);
}

export function getStripePriceId(planId: string, mode: StripeMode = "test"): string {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }
  return mode === "live" ? plan.stripePriceId : plan.stripePriceIdTest;
}

export function getStripeMode(): StripeMode {
  const mode = import.meta.env.VITE_STRIPE_MODE as string | undefined;
  return mode === "live" ? "live" : "test";
}

export const PLAN_PRICE_ID_LOOKUP: Readonly<Record<string, string>> = PLAN_DEFINITIONS.reduce(
  (acc, plan) => ({ ...acc, [plan.id]: plan.stripePriceId }),
  {} as Record<string, string>
);

export const PLAN_PRICE_ID_TEST_LOOKUP: Readonly<Record<string, string>> = PLAN_DEFINITIONS.reduce(
  (acc, plan) => ({ ...acc, [plan.id]: plan.stripePriceIdTest }),
  {} as Record<string, string>
);
