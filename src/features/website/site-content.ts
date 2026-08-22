export const publicNav = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "About", href: "/about" },
  { label: "Search", href: "/search" },
] as const;

export const contentTypes = [
  { slug: "article", label: "Articles", description: "Deep explanations, synthesis and useful perspectives." },
  { slug: "book-summary", label: "Book Summaries", description: "Ideas, lessons and reflections distilled from books." },
  { slug: "fact", label: "Facts", description: "Compact, useful knowledge worth remembering." },
  { slug: "thought", label: "Thoughts", description: "Short reflections that invite a second look." },
  { slug: "idea", label: "Ideas", description: "Concepts to explore, test and connect." },
  { slug: "life-lesson", label: "Life Lessons", description: "Practical learning from experience and observation." },
  { slug: "guide", label: "Guides", description: "Structured help for learning or doing something well." },
  { slug: "video-insight", label: "Video Insights", description: "Curated lessons and synthesis from useful videos." },
] as const;

export const subjects = [
  { slug: "artificial-intelligence", label: "Artificial Intelligence" },
  { slug: "technology", label: "Technology" },
  { slug: "science", label: "Science" },
  { slug: "psychology", label: "Psychology" },
  { slug: "history", label: "History" },
  { slug: "books-learning", label: "Books & Learning" },
  { slug: "personal-growth", label: "Personal Growth" },
] as const;

export const readerPreviewItems = [
  {
    contentTypeSlug: "article",
    contentType: "Article",
    locale: "English",
    title: "Attention Is a Skill You Can Train",
    summary: "A practical guide to protecting attention, reducing mental switching and building calmer reading habits.",
    readingTime: "10 min read",
    href: "/en/read/attention-is-a-skill-demo",
  },
  {
    contentTypeSlug: "article",
    contentType: "Article",
    locale: "हिन्दी",
    title: "ध्यान एक कौशल है जिसे आप प्रशिक्षित कर सकते हैं",
    summary: "ध्यान को बचाने, मानसिक स्विचिंग कम करने और पढ़ने-सीखने का शांत तरीका बनाने की व्यावहारिक मार्गदर्शिका।",
    readingTime: "10 मिनट",
    href: "/hi/read/dhyan-ek-kaushal-hai-demo",
  },
  {
    contentTypeSlug: "book-summary",
    contentType: "Book Summary",
    locale: "English",
    title: "Atomic Habits — Book Summary",
    summary: "A structured Reader summary of James Clear’s framework for making small behaviours repeatable and durable.",
    readingTime: "12 min read",
    href: "/en/read/atomic-habits-summary-demo",
  },
  {
    contentTypeSlug: "book-summary",
    contentType: "Book Summary",
    locale: "हिन्दी",
    title: "Atomic Habits — पुस्तक सारांश",
    summary: "छोटे व्यवहारिक बदलावों को आसान, दोहराने योग्य और टिकाऊ बनाने वाले ढाँचे का हिन्दी Reader सारांश।",
    readingTime: "12 मिनट",
    href: "/hi/read/atomic-habits-saar-demo",
  },
] as const;

export const creatorProfile = {
  name: "Abhishek Kumar Bhardwaj",
  shortName: "Abhishek",
  label: "Creator of ABHIDEA",
  role: "Electrical Engineer • Learner • Tech Enthusiast",
  location: "India",
  headline: "Learning, exploring, and sharing useful knowledge.",
  intro:
    "I’m Abhishek, an Electrical Engineering professional with an interest in AI, technology, web development and practical learning. I enjoy understanding useful ideas and sharing them in a form that others can actually use.",
  tagline: "Learn • Explore • Share",
  education: "ITI Diploma in Electrical & Electronics Engineering (EEE)",
  interests: ["Artificial Intelligence", "Technology & Development", "Books & Learning"],
  whyAbhidea:
    "ABHIDEA exists to turn reading, curiosity and independent thinking into clear, useful knowledge—first as a way to learn deeply, and then as a way to share what is worth keeping.",
  philosophy:
    "Learning becomes more valuable when we question what we read, connect it with experience, and share the result honestly and clearly.",
  photos: {
    primary: null as string | null,
    secondary: null as string | null,
  },
  socialLinks: [
    { label: "Instagram", href: null as string | null },
    { label: "Telegram", href: null as string | null },
    { label: "GitHub", href: null as string | null },
    { label: "WhatsApp", href: null as string | null },
  ],
} as const;