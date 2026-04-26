export const MASTER_SYSTEM_PROMPT = `You are operating the Assis US GTM machine.

Assis helps eCommerce brands turn customer conversations into revenue, retention, and trust.

Assis is NOT an AI chatbot. It is NOT a support automation tool.
Assis is the trusted layer between brands and their consumers.

It intervenes at moments where revenue is at risk:
- A customer about to cancel a high-value order
- A buyer with a question before checkout going unanswered
- An escalation that should have been resolved at the first touch

US Market: We are entering the US market through a design partner program.
Goal: 3 US design partners in 90 days across 3 verticals.

Target verticals:
1. Home / Mattress / Furniture
2. Consumer Electronics
3. Beauty / Lifestyle

Ideal customer:
- Shopify brand ($1M–$10M revenue, 5–50 employees)
- 500–5,000 support tickets/month
- Founder-led or small leadership team
- Using Gorgias, Zendesk, Shopify Inbox, or similar

Rules:
1. Focus only on US eCommerce brands
2. Think in revenue terms: saved orders, prevented cancellations, conversion lift
3. NEVER say AI, chatbot, or automation
4. Position Assis as a trusted layer between consumers and brands
5. Keep all outputs structured, short, and immediately usable
6. Produce outputs that can be dropped into Google Sheets or markdown files
7. In V1: optimize for research quality and outreach preparation only
8. Mark uncertain data as [ESTIMATED] or [UNCONFIRMED]`

