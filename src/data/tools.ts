export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
}

export const categories: Category[] = [
  {
    id: "text-tools",
    name: "Text Tools",
    description: "Text manipulation and formatting utilities",
    icon: "FileText",
    toolCount: 12,
  },
  {
    id: "image-tools",
    name: "Image Tools",
    description: "Image editing and conversion tools",
    icon: "Image",
    toolCount: 8,
  },
  {
    id: "converters",
    name: "Converters",
    description: "Convert between different formats and units",
    icon: "RefreshCw",
    toolCount: 15,
  },
  {
    id: "generators",
    name: "Generators",
    description: "Generate random data and content",
    icon: "Sparkles",
    toolCount: 10,
  },
  {
    id: "calculators",
    name: "Calculators",
    description: "Mathematical and financial calculators",
    icon: "Calculator",
    toolCount: 9,
  },
  {
    id: "web-tools",
    name: "Web Tools",
    description: "Web development and SEO utilities",
    icon: "Globe",
    toolCount: 11,
  },
];

export const tools: Tool[] = [
  // Text Tools
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Convert text between different cases",
    category: "text-tools",
    icon: "Type",
    isPopular: true,
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters, and sentences",
    category: "text-tools",
    icon: "Hash",
    isPopular: true,
  },
  {
    id: "text-diff",
    name: "Text Diff Checker",
    description: "Compare two texts and find differences",
    category: "text-tools",
    icon: "FileText",
    isNew: true,
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text",
    category: "text-tools",
    icon: "FileText",
  },
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    description: "Preview markdown in real-time",
    category: "text-tools",
    icon: "Eye",
  },
  
  // Image Tools
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images to custom dimensions",
    category: "image-tools",
    icon: "Maximize2",
    isPopular: true,
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size",
    category: "image-tools",
    icon: "Minimize2",
    isNew: true,
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert between image formats",
    category: "image-tools",
    icon: "Image",
  },
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Pick colors from images",
    category: "image-tools",
    icon: "Palette",
  },
  
  // Converters
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format and validate JSON data",
    category: "converters",
    icon: "Braces",
    isPopular: true,
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description: "Encode and decode Base64 strings",
    category: "converters",
    icon: "Code",
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Convert between different units",
    category: "converters",
    icon: "ArrowLeftRight",
    isNew: true,
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert Unix timestamps to dates",
    category: "converters",
    icon: "Clock",
  },
  
  // Generators
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate unique identifiers",
    category: "generators",
    icon: "Key",
    isPopular: true,
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate secure passwords",
    category: "generators",
    icon: "Lock",
    isPopular: true,
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Create QR codes from text",
    category: "generators",
    icon: "QrCode",
    isNew: true,
  },
  {
    id: "random-number",
    name: "Random Number Generator",
    description: "Generate random numbers",
    category: "generators",
    icon: "Dices",
  },
  
  // Calculators
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    description: "Calculate percentages easily",
    category: "calculators",
    icon: "Percent",
  },
  {
    id: "date-calculator",
    name: "Date Calculator",
    description: "Calculate date differences",
    category: "calculators",
    icon: "Calendar",
  },
  {
    id: "loan-calculator",
    name: "Loan Calculator",
    description: "Calculate loan payments and interest",
    category: "calculators",
    icon: "DollarSign",
  },
  
  // Web Tools
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description: "Encode and decode URLs",
    category: "web-tools",
    icon: "Link",
  },
  {
    id: "html-encoder",
    name: "HTML Entity Encoder",
    description: "Encode HTML entities",
    category: "web-tools",
    icon: "Code2",
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions",
    category: "web-tools",
    icon: "Search",
    isNew: true,
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256 hashes",
    category: "web-tools",
    icon: "Hash",
  },
  {
    id: "binary-converter",
    name: "Binary Converter",
    description: "Convert between binary, decimal, hex",
    category: "converters",
    icon: "Binary",
  },
  {
    id: "css-minifier",
    name: "CSS Minifier",
    description: "Minify and compress CSS code",
    category: "web-tools",
    icon: "FileCode",
  },
  {
    id: "js-minifier",
    name: "JavaScript Minifier",
    description: "Minify and compress JavaScript code",
    category: "web-tools",
    icon: "FileCode2",
  },
  {
    id: "bmi-calculator",
    name: "BMI Calculator",
    description: "Calculate Body Mass Index",
    category: "calculators",
    icon: "Activity",
  },
  {
    id: "age-calculator",
    name: "Age Calculator",
    description: "Calculate exact age from birthdate",
    category: "calculators",
    icon: "Cake",
  },
  {
    id: "string-reverser",
    name: "String Reverser",
    description: "Reverse text strings",
    category: "text-tools",
    icon: "ArrowLeftRight",
  },
  {
    id: "whitespace-remover",
    name: "Whitespace Remover",
    description: "Remove extra whitespace from text",
    category: "text-tools",
    icon: "Space",
  },
  {
    id: "duplicate-remover",
    name: "Duplicate Line Remover",
    description: "Remove duplicate lines from text",
    category: "text-tools",
    icon: "ListFilter",
  },
  {
    id: "sort-lines",
    name: "Sort Lines",
    description: "Sort text lines alphabetically",
    category: "text-tools",
    icon: "ArrowUpDown",
  },
  {
    id: "image-to-base64",
    name: "Image to Base64",
    description: "Convert images to Base64 strings",
    category: "image-tools",
    icon: "FileImage",
  },
  {
    id: "gradient-generator",
    name: "CSS Gradient Generator",
    description: "Create CSS gradients visually",
    category: "web-tools",
    icon: "Palette",
    isNew: true,
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode JWT tokens",
    category: "web-tools",
    icon: "ShieldCheck",
  },
  {
    id: "text-to-slug",
    name: "Text to Slug",
    description: "Convert text to URL-friendly slugs",
    category: "text-tools",
    icon: "Link2",
  },
];

export const popularSearches = [
  "JSON formatter",
  "Image compressor",
  "Password generator",
  "Word counter",
  "Base64 encoder",
  "QR code generator",
];
