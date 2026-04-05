// my-frontend/src/lib/constants.ts

export const PROGRAM_OPTIONS = [
    'B.Tech / B.E.', 'M.Tech / M.E.', 'Ph.D', 'MBA', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'Other'
].map(v => ({ value: v, label: v }));

export const DISCIPLINE_OPTIONS = [
    'Computer Science', 'Information Technology', 'Electronics & Communication',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics', 'Management',
    'Artificial Intelligence', 'Data Science', 'Cyber Security', 'Other'
].map(v => ({ value: v, label: v }));

export const INDUSTRY_OPTIONS = [
    'Software & IT', 'Fintech', 'Healthcare', 'Education', 'Manufacturing',
    'E-commerce', 'Consulting', 'Energy', 'Automotive', 'Aerospace',
    'Telecommunications', 'Research', 'Media & Entertainment', 'Other'
].map(v => ({ value: v, label: v }));
