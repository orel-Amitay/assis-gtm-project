// ── Helpers ───────────────────────────────────────────────────────────────

export function stripMd(s) {
  if (!s) return ''
  return s
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .trim()
}

function escapedGet(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Handle both plain "Label: value" and markdown "**Label:** value" or "**Label: value**"
  const match = block.match(new RegExp(`^\\*{0,2}${escaped}\\*{0,2}:?\\*{0,2}\\s*(.+)`, 'im'))
  return match ? stripMd(match[1].trim()) : ''
}

// Fuzzy company name match (returns 0–100)
function matchScore(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  if (!a || !b) return 0
  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 80
  const aWords = a.split(' ').filter(w => w.length > 2)
  const bWords = b.split(' ').filter(w => w.length > 2)
  const shared = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw))).length
  return Math.min(70, shared * 25)
}

function findBlock(blocks, companyName) {
  let best = null, bestScore = 0
  for (const block of blocks) {
    // Handle plain "Company: X", markdown "**Company:** X", bold label, etc.
    const m = block.match(/^\*{0,2}Company\*{0,2}:?\*{0,2}\s*(.+)/im)
    if (!m) continue
    const s = matchScore(stripMd(m[1]), companyName)
    if (s > bestScore) { best = block; bestScore = s }
  }
  return bestScore >= 30 ? best : null
}

// Extract a multi-line section that ends when the next ALL-CAPS header starts
function extractSection(block, header) {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z &\\-#/]+[:\\-]|\\n---\\s*$|$)`,
    'i'
  )
  const match = block.match(pattern)
  return match ? match[1].trim() : ''
}

// ── Empty lead template ───────────────────────────────────────────────────
export function emptyLead() {
  return {
    company: '', domain: '', vertical: 'Home', subCategory: '',
    shopify: '', estimatedSize: '', estimatedRevenue: '',
    aovEstimate: '', monthlyOrders: '', monthlyTraffic: '',
    yearsInBusiness: '', discoveryReason: '', currentStack: '',
    instagramUrl: '', facebookUrl: '', linkedinCompanyUrl: '', twitterUrl: '', tiktokUrl: '',
    reviewsSummary: '', redditMentions: '', bbbInfo: '', glassdoorInfo: '',
    likelyBuyer: '', buyerName: '', buyerLinkedIn: '',
    painHypothesis: '', assisAngle: '', nextAction: '', notes: '',
    linkedinDraft: '', emailSubject: '', emailBody: '', followUp1: '', followUp2: '',
    icpScore: null, frictionScore: null, founderScore: null,
    speedScore: null, caseStudyScore: null, aovScore: null, totalScore: null,
    priority: 'Medium', status: 'New',
  }
}

