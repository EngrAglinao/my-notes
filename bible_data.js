/**
 * bible_data.js — Offline Scripture Database
 * Contains a curated set of commonly-referenced Bible verses in ESV and NIV.
 * Structure: BIBLE_DATA[translation][book][chapter][verse] = "text"
 *
 * Books are keyed by normalized lowercase name.
 * Aliases are mapped via BOOK_ALIASES for fuzzy matching.
 *
 * To extend: add entries following the same nested object pattern.
 */

const BOOK_ALIASES = {
  // Old Testament
  'gen': 'genesis', 'ge': 'genesis',
  'exo': 'exodus', 'ex': 'exodus',
  'lev': 'leviticus', 'le': 'leviticus',
  'num': 'numbers', 'nu': 'numbers',
  'deu': 'deuteronomy', 'de': 'deuteronomy', 'dt': 'deuteronomy',
  'jos': 'joshua', 'josh': 'joshua',
  'jdg': 'judges', 'judg': 'judges',
  'rut': 'ruth',
  '1sa': '1samuel', '1 sa': '1samuel', '1sam': '1samuel', '1 sam': '1samuel',
  '2sa': '2samuel', '2 sa': '2samuel', '2sam': '2samuel', '2 sam': '2samuel',
  '1ki': '1kings', '1 ki': '1kings', '1kgs': '1kings', '1 kgs': '1kings', '1 kings': '1kings',
  '2ki': '2kings', '2 ki': '2kings', '2kgs': '2kings', '2 kgs': '2kings', '2 kings': '2kings',
  '1ch': '1chronicles', '1 ch': '1chronicles', '1chr': '1chronicles',
  '2ch': '2chronicles', '2 ch': '2chronicles', '2chr': '2chronicles',
  'ezr': 'ezra',
  'neh': 'nehemiah',
  'est': 'esther',
  'job': 'job',
  'psa': 'psalms', 'ps': 'psalms', 'psalm': 'psalms',
  'pro': 'proverbs', 'prov': 'proverbs', 'pr': 'proverbs',
  'ecc': 'ecclesiastes', 'eccl': 'ecclesiastes', 'qoh': 'ecclesiastes',
  'sos': 'songofsolomon', 'song': 'songofsolomon', 'ss': 'songofsolomon', 'can': 'songofsolomon',
  'isa': 'isaiah', 'is': 'isaiah',
  'jer': 'jeremiah',
  'lam': 'lamentations',
  'eze': 'ezekiel', 'ezek': 'ezekiel',
  'dan': 'daniel',
  'hos': 'hosea',
  'joe': 'joel', 'jl': 'joel',
  'amo': 'amos',
  'oba': 'obadiah',
  'jon': 'jonah',
  'mic': 'micah',
  'nah': 'nahum',
  'hab': 'habakkuk',
  'zep': 'zephaniah', 'zeph': 'zephaniah',
  'hag': 'haggai',
  'zec': 'zechariah', 'zech': 'zechariah',
  'mal': 'malachi',
  // New Testament
  'mat': 'matthew', 'matt': 'matthew', 'mt': 'matthew',
  'mar': 'mark', 'mk': 'mark',
  'luk': 'luke', 'lk': 'luke',
  'joh': 'john', 'jn': 'john',
  'act': 'acts',
  'rom': 'romans',
  '1co': '1corinthians', '1 co': '1corinthians', '1cor': '1corinthians', '1 cor': '1corinthians', '1 corinthians': '1corinthians',
  '2co': '2corinthians', '2 co': '2corinthians', '2cor': '2corinthians', '2 cor': '2corinthians', '2 corinthians': '2corinthians',
  'gal': 'galatians',
  'eph': 'ephesians',
  'phi': 'philippians', 'php': 'philippians', 'phil': 'philippians',
  'col': 'colossians',
  '1th': '1thessalonians', '1 th': '1thessalonians', '1thes': '1thessalonians', '1 thes': '1thessalonians', '1thess': '1thessalonians',
  '2th': '2thessalonians', '2 th': '2thessalonians', '2thes': '2thessalonians', '2thess': '2thessalonians',
  '1ti': '1timothy', '1 ti': '1timothy', '1tim': '1timothy', '1 tim': '1timothy',
  '2ti': '2timothy', '2 ti': '2timothy', '2tim': '2timothy', '2 tim': '2timothy',
  'tit': 'titus',
  'phm': 'philemon', 'phlm': 'philemon',
  'heb': 'hebrews',
  'jam': 'james', 'jas': 'james',
  '1pe': '1peter', '1 pe': '1peter', '1pet': '1peter', '1 pet': '1peter', '1 peter': '1peter',
  '2pe': '2peter', '2 pe': '2peter', '2pet': '2peter', '2 pet': '2peter', '2 peter': '2peter',
  '1jo': '1john', '1 jo': '1john', '1jn': '1john', '1 jn': '1john', '1 john': '1john',
  '2jo': '2john', '2 jo': '2john', '2jn': '2john', '2 jn': '2john', '2 john': '2john',
  '3jo': '3john', '3 jo': '3john', '3jn': '3john', '3 jn': '3john', '3 john': '3john',
  'jud': 'jude',
  'rev': 'revelation', 're': 'revelation'
};

