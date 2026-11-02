/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Official GBP Review Team Configuration & Wing Assignment Helpers
 */

export interface ReviewTeamMember {
  id: string;
  name: string;
  displayName: string;
  wingName: string;
  wingKeywords: string[];
  phone: string;
  cleanPhone: string;
  role: string;
}

/**
 * Official Review Team Members with direct wings and contact details
 */
export const OFFICIAL_REVIEW_TEAM: ReviewTeamMember[] = [
  {
    id: 'm_abhishek',
    name: 'Abhishek Ji',
    displayName: 'Abhishek Ji',
    wingName: 'PCP Piprali Road',
    wingKeywords: ['piprali'],
    phone: '+91 7296989764',
    cleanPhone: '917296989764',
    role: 'Pcp Piprali Road Reviews - 2nd',
  },
  {
    id: 'm_aditya',
    name: 'Aditya Mehrotra',
    displayName: 'Aditya Mehrotra',
    wingName: 'Prince Hospital',
    wingKeywords: ['hospital'],
    phone: '+91 7230089108',
    cleanPhone: '917230089108',
    role: 'Prince Hospital Reviews',
  },
  {
    id: 'm_floreto',
    name: 'Floreto reviews PEH',
    displayName: 'Floreto reviews PEH',
    wingName: 'Floreto World School, Sikar',
    wingKeywords: ['floreto'],
    phone: '+91 9610815222',
    cleanPhone: '919610815222',
    role: 'Floreto Reviews PEH',
  },
  {
    id: 'm_minauti',
    name: 'minautitiwari',
    displayName: 'minautitiwari',
    wingName: 'Prince Medical College',
    wingKeywords: ['medical'],
    phone: '+91 9166095690',
    cleanPhone: '919166095690',
    role: 'Medical College Reviews',
  },
  {
    id: 'm_shankar',
    name: 'Dr-Shankar Kajla',
    displayName: 'Dr-Shankar Kajla',
    wingName: 'Prince College Sikar',
    wingKeywords: ['prince college', 'college sikar'],
    phone: '+91 9521683580',
    cleanPhone: '919521683580',
    role: 'Prince College Sikar PEH',
  },
  {
    id: 'm_nitesh',
    name: 'Nitesh Sharma',
    displayName: 'Nitesh Sharma',
    wingName: 'Prince Defence Academy',
    wingKeywords: ['defence', 'pda', 'nda'],
    phone: '+91 7976436882',
    cleanPhone: '917976436882',
    role: 'PDA Reviews (Prince Defence)',
  },
  {
    id: 'm_vineet',
    name: 'Vineet Ji',
    displayName: 'Vineet Ji',
    wingName: 'Prince Sainik School',
    wingKeywords: ['sainik'],
    phone: '+91 7976436882',
    cleanPhone: '917976436882',
    role: 'Prince Sainik School Reviews',
  },
  {
    id: 'm_pcp_jaipur',
    name: 'PCP Jaipur',
    displayName: 'PCP Jaipur',
    wingName: 'PCP Jaipur',
    wingKeywords: ['jaipur'],
    phone: '+91 8233911938',
    cleanPhone: '918233911938',
    role: 'PCP Jaipur Reviews',
  },
  {
    id: 'm_prince_academy',
    name: 'Prince academy FDO',
    displayName: 'Prince academy FDO',
    wingName: 'Prince Academy of Higher Education',
    wingKeywords: ['prince academy of higher education', 'academy fdo'],
    phone: '+91 9799912938',
    cleanPhone: '919799912938',
    role: 'Prince Academy FDO',
  },
  {
    id: 'm_rahul_mishra',
    name: 'Rahul Ji Mishra',
    displayName: 'Rahul Ji Mishra',
    wingName: 'PCP Sikar (Prime Branch)',
    wingKeywords: ['prime'],
    phone: '+91 6376913003',
    cleanPhone: '916376913003',
    role: 'PCP Prime Reviews',
  },
  {
    id: 'm_rahul_reviews',
    name: 'Rahul ji Reviews',
    displayName: 'Rahul ji Reviews',
    wingName: 'PCP Sikar (Prime Branch)',
    wingKeywords: ['prime'],
    phone: '+91 9251634059',
    cleanPhone: '919251634059',
    role: 'PCP Prime Reviews',
  },
  {
    id: 'm_santosh',
    name: 'Santosh Ji',
    displayName: 'Santosh Ji',
    wingName: 'Prince RBSE School - Palwas Road Campus',
    wingKeywords: ['rbse school - palwas', 'rbse school', 'lotus valley'],
    phone: '+91 9587574938',
    cleanPhone: '919587574938',
    role: 'Prince RBSE Reviews',
  },
];

