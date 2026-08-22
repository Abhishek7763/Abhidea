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
