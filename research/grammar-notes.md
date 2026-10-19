# Croatian grammar and notation notes for the translator

Condensed into the system prompt in `shared/prompt.js`. Full reference here.

## Numbers and case
- 1 (21, 31...) → nominative singular; 2-4 (22-24...) → paucal (looks like gen. sg.); 5-20 and tens → genitive plural.
- minuta: 1 minuta, 3 minute, 10 minuta. sat: 1 sat, 2 sata, 5 sati. kilometar: 1 kilometar, 4 kilometra, 20 kilometara. metar: 1 metar, 3 metra, 100 metara. sekunda: 1 sekunda, 2 sekunde, 30 sekundi. serija: 1 serija, 3 serije, 6 serija. ponavljanje: 1 ponavljanje, 2 ponavljanja, 8 ponavljanja. tjedan: 1 tjedan, 2 tjedna, 6 tjedana. krug: 1 krug, 2 kruga, 5 krugova.
- After prepositions, genitive: ispod 4:00/km, preko 200 W, oko 150 otkucaja, između 140 i 150, do 2 sata, od 30 sekundi.

## Verb aspect
- Imperfective for habit or plan: trčati, plivati, voziti, trenirati, raditi. Perfective for a finished session: istrčati / otrčati, otplivati, odvoziti, istrenirati, odraditi.
- "Odradio sam trening" = I did the workout. "Treniram pet puta tjedno" = I train five times a week.
- Pairs: ubrzati/ubrzavati, usporiti/usporavati, zagrijati se/zagrijavati se, istegnuti se/istezati se, odmoriti se/odmarati se, oporaviti se/oporavljati se, popiti/piti, pojesti/jesti.

## Address and register
- Coach to athlete: "ti" + 2nd sg. imperative (trči, plivaj, vozi, drži, odradi, pazi, javi mi, pošalji, uzmi, pij, nemoj). "Vi" forms only for a group or formal context.
- Negative imperative: "nemoj + infinitive" (nemoj forsirati) is softer and more common in speech than "ne forsiraj".
- Plan lines are often noun phrases, not sentences: "Lagano 45'", "Trčanje 60 min zona 2", "Odmor". Translate as EN plan shorthand.
- 1st person plural is a common coaching register: "Idemo 3x10' na pragu", "Danas radimo brick", "Smanjujemo volumen".
- Vocative when addressing by name: Ivan → Ivane, Petar → Petre; Marko, Ana, Luka unchanged. Translate as the base name.

## Clitics and reflexives
- Clitics (sam, si, je, smo, ste, su; mi, ti, mu, ga, se, li) sit in second position: "Odradio sam ga", "Kako ti je bilo?", "Jesi li se zagrijao?". Never start a sentence with "se" or "sam".
- Reflexive verbs are everywhere in training speech: zagrijati se, istegnuti se, odmoriti se, oporaviti se, osjećati se, umoriti se, natjecati se, pripremati se, razbiti se (slang). "se" has no English equivalent.

## Formats
- Run pace "4:30/km" or "4:30 min/km". Swim pace "1:45/100 m" or "1:45 na 100". Send-off "na 1:45". Race times H:MM:SS. Durations 60', 90', "1h30", "2 sata". Power "250 W" with a space. Cadence "90 okr/min" (bike), "koraka u minuti" (run). HR "puls 150", "150 otk./min".
- Decimal comma is standard Croatian (2,5 km) but sport writing often uses a point. Thousands may use a dot or space (1.250 m, 11 000 m). HR→EN: convert to point, drop dot thousands separators. EN→HR: comma correct, point tolerated.
- 24-hour clock: 6:30, 18:00, "u 7 sati", "u 6 ujutro". No am/pm.
- Dates: 18.10.2026. (trailing dot) or "18. listopada 2026." Months lowercase, genitive after the day: siječnja, veljače, ožujka, travnja, svibnja, lipnja, srpnja, kolovoza, rujna, listopada, studenoga, prosinca. Weekdays lowercase: pon, uto, sri, čet, pet, sub, ned.
- Ordinals take a dot: 1. tranzicija, 2. krug, 3. mjesto.
- Percent: "80 % FSmax", "90% max pulsa", "% FTP-a".
- Ranges: hyphen or "do" (280-290 W, 1 do 3 sata). Alternation "/" (30"/30"). "+" joins consecutive segments.