const BIBLE_DATA = {
  ESV: {
    genesis: {
      1: {
        1: "In the beginning, God created the heavens and the earth.",
        2: "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.",
        3: "And God said, \"Let there be light,\" and there was light.",
        26: "Then God said, \"Let us make man in our image, after our likeness. And let them have dominion over the fish of the sea and over the birds of the heavens and over the livestock and over all the earth and over every creeping thing that creeps on the earth.\"",
        27: "So God created man in his own image, in the image of God he created him; male and female he created them."
      },
      3: {
        16: "To the woman he said, \"I will surely multiply your pain in childbearing; in pain you shall bring forth children. Your desire shall be contrary to your husband, but he shall rule over you.\""
      }
    },
    psalms: {
      1: {
        1: "Blessed is the man who walks not in the counsel of the wicked, nor stands in the way of sinners, nor sits in the seat of scoffers;",
        2: "but his delight is in the law of the LORD, and on his law he meditates day and night.",
        3: "He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither. In all that he does, he prospers."
      },
      23: {
        1: "The LORD is my shepherd; I shall not want.",
        2: "He makes me lie down in green pastures. He leads me beside still waters.",
        3: "He restores my soul. He leads me in paths of righteousness for his name's sake.",
        4: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
        5: "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.",
        6: "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever."
      },
      46: {
        1: "God is our refuge and strength, a very present help in trouble.",
        10: "\"Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!\""
      },
      91: {
        1: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.",
        2: "I will say to the LORD, \"My refuge and my fortress, my God, in whom I trust.\"",
        11: "For he will command his angels concerning you to guard you in all your ways."
      },
      119: {
        105: "Your word is a lamp to my feet and a light to my path.",
        11: "I have stored up your word in my heart, that I might not sin against you."
      }
    },
    proverbs: {
      3: {
        5: "Trust in the LORD with all your heart, and do not lean on your own understanding.",
        6: "In all your ways acknowledge him, and he will make straight your paths."
      },
      4: {
        23: "Keep your heart with all vigilance, for from it flow the springs of life."
      },
      22: {
        6: "Train up a child in the way he should go; even when he is old he will not depart from it."
      }
    },
    isaiah: {
      40: {
        28: "Have you not known? Have you not heard? The LORD is the everlasting God, the Creator of the ends of the earth. He does not faint or grow weary; his understanding is unsearchable.",
        29: "He gives power to the faint, and to him who has no might he increases strength.",
        30: "Even youths shall faint and be weary, and young men shall fall exhausted;",
        31: "but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."
      },
      41: {
        10: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand."
      },
      53: {
        5: "But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed.",
        6: "All we like sheep have gone astray; we have turned—every one—to his own way; and the LORD has laid on him the iniquity of us all."
      }
    },
    jeremiah: {
      29: {
        11: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.",
        12: "Then you will call upon me and come and pray to me, and I will hear you.",
        13: "You will seek me and find me, when you seek me with all your heart."
      }
    },
    matthew: {
      5: {
        3: "\"Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
        4: "\"Blessed are those who mourn, for they shall be comforted.",
        5: "\"Blessed are the meek, for they shall inherit the earth.",
        6: "\"Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.",
        7: "\"Blessed are the merciful, for they shall receive mercy.",
        8: "\"Blessed are the pure in heart, for they shall see God.",
        9: "\"Blessed are the peacemakers, for they shall be called sons of God."
      },
      6: {
        9: "Pray then like this: \"Our Father in heaven, hallowed be your name.",
        10: "Your kingdom come, your will be done, on earth as it is in heaven.",
        33: "But seek first the kingdom of God and his righteousness, and all these things will be added to you."
      },
      28: {
        19: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,",
        20: "teaching them to observe all that I have commanded you. And behold, I am with you always, to the end of the age.\""
      }
    },
    john: {
      1: {
        1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        14: "And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth."
      },
      3: {
        16: "\"For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
        17: "For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him."
      },
      10: {
        10: "The thief comes only to steal and kill and destroy. I came that they may have life and have it abundantly."
      },
      11: {
        25: "Jesus said to her, \"I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live,"
      },
      14: {
        6: "Jesus said to him, \"I am the way, and the truth, and the life. No one comes to the Father except through me.",
        27: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid."
      },
      15: {
        5: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing."
      }
    },
    acts: {
      1: {
        8: "But you will receive power when the Holy Spirit has come upon you, and you will be my witnesses in Jerusalem and in all Judea and Samaria, and to the end of the earth.\""
      },
      2: {
        38: "And Peter said to them, \"Repent and be baptized every one of you in the name of Jesus Christ for the forgiveness of your sins, and you will receive the gift of the Holy Spirit."
      }
    },
    romans: {
      3: {
        23: "for all have sinned and fall short of the glory of God,"
      },
      5: {
        8: "but God shows his love for us in that while we were still sinners, Christ died for us."
      },
      6: {
        23: "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord."
      },
      8: {
        28: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
        38: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers,",
        39: "nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord."
      },
      10: {
        9: "because, if you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved.",
        10: "For with the heart one believes and is justified, and with the mouth one confesses and is saved."
      },
      12: {
        1: "I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship.",
        2: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect."
      }
    },
    '1corinthians': {
      13: {
        4: "Love is patient and kind; love does not envy or boast; it is not arrogant",
        5: "or rude. It does not insist on its own way; it is not irritable or resentful;",
        6: "it does not rejoice at wrongdoing, but rejoices with the truth.",
        7: "Love bears all things, believes all things, hopes all things, endures all things.",
        13: "So now faith, hope, and love abide, these three; but the greatest of these is love."
      }
    },
    '2corinthians': {
      5: {
        17: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.",
        21: "For our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God."
      },
      12: {
        9: "But he said to me, \"My grace is sufficient for you, for my power is made perfect in weakness.\" Therefore I will boast all the more gladly of my weaknesses, so that the power of Christ may rest upon me."
      }
    },
    galatians: {
      5: {
        22: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness,",
        23: "gentleness, self-control; against such things there is no law."
      }
    },
    ephesians: {
      2: {
        8: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God,",
        9: "not a result of works, so that no one may boast."
      },
      4: {
        32: "Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you."
      },
      6: {
        11: "Put on the whole armor of God, that you may be able to stand against the schemes of the devil."
      }
    },
    philippians: {
      4: {
        6: "do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.",
        7: "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
        8: "Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.",
        13: "I can do all things through him who strengthens me.",
        19: "And my God will supply every need of yours according to his riches in glory in Christ Jesus."
      }
    },
    colossians: {
      3: {
        2: "Set your minds on things that are above, not on things that are on earth.",
        17: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him."
      }
    },
    '1thessalonians': {
      5: {
        16: "Rejoice always,",
        17: "pray without ceasing,",
        18: "give thanks in all circumstances; for this is the will of God in Christ Jesus for you."
      }
    },
    '2timothy': {
      3: {
        16: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness,",
        17: "that the man of God may be complete, equipped for every good work."
      }
    },
    hebrews: {
      11: {
        1: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
        6: "And without faith it is impossible to please him, for whoever would draw near to God must believe that he exists and that he rewards those who seek him."
      },
      12: {
        1: "Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us,"
      }
    },
    james: {
      1: {
        2: "Count it all joy, my brothers, when you meet trials of various kinds,",
        3: "for you know that the testing of your faith produces steadfastness.",
        5: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him."
      }
    },
    '1peter': {
      5: {
        7: "casting all your anxieties on him, because he cares for you."
      }
    },
    '1john': {
      1: {
        9: "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness."
      },
      4: {
        8: "Anyone who does not love does not know God, because God is love.",
        19: "We love because he first loved us."
      }
    },
    revelation: {
      3: {
        20: "Behold, I stand at the door and knock. If anyone hears my voice and opens the door, I will come in to him and eat with him, and he with me."
      },
      21: {
        4: "He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.\""
      }
    }
  },
  NIV: {
    genesis: {
      1: {
        1: "In the beginning God created the heavens and the earth.",
        2: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
        3: "And God said, \"Let there be light,\" and there was light.",
        26: "Then God said, \"Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground.\"",
        27: "So God created mankind in his own image, in the image of God he created them; male and female he created them."
      }
    },
    psalms: {
      23: {
        1: "The LORD is my shepherd, I lack nothing.",
        2: "He makes me lie down in green pastures, he leads me beside quiet waters,",
        3: "he refreshes my soul. He guides me along the right paths for his name's sake.",
        4: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
        5: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
        6: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever."
      },
      46: {
        1: "God is our refuge and strength, an ever-present help in trouble.",
        10: "He says, \"Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.\""
      },
      119: {
        105: "Your word is a lamp for my feet, a light on my path."
      }
    },
    proverbs: {
      3: {
        5: "Trust in the LORD with all your heart and lean not on your own understanding;",
        6: "in all your ways submit to him, and he will make your paths straight."
      }
    },
    isaiah: {
      40: {
        31: "but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
      },
      41: {
        10: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."
      },
      53: {
        5: "But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed."
      }
    },
    jeremiah: {
      29: {
        11: "For I know the plans I have for you,\" declares the LORD, \"plans to prosper you and not to harm you, plans to give you hope and a future.",
        12: "Then you will call on me and come and pray to me, and I will listen to you.",
        13: "You will seek me and find me when you seek me with all your heart."
      }
    },
    john: {
      3: {
        16: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        17: "For God did not send his Son into the world to condemn the world, but to save the world through him."
      },
      10: {
        10: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full."
      },
      14: {
        6: "Jesus answered, \"I am the way and the truth and the life. No one comes to the Father except through me."
      }
    },
    romans: {
      3: {
        23: "for all have sinned and fall short of the glory of God,"
      },
      5: {
        8: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."
      },
      6: {
        23: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord."
      },
      8: {
        28: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
      },
      12: {
        1: "Therefore, I urge you, brothers and sisters, in view of God's mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.",
        2: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is—his good, pleasing and perfect will."
      }
    },
    '1corinthians': {
      13: {
        4: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
        5: "It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.",
        6: "Love does not delight in evil but rejoices with the truth.",
        7: "It always protects, always trusts, always hopes, always perseveres.",
        13: "And now these three remain: faith, hope and love. But the greatest of these is love."
      }
    },
    '2corinthians': {
      5: {
        17: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"
      },
      12: {
        9: "But he said to me, \"My grace is sufficient for you, for my power is made perfect in weakness.\" Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me."
      }
    },
    galatians: {
      5: {
        22: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness,",
        23: "gentleness and self-control. Against such things there is no law."
      }
    },
    ephesians: {
      2: {
        8: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—",
        9: "not by works, so that no one can boast."
      }
    },
    philippians: {
      4: {
        6: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        7: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        13: "I can do all this through him who gives me strength.",
        19: "And my God will meet all your needs according to the riches of his glory in Christ Jesus."
      }
    },
    '1thessalonians': {
      5: {
        16: "Rejoice always,",
        17: "pray continually,",
        18: "give thanks in all circumstances; for this is God's will for you in Christ Jesus."
      }
    },
    '2timothy': {
      3: {
        16: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness,",
        17: "so that the servant of God may be thoroughly equipped for every good work."
      }
    },
    hebrews: {
      11: {
        1: "Now faith is confidence in what we hope for and assurance about what we do not see.",
        6: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him."
      }
    },
    james: {
      1: {
        2: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds,",
        3: "because you know that the testing of your faith produces perseverance.",
        5: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."
      }
    },
    '1peter': {
      5: {
        7: "Cast all your anxiety on him because he cares for you."
      }
    },
    '1john': {
      1: {
        9: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."
      },
      4: {
        8: "Whoever does not love does not know God, because God is love.",
        19: "We love because he first loved us."
      }
    },
    revelation: {
      21: {
        4: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.\""
      }
    }
  }
};

