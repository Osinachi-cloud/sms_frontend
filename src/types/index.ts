export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  platformRole?: string;
  studentId?: string;
  children?: { id: string; fullName: string; className?: string; classId?: string }[];
  schools: SchoolInfo[];
}

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  roleName?: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface School {
  id: string;
  name: string;
  subdomain?: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  status: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  admin?: {
    fullName: string;
    email: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  key: string;
  category: string;
  description?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  classId?: string;
  className?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  admissionDate?: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  isClassTeacher?: boolean;
}

export interface Teacher {
  id: string;
  employeeId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  dateOfJoining?: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  section?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  capacity?: number;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  folderId?: string;
  folderName?: string;
  subjectId?: string;
  subjectName?: string;
  termId?: string;
  termName?: string;
  sessionId?: string;
  sessionName?: string;
  teacherId?: string;
  teacherName?: string;
  richText?: string;
  body?: string;
  fileUrls: string[];
  videoLinks: string[];
  dueDate?: string;
  status: string;
  rejectionReason?: string;
  approvedAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  version: number;
  metadata: Record<string, any>;
  targetClassIds?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  classId?: string;
  subjectId?: string;
  sortOrder: number;
  createdAt?: string;
}

export interface SubjectWithFolders {
  id: string;
  name: string;
  code?: string;
  folders: ContentFolder[];
}

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentReference: string;
  paystackReference?: string;
  paystackAccessCode?: string;
  authorizationUrl?: string;
  status: string;
  paidAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  totalRevenue: number;
  pendingFees: number;
  pendingContentApprovals: number;
  recentActivities: RecentActivity[];
  revenueByMonth?: RevenueData[];
}

export interface RecentActivity {
  action: string;
  user: string;
  time: string;
  type?: string;
}

export interface RevenueData {
  month: string;
  amount: number;
}

export interface StudentDashboard {
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    email?: string;
  };
  currentClass?: {
    id: string;
    name: string;
    classTeacher?: string;
  };
  subjects: SubjectWithGrade[];
  attendance: AttendanceSummary;
  feeStatus: FeeStatus;
  upcomingAssignments: Assignment[];
}

export interface SubjectWithGrade {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  teacherName?: string;
  latestScore?: number;
  maxScore?: number;
  gradeLetter?: string;
  termName?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export interface FeeStatus {
  totalDue: number;
  totalPaid: number;
  balance: number;
  pendingItems: number;
  overdueItems: number;
}

export interface Assignment {
  id: string;
  title: string;
  subjectName: string;
  dueDate?: string;
  status: string;
}

export interface TeacherDashboard {
  teacher: {
    id: string;
    fullName: string;
    employeeId?: string;
    email?: string;
    specialization?: string;
  };
  myClasses: ClassAssignment[];
  totalStudents: number;
  pendingContentApprovals: number;
  recentSubmissions: RecentSubmission[];
}

export interface ClassAssignment {
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  isClassTeacher: boolean;
  studentCount: number;
}

export interface RecentSubmission {
  contentId: string;
  title: string;
  status: string;
  submittedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  termId: string;
  termName?: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  gradeLetter?: string;
  remarks?: string;
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  intendedClassId?: string;
  intendedClassName?: string;
  previousSchool?: string;
  guardianName: string;
  guardianEmail?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'INTERVIEW_SCHEDULED' | 'ACCEPTED' | 'REJECTED';
  examScore?: number;
  interviewScore?: number;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDetail extends Student {
  className?: string;
  classTeacherName?: string;
  section?: string;
  limitedView?: boolean;
  parents: {
    id?: string;
    fullName: string;
    email?: string;
    phone?: string;
    relationship?: string;
    address?: string;
    occupation?: string;
  }[];
  payments: Payment[];
  feesDue: {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
  }[];
  grades: Grade[];
  reportCards: {
    id: string;
    termName: string;
    year: string;
    overallAverage: number;
    position?: number;
    totalStudents?: number;
    gradeLetter?: string;
    status: string;
    createdAt: string;
  }[];
  attendanceSummary?: AttendanceSummary;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  targetClassIds?: string[];
  durationMinutes?: number;
  totalMarks?: number;
  passMark?: number;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
  showCorrectAnswers?: boolean;
  resultVisibilityType?: 'IMMEDIATELY' | 'AFTER_ALL_SUBMITTED' | 'AFTER_DEADLINE' | 'MANUAL' | 'NEVER';
  resultsReleased?: boolean;
  scoreAggregationStrategy?: 'HIGHEST' | 'LOWEST' | 'AVERAGE';
  maxAttempts?: number;
  startTime?: string;
  endTime?: string;
  status?: string;
  quizType?: 'QUIZ' | 'ASSIGNMENT' | 'ASSESSMENT' | 'EXAM';
  isEnabled?: boolean;
  termId?: string;
  termName?: string;
  sessionId?: string;
  sessionName?: string;
  questionCount?: number;
  hasAttempted?: boolean;
  attemptsUsed?: number;
  bestScore?: number;
  questions?: QuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id?: string;
  questionText: string;
  questionType: 'MCQ' | 'CHECKBOX' | 'SHORT_ANSWER' | 'PARAGRAPH' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MATCHING';
  options?: Array<{ label: string; value: string } | string>;
  marks?: number;
  orderIndex?: number;
  explanation?: string;
  correctAnswer?: string;
  correctAnswers?: string[];
  required?: boolean;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  gradeLetter?: string;
  status: string;
  attemptNumber?: number;
}

export interface QuizAnswer {
  questionId: string;
  questionText?: string;
  userAnswer?: string;
  selectedOptions?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  isCorrect?: boolean;
  marksObtained?: number;
  totalMarks?: number;
  explanation?: string;
}

export interface QuizParticipant {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
  attemptCount: number;
  bestScore?: number;
  bestPercentage?: number;
  bestGradeLetter?: string;
  passed: boolean;
  attempts: QuizAttemptInfo[];
}

export interface QuizAttemptInfo {
  submissionId: string;
  attemptNumber: number;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  gradeLetter?: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
}

export interface QuizResult {
  submissionId: string;
  quizId: string;
  quizTitle: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  gradeLetter?: string;
  status: string;
  showCorrectAnswers?: boolean;
  resultsVisible?: boolean;
  resultsAvailableText?: string;
  answers?: QuizAnswer[];
}
