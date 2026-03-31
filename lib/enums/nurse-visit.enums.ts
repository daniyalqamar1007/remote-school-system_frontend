export enum NurseVisitStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  CANCELLED = 'cancelled'
}

export enum NurseVisitPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

export enum NurseVisitDisposition {
  RETURN_TO_CLASS = 'return_to_class',
  SENT_HOME = 'sent_home',
  TRANSPORTED_TO_HOSPITAL = 'transported_to_hospital',
  PARENT_CALLED = 'parent_called'
}

// Display labels
export const NurseVisitStatusLabels: Record<NurseVisitStatus, string> = {
  [NurseVisitStatus.IN_PROGRESS]: 'In Progress',
  [NurseVisitStatus.COMPLETED]: 'Completed',
  [NurseVisitStatus.FOLLOW_UP_REQUIRED]: 'Follow-up Required',
  [NurseVisitStatus.CANCELLED]: 'Cancelled'
}

export const NurseVisitPriorityLabels: Record<NurseVisitPriority, string> = {
  [NurseVisitPriority.LOW]: 'Low',
  [NurseVisitPriority.MEDIUM]: 'Medium',
  [NurseVisitPriority.HIGH]: 'High',
  [NurseVisitPriority.EMERGENCY]: 'Emergency'
}

export const NurseVisitDispositionLabels: Record<NurseVisitDisposition, string> = {
  [NurseVisitDisposition.RETURN_TO_CLASS]: 'Return to Class',
  [NurseVisitDisposition.SENT_HOME]: 'Sent Home',
  [NurseVisitDisposition.TRANSPORTED_TO_HOSPITAL]: 'Transported to Hospital',
  [NurseVisitDisposition.PARENT_CALLED]: 'Parent Called'
}

// Badge colors
export const NurseVisitStatusColors: Record<NurseVisitStatus, string> = {
  [NurseVisitStatus.IN_PROGRESS]: 'bg-blue-500',
  [NurseVisitStatus.COMPLETED]: 'bg-green-500',
  [NurseVisitStatus.FOLLOW_UP_REQUIRED]: 'bg-yellow-500',
  [NurseVisitStatus.CANCELLED]: 'bg-gray-500'
}

export const NurseVisitPriorityColors: Record<NurseVisitPriority, string> = {
  [NurseVisitPriority.LOW]: 'bg-gray-500',
  [NurseVisitPriority.MEDIUM]: 'bg-yellow-500',
  [NurseVisitPriority.HIGH]: 'bg-orange-500',
  [NurseVisitPriority.EMERGENCY]: 'bg-red-500'
}

export const NurseVisitDispositionColors: Record<NurseVisitDisposition, string> = {
  [NurseVisitDisposition.RETURN_TO_CLASS]: 'bg-green-500',
  [NurseVisitDisposition.SENT_HOME]: 'bg-yellow-500',
  [NurseVisitDisposition.TRANSPORTED_TO_HOSPITAL]: 'bg-red-500',
  [NurseVisitDisposition.PARENT_CALLED]: 'bg-blue-500'
}

