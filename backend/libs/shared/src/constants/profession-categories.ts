export const AGE_RANGES = [
  '18-25',
  '26-35',
  '36-45',
  '46-59',
  '60-70',
  'Above 70',
] as const;

export const GENDERS = ['Male', 'Female'] as const;

export const MARITAL_STATUSES = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
] as const;

export const PROFESSION_CATEGORIES = [
  'Non-Governmental Organisation Professionals (Project Officers, Consultants, etc)',
  'Engineers and Architects',
  'Healthcare Professionals',
  'Lawyers and Legal Professionals (paralegals, legal clerks, administrative officers etc.)',
  'ICT and Technology Professionals',
  'Administrative Professionals (procurement officers, supply chain, logistics, secretaries, marketers, etc)',
  'Accountants and Financial Professionals (Bankers, tellers, insurance, investment, tax officers, etc)',
  'Hospitality Professionals',
  'Teachers and Educators',
  'Service Professionals (Military, Police, Immigration, Navy, Fire Service and Customer Officers)',
  'Media and Communication Professionals',
  'Businessmen and Women (Artisans/Vendors)',
] as const;

export const PROFESSION_SUB_CATEGORIES = {
  Artisans: [
    'Carpenters',
    'Masons and Builders',
    'Electricians',
    'Plumbers',
    'Welders and Fabricators',
    'Tailors/Dressmakers/Fashion Designers',
    'Hairdressers and Barbers',
    'Farmers and Agribusiness Operators',
    'Mechanics and Auto Technicians',
    'Craftsmen and Craftswomen',
  ],
  Vendors: [
    'Event Planners (Décor, Caterers, photographers, etc.)',
    'Beauty and Personal Care Service Providers',
    'Traders and Market Women/Men',
    'Retail Shop Owners',
    'Wholesalers and Distributors',
    'Street Vendors and Hawkers',
    'Transport Service Providers',
  ],
} as const;

export const ALL_SUB_CATEGORIES = [
  ...PROFESSION_SUB_CATEGORIES.Artisans,
  ...PROFESSION_SUB_CATEGORIES.Vendors,
];

export const BIODATA_TCP_PATTERNS = {
  CREATE: 'biodata.create',
  FIND_ALL: 'biodata.findAll',
  OPTIONS: 'biodata.options',
} as const;
