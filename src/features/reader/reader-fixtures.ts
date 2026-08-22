import type { ReaderDocumentV1, ReaderLocale } from "./document-schema";
import type { ResolvedReaderMedia } from "./structured-document-renderer";

export type ReaderSource = {
  id: string;
  title: string;
  authorOrOrg?: string;
  url?: string;
};

export type RelatedKnowledge = {
  title: string;
  description: string;
  href: string;
};

export type ReaderFixture = {
  locale: ReaderLocale;
  slug: string;
  alternateLocale: ReaderLocale;
  alternateSlug: string;
  title: string;
  summary: string;
  eyebrow: string;
  contentType: string;
  subjects: string[];
  readingTime: string;
  body: ReaderDocumentV1;
  sources: ReaderSource[];
  related: RelatedKnowledge[];
};

const englishBody: ReaderDocumentV1 = {
  schemaVersion: 1,
  blocks: [
    {
      id: "opening",
      type: "paragraph",
      text: "Most learning systems fail for a simple reason: they are designed around collecting information instead of changing understanding. A bookmark, highlight, saved video, or long note can feel productive, but none of them guarantees that an idea will still be clear a week later. A durable learning system starts with attention, then turns what you noticed into something you can explain, connect, revisit, and use.",
    },
    {
      id: "first-principle",
      type: "heading",
      level: 2,
      text: "1. Start with a question, not a pile of material",
    },
    {
      id: "question-paragraph-1",
      type: "paragraph",
      text: "Before opening a book, article, or lecture, write down what you are trying to understand. A question gives your attention a job. It also gives you a way to judge whether the reading helped. Without that anchor, it is easy to move through pages while remembering only fragments that happened to sound interesting.",
    },
    {
      id: "question-callout",
      type: "callout",
      tone: "key-idea",
      title: "A useful test",
      text: "If you cannot state the question you are trying to answer, you may be gathering information before you have decided what the information is for.",
    },
    {
      id: "active-reading",
      type: "heading",
      level: 2,
      text: "2. Read actively enough to notice structure",
    },
    {
      id: "active-reading-paragraph",
      type: "paragraph",
      text: "Active reading does not mean highlighting every sentence. It means noticing the shape of an argument: what problem is being discussed, what claim is being made, what evidence or example supports it, what assumptions are present, and where the idea stops being useful. This structure is far easier to recall than an undifferentiated wall of notes.",
    },
    {
      id: "active-list",
      type: "list",
      style: "unordered",
      items: [
        "Pause after a meaningful section and restate it in your own words.",
        "Separate the author’s claim from the example used to explain it.",
        "Mark uncertainty instead of pretending every passage is understood.",
        "Capture only notes that will help you think later, not every detail you encountered.",
      ],
    },
    {
      id: "reader-system-figure",
      type: "figure",
      mediaId: "reader-learning-loop",
      alt: "A simple learning loop showing Question, Read, Explain, Connect, and Revisit as five connected stages.",
      caption: "A compact learning loop: give attention a question, process the material, explain it, connect it, then revisit it.",
      credit: "ABHIDEA Reader QA diagram",
    },
    {
      id: "explain",
      type: "heading",
      level: 2,
      text: "3. Explain before you store",
    },
    {
      id: "explain-paragraph-1",
      type: "paragraph",
      text: "The moment after reading is valuable because the material is still available in working memory. Instead of immediately filing notes away, close the source and explain the idea without looking. Where the explanation becomes vague, you have found the edge of your understanding. Returning to the source at that point is more useful than rereading everything from the beginning.",
    },
    {
      id: "explain-quote",
      type: "quote",
      text: "A note becomes more useful when it records what you understood, not merely what you saw.",
      attribution: "ABHIDEA learning principle",
    },
    {
      id: "connections",
      type: "heading",
      level: 2,
      text: "4. Connect new knowledge to something already known",
    },
    {
      id: "connections-paragraph",
      type: "paragraph",
      text: "Isolated facts are expensive to remember. Connected ideas have more routes back into memory. Ask what the new idea resembles, what it contradicts, where you have seen it in practice, and what earlier concept it changes. A useful personal knowledge system therefore stores relationships as carefully as it stores individual notes.",
    },
    {
      id: "connections-note",
      type: "callout",
      tone: "note",
      title: "Connection prompts",
      text: "Try: What does this remind me of? Where would this fail? What earlier belief does it strengthen or weaken? What could I do differently because I understand this now?",
    },
    {
      id: "revisit",
      type: "heading",
      level: 2,
      text: "5. Revisit for retrieval, not for decoration",
    },
    {
      id: "revisit-paragraph-1",
      type: "paragraph",
      text: "A beautiful archive can become a museum that you rarely enter. Revisit notes by trying to retrieve the main idea before rereading it. A short review that forces recall is often more revealing than a long passive reread. The goal is not to preserve every sentence forever; it is to keep useful knowledge available when a real problem, decision, or conversation needs it.",
    },
    {
      id: "revisit-list",
      type: "list",
      style: "ordered",
      items: [
        "Write a one-sentence explanation from memory.",
        "Check the original note and correct what was missing or distorted.",
        "Add one new connection, example, or question.",
        "Remove material that no longer deserves attention.",
      ],
    },
    {
      id: "divider-before-closure",
      type: "divider",
    },
    {
      id: "abhidea-take",
      type: "closure",
      variant: "abhidea-take",
      title: "Learning is a cycle of compression and reconnection",
      text: "The strongest system is not the one that stores the most. It is the one that repeatedly compresses information into clearer understanding and reconnects that understanding to questions, experiences, and future action.",
    },
    {
      id: "conclusion",
      type: "closure",
      variant: "conclusion",
      title: "Build a small loop you can actually repeat",
      text: "Choose one question, read one useful source, explain the main idea without looking, connect it to something you already know, and revisit it later. A simple loop repeated consistently is more valuable than an elaborate system that turns learning into maintenance work.",
    },
  ],
};