/**
 * Normalizes a book name string to the key used in BIBLE_DATA.
 * @param {string} rawBook
 * @returns {string|null}
 */
function normalizeBookName(rawBook) {
  if (!rawBook) return null;
  const lower = rawBook.toLowerCase().trim().replace(/\s+/g, ' ');
  // Direct match
  if (BIBLE_DATA.ESV[lower]) return lower;
  // Alias match
  if (BOOK_ALIASES[lower]) {
    const resolved = BOOK_ALIASES[lower];
    if (BIBLE_DATA.ESV[resolved]) return resolved;
  }
  // Try without spaces
  const noSpace = lower.replace(/\s/g, '');
  if (BIBLE_DATA.ESV[noSpace]) return noSpace;
  if (BOOK_ALIASES[noSpace]) {
    const resolved = BOOK_ALIASES[noSpace];
    if (BIBLE_DATA.ESV[resolved]) return resolved;
  }
  return null;
}

/**
 * Looks up Bible verse(s) from the local data.
 * @param {string} translation - 'ESV' or 'NIV'
 * @param {string} book - Book name (will be normalized)
 * @param {number} chapter
 * @param {number} verseStart
 * @param {number|null} verseEnd - If provided, returns a range
 * @returns {{ found: boolean, verses: Array<{num: number, text: string}>, reference: string }}
 */
