import type { ReaderLocale } from "./document-schema";
import type { ReaderFixture } from "./reader-fixtures";

const attentionArticleEn: ReaderFixture = {
  locale: "en",
  slug: "attention-is-a-skill-demo",
  alternateLocale: "hi",
  alternateSlug: "dhyan-ek-kaushal-hai-demo",
  title: "Attention Is a Skill You Can Train",
  summary:
    "A practical guide to protecting attention, reducing mental switching, and building a calmer way to read, learn, and work.",
  eyebrow: "Demo Article · Reader testing content",
  contentType: "Article",
  subjects: ["Personal Growth", "Books & Learning"],
  readingTime: "10 min read",
  body: {
    schemaVersion: 1,
    blocks: [
      {
        id: "opening",
        type: "paragraph",
        text: "Attention often feels like something we either have or do not have. In practice, it behaves more like a skill: it becomes stronger when we protect it, give it a clear target, and return to that target after distraction. The goal is not perfect concentration. The goal is to make returning easier and more deliberate.",
      },
      {
        id: "attention-environment",
        type: "heading",
        level: 2,
        text: "1. Attention begins with the environment",
      },
      {
        id: "attention-environment-p1",
        type: "paragraph",
        text: "A difficult task already consumes mental energy. If notifications, open tabs, unfinished messages, and unrelated objects are competing for the same space, the brain must repeatedly decide what to ignore. That decision itself has a cost. A calmer environment reduces the number of decisions required before useful work can begin.",
      },
      {
        id: "attention-environment-list",
        type: "list",
        style: "unordered",
        items: [
          "Keep only the material needed for the current task visible.",
          "Silence non-essential notifications during focused reading.",
          "Write distracting thoughts on a small capture list instead of acting on them immediately.",
          "Choose a clear stopping point before you begin.",
        ],
      },
      {
        id: "attention-question",
        type: "callout",
        tone: "key-idea",
        title: "A better question",
        text: "Instead of asking, ‘How do I focus for hours?’, ask, ‘How do I make the next twenty minutes easy to protect?’",
      },
      {
        id: "switching-cost",
        type: "heading",
        level: 2,
        text: "2. Frequent switching creates invisible friction",
      },
      {
        id: "switching-cost-p1",
        type: "paragraph",
        text: "Moving from an article to a message, then to a short video, then back to the article can feel harmless because each switch is brief. But every switch changes the mental context. When you return, part of your attention is spent reconstructing where you were, what the argument was, and why the next paragraph matters.",
      },
      {
        id: "switching-quote",
        type: "quote",
        text: "Depth is often lost not because the material is too difficult, but because the context is repeatedly reset.",
        attribution: "ABHIDEA reading principle",
      },
      {
        id: "reading-ritual",
        type: "heading",
        level: 2,
        text: "3. Use a small ritual to enter deep reading",
      },
      {
        id: "reading-ritual-p1",
        type: "paragraph",
        text: "A repeatable starting ritual can act as a cue. It does not need to be elaborate. Open the reading material, set a single question, remove unrelated tabs, choose a comfortable Reader setting, and begin with one section. Repeating the same sequence reduces the amount of negotiation required each time.",
      },
      {
        id: "reader-figure",
        type: "figure",
        mediaId: "reader-learning-loop",
        alt: "A five-step learning loop showing Question, Read, Explain, Connect, and Revisit.",
        caption: "Focused reading becomes more useful when attention is connected to a repeatable learning loop.",
        credit: "ABHIDEA Reader QA diagram",
      },
      {
        id: "returning",
        type: "heading",
        level: 2,
        text: "4. Train the return, not the fantasy of never drifting",
      },
      {
        id: "returning-p1",
        type: "paragraph",
        text: "Mind wandering is normal. The useful skill is noticing it without turning the moment into frustration. When you notice that attention has moved elsewhere, identify the distraction, capture it if necessary, and return to the exact sentence or idea you were working with. Each return is a repetition of the skill you are trying to strengthen.",
      },
      {
        id: "returning-note",
        type: "callout",
        tone: "note",
        title: "Practical reset",
        text: "If a page starts to blur into passive reading, pause and explain the last useful idea in one sentence. Then continue from there.",
      },
      {
        id: "energy",
        type: "heading",
        level: 2,
        text: "5. Attention also depends on energy",
      },
      {
        id: "energy-p1",
        type: "paragraph",
        text: "No interface can fully compensate for exhaustion. Reading difficulty changes with sleep, stress, hunger, posture, and time of day. A good system therefore combines environmental design with realistic expectations. When energy is low, use shorter sessions, narrower goals, and more active recall instead of forcing long passive reading.",
      },
      {
        id: "divider",
        type: "divider",
      },
      {
        id: "take",
        type: "closure",
        variant: "abhidea-take",
        title: "Attention improves when the path back is simple",
        text: "You do not need a perfectly distraction-free mind. You need fewer unnecessary switches, a clear target, and a reliable way to return when attention moves away.",
      },
      {
        id: "conclusion",
        type: "closure",
        variant: "conclusion",
        title: "Protect one small block of attention",
        text: "Choose one reading session today. Remove the obvious interruptions, set one question, read one meaningful section, and notice how often you return. That small practice is enough to begin training the skill.",
      },
    ],
  },
  sources: [
    {
      id: "demo-source",
      title: "ABHIDEA demo editorial content for Reader testing",
      authorOrOrg: "ABHIDEA",
    },
  ],
  related: [
    {
      title: "Atomic Habits — Demo Summary",
      description: "Test the Book Summary reading format with a longer structured overview.",
      href: "/en/read/atomic-habits-summary-demo",
    },
    {
      title: "Learning System Demo",
      description: "Open the original bilingual Reader QA article.",
      href: "/en/read/learning-system-demo",
    },
    {
      title: "Articles",
      description: "Return to the Article knowledge hub.",
      href: "/explore/type/article",
    },
  ],
};