const hindiBody: ReaderDocumentV1 = {
  schemaVersion: 1,
  blocks: [
    {
      id: "opening",
      type: "paragraph",
      text: "सीखने की बहुत-सी प्रणालियाँ एक साधारण कारण से कमजोर पड़ जाती हैं: उनका ध्यान समझ बदलने के बजाय जानकारी इकट्ठी करने पर होता है। बुकमार्क, हाइलाइट, सेव किया हुआ वीडियो या लंबा नोट उपयोगी लग सकता है, लेकिन इससे यह तय नहीं होता कि एक सप्ताह बाद भी विचार साफ़ याद रहेगा। टिकाऊ सीखने की प्रणाली ध्यान से शुरू होती है और फिर देखी हुई बात को ऐसी समझ में बदलती है जिसे हम समझा सकें, जोड़ सकें, दोबारा याद कर सकें और काम में ला सकें।",
    },
    {
      id: "first-principle",
      type: "heading",
      level: 2,
      text: "1. सामग्री के ढेर से नहीं, एक प्रश्न से शुरू करें",
    },
    {
      id: "question-paragraph-1",
      type: "paragraph",
      text: "किताब, लेख या व्याख्यान खोलने से पहले लिखें कि आप वास्तव में क्या समझना चाहते हैं। प्रश्न आपके ध्यान को एक काम देता है। इससे यह भी पता चलता है कि पढ़ाई ने आपकी मदद की या नहीं। प्रश्न के बिना हम कई पन्ने पढ़ सकते हैं, लेकिन अंत में वही टुकड़े याद रहते हैं जो उस समय दिलचस्प लगे थे।",
    },
    {
      id: "question-callout",
      type: "callout",
      tone: "key-idea",
      title: "एक उपयोगी जाँच",
      text: "यदि आप एक वाक्य में नहीं बता सकते कि आप किस प्रश्न का उत्तर खोज रहे हैं, तो संभव है कि आप उद्देश्य तय करने से पहले जानकारी जमा कर रहे हों।",
    },
    {
      id: "active-reading",
      type: "heading",
      level: 2,
      text: "2. इतना सक्रिय पढ़ें कि विचार की संरचना दिखने लगे",
    },
    {
      id: "active-reading-paragraph",
      type: "paragraph",
      text: "सक्रिय पढ़ना हर वाक्य को हाइलाइट करना नहीं है। इसका अर्थ है तर्क की बनावट पहचानना: समस्या क्या है, मुख्य दावा क्या है, उसे कौन-सा उदाहरण या प्रमाण सहारा देता है, कौन-सी मान्यताएँ छिपी हैं और विचार किन परिस्थितियों में काम नहीं करेगा। ऐसी संरचना बिना क्रम वाले लंबे नोट्स की तुलना में अधिक आसानी से याद रहती है।",
    },
    {
      id: "active-list",
      type: "list",
      style: "unordered",
      items: [
        "महत्त्वपूर्ण भाग के बाद रुककर उसे अपनी भाषा में दोहराएँ।",
        "लेखक के दावे और उसे समझाने वाले उदाहरण को अलग पहचानें।",
        "जहाँ समझ साफ़ नहीं है वहाँ अनिश्चितता लिखें; केवल पढ़ लेने को समझ लेना न मानें।",
        "हर विवरण नहीं, बल्कि वही नोट रखें जो बाद में सोचने में मदद करे।",
      ],
    },
    {
      id: "reader-system-figure",
      type: "figure",
      mediaId: "reader-learning-loop",
      alt: "सीखने का एक सरल चक्र जिसमें प्रश्न, पढ़ना, समझाना, जोड़ना और दोबारा याद करना पाँच जुड़े चरणों के रूप में दिखाए गए हैं।",
      caption: "एक छोटा सीखने का चक्र: प्रश्न तय करें, सामग्री समझें, अपने शब्दों में समझाएँ, पुराने ज्ञान से जोड़ें और बाद में फिर याद करें।",
      credit: "ABHIDEA Reader QA diagram",
    },
    {
      id: "explain",
      type: "heading",
      level: 2,
      text: "3. नोट रखने से पहले विचार को समझाकर देखें",
    },
    {
      id: "explain-paragraph-1",
      type: "paragraph",
      text: "पढ़ने के तुरंत बाद का समय महत्त्वपूर्ण होता है क्योंकि सामग्री अभी कार्यशील स्मृति में होती है। नोट को तुरंत फाइल करने के बजाय स्रोत बंद करें और बिना देखे विचार समझाने की कोशिश करें। जहाँ आपकी व्याख्या धुँधली हो जाती है, वहीं समझ की सीमा दिखाई देती है। उसी बिंदु पर स्रोत में वापस जाना पूरे अध्याय को दोबारा पढ़ने से अधिक उपयोगी हो सकता है।",
    },
    {
      id: "explain-quote",
      type: "quote",
      text: "नोट तब अधिक उपयोगी होता है जब वह यह दर्ज करे कि आपने क्या समझा, केवल यह नहीं कि आपने क्या देखा।",
      attribution: "ABHIDEA learning principle",
    },
    {
      id: "connections",
      type: "heading",
      level: 2,
      text: "4. नए ज्ञान को पहले से ज्ञात किसी बात से जोड़ें",
    },
    {
      id: "connections-paragraph",
      type: "paragraph",
      text: "अलग-थलग तथ्य याद रखना कठिन होता है। जुड़े हुए विचारों तक वापस पहुँचने के कई रास्ते बनते हैं। पूछें कि नया विचार किससे मिलता-जुलता है, किस बात का विरोध करता है, व्यवहार में कहाँ दिखाई देता है और आपकी पुरानी समझ में क्या बदलता है। इसलिए अच्छी व्यक्तिगत ज्ञान प्रणाली केवल नोट नहीं, उनके बीच संबंध भी संभालती है।",
    },
    {
      id: "connections-note",
      type: "callout",
      tone: "note",
      title: "जोड़ बनाने वाले प्रश्न",
      text: "पूछें: यह मुझे किस बात की याद दिलाता है? यह कहाँ असफल हो सकता है? मेरी कौन-सी पुरानी धारणा इससे मजबूत या कमजोर होती है? इसे समझने के बाद मैं क्या अलग कर सकता हूँ?",
    },
    {
      id: "revisit",
      type: "heading",
      level: 2,
      text: "5. सजावट के लिए नहीं, स्मरण के लिए दोबारा लौटें",
    },
    {
      id: "revisit-paragraph-1",
      type: "paragraph",
      text: "बहुत सुंदर नोट-संग्रह भी ऐसा संग्रहालय बन सकता है जिसमें हम शायद ही कभी लौटें। नोट खोलने से पहले मुख्य विचार को याद करने की कोशिश करें। छोटा लेकिन सक्रिय स्मरण अक्सर लंबे निष्क्रिय पुनर्पाठ से अधिक बताता है कि वास्तव में क्या बचा है। लक्ष्य हर वाक्य को हमेशा के लिए सुरक्षित रखना नहीं, बल्कि उपयोगी ज्ञान को तब उपलब्ध रखना है जब किसी समस्या, निर्णय या बातचीत में उसकी आवश्यकता हो।",
    },
    {
      id: "revisit-list",
      type: "list",
      style: "ordered",
      items: [
        "बिना देखे एक वाक्य में मुख्य विचार लिखें।",
        "मूल नोट से मिलाकर छूटी या गलत बात सुधारें।",
        "एक नया संबंध, उदाहरण या प्रश्न जोड़ें।",
        "जो सामग्री अब महत्त्वपूर्ण नहीं है उसे हटाएँ।",
      ],
    },
    {
      id: "divider-before-closure",
      type: "divider",
    },
    {
      id: "abhidea-take",
      type: "closure",
      variant: "abhidea-take",
      title: "सीखना समझ को संक्षिप्त करने और नए संबंध बनाने का चक्र है",
      text: "सबसे मजबूत प्रणाली वह नहीं जो सबसे अधिक जानकारी जमा करे। बेहतर प्रणाली बार-बार जानकारी को साफ़ समझ में बदलती है और उस समझ को प्रश्नों, अनुभवों और भविष्य की कार्रवाई से जोड़ती है।",
    },
    {
      id: "conclusion",
      type: "closure",
      variant: "conclusion",
      title: "ऐसा छोटा चक्र बनाएँ जिसे आप सच में दोहरा सकें",
      text: "एक प्रश्न चुनें, एक उपयोगी स्रोत पढ़ें, बिना देखे मुख्य विचार समझाएँ, उसे पहले से ज्ञात किसी बात से जोड़ें और बाद में फिर याद करें। लगातार दोहराया गया सरल चक्र उस जटिल प्रणाली से अधिक उपयोगी है जो सीखने को केवल व्यवस्था संभालने का काम बना दे।",
    },
  ],
};

