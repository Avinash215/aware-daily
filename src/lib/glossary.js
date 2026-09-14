/**
 * A bounded, original glossary helps readers unpack specialist news vocabulary
 * without sending their reading to a service or pretending to define every word.
 *
 * Entries reflect this edition's reporting. Matching is deterministic and keeps
 * the source text intact; a caller-owned set can limit explanations to one per story.
 */

export const GLOSSARY = Object.freeze([
  {
    id: 'acquittal',
    term: 'acquittal',
    aliases: ['acquittals'],
    meaning: 'A court decision that a person is not guilty of a criminal charge, rather than a finding that every allegation was false.',
    usage: 'An acquittal would end this trial, although separate civil claims could still continue.',
  },
  {
    id: 'adaptation',
    term: 'adaptation',
    aliases: [],
    meaning: 'A change made to suit new conditions or a different purpose; in climate policy, adjustment to climate effects, and in culture, a reworking of a story for another form such as a film.',
    usage: 'The proposed adaptation budget would fund shaded streets and stronger flood defences.',
  },
  {
    id: 'appeal',
    term: 'appeal',
    aliases: ['appeals', 'appealed'],
    meaning: 'A request for a higher court to review a legal decision, usually because someone argues that the original court made an error.',
    usage: 'The company could appeal if it believes the judge applied the wrong legal standard.',
  },
  {
    id: 'arbitration',
    term: 'arbitration',
    aliases: [],
    meaning: 'A way of resolving a dispute outside court by asking an independent decision-maker to consider both sides and give a ruling.',
    usage: 'The contract would send any dispute over delivery payments to independent arbitration.',
  },
  {
    id: 'artificial-intelligence',
    term: 'artificial intelligence',
    aliases: [],
    meaning: 'Computer systems designed to perform tasks such as recognising patterns, generating language or making predictions that would otherwise require human judgement.',
    usage: 'The hospital could use artificial intelligence to flag scans that need urgent review.',
  },
  {
    id: 'attribution-study',
    term: 'attribution study',
    aliases: ['attribution studies'],
    meaning: 'Research estimating how a factor such as human-caused climate change affected the likelihood or severity of a particular weather event.',
    usage: 'An attribution study could compare the heatwave with simulations of a climate without human warming.',
  },
  {
    id: 'autonomous',
    term: 'autonomous',
    aliases: [],
    meaning: 'Able to perform tasks without continuous human control; for vehicles, this usually means driving within specified operating conditions.',
    usage: 'The proposed shuttle service would use autonomous vehicles only on carefully mapped routes.',
  },
  {
    id: 'birthright-citizenship',
    term: 'birthright citizenship',
    aliases: ['birthright-citizenship'],
    meaning: 'Citizenship acquired automatically at birth under national law, often because of where a child is born or the citizenship of their parents.',
    usage: 'The proposed rule would change which children qualify for birthright citizenship.',
  },
  {
    id: 'blockade',
    term: 'blockade',
    aliases: ['blockades'],
    meaning: 'An operation that prevents people, supplies or ships from entering or leaving an area, often to pressure an opposing side.',
    usage: 'A blockade of the port could prevent food shipments from reaching coastal communities.',
  },
  {
    id: 'bullion',
    term: 'bullion',
    aliases: [],
    meaning: 'Gold or silver held in bulk, usually as bars, valued mainly for its metal content rather than artistic or collectible qualities.',
    usage: 'The proposed vault would store bullion for institutions needing secure access to precious metals.',
  },
  {
    id: 'catchment',
    term: 'catchment',
    aliases: ['catchments'],
    meaning: 'An area of land where rainfall drains towards the same river, lake or other outlet, linking conditions upstream and downstream.',
    usage: 'Heavy rain across the catchment could raise river levels far downstream.',
  },
  {
    id: 'central-bank',
    term: 'central bank',
    aliases: ['central banks', 'central-bank', 'central-banks'],
    meaning: 'A public institution responsible for a currency and monetary policy, often also supporting financial stability and overseeing parts of the banking system.',
    usage: 'The central bank could raise borrowing costs if price increases remain persistent.',
  },
  {
    id: 'chatbot',
    term: 'chatbot',
    aliases: ['chatbots', 'chat bot', 'chat bots'],
    meaning: 'Software that exchanges messages with users in conversational form, using prepared responses or generated language that may contain mistakes.',
    usage: 'The council could introduce a chatbot to answer routine questions about waste collection.',
  },
  {
    id: 'chokepoint',
    term: 'chokepoint',
    aliases: ['chokepoints', 'choke point', 'choke points'],
    meaning: 'A narrow passage or critical location through which traffic must pass, making disruption there capable of affecting a much wider network.',
    usage: 'A damaged bridge could turn the valley crossing into a chokepoint for freight.',
  },
  {
    id: 'class-action',
    term: 'class action',
    aliases: ['class actions', 'class-action', 'class-actions', 'class action lawsuit', 'class action lawsuits', 'class-action lawsuit', 'class-action lawsuits'],
    meaning: 'A lawsuit in which one or more people bring claims on behalf of a larger group with similar legal complaints.',
    usage: 'Customers facing the same unexpected fee could seek compensation through a class action.',
  },
  {
    id: 'coalition',
    term: 'coalition',
    aliases: ['coalitions'],
    meaning: 'An alliance of groups or parties that work together towards a shared aim while retaining their separate identities.',
    usage: 'A coalition of smaller parties could agree on a shared programme before forming a government.',
  },
  {
    id: 'conspiracy',
    term: 'conspiracy',
    aliases: ['conspiracies'],
    meaning: 'A secret agreement between people to do something unlawful or harmful; in law, an agreement to commit a crime that can itself be an offence.',
    usage: 'Prosecutors would need evidence of an agreement to support the conspiracy allegation.',
  },
  {
    id: 'constituency',
    term: 'constituency',
    aliases: ['constituencies'],
    meaning: 'A geographic area whose voters elect a representative to a legislature, or the voters living within that area.',
    usage: 'New boundaries could move several villages into a different constituency before the next election.',
  },
  {
    id: 'conviction',
    term: 'conviction',
    aliases: ['convictions', 'convicted'],
    meaning: 'A firmly held belief or a strong sense of certainty; in law, a formal finding that someone is guilty of a criminal offence, following a trial or an accepted guilty plea.',
    usage: 'A conviction could lead to a prison sentence, depending on the offence and local law.',
  },
  {
    id: 'copyright',
    term: 'copyright',
    aliases: ['copyrights', 'copyrighted'],
    meaning: 'Legal protection giving creators control over certain uses of their original work, subject to limits, exceptions and a period of protection.',
    usage: 'The publisher would need permission unless a copyright exception covers the proposed use.',
  },
  {
    id: 'critical-minerals',
    term: 'critical minerals',
    aliases: ['critical mineral'],
    meaning: 'Mineral resources considered important to an economy or national security whose supply may be vulnerable to disruption.',
    usage: 'The proposed recycling plant could reduce dependence on imported critical minerals.',
  },
  {
    id: 'diplomacy',
    term: 'diplomacy',
    aliases: [],
    meaning: 'The management of relations between countries through negotiation, communication and agreements rather than relying only on threats or force.',
    usage: 'Officials could pursue diplomacy to reopen the border without further military action.',
  },
  {
    id: 'embankment',
    term: 'embankment',
    aliases: ['embankments'],
    meaning: 'A raised wall or bank of earth or stone built to hold back water or support a road or railway.',
    usage: 'Repairing the river embankment could help protect nearby farms from seasonal flooding.',
  },
  {
    id: 'escalation',
    term: 'escalation',
    aliases: ['escalations'],
    meaning: 'An increase in the intensity, scale or seriousness of a conflict or dispute, often following actions and counteractions.',
    usage: 'Another border incident could trigger an escalation that makes negotiations harder.',
  },
  {
    id: 'executive-order',
    term: 'executive order',
    aliases: ['executive orders', 'executive-order', 'executive-orders'],
    meaning: 'A formal instruction from a government leader directing executive agencies, whose authority and limits depend on the constitution and existing laws.',
    usage: 'An executive order could direct agencies to revise their procedures within existing law.',
  },
  {
    id: 'fair-use',
    term: 'fair use',
    aliases: ['fair-use'],
    meaning: 'A rule in United States copyright law permitting some uses without permission, assessed through factors including purpose and market effects.',
    usage: 'A reviewer quoting a short passage could argue that the quotation qualifies as fair use.',
  },
  {
    id: 'federal',
    term: 'federal',
    aliases: [],
    meaning: 'Relating to a system that divides government powers between a national government and states or regions, or specifically to that national government.',
    usage: 'A federal court could review whether the state rule conflicts with national law.',
  },
  {
    id: 'fossil-fuel',
    term: 'fossil fuel',
    aliases: ['fossil fuels', 'fossil-fuel', 'fossil-fuels'],
    meaning: 'Coal, oil or natural gas formed from ancient organic material, releasing carbon dioxide when burned for energy.',
    usage: 'The proposed heating system would reduce the amount of fossil fuel used by public buildings.',
  },
  {
    id: 'fraud',
    term: 'fraud',
    aliases: ['frauds', 'fraudulent'],
    meaning: 'Deliberate deception intended to obtain money, property or another benefit, often by making false claims or hiding important information.',
    usage: 'Stronger identity checks could help the platform detect fraud before customers transfer money.',
  },
  {
    id: 'generative-ai',
    term: 'generative AI',
    aliases: ['generative-AI'],
    meaning: 'Artificial intelligence that creates content such as text, images or audio from learned patterns, rather than simply retrieving an existing answer.',
    usage: 'The proposed school policy would require students to disclose any use of generative AI.',
  },
  {
    id: 'geopolitical',
    term: 'geopolitical',
    aliases: [],
    meaning: 'Relating to how geography, resources and political power shape relationships, competition and security between countries.',
    usage: 'Geopolitical tensions could encourage manufacturers to obtain essential supplies from several countries.',
  },
  {
    id: 'glacier',
    term: 'glacier',
    aliases: ['glaciers'],
    meaning: 'A large, lasting mass of ice formed from accumulated snow that moves slowly under its own weight.',
    usage: 'Researchers could monitor the glacier to assess risks to settlements farther down the valley.',
  },
  {
    id: 'grid',
    term: 'grid',
    aliases: ['grids'],
    meaning: 'A pattern or network of crossing lines; in energy, the network that carries electricity to users, and in motorsport, the arrangement of starting positions or the field of competitors.',
    usage: 'New transmission lines could help the grid carry more electricity from remote wind farms.',
  },
  {
    id: 'hydrologist',
    term: 'hydrologist',
    aliases: ['hydrologists'],
    meaning: 'A scientist who studies how water moves, is stored and changes across land, underground and through the atmosphere.',
    usage: 'A hydrologist could estimate how upstream rainfall would affect flood levels near the town.',
  },
  {
    id: 'hydropower',
    term: 'hydropower',
    aliases: ['hydro-power'],
    meaning: 'Electricity produced by using flowing or falling water to turn turbines, often at a dam or along a river.',
    usage: 'A hydropower project could supply electricity while changing water flows for communities downstream.',
  },
  {
    id: 'immunisation',
    term: 'immunisation',
    aliases: ['immunisations', 'immunization', 'immunizations'],
    meaning: 'The process of providing protection against an infection, commonly through vaccination or sometimes by supplying ready-made antibodies.',
    usage: 'An expanded immunisation programme could protect more vulnerable patients before the winter season.',
  },
  {
    id: 'immunity',
    term: 'immunity',
    aliases: ['immunities'],
    meaning: 'In law, protection that can prevent a person or institution from facing certain proceedings or penalties. In health, the body’s ability to resist a particular infection, often after vaccination or previous exposure.',
    usage: 'The judge would decide whether the official has immunity before considering the underlying allegations.',
  },
  {
    id: 'impunity',
    term: 'impunity',
    aliases: [],
    meaning: 'Freedom from punishment or other consequences for wrongdoing, especially when authorities fail to investigate or enforce the law.',
    usage: 'Campaigners could demand stronger investigations to prevent officials from acting with impunity.',
  },
  {
    id: 'indictment',
    term: 'indictment',
    aliases: ['indictments'],
    meaning: 'A formal accusation charging someone with a criminal offence, allowing a case to proceed but not establishing guilt.',
    usage: 'An indictment would set out the allegations, which prosecutors would still need to prove.',
  },
  {
    id: 'inference',
    term: 'inference',
    aliases: ['inferences'],
    meaning: 'A conclusion drawn from evidence or patterns rather than direct observation, which may still be uncertain or mistaken.',
    usage: 'Analysts could draw an inference from shipping records, but would need evidence to confirm it.',
  },
  {
    id: 'injunction',
    term: 'injunction',
    aliases: ['injunctions'],
    meaning: 'A court order requiring someone to do something or stop doing something, sometimes temporarily while a legal dispute continues.',
    usage: 'An injunction could pause construction while the court examines the planning challenge.',
  },
  {
    id: 'joint-venture',
    term: 'joint venture',
    aliases: ['joint ventures', 'joint-venture', 'joint-ventures'],
    meaning: 'A business arrangement in which two or more parties share resources, risks and returns for a particular enterprise.',
    usage: 'The manufacturers could form a joint venture to share the cost of a new factory.',
  },
  {
    id: 'jurisdiction',
    term: 'jurisdiction',
    aliases: ['jurisdictions'],
    meaning: 'The legal authority of a court or government to handle particular matters, people or activities within defined limits.',
    usage: 'The court would first decide whether it has jurisdiction over the overseas transaction.',
  },
  {
    id: 'large-language-model',
    term: 'large language model',
    aliases: ['large language models', 'large-language model', 'large-language models'],
    meaning: 'An artificial intelligence system trained on extensive text to learn language patterns and generate responses, without guaranteeing accuracy or understanding.',
    usage: 'A large language model could draft the summary, but an editor would need to verify it.',
  },
  {
    id: 'mitigation',
    term: 'mitigation',
    aliases: [],
    meaning: 'Action that reduces the severity of a problem; in climate policy, measures that reduce warming by limiting emissions or removing greenhouse gases.',
    usage: 'The proposed climate mitigation plan would replace diesel buses with electric vehicles.',
  },
  {
    id: 'monsoon',
    term: 'monsoon',
    aliases: ['monsoons'],
    meaning: 'A seasonal shift in prevailing winds that often brings a distinct rainy period and can strongly influence regional water supplies.',
    usage: 'A delayed monsoon could leave farmers waiting longer before planting their crops.',
  },
  {
    id: 'nuclear',
    term: 'nuclear',
    aliases: [],
    meaning: 'Relating to the central part of an atom, especially energy released when atomic nuclei split apart or combine.',
    usage: 'The proposed inspection agreement would cover facilities that handle materials for nuclear weapons.',
  },
  {
    id: 'opposition',
    term: 'opposition',
    aliases: [],
    meaning: 'Resistance to someone or something, or the people on the other side; in politics, parties outside government that challenge it, and in sport, the opposing team or competitors.',
    usage: 'The opposition could ask for an independent review before supporting the spending proposal.',
  },
  {
    id: 'outpatient',
    term: 'outpatient',
    aliases: ['outpatients'],
    meaning: 'A patient receiving medical care without being admitted for an overnight hospital stay; also describes care provided on that basis.',
    usage: 'The proposed clinic would provide outpatient treatment so patients could return home the same day.',
  },
  {
    id: 'parliament',
    term: 'parliament',
    aliases: ['parliaments'],
    meaning: 'A national lawmaking body whose members debate legislation, approve public spending and scrutinise the government, with powers varying by country.',
    usage: 'Parliament would debate the bill before deciding whether to approve the new rules.',
  },
  {
    id: 'plead',
    term: 'plead',
    aliases: ['pleads', 'pleaded', 'pleading', 'pled'],
    meaning: 'To formally tell a criminal court whether one accepts or denies a charge, usually by stating guilty or not guilty.',
    usage: 'The accused would plead not guilty before the court set a trial date.',
  },
  {
    id: 'portfolio',
    term: 'portfolio',
    aliases: ['portfolios'],
    meaning: 'A collection of work, assets or responsibilities held together; in finance, a set of investments, and in government, the areas of responsibility assigned to a minister.',
    usage: 'The company could diversify its portfolio by investing in several different energy technologies.',
  },
  {
    id: 'preliminary-hearing',
    term: 'preliminary hearing',
    aliases: ['preliminary hearings'],
    meaning: 'An early court hearing that addresses issues before trial, often whether there is enough evidence for a criminal case to proceed.',
    usage: 'A preliminary hearing would examine whether the prosecution has enough evidence to continue.',
  },
  {
    id: 'prosecution',
    term: 'prosecution',
    aliases: ['prosecutions'],
    meaning: 'The process of bringing a criminal case against someone, or the legal team arguing that the charges have been proved.',
    usage: 'The prosecution would need to establish guilt rather than rely on unanswered suspicions.',
  },
  {
    id: 'prosecutor',
    term: 'prosecutor',
    aliases: ['prosecutors'],
    meaning: 'A lawyer who brings and argues criminal charges on behalf of the state or another authorised prosecuting body.',
    usage: 'The prosecutor could call additional witnesses to explain how the records were collected.',
  },
  {
    id: 'radioactive-fallout',
    term: 'radioactive fallout',
    aliases: ['radioactive-fallout'],
    meaning: 'Radioactive particles released into the air that later settle on the ground, potentially contaminating people, water, soil and food.',
    usage: 'Emergency planners would map where radioactive fallout might settle after a release.',
  },
  {
    id: 'radiological',
    term: 'radiological',
    aliases: [],
    meaning: 'Relating to radiation, including its medical uses and the monitoring of exposure that could pose a health risk.',
    usage: 'Radiological monitoring could help determine whether workers were exposed to unsafe radiation levels.',
  },
  {
    id: 'regulator',
    term: 'regulator',
    aliases: ['regulators'],
    meaning: 'An authority that oversees an industry or activity, checks compliance with rules and may take action when standards are breached.',
    usage: 'The regulator could require more safety information before approving the proposed service.',
  },
  {
    id: 'reserves',
    term: 'reserves',
    aliases: [],
    meaning: 'Stocks of money, assets or natural resources available for future use, such as gold held by authorities or recoverable oil.',
    usage: 'The central bank could hold gold reserves as a safeguard during financial disruption.',
  },
  {
    id: 'restructuring',
    term: 'restructuring',
    aliases: ['restructure', 'restructured', 'restructures'],
    meaning: 'A substantial reorganisation of a business, its operations or its finances, often intended to reduce costs or improve performance.',
    usage: 'The proposed restructuring would combine overlapping departments and reduce layers of management.',
  },
  {
    id: 'sanctions',
    term: 'sanctions',
    aliases: ['sanction'],
    meaning: 'Restrictions or penalties imposed to influence behaviour, often limiting trade, travel or financial dealings with particular countries, organisations or people.',
    usage: 'The proposed sanctions would freeze assets while allowing essential food deliveries to continue.',
  },
  {
    id: 'sediment',
    term: 'sediment',
    aliases: ['sediments'],
    meaning: 'Particles of rock, soil or organic material carried by water, wind or ice and deposited when that movement slows.',
    usage: 'Accumulating sediment could reduce the reservoir capacity available to absorb heavy rainfall.',
  },
  {
    id: 'sentencing',
    term: 'sentencing',
    aliases: [],
    meaning: 'The stage of a criminal case when a court decides the penalty after a person has been found guilty.',
    usage: 'At sentencing, the judge would consider the offence and any factors affecting its seriousness.',
  },
  {
    id: 'settlement',
    term: 'settlement',
    aliases: ['settlements'],
    meaning: 'The act or result of establishing people in a place or resolving a matter; a settlement can be a community where people live, or an agreement ending a legal dispute without a final court decision.',
    usage: 'A settlement could compensate customers without requiring the company to admit wrongdoing.',
  },
  {
    id: 'sovereign-immunity',
    term: 'sovereign immunity',
    aliases: ['sovereign-immunity'],
    meaning: 'Legal protection that can shield a state or certain officials from court proceedings, depending on the jurisdiction, conduct and applicable exceptions.',
    usage: 'The court would examine whether sovereign immunity protects the foreign government in this dispute.',
  },
  {
    id: 'sovereignty',
    term: 'sovereignty',
    aliases: [],
    meaning: 'The authority of a state to govern its territory and affairs independently, subject to its legal obligations and international relationships.',
    usage: 'Negotiators could seek an agreement that respects sovereignty while allowing shared use of the river.',
  },
  {
    id: 'strait',
    term: 'strait',
    aliases: ['straits'],
    meaning: 'A narrow stretch of water connecting two larger bodies of water, often forming an important route for ships.',
    usage: 'Closing the strait could force cargo ships to follow a much longer route.',
  },
  {
    id: 'tariff',
    term: 'tariff',
    aliases: ['tariffs'],
    meaning: 'A set rate or schedule of charges; in trade, a tax on goods crossing a national border, usually imports, and in energy, the rates charged for supplying and using gas or electricity.',
    usage: 'A higher tariff on imported steel could increase costs for local manufacturers.',
  },
  {
    id: 'vaccine',
    term: 'vaccine',
    aliases: ['vaccines'],
    meaning: 'A preparation that trains the immune system to recognise a particular threat, helping reduce the risk or severity of disease.',
    usage: 'The proposed programme would offer the vaccine first to people at greatest risk.',
  },
  {
    id: 'verdict',
    term: 'verdict',
    aliases: ['verdicts'],
    meaning: 'The formal decision reached by a jury or judge on the issues in a trial, such as whether someone is guilty.',
    usage: 'The jury would return a verdict after reviewing the evidence and the legal instructions.',
  },
].map((entry) => Object.freeze({ ...entry, aliases: Object.freeze(entry.aliases) })))