export const WORKFLOW_STEPS = [
  {
    id: 'step-1',
    step: 1,
    title: 'Lead Discovery',
    description: 'Gemini searches the web for DTC Shopify brands that match your ICP. When done → click Import to save them.',
    icon: 'Search',
    color: 'blue',
    estimatedTime: '45–90 min',
    output: 'data/raw-leads/[vertical]-[YYYY-MM].md',
    generatePrompt: (vertical, _input1, _input2, count = 25) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Lead Discovery — ${vertical}

Find ${count} US eCommerce brands in the ${vertical} vertical for Assis.

ICP CRITERIA:
- Shopify store (confirmed or likely)
- AOV $300+ (for Home), $100+ (for Electronics/Beauty)
- Delivery window 5+ days (for Home) or complex product journey
- Founder-led or small team (under 75 employees)
- DTC channel active (not wholesale-only)
- Revenue $1M–$15M estimated

${vertical === 'Home / Mattress / Furniture' ? `HOME-SPECIFIC SEARCH ANGLES:
Use these Google searches:
- "DTC mattress brand" shopify "free shipping" -casper -purple -leesa -saatva -nectar
- "custom sofa" "6-8 weeks" OR "4-6 weeks" shopify
- "semi-custom furniture" "design your own" -wayfair -article
- "made to order" furniture "direct to consumer" shopify
- "luxury mattress" "100 night trial" -casper -purple -leesa -saatva
- "premium bedding" brand shopify -amazon -wayfair

Also check:
- trustpilot.com → Categories → Furniture & Garden → US, 3.5–4.4 stars, 50–500 reviews
- Reddit: r/Mattress, r/femalelivingspace, r/BuyItForLife
- storeleads.app → filter by Shopify + Home/Furniture + US
- Inc 5000 list: search "mattress" or "furniture" in past 3 years
- Google: "best DTC mattress brand 2023 2024" review roundups

AVOID: Casper, Purple, Leesa, Saatva, Nectar, Wayfair brands, Article (Canadian), Joybird (owned by La-Z-Boy)` : ''}

${vertical === 'Consumer Electronics' ? `ELECTRONICS-SPECIFIC SEARCH ANGLES:
Use these Google searches:
- "DTC audio brand" shopify -amazon -bestbuy -sony -bose -jbl -apple
- "wireless headphones" "direct to consumer" shopify brand
- "air purifier" brand shopify DTC "free shipping" -dyson -levoit -winix
- "smart home" device brand shopify -amazon -google -ring -nest
- "coffee maker" OR "espresso" brand shopify DTC -nespresso -keurig
- "fitness tracker" OR "wearable" DTC shopify brand -fitbit -garmin -apple
- "camera" "content creator" accessories shopify DTC brand

Also check:
- trustpilot.com → Categories → Electronics → US, 3.5–4.4 stars, 50–500 reviews
- Reddit: r/audiophile, r/smarthome, r/homeautomation, r/coffee, r/cordcutters
- storeleads.app → filter Consumer Electronics + Shopify + US
- Inc 5000: search "electronics" or "audio" in past 3 years
- Google: "best DTC electronics brand 2023 2024" roundups
- indiegogo.com / kickstarter.com → funded electronics products now selling DTC

ICP SIGNALS FOR ELECTRONICS:
- Product requires explanation or support before/after purchase
- Delivery 5+ days or complex unboxing/setup
- AOV $150+ preferred
- Active customer complaints about setup, returns, or warranty

AVOID: Amazon-first brands, Apple, Samsung, Sony, Bose, JBL, Dyson, Anker (too large), Best Buy brands, brands with <100 Trustpilot reviews (too small)` : ''}

${vertical === 'Beauty / Lifestyle' ? `BEAUTY-SPECIFIC SEARCH ANGLES:
- "clean beauty brand" shopify DTC
- "skincare brand" "free from" shopify
- "wellness supplements" DTC shopify
- "beauty subscription" DTC brand shopify
- Reddit: r/SkincareAddiction, r/BeautyGuruChatter, r/HaircareScience
- storeleads.app → filter Beauty + Shopify + US` : ''}

RETURN FORMAT — for each of ${count} companies:

---
Company: [Brand Name]
Domain: [website.com]
Sub-category: [specific type]
Founded: [Year or estimate — check About page, LinkedIn, domain age]
Years active: [X years]
Found via: [Google / Trustpilot / Reddit / LinkedIn — be specific, e.g. "Google: 'DTC mattress brand shopify'"]
Discovery reason: [1 sentence: exactly why this company was selected — what signals made it stand out]
Shopify: [Confirmed / Likely / Unknown]
Estimated employees: [X–Y]
AOV signal: [$X–$X or Unknown]
Monthly Orders (est.): [X–X orders/month or Unknown — estimate from review count, traffic signals, or SimilarWeb if available]
Monthly Traffic (est.): [X–X visitors/month or Unknown — estimate from SimilarWeb, Alexa, or other public signals]
Delivery window: [X days/weeks or Not visible]
Custom/made-to-order: [Yes / No / Unclear]
Why it might fit: [1–2 specific sentences]
Likely buyer: [Founder / COO / Head of CX — and why]
Pain hypothesis: [Most likely friction point]
Red flags: [Any concerns]
---

Return exactly ${count} companies. Be specific, not generic. Mark any assumptions clearly.`,
  },
  {
    id: 'step-2',
    title: 'Enrichment',
    step: 2,
    description: 'Gemini visits each lead\'s website, checks BuiltWith, LinkedIn, Trustpilot, Reddit & BBB. Results auto-save to your leads.',
    icon: 'Database',
    color: 'purple',
    estimatedTime: '60–90 min',
    output: 'data/enriched-leads/[vertical]-[YYYY-MM].md',
    generatePrompt: (vertical, rawLeads) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Enrichment — ${vertical}

Enrich the following raw leads for Assis GTM purposes.

RESEARCH STEPS PER COMPANY (do as many as possible in 20 min):

1. WEBSITE (3 min)
   - Check if Shopify: View Source → search "cdn.shopify.com"
   - Find a product page: note price and delivery window text
   - Look for chat widget: Intercom bubble, Gorgias, Drift, Tidio, or nothing visible
   - Check FAQ/Help Center: any "cancel", "delay", "when will my order" content?
   - Look for About page: founding year, team size, founder names
   - Footer: copy all social media links exactly as they appear

2. TECH STACK — CRITICAL (2 min)
   - builtwith.com/[domain] — lists every technology: Gorgias, Klaviyo, Zendesk, Intercom, etc.
   - wappalyzer.com/lookup/[domain] — cross-check
   - Look at cookie consent banner: often reveals CRM (OneTrust, Klaviyo, HubSpot)
   - Check page source for "gorgias", "zendesk", "intercom", "freshdesk", "reamaze" script tags

3. CONSUMER REVIEWS — ALL SOURCES (5 min)
   - trustpilot.com/review/[domain] — stars, review count, copy 1–2 direct quotes from 1–3 star reviews
   - Google: search "[brand name] reviews" → note Google star rating + count
   - bbb.org: search company name → note rating (A+/A/B/F), complaint count, complaint themes
   - sitejabber.com/reviews/[domain] — any reviews?
   - resellerratings.com — any reviews?
   - Google: "[brand name] complaints" — any news articles or forum posts?

4. REDDIT RESEARCH (3 min)
   - Search: reddit.com/search/?q=[brand+name] — any threads mentioning this brand?
   - Search: site:reddit.com "[brand name]" in Google
   - Check relevant subreddits: r/Mattress, r/BuyItForLife, r/SkincareAddiction, r/audiophile, etc.
   - Note: positive? negative? specific complaints? shipping issues? customer service mentions?
   - Copy 1–2 direct Reddit quotes if found

5. LINKEDIN — CRITICAL, DO CAREFULLY (4 min)
   - Go to linkedin.com/search/results/companies/?keywords=[company name]
   - Open company page → note employee count, founded year, exact company URL
   - Click "People" tab → look for Founder, Co-founder, CEO, Owner
   - Click their profile → copy exact URL (linkedin.com/in/[username])
   - If no founder visible: check brand website About page → search that name on LinkedIn
   - glassdoor.com: search company → note rating, review count, open CX/support jobs
   - RULE: Only write URLs you actually see. If unsure: "SEARCH: [name] [company]"

6. GROWTH SIGNALS (2 min)
   - similarweb.com/website/[domain] — traffic trend: growing/declining?
   - semrush.com/analytics/overview/?q=[domain] — organic traffic estimate
   - socialblade.com — if Instagram handle known: follower growth trend
   - Check LinkedIn jobs: any open CX, support, or operations roles? (= growth signal AND pain signal)
   - Google News: "[brand name]" — any recent press, funding, launches?

RETURN FORMAT per company:

Company: [name]
Domain: [website]
Confirmed Shopify: [Yes / Likely / No — note what you saw]
Estimated Size: [X–Y employees]
Estimated Revenue: [$XM–$XM] [ESTIMATED]
AOV Estimate: [$X]
Years in Business: [Year founded — X years old, from About page / LinkedIn / domain registration]
Buyer Persona: [Founder / COO / Head of CX]
Founder Name: [Full name — from website About page or LinkedIn — or UNKNOWN]
Founder LinkedIn: [linkedin.com/in/username — CONFIRMED only — or "SEARCH: [name] [company]"]
CX Lead Name: [name or UNKNOWN]
CX Lead LinkedIn: [linkedin.com/in/username — CONFIRMED only — or MISSING]
LinkedIn Company: [linkedin.com/company/[exact-slug] — from LinkedIn company page URL — or MISSING]
Instagram: [instagram.com/[handle] — from website footer or bio — or MISSING]
Facebook: [facebook.com/[page] — from website footer — or MISSING]
Twitter: [twitter.com/[handle] OR x.com/[handle] — from website footer — or MISSING]
TikTok: [tiktok.com/@[handle] — from website footer — or MISSING]
Current Stack:
  Help Desk: [Gorgias / Zendesk / Intercom / Freshdesk / Re:amaze / Shopify Inbox / Email only / Unknown]
  Chatbot: [Yes — [tool name] / No / Unknown]
  WhatsApp: [Yes / No / Unknown]
  CRM: [Klaviyo / HubSpot / Mailchimp / None visible / Unknown]
  Outsourcing: [In-house / Outsourced to agency / Hybrid / Unknown]
  AI Tools: [Yes — [tool name] / No / Unknown]
  Live Chat: [Yes / No / Unknown]
Consumer Reviews Summary:
  Trustpilot: [X/5 stars, X reviews — top complaint theme in 1 sentence]
  Google: [X/5 stars — from search snippet, or NOT FOUND]
  BBB: [Rating + complaint count + main complaint type, or NOT FOUND]
  Reddit: [Found / Not found — if found: sentiment + direct quote or link]
  Sitejabber: [X/5 stars or NOT FOUND]
  Key complaint themes: [e.g. "shipping delays, no proactive communication, hard to cancel"]
  Best review quote (negative): "[exact quote from a real review]"
  Best review quote (positive): "[exact quote from a real review]"
Glassdoor: [X/5 stars, X reviews, open CX jobs: Yes/No — or NOT FOUND]
Pain Signals Found:
  - [Specific signal 1 — quote or observation with source]
  - [Specific signal 2]
Assis Relevance: [Why Assis specifically fits — 1–2 sentences]
Enrichment Notes: [Anything uncertain — label ESTIMATED]

---

RAW LEADS TO ENRICH:

${rawLeads || '[Paste your raw lead list from Step 1 here]'}`,
  },
  {
    id: 'step-3',
    title: 'Scoring',
    step: 3,
    description: 'Each lead gets a 0–100 score: ICP fit, support pain, founder access, AOV. Priority tier assigned automatically.',
    icon: 'BarChart2',
    color: 'orange',
    estimatedTime: '30–45 min',
    output: 'data/enriched-leads/[vertical]-[YYYY-MM].md (scores added)',
    generatePrompt: (vertical, enrichedLeads) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Scoring — ${vertical}

Score each enriched lead from 0–100 using this exact model:

SCORING DIMENSIONS (100 points total):

1. ICP MATCH (20 pts)
   - Shopify confirmed: +8 | Likely: +5
   - Revenue $2M–$8M: +6 | $1M–$2M or $8M–$15M: +3
   - Size 10–40 employees: +4 | 5–10 or 40–75: +2
   - AOV $400+: +2

2. SUPPORT FRICTION SIGNAL (20 pts)
   - Trustpilot/Google reviews mention "delay", "wait", "cancel": +8
   - 3+ reviews describe shipping/delivery problem: +3 bonus
   - Currently hiring for CX/support role: +6
   - No chat widget (email-only): +4
   - Delivery window 3+ weeks: +2

3. FOUNDER-LED PROBABILITY (15 pts)
   - Founder posted on LinkedIn in last 30 days: +8
   - Founder is public face of brand: +5
   - Under 25 employees: +2

4. SPEED TO CLOSE (15 pts)
   - No procurement process signals: +8
   - Decision maker identifiable and reachable: +5
   - Company actively growing (hiring, launches): +2

5. CASE STUDY POTENTIAL (15 pts)
   - Brand recognizable in sub-category: +6
   - Outcomes measurable and dramatic (AOV $600+): +6
   - Founder likely to give public testimonial: +3

6. AOV / REVENUE IMPACT (15 pts)
   - $1,000+: +15 | $600–$999: +12 | $400–$599: +9
   - $200–$399: +5 | $100–$199: +2 | Under $100: +0

PRIORITY TIERS:
- 85–100: High — Outreach this week
- 70–84: High — Outreach within 2 weeks
- 55–69: Medium — Research more, then outreach
- 40–54: Low — Hold 60 days
- Under 40: Skip

CALIBRATION RULES:
- No more than 5–6 companies should score 85+
- No Shopify Unknown company above 60
- No AOV under $200 above 65

RETURN FORMAT per company:

---
Company: [Name]
Total Score: [X/100]
Priority Tier: [High / Medium / Low / Skip]

Score Breakdown:
  ICP Match:            [X/20]
  Support Friction:     [X/20]
  Founder-Led:          [X/15]
  Speed to Close:       [X/15]
  Case Study Potential: [X/15]
  AOV / Impact:         [X/15]

Score Summary: [2–4 sentences: what pushed it up, what held it back, what to verify]
Recommended Action: [LinkedIn DM / Email / Warm intro / More research / Skip]
What to personalize: [1–2 specific hooks from enrichment]
---

ENRICHED LEADS TO SCORE:

${enrichedLeads || '[Paste your enriched lead list from Step 2 here]'}`,
  },
  {
    id: 'step-4',
    title: 'Outreach Drafts',
    step: 4,
    description: 'Gemini writes a LinkedIn DM, email, and 2 follow-ups for every lead scored 55+. Saved directly to each lead card.',
    icon: 'MessageSquare',
    color: 'green',
    estimatedTime: '60–90 min',
    output: 'data/outreach-drafts/[vertical]-[YYYY-MM].md',
    generatePrompt: (vertical, scoredLeads) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Outreach Drafts — ${vertical}

Write personalized outreach for the following scored leads (score 55+).

MESSAGING FRAMEWORK (follow exactly):
1. Name their specific situation — something you found in enrichment
2. Name the problem in their language (not our product language)
3. One sentence on what we do (outcome-focused)
4. One ask: 15-minute call

BANNED WORDS — never use:
AI, chatbot, automation, platform, tool, automated responses,
"I wanted to reach out", "I hope this finds you well", "leverage", "synergy"

LEAD WITH:
saved revenue, prevented cancellations, saved orders, conversion, trust

FORMAT LIMITS:
- LinkedIn connection note: under 250 characters
- LinkedIn message: under 120 words
- Email body: under 150 words
- Follow-up #1: under 80 words (Day 4–5)
- Follow-up #2: under 60 words (Day 10–12)
- Subject line: lowercase, curiosity-based

PERSONA TONE:
- Founder: peer-to-peer, revenue-focused, direct
- Head of CX: collegial, workload-focused, operational
- COO: analytical, ROI-first, give the math frame

${vertical === 'Home / Mattress / Furniture' ? `HOME VERTICAL STORIES — use when relevant:

Mattress: "A customer ordered a $900 mattress. Day 5, shipping pushed back 8 days. They messaged: 'I need to cancel.' Assis responded in 3 minutes — acknowledged the delay, offered a $75 credit, confirmed the new date. Customer replied: 'OK, thank you.' Order saved."

Furniture: "A customer's $2,200 sofa was 6 weeks into an 8-week lead time. They messaged asking to cancel. Assis responded immediately, confirmed it was in final production, offered a credit. Order saved."

Bedding: "A customer couldn't decide which sheet set was right for her California King. No answer on the site. She bought from a competitor. Assis answers that question in real-time."` : ''}

RETURN FORMAT per company:

---
Company: [Name]
Buyer: [Name, Title]
Score: [X]
Custom angle: [1 sentence — the specific hook]
Channel priority: [LinkedIn first / Email first]

LINKEDIN CONNECTION NOTE:
[text]

LINKEDIN MESSAGE:
[text]

EMAIL SUBJECT:
[subject]

EMAIL BODY:
[text]

FOLLOW-UP #1 — Day 4–5:
[text]

FOLLOW-UP #2 — Day 10–12:
[text]

BREAK-UP — Day 18–20:
[text]
---

SCORED LEADS FOR OUTREACH:

${scoredLeads || '[Paste your scored leads from Step 3 here — include enrichment data for personalization]'}`,
  },
  {
    id: 'step-5',
    title: 'Meeting Prep',
    step: 5,
    description: 'Enter a company name → get a full briefing before an intro call or demo.',
    icon: 'FileText',
    color: 'indigo',
    estimatedTime: '15–30 min',
    output: 'data/company-briefs/[company]-brief.md',
    generatePrompt: (vertical, companyName, callType) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Meeting Prep Brief

Company: ${companyName || '[Company Name]'}
Call type: ${callType || 'Intro call'}
Vertical: ${vertical}

RESEARCH TASKS:
1. Visit their website — products, tone, delivery timeline, chat support
2. LinkedIn — company size, leadership, founder activity
3. Trustpilot / Google reviews — shipping, delay, cancellation complaints
4. Job listings — CX or support roles open?
5. Instagram/TikTok if available — founder presence

RETURN FORMAT:

# ${companyName || '[Company Name]'} — Meeting Brief

## Company Snapshot
- Products:
- Estimated team:
- Estimated revenue: [ESTIMATED]
- Main sales channel: [DTC / Amazon / retail]
- Shopify: [Yes / No / Likely]
- Support entry point visible: [chat / email / none]
- Support tools: [Gorgias / Zendesk / Inbox / Unknown]

## Why They Fit Assis
[3 specific reasons — not generic]

## Support Pain Signals Found
[List concrete things: specific reviews, job listings, site gaps]

## Buyer Profile
- Name:
- Title:
- Likely priorities: [revenue / efficiency / brand / ops]
- How they measure support today:
- LinkedIn:

## Recommended Assis Angle
[Which use case to lead with and the specific story to tell]

## 5 Custom Discovery Questions
1.
2.
3.
4.
5.

## Likely Objections + Responses
1. [Objection] → [Response specific to this company]
2. [Objection] → [Response specific to this company]

## Best Pilot Structure
- Use case:
- Channel: [Gorgias / Zendesk / Shopify Inbox]
- Target KPI:
- Why this works:

## Things to Avoid
[Anything sensitive to raise in this conversation]`,
  },
  {
    id: 'step-6',
    title: 'Pilot Proposal',
    step: 6,
    description: 'After a positive first call — enter company + use case → get a ready-to-send pilot proposal email.',
    icon: 'Send',
    color: 'teal',
    estimatedTime: '10 min',
    output: 'Send via email',
    generatePrompt: (vertical, companyName, useCase, channel) => `${MASTER_SYSTEM_PROMPT}

---

TASK: Pilot Proposal — ${companyName || '[Company Name]'}

Generate a pilot proposal email for this company.

Company: ${companyName || '[Company Name]'}
Vertical: ${vertical}
Agreed use case: ${useCase || '[e.g., Save cancellations during shipping delay window]'}
Support channel: ${channel || '[e.g., Gorgias]'}

Generate:

1. EMAIL SUBJECT LINE

2. EMAIL BODY (professional but direct, under 300 words)
   Include:
   - Duration: 30–45 days
   - Channel: ${channel || '[channel]'}
   - Use case: ${useCase || '[use case]'}
   - What we track (baseline metrics before + after)
   - What we need from them (Shopify access + channel access + 30-min kickoff)
   - Cost: Free as design partner
   - In return: case study + feedback + testimonial
   - Clear next step: specific days for kickoff call

3. LIGHTWEIGHT SLACK/WHATSAPP VERSION (under 100 words)

4. KICKOFF CALL AGENDA (30 minutes)

5. WEEKLY REVIEW TEMPLATE (to send each week during pilot)`,
  },
]

export const VERTICAL_OPTIONS = [
  'Home / Mattress / Furniture',
  'Consumer Electronics',
  'Beauty / Lifestyle',
]

export const SUBCATEGORIES = {
  'Home / Mattress / Furniture': [
    'Mattresses',
    'Beds & Bed Frames',
    'Sofas & Couches',
    'Custom / Made-to-Order Furniture',
    'Bedding & Pillows',
    'Rugs & Home Décor',
    'Kitchen & Dining',
  ],
  'Consumer Electronics': [
    'Air Purifiers',
    'Home Appliances',
    'Audio & Headphones',
    'Smart Home Devices',
    'Cameras & Accessories',
    'Wearables & Fitness Tech',
    'Coffee & Kitchen Appliances',
  ],
  'Beauty / Lifestyle': [
    'Skincare',
    'Haircare',
    'Supplements & Wellness',
    'Cosmetics & Makeup',
    'Personal Care',
    'Baby & Family',
    'Pet Care',
  ],
}

export const CALL_TYPE_OPTIONS = [
  'Intro call',
  'Demo',
  'Pilot close',
]