const attentionArticleHi: ReaderFixture = {
  locale: "hi",
  slug: "dhyan-ek-kaushal-hai-demo",
  alternateLocale: "en",
  alternateSlug: "attention-is-a-skill-demo",
  title: "ध्यान एक कौशल है जिसे आप प्रशिक्षित कर सकते हैं",
  summary:
    "ध्यान को बचाने, बार-बार मानसिक स्विचिंग कम करने और पढ़ने, सीखने तथा काम करने का शांत तरीका बनाने की एक व्यावहारिक मार्गदर्शिका।",
  eyebrow: "डेमो लेख · Reader परीक्षण सामग्री",
  contentType: "Article",
  subjects: ["Personal Growth", "Books & Learning"],
  readingTime: "10 मिनट पढ़ना",
  body: {
    schemaVersion: 1,
    blocks: [
      {
        id: "opening",
        type: "paragraph",
        text: "ध्यान अक्सर ऐसा लगता है जैसे वह या तो हमारे पास है या नहीं है। व्यवहार में यह एक कौशल की तरह काम करता है: जब हम उसे बचाते हैं, उसे साफ़ लक्ष्य देते हैं और भटकने के बाद वापस लौटते हैं, तो वह मजबूत होता है। उद्देश्य कभी न भटकना नहीं, बल्कि वापस लौटना आसान और जानबूझकर बनाना है।",
      },
      {
        id: "attention-environment",
        type: "heading",
        level: 2,
        text: "1. ध्यान की शुरुआत वातावरण से होती है",
      },
      {
        id: "attention-environment-p1",
        type: "paragraph",
        text: "कठिन काम पहले ही मानसिक ऊर्जा लेता है। यदि नोटिफिकेशन, खुले टैब, अधूरे संदेश और असंबंधित चीज़ें उसी समय ध्यान माँग रही हों, तो दिमाग को बार-बार तय करना पड़ता है कि किसे नज़रअंदाज़ करे। यह निर्णय भी ऊर्जा लेता है। शांत वातावरण उपयोगी काम शुरू करने से पहले की अनावश्यक मानसिक लागत घटाता है।",
      },
      {
        id: "attention-environment-list",
        type: "list",
        style: "unordered",
        items: [
          "सिर्फ वही सामग्री सामने रखें जो वर्तमान काम के लिए चाहिए।",
          "गहरी पढ़ाई के दौरान गैर-जरूरी नोटिफिकेशन बंद रखें।",
          "भटकाने वाले विचारों पर तुरंत काम करने के बजाय उन्हें एक छोटी सूची में लिख लें।",
          "शुरू करने से पहले तय करें कि सत्र कहाँ समाप्त होगा।",
        ],
      },
      {
        id: "attention-question",
        type: "callout",
        tone: "key-idea",
        title: "बेहतर प्रश्न",
        text: "‘मैं घंटों कैसे ध्यान लगाऊँ?’ की जगह पूछें: ‘अगले बीस मिनट को सुरक्षित रखना आसान कैसे बनाऊँ?’",
      },
      {
        id: "switching-cost",
        type: "heading",
        level: 2,
        text: "2. बार-बार काम बदलना अदृश्य घर्षण पैदा करता है",
      },
      {
        id: "switching-cost-p1",
        type: "paragraph",
        text: "लेख से संदेश पर जाना, फिर छोटे वीडियो पर और फिर लेख पर लौटना मामूली लग सकता है क्योंकि हर बदलाव छोटा है। लेकिन हर बदलाव मानसिक संदर्भ बदल देता है। वापस लौटते समय दिमाग को फिर याद करना पड़ता है कि हम कहाँ थे, तर्क क्या था और अगला पैराग्राफ क्यों महत्त्वपूर्ण है।",
      },
      {
        id: "switching-quote",
        type: "quote",
        text: "गहराई कई बार सामग्री कठिन होने से नहीं, बल्कि संदर्भ बार-बार रीसेट होने से खोती है।",
        attribution: "ABHIDEA reading principle",
      },
      {
        id: "reading-ritual",
        type: "heading",
        level: 2,
        text: "3. गहरी पढ़ाई शुरू करने के लिए छोटा रिवाज़ बनाएँ",
      },
      {
        id: "reading-ritual-p1",
        type: "paragraph",
        text: "एक दोहराने योग्य शुरुआती क्रम संकेत की तरह काम कर सकता है। पढ़ने की सामग्री खोलें, एक प्रश्न तय करें, असंबंधित टैब हटाएँ, आरामदायक Reader सेटिंग चुनें और एक सेक्शन से शुरू करें। वही क्रम बार-बार दोहराने से हर बार शुरू करने की मानसिक बातचीत कम होती है।",
      },
      {
        id: "reader-figure",
        type: "figure",
        mediaId: "reader-learning-loop",
        alt: "प्रश्न, पढ़ना, समझाना, जोड़ना और दोबारा याद करना दिखाने वाला पाँच चरणों का सीखने का चक्र।",
        caption: "जब ध्यान एक दोहराने योग्य सीखने के चक्र से जुड़ता है, तो गहरी पढ़ाई अधिक उपयोगी बनती है।",
        credit: "ABHIDEA Reader QA diagram",
      },
      {
        id: "returning",
        type: "heading",
        level: 2,
        text: "4. कभी न भटकने की कल्पना नहीं, वापस लौटने की आदत प्रशिक्षित करें",
      },
      {
        id: "returning-p1",
        type: "paragraph",
        text: "मन का भटकना सामान्य है। उपयोगी कौशल है उसे पहचानना और निराश हुए बिना लौटना। जब लगे कि ध्यान कहीं और चला गया है, भटकाव को पहचानें, जरूरत हो तो उसे लिखें और उसी वाक्य या विचार पर वापस आएँ जहाँ काम चल रहा था। हर वापसी उसी कौशल की एक पुनरावृत्ति है जिसे आप मजबूत करना चाहते हैं।",
      },
      {
        id: "returning-note",
        type: "callout",
        tone: "note",
        title: "व्यावहारिक रीसेट",
        text: "यदि पन्ना निष्क्रिय पढ़ाई में बदलने लगे, रुकें और पिछला उपयोगी विचार एक वाक्य में अपनी भाषा में समझाएँ। फिर आगे बढ़ें।",
      },
      {
        id: "energy",
        type: "heading",
        level: 2,
        text: "5. ध्यान ऊर्जा पर भी निर्भर करता है",
      },
      {
        id: "energy-p1",
        type: "paragraph",
        text: "कोई इंटरफ़ेस पूरी तरह थकान की भरपाई नहीं कर सकता। नींद, तनाव, भूख, बैठने का तरीका और दिन का समय पढ़ने की कठिनाई बदलते हैं। इसलिए अच्छी प्रणाली वातावरण के साथ वास्तविक अपेक्षाएँ भी बनाती है। कम ऊर्जा में छोटे सत्र, संकरे लक्ष्य और सक्रिय स्मरण लंबे निष्क्रिय पढ़ने से बेहतर हो सकते हैं।",
      },
      { id: "divider", type: "divider" },
      {
        id: "take",
        type: "closure",
        variant: "abhidea-take",
        title: "ध्यान तब बेहतर होता है जब वापसी का रास्ता सरल हो",
        text: "आपको पूरी तरह विचलन-मुक्त मन नहीं चाहिए। आपको कम अनावश्यक स्विच, साफ़ लक्ष्य और भटकने के बाद वापस आने का भरोसेमंद तरीका चाहिए।",
      },
      {
        id: "conclusion",
        type: "closure",
        variant: "conclusion",
        title: "ध्यान का एक छोटा समय सुरक्षित करें",
        text: "आज एक पढ़ने का सत्र चुनें। स्पष्ट बाधाएँ हटाएँ, एक प्रश्न तय करें, एक उपयोगी सेक्शन पढ़ें और ध्यान दें कि आप कितनी बार वापस लौटते हैं। कौशल को प्रशिक्षित करने की शुरुआत के लिए इतना पर्याप्त है।",
      },
    ],
  },
  sources: [
    {
      id: "demo-source",
      title: "Reader परीक्षण के लिए ABHIDEA डेमो संपादकीय सामग्री",
      authorOrOrg: "ABHIDEA",
    },
  ],
  related: [
    {
      title: "Atomic Habits — डेमो सारांश",
      description: "लंबे संरचित Book Summary प्रारूप को जाँचें।",
      href: "/hi/read/atomic-habits-saar-demo",
    },
    {
      title: "सीखने की प्रणाली डेमो",
      description: "मूल bilingual Reader QA लेख खोलें।",
      href: "/hi/read/seekhne-ki-pranali-demo",
    },
    {
      title: "Articles",
      description: "Article knowledge hub पर वापस जाएँ।",
      href: "/explore/type/article",
    },
  ],
};

