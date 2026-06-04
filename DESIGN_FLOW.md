# SchoolSaaS - Complete UI/UX Flow & Design Specification

> **Mock / Dev Mode Document**  
> This application includes a full mock-data layer (`sms_frontend/src/lib/mockData.ts`) and dev-login buttons so the entire product can be demoed without a running backend. Before production, remove the `USE_MOCK_FALLBACK` flag in `sms_frontend/src/lib/api.ts` and the `mockLogin` helpers in `sms_frontend/src/lib/auth.tsx`.

---

## 1. Design System

### Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366F1` (Indigo-500) | Buttons, active nav, links |
| Primary Dark | `#4F46E5` (Indigo-600) | Hover states |
| Success | `#10B981` (Emerald-500) | Paid, present, approved |
| Warning | `#F59E0B` (Amber-500) | Pending, late, drafts |
| Danger | `#EF4444` (Red-500) | Failed, absent, rejected |
| Background | `#F8FAFC` (Slate-50) | Page background |
| Surface | `#FFFFFF` | Cards, modals |
| Text Primary | `#0F172A` (Slate-900) | Headings |
| Text Secondary | `#64748B` (Slate-500) | Body, captions |

### Typography
- **Headings**: Inter, 700, tracking-tight
- **Body**: Inter, 400, leading-relaxed
- **Mono** (for data tables): JetBrains Mono, 400

### Spacing Scale (Tailwind)
- Card padding: `p-6`
- Section gap: `space-y-6`
- Grid gap: `gap-6`
- Border radius: `rounded-xl` (cards), `rounded-full` (pills)

### Shadows
- Card: `shadow-lg`
- Modal: `shadow-xl`
- Floating action: `shadow-2xl`

---

## 2. User Personas & Role Matrix

```
+------------------------------------------------------------------+
|  ROLE              |  SCOPE            |  PRIMARY NAV ITEMS      |
+--------------------+-------------------+-------------------------+
|  Platform Admin    |  All Schools      |  Schools, Deletion      |
|                    |                   |  Requests, Analytics    |
+--------------------+-------------------+-------------------------+
|  School Admin      |  One School       |  Dashboard, Students,   |
|                    |                   |  Teachers, Payments,    |
|                    |                   |  CMS, Roles, Reports    |
+--------------------+-------------------+-------------------------+
|  Teacher           |  Assigned Classes |  Dashboard, My Classes, |
|                    |                   |  Gradebook, Attendance, |
|                    |                   |  CMS, Quizzes           |
+--------------------+-------------------+-------------------------+
|  Student           |  Self             |  Dashboard, Results,    |
|                    |                   |  Fees, Quizzes, Library |
+--------------------+-------------------+-------------------------+
|  Parent            |  Linked Students  |  Results, Fees, Messages|
+--------------------+-------------------+-------------------------+
```

---

## 3. Authentication Flow

```
  +-----------------+        +------------------+
  |   Landing Page  |------->|   Login Screen   |
  +-----------------+        +------------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
            [Real Backend Login]              [Demo Login Buttons]
                    |                                   |
            +-------v-------+               +-----------v-----------+
            | JWT Exchange  |               | Populate localStorage |
            +---------------+               | with mock user +     |
                    |                       | school context        |
                    |                       +-----------------------+
                    |                                   |
                    +-----------------+-----------------+
                                      |
                              +-------v--------+
                              | Dashboard Gate |
                              +----------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
            [Platform Admin]                    [School User]
                    |                                   |
            +-------v-------+                   +-------v-------+
            |  /schools     |                   | /dashboard    |
            |  /analytics   |                   | (role-based)  |
            +---------------+                   +---------------+
```

### Login Screen Layout
- **Background**: Gradient mesh (primary-50 to purple-50)
- **Card**: Centered, max-w-md, glass effect, rounded-2xl
- **Fields**: Email, Password (with visibility toggle)
- **Actions**: Sign In, Forgot Password, Sign Up link
- **Dev Box**: "Demo Login (No Backend)" section with 4 role buttons:
  - Platform Admin, School Admin, Teacher, Student

---

## 4. Global Navigation (Sidebar)