/**
 * Get assigned members permanently for a given profile title or identifier
 */
export function getAssignedStaffMembersForProfile(titleOrId: string = ''): ReviewTeamMember[] {
  const s = (titleOrId || '').toLowerCase();

  // 1. PCP Prime: permanently assigned BOTH Rahul Ji Mishra and Rahul ji Reviews
  if (s.includes('prime')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_rahul_mishra' || m.id === 'm_rahul_reviews');
  }

  // 2. Prince Hospital: Aditya Mehrotra
  if (s.includes('hospital')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_aditya');
  }

  // 3. Floreto: Floreto reviews PEH
  if (s.includes('floreto')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_floreto');
  }

  // 4. Medical College: minautitiwari
  if (s.includes('medical')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_minauti');
  }

  // 5. Prince College Sikar: Dr-Shankar Kajla
  if (s.includes('prince college') || (s.includes('college') && !s.includes('medical'))) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_shankar');
  }

  // 6. Sainik School: Vineet Ji
  if (s.includes('sainik')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_vineet');
  }

  // 7. PDA / Defence / NDA: Nitesh Sharma
  if (s.includes('defence') || s.includes('pda') || s.includes('nda')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_nitesh');
  }

  // 7. PCP Jaipur: PCP Jaipur
  if (s.includes('jaipur') && s.includes('pcp')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_pcp_jaipur');
  }

  // 8. Piprali Road: Abhishek Ji
  if (s.includes('piprali')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_abhishek');
  }

  // 9. Prince RBSE (Palwas Road): Santosh Ji
  if (s.includes('rbse')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_santosh');
  }

  // 10. Prince Academy of Higher Education: Prince academy FDO
  if (s.includes('academy') && !s.includes('defence') && !s.includes('nda')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_prince_academy');
  }

  // 11. Lotus Valley: Santosh Ji
  if (s.includes('lotus')) {
    return OFFICIAL_REVIEW_TEAM.filter(m => m.id === 'm_santosh');
  }

  return [];
}

/**
 * Returns bracketed string e.g. "(Aditya Mehrotra)" or "(Rahul Ji Mishra, Rahul ji Reviews)"
 * Used in Daily WhatsApp reports and targets right after the wing title.
 */
export function getAssignedStaffBracket(titleOrId: string = ''): string {
  const members = getAssignedStaffMembersForProfile(titleOrId);
  if (members.length === 0) return '';
  const names = members.map(m => m.name).join(', ');
  return `(${names})`;
}

/**
 * Ensures phone number strictly has +91 prefix and clean standard spacing
 * e.g. '72969 89764'   -> '+91 72969 89764'
 *      '+91 7296989764' -> '+91 72969 89764'
 */
export function formatPhoneWithPlus91(phone?: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';

  let tenDigit = digitsOnly;
  if (tenDigit.length === 12 && tenDigit.startsWith('91')) {
    tenDigit = tenDigit.substring(2);
  } else if (tenDigit.length === 11 && tenDigit.startsWith('0')) {
    tenDigit = tenDigit.substring(1);
  }

  if (tenDigit.length === 10) {
    return `+91 ${tenDigit.substring(0, 5)} ${tenDigit.substring(5)}`;
  }

  return phone.startsWith('+91') ? phone : `+91 ${phone.replace(/^\+/, '')}`;
}

/**
 * Returns formatted phone numbers with +91 prefix for the assigned staff.
 * e.g. "+91 72300 89108" or for PCP Prime: "+91 63769 13003, +91 92516 34059"
 */
export function getAssignedStaffPhone(titleOrId: string = ''): string {
  const members = getAssignedStaffMembersForProfile(titleOrId);
  if (members.length === 0) return '';
  return members
    .map(m => formatPhoneWithPlus91(m.phone))
    .filter(Boolean)
    .join(', ');
}

/**
 * Returns array of formatted phone numbers with +91 prefix
 */
export function getAssignedStaffPhones(titleOrId: string = ''): string[] {
  const members = getAssignedStaffMembersForProfile(titleOrId);
  return members
    .map(m => formatPhoneWithPlus91(m.phone))
    .filter(Boolean);
}

/**
 * Formats a wing title with its bracketed assigned staff name
 * e.g. "*Prince Hospital* (Aditya Mehrotra)"
 */
export function formatWingWithStaff(title: string, boldTitle: boolean = false): string {
  const bracket = getAssignedStaffBracket(title);
  const formattedTitle = boldTitle ? `*${title}*` : title;
  return bracket ? `${formattedTitle} ${bracket}` : formattedTitle;
}
