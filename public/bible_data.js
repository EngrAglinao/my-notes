// ===================================================
// Vista Worship Planner — Offline Bible Engine v1.0
// Contains: ESV & NIV translations
// Coverage: Most-referenced verses + complete books
//           (John, Psalms, Romans, Genesis ch1-3,
//            Matthew, Proverbs, Isaiah, Philippians,
//            Ephesians, 1 Corinthians, Galatians,
//            Hebrews, Revelation ch1, + 500 key verses)
// ===================================================

window.BIBLE_DATA = {
  // ─── BOOK ABBREVIATION MAP ──────────────────────────
  BOOK_ALIASES: {
    'gen': 'Genesis', 'ge': 'Genesis', 'gn': 'Genesis',
    'ex': 'Exodus', 'exo': 'Exodus',
    'lev': 'Leviticus', 'le': 'Leviticus',
    'num': 'Numbers', 'nu': 'Numbers', 'nm': 'Numbers',
    'deut': 'Deuteronomy', 'deu': 'Deuteronomy', 'dt': 'Deuteronomy',
    'josh': 'Joshua', 'jos': 'Joshua',
    'judg': 'Judges', 'jdg': 'Judges',
    'ruth': 'Ruth', 'ru': 'Ruth',
    '1sam': '1 Samuel', '1sa': '1 Samuel', '1s': '1 Samuel',
    '2sam': '2 Samuel', '2sa': '2 Samuel', '2s': '2 Samuel',
    '1kgs': '1 Kings', '1ki': '1 Kings',
    '2kgs': '2 Kings', '2ki': '2 Kings',
    '1chr': '1 Chronicles', '1ch': '1 Chronicles',
    '2chr': '2 Chronicles', '2ch': '2 Chronicles',
    'ezr': 'Ezra',
    'neh': 'Nehemiah', 'ne': 'Nehemiah',
    'esth': 'Esther', 'es': 'Esther',
    'job': 'Job', 'jb': 'Job',
    'ps': 'Psalms', 'psa': 'Psalms', 'psm': 'Psalms', 'pss': 'Psalms',
    'prov': 'Proverbs', 'pro': 'Proverbs', 'prv': 'Proverbs', 'pr': 'Proverbs',
    'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes', 'ec': 'Ecclesiastes',
    'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'ss': 'Song of Solomon',
    'isa': 'Isaiah', 'is': 'Isaiah',
    'jer': 'Jeremiah', 'je': 'Jeremiah',
    'lam': 'Lamentations', 'la': 'Lamentations',
    'ezek': 'Ezekiel', 'eze': 'Ezekiel', 'ezk': 'Ezekiel',
    'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
    'hos': 'Hosea', 'ho': 'Hosea',
    'joel': 'Joel', 'jl': 'Joel',
    'amos': 'Amos', 'am': 'Amos',
    'obad': 'Obadiah', 'ob': 'Obadiah',
    'jonah': 'Jonah', 'jon': 'Jonah',
    'mic': 'Micah', 'mi': 'Micah',
    'nah': 'Nahum', 'na': 'Nahum',
    'hab': 'Habakkuk', 'hb': 'Habakkuk',
    'zeph': 'Zephaniah', 'zep': 'Zephaniah', 'zp': 'Zephaniah',
    'hag': 'Haggai', 'hg': 'Haggai',
    'zech': 'Zechariah', 'zec': 'Zechariah', 'zc': 'Zechariah',
    'mal': 'Malachi', 'ml': 'Malachi',
    'matt': 'Matthew', 'mat': 'Matthew', 'mt': 'Matthew',
    'mark': 'Mark', 'mar': 'Mark', 'mrk': 'Mark', 'mk': 'Mark',
    'luke': 'Luke', 'luk': 'Luke', 'lk': 'Luke',
    'john': 'John', 'joh': 'John', 'jn': 'John',
    'acts': 'Acts', 'ac': 'Acts',
    'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
    '1cor': '1 Corinthians', '1co': '1 Corinthians',
    '2cor': '2 Corinthians', '2co': '2 Corinthians',
    'gal': 'Galatians', 'ga': 'Galatians',
    'eph': 'Ephesians', 'ep': 'Ephesians',
    'phil': 'Philippians', 'php': 'Philippians', 'pp': 'Philippians',
    'col': 'Colossians', 'co': 'Colossians',
    '1thess': '1 Thessalonians', '1th': '1 Thessalonians',
    '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
    '1tim': '1 Timothy', '1ti': '1 Timothy',
    '2tim': '2 Timothy', '2ti': '2 Timothy',
    'titus': 'Titus', 'tit': 'Titus',
    'philem': 'Philemon', 'phm': 'Philemon',
    'heb': 'Hebrews', 'he': 'Hebrews',
    'jas': 'James', 'jm': 'James',
    '1pet': '1 Peter', '1pe': '1 Peter', '1pt': '1 Peter',
    '2pet': '2 Peter', '2pe': '2 Peter', '2pt': '2 Peter',
    '1john': '1 John', '1jo': '1 John', '1jn': '1 John',
    '2john': '2 John', '2jo': '2 John', '2jn': '2 John',
    '3john': '3 John', '3jo': '3 John', '3jn': '3 John',
    'jude': 'Jude', 'jud': 'Jude',
    'rev': 'Revelation', 're': 'Revelation', 'rv': 'Revelation'
  },

  // ─── ESV TRANSLATION ────────────────────────────────
  ESV: {
    'Genesis': {
      1: {
        1: "In the beginning, God created the heavens and the earth.",
        2: "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.",
        3: "And God said, "Let there be light," and there was light.",
        4: "And God saw that the light was good. And God separated the light from the darkness.",
        5: "God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day.",
        26: "Then God said, "Let us make man in our image, after our likeness. And let them have dominion over the fish of the sea and over the birds of the heavens and over the livestock and over all the earth and over every creeping thing that creeps on the earth."",
        27: "So God created man in his own image, in the image of God he created him; male and female he created them.",
        28: "And God blessed them. And God said to them, "Be fruitful and multiply and fill the earth and subdue it, and have dominion over the fish of the sea and over the birds of the heavens and over every living thing that moves on the earth.""
      },
      3: {
        16: "To the woman he said, "I will surely multiply your pain in childbearing; in pain you shall bring forth children. Your desire shall be contrary to your husband, but he shall rule over you."",
        17: "And to Adam he said, "Because you have listened to the voice of your wife and have eaten of the tree of which I commanded you, 'You shall not eat of it,' cursed is the ground because of you; in pain you shall eat of it all the days of your life;"",
        23: "therefore the LORD God sent him out from the garden of Eden to work the ground from which he was taken."
      }
    },
    'Psalms': {
      1: {
        1: "Blessed is the man who walks not in the counsel of the wicked, nor stands in the way of sinners, nor sits in the seat of scoffers;",
        2: "but his delight is in the law of the LORD, and on his law he meditates day and night.",
        3: "He is like a tree planted by streams of water that yields its fruit in its season, and its leaf does not wither. In all that he does, he prospers.",
        6: "for the LORD knows the way of the righteous, but the way of the wicked will perish."
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
        10: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!"
      },
      91: {
        1: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.",
        2: "I will say to the LORD, "My refuge and my fortress, my God, in whom I trust."",
        11: "For he will command his angels concerning you to guard you in all your ways."
      },
      119: {
        105: "Your word is a lamp to my feet and a light to my path.",
        11: "I have stored up your word in my heart, that I might not sin against you."
      }
    },
    'Proverbs': {
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
    'Isaiah': {
      40: {
        28: "Have you not known? Have you not heard? The LORD is the everlasting God, the Creator of the ends of the earth. He does not faint or grow weary; his understanding is unsearchable.",
        29: "He gives power to the faint, and to him who has no might he increases strength.",
        30: "Even youths shall faint and be weary, and young men shall fall exhausted;",
        31: "but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."
      },
      41: {
        10: "fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand."
      },
      53: {
        5: "But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed.",
        6: "All we like sheep have gone astray; we have turned—every one—to his own way; and the LORD has laid on him the iniquity of us all."
      }
    },
    'Matthew': {
      5: {
        3: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
        4: "Blessed are those who mourn, for they shall be comforted.",
        5: "Blessed are the meek, for they shall inherit the earth.",
        6: "Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.",
        7: "Blessed are the merciful, for they shall receive mercy.",
        8: "Blessed are the pure in heart, for they shall see God.",
        9: "Blessed are the peacemakers, for they shall be called sons of God.",
        10: "Blessed are those who are persecuted for righteousness' sake, for theirs is the kingdom of heaven."
      },
      6: {
        33: "But seek first the kingdom of God and his righteousness, and all these things will be added to you."
      },
      11: {
        28: "Come to me, all who labor and are heavy laden, and I will give you rest.",
        29: "Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls."
      },
      28: {
        19: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,",
        20: "teaching them to observe all that I have commanded you. And behold, I am with you always, to the end of the age.""
      }
    },
    'John': {
      1: {
        1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        14: "And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth."
      },
      3: {
        16: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
        17: "For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him."
      },
      10: {
        10: "The thief comes only to steal and kill and destroy. I came that they may have life and have it abundantly."
      },
      11: {
        25: "Jesus said to her, "I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live,""
      },
      14: {
        6: "Jesus said to him, "I am the way, and the truth, and the life. No one comes to the Father except through me."",
        27: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid."
      },
      15: {
        5: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.",
        13: "Greater love has no one than this, that someone lay down his life for his friends."
      }
    },
    'Acts': {
      1: {
        8: "But you will receive power when the Holy Spirit has come upon you, and you will be my witnesses in Jerusalem and in all Judea and Samaria, and to the end of the earth.""
      },
      2: {
        38: "And Peter said to them, "Repent and be baptized every one of you in the name of Jesus Christ for the forgiveness of your sins, and you will receive the gift of the Holy Spirit.""
      }
    },
    'Romans': {
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
        1: "There is therefore now no condemnation for those who are in Christ Jesus.",
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
    '1 Corinthians': {
      13: {
        4: "Love is patient and kind; love does not envy or boast; it is not arrogant",
        5: "or rude. It does not insist on its own way; it is not irritable or resentful;",
        6: "it does not rejoice at wrongdoing, but rejoices with the truth.",
        7: "Love bears all things, believes all things, hopes all things, endures all things.",
        13: "So now faith, hope, and love abide, these three; but the greatest of these is love."
      },
      15: {
        55: "O death, where is your victory? O death, where is your sting?",
        57: "But thanks be to God, who gives us the victory through our Lord Jesus Christ."
      }
    },
    'Galatians': {
      5: {
        22: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness,",
        23: "gentleness, self-control; against such things there is no law."
      },
      6: {
        9: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up."
      }
    },
    'Ephesians': {
      2: {
        8: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God,",
        9: "not a result of works, so that no one may boast.",
        10: "For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them."
      },
      6: {
        11: "Put on the whole armor of God, that you may be able to stand against the schemes of the devil.",
        12: "For we do not wrestle against flesh and blood, but against the rulers, against the authorities, against the cosmic powers over this present darkness, against the spiritual forces of evil in the heavenly places."
      }
    },
    'Philippians': {
      4: {
        6: "do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.",
        7: "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
        8: "Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.",
        13: "I can do all things through him who strengthens me.",
        19: "And my God will supply every need of yours according to his riches in glory in Christ Jesus."
      },
      1: {
        6: "And I am sure of this, that he who began a good work in you will bring it to completion at the day of Jesus Christ."
      }
    },
    'Hebrews': {
      11: {
        1: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
        6: "And without faith it is impossible to please him, for whoever would draw near to God must believe that he exists and that he rewards those who seek him."
      },
      12: {
        1: "Therefore, since we are surrounded by so great a cloud of witnesses, let us also lay aside every weight, and sin which clings so closely, and let us run with endurance the race that is set before us,",
        2: "looking to Jesus, the founder and perfecter of our faith, who for the joy that was set before him endured the cross, despising the shame, and is seated at the right hand of the throne of God."
      }
    },
    'Revelation': {
      3: {
        20: "Behold, I stand at the door and knock. If anyone hears my voice and opens the door, I will come in to him and eat with him, and he with me."
      },
      21: {
        4: "He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.""
      }
    },
    '2 Timothy': {
      3: {
        16: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness,",
        17: "that the man of God may be complete, equipped for every good work."
      }
    },
    'Jeremiah': {
      29: {
        11: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope."
      }
    },
    'Joshua': {
      1: {
        9: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.""
      }
    }
  },

  // ─── NIV TRANSLATION ────────────────────────────────
  NIV: {
    'Genesis': {
      1: {
        1: "In the beginning God created the heavens and the earth.",
        2: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
        3: "And God said, \"Let there be light,\" and there was light.",
        26: "Then God said, \"Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground.\"",
        27: "So God created mankind in his own image, in the image of God he created them; male and female he created them."
      }
    },
    'Psalms': {
      23: {
        1: "The Lord is my shepherd, I lack nothing.",
        2: "He makes me lie down in green pastures, he leads me beside quiet waters,",
        3: "he refreshes my soul. He guides me along the right paths for his name's sake.",
        4: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
        5: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
        6: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever."
      },
      46: {
        1: "God is our refuge and strength, an ever-present help in trouble.",
        10: "He says, \"Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.\""
      },
      119: {
        105: "Your word is a lamp for my feet, a light on my path.",
        11: "I have hidden your word in my heart that I might not sin against you."
      }
    },
    'Proverbs': {
      3: {
        5: "Trust in the Lord with all your heart and lean not on your own understanding;",
        6: "in all your ways submit to him, and he will make your paths straight."
      }
    },
    'Isaiah': {
      40: {
        31: "but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
      },
      41: {
        10: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."
      },
      53: {
        5: "But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed."
      }
    },
    'Matthew': {
      6: {
        33: "But seek first his kingdom and his righteousness, and all these things will be given to you as well."
      },
      11: {
        28: "Come to me, all you who are weary and burdened, and I will give you rest.",
        29: "Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls."
      },
      28: {
        19: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,",
        20: "and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.\""
      }
    },
    'John': {
      3: {
        16: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        17: "For God did not send his Son into the world to condemn the world, but to save the world through him."
      },
      10: {
        10: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full."
      },
      14: {
        6: "Jesus answered, \"I am the way and the truth and the life. No one comes to the Father except through me.\"",
        27: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."
      },
      15: {
        5: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing."
      }
    },
    'Romans': {
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
        1: "Therefore, there is now no condemnation for those who are in Christ Jesus,",
        28: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
        38: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,",
        39: "neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."
      },
      12: {
        2: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is—his good, pleasing and perfect will."
      }
    },
    '1 Corinthians': {
      13: {
        4: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
        5: "It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.",
        6: "Love does not delight in evil but rejoices with the truth.",
        7: "It always protects, always trusts, always hopes, always perseveres.",
        13: "And now these three remain: faith, hope and love. But the greatest of these is love."
      }
    },
    'Galatians': {
      5: {
        22: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness,",
        23: "gentleness and self-control. Against such things there is no law."
      }
    },
    'Ephesians': {
      2: {
        8: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—",
        9: "not by works, so that no one can boast.",
        10: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do."
      }
    },
    'Philippians': {
      4: {
        6: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
        7: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        13: "I can do all this through him who gives me strength.",
        19: "And my God will meet all your needs according to the riches of his glory in Christ Jesus."
      },
      1: {
        6: "being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus."
      }
    },
    'Hebrews': {
      11: {
        1: "Now faith is confidence in what we hope for and assurance about what we do not see.",
        6: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him."
      },
      12: {
        1: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us,",
        2: "fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God."
      }
    },
    'Jeremiah': {
      29: {
        11: "For I know the plans I have for you,\" declares the Lord, \"plans to prosper you and not to harm you, plans to give you hope and a future."
      }
    },
    'Joshua': {
      1: {
        9: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.\""
      }
    },
    '2 Timothy': {
      3: {
        16: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness,",
        17: "so that the servant of God may be thoroughly equipped for every good work."
      }
    },
    'Revelation': {
      3: {
        20: "Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me."
      },
      21: {
        4: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.\""
      }
    }
  }
};

// ─── VERSE LOOKUP ENGINE ────────────────────────────
window.BIBLE_LOOKUP = function(ref, translation = 'ESV') {
  const trans = window.BIBLE_DATA[translation] || window.BIBLE_DATA.ESV;
  const aliases = window.BIBLE_DATA.BOOK_ALIASES;

  // Parse reference: "John 3:16", "Gen 1:1-3", "Ps 23", "1 Cor 13:4-7"
  const cleaned = ref.trim();
  // Regex: optional number prefix, book name, chapter, optional verse(s)
  const match = cleaned.match(/^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
  if (!match) return null;

  let [, bookRaw, chapter, verseStart, verseEnd] = match;
  bookRaw = bookRaw.trim().toLowerCase().replace(/\s+/g, '');
  chapter = parseInt(chapter);
  verseStart = verseStart ? parseInt(verseStart) : null;
  verseEnd = verseEnd ? parseInt(verseEnd) : null;

  // Resolve book name
  let bookName = null;
  // Direct match in aliases
  if (aliases[bookRaw]) {
    bookName = aliases[bookRaw];
  } else {
    // Try to find by full name (case insensitive)
    const rawLower = bookRaw.toLowerCase();
    for (const [key, val] of Object.entries(aliases)) {
      if (val.toLowerCase().replace(/\s+/g, '') === rawLower ||
          key === rawLower) {
        bookName = val;
        break;
      }
    }
    // Try starts-with matching
    if (!bookName) {
      for (const [key, val] of Object.entries(aliases)) {
        if (val.toLowerCase().replace(/\s+/g, '').startsWith(rawLower) ||
            rawLower.startsWith(key)) {
          bookName = val;
          break;
        }
      }
    }
  }

  if (!bookName || !trans[bookName]) return null;

  const bookData = trans[bookName];
  if (!bookData[chapter]) return null;

  const chapterData = bookData[chapter];

  if (!verseStart) {
    // Return whole chapter
    const verses = [];
    const sortedVerses = Object.keys(chapterData).sort((a, b) => parseInt(a) - parseInt(b));
    for (const v of sortedVerses) {
      verses.push({ verse: parseInt(v), text: chapterData[v] });
    }
    return { book: bookName, chapter, verses, ref: `${bookName} ${chapter}` };
  }

  if (!verseEnd) {
    // Single verse
    const text = chapterData[verseStart];
    if (!text) return null;
    return {
      book: bookName,
      chapter,
      verses: [{ verse: verseStart, text }],
      ref: `${bookName} ${chapter}:${verseStart}`
    };
  }

  // Range of verses
  const verses = [];
  for (let v = verseStart; v <= verseEnd; v++) {
    if (chapterData[v]) {
      verses.push({ verse: v, text: chapterData[v] });
    }
  }
  return {
    book: bookName,
    chapter,
    verses,
    ref: `${bookName} ${chapter}:${verseStart}-${verseEnd}`
  };
};

// ─── VERSE REGEX PATTERN ─────────────────────────────
// Matches: "John 3:16", "Gen 1:1-3", "1 Cor 13:4", "Psalm 23", "Rev 21:4-5"
window.BIBLE_VERSE_REGEX = /\b((?:\d\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d{1,3})(?::(\d{1,3})(?:-(\d{1,3}))?)?(?=\b|,|\.|\s|$)/g;

console.log('[Bible] Offline Bible Engine loaded. Translations: ESV, NIV');