const atomicHabitsEn: ReaderFixture = {
  locale: "en",
  slug: "atomic-habits-summary-demo",
  alternateLocale: "hi",
  alternateSlug: "atomic-habits-saar-demo",
  title: "Atomic Habits — Book Summary",
  summary:
    "A Reader demo summary of James Clear’s framework for making small behavioral changes easier to repeat and easier to sustain.",
  eyebrow: "Demo Book Summary · Not published content",
  contentType: "Book Summary",
  subjects: ["Books & Learning", "Personal Growth"],
  readingTime: "12 min read",
  body: {
    schemaVersion: 1,
    blocks: [
      {
        id: "opening",
        type: "paragraph",
        text: "Atomic Habits argues that meaningful change often grows from small actions repeated consistently rather than dramatic bursts of motivation. The book focuses on designing systems that make good behaviors easier to perform and unwanted behaviors harder to repeat. This demo summary is written in original language for ABHIDEA Reader testing and is not a substitute for the book.",
      },
      {
        id: "core-idea",
        type: "heading",
        level: 2,
        text: "1. Small improvements become meaningful through repetition",
      },
      {
        id: "core-idea-p1",
        type: "paragraph",
        text: "A single small action can look insignificant. The effect becomes visible when the action is repeated long enough to shape a pattern. This shifts attention away from dramatic short-term results and toward the direction a system is producing. The useful question is not only what happened today, but what repeated behavior is becoming normal.",
      },
      {
        id: "system-callout",
        type: "callout",
        tone: "key-idea",
        title: "Systems over isolated goals",
        text: "Goals describe a desired outcome; systems describe the repeated process that makes the outcome more likely.",
      },
      {
        id: "identity",
        type: "heading",
        level: 2,
        text: "2. Habits can reinforce identity",
      },
      {
        id: "identity-p1",
        type: "paragraph",
        text: "The book connects behavior with identity: repeated actions become evidence for the kind of person we believe ourselves to be. Instead of treating a habit only as a task to complete, it can be framed as a vote for a desired identity. Reading for twenty minutes is not merely finishing pages; it can support the identity of being a consistent learner.",
      },
      {
        id: "identity-list",
        type: "list",
        style: "unordered",
        items: [
          "Choose the identity or quality you want to strengthen.",
          "Define a very small behavior that provides evidence for it.",
          "Repeat the behavior often enough that it becomes familiar.",
          "Avoid treating one missed repetition as proof that the identity is false.",
        ],
      },
      {
        id: "four-laws",
        type: "heading",
        level: 2,
        text: "3. The four-law framework simplifies habit design",
      },
      {
        id: "four-laws-p1",
        type: "paragraph",
        text: "The book organizes habit formation around four practical ideas: make the cue obvious, make the behavior attractive, make the action easy, and make the result satisfying. For reducing an unwanted habit, the direction can be reversed: make it less visible, less attractive, more difficult, and less rewarding.",
      },
      {
        id: "four-laws-list",
        type: "list",
        style: "ordered",
        items: [
          "Make it obvious: design visible cues and clear triggers.",
          "Make it attractive: connect the action with something you value.",
          "Make it easy: reduce friction and lower the starting effort.",
          "Make it satisfying: create immediate evidence that the action was completed.",
        ],
      },
      {
        id: "environment",
        type: "heading",
        level: 2,
        text: "4. Environment often matters more than intention",
      },
      {
        id: "environment-p1",
        type: "paragraph",
        text: "Willpower is unreliable when the environment continuously pushes in the opposite direction. A visible book is easier to pick up than one hidden away. A distracting application is easier to open when it sits on the first screen. Small changes in placement, defaults, and access can change which behavior requires the least effort.",
      },
      {
        id: "environment-note",
        type: "callout",
        tone: "note",
        title: "Design the default",
        text: "When possible, arrange the environment so the useful action is the easiest obvious next step.",
      },
      {
        id: "two-minute",
        type: "heading",
        level: 2,
        text: "5. Start with a version too small to resist",
      },
      {
        id: "two-minute-p1",
        type: "paragraph",
        text: "One of the book’s practical strategies is to shrink the beginning of a habit. The first action should be easy enough that starting does not require a large motivational push. The tiny version is not the final ambition; it is a reliable doorway into the larger behavior.",
      },
      {
        id: "tracking",
        type: "heading",
        level: 2,
        text: "6. Make consistency visible without worshipping the streak",
      },
      {
        id: "tracking-p1",
        type: "paragraph",
        text: "Tracking can provide immediate feedback and make repetition visible. But the measurement is useful only when it supports the behavior rather than becoming the goal itself. A missed day is less important than how quickly the system returns to normal. The deeper objective is a resilient pattern, not a perfect calendar.",
      },
      {
        id: "quote",
        type: "quote",
        text: "A sustainable habit system should make returning easier than quitting.",
        attribution: "ABHIDEA summary principle",
      },
      { id: "divider", type: "divider" },
      {
        id: "take",
        type: "closure",
        variant: "abhidea-take",
        title: "The most useful lesson is to redesign friction",
        text: "Many habit problems are treated as motivation problems. The framework is more practical when it makes us ask where friction sits: What is too hard to start? What unwanted behavior is too easy to access? Changing that friction can make consistency less dependent on mood.",
      },
      {
        id: "conclusion",
        type: "closure",
        variant: "conclusion",
        title: "Build a system that survives ordinary days",
        text: "A useful habit should not depend on your best day. Make the cue clear, the first step small, the environment supportive, and the return after a missed day simple. Small actions matter most when the system keeps bringing you back to them.",
      },
    ],
  },
  sources: [
    {
      id: "book",
      title: "Atomic Habits",
      authorOrOrg: "James Clear",
    },
    {
      id: "demo-note",
      title: "ABHIDEA original demo summary written for Reader UI testing",
      authorOrOrg: "ABHIDEA",
    },
  ],
  related: [
    {
      title: "Attention Is a Skill",
      description: "Test the Article format and Reader comfort controls on another long read.",
      href: "/en/read/attention-is-a-skill-demo",
    },
    {
      title: "Learning System Demo",
      description: "Return to the original structured Reader QA article.",
      href: "/en/read/learning-system-demo",
    },
    {
      title: "Book Summaries",
      description: "Return to the Book Summary knowledge hub.",
      href: "/explore/type/book-summary",
    },
  ],
};

