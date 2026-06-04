// =====================================================
// Complete Mock Data for End-to-End Simulation
// This data is used when the backend is offline/unavailable
// DELETE or set USE_MOCK_FALLBACK=false before production
// =====================================================

export const mockEvents = [
  { id: '1', title: 'First Term Exam', description: 'End of first term examinations for all classes', eventType: 'EXAM', startDate: new Date(Date.now() + 86400000 * 7).toISOString(), endDate: new Date(Date.now() + 86400000 * 10).toISOString(), location: 'School Hall', isAllDay: false, createdBy: '1' },
  { id: '2', title: 'Sports Day', description: 'Annual inter-house sports competition', eventType: 'SPORTS', startDate: new Date(Date.now() + 86400000 * 14).toISOString(), endDate: new Date(Date.now() + 86400000 * 14).toISOString(), location: 'School Field', isAllDay: true, createdBy: '1' },
  { id: '3', title: 'Parent-Teacher Meeting', description: 'Discuss student progress', eventType: 'MEETING', startDate: new Date(Date.now() + 86400000 * 3).toISOString(), endDate: null, location: 'Conference Room', isAllDay: false, createdBy: '1' },
  { id: '4', title: 'Mid-Term Holiday', description: 'One week mid-term break', eventType: 'HOLIDAY', startDate: new Date(Date.now() + 86400000 * 21).toISOString(), endDate: new Date(Date.now() + 86400000 * 28).toISOString(), location: null, isAllDay: true, createdBy: '1' },
];

