export type Lang = "en" | "hi" | "kn";

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
};

type Dict = {
  app_name: string;
  tagline: string;
  disclaimer: string;
  nav_new: string;
  nav_history: string;
  patient_info: string;
  patient_name: string;
  age: string;
  age_years: string;
  sex: string;
  male: string;
  female: string;
  other: string;
  pregnant: string;
  pregnancy_weeks: string;
  vitals: string;
  temperature_c: string;
  spo2: string;
  hemoglobin: string;
  resp_rate: string;
  fever_duration: string;
  symptoms: string;
  run_triage: string;
  reset: string;
  severity_emergency: string;
  severity_phc: string;
  severity_home: string;
  why: string;
  warning_signs: string;
  recommended_action: string;
  urgency: string;
  triggered_rules: string;
  validation_warnings: string;
  save_and_new: string;
  view_history: string;
  no_history: string;
  clear_history: string;
  confirm_clear: string;
  language: string;
  online: string;
  offline: string;
  simplify_with_ai: string;
  ai_disabled_offline: string;
  ai_failed: string;
  back: string;
  // symptom group labels
  group_danger: string;
  group_breathing: string;
  group_fever_dehy: string;
  group_maternal: string;
  group_adult: string;
  group_pediatric: string;
  // generic
  optional: string;
  required_field: string;
  validation_blocked: string;
  // override / refinement
  override_banner_title: string;
  override_banner_desc: string;
  override_badge: string;
  view_full_record: string;
  reopen_assessment: string;
  read_only_mode: string;
  vitals_more: string;
  vitals_less: string;
  critical_label: string;
  ai_label: string;
  explain_simple: string;
  ai_saved: string;
  expand: string;
  collapse: string;
  selected_symptoms: string;
  no_vitals: string;
  weeks_helper: string;
  ai_offline_notice: string;
  // Phase 1: follow-up, high-risk pregnancy, queue
  nav_queue: string;
  follow_up: string;
  follow_up_due: string;
  follow_up_overdue: string;
  follow_up_today: string;
  follow_up_scheduled: string;
  follow_up_completed: string;
  plan_follow_up: string;
  revisit_reason: string;
  follow_up_notes: string;
  save_follow_up: string;
  mark_complete: string;
  start_revisit: string;
  trend_escalated: string;
  trend_deescalated: string;
  trend_stable: string;
  trend_previous: string;
  trend_current: string;
  high_risk_pregnancy: string;
  maternal_risk_warning: string;
  maternal_risk_action: string;
  risk_severe_anemia: string;
  risk_heavy_bleeding: string;
  risk_severe_headache: string;
  risk_blurred_vision: string;
  risk_severe_weakness: string;
  risk_repeated_referrals: string;
  queue_title: string;
  queue_empty: string;
  queue_filter_severity: string;
  queue_filter_followup: string;
  queue_filter_highrisk: string;
  queue_all_severities: string;
  follow_up_saved: string;
  reason_recheck_fever: string;
  reason_vitals_review: string;
  reason_pregnancy_check: string;
  reason_general: string;
  // UI polish additions
  queue_helper: string;
  loading: string;
  history_empty_hint: string;
  queue_empty_hint: string;
  offline_banner: string;
  generate_pdf_slip: string;
  pdf_slip_hint: string;
};