// ── Step 1: Lead Discovery ────────────────────────────────────────────────
export function parseStep1(text) {
  const leads = []
  const blocks = text.split(/---+/).filter(b => b.trim())
  for (const block of blocks) {
    const get = (label) => escapedGet(block, label)
    const company = stripMd(get('Company'))
    const domain = stripMd(get('Domain')).replace(/^https?:\/\//, '')
    if (!company || !domain) continue
    leads.push({
      ...emptyLead(),
      company,
      domain,
      subCategory: get('Sub-category') || get('Sub-Category'),
      shopify: get('Shopify') || 'Unknown',
      estimatedSize: get('Estimated employees'),
      aovEstimate: get('AOV signal'),
      monthlyOrders: get('Monthly Orders (est.)') || get('Monthly Orders'),
      monthlyTraffic: get('Monthly Traffic (est.)') || get('Monthly Traffic'),
      yearsInBusiness: get('Years active') || get('Founded') || '',
      discoveryReason: get('Discovery reason') || get('Found via') || '',
      likelyBuyer: get('Likely buyer') || 'Founder',
      painHypothesis: get('Pain hypothesis'),
      assisAngle: get('Why it might fit'),
      notes: get('Red flags'),
    })
  }
  return leads
}

// ── Step 2: Enrichment ────────────────────────────────────────────────────
export function mergeStep2(text, leads) {
  // Step 2 blocks: split on blank line before "Company:" (with optional markdown **)
  const blocks = text.split(/\n(?=\*{0,2}Company\*{0,2}:)/i).filter(b => b.trim())

  return leads.map(lead => {
    const block = findBlock(blocks, lead.company)
    if (!block) return lead
    const get = (label) => escapedGet(block, label)

    // Pain signals — multiline list
    const painMatch = block.match(/Pain Signals Found:\s*([\s\S]*?)(?=\n[A-Za-z]|\n---|\s*$)/i)
    const painSignals = painMatch
      ? painMatch[1].replace(/^\s*[-•]\s*/gm, '').trim()
      : ''

    // Parse Current Stack block
    const stackMatch = block.match(/Current Stack[:\s]*\n([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|$)/i)
    const rawStack = stackMatch ? stackMatch[1].trim() : ''
    // Also try individual stack fields if block not found
    const helpDesk   = get('Help Desk')    || get('Support Stack Likely') || ''
    const chatbot    = get('Chatbot')      || ''
    const whatsapp   = get('WhatsApp')     || ''
    const crm        = get('CRM')          || ''
    const outsource  = get('Outsourcing')  || ''
    const aiTools    = get('AI Tools')     || ''
    const currentStack = rawStack || [
      helpDesk   && `Help Desk: ${helpDesk}`,
      chatbot    && `Chatbot: ${chatbot}`,
      whatsapp   && `WhatsApp: ${whatsapp}`,
      crm        && `CRM: ${crm}`,
      outsource  && `Outsourcing: ${outsource}`,
      aiTools    && `AI Tools: ${aiTools}`,
    ].filter(Boolean).join('\n')

    // LinkedIn founder — prefer Founder, fall back to CX Lead
    const rawLinkedIn = get('Founder LinkedIn') || get('CX Lead LinkedIn') || lead.buyerLinkedIn || ''
    const buyerLinkedIn = rawLinkedIn || lead.buyerLinkedIn

    // Social links — normalize to full URLs
    const normUrl = (raw, base) => {
      if (!raw || raw === 'MISSING' || raw === 'N/A') return ''
      const s = raw.trim()
      if (s.startsWith('http')) return s
      if (s.startsWith(base.replace('https://', ''))) return `https://${s}`
      return `https://${base.replace('https://', '')}${s.startsWith('/') ? s : '/' + s}`
    }
    const instagramUrl     = normUrl(get('Instagram'),         'https://instagram.com') || lead.instagramUrl
    const facebookUrl      = normUrl(get('Facebook'),          'https://facebook.com')  || lead.facebookUrl
    const linkedinCompanyUrl = normUrl(get('LinkedIn Company'),'https://linkedin.com')  || lead.linkedinCompanyUrl
    const twitterUrl       = normUrl(get('Twitter'),           'https://twitter.com')   || lead.twitterUrl
    const tiktokUrl        = normUrl(get('TikTok'),            'https://tiktok.com')    || lead.tiktokUrl

    // Consumer reviews block
    const reviewsMatch = block.match(/Consumer Reviews Summary[:\s]*\n([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|$)/i)
    const reviewsSummary = reviewsMatch ? reviewsMatch[1].trim() : ''
    const redditMatch = block.match(/Reddit[:\s]+(.+)/i)
    const redditMentions = redditMatch ? stripMd(redditMatch[1].trim()) : ''
    const bbbMatch = block.match(/BBB[:\s]+(.+)/i)
    const bbbInfo = bbbMatch ? stripMd(bbbMatch[1].trim()) : ''
    const glassdoorMatch = block.match(/Glassdoor[:\s]+(.+)/i)
    const glassdoorInfo = glassdoorMatch ? stripMd(glassdoorMatch[1].trim()) : ''

    return {
      ...lead,
      shopify:            get('Confirmed Shopify') || lead.shopify,
      estimatedSize:      get('Estimated Size')    || lead.estimatedSize,
      estimatedRevenue:   get('Estimated Revenue') || lead.estimatedRevenue,
      aovEstimate:        get('AOV Estimate')      || lead.aovEstimate,
      yearsInBusiness:    get('Years in Business') || lead.yearsInBusiness,
      likelyBuyer:        get('Buyer Persona')     || lead.likelyBuyer,
      buyerName:          get('Founder Name')      || get('CX Lead Name') || lead.buyerName,
      buyerLinkedIn,
      instagramUrl, facebookUrl, linkedinCompanyUrl, twitterUrl, tiktokUrl,
      reviewsSummary:     reviewsSummary           || lead.reviewsSummary,
      redditMentions:     redditMentions           || lead.redditMentions,
      bbbInfo:            bbbInfo                  || lead.bbbInfo,
      glassdoorInfo:      glassdoorInfo            || lead.glassdoorInfo,
      currentStack:       currentStack             || lead.currentStack,
      painHypothesis:     painSignals              || lead.painHypothesis,
      assisAngle:         get('Assis Relevance')   || lead.assisAngle,
      notes:              get('Enrichment Notes')  || lead.notes,
    }
  })
}

// ── Step 3: Scoring ───────────────────────────────────────────────────────
export function mergeStep3(text, leads) {
  const blocks = text.split(/---+/).filter(b => b.trim())
  const PRIORITY_MAP = { High: 'High', Medium: 'Medium', Low: 'Low', Skip: 'Skip' }

  return leads.map(lead => {
    const block = findBlock(blocks, lead.company)
    if (!block) return lead

    const getScore = (label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Match "Label: X/Y" or "**Label:** X/Y" or "- Label: X/Y"
      const m = block.match(new RegExp(`\\*{0,2}${escaped}\\*{0,2}[:\\s]+([0-9]+)\\s*/\\s*[0-9]+`, 'i'))
      return m ? parseInt(m[1], 10) : null
    }

    const totalM   = block.match(/Total Score:\s*([0-9]+)\s*\/\s*100/i)
    const tierM    = block.match(/Priority Tier:\s*(\w+)/i)
    const actionM  = block.match(/Recommended Action:\s*(.+)/i)

    return {
      ...lead,
      icpScore:      getScore('ICP Match'),
      frictionScore: getScore('Support Friction'),
      founderScore:  getScore('Founder-Led'),
      speedScore:    getScore('Speed to Close'),
      caseStudyScore:getScore('Case Study Potential'),
      aovScore:      getScore('AOV / Impact') ?? getScore('AOV'),
      totalScore:    totalM ? parseInt(totalM[1], 10) : lead.totalScore,
      priority:      (tierM && PRIORITY_MAP[tierM[1]]) || lead.priority,
      nextAction:    actionM ? stripMd(actionM[1].trim()) : lead.nextAction,
    }
  })
}

// ── Step 4: Outreach ──────────────────────────────────────────────────────
export function mergeStep4(text, leads) {
  const blocks = text.split(/---+/).filter(b => b.trim())

  return leads.map(lead => {
    const block = findBlock(blocks, lead.company)
    if (!block) return lead

    const emailSubjectM = block.match(/EMAIL SUBJECT[^:\n]*:\s*\n(.+)/i)

    return {
      ...lead,
      linkedinDraft: extractSection(block, 'LINKEDIN MESSAGE')   || lead.linkedinDraft,
      emailSubject:  emailSubjectM ? stripMd(emailSubjectM[1].trim()) : lead.emailSubject,
      emailBody:     extractSection(block, 'EMAIL BODY')          || lead.emailBody,
      followUp1:     extractSection(block, 'FOLLOW-UP #1')        || lead.followUp1,
      followUp2:     extractSection(block, 'FOLLOW-UP #2')        || lead.followUp2,
    }
  })
}

// ── Merge all 4 steps together ────────────────────────────────────────────
export function buildCompleteLeads(outputs, vertical, subCategoryLabel) {
  const step1 = outputs[1] || ''
  const step2 = outputs[2] || ''
  const step3 = outputs[3] || ''
  const step4 = outputs[4] || ''

  if (!step1) return []

  const mainVertical = vertical.split(' / ')[0].trim() // "Home" from "Home / Mattress / Furniture"

  let leads = parseStep1(step1).map(l => ({
    ...l,
    vertical: mainVertical,
    subCategory: subCategoryLabel || l.subCategory || '',
  }))

  if (step2) leads = mergeStep2(step2, leads)
  if (step3) leads = mergeStep3(step3, leads)
  if (step4) leads = mergeStep4(step4, leads)

  return leads
}
