/* Demo data for the recruiter workspace.
 * TODO(recruiter): replace with real API endpoints once the jobs/applications
 * backend modules land (candidate side is being built by a teammate).
 * Applicant detail fields (skills/experience/education) are placeholders -
 * once the candidate profile pages ship, clicking a name will load the real
 * profile via GET /api/applicants/:id. */

export type JobStatus = 'Active' | 'Paused' | 'Closed';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  salary: string;
  status: JobStatus;
  applicants: number;
  views: number;
  postedDaysAgo: number;
  postedOn: string;
  statusChangedOn?: string;
  description?: string;
  requirements?: string[];
}

export type ApplicantStatus =
  | 'New'
  | 'Shortlisted'
  | 'Interview'
  | 'Hired'
  | 'Rejected';

/** Human-readable meaning of each pipeline stage (used in tooltips/legend).
 * Workflow: New -> Shortlisted -> Interview -> Hired or Rejected. */
export const STATUS_MEANINGS: Record<ApplicantStatus, string> = {
  New: 'Applied and waiting for the resume screen.',
  Shortlisted: 'Resume screen passed, waiting for an interview call.',
  Interview: 'Interview scheduled or in progress, next: hire or reject.',
  Hired: 'Offer accepted, now part of your team.',
  Rejected: 'Not moving forward for this role.',
};

export interface Applicant {
  id: string;
  name: string;
  job: string;
  match: number;
  status: ApplicantStatus;
  appliedDaysAgo: number;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Array<{ role: string; company: string; period: string }>;
  education: string;
  scheduledDate?: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  unread: number;
  messages: Array<{ from: 'them' | 'me'; text: string; time: string }>;
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  view: 'applicants' | 'messages' | 'jobs';
}

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Kathmandu / Remote',
    type: 'Full-time',
    salary: 'Rs 120k–180k',
    status: 'Active',
    applicants: 48,
    views: 1240,
    postedDaysAgo: 6,
    postedOn: 'Sep 9, 2026',
    description:
      'Own our design system and ship fast, accessible interfaces with a small senior team.',
    requirements: [
      '5+ years with React & TypeScript',
      'Design-system experience',
      'Accessibility (WCAG 2.1)',
      'A real testing culture',
    ],
  },
  {
    id: 'job-2',
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: 'Rs 80k–120k',
    status: 'Active',
    applicants: 31,
    views: 860,
    postedDaysAgo: 12,
    postedOn: 'Sep 3, 2026',
    description:
      'Design end-to-end flows for our hiring products and raise the visual bar everywhere.',
    requirements: [
      'Strong Figma + prototyping',
      'Portfolio with shipped work',
      'Design-system thinking',
    ],
  },
  {
    id: 'job-3',
    title: 'Data Analyst (Intern)',
    department: 'Data',
    location: 'Lalitpur',
    type: 'Internship',
    salary: 'Rs 25k stipend',
    status: 'Paused',
    applicants: 17,
    views: 402,
    postedDaysAgo: 21,
    postedOn: 'Aug 25, 2026',
    statusChangedOn: 'Sep 10, 2026',
  },
  {
    id: 'job-4',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Contract',
    salary: 'Rs 150k',
    status: 'Closed',
    applicants: 26,
    views: 730,
    postedDaysAgo: 40,
    postedOn: 'Aug 6, 2026',
    statusChangedOn: 'Sep 1, 2026',
  },
];

