export const COLORS = {
  background: '#131313',
  surface: '#131313',
  surfaceLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceHigh: '#2a2a2a',
  surfaceHighest: '#353534',

  primary: '#ffc244',
  primaryDark: '#e6a800',
  primaryMuted: 'rgba(255,194,68,0.12)',
  primaryGlow: 'rgba(255,194,68,0.15)',

  // ── Text ──
  textPrimary: '#e5e2e1',
  textSecondary: '#d4c4ae',
  textMuted: '#9c8f7b',
  textOnGold: '#412d00',

  // ── Borders ──
  border: '#504534',
  borderMuted: '#353534',

  // ── Semantic ──
  success: '#4caf50',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  verified: '#ffc244',

  // ── Legacy ──
  textDark: '#e5e2e1',
  textMuted2: '#9c8f7b',
  white: '#ffffff',

  // ── Compat with old screens ──
  primaryDark: '#e6a800',
  surface2: '#f9fafb',
};

export const FONTS = {
  regular: "400",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 12,
  md: 24,
  lg: 48,
  xl: 80,
  gutter: 16,
  margin: 20,
  // Legacy compat
  xxl: 32,
};

export const SERVICE_CATEGORIES = [
  { id: "1", name: "Hair & Beauty", sub: "Barbing, Wigs, Makeup" },
  { id: "2", name: "Fashion", sub: "Tailoring, Shoe Making" },
  { id: "3", name: "Repairs & Tech", sub: "Phone, Laptop, AC, Gen" },
  { id: "4", name: "Construction", sub: "Plumbing, Electrical, POP" },
  { id: "5", name: "Auto", sub: "Mechanic, Vulcanizing" },
  { id: "6", name: "Digital Skills", sub: "UI/UX, Coding, Video" },
  { id: "7", name: "Laundry", sub: "Laundry & Dry Cleaning" },
  { id: "8", name: "Catering", sub: "Baking & Catering" },
  { id: "9", name: "Beauty & Nails", sub: "Nail Tech, Pedicure" },
  { id: "10", name: "Photography", sub: "Photography & Videography" },
  { id: "11", name: "Interior Deco", sub: "Interior Decoration" },
  { id: "12", name: "Carpentry", sub: "Carpentry & Furniture" },
  { id: "13", name: "Welding", sub: "Welding & Fabrication" },
  { id: "14", name: "Painting", sub: "Painting & POP Ceiling" },
  { id: "15", name: "Tiling", sub: "Tiling & Masonry" },
  { id: "16", name: "Solar & CCTV", sub: "CCTV & Solar Installation" },
  { id: "17", name: "Jewelry", sub: "Bead Making & Jewelry" },
  { id: "18", name: "Graphic Design", sub: "Design & Printing" },
];

export const PROPERTY_TYPES = [
  { id: "rent", label: "Rent", value: "rent" },
  { id: "buy", label: "Buy", value: "buy" },
  { id: "land", label: "Land", value: "land" },
  { id: "commercial", label: "Commercial", value: "commercial" },
  { id: "shortlet", label: "Shortlet", value: "shortlet" },
];

export const JOB_TYPES = [
  { id: "full_time", label: "Full-time" },
  { id: "part_time", label: "Part-time" },
  { id: "freelance", label: "Freelance" },
  { id: "contract", label: "Contract" },
  { id: "internship", label: "Internship" },
];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];