const en: Dict = {
  app_name: "Arogya Saathi",
  tagline: "Frontline triage support — not a diagnosis",
  disclaimer: "Decision support only. Not a diagnosis. Always escalate per protocol.",
  nav_new: "New Assessment",
  nav_history: "History",
  patient_info: "Patient Information",
  patient_name: "Patient name (optional)",
  age: "Age",
  age_years: "years",
  sex: "Sex",
  male: "Male",
  female: "Female",
  other: "Other",
  pregnant: "Pregnant",
  pregnancy_weeks: "Weeks of pregnancy",
  vitals: "Vitals",
  temperature_c: "Temperature (°C)",
  spo2: "SpO₂ (%)",
  hemoglobin: "Hemoglobin (g/dL)",
  resp_rate: "Respiratory rate (/min)",
  fever_duration: "Days with fever",
  symptoms: "Symptoms",
  run_triage: "Run Triage",
  reset: "Reset",
  severity_emergency: "EMERGENCY",
  severity_phc: "PHC REFERRAL",
  severity_home: "HOME CARE",
  why: "Why this result",
  warning_signs: "Warning signs",
  recommended_action: "Recommended action",
  urgency: "Urgency",
  triggered_rules: "Triggered rules",
  validation_warnings: "Validation warnings",
  save_and_new: "Save & New",
  view_history: "View History",
  no_history: "No assessments yet.",
  clear_history: "Clear history",
  confirm_clear: "Delete all saved assessments?",
  language: "Language",
  online: "Online",
  offline: "Offline",
  simplify_with_ai: "Simplify with AI",
  ai_disabled_offline: "AI simplification unavailable offline.",
  ai_failed: "AI simplification failed. Showing rule-based explanation.",
  back: "Back",
  group_danger: "Danger signs",
  group_breathing: "Breathing",
  group_fever_dehy: "Fever & dehydration",
  group_maternal: "Maternal",
  group_adult: "Adult emergency",
  group_pediatric: "Pediatric",
  optional: "optional",
  required_field: "Required",
  validation_blocked: "Please fix the errors above before running triage.",
  override_banner_title: "Emergency override triggered",
  override_banner_desc: "Critical symptoms superseded standard triage flow. High-priority escalation applied automatically.",
  override_badge: "Override",
  view_full_record: "View full record",
  reopen_assessment: "Re-open assessment",
  read_only_mode: "Read-only — saved assessment",
  vitals_more: "Show more vitals",
  vitals_less: "Show fewer vitals",
  critical_label: "Critical",
  ai_label: "AI-simplified explanation",
  explain_simple: "Explain in Simple Language",
  ai_saved: "Saved with this assessment",
  expand: "Expand",
  collapse: "Collapse",
  selected_symptoms: "Reported symptoms",
  no_vitals: "No vitals recorded",
  weeks_helper: "Used for trimester-aware rules",
  ai_offline_notice: "AI simplification needs internet. The triage result is fully available offline.",
  nav_queue: "Priority Queue",
  follow_up: "Follow-up",
  follow_up_due: "Follow-up due",
  follow_up_overdue: "Overdue",
  follow_up_today: "Due today",
  follow_up_scheduled: "Scheduled",
  follow_up_completed: "Completed",
  plan_follow_up: "Plan follow-up",
  revisit_reason: "Revisit reason",
  follow_up_notes: "Notes (optional)",
  save_follow_up: "Save follow-up",
  mark_complete: "Mark complete",
  start_revisit: "Start revisit",
  trend_escalated: "Escalated",
  trend_deescalated: "Improved",
  trend_stable: "Stable",
  trend_previous: "Previous",
  trend_current: "Current",
  high_risk_pregnancy: "HIGH-RISK PREGNANCY",
  maternal_risk_warning: "Maternal risk warning",
  maternal_risk_action: "Schedule a follow-up within 24 hours and share with PHC.",
  risk_severe_anemia: "Severe anemia (Hb < 7 g/dL)",
  risk_heavy_bleeding: "Heavy bleeding",
  risk_severe_headache: "Severe headache",
  risk_blurred_vision: "Blurred vision",
  risk_severe_weakness: "Severe weakness",
  risk_repeated_referrals: "Repeated PHC/Emergency referrals in the last 30 days",
  queue_title: "Today's Priority Cases",
  queue_empty: "No priority cases right now. Great work.",
  queue_filter_severity: "Severity",
  queue_filter_followup: "Pending follow-up",
  queue_filter_highrisk: "High-risk pregnancy",
  queue_all_severities: "All",
  follow_up_saved: "Follow-up saved on this device.",
  reason_recheck_fever: "Recheck fever",
  reason_vitals_review: "Vitals review",
  reason_pregnancy_check: "Pregnancy check",
  reason_general: "General review",
  queue_helper: "Only active and follow-up cases appear in Priority Queue.",
  loading: "Loading…",
  history_empty_hint: "Completed assessments are saved on this device for quick reference.",
  queue_empty_hint: "Emergency cases (last 7 days), pending follow-ups, and high-risk pregnancies will appear here.",
  offline_banner: "You're offline — triage and history work fully. AI simplification will resume online.",
  generate_pdf_slip: "Generate PDF Slip",
  pdf_slip_hint: "Printable triage slip for PHC referral. Works offline.",
};

