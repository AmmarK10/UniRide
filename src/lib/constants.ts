// Centralized list of Pakistani universities
// Update this file to change university options across the entire app

export const UNIVERSITIES = [
    { value: 'FAST', label: 'FAST NUCES' },
    { value: 'NUST', label: 'NUST' },
    { value: 'IBA', label: 'IBA Karachi' },
    { value: 'SZABIST', label: 'SZABIST' },
    { value: 'AKU', label: 'Aga Khan University (AKU)' },
    { value: 'MAJU', label: 'Mohammad Ali Jinnah University (MAJU)' },
    { value: 'SSUET', label: 'Sir Syed University (SSUET)' },
    { value: 'NED', label: 'NED University' },
    { value: 'JMDC', label: 'Jinnah Medical & Dental College (JMDC)' },
    { value: 'DOW', label: 'Dow University (DOW)' },
    { value: 'LUMS', label: 'LUMS' },
    { value: 'UET', label: 'UET Lahore' },
] as const

export type UniversityValue = typeof UNIVERSITIES[number]['value']

// Helper function to get label from value
export function getUniversityLabel(value: string): string {
    const university = UNIVERSITIES.find(u => u.value === value)
    return university?.label || value
}
