import type { PatientCategory, PatientInput } from "./types";

export function detectCategory(input: PatientInput): PatientCategory {
  if (input.pregnant === true) return "maternal";
  if (typeof input.age === "number" && input.age < 18) return "pediatric";
  return "adult";
}

// Which rule categories should evaluate for a given patient category
export function applicableCategories(cat: PatientCategory): PatientCategory[] {
  switch (cat) {
    case "maternal":
      return ["maternal", "adult", "universal"];
    case "pediatric":
      return ["pediatric", "universal"];
    case "adult":
      return ["adult", "universal"];
    case "universal":
      return ["universal"];
  }
}