export const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: 'ap-1',
    name: 'Asha Shrestha',
    job: 'Senior Frontend Engineer',
    match: 94,
    status: 'Interview',
    scheduledDate: 'Thu, Sep 17, 2026',
    appliedDaysAgo: 1,
    email: 'asha.shrestha@gmail.com',
    phone: '+977 9841 220 114',
    location: 'Kathmandu',
    summary:
      'Frontend engineer with 5 years building React design systems and a passion for accessible UI.',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Testing Library'],
    experience: [
      { role: 'Frontend Engineer', company: 'Fintech Nepal', period: '2022 – now' },
      { role: 'Jr. UI Developer', company: 'Kathmandu Labs', period: '2019 – 2022' },
    ],
    education: 'BSc CSIT, Tribhuvan University',
  },
  {
    id: 'ap-2',
    name: 'Bibek Thapa',
    job: 'Senior Frontend Engineer',
    match: 88,
    status: 'New',
    appliedDaysAgo: 1,
    email: 'bibek.thapa@outlook.com',
    phone: '+977 9803 555 210',
    location: 'Pokhara',
    summary:
      'Full-stack leaning frontend dev; shipped two B2B dashboards end-to-end.',
    skills: ['React', 'Redux', 'Node.js', 'GraphQL'],
    experience: [
      { role: 'Software Engineer', company: 'Himalaya Soft', period: '2021 – now' },
    ],
    education: 'BE Computer, Pashchimanchal Campus',
  },
  {
    id: 'ap-3',
    name: 'Prakriti Karki',
    job: 'UI/UX Designer',
    match: 91,
    status: 'Shortlisted',
    appliedDaysAgo: 2,
    email: 'prakriti.designs@gmail.com',
    phone: '+977 9860 118 774',
    location: 'Lalitpur',
    summary:
      'Product designer with strong case studies in fintech and health-tech.',
    skills: ['Figma', 'Prototyping', 'Design systems', 'User research'],
    experience: [
      { role: 'Product Designer', company: 'Sajha Health', period: '2022 – now' },
      { role: 'UI Designer', company: 'Freelance', period: '2020 – 2022' },
    ],
    education: 'BDes, Kathmandu University',
  },
  {
    id: 'ap-4',
    name: 'Rohan Maharjan',
    job: 'UI/UX Designer',
    match: 76,
    status: 'New',
    appliedDaysAgo: 3,
    email: 'rohan.m@yahoo.com',
    phone: '+977 9818 402 331',
    location: 'Bhaktapur',
    summary: 'Early-career designer with a sharp eye for motion and micro-UX.',
    skills: ['Figma', 'Illustration', 'After Effects'],
    experience: [
      { role: 'Design Intern', company: 'Creative Hub', period: '2024' },
    ],
    education: 'BSc IT, Islington College',
  },
  {
    id: 'ap-5',
    name: 'Sneha Gurung',
    job: 'Data Analyst (Intern)',
    match: 82,
    status: 'Hired',
    appliedDaysAgo: 9,
    email: 'sneha.gurung@gmail.com',
    phone: '+977 9845 909 120',
    location: 'Kathmandu',
    summary: 'Analytics intern turned hire - SQL, dashboards and clear storytelling.',
    skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    experience: [
      { role: 'Data Intern', company: 'JobDev Labs', period: '2025' },
    ],
    education: 'BBA, Kathmandu University',
  },
  {
    id: 'ap-6',
    name: 'Kiran Adhikari',
    job: 'Senior Frontend Engineer',
    match: 64,
    status: 'Rejected',
    appliedDaysAgo: 4,
    email: 'kiran.adh@gmail.com',
    phone: '+977 9851 774 002',
    location: 'Butwal',
    summary: 'Mostly jQuery background; not the React depth this role needs.',
    skills: ['jQuery', 'PHP', 'WordPress'],
    experience: [
      { role: 'Web Developer', company: 'Butwal Web Co.', period: '2020 – now' },
    ],
    education: 'BCA, Lumbini Campus',
  },
  {
    id: 'ap-7',
    name: 'Maya Tamang',
    job: 'DevOps Engineer',
    match: 85,
    status: 'Interview',
    scheduledDate: 'Fri, Sep 18, 2026',
    appliedDaysAgo: 15,
    email: 'maya.tamang@proton.me',
    phone: '+977 9822 310 458',
    location: 'Remote',
    summary: 'CI/CD specialist; Kubernetes in production for 3 years.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker'],
    experience: [
      { role: 'DevOps Engineer', company: 'Cloud Everest', period: '2021 – now' },
    ],
    education: 'BE Electronics, IOE Pulchowk',
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'cv-1',
    name: 'Asha Shrestha',
    role: 'Applicant · Senior Frontend Engineer',
    unread: 2,
    messages: [
      { from: 'them', text: 'Hi! Thanks for shortlisting me. Is the interview still on Thursday?', time: '09:12' },
      { from: 'me', text: 'Yes - 2pm, video call. A calendar invite is on its way.', time: '09:20' },
      { from: 'them', text: 'Perfect, received it. Should I prepare a portfolio walkthrough?', time: '09:24' },
      { from: 'them', text: 'Also, is the role fully remote after onboarding?', time: '09:25' },
    ],
  },
  {
    id: 'cv-2',
    name: 'Prakriti Karki',
    role: 'Applicant · UI/UX Designer',
    unread: 0,
    messages: [
      { from: 'me', text: 'Loved your case studies - could you share one more sample?', time: 'Mon' },
      { from: 'them', text: 'Of course! Sending my fintech redesign deck today.', time: 'Mon' },
    ],
  },
  {
    id: 'cv-3',
    name: 'HR Ops Bot',
    role: 'System',
    unread: 1,
    messages: [
      { from: 'them', text: '3 new applicants matched “Senior Frontend Engineer” above 85% this week.', time: 'Tue' },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'nt-1',
    text: 'Bibek Thapa applied to Senior Frontend Engineer',
    time: '2h ago',
    read: false,
    view: 'applicants',
  },
  {
    id: 'nt-2',
    text: 'Asha Shrestha sent you 2 new messages',
    time: '3h ago',
    read: false,
    view: 'messages',
  },
  {
    id: 'nt-3',
    text: 'Your job “UI/UX Designer” passed 800 views',
    time: '1d ago',
    read: false,
    view: 'jobs',
  },
  {
    id: 'nt-4',
    text: 'Interview reminder: Maya Tamang, Thursday 2:00 PM',
    time: '1d ago',
    read: true,
    view: 'applicants',
  },
];

export const WEEKLY = [
  { week: 'W1', applications: 12, interviews: 3 },
  { week: 'W2', applications: 18, interviews: 5 },
  { week: 'W3', applications: 15, interviews: 4 },
  { week: 'W4', applications: 24, interviews: 8 },
  { week: 'W5', applications: 21, interviews: 7 },
  { week: 'W6', applications: 30, interviews: 10 },
  { week: 'W7', applications: 26, interviews: 9 },
  { week: 'W8', applications: 34, interviews: 12 },
];

export const SOURCES = [
  { label: 'JobDev search', value: 46, colorClass: 'bg-primary' },
  { label: 'Referrals', value: 27, colorClass: 'bg-info' },
  { label: 'Social', value: 17, colorClass: 'bg-warning' },
  { label: 'Other', value: 10, colorClass: 'bg-success' },
];