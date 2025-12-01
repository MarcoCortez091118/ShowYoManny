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
    price: 22,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Content protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1SVUGkF6Bz1PoBh5KrmXEX8f",
    stripePriceIdTest: "price_1SVUGkF6Bz1PoBh5KrmXEX8f",
    isPopular: true,
  },
  {
    id: "photo-border",
    title: "Photo with Border",
    description: "10 seconds display",
    price: 27,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["Custom border", "ShowYo watermark", "10 seconds display"],
    includesBorder: true,
    includesLogo: true,
    stripePriceId: "price_1SZd16F6Bz1PoBh5GhtzKlTf",
    stripePriceIdTest: "price_1SZd16F6Bz1PoBh5GhtzKlTf",
  },
  {
    id: "photo-clean",
    title: "Clean Photo",
    description: "10 seconds display",
    price: 27,
    currency: "USD",
    type: "photo",
    displayDurationSeconds: 10,
    features: ["No watermarks", "Full flexibility"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1SVUHnF6Bz1PoBh5NeroOWlL",
    stripePriceIdTest: "price_1SVUHnF6Bz1PoBh5NeroOWlL",
  },
  {
    id: "video-logo",
    title: "Video with Logo",
    description: "10 seconds display",
    price: 32,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["ShowYo watermark", "Brand protection"],
    includesBorder: false,
    includesLogo: true,
    stripePriceId: "price_1SVUIbF6Bz1PoBh5034cDIXq",
    stripePriceIdTest: "price_1SVUIbF6Bz1PoBh5034cDIXq",
  },
  {
    id: "video-border",
    title: "Video with Border",
    description: "10 seconds display",
    price: 37,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["Custom border", "ShowYo watermark", "10 seconds display"],
    includesBorder: true,
    includesLogo: true,
    stripePriceId: "price_1SZd1mF6Bz1PoBh5LmgdbMFW",
    stripePriceIdTest: "price_1SZd1mF6Bz1PoBh5LmgdbMFW",
  },
  {
    id: "video-clean",
    title: "Clean Video",
    description: "10 seconds display",
    price: 37,
    currency: "USD",
    type: "video",
    displayDurationSeconds: 10,
    features: ["Premium quality", "No restrictions"],
    includesBorder: false,
    includesLogo: false,
    stripePriceId: "price_1SVUJmF6Bz1PoBh5lZYET6CB",
    stripePriceIdTest: "price_1SVUJmF6Bz1PoBh5lZYET6CB",
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