const asString = (value) => typeof value === 'string' ? value : ''
const spaces = / +/g
// Unicode case-insensitive matching also treats the historical long s as s.
const longS = /\u017f/g
const normalise = (text) => text.toLowerCase().replace(spaces, ' ').replace(longS, 's')
const escapePattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const entriesBySurface = new Map()

for (const entry of GLOSSARY) {
  for (const surface of [entry.term, ...entry.aliases]) {
    entriesBySurface.set(normalise(surface), entry)
  }
}

// Reserve unsupported collocations so their shorter words cannot mislabel them.
const plainSurfaces = ['conspiracy theory', 'conspiracy theories', 'Republican Jewish Coalition']
const surfaces = [...entriesBySurface.keys(), ...plainSurfaces.map(normalise)]
  .sort((left, right) => right.length - left.length)
  .map((surface) => escapePattern(surface).replace(spaces, ' +'))
const boundary = "[\\p{L}\\p{N}'’\\-]"
const matcher = new RegExp(`(?<!${boundary})(?:${surfaces.join('|')})(?!${boundary})`, 'giu')

/**
 * A word may only be offered as tappable when its explanation can actually be
 * shown. Marking a term the panel would refuse to render leaves the reader
 * inert behind a dialog that never appears, so both sides share this test.
 */