const related: RelatedKnowledge[] = [
  {
    title: "Book Summaries",
    description: "Browse distilled lessons and ideas from books as the published library grows.",
    href: "/explore/type/book-summary",
  },
  {
    title: "Guides",
    description: "Explore practical, step-by-step knowledge formats.",
    href: "/explore/type/guide",
  },
  {
    title: "Books & Learning",
    description: "Follow the broader subject hub for learning-focused knowledge.",
    href: "/explore/subject/books-learning",
  },
];

const sources: ReaderSource[] = [
  {
    id: "source-wcag",
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    authorOrOrg: "W3C",
    url: "https://www.w3.org/TR/WCAG22/",
  },
  {
    id: "source-abhidea",
    title: "ABHIDEA Reader Core design and content contract",
    authorOrOrg: "ABHIDEA project documentation",
  },
];

const fixtures: ReaderFixture[] = [
  {
    locale: "en",
    slug: "learning-system-demo",
    alternateLocale: "hi",
    alternateSlug: "seekhne-ki-pranali-demo",
    title: "A Practical System for Learning Deeply",
    summary: "A Reader QA article about turning reading into understanding through questions, explanation, connections, and retrieval.",
    eyebrow: "Reader QA Sample · Not published content",
    contentType: "Guide",
    subjects: ["Books & Learning", "Personal Growth"],
    readingTime: "8 min read",
    body: englishBody,
    sources,
    related,
  },
  {
    locale: "hi",
    slug: "seekhne-ki-pranali-demo",
    alternateLocale: "en",
    alternateSlug: "learning-system-demo",
    title: "गहराई से सीखने की एक व्यावहारिक प्रणाली",
    summary: "प्रश्न, अपनी भाषा में व्याख्या, संबंध और सक्रिय स्मरण के माध्यम से पढ़ाई को समझ में बदलने वाला Reader QA लेख।",
    eyebrow: "रीडर QA नमूना · प्रकाशित सामग्री नहीं",
    contentType: "Guide",
    subjects: ["Books & Learning", "Personal Growth"],
    readingTime: "8 मिनट पढ़ना",
    body: hindiBody,
    sources,
    related,
  },
];

export function getReaderFixture(locale: ReaderLocale, slug: string): ReaderFixture | null {
  return fixtures.find((fixture) => fixture.locale === locale && fixture.slug === slug) ?? null;
}

export function resolveReaderFixtureMedia(mediaId: string): ResolvedReaderMedia | null {
  if (mediaId !== "reader-learning-loop") return null;
  return {
    src: "/reader-learning-loop.svg",
    width: 1280,
    height: 720,
  };
}
