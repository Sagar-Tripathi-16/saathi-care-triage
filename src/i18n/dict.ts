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
  condition_status: string;
  compared_with_previous: string;
  // Voice guidance
  read_guidance: string;
  stop_reading: string;
  voice_unavailable: string;
  voice_narrating: string;
  voice_listen_guidance: string;
  voice_pause: string;
  // Dashboard
  nav_dashboard: string;
  dash_title: string;
  dash_today: string;
  dash_emergency: string;
  dash_phc: string;
  dash_home: string;
  dash_high_risk: string;
  dash_pending_fu: string;
  dash_improving: string;
  dash_worsening: string;
  dash_activity: string;
  dash_no_activity: string;
  dash_7d: string;
  dash_active: string;
  // Timeline
  timeline_title: string;
  timeline_improving: string;
  timeline_worsening: string;
  timeline_stable: string;
  timeline_first: string;
  risk_headache: string;
  // Dashboard extended
  dash_community_ops: string;
  dash_live_intel: string;
  dash_active_cases: string;
  dash_emergency_cases: string;
  dash_reassessments: string;
  dash_escalations: string;
  dash_awaiting_ref: string;
  dash_stable_resolved: string;
  dash_needs_reassessment_section: string;
  dash_awaiting_ref_section: string;
  dash_stable_monitoring_section: string;
  dash_no_active: string;
  dash_no_active_desc: string;
  dash_all_resolved: string;
  dash_all_resolved_desc: string;
  dash_pending_badge: string;
  dash_due_today_badge: string;
  dash_overdue_badge: string;
  dash_pending_tasks_rail: string;
  dash_high_risk_rail: string;
  dash_patients_suffix: string;
  dash_ops_intel: string;
  // Follow-up planner
  fu_ongoing_care: string;
  fu_schedule_hint: string;
  fu_date_label: string;
  fu_focus_area: string;
  fu_clinical_notes: string;
  fu_clinical_notes_ph: string;
  fu_scheduling: string;
  fu_update_schedule: string;
  fu_schedule_followup_btn: string;
  fu_plan_secured: string;
  // Result screen
  result_progression_intel: string;
  result_compared_to: string;
  result_referral_readiness: string;
  result_referral_emergency: string;
  result_referral_phc: string;
  result_healthcare_guidance: string;
  result_guidance_subtitle: string;
  result_generate_guidance: string;
  result_generating: string;
  result_print: string;
  result_offline_guidance: string;
  // History
  history_no_records: string;
  history_no_records_desc: string;
  history_start_reassessment: string;
  history_unknown_patient: string;
  history_assessments: string;
  // Queue
  queue_action_case: string;
  queue_next_action: string;
  queue_review_patient: string;
  queue_verify_emergency_ref: string;
  queue_check_phc_status: string;
  // Relative time
  time_just_now: string;
  time_h_ago: string;
  time_d_ago: string;
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
  run_triage: "Complete Assessment",
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
  simplify_with_ai: "Clinical Decision Support",
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
  ai_label: "Decision support explanation",
  explain_simple: "Explain simply",
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
  condition_status: "Condition Status",
  compared_with_previous: "Compared with previous assessment",
  read_guidance: "Read Guidance",
  stop_reading: "Stop",
  voice_unavailable: "Voice not supported in this browser.",
  voice_narrating: "Narrating...",
  voice_listen_guidance: "Listen to Guidance",
  voice_pause: "Pause",
  nav_dashboard: "Dashboard",
  dash_title: "Operations Dashboard",
  dash_today: "Today",
  dash_emergency: "Emergency",
  dash_phc: "PHC Referrals",
  dash_home: "Home Care",
  dash_high_risk: "Active High-Risk",
  dash_pending_fu: "Pending Follow-ups",
  dash_improving: "Improving",
  dash_worsening: "Worsening",
  dash_activity: "Recent Activity",
  dash_no_activity: "No activity yet. Run your first assessment.",
  dash_7d: "Last 7 days",
  dash_active: "Active",
  timeline_title: "Assessment Timeline",
  timeline_improving: "Improving",
  timeline_worsening: "Worsening",
  timeline_stable: "Stable",
  timeline_first: "Initial assessment",
  risk_headache: "Persistent headache during pregnancy",
  dash_community_ops: "Community Operations",
  dash_live_intel: "Live operational intelligence and care states.",
  dash_active_cases: "Active Cases",
  dash_emergency_cases: "Emergency Cases",
  dash_reassessments: "Reassessments Due",
  dash_escalations: "Active Escalations",
  dash_awaiting_ref: "Awaiting Referral",
  dash_stable_resolved: "Stable / Resolved",
  dash_needs_reassessment_section: "Reassessment Due",
  dash_awaiting_ref_section: "Awaiting Referral Confirmation",
  dash_stable_monitoring_section: "Stable Monitoring",
  dash_no_active: "No active patient cases",
  dash_no_active_desc: "Recent assessments requiring follow-up will appear here.",
  dash_all_resolved: "All cases are resolved",
  dash_all_resolved_desc: "No immediate operational tasks pending at this time.",
  dash_pending_badge: "Pending",
  dash_due_today_badge: "Due Today",
  dash_overdue_badge: "Overdue",
  dash_pending_tasks_rail: "Pending Tasks",
  dash_high_risk_rail: "High Risk Active",
  dash_patients_suffix: "Patients",
  dash_ops_intel: "Operations Intel",
  fu_ongoing_care: "Ongoing Care & Continuity",
  fu_schedule_hint: "Schedule the next check-in to monitor patient progress.",
  fu_date_label: "Date",
  fu_focus_area: "Focus Area",
  fu_clinical_notes: "Clinical Notes (Optional)",
  fu_clinical_notes_ph: "Add specific instructions or things to watch for...",
  fu_scheduling: "Scheduling...",
  fu_update_schedule: "Update Schedule",
  fu_schedule_followup_btn: "Schedule Follow-up",
  fu_plan_secured: "Continuity plan secured",
  result_progression_intel: "Progression Intelligence",
  result_compared_to: "Compared to assessment from",
  result_referral_readiness: "Referral Readiness",
  result_referral_emergency: "Ensure immediate transport is arranged. Keep the patient comfortable and seated. Bring all identity and medical documents.",
  result_referral_phc: "Plan for a clinical visit soon. Ensure the patient stays hydrated and bring all previous health records to the center.",
  result_healthcare_guidance: "Healthcare Guidance",
  result_guidance_subtitle: "Read the detailed clinical reasoning and care instructions.",
  result_generate_guidance: "Generate Care Guidance",
  result_generating: "Generating...",
  result_print: "Print Record",
  result_offline_guidance: "Connection interrupted. Displaying secure offline guidance.",
  history_no_records: "No patient records",
  history_no_records_desc: "Patient care journeys will appear here as assessments are completed.",
  history_start_reassessment: "Start Reassessment",
  history_unknown_patient: "Unknown Patient",
  history_assessments: "Assessments",
  queue_action_case: "Action Case",
  queue_next_action: "Next Required Action",
  queue_review_patient: "Review Patient",
  queue_verify_emergency_ref: "Verify Emergency Referral",
  queue_check_phc_status: "Check PHC Referral Status",
  time_just_now: "Just now",
  time_h_ago: "%nh ago",
  time_d_ago: "%nd ago",
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
  simplify_with_ai: "नैदानिक निर्णय समर्थन",
  ai_disabled_offline: "AI सरलीकरण ऑफ़लाइन उपलब्ध नहीं है।",
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
  ai_label: "निर्णय समर्थन व्याख्या",
  explain_simple: "सरल भाषा में समझाएं",
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
  condition_status: "स्थिति की स्थिति",
  compared_with_previous: "पिछले मूल्यांकन की तुलना में",
  read_guidance: "मार्गदर्शन सुनें",
  stop_reading: "रोकें",
  voice_unavailable: "इस ब्राउज़र में आवाज सुविधा नहीं है।",
  voice_narrating: "पढ़ रहा है...",
  voice_listen_guidance: "मार्गदर्शन सुनें",
  voice_pause: "रोकें",
  nav_dashboard: "डैशबोर्ड",
  dash_title: "संचालन डैशबोर्ड",
  dash_today: "आज",
  dash_emergency: "आपातकाल",
  dash_phc: "PHC रेफरल",
  dash_home: "घर पर देखभाल",
  dash_high_risk: "सक्रिय उच्च-जोखिम",
  dash_pending_fu: "लंबित फ़ॉलो-अप",
  dash_improving: "सुधर रहे हैं",
  dash_worsening: "खराब हो रहे हैं",
  dash_activity: "हालिया गतिविधि",
  dash_no_activity: "अभी कोई गतिविधि नहीं।",
  dash_7d: "पिछले 7 दिन",
  dash_active: "सक्रिय",
  timeline_title: "मूल्यांकन समयरेखा",
  timeline_improving: "सुधर",
  timeline_worsening: "खराब",
  timeline_stable: "स्थिर",
  timeline_first: "प्रारंभिक मूल्यांकन",
  risk_headache: "गर्भावस्था में लगातार सिरदर्द",
  dash_community_ops: "सामुदायिक संचालन",
  dash_live_intel: "लाइव परिचालन जानकारी और देखभाल स्थिति।",
  dash_active_cases: "सक्रिय मामले",
  dash_emergency_cases: "आपातकालीन मामले",
  dash_reassessments: "पुनर्मूल्यांकन देय",
  dash_escalations: "सक्रिय एस्केलेशन",
  dash_awaiting_ref: "रेफरल प्रतीक्षित",
  dash_stable_resolved: "स्थिर / समाधान",
  dash_needs_reassessment_section: "पुनर्मूल्यांकन देय",
  dash_awaiting_ref_section: "रेफरल पुष्टि प्रतीक्षित",
  dash_stable_monitoring_section: "स्थिर निगरानी",
  dash_no_active: "कोई सक्रिय रोगी मामले नहीं",
  dash_no_active_desc: "फ़ॉलो-अप की आवश्यकता वाले हालिया मूल्यांकन यहाँ दिखेंगे।",
  dash_all_resolved: "सभी मामले हल हो गए",
  dash_all_resolved_desc: "अभी कोई तत्काल परिचालन कार्य लंबित नहीं है।",
  dash_pending_badge: "लंबित",
  dash_due_today_badge: "आज देय",
  dash_overdue_badge: "देरी",
  dash_pending_tasks_rail: "लंबित कार्य",
  dash_high_risk_rail: "सक्रिय उच्च-जोखिम",
  dash_patients_suffix: "रोगी",
  dash_ops_intel: "संचालन जानकारी",
  fu_ongoing_care: "जारी देखभाल और निरंतरता",
  fu_schedule_hint: "रोगी की प्रगति की निगरानी के लिए अगली जाँच निर्धारित करें।",
  fu_date_label: "तारीख",
  fu_focus_area: "ध्यान क्षेत्र",
  fu_clinical_notes: "नैदानिक नोट्स (वैकल्पिक)",
  fu_clinical_notes_ph: "विशिष्ट निर्देश या देखने योग्य बातें जोड़ें...",
  fu_scheduling: "निर्धारित हो रहा है...",
  fu_update_schedule: "शेड्यूल अपडेट करें",
  fu_schedule_followup_btn: "फ़ॉलो-अप निर्धारित करें",
  fu_plan_secured: "निरंतरता योजना सुरक्षित",
  result_progression_intel: "प्रगति विश्लेषण",
  result_compared_to: "मूल्यांकन से तुलना:",
  result_referral_readiness: "रेफरल तत्परता",
  result_referral_emergency: "तत्काल परिवहन की व्यवस्था करें। रोगी को आरामदायक और बैठे रखें। सभी पहचान और चिकित्सा दस्तावेज़ लाएं।",
  result_referral_phc: "जल्द ही नैदानिक यात्रा की योजना बनाएं। सुनिश्चित करें कि रोगी हाइड्रेटेड रहे और केंद्र पर सभी पिछले स्वास्थ्य रिकॉर्ड लाएं।",
  result_healthcare_guidance: "स्वास्थ्य मार्गदर्शन",
  result_guidance_subtitle: "विस्तृत नैदानिक तर्क और देखभाल निर्देश पढ़ें।",
  result_generate_guidance: "देखभाल मार्गदर्शन उत्पन्न करें",
  result_generating: "उत्पन्न हो रहा है...",
  result_print: "रिकॉर्ड प्रिंट करें",
  result_offline_guidance: "कनेक्शन बाधित। सुरक्षित ऑफ़लाइन मार्गदर्शन दिखाया जा रहा है।",
  history_no_records: "कोई रोगी रिकॉर्ड नहीं",
  history_no_records_desc: "मूल्यांकन पूरे होने पर रोगी देखभाल यात्राएं यहाँ दिखेंगी।",
  history_start_reassessment: "पुनर्मूल्यांकन शुरू करें",
  history_unknown_patient: "अज्ञात रोगी",
  history_assessments: "मूल्यांकन",
  queue_action_case: "मामले पर कार्रवाई",
  queue_next_action: "अगली आवश्यक कार्रवाई",
  queue_review_patient: "रोगी समीक्षा",
  queue_verify_emergency_ref: "आपातकालीन रेफरल सत्यापित करें",
  queue_check_phc_status: "PHC रेफरल स्थिति जांचें",
  time_just_now: "अभी",
  time_h_ago: "%n घं पहले",
  time_d_ago: "%n दिन पहले",
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
  simplify_with_ai: "ಕ್ಲಿನಿಕಲ್ ನಿರ್ಧಾರ ಬೆಂಬಲ",
  ai_disabled_offline: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ AI ಸರಳೀಕರಣ ಲಭ್ಯವಿಲ್ಲ.",
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
  ai_label: "ನಿರ್ಧಾರ ಬೆಂಬಲ ವಿವರಣೆ",
  explain_simple: "ಸರಳವಾಗಿ ವಿವರಿಸಿ",
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
  generate_pdf_slip: "PDF ಸ್ಲಿಪ್ ರಚಿಸಿ",
  pdf_slip_hint: "PHC ಉಲ್ಲೇಖಕ್ಕಾಗಿ ಮುದ್ರಿಸಬಹುದಾದ ಟ್ರಯಾಜ್ ಸ್ಲಿಪ್. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.",
  condition_status: "ಸ್ಥಿತಿಯ ಸ್ಥಿತಿ",
  compared_with_previous: "ಹಿಂದಿನ ಮೌಲ್ಯಮಾಪನದೊಂದಿಗೆ ಹೋಲಿಸಿದರೆ",
  read_guidance: "ಮಾರ್ಗದರ್ಶನ ಓದಿ",
  stop_reading: "ನಿಲ್ಲಿಸಿ",
  voice_unavailable: "ಈ ಬ್ರೈಸರ್ನಲ್ಲಿ ವಾಯ್ಸ್ ಲಭ್ಯವಿಲ್ಲ.",
  voice_narrating: "ಓದುತ್ತಿದೆ...",
  voice_listen_guidance: "ಮಾರ್ಗದರ್ಶನ ಕೇಳಿಸಿ",
  voice_pause: "ನಿಲ್ಲಿಸಿ",
  nav_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  dash_title: "ಕಾರ್ಯತಂತ್ರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  dash_today: "ಇಂದು",
  dash_emergency: "ತುರ್ತು",
  dash_phc: "PHC ಶಿಫಾರಸುಗಳು",
  dash_home: "ಮನೆ ಆರೈಕೆ",
  dash_high_risk: "ಸಕ್ರಿಯ ಅತಿ ಅಪಾಯ",
  dash_pending_fu: "ಬಾಕಿ ಫಾಲೋ-ಅಪ್",
  dash_improving: "ಸುಧಾರಗುತ್ತಿದೆ",
  dash_worsening: "ಕೆಟ್ಟಗುತ್ತಿದೆ",
  dash_activity: "ಪ್ರಚಲಿತ ಚಟುವಟಿಕೆ",
  dash_no_activity: "ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆಯಿಲ್ಲ.",
  dash_7d: "ಕಳೆದ 7 ದಿನ",
  dash_active: "ಸಕ್ರಿಯ",
  timeline_title: "ಮೌಲ್ಯಮಾಪನ ಟೈಮ್‌ಲೈನ್",
  timeline_improving: "ಸುಧಾರಗುತ್ತಿದೆ",
  timeline_worsening: "ಕೆಟ್ಟಗುತ್ತಿದೆ",
  timeline_stable: "ಸ್ಥಿರ",
  timeline_first: "ಪ್ರಾರಂಭಿಕ ಮೌಲ್ಯಮಾಪನ",
  risk_headache: "ಗರ್ಭಾವಸ್ಥೆಯಲ್ಲಿ ನಿರಂತರ ತಲೆನೋವು",
  dash_community_ops: "ಸಮುದಾಯ ಕಾರ್ಯಾಚರಣೆ",
  dash_live_intel: "ಲೈವ್ ಕಾರ್ಯಾಚರಣಾ ಮಾಹಿತಿ ಮತ್ತು ಆರೈಕೆ ಸ್ಥಿತಿಗಳು.",
  dash_active_cases: "ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು",
  dash_emergency_cases: "ತುರ್ತು ಪ್ರಕರಣಗಳು",
  dash_reassessments: "ಮರು ಮೌಲ್ಯಮಾಪನ ಬಾಕಿ",
  dash_escalations: "ಸಕ್ರಿಯ ಹೆಚ್ಚಳಗಳು",
  dash_awaiting_ref: "ಉಲ್ಲೇಖ ನಿರೀಕ್ಷೆ",
  dash_stable_resolved: "ಸ್ಥಿರ / ಪರಿಹಾರ",
  dash_needs_reassessment_section: "ಮರು ಮೌಲ್ಯಮಾಪನ ಬಾಕಿ",
  dash_awaiting_ref_section: "ಉಲ್ಲೇಖ ದೃಢೀಕರಣ ನಿರೀಕ್ಷೆ",
  dash_stable_monitoring_section: "ಸ್ಥಿರ ಮೇಲ್ವಿಚಾರಣೆ",
  dash_no_active: "ಯಾವುದೇ ಸಕ್ರಿಯ ರೋಗಿ ಪ್ರಕರಣಗಳಿಲ್ಲ",
  dash_no_active_desc: "ಫಾಲೋ-ಅಪ್ ಅಗತ್ಯವಿರುವ ಇತ್ತೀಚಿನ ಮೌಲ್ಯಮಾಪನಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  dash_all_resolved: "ಎಲ್ಲಾ ಪ್ರಕರಣಗಳು ಪರಿಹರಿಸಲ್ಪಟ್ಟಿವೆ",
  dash_all_resolved_desc: "ಈ ಸಮಯದಲ್ಲಿ ಯಾವುದೇ ತಕ್ಷಣದ ಕಾರ್ಯಾಚರಣಾ ಕಾರ್ಯಗಳಿಲ್ಲ.",
  dash_pending_badge: "ಬಾಕಿ",
  dash_due_today_badge: "ಇಂದು ಬಾಕಿ",
  dash_overdue_badge: "ಮೀರಿದೆ",
  dash_pending_tasks_rail: "ಬಾಕಿ ಕಾರ್ಯಗಳು",
  dash_high_risk_rail: "ಸಕ್ರಿಯ ಅತಿ ಅಪಾಯ",
  dash_patients_suffix: "ರೋಗಿಗಳು",
  dash_ops_intel: "ಕಾರ್ಯಾಚರಣೆ ಮಾಹಿತಿ",
  fu_ongoing_care: "ನಡೆಯುತ್ತಿರುವ ಆರೈಕೆ ಮತ್ತು ನಿರಂತರತೆ",
  fu_schedule_hint: "ರೋಗಿಯ ಪ್ರಗತಿಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ಮುಂದಿನ ತಪಾಸಣೆ ನಿಗದಿಪಡಿಸಿ.",
  fu_date_label: "ದಿನಾಂಕ",
  fu_focus_area: "ಗಮನ ಕ್ಷೇತ್ರ",
  fu_clinical_notes: "ಕ್ಲಿನಿಕಲ್ ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)",
  fu_clinical_notes_ph: "ನಿರ್ದಿಷ್ಟ ಸೂಚನೆಗಳು ಅಥವಾ ಗಮನಿಸಬೇಕಾದ ವಿಷಯಗಳನ್ನು ಸೇರಿಸಿ...",
  fu_scheduling: "ನಿಗದಿಪಡಿಸಲಾಗುತ್ತಿದೆ...",
  fu_update_schedule: "ವೇಳಾಪಟ್ಟಿ ನವೀಕರಿಸಿ",
  fu_schedule_followup_btn: "ಫಾಲೋ-ಅಪ್ ನಿಗದಿಪಡಿಸಿ",
  fu_plan_secured: "ನಿರಂತರತೆ ಯೋಜನೆ ಸುರಕ್ಷಿತ",
  result_progression_intel: "ಪ್ರಗತಿ ವಿಶ್ಲೇಷಣೆ",
  result_compared_to: "ಮೌಲ್ಯಮಾಪನದೊಂದಿಗೆ ಹೋಲಿಸಿ:",
  result_referral_readiness: "ಉಲ್ಲೇಖ ಸಿದ್ಧತೆ",
  result_referral_emergency: "ತಕ್ಷಣದ ಸಾರಿಗೆ ವ್ಯವಸ್ಥೆ ಮಾಡಿ. ರೋಗಿಯನ್ನು ಆರಾಮದಾಯಕವಾಗಿ ಮತ್ತು ಕುಳಿತುಕೊಳ್ಳುವಂತೆ ಇರಿಸಿ. ಎಲ್ಲಾ ಗುರುತು ಮತ್ತು ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ತನ್ನಿ.",
  result_referral_phc: "ಶೀಘ್ರದಲ್ಲೇ ಕ್ಲಿನಿಕಲ್ ಭೇಟಿಯನ್ನು ಯೋಜಿಸಿ. ರೋಗಿಯು ನೀರಿನಂಶ ಹೊಂದಿರುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ ಮತ್ತು ಎಲ್ಲಾ ಹಿಂದಿನ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ತನ್ನಿ.",
  result_healthcare_guidance: "ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶನ",
  result_guidance_subtitle: "ವಿಸ್ತೃತ ಕ್ಲಿನಿಕಲ್ ತರ್ಕ ಮತ್ತು ಆರೈಕೆ ಸೂಚನೆಗಳನ್ನು ಓದಿ.",
  result_generate_guidance: "ಆರೈಕೆ ಮಾರ್ಗದರ್ಶನ ರಚಿಸಿ",
  result_generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
  result_print: "ದಾಖಲೆ ಮುದ್ರಿಸಿ",
  result_offline_guidance: "ಸಂಪರ್ಕ ಬಾಧಿತ. ಸುರಕ್ಷಿತ ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶನ ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
  history_no_records: "ರೋಗಿ ದಾಖಲೆಗಳಿಲ್ಲ",
  history_no_records_desc: "ಮೌಲ್ಯಮಾಪನಗಳು ಪೂರ್ಣಗೊಂಡಂತೆ ರೋಗಿ ಆರೈಕೆ ಪ್ರಯಾಣಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
  history_start_reassessment: "ಮರು ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ",
  history_unknown_patient: "ಅಜ್ಞಾತ ರೋಗಿ",
  history_assessments: "ಮೌಲ್ಯಮಾಪನಗಳು",
  queue_action_case: "ಪ್ರಕರಣ ಕ್ರಮ",
  queue_next_action: "ಮುಂದಿನ ಅಗತ್ಯ ಕ್ರಮ",
  queue_review_patient: "ರೋಗಿ ಪರಿಶೀಲನೆ",
  queue_verify_emergency_ref: "ತುರ್ತು ಉಲ್ಲೇಖ ಪರಿಶೀಲಿಸಿ",
  queue_check_phc_status: "PHC ಉಲ್ಲೇಖ ಸ್ಥಿತಿ ತಪಾಸಣೆ",
  time_just_now: "ಈಗಷ್ಟೇ",
  time_h_ago: "%n ಗ ಹಿಂದೆ",
  time_d_ago: "%n ದಿ ಹಿಂದೆ",
};

export const DICTS: Record<Lang, Dict> = { en, hi, kn };

export function t(lang: Lang, key: keyof Dict): string {
  return DICTS[lang][key] ?? DICTS.en[key];
}
