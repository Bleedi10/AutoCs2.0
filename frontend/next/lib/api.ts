export type PlanDto = {
  code: string;
  name: string;
  price_month: string; // stringified decimal
  rut_quota: number;
  is_active: boolean;
};

export async function fetchPlans(): Promise<PlanDto[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const url = new URL("/api/plans/", base);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`plans ${res.status}`);
  return await res.json();
}