function lookupVerse(translation, book, chapter, verseStart, verseEnd = null) {
  const normalizedBook = normalizeBookName(book);
  const tr = translation.toUpperCase();

  if (!normalizedBook || !BIBLE_DATA[tr] || !BIBLE_DATA[tr][normalizedBook]) {
    return { found: false, verses: [], reference: `${book} ${chapter}:${verseStart}` };
  }

  const bookData = BIBLE_DATA[tr][normalizedBook];
  if (!bookData[chapter]) {
    return { found: false, verses: [], reference: `${book} ${chapter}:${verseStart}` };
  }

  const chapterData = bookData[chapter];
  const end = verseEnd || verseStart;
  const verses = [];

  for (let v = verseStart; v <= end; v++) {
    if (chapterData[v]) {
      verses.push({ num: v, text: chapterData[v] });
    }
  }

  const displayBook = normalizedBook.replace(/(\d)([a-z])/gi, '$1 $2')
    .replace(/^./, s => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const refStr = verseEnd && verseEnd !== verseStart
    ? `${displayBook} ${chapter}:${verseStart}-${verseEnd}`
    : `${displayBook} ${chapter}:${verseStart}`;

  return {
    found: verses.length > 0,
    verses,
    reference: refStr,
    book: displayBook,
    chapter,
    verseStart,
    verseEnd: end
  };
}

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.BibleDB = { BIBLE_DATA, BOOK_ALIASES, normalizeBookName, lookupVerse };
}
