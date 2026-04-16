// my-frontend/src/lib/constants.ts

export const PROGRAM_OPTIONS = [
    'Computer Science', 'Information Technology', 'Electronics & Communication',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics', 'Management',
    'Artificial Intelligence', 'Data Science', 'Cyber Security', 'Other'
].map(v => ({ value: v, label: v }));

export const DISCIPLINE_OPTIONS = [
    'B.Tech', 'B.E.', 'M.Tech', 'M.E.', 'Ph.D', 'MBA', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'Other'
].map(v => ({ value: v, label: v }));

export const INDUSTRY_OPTIONS = [
    'Software & IT', 'Fintech', 'Healthcare', 'Education', 'Manufacturing',
    'E-commerce', 'Consulting', 'Energy', 'Automotive', 'Aerospace',
    'Telecommunications', 'Research', 'Media & Entertainment', 'Other'
].map(v => ({ value: v, label: v }));

export const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: currentYear - 1960 + 11 }, (_, i) => ({
    value: currentYear + 10 - i,
    label: (currentYear + 10 - i).toString()
}));

