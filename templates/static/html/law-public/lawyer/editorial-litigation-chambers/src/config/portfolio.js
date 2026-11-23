/**
 * Portfolio content and settings.
 * ---------------------------------------------------------------------------
 * Everything a new owner is likely to change lives here: the name, the copy,
 * the practice areas, the matters, the credentials, the contact details and
 * the section labels used by the index rail. Markup, styles and behaviour stay
 * in index.html, src/styles/main.css and src/main.js.
 */

export const site = {
  brand: {
    name: 'Meridian Counsel',
    mark: 'MC',
    tagline: 'Appellate & Commercial Litigation',
    established: 'Est. 1978',
    places: 'New York · London',
    /** Shown in the browser tab and in the page description. */
    title: 'Meridian Counsel — Appellate & Commercial Litigation',
    description:
      'An appellate and commercial litigation chambers of fourteen advocates in New York and London. Appeals, arbitrations, and the disputes that end up in one.'
  },

  /** Right-hand index rail. `id` must match the section's element id. */
  sections: [
    { id: 'counsel', number: '01', label: 'Counsel', title: 'Counsel & Chambers' },
    { id: 'practice', number: '02', label: 'Practice', title: 'Practice Areas' },
    { id: 'matters', number: '03', label: 'Matters', title: 'Representative Matters' },
    { id: 'publications', number: '04', label: 'Record', title: 'Publications & Admissions' },
    { id: 'process', number: '05', label: 'Process', title: 'Client Process' },
    { id: 'consultation', number: '06', label: 'Contact', title: 'Consultation & Chambers' }
  ],

  hero: {
    kicker: 'Chambers of appellate & commercial counsel',
    titleLines: [
      { text: 'The argument', accent: false },
      { text: 'that decides.', accent: true }
    ],
    lede:
      'A fourteen-advocate chambers for appeals, arbitrations and the commercial disputes that end up in one. We are retained when the record is closed and the language has to carry the case.',
    meta: [
      { label: 'Founded', value: '1978' },
      { label: 'Chambers', value: '41 Worth Street, New York' },
      { label: 'Jurisdictions', value: 'Twenty-three' }
    ],
    primaryCta: { label: 'Request a consultation', target: 'consultation' },
    secondaryCta: { label: 'The practice', target: 'practice' },
    caption: 'Courthouse colonnade, golden hour',
    /** Photograph direction shown under the hero, small caps. */
    credit: 'Photograph made for these chambers'
  },

  philosophy: {
    number: '01',
    label: 'Counsel & chambers',
    heading: ['A chambers built for', 'the last word.'],
    paragraphs: [
      'Meridian Counsel was founded on an unfashionable premise: that an appeal is not a second trial but a second reading. By the time a matter reaches us the facts are fixed, the record is what it is, and the only thing left to argue is what it means. That is a discipline of selection — of the two issues worth preserving and the fourteen worth abandoning.',
      'We keep the chambers small on purpose. Four partners, fourteen advocates, no satellite offices, and a rule that the person who argues the appeal writes the brief. Our practice is concentrated in the federal courts of appeals, the New York Court of Appeals and international arbitration, where the same skill is decisive: the ability to make a complicated record sound inevitable in a sentence.',
      'Clients come to us from trial counsel who would rather not lose the case twice. We read the whole record, we tell them early if the appeal is not worth taking, and when it is, we prepare for the bench we will actually face — including the moot courts that have become the chambers’ least glamorous and most reliable habit.'
    ],
    pullQuote: 'An appeal is not a second trial. It is a second reading.',
    plate: {
      src: './assets/briefing-desk.jpg',
      alt: 'A fountain pen resting on a bound legal brief on an oak desk, lit by early morning window light.',
      caption: 'The briefing desk at 41 Worth Street. The ribbon marks the volume of record at argument; it is the only decoration in the room.'
    },
    stats: [
      { value: '147', label: 'Appeals argued' },
      { value: '23', label: 'Jurisdictions' },
      { value: '11', label: 'Judicial clerkships' },
      { value: '14', label: 'Advocates' }
    ]
  },

  practice: {
    number: '02',
    label: 'Practice areas',
    heading: ['Four practices,', 'one temperament.'],
    intro:
      'We accept instructions in four areas and decline more matters than we take. Select a practice to read how it is run.',
    detailLabel: 'Selected practice',
    items: [
      {
        id: 'appellate',
        number: 'i',
        title: 'Appellate Litigation',
        summary:
          'Post-trial and interlocutory appeals in the federal courts of appeals and the New York courts, from the notice of appeal to the petition for rehearing.',
        detail:
          'We are usually brought in after judgment, when the issues have narrowed to the ones a court will actually reach. The work begins with the record: what was preserved, what was waived, and which two questions the panel can be persuaded to decide. We argue our own appeals and prepare for each one with three sittings of moot court.',
        forums: ['U.S. Supreme Court', 'Second Circuit', 'Ninth Circuit', 'D.C. Circuit', 'New York Court of Appeals'],
        counsel: 'H. Sterling',
        note: 'Briefed and argued by the same advocate.'
      },
      {
        id: 'regulatory',
        number: 'ii',
        title: 'Regulatory & Antitrust',
        summary:
          'Merger review, conduct investigations and the administrative appeals that follow, before the federal agencies and the courts that review them.',
        detail:
          'Our regulatory practice sits where the administrative record meets the appellate brief: Hart-Scott-Rodino second requests, FTC and DOJ conduct inquiries, and the Article III appeals that come after. We are equally comfortable negotiating a consent decree and dismantling one.',
        forums: ['Federal Trade Commission', 'U.S. Department of Justice', 'D.C. Circuit', 'Southern District of New York'],
        counsel: 'Marcus Adjei',
        note: 'Economics briefed from the record, not from policy.'
      },
      {
        id: 'arbitration',
        number: 'iii',
        title: 'Cross-Border Arbitration',
        summary:
          'Commercial and investor-state arbitration under the ICC, LCIA, SIAC and ICSID rules, and the enforcement and set-aside proceedings that follow.',
        detail:
          'We sit as counsel in arbitrations seated in London, Singapore and New York, and appear in the national courts where awards are enforced or challenged. The chambers’ appellate habit — narrow issues, clean record, no wasted sentence — travels well to a tribunal of three.',
        forums: ['ICC', 'LCIA', 'SIAC', 'ICSID', 'English High Court'],
        counsel: 'Priya Raghunathan',
        note: 'Seated where enforcement will happen.'
      },
      {
        id: 'constitutional',
        number: 'iv',
        title: 'Constitutional & IP',
        summary:
          'First Amendment, due process and statutory challenges, and the patent and trademark appeals where the law is still unsettled.',
        detail:
          'A small, deliberately selective practice for questions of law that outlive the parties: licensing regimes, compelled speech, the boundaries of agency deference, and the patent eligibility appeals that keep returning to the Federal Circuit. We take fewer of these matters and prepare them further.',
        forums: ['Federal Circuit', 'Second Circuit', 'New York Court of Appeals', 'U.S. Supreme Court'],
        counsel: 'H. Sterling',
        note: 'Fewer matters, prepared further.'
      }
    ]
  },

  matters: {
    number: '03',
    label: 'Representative matters',
    heading: ['The record,', 'and what it decided.'],
    intro:
      'Four matters that reached a final disposition in the last three years. Expand a matter for the brief note.',
    expandLabel: 'Brief note',
    items: [
      {
        id: 'matter-sovereign',
        numeral: 'I',
        title: 'Sovereign immunity in a telecoms dispute',
        court: 'U.S. Court of Appeals for the Second Circuit',
        year: '2024',
        outcome: 'Vacated and remanded',
        posture: 'Appeal from the Southern District of New York',
        summary:
          'A state-owned carrier invoked immunity after ten years of litigation. We took the matter on the eve of the reply brief.',
        note:
          'The district court had treated the carrier’s commercial activity as sovereign throughout. On appeal we narrowed the question to a single instrument — a wholesale capacity agreement — and argued that its terms were those of a merchant, not a state. The panel agreed, vacated the judgment and remanded for jurisdictional discovery. The matter settled eight months later on terms the client has asked us not to disclose.',
        counsel: 'H. Sterling · M. Adjei'
      },
      {
        id: 'matter-merger',
        numeral: 'II',
        title: 'Merger review of a regional health system',
        court: 'U.S. Court of Appeals for the D.C. Circuit',
        year: '2023',
        outcome: 'Clearance affirmed',
        posture: 'Appeal from the Federal Trade Commission',
        summary: 'A six-hospital merger challenged on a theory of cross-market harm.',
        note:
          'The Commission’s administrative law judge had accepted a novel cross-market theory without evidence of patient flow. We briefed the record economics, not the policy, and argued that the agency had inverted its own burden. The Commission reversed its administrative law judge and closed the investigation; the Court of Appeals denied the petition for review in an unpublished order.',
        counsel: 'M. Adjei · P. Raghunathan'
      },
      {
        id: 'matter-award',
        numeral: 'III',
        title: 'Set-aside of a $240 million ICC award',
        court: 'English High Court, Commercial Court',
        year: '2023',
        outcome: 'Award upheld',
        posture: 'ICC arbitration, London seat',
        summary:
          'A joint-venture partner sought to set aside an award on jurisdiction and serious irregularity grounds.',
        note:
          'The challenge rested on the tribunal’s treatment of a side letter that never entered the record. We reconstructed the procedural history from the transcripts and showed that the point had been available and abandoned. The Court refused the challenge on all four grounds and ordered costs; enforcement followed in two jurisdictions without further resistance.',
        counsel: 'P. Raghunathan'
      },
      {
        id: 'matter-licensing',
        numeral: 'IV',
        title: 'A licensing regime and the First Amendment',
        court: 'New York Court of Appeals',
        year: '2022',
        outcome: 'Statute held invalid',
        posture: 'Certified question from the Second Circuit',
        summary:
          'An occupational licensing scheme that gave an official unbridled discretion over protected speech.',
        note:
          'The Second Circuit certified the state constitutional question; we argued it in Albany. The Court held the regime an unlawful prior restraint and reversed the judgment below. The legislature replaced the statute the following session — the outcome our client had actually asked for.',
        counsel: 'H. Sterling'
      }
    ]
  },

  interlude: {
    src: './assets/chambers-library.jpg',
    alt: 'A dark timber-panelled law library with leather-bound reporters and brass reading lamps along a long table.',
    quote: 'The record is the argument.',
    attribution: 'Chambers reading room, after hours',
    caption: 'The appellate library, 41 Worth Street'
  },

  credentials: {
    number: '04',
    label: 'Publications & admissions',
    heading: ['Written down,', 'on the record.'],
    intro:
      'Articles, addresses and the courts in which the chambers is admitted. Reprints are available on request.',
    groups: {
      articles: {
        title: 'Law review & journals',
        items: [
          {
            year: '2024',
            title: 'Cross-Market Harm After the Merger Guidelines',
            venue: 'Antitrust Law Journal, Vol. 88',
            authors: 'M. Adjei'
          },
          {
            year: '2023',
            title: 'The Preserved Objection: A Defense of Waiver Doctrine',
            venue: 'Columbia Law Review, Vol. 123',
            authors: 'H. Sterling & M. Adjei'
          },
          {
            year: '2022',
            title: 'Reading the Record: Notes on Appellate Judgment',
            venue: 'Yale Law Journal Forum',
            authors: 'H. Sterling'
          },
          {
            year: '2021',
            title: 'Discretion and the Licensing State',
            venue: 'N.Y.U. Law Review, Vol. 96',
            authors: 'P. Raghunathan'
          }
        ]
      },
      speaking: {
        title: 'Addresses',
        items: [
          { year: '2025', title: 'Moot Court as Method', venue: 'Columbia Law School, Appellate Advocacy Seminar' },
          { year: '2024', title: 'The Second Circuit’s Summary Order Problem', venue: 'Federal Bar Council, New York' },
          { year: '2023', title: 'Arbitration and the Courts That Review It', venue: 'ICC Institute, London' }
        ]
      },
      admissions: {
        title: 'Admissions',
        items: [
          'New York, 1989',
          'U.S. Supreme Court, 1994',
          'Second Circuit',
          'Ninth Circuit',
          'D.C. Circuit',
          'Federal Circuit',
          'England & Wales, Solicitor-Advocate'
        ]
      },
      clerkships: {
        title: 'Clerkships held',
        items: [
          'Hon. A. R. Sandoval, U.S. Court of Appeals for the Second Circuit, 1991–92',
          'Hon. L. M. Whitfield, U.S. District Court, S.D.N.Y., 1993–94',
          'Hon. K. Osei, New York Court of Appeals, 2004–05'
        ]
      }
    }
  },

  process: {
    number: '05',
    label: 'Client process',
    heading: ['How the work', 'is done.'],
    intro:
      'Three stages, each with a written product and a fixed fee agreed before it begins. Nothing about the sequence is unusual; the discipline is in keeping it.',
    plate: {
      src: './assets/courtroom-bench.jpg',
      alt: 'An empty appellate courtroom in warm walnut with a raised bench and tall arched windows.',
      caption: 'Courtroom 9, before the sitting'
    },
    steps: [
      {
        number: '01',
        kicker: 'Ten days',
        title: 'Case assessment',
        body:
          'We read the record before we quote a fee. Ten days later the client has a written assessment: the two issues worth arguing, the parts of the record that support them, and an honest view of the odds. If the appeal should not be taken, we say so and send the file back.',
        deliverable: 'Written assessment · fixed fee'
      },
      {
        number: '02',
        kicker: 'Sixty to ninety days',
        title: 'Discovery & strategy',
        body:
          'Record review, issue preservation and the architecture of the brief — the order of the arguments, the sentence that carries each one, and the pages of the record the panel will be shown. Nothing is filed that has not been read aloud.',
        deliverable: 'Opening brief · joint appendix'
      },
      {
        number: '03',
        kicker: 'Before the sitting',
        title: 'Oral advocacy',
        body:
          'Three moot courts before a live argument, each with a bench drawn from outside the matter and instructed to be hostile. The advocate the client meets at the first meeting is the advocate who stands up.',
        deliverable: 'Moot bench · oral argument'
      }
    ],
    footnote:
      'Standard appellate engagement: written assessment within ten days of receipt of the record; opening brief within ninety days of the record’s filing. Fees are fixed by stage, in writing, before work begins.'
  },

  contact: {
    number: '06',
    label: 'Consultation & chambers',
    heading: ['Retained when the record', 'is closed.'],
    intro:
      'Initial consultations are forty-five minutes with a partner, without charge, and are held at the chambers or by telephone. Bring the judgment and the record; we will tell you what is left to argue.',
    email: 'hello@example.com',
    phone: '+1 212 555 0184',
    phoneHref: '+12125550184',
    address: ['41 Worth Street, 28th Floor', 'New York, NY 10013'],
    hours: ['Monday to Friday, 08:30–18:30 ET', 'Saturday reading appointments by request'],
    offices: [
      { city: 'New York', lines: ['41 Worth Street, 28th Floor', 'New York, NY 10013'] },
      { city: 'London', lines: ['12 Bell Yard, Temple', 'London WC2A 2JR'] }
    ],
    cta: 'Request a consultation',
    copyLabel: 'Copy email',
    copiedLabel: 'Copied',
    form: {
      title: 'Request a consultation',
      note:
        'Four fields, a partner reads every one. Alternatively write directly to hello@example.com or telephone +1 212 555 0184.',
      matters: [
        'Appellate litigation',
        'Regulatory & antitrust',
        'Cross-border arbitration',
        'Constitutional & IP',
        'Something else'
      ],
      submit: 'Compose the request',
      successTitle: 'Your mail client should be opening.',
      successBody:
        'If nothing happens, write to hello@example.com with the same details — or copy the message below.'
    }
  },

  footer: {
    note:
      'A portfolio demonstration. Meridian Counsel is a fictional chambers; the matters, figures and people on this page are illustrative.',
    columns: [
      { title: 'Chambers', lines: ['41 Worth Street, 28th Floor', 'New York, NY 10013', '+1 212 555 0184'] },
      { title: 'Practice', lines: ['Appellate litigation', 'Regulatory & antitrust', 'Cross-border arbitration', 'Constitutional & IP'] },
      { title: 'The site', lines: ['Photography made for this portfolio', 'Set in Cormorant Garamond & Inter', 'No audio, no tracking'] }
    ],
    legal: '© 2026 Meridian Counsel'
  }
};