```
+----------------------------------------------------------+
|  [Logo] SchoolSaaS                     [<] collapse      |
+----------------------------------------------------------+
|                                                          |
|  [icon] Dashboard          <- active = primary-50 bg     |
|  [icon] Schools            (platform admin only)         |
|  [icon] Students                                         |
|  [icon] Teachers                                         |
|  [icon] CMS                                              |
|  [icon] Calendar                                         |
|  [icon] Timetable                                        |
|  [icon] Quizzes                                          |
|  [icon] Library                                          |
|  [icon] ID Cards                                         |
|  [icon] Report Cards                                     |
|  [icon] Admissions                                       |
|  [icon] Payments                                         |
|  [icon] Analytics                                        |
|  [icon] Gamification                                     |
|  [icon] Messages                                         |
|  [icon] Roles                                            |
|  [icon] Deletion Requests  (platform admin only)         |
|  [icon] Settings                                         |
|                                                          |
+----------------------------------------------------------+
|  [AV] User Name                                          |
|       user@email.com          [logout]                   |
+----------------------------------------------------------+
```

**Role-based filtering**:
- Student sees: Dashboard, My Results, My Fees, Quizzes, Library, CMS, Messages, Settings
- Teacher sees: Dashboard, My Classes, Students, CMS, Quizzes, Timetable, Messages, Settings

---

## 5. Screen-by-Screen Wireframes

### 5.1 Dashboard

#### Admin Dashboard (`/dashboard`)
```
+----------------------------------------------------------+
| Welcome back, Name!                           [date]     |
+----------------------------------------------------------+
| [Card: 125 Students]  [Card: 16 Teachers]                |
| [Card: 12 Classes]    [Card: N4.5M Revenue]              |
+----------------------------------------------------------+
| [Quick Overview Card]          | [Recent Activity Card]  |
|  - 4 Pending Approvals         |  - New student enrolled |
|  - N4500K Total Revenue        |  - Fee payment received |
|                                |  - Quiz published       |
+----------------------------------------------------------+
| [Quick Actions Card]           | [School Info Card]      |
|  Add Student / Add Teacher     |  Greenfield Academy     |
|  Create Content / View Payments|  Role: Admin            |
+----------------------------------------------------------+
```

#### Student Dashboard (`/dashboard`)
```
+----------------------------------------------------------+
| Welcome, Ade Johnson!                         [date]     |
+----------------------------------------------------------+
| [Green Card: 89.4% Attendance] | [Blue: 5 Subjects]     |
| [Purple Card: N45K Balance]                             |
+----------------------------------------------------------+
| [My Subjects & Grades]         | [Attendance Summary]   |
|  Mathematics    B   73/100     |  Present  42 days      |
|  English        A   82/100     |  Absent    2 days      |
|  Science        C   65/100     |  Late      2 days      |
|                                |  Excused   1 day       |
+----------------------------------------------------------+
| [Upcoming Assignments]                                  |
|  Algebra Homework   Jun 20   PENDING                   |
|  Essay Writing      Jun 22   PENDING                   |
+----------------------------------------------------------+
```

#### Teacher Dashboard (`/dashboard`)
```
+----------------------------------------------------------+
| Welcome, Mr. John Okafor!                     [date]     |
+----------------------------------------------------------+
| [Blue: 3 Classes] [Green: 93 Students] [Orange: 2 Pending|
+----------------------------------------------------------+
| [My Classes & Subjects]        | [Quick Actions]        |
|  JSS 2   Mathematics   35 sts  |  Enter Grades          |
|  SS 1    Mathematics   30 sts  |  Mark Attendance       |
|  JSS 1   Basic Tech    28 sts  |  Create Content        |
|                                |  View Students         |
+----------------------------------------------------------+
| [Recent Content Submissions]                            |
|  Algebra Notes Ch3      PENDING_APPROVAL                |
|  Geometry Worksheet     APPROVED                        |
+----------------------------------------------------------+
```

### 5.2 Students (`/students`)
```
+----------------------------------------------------------+
| Students                               [Bulk] [+ Add]    |
+----------------------------------------------------------+
| [Search...]                                              |
+----------------------------------------------------------+
| Name          | Email | Class | Parent Phone | Status   |
| Ade Johnson   | ...   | JSS 2 | 080...       | ACTIVE   |
| Chioma Obi    | ...   | SS 1  | 080...       | ACTIVE   |
+----------------------------------------------------------+
| Pagination: < 1 / 1 >                                    |
+----------------------------------------------------------+
```

### 5.3 Teachers (`/teachers`)
```
+----------------------------------------------------------+
| Teachers                                        [+ Add]  |
+----------------------------------------------------------+
| [Search...]                                              |
+----------------------------------------------------------+
| Name          | Email | Specialization | Phone | Status |
| Mr. John O... | ...   | Mathematics    | 080.. | ACTIVE |
+----------------------------------------------------------+
```

