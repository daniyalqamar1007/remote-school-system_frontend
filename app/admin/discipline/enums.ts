// Incident Type Enum - must match backend
export enum IncidentType {
  DISRUPTION = 'disruption',
  BULLYING = 'bullying',
  VANDALISM = 'vandalism',
  TARDINESS = 'tardiness',
  INSUBORDINATION = 'insubordination',
  FIGHTING = 'fighting',
  OTHER = 'other',
}

// Consequence Type Enum - must match backend
export enum ConsequenceType {
  DETENTION = 'detention',
  SUSPENSION = 'suspension',
  COUNSELING = 'counseling',
  WARNING = 'warning',
  PARENT_CONFERENCE = 'parent_conference',
  COMMUNITY_SERVICE = 'community_service',
}

// Incident Type Labels
export const IncidentTypeLabels: Record<IncidentType, string> = {
  [IncidentType.DISRUPTION]: '🔊 Classroom Disruption',
  [IncidentType.BULLYING]: '👥 Bullying/Harassment',
  [IncidentType.VANDALISM]: '💥 Vandalism/Property Damage',
  [IncidentType.TARDINESS]: '⏰ Chronic Tardiness',
  [IncidentType.INSUBORDINATION]: '❌ Insubordination',
  [IncidentType.FIGHTING]: '⚔️ Physical Altercation',
  [IncidentType.OTHER]: '📝 Other',
};

// Consequence Type Labels
export const ConsequenceTypeLabels: Record<ConsequenceType, string> = {
  [ConsequenceType.DETENTION]: '📚 After-School Detention',
  [ConsequenceType.SUSPENSION]: '🚫 Suspension',
  [ConsequenceType.COUNSELING]: '💬 Mandatory Counseling',
  [ConsequenceType.WARNING]: '⚠️ Formal Warning',
  [ConsequenceType.PARENT_CONFERENCE]: '👨‍👩‍👧‍👦 Parent Conference',
  [ConsequenceType.COMMUNITY_SERVICE]: '🤝 Community Service',
};

// Export enum values as array for easy iteration
export const IncidentTypeValues = Object.values(IncidentType);
export const ConsequenceTypeValues = Object.values(ConsequenceType);