## Prepositions
- na treningu (at practice), na biciklu (on the bike), na traci / na trenažeru, na bazenu (at the pool, colloquial), u bazenu (in the pool), u vodi, u moru, na utrci (at the race), u utrci (during the race), na stazi (on the course), u zoni 2, na pragu, u teretani, na otvorenom, na 100 m (per 100 m).
- "ići na plivanje / na bicikl / na trčanje" = go swimming / riding / running.

## Loanwords with Croatian endings
- brick → brickovi, brickove; set → setovi; interval → intervali; sprint → sprintovi; drill → drilovi; trail → traila; neopren → neoprena.
- Initialisms take a hyphen: FTP-a, FTP-u, TSS-a, TP-u. Platforms decline: na Stravi, na Zwiftu, na Garminu. Verbs: zwiftati, uploadati, sinkati.
- Athletes and many coaches keep in English: brick, sweet spot, threshold, pace, long run, tempo run, build, drill, catch, sighting, drafting, race pace, negative split, taper, FTP, TSS, NP, IF, CTL, open water, trisuit, aero, race belt, PB. (Dejan himself avoids pace / long run / taper / FTP / sweet spot; see dejan-site-notes.md.)

## Ambiguities to resolve by context
- tempo: pace (min/km) or a tempo workout.
- dionica: race leg, training rep distance, or Garmin lap.
- snaga: power (W) or strength (gym).
- odmor: rest interval or rest day; pauza is usually the within-workout rest.
- rad ruku: pull set (swim) or arm swing (run).

## Gender agreement
- trening (m), utrka (f), tranzicija (f), vožnja (f), plivanje (n), trčanje (n), bicikl (m). Adjectives agree: lagani trening, lagana vožnja, lagano plivanje, duga vožnja, dugi trening.
- Discipline nouns double as leg names: "plivanje ok, bicikl dobar, trčanje teško" = swim ok, bike good, run hard.

## Slang and diminutives (keep informal in EN)
- laganica (easy jog), tempić (short tempo), brdašca (little hills), desetka (10K), stotka (100 km or 100 m), polovica (half Ironman), dvojka (zone 2), krepan (wrecked), razbio sam se (crashed, or smashed myself).

## Do not produce in Croatian output (Serbian/Bosnian forms)
- trka → utrka, nedelja → tjedan, patike → tenisice, zagrevanje → zagrijavanje, povreda → ozljeda (recognize in input), vežba → vježba, deonica → dionica, takmičenje → natjecanje, zamor → umor (both exist; umor is everyday).

## Regional flavor
- Dalmatian: gušt, fjaka, đir, štrapac, ajme, ča; sea/wind words bura, jugo, more, uvala. Zagreb kajkavian: kaj, fakat, baš, -l participles ("si odradil?"). Keep as informal English; do not translate bura/jugo.

## Capitalization
- Lowercase: sports, months, days, nationality adjectives (hrvatski, triatlon, listopad, ponedjeljak). Capitals: Ironman, Zwift, Garmin, Strava, Prvenstvo Hrvatske.

## Questions
- "Jesi li odradio?", colloquial "Si odradio?", "Kako je bilo?". English needs the auxiliary ("Did you...").

## Notation in plans
- Sets: 10x100 m, 8x50, 5x4', 3x10'. Nested: 3x(8' zona 3 + 2' lagano), 4x(4x25 + 200 m).
- Rest: R=30", P=30", "pauza 30 s", "odmor 1'"; between sets vs reps: "pauza 20'' između ponavljanja, 4' između serija".
- ' = minutes, " or '' = seconds. Hours "1h", "2 sata", "1h30".
- Zones: Z1-Z5 or "zona 1" to "zona 5" (Dejan: always "zona N"). Garmin HR zone descriptors; Polar: jako lagano / lagano / umjereno / teško / maksimalno.
- Swim intensity codes in club plans: A1, A2, A3, Sp, REC; ANP.
- RPE: "po osjećaju", "na 7 od 10", "7/10", lagano / umjereno / teško / maksimalno, "razgovorni tempo", "all-out". Borg 6-20 or CR-10.
- Session headers: Zagrijavanje / Glavni dio / Isplivavanje (swim) or Hlađenje. Totals "Ukupno: 3200 m". Weekly plans: pon/uto/sri/čet/pet/sub/ned; disciplines P (plivanje), B (bicikl), T (trčanje), S (snaga).
- Categories: M40, Ž35, "40+", U9/U11/U15/U17 for youth.