### 5.4 Payments (`/payments`)
```
+----------------------------------------------------------+
| Payments                                                 |
+----------------------------------------------------------+
| [Green: N135K Paid] [Yellow: N45K Pending] [Blue: 5 Tx] |
+----------------------------------------------------------+
| Transaction History                                      |
| N45,000  Paid    Jun 15   PAY-001-ABC                   |
| N45,000  Pending Jun 16   PAY-002-DEF                   |
+----------------------------------------------------------+
```

### 5.5 Quizzes (`/quizzes`)
```
+----------------------------------------------------------+
| Quizzes                                         [+ Create]|
+----------------------------------------------------------+
| [Card] Mathematics - Algebra Basics   30min  PUBLISHED   |
| [Card] English - Grammar Test         20min  PUBLISHED   |
| [Card] Science - Basic Physics        25min  DRAFT       |
+----------------------------------------------------------+
```

### 5.6 Library (`/library`)
```
+----------------------------------------------------------+
| Library                                         [+ Add]  |
+----------------------------------------------------------+
| [Search...]                                              |
+----------------------------------------------------------+
| [Book Card] Introduction to Algebra   PDF   5 copies    |
| [Book Card] English Grammar           PDF   3 copies    |
+----------------------------------------------------------+
```

### 5.7 Messages (`/messages`)
```
+----------------------------------------------------------+
| Messages                                                 |
+----------------------------------------------------------+
| Conversations                | Chat Area                |
| Mr. John Okafor       2      | -----------------------  |
| Parent Group          0      | You: He is doing well..  |
| Platform Admin        0      | Mr. John: Please submit  |
+----------------------------------------------------------+
```

### 5.8 Admissions (`/admissions`)
```
+----------------------------------------------------------+
| Admissions                                              |
+----------------------------------------------------------+
| APP-2026-001  Michael Johnson  JSS 1   PENDING          |
| APP-2026-002  Amara Williams   JSS 2   UNDER_REVIEW     |
| APP-2026-003  Emmanuel Adeleke JSS 1   ACCEPTED         |
+----------------------------------------------------------+
```

### 5.9 Report Cards (`/report-cards`)
```
+----------------------------------------------------------+
| Report Cards                                            |
+----------------------------------------------------------+
| Ade Johnson   First Term 2025/2026   B    PUBLISHED     |
| Chioma Obi    First Term 2025/2026   A    PUBLISHED     |
+----------------------------------------------------------+
```

### 5.10 Timetable (`/timetable`)
```
+----------------------------------------------------------+
| Timetable                                               |
+----------------------------------------------------------+
| Period | Mon       | Tue       | Wed | Thu | Fri       |
| 08:00  | Math      | Soc St    | ... | ... | ...       |
| 08:45  | English   | Math      | ... | ... | ...       |
| 09:30  | BREAK     | BREAK     | ... | ... | ...       |
+----------------------------------------------------------+
```

### 5.11 Analytics (`/analytics`)
```
+----------------------------------------------------------+
| Analytics Dashboard                                     |
+----------------------------------------------------------+
| [Students] [Teachers] [Revenue] [Content]               |
+----------------------------------------------------------+
| [Revenue Trend Chart - Area]  [Enrollment Trend - Line] |
+----------------------------------------------------------+
| [Gender Distribution - Pie]   [Students per Class - Bar]|
+----------------------------------------------------------+
```

### 5.12 Teacher Gradebook (`/teacher/gradebook`)
```
+----------------------------------------------------------+
| Gradebook                                    [Save]     |
+----------------------------------------------------------+
| Subject: Mathematics  Avg: 76.4%  Top: 95%   7 Students |
+----------------------------------------------------------+
| Student          | Score | Max | Grade | Remarks        |
| Ade Johnson      |  73   | 100 |   B   | Good           |
| Chioma Obi       |  88   | 100 |   A   | Excellent      |
+----------------------------------------------------------+
```

### 5.13 Teacher Attendance (`/teacher/attendance`)
```
+----------------------------------------------------------+
| Mark Attendance                              [Save]     |
+----------------------------------------------------------+
| Date: [2025-06-02]                                      |
| Present: 42  Absent: 2  Late: 2  Excused: 1             |
+----------------------------------------------------------+
| Ade Johnson          [PRESENT] [ABSENT] [LATE] [EXCUSED]|
| Chioma Obi           [PRESENT] [ABSENT] [LATE] [EXCUSED]|
+----------------------------------------------------------+
```

