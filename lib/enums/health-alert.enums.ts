export enum HealthAlertType {
  MEDICAL_EMERGENCY = 'medical_emergency',
  ALLERGY_ALERT = 'allergy_alert',
  MEDICATION_DUE = 'medication_due',
  CONDITION_MONITORING = 'condition_monitoring',
  IMMUNIZATION_DUE = 'immunization_due',
  PHYSICAL_RESTRICTION = 'physical_restriction',
  CUSTOM_ALERT = 'custom_alert'
}

export enum HealthAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Display labels
export const HealthAlertTypeLabels: Record<HealthAlertType, string> = {
  [HealthAlertType.MEDICAL_EMERGENCY]: 'Medical Emergency',
  [HealthAlertType.ALLERGY_ALERT]: 'Allergy Alert',
  [HealthAlertType.MEDICATION_DUE]: 'Medication Due',
  [HealthAlertType.CONDITION_MONITORING]: 'Condition Monitoring',
  [HealthAlertType.IMMUNIZATION_DUE]: 'Immunization Due',
  [HealthAlertType.PHYSICAL_RESTRICTION]: 'Physical Restriction',
  [HealthAlertType.CUSTOM_ALERT]: 'Custom Alert'
}

export const HealthAlertSeverityLabels: Record<HealthAlertSeverity, string> = {
  [HealthAlertSeverity.LOW]: 'Low',
  [HealthAlertSeverity.MEDIUM]: 'Medium',
  [HealthAlertSeverity.HIGH]: 'High',
  [HealthAlertSeverity.CRITICAL]: 'Critical'
}

// Badge colors
export const HealthAlertTypeColors: Record<HealthAlertType, string> = {
  [HealthAlertType.MEDICAL_EMERGENCY]: 'bg-red-500',
  [HealthAlertType.ALLERGY_ALERT]: 'bg-orange-500',
  [HealthAlertType.MEDICATION_DUE]: 'bg-blue-500',
  [HealthAlertType.CONDITION_MONITORING]: 'bg-purple-500',
  [HealthAlertType.IMMUNIZATION_DUE]: 'bg-green-500',
  [HealthAlertType.PHYSICAL_RESTRICTION]: 'bg-yellow-500',
  [HealthAlertType.CUSTOM_ALERT]: 'bg-gray-500'
}

export const HealthAlertSeverityColors: Record<HealthAlertSeverity, string> = {
  [HealthAlertSeverity.LOW]: 'bg-gray-500',
  [HealthAlertSeverity.MEDIUM]: 'bg-yellow-500',
  [HealthAlertSeverity.HIGH]: 'bg-orange-500',
  [HealthAlertSeverity.CRITICAL]: 'bg-red-500'
}

