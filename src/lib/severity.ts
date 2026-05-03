import type { Lang } from "@/i18n/dict";
import { t } from "@/i18n/dict";
import type { Severity } from "@/engine/types";

export function severityClasses(sev: Severity) {
  switch (sev) {
    case "Emergency":
      return {
        banner: "bg-gradient-to-br from-severity-emergency to-severity-emergency/90 text-severity-emergency-foreground",
        soft: "bg-severity-emergency-soft text-severity-emergency",
        chip: "bg-severity-emergency text-severity-emergency-foreground",
      };
    case "PHC Referral":
      return {
        banner: "bg-gradient-to-br from-severity-phc to-severity-phc/90 text-severity-phc-foreground",
        soft: "bg-severity-phc-soft text-severity-phc-foreground",
        chip: "bg-severity-phc text-severity-phc-foreground",
      };
    case "Home Care":
      return {
        banner: "bg-gradient-to-br from-severity-home to-severity-home/90 text-severity-home-foreground",
        soft: "bg-severity-home-soft text-severity-home",
        chip: "bg-severity-home text-severity-home-foreground",
      };
  }
}

export function severityLabel(sev: Severity, lang: Lang) {
  switch (sev) {
    case "Emergency":
      return t(lang, "severity_emergency");
    case "PHC Referral":
      return t(lang, "severity_phc");
    case "Home Care":
      return t(lang, "severity_home");
  }
}