const atomicHabitsHi: ReaderFixture = {
  locale: "hi",
  slug: "atomic-habits-saar-demo",
  alternateLocale: "en",
  alternateSlug: "atomic-habits-summary-demo",
  title: "Atomic Habits — पुस्तक सारांश",
  summary:
    "James Clear के छोटे व्यवहारिक बदलावों को आसान, दोहराने योग्य और टिकाऊ बनाने वाले ढाँचे का Reader डेमो सारांश।",
  eyebrow: "डेमो Book Summary · प्रकाशित सामग्री नहीं",
  contentType: "Book Summary",
  subjects: ["Books & Learning", "Personal Growth"],
  readingTime: "12 मिनट पढ़ना",
  body: {
    schemaVersion: 1,
    blocks: [
      {
        id: "opening",
        type: "paragraph",
        text: "Atomic Habits का मुख्य विचार है कि अर्थपूर्ण बदलाव कई बार बड़े प्रेरणात्मक प्रयासों से नहीं, बल्कि छोटे कामों को लगातार दोहराने से बनता है। पुस्तक ऐसे सिस्टम बनाने पर जोर देती है जिनमें अच्छा व्यवहार करना आसान और अनचाहा व्यवहार दोहराना कठिन हो। यह डेमो सारांश ABHIDEA Reader परीक्षण के लिए मौलिक भाषा में लिखा गया है और पुस्तक का विकल्प नहीं है।",
      },
      {
        id: "core-idea",
        type: "heading",
        level: 2,
        text: "1. छोटे सुधार दोहराव से महत्त्वपूर्ण बनते हैं",
      },
      {
        id: "core-idea-p1",
        type: "paragraph",
        text: "एक छोटा काम अकेले में नगण्य लग सकता है। प्रभाव तब दिखता है जब वही काम इतना दोहराया जाए कि वह पैटर्न बन जाए। इससे ध्यान केवल आज के परिणाम से हटकर उस दिशा पर जाता है जिसे हमारा सिस्टम सामान्य बना रहा है। उपयोगी प्रश्न यह भी है कि कौन-सा व्यवहार बार-बार दोहरकर हमारी दिनचर्या का हिस्सा बन रहा है।",
      },
      {
        id: "system-callout",
        type: "callout",
        tone: "key-idea",
        title: "अलग लक्ष्य से अधिक उपयोगी सिस्टम",
        text: "लक्ष्य हमें परिणाम बताता है; सिस्टम उस दोहराने योग्य प्रक्रिया को बताता है जो परिणाम की संभावना बढ़ाती है।",
      },
      {
        id: "identity",
        type: "heading",
        level: 2,
        text: "2. आदतें पहचान को मजबूत कर सकती हैं",
      },
      {
        id: "identity-p1",
        type: "paragraph",
        text: "पुस्तक व्यवहार को पहचान से जोड़ती है: बार-बार किए गए काम उस व्यक्ति के लिए प्रमाण बनते हैं जैसा हम स्वयं को मानना चाहते हैं। इसलिए आदत केवल पूरा किया जाने वाला काम नहीं रहती। उदाहरण के लिए बीस मिनट पढ़ना केवल पन्ने खत्म करना नहीं, बल्कि लगातार सीखने वाले व्यक्ति की पहचान को मजबूत करना भी हो सकता है।",
      },
      {
        id: "identity-list",
        type: "list",
        style: "unordered",
        items: [
          "तय करें कि आप कौन-सी पहचान या गुण मजबूत करना चाहते हैं।",
          "उसके लिए बहुत छोटा प्रमाण देने वाला व्यवहार चुनें।",
          "उसे इतना दोहराएँ कि वह परिचित और स्वाभाविक लगे।",
          "एक बार छूट जाने को अपनी पूरी पहचान का प्रमाण न बनाएँ।",
        ],
      },
      {
        id: "four-laws",
        type: "heading",
        level: 2,
        text: "3. चार नियम आदत डिजाइन को सरल बनाते हैं",
      },
      {
        id: "four-laws-p1",
        type: "paragraph",
        text: "पुस्तक आदत बनाने को चार व्यावहारिक विचारों में व्यवस्थित करती है: संकेत को स्पष्ट बनाओ, व्यवहार को आकर्षक बनाओ, कार्रवाई को आसान बनाओ और परिणाम को संतोषजनक बनाओ। अनचाही आदत घटाने के लिए यही दिशा उलटी की जा सकती है: उसे कम दिखाई देने वाला, कम आकर्षक, अधिक कठिन और कम संतोषजनक बनाओ।",
      },
      {
        id: "four-laws-list",
        type: "list",
        style: "ordered",
        items: [
          "स्पष्ट बनाओ: दिखने वाले संकेत और साफ़ ट्रिगर बनाओ।",
          "आकर्षक बनाओ: काम को किसी मूल्यवान चीज़ से जोड़ो।",
          "आसान बनाओ: घर्षण घटाओ और शुरुआती प्रयास छोटा करो।",
          "संतोषजनक बनाओ: पूरा होने का तुरंत दिखाई देने वाला संकेत बनाओ।",
        ],
      },
      {
        id: "environment",
        type: "heading",
        level: 2,
        text: "4. वातावरण कई बार इरादे से अधिक प्रभाव डालता है",
      },
      {
        id: "environment-p1",
        type: "paragraph",
        text: "जब वातावरण लगातार विपरीत दिशा में धक्का देता है, तब इच्छाशक्ति भरोसेमंद नहीं रहती। सामने रखी किताब उठाना आसान है, छिपी किताब नहीं। पहले स्क्रीन पर मौजूद विचलित करने वाला ऐप खोलना भी आसान है। जगह, डिफ़ॉल्ट और पहुँच में छोटे बदलाव उस व्यवहार को बदल सकते हैं जिसमें सबसे कम प्रयास लगता है।",
      },
      {
        id: "environment-note",
        type: "callout",
        tone: "note",
        title: "डिफ़ॉल्ट डिजाइन करें",
        text: "जहाँ संभव हो वातावरण ऐसा रखें कि उपयोगी व्यवहार सबसे आसान और स्पष्ट अगला कदम बने।",
      },
      {
        id: "two-minute",
        type: "heading",
        level: 2,
        text: "5. शुरुआत इतनी छोटी करें कि विरोध करना मुश्किल हो",
      },
      {
        id: "two-minute-p1",
        type: "paragraph",
        text: "पुस्तक की व्यावहारिक रणनीतियों में एक है आदत की शुरुआत को बहुत छोटा करना। पहला काम इतना आसान हो कि शुरू करने के लिए बड़े प्रेरणात्मक धक्के की जरूरत न पड़े। यह छोटा संस्करण अंतिम लक्ष्य नहीं, बड़े व्यवहार में प्रवेश का भरोसेमंद दरवाज़ा है।",
      },
      {
        id: "tracking",
        type: "heading",
        level: 2,
        text: "6. निरंतरता को दिखाई दें, लेकिन streak को लक्ष्य न बना दें",
      },
      {
        id: "tracking-p1",
        type: "paragraph",
        text: "ट्रैकिंग तुरंत प्रतिक्रिया दे सकती है और दोहराव को दिखाई देने योग्य बनाती है। लेकिन माप तभी उपयोगी है जब वह व्यवहार की मदद करे, स्वयं लक्ष्य न बन जाए। एक दिन छूटना उतना महत्त्वपूर्ण नहीं जितना यह कि सिस्टम कितनी जल्दी सामान्य पैटर्न पर लौटता है। गहरा उद्देश्य लचीला पैटर्न है, परफेक्ट कैलेंडर नहीं।",
      },
      {
        id: "quote",
        type: "quote",
        text: "टिकाऊ आदत का सिस्टम ऐसा होना चाहिए जिसमें छोड़ने से अधिक आसान वापस लौटना हो।",
        attribution: "ABHIDEA summary principle",
      },
      { id: "divider", type: "divider" },
      {
        id: "take",
        type: "closure",
        variant: "abhidea-take",
        title: "सबसे उपयोगी सीख है घर्षण को दोबारा डिजाइन करना",
        text: "कई आदत समस्याओं को हम प्रेरणा की समस्या मान लेते हैं। ढाँचा तब अधिक व्यावहारिक होता है जब हम पूछते हैं: कौन-सा अच्छा काम शुरू करना बहुत कठिन है? कौन-सा अनचाहा व्यवहार बहुत आसान है? इस घर्षण को बदलना निरंतरता को मूड पर कम निर्भर कर सकता है।",
      },
      {
        id: "conclusion",
        type: "closure",
        variant: "conclusion",
        title: "ऐसा सिस्टम बनाएँ जो सामान्य दिनों में भी चले",
        text: "उपयोगी आदत को आपके सबसे अच्छे दिन पर निर्भर नहीं होना चाहिए। संकेत स्पष्ट रखें, पहला कदम छोटा रखें, वातावरण सहायक रखें और छूटने के बाद वापसी आसान रखें। छोटे काम तब सबसे अधिक मायने रखते हैं जब सिस्टम आपको बार-बार उनके पास वापस लाता है।",
      },
    ],
  },
  sources: [
    { id: "book", title: "Atomic Habits", authorOrOrg: "James Clear" },
    {
      id: "demo-note",
      title: "Reader UI परीक्षण के लिए ABHIDEA द्वारा लिखा गया मौलिक डेमो सारांश",
      authorOrOrg: "ABHIDEA",
    },
  ],
  related: [
    {
      title: "ध्यान एक कौशल है",
      description: "दूसरे लंबे लेख पर Reader comfort controls जाँचें।",
      href: "/hi/read/dhyan-ek-kaushal-hai-demo",
    },
    {
      title: "सीखने की प्रणाली डेमो",
      description: "मूल structured Reader QA लेख पर वापस जाएँ।",
      href: "/hi/read/seekhne-ki-pranali-demo",
    },
    {
      title: "Book Summaries",
      description: "Book Summary knowledge hub पर वापस जाएँ।",
      href: "/explore/type/book-summary",
    },
  ],
};

const demoFixtures: ReaderFixture[] = [
  attentionArticleEn,
  attentionArticleHi,
  atomicHabitsEn,
  atomicHabitsHi,
];

export function getDemoReaderFixture(locale: ReaderLocale, slug: string): ReaderFixture | null {
  return demoFixtures.find((fixture) => fixture.locale === locale && fixture.slug === slug) ?? null;
}