const hi: Dict = {
  app_name: "आरोग्य साथी",
  tagline: "अग्रिम पंक्ति त्रिअज सहायता — निदान नहीं",
  disclaimer: "केवल निर्णय सहायता। निदान नहीं। हमेशा प्रोटोकॉल के अनुसार आगे बढ़ें।",
  nav_new: "नया मूल्यांकन",
  nav_history: "इतिहास",
  patient_info: "रोगी की जानकारी",
  patient_name: "रोगी का नाम (वैकल्पिक)",
  age: "उम्र",
  age_years: "वर्ष",
  sex: "लिंग",
  male: "पुरुष",
  female: "महिला",
  other: "अन्य",
  pregnant: "गर्भवती",
  pregnancy_weeks: "गर्भावस्था सप्ताह",
  vitals: "महत्वपूर्ण संकेत",
  temperature_c: "तापमान (°C)",
  spo2: "SpO₂ (%)",
  hemoglobin: "हीमोग्लोबिन (g/dL)",
  resp_rate: "श्वसन दर (/मिनट)",
  fever_duration: "बुखार के दिन",
  symptoms: "लक्षण",
  run_triage: "त्रिअज चलाएं",
  reset: "रीसेट",
  severity_emergency: "आपातकाल",
  severity_phc: "PHC रेफरल",
  severity_home: "घर पर देखभाल",
  why: "यह परिणाम क्यों",
  warning_signs: "चेतावनी संकेत",
  recommended_action: "अनुशंसित कार्रवाई",
  urgency: "तत्कालता",
  triggered_rules: "लागू नियम",
  validation_warnings: "सत्यापन चेतावनियाँ",
  save_and_new: "सहेजें और नया",
  view_history: "इतिहास देखें",
  no_history: "अभी तक कोई मूल्यांकन नहीं।",
  clear_history: "इतिहास साफ़ करें",
  confirm_clear: "सभी सहेजे गए मूल्यांकन हटाएं?",
  language: "भाषा",
  online: "ऑनलाइन",
  offline: "ऑफ़लाइन",
  simplify_with_ai: "AI से सरल करें",
  ai_disabled_offline: "ऑफ़लाइन में AI उपलब्ध नहीं।",
  ai_failed: "AI विफल। नियम-आधारित स्पष्टीकरण दिखाया जा रहा है।",
  back: "वापस",
  group_danger: "खतरे के संकेत",
  group_breathing: "साँस",
  group_fever_dehy: "बुखार और निर्जलीकरण",
  group_maternal: "मातृ",
  group_adult: "वयस्क आपातकाल",
  group_pediatric: "बाल",
  optional: "वैकल्पिक",
  required_field: "आवश्यक",
  validation_blocked: "त्रिअज से पहले ऊपर की त्रुटियाँ ठीक करें।",
  override_banner_title: "आपातकालीन ओवरराइड लागू",
  override_banner_desc: "गंभीर लक्षणों ने सामान्य त्रिअज प्रक्रिया को पीछे छोड़ दिया। उच्च प्राथमिकता एस्केलेशन स्वचालित रूप से लागू।",
  override_badge: "ओवरराइड",
  view_full_record: "पूरा रिकॉर्ड देखें",
  reopen_assessment: "मूल्यांकन फिर से खोलें",
  read_only_mode: "केवल पढ़ने के लिए — सहेजा गया मूल्यांकन",
  vitals_more: "और संकेत दिखाएँ",
  vitals_less: "कम संकेत दिखाएँ",
  critical_label: "गंभीर",
  ai_label: "AI-सरलीकृत स्पष्टीकरण",
  explain_simple: "सरल भाषा में समझाएँ",
  ai_saved: "इस मूल्यांकन के साथ सहेजा गया",
  expand: "विस्तार",
  collapse: "बंद करें",
  selected_symptoms: "बताए गए लक्षण",
  no_vitals: "कोई संकेत दर्ज नहीं",
  weeks_helper: "त्रैमासिक नियमों के लिए उपयोग",
  ai_offline_notice: "AI सरलीकरण के लिए इंटरनेट चाहिए। त्रिअज परिणाम ऑफ़लाइन भी पूरी तरह उपलब्ध है।",
  nav_queue: "प्राथमिकता सूची",
  follow_up: "फ़ॉलो-अप",
  follow_up_due: "फ़ॉलो-अप देय",
  follow_up_overdue: "देरी",
  follow_up_today: "आज देय",
  follow_up_scheduled: "निर्धारित",
  follow_up_completed: "पूर्ण",
  plan_follow_up: "फ़ॉलो-अप योजना",
  revisit_reason: "पुनः जाँच का कारण",
  follow_up_notes: "नोट्स (वैकल्पिक)",
  save_follow_up: "फ़ॉलो-अप सहेजें",
  mark_complete: "पूर्ण चिह्नित करें",
  start_revisit: "पुनः मूल्यांकन शुरू करें",
  trend_escalated: "बढ़ा",
  trend_deescalated: "सुधरा",
  trend_stable: "स्थिर",
  trend_previous: "पिछला",
  trend_current: "वर्तमान",
  high_risk_pregnancy: "उच्च-जोखिम गर्भावस्था",
  maternal_risk_warning: "मातृ जोखिम चेतावनी",
  maternal_risk_action: "24 घंटे में फ़ॉलो-अप तय करें और PHC को सूचित करें।",
  risk_severe_anemia: "गंभीर रक्ताल्पता (Hb < 7)",
  risk_heavy_bleeding: "भारी रक्तस्राव",
  risk_severe_headache: "गंभीर सिरदर्द",
  risk_blurred_vision: "धुंधली दृष्टि",
  risk_severe_weakness: "गंभीर कमज़ोरी",
  risk_repeated_referrals: "30 दिनों में बार-बार PHC/आपातकाल रेफरल",
  queue_title: "आज के प्राथमिकता मामले",
  queue_empty: "अभी कोई प्राथमिकता मामला नहीं। बढ़िया काम।",
  queue_filter_severity: "गंभीरता",
  queue_filter_followup: "लंबित फ़ॉलो-अप",
  queue_filter_highrisk: "उच्च-जोखिम गर्भावस्था",
  queue_all_severities: "सभी",
  follow_up_saved: "फ़ॉलो-अप इस डिवाइस पर सहेजा गया।",
  reason_recheck_fever: "बुखार की पुनः जाँच",
  reason_vitals_review: "महत्वपूर्ण संकेत समीक्षा",
  reason_pregnancy_check: "गर्भावस्था जाँच",
  reason_general: "सामान्य समीक्षा",
  queue_helper: "केवल सक्रिय और फ़ॉलो-अप मामले प्राथमिकता सूची में दिखते हैं।",
  loading: "लोड हो रहा है…",
  history_empty_hint: "पूर्ण किए गए मूल्यांकन इस डिवाइस पर सहेजे जाते हैं।",
  queue_empty_hint: "आपातकाल (पिछले 7 दिन), लंबित फ़ॉलो-अप और उच्च-जोखिम गर्भावस्था यहाँ दिखेंगे।",
  offline_banner: "आप ऑफ़लाइन हैं — त्रिअज और इतिहास पूरी तरह काम करते हैं। AI ऑनलाइन होने पर फिर से चलेगा।",
  generate_pdf_slip: "PDF स्लिप बनाएँ",
  pdf_slip_hint: "PHC रेफ़रल के लिए प्रिंट करने योग्य त्रिअज स्लिप। ऑफ़लाइन काम करता है।",
};