export const mockAnnouncements = [
  { id: '1', title: 'Exam Timetable Released', content: 'The first term examination timetable has been released. Students are advised to check the CMS for their individual schedules.', targetAudience: 'ALL', priority: 'HIGH', isPinned: true, expiresAt: null, createdAt: new Date().toISOString() },
  { id: '2', title: 'Sports Day Registration', content: 'Registration for the annual inter-house sports competition is now open. Contact your class teacher to register for events.', targetAudience: 'STUDENTS', priority: 'NORMAL', isPinned: false, expiresAt: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', title: 'Fee Payment Reminder', content: 'This is a reminder that second term fees are due by the end of this month. Late payments will attract a 5% penalty.', targetAudience: 'PARENTS', priority: 'URGENT', isPinned: true, expiresAt: null, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', title: 'New Library Books Available', content: 'Over 50 new books have been added to the digital library covering STEM, literature, and sciences.', targetAudience: 'STUDENTS', priority: 'NORMAL', isPinned: false, expiresAt: null, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const mockNotifications = [
  { id: '1', title: 'New Quiz Available', message: 'Mathematics Quiz 1 is now available. Duration: 30 minutes.', type: 'ASSIGNMENT', isRead: false, createdAt: new Date().toISOString() },
  { id: '2', title: 'Report Card Published', message: 'Your first term report card has been published.', type: 'GRADE', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', title: 'Fee Payment Received', message: 'Payment of ₦45,000 received. Thank you!', type: 'FEE', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', title: 'Event Reminder', message: 'Parent-Teacher Meeting is scheduled for tomorrow at 2 PM.', type: 'EVENT', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const mockQuizzes = [
  { id: '1', title: 'Mathematics - Algebra Basics', description: 'Test your understanding of basic algebraic expressions and equations', subjectName: 'Mathematics', className: 'JSS 2', durationMinutes: 30, totalMarks: 50, passMark: 25, status: 'PUBLISHED', questionCount: 5, questions: [
    { id: 'q1', questionText: 'What is the value of x in 2x + 5 = 15?', questionType: 'MCQ', options: [{ label: '5', value: '5' }, { label: '10', value: '10' }, { label: '15', value: '15' }, { label: '20', value: '20' }], correctAnswer: '5', marks: 10 },
    { id: 'q2', questionText: 'Solve: 3(x - 2) = 12', questionType: 'MCQ', options: [{ label: '4', value: '4' }, { label: '6', value: '6' }, { label: '8', value: '8' }, { label: '10', value: '10' }], correctAnswer: '6', marks: 10 },
    { id: 'q3', questionText: 'If a = 3 and b = 4, what is a² + b²?', questionType: 'MCQ', options: [{ label: '16', value: '16' }, { label: '25', value: '25' }, { label: '36', value: '36' }, { label: '49', value: '49' }], correctAnswer: '25', marks: 10 },
    { id: 'q4', questionText: 'Factorize: x² - 9', questionType: 'MCQ', options: [{ label: '(x-3)(x+3)', value: '(x-3)(x+3)' }, { label: '(x-9)(x+1)', value: '(x-9)(x+1)' }, { label: '(x-3)²', value: '(x-3)²' }, { label: '(x+9)(x-1)', value: '(x+9)(x-1)' }], correctAnswer: '(x-3)(x+3)', marks: 10 },
    { id: 'q5', questionText: 'The sum of two consecutive numbers is 35. What are the numbers?', questionType: 'MCQ', options: [{ label: '16 and 17', value: '16,17' }, { label: '17 and 18', value: '17,18' }, { label: '15 and 20', value: '15,20' }, { label: '12 and 23', value: '12,23' }], correctAnswer: '17,18', marks: 10 },
  ]},
  { id: '2', title: 'English - Grammar Test', description: 'Parts of speech and sentence structure', subjectName: 'English', className: 'JSS 1', durationMinutes: 20, totalMarks: 30, passMark: 15, status: 'PUBLISHED', questionCount: 3, questions: [
    { id: 'q6', questionText: 'Identify the noun in: "The cat sat on the mat."', questionType: 'FILL_BLANK', options: [], correctAnswer: 'cat', marks: 10 },
    { id: 'q7', questionText: 'A sentence must always end with a full stop.', questionType: 'TRUE_FALSE', options: [], correctAnswer: 'false', marks: 10 },
    { id: 'q8', questionText: 'What is the adjective in: "She wore a beautiful dress."', questionType: 'FILL_BLANK', options: [], correctAnswer: 'beautiful', marks: 10 },
  ]},
  { id: '3', title: 'Science - Basic Physics', description: 'Forces and motion basics', subjectName: 'Science', className: 'JSS 2', durationMinutes: 25, totalMarks: 40, passMark: 20, status: 'DRAFT', questionCount: 4, questions: [] },
];

export const mockLibraryBooks = [
  { id: '1', title: 'Introduction to Algebra', author: 'Dr. K. O. Adeyemi', isbn: '978-1234567890', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 5, totalCopies: 5, categoryName: 'Mathematics', tags: ['math', 'algebra'] },
  { id: '2', title: 'English Grammar for Schools', author: 'J. Smith & Co.', isbn: '978-0987654321', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 3, totalCopies: 3, categoryName: 'English', tags: ['grammar', 'language'] },
  { id: '3', title: 'Basic Science Experiments', author: 'Prof. A. N. science', isbn: '978-1122334455', fileType: 'VIDEO', coverImageUrl: '', isDigital: true, availableCopies: 1, totalCopies: 1, categoryName: 'Science', tags: ['experiments', 'physics'] },
  { id: '4', title: 'Coding for Kids - Scratch', author: 'MIT Media Lab', isbn: '978-5566778899', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 10, totalCopies: 10, categoryName: 'STEM', tags: ['coding', 'programming'] },
  { id: '5', title: 'Nigerian History: A Journey', author: 'O. Obafemi', isbn: '978-2233445566', fileType: 'EPUB', coverImageUrl: '', isDigital: true, availableCopies: 2, totalCopies: 2, categoryName: 'History', tags: ['history', 'nigeria'] },
  { id: '6', title: 'Web Development Basics', author: 'M. Zuckerberg', isbn: '978-3344556677', fileType: 'PDF', coverImageUrl: '', isDigital: true, availableCopies: 4, totalCopies: 4, categoryName: 'STEM', tags: ['web', 'html', 'css'] },
];

export const mockReportCards = [
  { id: '1', studentName: 'Ade Johnson', admissionNumber: 'GFA/2023/001', termName: 'First Term 2025/2026', averageScore: 78.5, overallGrade: 'B', classPosition: 5, classSize: 35, status: 'PUBLISHED', attendancePresent: 45, attendanceAbsent: 2, teacherComment: 'Excellent performance. Keep up the good work!', principalComment: 'A well-rounded student.', entries: [
    { subjectName: 'Mathematics', testScore: 18, examScore: 55, totalScore: 73, gradeLetter: 'B', remarks: 'Good' },
    { subjectName: 'English', testScore: 20, examScore: 62, totalScore: 82, gradeLetter: 'A', remarks: 'Excellent' },
    { subjectName: 'Science', testScore: 15, examScore: 50, totalScore: 65, gradeLetter: 'C', remarks: 'Fair - needs improvement' },
    { subjectName: 'Social Studies', testScore: 19, examScore: 58, totalScore: 77, gradeLetter: 'B', remarks: 'Good' },
    { subjectName: 'Basic Tech', testScore: 20, examScore: 60, totalScore: 80, gradeLetter: 'A', remarks: 'Excellent' },
  ]},
  { id: '2', studentName: 'Chioma Obi', admissionNumber: 'GFA/2022/001', termName: 'First Term 2025/2026', averageScore: 85.2, overallGrade: 'A', classPosition: 2, classSize: 30, status: 'PUBLISHED', attendancePresent: 47, attendanceAbsent: 0, teacherComment: 'Outstanding work! A top performer.', principalComment: 'Exceptional student.', entries: [
    { subjectName: 'Mathematics', testScore: 20, examScore: 68, totalScore: 88, gradeLetter: 'A', remarks: 'Excellent' },
    { subjectName: 'English', testScore: 19, examScore: 65, totalScore: 84, gradeLetter: 'A', remarks: 'Excellent' },
    { subjectName: 'Science', testScore: 18, examScore: 64, totalScore: 82, gradeLetter: 'A', remarks: 'Excellent' },
    { subjectName: 'Social Studies', testScore: 20, examScore: 66, totalScore: 86, gradeLetter: 'A', remarks: 'Excellent' },
  ]},
  { id: '3', studentName: 'David Lee', admissionNumber: 'SIS/2023/001', termName: 'First Term 2025/2026', averageScore: 72.0, overallGrade: 'B', classPosition: 8, classSize: 25, status: 'DRAFT', attendancePresent: 44, attendanceAbsent: 3, teacherComment: 'Good effort. Can do better.', principalComment: '', entries: [
    { subjectName: 'Mathematics', testScore: 16, examScore: 50, totalScore: 66, gradeLetter: 'C', remarks: 'Fair' },
    { subjectName: 'English', testScore: 18, examScore: 58, totalScore: 76, gradeLetter: 'B', remarks: 'Good' },
    { subjectName: 'Science', testScore: 17, examScore: 52, totalScore: 69, gradeLetter: 'C', remarks: 'Fair' },
  ]},
];

export const mockAdmissions = [
  { id: '1', applicationNumber: 'APP-2026-001', firstName: 'Michael', lastName: 'Johnson', dateOfBirth: '2015-03-12', gender: 'MALE', email: 'michael.j@test.com', phone: '08012345671', guardianName: 'Mr. Robert Johnson', guardianPhone: '08012345672', intendedClassName: 'JSS 1', status: 'PENDING', examScore: null, interviewScore: null, reviewNotes: '', createdAt: new Date().toISOString() },
  { id: '2', applicationNumber: 'APP-2026-002', firstName: 'Amara', lastName: 'Williams', dateOfBirth: '2014-07-22', gender: 'FEMALE', email: 'amara.w@test.com', phone: '08012345673', guardianName: 'Mrs. Chioma Williams', guardianPhone: '08012345674', intendedClassName: 'JSS 2', status: 'UNDER_REVIEW', examScore: 78, interviewScore: null, reviewNotes: 'Strong application', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', applicationNumber: 'APP-2026-003', firstName: 'Emmanuel', lastName: 'Adeleke', dateOfBirth: '2016-01-05', gender: 'MALE', email: 'emmanuel.a@test.com', phone: '08012345675', guardianName: 'Mr. Femi Adeleke', guardianPhone: '08012345676', intendedClassName: 'JSS 1', status: 'ACCEPTED', examScore: 85, interviewScore: 82, reviewNotes: 'Excellent candidate', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', applicationNumber: 'APP-2026-004', firstName: 'Fatima', lastName: 'Bello', dateOfBirth: '2014-11-18', gender: 'FEMALE', email: 'fatima.b@test.com', phone: '08012345677', guardianName: 'Dr. Aisha Bello', guardianPhone: '08012345678', intendedClassName: 'JSS 3', status: 'REJECTED', examScore: 42, interviewScore: 45, reviewNotes: 'Did not meet minimum requirements', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const mockLeaderboard = [
  { userId: '1', fullName: 'Chioma Obi', avatarUrl: '', totalPoints: 1250, badgesCount: 5, rank: 1 },
  { userId: '2', fullName: 'Ade Johnson', avatarUrl: '', totalPoints: 980, badgesCount: 4, rank: 2 },
  { userId: '3', fullName: 'David Lee', avatarUrl: '', totalPoints: 875, badgesCount: 3, rank: 3 },
  { userId: '4', fullName: 'Blessing Eze', avatarUrl: '', totalPoints: 720, badgesCount: 3, rank: 4 },
  { userId: '5', fullName: 'Chinedu Okoro', avatarUrl: '', totalPoints: 650, badgesCount: 2, rank: 5 },
];

export const mockBadges = [
  { id: '1', name: 'Perfect Attendance', description: 'Attended all classes for a full term', color: '#FFD700', criteriaType: 'ATTENDANCE_STREAK', pointsValue: 50, earned: true },
  { id: '2', name: 'Math Whiz', description: 'Scored 90+ in Mathematics', color: '#6366F1', criteriaType: 'GRADE_AVERAGE', pointsValue: 30, earned: true },
  { id: '3', name: 'Quiz Master', description: 'Completed 10 quizzes with 80%+', color: '#10B981', criteriaType: 'QUIZ_SCORE', pointsValue: 40, earned: false },
  { id: '4', name: 'Bookworm', description: 'Read 5 books from the library', color: '#F59E0B', criteriaType: 'CONTENT_COMPLETED', pointsValue: 25, earned: false },
  { id: '5', name: 'Early Bird', description: 'Submitted all assignments on time', color: '#EC4899', criteriaType: 'ASSIGNMENTS_ON_TIME', pointsValue: 20, earned: true },
];

export const mockConversations = [
  { id: '1', title: 'Mr. John Okafor', type: 'DIRECT', participants: [{ userId: 't1', fullName: 'Mr. John Okafor', role: 'Teacher' }], lastMessage: { senderName: 'Mr. John Okafor', content: 'Please submit the math assignment by Friday.', createdAt: new Date().toISOString() }, unreadCount: 2 },
  { id: '2', title: 'Parent Group - Greenfield', type: 'GROUP', participants: [{ userId: 'p1', fullName: 'Mrs. Folake Adeleke' }, { userId: 'p2', fullName: 'Dr. James Chen' }], lastMessage: { senderName: 'Mrs. Folake Adeleke', content: 'The PTA meeting is scheduled for next week.', createdAt: new Date(Date.now() - 86400000).toISOString() }, unreadCount: 0 },
  { id: '3', title: 'Platform Support', type: 'DIRECT', participants: [{ userId: 'admin1', fullName: 'Platform Admin', role: 'Admin' }], lastMessage: { senderName: 'Platform Admin', content: 'Your account has been verified.', createdAt: new Date(Date.now() - 172800000).toISOString() }, unreadCount: 0 },
];

export const mockMessages = [
  { id: 'm1', senderId: 't1', senderName: 'Mr. John Okafor', content: 'Hello! I wanted to check on Ade\'s progress in Mathematics.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'm2', senderId: 'me', senderName: 'You', content: 'He is doing well. His last test score was 85%.', createdAt: new Date(Date.now() - 3000000).toISOString() },
  { id: 'm3', senderId: 't1', senderName: 'Mr. John Okafor', content: 'That\'s great to hear! Please submit the assignment by Friday.', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'm4', senderId: 'me', senderName: 'You', content: 'Sure, we will make sure it is submitted on time. Thank you!', createdAt: new Date(Date.now() - 900000).toISOString() },
];

export const mockIdCards = [
  { id: '1', studentId: 's1', studentName: 'Ade Johnson', studentClass: 'JSS 2', admissionNumber: 'GFA/2023/001', cardNumber: 'GFA-2026-001', issueDate: '2026-01-15', expiryDate: '2027-01-15', qrCode: '', generatedPdfUrl: '', status: 'ACTIVE' },
  { id: '2', studentId: 's2', studentName: 'Chioma Obi', studentClass: 'SS 1', admissionNumber: 'GFA/2022/001', cardNumber: 'GFA-2026-002', issueDate: '2026-01-15', expiryDate: '2027-01-15', qrCode: '', generatedPdfUrl: '', status: 'ACTIVE' },
];

export const mockStudents = [
  { id: 's1', fullName: 'Ade Johnson', admissionNumber: 'GFA/2023/001', email: 'ade.j@greenfield.edu', phone: '08011112222', gender: 'MALE', className: 'JSS 2', status: 'ACTIVE', parentName: 'Mr. Johnson', parentPhone: '08011113333', dateOfBirth: '2012-05-15', address: '12 Lagos Street, Lagos', admissionDate: '2023-09-01', metadata: {}, createdAt: '2023-09-01T00:00:00Z' },
  { id: 's2', fullName: 'Chioma Obi', admissionNumber: 'GFA/2022/001', email: 'chioma.o@greenfield.edu', phone: '08022223333', gender: 'FEMALE', className: 'SS 1', status: 'ACTIVE', parentName: 'Mrs. Obi', parentPhone: '08022224444', dateOfBirth: '2011-03-20', address: '45 Abuja Crescent, Abuja', admissionDate: '2022-09-01', metadata: {}, createdAt: '2022-09-01T00:00:00Z' },
  { id: 's3', fullName: 'David Lee', admissionNumber: 'SIS/2023/001', email: 'david.l@sunrise.edu', phone: '08033334444', gender: 'MALE', className: 'Grade 10', status: 'ACTIVE', parentName: 'Mr. Lee', parentPhone: '08033335555', dateOfBirth: '2012-08-10', address: '78 Port Harcourt Road, PH', admissionDate: '2023-09-01', metadata: {}, createdAt: '2023-09-01T00:00:00Z' },
  { id: 's4', fullName: 'Blessing Eze', admissionNumber: 'GFA/2023/002', email: 'blessing.e@greenfield.edu', phone: '08044445555', gender: 'FEMALE', className: 'JSS 2', status: 'ACTIVE', parentName: 'Mrs. Eze', parentPhone: '08044446666', dateOfBirth: '2012-11-05', address: '33 Enugu Lane, Enugu', admissionDate: '2023-09-01', metadata: {}, createdAt: '2023-09-01T00:00:00Z' },
  { id: 's5', fullName: 'Chinedu Okoro', admissionNumber: 'GFA/2023/003', email: 'chinedu.o@greenfield.edu', phone: '08055556666', gender: 'MALE', className: 'JSS 1', status: 'ACTIVE', parentName: 'Mr. Okoro', parentPhone: '08055557777', dateOfBirth: '2013-02-28', address: '21 Kano Street, Kano', admissionDate: '2023-09-01', metadata: {}, createdAt: '2023-09-01T00:00:00Z' },
  { id: 's6', fullName: 'Tunde Afolabi', admissionNumber: 'GFA/2024/001', email: 'tunde.a@greenfield.edu', phone: '08066667777', gender: 'MALE', className: 'JSS 1', status: 'ACTIVE', parentName: 'Mr. Afolabi', parentPhone: '08066668888', dateOfBirth: '2013-06-12', address: '9 Ibadan Road, Ibadan', admissionDate: '2024-09-01', metadata: {}, createdAt: '2024-09-01T00:00:00Z' },
  { id: 's7', fullName: 'Sofia Martinez', admissionNumber: 'SIS/2023/002', email: 'sofia.m@sunrise.edu', phone: '08077778888', gender: 'FEMALE', className: 'Grade 10', status: 'ACTIVE', parentName: 'Mrs. Martinez', parentPhone: '08077779999', dateOfBirth: '2012-04-22', address: '55 Cross River Ave, Calabar', admissionDate: '2023-09-01', metadata: {}, createdAt: '2023-09-01T00:00:00Z' },
];

export const mockTeachers = [
  { id: 't1', employeeId: 'GFA-T001', fullName: 'Mr. John Okafor', email: 'john.o@greenfield.edu', phone: '08099998888', specialization: 'Mathematics', qualification: 'B.Sc Mathematics, M.Ed', dateOfJoining: '2021-01-15', status: 'ACTIVE', metadata: {}, createdAt: '2021-01-15T00:00:00Z' },
  { id: 't2', employeeId: 'GFA-T002', fullName: 'Mrs. Sarah Nwosu', email: 'sarah.n@greenfield.edu', phone: '08088887777', specialization: 'English', qualification: 'B.A English, PGDE', dateOfJoining: '2022-03-10', status: 'ACTIVE', metadata: {}, createdAt: '2022-03-10T00:00:00Z' },
  { id: 't3', employeeId: 'SIS-T001', fullName: 'Mrs. Mary Thompson', email: 'mary.t@sunrise.edu', phone: '08077776666', specialization: 'Science', qualification: 'B.Sc Biology, M.Sc', dateOfJoining: '2020-09-01', status: 'ACTIVE', metadata: {}, createdAt: '2020-09-01T00:00:00Z' },
  { id: 't4', employeeId: 'GFA-T003', fullName: 'Mr. Emeka Uzoma', email: 'emeka.u@greenfield.edu', phone: '08066665555', specialization: 'Accounting', qualification: 'B.Sc Accounting, ACA', dateOfJoining: '2023-01-20', status: 'ACTIVE', metadata: {}, createdAt: '2023-01-20T00:00:00Z' },
];

export const mockSchools = [
  { id: 'sch1', name: 'Greenfield Academy', subdomain: 'greenfield', code: 'GFA001', email: 'admin@greenfield.edu', phone: '08012345670', address: '1 Greenfield Avenue, Lagos', logoUrl: '', status: 'ACTIVE', config: { currency: 'NGN', timezone: 'Africa/Lagos' }, createdAt: '2020-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'sch2', name: 'Sunrise International School', subdomain: 'sunrise', code: 'SIS001', email: 'admin@sunrise.edu', phone: '08012345679', address: '10 Sunrise Boulevard, Abuja', logoUrl: '', status: 'ACTIVE', config: { currency: 'NGN', timezone: 'Africa/Lagos' }, createdAt: '2021-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

export const mockPayments = [
  { id: 'p1', studentId: 's1', studentName: 'Ade Johnson', amount: 45000, currency: 'NGN', paymentMethod: 'CARD', paymentReference: 'PAY-001-ABC', paystackReference: 'PSK-001', status: 'SUCCESS', paidAt: new Date(Date.now() - 172800000).toISOString(), metadata: {}, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'p2', studentId: 's1', studentName: 'Ade Johnson', amount: 45000, currency: 'NGN', paymentMethod: 'BANK_TRANSFER', paymentReference: 'PAY-002-DEF', paystackReference: 'PSK-002', status: 'PENDING', paidAt: null, metadata: {}, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p3', studentId: 's2', studentName: 'Chioma Obi', amount: 50000, currency: 'NGN', paymentMethod: 'CARD', paymentReference: 'PAY-003-GHI', paystackReference: 'PSK-003', status: 'SUCCESS', paidAt: new Date(Date.now() - 259200000).toISOString(), metadata: {}, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'p4', studentId: 's3', studentName: 'David Lee', amount: 60000, currency: 'NGN', paymentMethod: 'CARD', paymentReference: 'PAY-004-JKL', paystackReference: 'PSK-004', status: 'SUCCESS', paidAt: new Date(Date.now() - 345600000).toISOString(), metadata: {}, createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 'p5', studentId: 's4', studentName: 'Blessing Eze', amount: 45000, currency: 'NGN', paymentMethod: 'USSD', paymentReference: 'PAY-005-MNO', paystackReference: 'PSK-005', status: 'FAILED', paidAt: null, metadata: {}, createdAt: new Date(Date.now() - 432000000).toISOString() },
];

export const mockGrades = [
  { id: 'g1', studentId: 's1', studentName: 'Ade Johnson', subjectId: 'sub1', subjectName: 'Mathematics', subjectCode: 'MATH', termId: 'term1', termName: 'First Term 2025/2026', assessmentType: 'EXAM', score: 73, maxScore: 100, gradeLetter: 'B', remarks: 'Good', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'g2', studentId: 's1', studentName: 'Ade Johnson', subjectId: 'sub2', subjectName: 'English', subjectCode: 'ENG', termId: 'term1', termName: 'First Term 2025/2026', assessmentType: 'EXAM', score: 82, maxScore: 100, gradeLetter: 'A', remarks: 'Excellent', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'g3', studentId: 's1', studentName: 'Ade Johnson', subjectId: 'sub3', subjectName: 'Science', subjectCode: 'SCI', termId: 'term1', termName: 'First Term 2025/2026', assessmentType: 'EXAM', score: 65, maxScore: 100, gradeLetter: 'C', remarks: 'Fair', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'g4', studentId: 's2', studentName: 'Chioma Obi', subjectId: 'sub1', subjectName: 'Mathematics', subjectCode: 'MATH', termId: 'term1', termName: 'First Term 2025/2026', assessmentType: 'EXAM', score: 88, maxScore: 100, gradeLetter: 'A', remarks: 'Excellent', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'g5', studentId: 's2', studentName: 'Chioma Obi', subjectId: 'sub2', subjectName: 'English', subjectCode: 'ENG', termId: 'term1', termName: 'First Term 2025/2026', assessmentType: 'EXAM', score: 84, maxScore: 100, gradeLetter: 'A', remarks: 'Excellent', createdAt: '2025-10-15T00:00:00Z' },
];

export const mockDashboardStats = {
  totalStudents: 125,
  activeStudents: 118,
  totalTeachers: 18,
  activeTeachers: 16,
  totalClasses: 12,
  totalRevenue: 4500000,
  pendingFees: 850000,
  pendingContentApprovals: 4,
  recentActivities: [
    { action: 'New student enrolled', user: 'Mrs. Folake Adeleke', time: '2 mins ago', type: 'STUDENT' },
    { action: 'Fee payment received', user: 'Mr. Johnson', time: '15 mins ago', type: 'PAYMENT' },
    { action: 'Quiz published', user: 'Mr. John Okafor', time: '1 hour ago', type: 'CONTENT' },
    { action: 'Report card generated', user: 'System', time: '3 hours ago', type: 'GRADE' },
    { action: 'Announcement posted', user: 'Chief Adebayo', time: '5 hours ago', type: 'ANNOUNCEMENT' },
    { action: 'Teacher assigned to class', user: 'Mrs. Folake Adeleke', time: '1 day ago', type: 'TEACHER' },
  ],
  revenueByMonth: [
    { month: 'Jan', amount: 350000 },
    { month: 'Feb', amount: 420000 },
    { month: 'Mar', amount: 380000 },
    { month: 'Apr', amount: 450000 },
    { month: 'May', amount: 500000 },
    { month: 'Jun', amount: 470000 },
  ],
};

export const mockStudentDashboard = {
  student: { id: 's1', fullName: 'Ade Johnson', admissionNumber: 'GFA/2023/001', email: 'ade.j@greenfield.edu' },
  currentClass: { id: 'c1', name: 'JSS 2', classTeacher: 'Mr. John Okafor' },
  subjects: [
    { subjectId: 'sub1', subjectName: 'Mathematics', subjectCode: 'MATH', teacherName: 'Mr. John Okafor', latestScore: 73, maxScore: 100, gradeLetter: 'B', termName: 'First Term 2025/2026' },
    { subjectId: 'sub2', subjectName: 'English', subjectCode: 'ENG', teacherName: 'Mrs. Sarah Nwosu', latestScore: 82, maxScore: 100, gradeLetter: 'A', termName: 'First Term 2025/2026' },
    { subjectId: 'sub3', subjectName: 'Science', subjectCode: 'SCI', teacherName: 'Mrs. Mary Thompson', latestScore: 65, maxScore: 100, gradeLetter: 'C', termName: 'First Term 2025/2026' },
    { subjectId: 'sub4', subjectName: 'Social Studies', subjectCode: 'SOC', teacherName: 'Mr. Emeka Uzoma', latestScore: 77, maxScore: 100, gradeLetter: 'B', termName: 'First Term 2025/2026' },
    { subjectId: 'sub5', subjectName: 'Basic Tech', subjectCode: 'BTECH', teacherName: 'Mr. John Okafor', latestScore: 80, maxScore: 100, gradeLetter: 'A', termName: 'First Term 2025/2026' },
  ],
  attendance: { totalDays: 47, presentDays: 42, absentDays: 2, lateDays: 2, excusedDays: 1, attendancePercentage: 89.4 },
  feeStatus: { totalDue: 135000, totalPaid: 90000, balance: 45000, pendingItems: 1, overdueItems: 0 },
  upcomingAssignments: [
    { id: 'a1', title: 'Algebra Homework', subjectName: 'Mathematics', dueDate: '2025-06-20', status: 'PENDING' },
    { id: 'a2', title: 'Essay Writing', subjectName: 'English', dueDate: '2025-06-22', status: 'PENDING' },
    { id: 'a3', title: 'Science Project', subjectName: 'Science', dueDate: '2025-06-18', status: 'OVERDUE' },
  ],
};

export const mockTeacherDashboard = {
  teacher: { id: 't1', fullName: 'Mr. John Okafor', employeeId: 'GFA-T001', email: 'john.o@greenfield.edu', specialization: 'Mathematics' },
  myClasses: [
    { classId: 'c2', className: 'JSS 2', subjectId: 'sub1', subjectName: 'Mathematics', isClassTeacher: true, studentCount: 35 },
    { classId: 'c3', className: 'SS 1', subjectId: 'sub1', subjectName: 'Mathematics', isClassTeacher: false, studentCount: 30 },
    { classId: 'c4', className: 'JSS 1', subjectId: 'sub5', subjectName: 'Basic Tech', isClassTeacher: false, studentCount: 28 },
  ],
  totalStudents: 93,
  pendingContentApprovals: 2,
  recentSubmissions: [
    { contentId: 'cms1', title: 'Algebra Notes Chapter 3', status: 'PENDING_APPROVAL', submittedAt: '2025-06-15T10:30:00Z' },
    { contentId: 'cms2', title: 'Geometry Worksheet', status: 'APPROVED', submittedAt: '2025-06-14T14:00:00Z' },
    { contentId: 'cms3', title: 'Quiz 2 - Fractions', status: 'REJECTED', submittedAt: '2025-06-13T09:15:00Z' },
  ],
};

export const mockCmsContent = [
  { id: 'cms1', title: 'Introduction to Algebra', contentType: 'LESSON', folderId: 'f1', folderName: 'Mathematics', teacherId: 't1', teacherName: 'Mr. John Okafor', richText: '<p>Algebra is a branch of mathematics...</p>', fileUrls: [], videoLinks: [], dueDate: null, status: 'PUBLISHED', rejectionReason: null, approvedAt: '2025-06-01T00:00:00Z', publishedAt: '2025-06-01T00:00:00Z', expiresAt: null, version: 1, metadata: {}, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
  { id: 'cms2', title: 'Grammar Basics', contentType: 'LESSON', folderId: 'f2', folderName: 'English', teacherId: 't2', teacherName: 'Mrs. Sarah Nwosu', richText: '<p>Grammar is the system of a language...</p>', fileUrls: [], videoLinks: [], dueDate: null, status: 'PUBLISHED', rejectionReason: null, approvedAt: '2025-06-02T00:00:00Z', publishedAt: '2025-06-02T00:00:00Z', expiresAt: null, version: 1, metadata: {}, createdAt: '2025-06-02T00:00:00Z', updatedAt: '2025-06-02T00:00:00Z' },
  { id: 'cms3', title: 'Science Experiment Video', contentType: 'VIDEO', folderId: 'f3', folderName: 'Science', teacherId: 't3', teacherName: 'Mrs. Mary Thompson', richText: '', fileUrls: [], videoLinks: ['https://example.com/video1'], dueDate: null, status: 'PENDING_APPROVAL', rejectionReason: null, approvedAt: null, publishedAt: null, expiresAt: null, version: 1, metadata: {}, createdAt: '2025-06-10T00:00:00Z', updatedAt: '2025-06-10T00:00:00Z' },
];

export const mockCmsFolders = [
  { id: 'f1', name: 'Mathematics', description: 'Math lessons and resources', parentId: null, classId: null, subjectId: 'sub1', sortOrder: 1 },
  { id: 'f2', name: 'English', description: 'English lessons and resources', parentId: null, classId: null, subjectId: 'sub2', sortOrder: 2 },
  { id: 'f3', name: 'Science', description: 'Science lessons and resources', parentId: null, classId: null, subjectId: 'sub3', sortOrder: 3 },
];

export const mockRoles = [
  { id: 'r1', name: 'SUPER_ADMIN', description: 'Full access to all school features', isSystemRole: true, permissions: ['*'], createdAt: '2020-01-01T00:00:00Z' },
  { id: 'r2', name: 'ADMIN', description: 'School administration', isSystemRole: true, permissions: ['student.read', 'student.create', 'teacher.read', 'payment.read'], createdAt: '2020-01-01T00:00:00Z' },
  { id: 'r3', name: 'TEACHER', description: 'Teaching staff', isSystemRole: true, permissions: ['student.read', 'student.grades.manage', 'cms.content.create'], createdAt: '2020-01-01T00:00:00Z' },
  { id: 'r4', name: 'STUDENT', description: 'Student access', isSystemRole: true, permissions: ['student.grades.read', 'cms.content.read'], createdAt: '2020-01-01T00:00:00Z' },
];

export const mockPermissions = [
  { id: 'perm1', key: 'student.read', category: 'Students', description: 'View student records' },
  { id: 'perm2', key: 'student.create', category: 'Students', description: 'Create new students' },
  { id: 'perm3', key: 'student.delete', category: 'Students', description: 'Delete student records' },
  { id: 'perm4', key: 'teacher.read', category: 'Teachers', description: 'View teacher records' },
  { id: 'perm5', key: 'teacher.create', category: 'Teachers', description: 'Create new teachers' },
  { id: 'perm6', key: 'payment.read', category: 'Payments', description: 'View payments' },
  { id: 'perm7', key: 'payment.create', category: 'Payments', description: 'Create payments' },
  { id: 'perm8', key: 'cms.content.read', category: 'CMS', description: 'View CMS content' },
  { id: 'perm9', key: 'cms.content.create', category: 'CMS', description: 'Create CMS content' },
  { id: 'perm10', key: 'cms.content.approve', category: 'CMS', description: 'Approve CMS content' },
];

export const mockPermissionsGrouped = {
  Students: [
    { id: 'perm1', key: 'student.read', category: 'Students', description: 'View student records' },
    { id: 'perm2', key: 'student.create', category: 'Students', description: 'Create new students' },
    { id: 'perm3', key: 'student.delete', category: 'Students', description: 'Delete student records' },
  ],
  Teachers: [
    { id: 'perm4', key: 'teacher.read', category: 'Teachers', description: 'View teacher records' },
    { id: 'perm5', key: 'teacher.create', category: 'Teachers', description: 'Create new teachers' },
  ],
  Payments: [
    { id: 'perm6', key: 'payment.read', category: 'Payments', description: 'View payments' },
    { id: 'perm7', key: 'payment.create', category: 'Payments', description: 'Create payments' },
  ],
  CMS: [
    { id: 'perm8', key: 'cms.content.read', category: 'CMS', description: 'View CMS content' },
    { id: 'perm9', key: 'cms.content.create', category: 'CMS', description: 'Create CMS content' },
    { id: 'perm10', key: 'cms.content.approve', category: 'CMS', description: 'Approve CMS content' },
  ],
};

export const mockTimetablePeriods = [
  { id: 'tp1', name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { id: 'tp2', name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { id: 'tp3', name: 'Break', startTime: '09:30', endTime: '10:00', isBreak: true },
  { id: 'tp4', name: 'Period 3', startTime: '10:00', endTime: '10:45', isBreak: false },
  { id: 'tp5', name: 'Period 4', startTime: '10:45', endTime: '11:30', isBreak: false },
  { id: 'tp6', name: 'Lunch', startTime: '11:30', endTime: '12:15', isBreak: true },
  { id: 'tp7', name: 'Period 5', startTime: '12:15', endTime: '13:00', isBreak: false },
  { id: 'tp8', name: 'Period 6', startTime: '13:00', endTime: '13:45', isBreak: false },
];

export const mockTimetableEntries = [
  { id: 'te1', classId: 'c2', dayOfWeek: 'MONDAY', periodId: 'tp1', subjectId: 'sub1', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Mr. John Okafor', room: 'Room 101' },
  { id: 'te2', classId: 'c2', dayOfWeek: 'MONDAY', periodId: 'tp2', subjectId: 'sub2', subjectName: 'English', teacherId: 't2', teacherName: 'Mrs. Sarah Nwosu', room: 'Room 102' },
  { id: 'te3', classId: 'c2', dayOfWeek: 'MONDAY', periodId: 'tp4', subjectId: 'sub3', subjectName: 'Science', teacherId: 't3', teacherName: 'Mrs. Mary Thompson', room: 'Lab 1' },
  { id: 'te4', classId: 'c2', dayOfWeek: 'TUESDAY', periodId: 'tp1', subjectId: 'sub4', subjectName: 'Social Studies', teacherId: 't4', teacherName: 'Mr. Emeka Uzoma', room: 'Room 103' },
  { id: 'te5', classId: 'c2', dayOfWeek: 'TUESDAY', periodId: 'tp2', subjectId: 'sub1', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Mr. John Okafor', room: 'Room 101' },
];

export const mockAnalytics = {
  academic: {
    averageScore: 76.4,
    passRate: 88,
    topPerformers: 12,
    needsImprovement: 8,
    gradesDistribution: [
      { grade: 'A', count: 15 },
      { grade: 'B', count: 35 },
      { grade: 'C', count: 28 },
      { grade: 'D', count: 12 },
      { grade: 'F', count: 5 },
    ],
  },
  finance: {
    totalCollected: 4500000,
    totalExpected: 5350000,
    collectionRate: 84,
    overdueAmount: 850000,
    monthlyRevenue: [
      { month: 'Jan', amount: 350000 },
      { month: 'Feb', amount: 420000 },
      { month: 'Mar', amount: 380000 },
      { month: 'Apr', amount: 450000 },
      { month: 'May', amount: 500000 },
      { month: 'Jun', amount: 470000 },
    ],
  },
  attendance: {
    averageAttendance: 91,
    presentCount: 108,
    absentCount: 10,
    lateCount: 7,
    weeklyTrend: [
      { day: 'Mon', rate: 94 },
      { day: 'Tue', rate: 92 },
      { day: 'Wed', rate: 90 },
      { day: 'Thu', rate: 89 },
      { day: 'Fri', rate: 88 },
    ],
  },
};

export const mockDeletionRequests = [
  { id: 'd1', schoolName: 'Greenfield Academy', schoolId: 'sch1', requestedBy: 'Chief Adebayo', reason: 'School merging with another institution', status: 'PENDING', createdAt: '2025-06-01T00:00:00Z' },
  { id: 'd2', schoolName: 'Test School', schoolId: 'sch3', requestedBy: 'Test Admin', reason: 'No longer in operation', status: 'APPROVED', createdAt: '2025-05-15T00:00:00Z' },
];

export const mockAttendanceSummary = {
  totalDays: 47,
  presentDays: 42,
  absentDays: 2,
  lateDays: 2,
  excusedDays: 1,
  attendancePercentage: 89.4,
};

export const mockSearchResults = [
  { type: 'STUDENT', id: 's1', title: 'Ade Johnson', subtitle: 'JSS 2 - GFA/2023/001' },
  { type: 'STUDENT', id: 's2', title: 'Chioma Obi', subtitle: 'SS 1 - GFA/2022/001' },
  { type: 'TEACHER', id: 't1', title: 'Mr. John Okafor', subtitle: 'Mathematics' },
  { type: 'BOOK', id: '1', title: 'Introduction to Algebra', subtitle: 'Dr. K. O. Adeyemi' },
];

export const mockParents = [
  { id: 'p1', fullName: 'Mr. Robert Johnson', email: 'robert.j@test.com', phone: '08012345672', relationship: 'FATHER', students: [{ studentId: 's1', studentName: 'Ade Johnson', isPrimary: true }] },
  { id: 'p2', fullName: 'Mrs. Chioma Williams', email: 'chioma.w@test.com', phone: '08012345674', relationship: 'MOTHER', students: [{ studentId: 's2', studentName: 'Chioma Obi', isPrimary: true }] },
];

export const mockSettings = {
  schoolName: 'Greenfield Academy',
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE NUMBERS_REDACTED]',
  address: '[STREET_ADDRESS_REDACTED], Lagos',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
  logoUrl: '',
  faviconUrl: '',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  gradingScale: [
    { min: 70, max: 100, grade: 'A', remarks: 'Excellent' },
    { min: 60, max: 69, grade: 'B', remarks: 'Good' },
    { min: 50, max: 59, grade: 'C', remarks: 'Fair' },
    { min: 40, max: 49, grade: 'D', remarks: 'Pass' },
    { min: 0, max: 39, grade: 'F', remarks: 'Fail' },
  ],
};
