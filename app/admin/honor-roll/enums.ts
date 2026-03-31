// Grade Level Enum - must match backend
export enum GradeLevel {
  GRADE_0 = 'Kindergarten',
  GRADE_1 = 'Grade 1',
  GRADE_2 = 'Grade 2',
  GRADE_3 = 'Grade 3',
  GRADE_4 = 'Grade 4',
  GRADE_5 = 'Grade 5',
  GRADE_6 = 'Grade 6',
  GRADE_7 = 'Grade 7',
  GRADE_8 = 'Grade 8',
  GRADE_9 = 'Grade 9',
  GRADE_10 = 'Grade 10',
  GRADE_11 = 'Grade 11',
  GRADE_12 = 'Grade 12',
}

// Marking Period Enum - must match backend
export enum MarkingPeriod {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
  SEMESTER_1 = 'Semester 1',
  SEMESTER_2 = 'Semester 2',
  FINAL = 'Final',
}

// Grade Level Labels
export const GradeLevelLabels: Record<GradeLevel, string> = {
  [GradeLevel.GRADE_0]: 'Kindergarten',
  [GradeLevel.GRADE_1]: 'Grade 1',
  [GradeLevel.GRADE_2]: 'Grade 2',
  [GradeLevel.GRADE_3]: 'Grade 3',
  [GradeLevel.GRADE_4]: 'Grade 4',
  [GradeLevel.GRADE_5]: 'Grade 5',
  [GradeLevel.GRADE_6]: 'Grade 6',
  [GradeLevel.GRADE_7]: 'Grade 7',
  [GradeLevel.GRADE_8]: 'Grade 8',
  [GradeLevel.GRADE_9]: 'Grade 9',
  [GradeLevel.GRADE_10]: 'Grade 10',
  [GradeLevel.GRADE_11]: 'Grade 11',
  [GradeLevel.GRADE_12]: 'Grade 12',
};

// Marking Period Labels
export const MarkingPeriodLabels: Record<MarkingPeriod, string> = {
  [MarkingPeriod.Q1]: 'Q1',
  [MarkingPeriod.Q2]: 'Q2',
  [MarkingPeriod.Q3]: 'Q3',
  [MarkingPeriod.Q4]: 'Q4',
  [MarkingPeriod.SEMESTER_1]: 'Semester 1',
  [MarkingPeriod.SEMESTER_2]: 'Semester 2',
  [MarkingPeriod.FINAL]: 'Final',
};