const kn: Dict = {
  app_name: "ಆರೋಗ್ಯ ಸಾಥಿ",
  tagline: "ಮುಂಚೂಣಿ ಟ್ರಯಾಜ್ ಬೆಂಬಲ — ರೋಗನಿರ್ಣಯ ಅಲ್ಲ",
  disclaimer: "ನಿರ್ಧಾರ ಬೆಂಬಲ ಮಾತ್ರ. ರೋಗನಿರ್ಣಯ ಅಲ್ಲ. ಯಾವಾಗಲೂ ಪ್ರೋಟೋಕಾಲ್ ಪ್ರಕಾರ ಮುಂದುವರಿಯಿರಿ.",
  nav_new: "ಹೊಸ ಮೌಲ್ಯಮಾಪನ",
  nav_history: "ಇತಿಹಾಸ",
  patient_info: "ರೋಗಿಯ ಮಾಹಿತಿ",
  patient_name: "ರೋಗಿಯ ಹೆಸರು (ಐಚ್ಛಿಕ)",
  age: "ವಯಸ್ಸು",
  age_years: "ವರ್ಷಗಳು",
  sex: "ಲಿಂಗ",
  male: "ಪುರುಷ",
  female: "ಮಹಿಳೆ",
  other: "ಇತರ",
  pregnant: "ಗರ್ಭಿಣಿ",
  pregnancy_weeks: "ಗರ್ಭಧಾರಣೆಯ ವಾರಗಳು",
  vitals: "ಪ್ರಮುಖ ಚಿಹ್ನೆಗಳು",
  temperature_c: "ಉಷ್ಣತೆ (°C)",
  spo2: "SpO₂ (%)",
  hemoglobin: "ಹಿಮೋಗ್ಲೋಬಿನ್ (g/dL)",
  resp_rate: "ಉಸಿರಾಟದ ದರ (/ನಿಮಿಷ)",
  fever_duration: "ಜ್ವರ ದಿನಗಳು",
  symptoms: "ಲಕ್ಷಣಗಳು",
  run_triage: "ಟ್ರಯಾಜ್ ಚಲಾಯಿಸಿ",
  reset: "ಮರುಹೊಂದಿಸಿ",
  severity_emergency: "ತುರ್ತು",
  severity_phc: "PHC ಶಿಫಾರಸು",
  severity_home: "ಮನೆಯ ಆರೈಕೆ",
  why: "ಈ ಫಲಿತಾಂಶ ಏಕೆ",
  warning_signs: "ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು",
  recommended_action: "ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ",
  urgency: "ತುರ್ತುಸ್ಥಿತಿ",
  triggered_rules: "ಪ್ರಚೋದಿತ ನಿಯಮಗಳು",
  validation_warnings: "ಮೌಲ್ಯೀಕರಣ ಎಚ್ಚರಿಕೆಗಳು",
  save_and_new: "ಉಳಿಸಿ ಮತ್ತು ಹೊಸದು",
  view_history: "ಇತಿಹಾಸ ನೋಡಿ",
  no_history: "ಇನ್ನೂ ಯಾವುದೇ ಮೌಲ್ಯಮಾಪನಗಳಿಲ್ಲ.",
  clear_history: "ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ",
  confirm_clear: "ಎಲ್ಲಾ ಉಳಿಸಿದ ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಅಳಿಸಬೇಕೇ?",
  language: "ಭಾಷೆ",
  online: "ಆನ್‌ಲೈನ್",
  offline: "ಆಫ್‌ಲೈನ್",
  simplify_with_ai: "AI ಯಿಂದ ಸರಳಗೊಳಿಸಿ",
  ai_disabled_offline: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ AI ಲಭ್ಯವಿಲ್ಲ.",
  ai_failed: "AI ವಿಫಲವಾಯಿತು. ನಿಯಮ ಆಧಾರಿತ ವಿವರಣೆ.",
  back: "ಹಿಂದೆ",
  group_danger: "ಅಪಾಯದ ಚಿಹ್ನೆಗಳು",
  group_breathing: "ಉಸಿರಾಟ",
  group_fever_dehy: "ಜ್ವರ ಮತ್ತು ನಿರ್ಜಲೀಕರಣ",
  group_maternal: "ಮಾತೃ",
  group_adult: "ವಯಸ್ಕ ತುರ್ತು",
  group_pediatric: "ಮಕ್ಕಳ",
  optional: "ಐಚ್ಛಿಕ",
  required_field: "ಅಗತ್ಯವಿದೆ",
  validation_blocked: "ಟ್ರಯಾಜ್ ಮೊದಲು ಮೇಲಿನ ದೋಷಗಳನ್ನು ಸರಿಪಡಿಸಿ.",
  override_banner_title: "ತುರ್ತು ಓವರ್‌ರೈಡ್ ಸಕ್ರಿಯಗೊಂಡಿದೆ",
  override_banner_desc: "ಗಂಭೀರ ಲಕ್ಷಣಗಳು ಸಾಮಾನ್ಯ ಟ್ರಯಾಜ್ ಹರಿವನ್ನು ಮೀರಿಸಿವೆ. ಹೆಚ್ಚಿನ ಆದ್ಯತೆಯ ಎಸ್ಕಲೇಶನ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನ್ವಯಿಸಲಾಗಿದೆ.",
  override_badge: "ಓವರ್‌ರೈಡ್",
  view_full_record: "ಪೂರ್ಣ ದಾಖಲೆ ನೋಡಿ",
  reopen_assessment: "ಮೌಲ್ಯಮಾಪನ ಮತ್ತೆ ತೆರೆಯಿರಿ",
  read_only_mode: "ಓದಲು ಮಾತ್ರ — ಉಳಿಸಿದ ಮೌಲ್ಯಮಾಪನ",
  vitals_more: "ಹೆಚ್ಚು ಚಿಹ್ನೆಗಳು",
  vitals_less: "ಕಡಿಮೆ ಚಿಹ್ನೆಗಳು",
  critical_label: "ಗಂಭೀರ",
  ai_label: "AI-ಸರಳಗೊಳಿಸಿದ ವಿವರಣೆ",
  explain_simple: "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ",
  ai_saved: "ಈ ಮೌಲ್ಯಮಾಪನದೊಂದಿಗೆ ಉಳಿಸಲಾಗಿದೆ",
  expand: "ವಿಸ್ತರಿಸಿ",
  collapse: "ಮುಚ್ಚಿ",
  selected_symptoms: "ವರದಿ ಮಾಡಿದ ಲಕ್ಷಣಗಳು",
  no_vitals: "ಯಾವುದೇ ಚಿಹ್ನೆಗಳಿಲ್ಲ",
  weeks_helper: "ತ್ರೈಮಾಸಿಕ ನಿಯಮಗಳಿಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ",
  ai_offline_notice: "AI ಸರಳೀಕರಣಕ್ಕೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು. ಟ್ರಯಾಜ್ ಫಲಿತಾಂಶ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿಯೂ ಸಂಪೂರ್ಣವಾಗಿ ಲಭ್ಯವಿದೆ.",
  nav_queue: "ಆದ್ಯತೆ ಪಟ್ಟಿ",
  follow_up: "ಫಾಲೋ-ಅಪ್",
  follow_up_due: "ಫಾಲೋ-ಅಪ್ ಬಾಕಿ",
  follow_up_overdue: "ಮೀರಿದೆ",
  follow_up_today: "ಇಂದು ಬಾಕಿ",
  follow_up_scheduled: "ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
  follow_up_completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
  plan_follow_up: "ಫಾಲೋ-ಅಪ್ ಯೋಜನೆ",
  revisit_reason: "ಮರು ಭೇಟಿಯ ಕಾರಣ",
  follow_up_notes: "ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)",
  save_follow_up: "ಫಾಲೋ-ಅಪ್ ಉಳಿಸಿ",
  mark_complete: "ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ",
  start_revisit: "ಮರು ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ",
  trend_escalated: "ಹೆಚ್ಚಾಗಿದೆ",
  trend_deescalated: "ಸುಧಾರಿಸಿದೆ",
  trend_stable: "ಸ್ಥಿರ",
  trend_previous: "ಹಿಂದಿನದು",
  trend_current: "ಪ್ರಸ್ತುತ",
  high_risk_pregnancy: "ಅತಿ ಅಪಾಯದ ಗರ್ಭಧಾರಣೆ",
  maternal_risk_warning: "ಮಾತೃ ಅಪಾಯದ ಎಚ್ಚರಿಕೆ",
  maternal_risk_action: "24 ಗಂಟೆಗಳೊಳಗೆ ಫಾಲೋ-ಅಪ್ ನಿಗದಿಪಡಿಸಿ ಮತ್ತು PHC ಗೆ ತಿಳಿಸಿ.",
  risk_severe_anemia: "ತೀವ್ರ ರಕ್ತಹೀನತೆ (Hb < 7)",
  risk_heavy_bleeding: "ಭಾರೀ ರಕ್ತಸ್ರಾವ",
  risk_severe_headache: "ತೀವ್ರ ತಲೆನೋವು",
  risk_blurred_vision: "ಮಸುಕು ದೃಷ್ಟಿ",
  risk_severe_weakness: "ತೀವ್ರ ದೌರ್ಬಲ್ಯ",
  risk_repeated_referrals: "30 ದಿನಗಳಲ್ಲಿ ಪುನರಾವರ್ತಿತ PHC/ತುರ್ತು ಶಿಫಾರಸುಗಳು",
  queue_title: "ಇಂದಿನ ಆದ್ಯತೆ ಪ್ರಕರಣಗಳು",
  queue_empty: "ಈಗ ಯಾವುದೇ ಆದ್ಯತೆ ಪ್ರಕರಣಗಳಿಲ್ಲ. ಉತ್ತಮ ಕೆಲಸ.",
  queue_filter_severity: "ತೀವ್ರತೆ",
  queue_filter_followup: "ಬಾಕಿ ಫಾಲೋ-ಅಪ್",
  queue_filter_highrisk: "ಅತಿ ಅಪಾಯದ ಗರ್ಭಧಾರಣೆ",
  queue_all_severities: "ಎಲ್ಲಾ",
  follow_up_saved: "ಫಾಲೋ-ಅಪ್ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
  reason_recheck_fever: "ಜ್ವರ ಮರು ಪರಿಶೀಲನೆ",
  reason_vitals_review: "ಪ್ರಮುಖ ಚಿಹ್ನೆಗಳ ಪರಿಶೀಲನೆ",
  reason_pregnancy_check: "ಗರ್ಭಧಾರಣೆ ಪರಿಶೀಲನೆ",
  reason_general: "ಸಾಮಾನ್ಯ ಪರಿಶೀಲನೆ",
  queue_helper: "ಸಕ್ರಿಯ ಮತ್ತು ಫಾಲೋ-ಅಪ್ ಪ್ರಕರಣಗಳು ಮಾತ್ರ ಆದ್ಯತೆ ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
  history_empty_hint: "ಪೂರ್ಣಗೊಂಡ ಮೌಲ್ಯಮಾಪನಗಳು ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತವೆ.",
  queue_empty_hint: "ತುರ್ತು ಪ್ರಕರಣಗಳು (ಕಳೆದ 7 ದಿನ), ಬಾಕಿ ಫಾಲೋ-ಅಪ್ ಮತ್ತು ಅತಿ ಅಪಾಯದ ಗರ್ಭಧಾರಣೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  offline_banner: "ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ — ಟ್ರಯಾಜ್ ಮತ್ತು ಇತಿಹಾಸ ಸಂಪೂರ್ಣ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ.",
};

export const DICTS: Record<Lang, Dict> = { en, hi, kn };

export function t(lang: Lang, key: keyof Dict): string {
  return DICTS[lang][key] ?? DICTS.en[key];
}
