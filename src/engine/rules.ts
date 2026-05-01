import type { Rule } from "./types";
import dangerSigns from "@/rules/danger_signs.json";
import respiratory from "@/rules/respiratory.json";
import fever from "@/rules/fever.json";
import dehydration from "@/rules/dehydration.json";
import anemia from "@/rules/anemia.json";
import maternal from "@/rules/maternal.json";
import adultEmergency from "@/rules/adult_emergency.json";

let _all: Rule[] | null = null;

export function loadAllRules(): Rule[] {
  if (_all) return _all;
  _all = [
    ...(dangerSigns as Rule[]),
    ...(respiratory as Rule[]),
    ...(fever as Rule[]),
    ...(dehydration as Rule[]),
    ...(anemia as Rule[]),
    ...(maternal as Rule[]),
    ...(adultEmergency as Rule[]),
  ];
  return _all;
}