---

## 6. Entity Relationship (Mock Data)

```
+-----------+       +-----------+       +-----------+
|   School  |<----->|   User    |<----->|   Role    |
| Greenfield|       | Platform  |       | ADMIN     |
| Sunrise   |       | School    |       | TEACHER   |
+-----------+       | Student   |       | STUDENT   |
      |             +-----------+       +-----------+
      |                   |
      v                   v
+-----------+       +-----------+
|  Student  |<----->|  Teacher  |
| Ade J.    |       | John O.   |
| Chioma O. |       | Sarah N.  |
+-----------+       +-----------+
      |                   |
      v                   v
+-----------+       +-----------+
|  Grade    |       |  Class    |
| Math: 73  |       | JSS 2     |
| Eng: 82   |       | SS 1      |
+-----------+       +-----------+
      |
      v
+-----------+
|  Payment  |
| N45K      |
| N50K      |
+-----------+
```

---

## 7. Component Inventory

### Reusable Components (`src/components/ui/`)
| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | variant, size, isLoading, onClick | Every action |
| `Card` | hover? | Stats, lists, forms |
| `Input` | label, type, error, helperText | Forms |
| `Modal` | isOpen, onClose, title, size | CRUD confirmations |
| `Badge` | variant | Status indicators |
| `DataTable` | columns, data, keyField, pagination | Students, Teachers, etc. |

### Layout Components
| Component | Purpose |
|-----------|---------|
| `Sidebar` | Role-based nav, collapsible |
| `Header` | Breadcrumbs, profile, notifications |
| `OfflineIndicator` | Badge + sync UI when offline |

### Feature Components
| Component | Purpose |
|-----------|---------|
| `TiptapEditor` | Rich text for CMS |
| `AiTutorWidget` | Floating AI help widget |
| `OnboardingTour` | Step-by-step guide |

---

## 8. State & API Architecture

```
+-------------------------------------------------------+
|  Page (React Component)                               |
|  - useState for local UI state                        |
|  - useEffect -> api call                              |
+-------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------+
|  api.ts (Axios instance)                              |
|  - Interceptor: attach Bearer token                   |
|  - Interceptor: 401 -> refresh JWT -> retry           |
|  - withMockFallback: if call fails, return mock data  |
+-------------------------------------------------------+
                          |
          +---------------+---------------+
          |                               |
          v                               v
+---------------------+     +---------------------------+
|  Real Backend       |     |  Mock Data Layer          |
|  (Spring Boot)      |     |  mockData.ts              |
|  localhost:8080     |     |  Static objects for all   |
+---------------------+     |  entities                 |
                            +---------------------------+
```

**Toggle mock mode**:
```ts
// sms_frontend/src/lib/api.ts
const USE_MOCK_FALLBACK = true; // <-- set false for production
```

---

## 9. Demo Credentials (Backend Seeder)

When running the Spring Boot backend with `dev` profile, the `DataSeeder` creates:

| Email | Role | Password |
|-------|------|----------|
| `admin@schoolsaas.com` | Platform Admin | `password123` |
| `superadmin@greenfield.edu` | Greenfield Super Admin | `password123` |
| `admin@greenfield.edu` | Greenfield Admin | `password123` |
| `teacher@greenfield.edu` | Greenfield Teacher | `password123` |
| `student@greenfield.edu` | Greenfield Student | `password123` |
| `superadmin@sunrise.edu` | Sunrise Super Admin | `password123` |

---

## 10. Delete-Before-Production Checklist

- [ ] Set `USE_MOCK_FALLBACK = false` in `sms_frontend/src/lib/api.ts`
- [ ] Remove `mockLogin` and demo buttons from `sms_frontend/src/lib/auth.tsx` & login page
- [ ] Remove `raw*Api` helpers from `api.ts` (they exist only for pages with old endpoint patterns)
- [ ] Delete `sms_frontend/src/lib/mockData.ts` if desired, or keep for unit tests
- [ ] Ensure Spring Boot `application.yml` does NOT use `dev` profile in production
- [ ] Remove `@Profile("dev")` from `DataSeeder.java` or ensure prod DB is already migrated
- [ ] Set strong `JWT_SECRET` and `PAYSTACK_SECRET_KEY` env vars