export function isExplainable(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
  return ['term', 'meaning', 'usage'].every(
    (field) => typeof entry[field] === 'string' && entry[field].trim(),
  )
}

const asSet = (value) => {
  if (value == null) return null
  try {
    Set.prototype.has.call(value, '')
    return value
  } catch {
    return null
  }
}

export function findEntry(word) {
  const entry = entriesBySurface.get(normalise(asString(word).trim())) ?? null
  return isExplainable(entry) ? entry : null
}

export function annotate(text, seen) {
  const source = asString(text)
  if (!source) return []

  const marked = asSet(seen)
  const segments = []
  let plainStart = 0

  // matchAll uses its own cursor, leaving the precompiled matcher unchanged.
  for (const match of source.matchAll(matcher)) {
    const entry = entriesBySurface.get(normalise(match[0]))
    if (!entry) continue
    // An entry without a complete explanation stays plain reporting text.
    if (!isExplainable(entry)) continue
    if (marked && Set.prototype.has.call(marked, entry.id)) continue

    if (match.index > plainStart) {
      segments.push({ kind: 'text', text: source.slice(plainStart, match.index) })
    }
    segments.push({ kind: 'term', text: match[0], entry })
    plainStart = match.index + match[0].length
    if (marked) Set.prototype.add.call(marked, entry.id)
  }

  if (plainStart < source.length) {
    segments.push({ kind: 'text', text: source.slice(plainStart) })
  }
  return segments
}

export function annotateParagraphs(paragraphs) {
  try {
    if (!Array.isArray(paragraphs)) return []
    const seen = new Set()
    return Array.from(paragraphs, (paragraph) => annotate(paragraph, seen))
  } catch {
    return []
  }
}

export function hasTerms(text) {
  return annotate(text).some((segment) => segment.kind === 'term')
}
