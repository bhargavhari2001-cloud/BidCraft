/**
 * Seed Batch 4 — General (30)
 * Run: npx tsx scripts/seed-batch-4.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("Could not read .env.local — using existing env vars");
  }
}
loadEnvLocal();

interface BatchEntry {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  confidence_base: number;
}

const batch4Entries: BatchEntry[] = [
  // ── GENERAL entries 1-10 ──
  {
    question: "Provide a company overview of TechBridge Solutions.",
    answer: "We are TechBridge Solutions, a technology services and consulting firm founded in 2012 and headquartered in Atlanta, Georgia. We specialize in cloud transformation, enterprise software development, data engineering, and managed security services for mid-market and enterprise clients across healthcare, financial services, public sector, and retail industries. Our team of 320 full-time professionals brings deep domain expertise and holds more than 500 active technical certifications across AWS, Microsoft Azure, Google Cloud, and cybersecurity disciplines. Since our founding, we have grown to serve more than 180 active clients, completing over 600 engagements with a client retention rate exceeding 94%. We operate three delivery centers — Atlanta, Chicago, and Austin — supplemented by a distributed remote workforce that enables flexible staffing models aligned to client needs. Our mission is to accelerate digital transformation by bridging the gap between technology potential and measurable business outcomes. We differentiate through outcome-based delivery models, deep vertical expertise, and a culture of continuous innovation that keeps our clients ahead of rapidly evolving technology landscapes. TechBridge Solutions is privately held, debt-free, and has achieved year-over-year revenue growth of 28% for the past four consecutive years.",
    category: "General",
    tags: ["company-overview", "about-us", "it-services", "history", "mission"],
    confidence_base: 0.92,
  },
  {
    question: "What are your organization's core values and corporate culture?",
    answer: "We operate according to five core values that shape every client engagement, hiring decision, and internal process at TechBridge Solutions. Integrity drives us to be transparent with clients about risks, constraints, and honest assessments even when the truth is uncomfortable. Excellence motivates us to pursue mastery in our craft, investing more than 80 hours per employee annually in learning and certification. Ownership means every team member takes personal accountability for outcomes rather than deflecting responsibility — we celebrate solutions, not excuses. Collaboration reflects our belief that diverse perspectives produce better technical decisions, and we foster psychological safety where all voices contribute to architectural and strategic discussions. Innovation keeps us curious and forward-looking, with a dedicated research lab exploring emerging technologies before clients ask. Our culture measures success through client outcomes rather than billable hours, and our compensation model rewards long-term client satisfaction scores alongside technical delivery metrics. We maintain a distributed-first work environment with 68% of our workforce working remotely, supported by intentional connection rituals including quarterly in-person gatherings and weekly all-hands sessions. Our employee Net Promoter Score of 72 and voluntary attrition rate of 8% reflect a culture where talented professionals choose to grow their careers with us over the long term.",
    category: "General",
    tags: ["values", "culture", "mission", "principles", "corporate"],
    confidence_base: 0.90,
  },
  {
    question: "Describe your organization's financial stability and revenue trajectory.",
    answer: "We are a privately held, profitable company with no external debt and a strong balance sheet that supports sustained investment in talent, technology, and client service delivery. TechBridge Solutions has achieved consistent revenue growth, expanding from $18 million in 2019 to $74 million in fiscal year 2024, representing a compound annual growth rate of 32% over five years. Our revenue mix is diversified across project-based engagements (45%), managed services retainers (38%), and staff augmentation (17%), providing stability that project-only firms cannot match. Managed services revenue provides recurring, predictable income that funds operational continuity and technology investment independent of new business cycles. Our operating margin has consistently exceeded 18% over the past three fiscal years, demonstrating disciplined cost management alongside aggressive growth. We maintain a cash reserve equivalent to six months of operating expenses, ensuring we can meet payroll, invest in training, and absorb project transitions without financial stress. Our Accounts Receivable days outstanding average 32 days, reflecting healthy client payment discipline and strong contractual terms. We are audited annually by an independent CPA firm, and we provide audited financial summaries to clients upon request under mutual NDA. Our financial stability supports multi-year client commitments, capacity scaling, and the technology investments required to deliver complex, long-duration engagements reliably.",
    category: "General",
    tags: ["financial-stability", "revenue", "growth", "profitability", "private"],
    confidence_base: 0.89,
  },
  {
    question: "Where are your offices located and what is your geographic delivery footprint?",
    answer: "We maintain three primary office locations and a distributed remote delivery capability that spans the continental United States and select international markets. Our headquarters is in Atlanta, Georgia, housing executive leadership, our healthcare and financial services practice leads, and our primary Security Operations Center. Our Chicago office serves as our Midwest delivery hub, specializing in financial services and manufacturing sector engagements with a team of 85 professionals. Our Austin, Texas office anchors our technology and cloud-native practice, serving high-growth technology companies and public sector clients across the South and Southwest. Beyond these offices, 68% of our workforce operates remotely, enabling us to staff engagements with top talent regardless of geographic constraints and to serve clients in markets without a physical office presence. We have delivered projects in 38 U.S. states and maintain active client relationships in the United Kingdom, Canada, and Australia through partner arrangements for in-country support. Our delivery model is deliberately flexible — we staff engagements on-site, remotely, or in hybrid configurations based on client preference and project requirements. We have invested in secure collaboration infrastructure including dedicated client workspace environments, encrypted communication tools, and asynchronous documentation practices that enable effective remote delivery without compromising quality or security standards.",
    category: "General",
    tags: ["locations", "offices", "geographic", "delivery", "presence"],
    confidence_base: 0.88,
  },
  {
    question: "Describe your AWS partnership status and benefits.",
    answer: "We hold AWS Premier Tier Services Partner status, representing the highest designation in the AWS Partner Network and reflecting our sustained investment in AWS expertise, client outcomes, and go-to-market alignment. To achieve and maintain Premier status, we have met rigorous requirements including a minimum of 75 AWS-certified professionals across Architect, Developer, DevOps, Security, and specialty domains, validated customer references demonstrating successful AWS deployments, and annual revenue thresholds evidencing significant AWS business. Our AWS competencies include Migration and Modernization, DevOps, Security, and Healthcare, each requiring documented client case studies and technical validation by AWS. As a Premier Partner, we receive dedicated AWS Partner Development Managers who provide early access to new service announcements, co-selling support for enterprise deals, and joint go-to-market funding for marketing and events. We participate in the AWS ISV Accelerate program for our proprietary tools and the AWS Marketplace for solution listings accessible to clients through consolidated billing. Our Premier status enables us to access AWS Support concierge services for critical client escalations, reducing resolution timelines for complex technical issues. We have facilitated more than $12 million in AWS credits for clients through Migration Acceleration Program funding and AWS Activate credits for startup clients, directly reducing cloud transition costs and accelerating time to value.",
    category: "General",
    tags: ["aws", "partnership", "premier", "cloud", "certifications"],
    confidence_base: 0.90,
  },
  {
    question: "What is your Microsoft Solutions Partner designation and specializations?",
    answer: "We hold Microsoft Solutions Partner designation with earned specializations in Infrastructure (Azure), Data and AI (Azure), and Digital and App Innovation (Azure), reflecting our demonstrated capability and client success across Microsoft's core cloud solution areas. Microsoft Solutions Partner designation requires meeting capability scores across performance, skilling, and customer success metrics — we maintain top-quartile performance across all three dimensions with 42 Microsoft-certified professionals holding Azure credentials at the Associate and Expert levels. Our earned specializations require additional validation: Infrastructure specialization validates our Azure migration and hybrid capabilities through references and assessment; Data and AI validates our analytics and machine learning delivery through documented client outcomes; Digital and App Innovation validates our cloud-native development expertise through architecture reviews and client references. As a Solutions Partner, we receive access to Microsoft's partner sales team for co-selling on enterprise opportunities, Microsoft funding programs including Azure Migrate and Modernize incentives, and early access to product roadmaps for planning client technology strategies. We participate in Microsoft's FastTrack program as a recognized delivery partner, enabling clients to accelerate Microsoft 365 and Azure deployments with Microsoft-funded support. Our Microsoft practice generates approximately $22 million in annual Azure-related revenue and has grown 45% year over year, reflecting strong client demand for our Azure expertise and the Microsoft ecosystem's continued enterprise adoption growth.",
    category: "General",
    tags: ["microsoft", "partner", "azure", "gold", "specialization"],
    confidence_base: 0.89,
  },
  {
    question: "Describe your Google Cloud Partner status and expertise areas.",
    answer: "We hold Google Cloud Partner status with specializations in Infrastructure, Data Analytics, and Application Development, earned through demonstrated client outcomes, certified personnel, and validated technical capability assessments conducted by Google Cloud's partner engineering team. Our Google Cloud practice includes 28 certified professionals across Professional Cloud Architect, Professional Data Engineer, Professional Machine Learning Engineer, and Professional DevOps Engineer certifications, providing depth across the full GCP service catalog. Our Infrastructure specialization covers GKE deployments, Anthos hybrid cloud management, and enterprise migration programs using the Google Cloud Adoption Framework. Our Data Analytics specialization addresses BigQuery implementation, Dataflow streaming pipelines, and Looker business intelligence deployments for clients managing petabyte-scale analytics workloads. Our Application Development specialization spans Cloud Run serverless workloads, Firebase mobile backends, and Cloud Functions event-driven architectures enabling rapid application delivery. As a Google Cloud Partner, we access partner engineering support for complex technical challenges, joint business planning with Google's enterprise sales team, and co-marketing opportunities including participation in Google Cloud Next and regional Cloud Summit events. We have delivered Google Cloud solutions generating more than $8 million in annual GCP spend for clients spanning media, retail, and healthcare sectors, consistently achieving Google Cloud's customer satisfaction thresholds required for partner status maintenance.",
    category: "General",
    tags: ["google-cloud", "gcp", "partner", "specialization", "certifications"],
    confidence_base: 0.88,
  },
  {
    question: "Describe your HIMSS membership and participation in industry activities.",
    answer: "We hold HIMSS Corporate Membership, reflecting our commitment to healthcare IT advancement and our active engagement in the global health information and technology community. Our HIMSS membership enables our team to participate in the full range of HIMSS education programs, including virtual learning series, webinars, and the annual HIMSS Global Health Conference and Exhibition where we maintain a presence every year. We contribute to HIMSS working groups focused on interoperability standards, cybersecurity, and clinical informatics, with three of our senior consultants serving as active HIMSS volunteer committee members in the past two years. Our participation in HIMSS Davies Award review panels allows us to stay current on health IT excellence benchmarks and share our implementation expertise with the broader community. TechBridge Solutions team members hold HIMSS Certified Associate in Healthcare Information and Management Systems (CAHIMS) and Certified Healthcare Technology Specialist (CHTS) credentials, reinforcing our technical healthcare IT expertise with recognized professional standards. We leverage our HIMSS network to stay ahead of emerging regulatory requirements, reimbursement model changes, and technology adoption trends that affect our healthcare clients' strategic planning. Our HIMSS engagement also supports recruiting — healthcare IT professionals value employers active in the HIMSS community as signals of domain commitment and professional development investment.",
    category: "General",
    tags: ["himss", "healthcare-it", "membership", "industry", "community"],
    confidence_base: 0.87,
  },
  {
    question: "What is your CHIME Corporate Partner status and activities?",
    answer: "We hold CHIME Corporate Partner status, connecting us directly with the College of Healthcare Information Management Executives and its membership of more than 5,000 healthcare CIOs, CTOs, and digital health leaders across the United States and internationally. As a CHIME Corporate Partner, we participate in CHIME's annual Fall Forum and ViVE conferences, where our executives engage in educational sessions, networking events, and roundtable discussions addressing the most pressing healthcare IT leadership challenges. Our participation in CHIME's Healthcare IT leadership community allows us to understand first-hand the strategic priorities and operational constraints that healthcare CIOs navigate, directly informing how we design and propose solutions for our healthcare clients. We have contributed to CHIME's Healthcare's Most Wired program as a supporting organization, helping member health systems assess and benchmark their digital capabilities against national standards. Three of our senior healthcare IT practice leaders participate in CHIME LEAD Forum programs, expanding their executive leadership skills alongside health system CIOs in a peer learning environment. Our CHIME Corporate Partner relationship generates qualified introductions to healthcare CIO prospects through CHIME's partner engagement programs and enables us to demonstrate our credibility within the healthcare leadership community. We view our CHIME partnership as a strategic investment in building long-term relationships with healthcare IT decision-makers who become clients and advocates.",
    category: "General",
    tags: ["chime", "cio", "healthcare", "corporate-partner", "industry"],
    confidence_base: 0.86,
  },
  {
    question: "How do you participate in HL7 and FHIR standards development?",
    answer: "We actively participate in HL7 International and the FHIR community as organizational members, contributing technical expertise to accelerate healthcare interoperability standards that directly benefit our clients and the broader healthcare ecosystem. Our HL7 participation includes membership in FHIR Accelerator programs — the Da Vinci Project for value-based care use cases, the Argonaut Project for clinical data access, and the CARIN Alliance for consumer-directed exchange — where our engineers contribute to implementation guide development and reference implementation projects. We have contributed code to open-source FHIR tooling repositories including HAPI FHIR and the SMART on FHIR client libraries, with four accepted pull requests in the past 18 months addressing conformance testing and OAuth 2.0 integration improvements. Our team members attend HL7 Working Group Meetings held three times annually, participating in Clinical Interoperability Council and FHIR Infrastructure workgroups to stay current on specification evolution. We publish FHIR implementation guidance through our technical blog and have delivered conference presentations at HL7 DevDays and HIMSS Interoperability Showcase on our production FHIR R4 deployments. Our FHIR expertise enables clients to achieve ONC information blocking compliance, CMS interoperability rule compliance, and accelerated TEFCA network participation. TechBridge Solutions has implemented FHIR R4 APIs for seven healthcare clients, handling more than 50 million API calls monthly across payer and provider use cases.",
    category: "General",
    tags: ["hl7", "fhir", "standards", "interoperability", "healthcare-it"],
    confidence_base: 0.87,
  },
  // ── GENERAL entries 11-20 ──
  {
    question: "Provide an overview of your organization's certifications and accreditations.",
    answer: "We maintain a comprehensive portfolio of certifications and accreditations that validate our quality management systems, security practices, and technical capabilities across multiple international and industry-specific standards frameworks. Our current active certifications include ISO 9001:2015 Quality Management System, ISO 27001:2022 Information Security Management System, SOC 2 Type II covering all five Trust Services Criteria, and CMMI Dev Maturity Level 3. We also hold healthcare-specific credentials including HITRUST CSF r2 Certified status and HIPAA compliance program documentation prepared by qualified outside counsel. Industry partnership certifications span AWS Premier Tier Services Partner, Microsoft Solutions Partner with three specializations, and Google Cloud Partner with three specializations. Our cybersecurity team holds individual certifications including CISSP, CISM, CEH, GCIA, GCIH, and AWS Security Specialty across 18 security-focused team members. On the cloud and development side, we maintain more than 500 active technical certifications across all three major cloud platforms and development frameworks. We treat certifications not as marketing credentials but as operational frameworks that directly improve delivery quality, reduce client risk, and provide auditable evidence of our commitment to professional standards. All certifications are subject to annual surveillance audits or renewal requirements, and we maintain a certification calendar managed by our Quality and Compliance Director to ensure no lapse in coverage.",
    category: "General",
    tags: ["certifications", "accreditations", "iso", "cmmi", "soc2"],
    confidence_base: 0.90,
  },
  {
    question: "What is your CMMI appraisal level and what does it mean for clients?",
    answer: "We hold a CMMI Dev Maturity Level 3 appraisal, formally assessed by an authorized CMMI Lead Appraiser, indicating that our software development processes are well-characterized, understood, and described in standards, procedures, tools, and methods across the organization. At Maturity Level 3, our processes are proactively managed rather than reactively applied — we establish defined processes at the organizational level that are tailored consistently for individual projects, ensuring predictable outcomes regardless of which team or project manager a client works with. Key process areas at Level 3 include Requirements Development and Management, ensuring we capture and validate requirements systematically; Technical Solution, governing how we design and implement to specification; Verification and Validation, ensuring quality is built in rather than inspected out; and Integrated Project Management, ensuring projects follow defined plans with disciplined monitoring. For clients, our CMMI Level 3 appraisal provides objective assurance that they are not dependent on individual heroics — our delivery quality is a function of organizational capability, not luck. This matters particularly for large programs where multiple teams work in parallel, for regulated industries requiring process evidence during audits, and for clients with previous experiences of inconsistent delivery quality from less mature vendors. Our CMMI appraisal is renewed every three years, with our most recent appraisal completed in 2023 with zero weaknesses noted by the Lead Appraiser across all assessed process areas.",
    category: "General",
    tags: ["cmmi", "maturity", "process", "software-development", "quality"],
    confidence_base: 0.89,
  },
  {
    question: "Describe your ISO 9001 Quality Management System.",
    answer: "We operate an ISO 9001:2015-certified Quality Management System that governs how we plan, deliver, monitor, and improve services across all client engagements, with certification maintained through annual surveillance audits and triennial recertification conducted by an accredited certification body. Our QMS establishes documented processes for the full service delivery lifecycle — from opportunity qualification and requirements gathering through delivery execution, quality review, and client feedback collection — ensuring consistent application of best practices regardless of team or project. Quality objectives are defined annually by executive leadership and include on-time delivery rate targets above 95%, client satisfaction scores above 4.5 out of 5.0, defect escape rate targets below 0.5% for software releases, and first-time audit pass rates above 98%. Internal audits conducted semi-annually by trained internal auditors evaluate process adherence and identify improvement opportunities, with findings tracked to closure through our governance platform. Management Review meetings held quarterly assess QMS performance, audit results, client feedback trends, and continual improvement initiatives, with documented minutes and action items reviewed at subsequent sessions. Our Corrective and Preventive Action process ensures that quality failures result in root cause analysis and systemic improvements rather than isolated fixes. TechBridge Solutions has maintained ISO 9001 certification since 2017, with our most recent recertification audit in 2024 receiving commendations from the auditor for our use of data analytics to drive quality improvement decisions.",
    category: "General",
    tags: ["iso-9001", "quality-management", "qms", "process", "certification"],
    confidence_base: 0.89,
  },
  {
    question: "What minority, women-owned, or diversity business certifications do you hold?",
    answer: "We are a certified Minority Business Enterprise through the National Minority Supplier Development Council, with our MBE certification reflecting the majority ownership and operational control of TechBridge Solutions by our founder and CEO, who identifies as a first-generation American of South Asian descent. Our NMSDC certification is renewed annually and recognized by hundreds of corporate members and government agencies seeking to meet supplier diversity commitments in their procurement programs. We are also registered in SAM.gov as an MBE for federal procurement purposes and hold state-level MBE certifications in Georgia, Illinois, and Texas aligned with our office locations. Our diversity certifications are substantive rather than nominal — our leadership team is 55% diverse including our CEO, CTO, and Chief Delivery Officer, and our workforce is 48% diverse across racial, ethnic, and gender dimensions. We actively pursue relationships with prime contractors seeking to meet MBE subcontracting goals, and we have served as a certified MBE subcontractor on seven federal and state government contracts in the past three years. Our diversity certifications open procurement doors, but our retention of those clients depends entirely on delivery excellence — 100% of our MBE-designation-driven engagements have resulted in contract renewals or follow-on work. We are actively pursuing WBE certification for two of our women-led business units, expected to be awarded in the current fiscal year.",
    category: "General",
    tags: ["mbe", "wbe", "diversity", "certification", "small-business"],
    confidence_base: 0.88,
  },
  {
    question: "How do you support small business utilization and subcontracting goals?",
    answer: "We actively support small business utilization through both our role as a certified small business and our commitment to subcontracting work to qualified small, disadvantaged, veteran-owned, and women-owned firms when we serve as a prime contractor. As a firm with fewer than 500 employees and annual revenues below the SBA size standards for NAICS codes 541511 and 541512, we qualify as a small business for applicable federal and state procurement programs. When serving as a prime contractor on government contracts with small business subcontracting requirements, we develop and execute formal Small Business Subcontracting Plans that establish category-specific utilization targets and reporting commitments. We maintain a curated network of 35-plus qualified small business subcontractors spanning cloud engineering, cybersecurity, data analytics, and UX design disciplines, enabling us to fulfill subcontracting commitments with vetted, high-performing firms rather than token arrangements. Our subcontractor onboarding process includes capabilities assessment, financial stability review, and a probationary pilot engagement before including partners in competitive bids. We provide small business subcontractors with mentorship through informal teaming relationships, sharing our quality management processes, proposal best practices, and client management frameworks that help our partners grow. TechBridge Solutions has exceeded small business subcontracting plan targets on all four federal contracts requiring formal plans, achieving an average of 112% of committed small business spend percentages.",
    category: "General",
    tags: ["small-business", "subcontracting", "utilization", "sba", "diversity"],
    confidence_base: 0.87,
  },
  {
    question: "Describe your corporate governance structure and board composition.",
    answer: "We operate under a governance structure that combines executive leadership accountability with independent Board of Advisors oversight, providing the strategic guidance and governance rigor appropriate for a privately held company of our scale and complexity. Our Board of Advisors consists of five members: our founder and CEO, two independent technology industry executives with board experience at public companies, one healthcare industry operating executive, and one financial services sector leader. Board of Advisors meetings are held quarterly, reviewing financial performance, strategic initiatives, risk management, and major business decisions including acquisitions, significant capital expenditures, and new market entry strategies. The Board's Technology and Innovation Committee convenes bi-annually to assess our technology roadmap, competitive positioning, and investment priorities in emerging service areas. Our executive leadership team operates under a clearly defined delegation of authority policy that specifies spending approvals, contractual commitments, and hiring decisions at each organizational level, ensuring appropriate controls without bureaucratic delays. An Ethics and Compliance Committee reviews policy adherence, conflict of interest disclosures, and any potential violations of our Code of Business Ethics, with direct reporting authority to the Board. We conduct an annual Board-level review of enterprise risk management, assessing technology, operational, financial, and reputational risks with documented mitigation strategies. Our governance practices reflect our ambition to operate with the rigor of a public company while maintaining the agility advantages of private ownership.",
    category: "General",
    tags: ["governance", "board", "corporate", "structure", "leadership"],
    confidence_base: 0.88,
  },
  {
    question: "Provide an overview of your executive leadership team.",
    answer: "We are led by an experienced executive team combining deep technology expertise with operational and business leadership skills honed across decades of enterprise IT delivery. Our CEO and Founder, Rajan Patel, brings 22 years of technology consulting and entrepreneurship experience, having previously led delivery organizations at two Fortune 500 technology firms before founding TechBridge Solutions in 2012. Our Chief Technology Officer, Dr. Sarah Chen, holds a doctorate in Computer Science from Carnegie Mellon and 18 years of hands-on engineering and architecture experience spanning cloud platforms, distributed systems, and AI applications. Our Chief Delivery Officer, Marcus Williams, oversees our delivery operations across 180-plus active client engagements, having spent 15 years managing large-scale program delivery at Accenture and Deloitte before joining TechBridge Solutions. Our Chief Revenue Officer, Alicia Moreno, leads sales, marketing, and partnerships, bringing 16 years of enterprise technology sales leadership and a track record of building high-growth revenue organizations. Our Chief Financial Officer, David Park, manages financial operations, legal, and compliance, with a background spanning public accounting and CFO roles at two technology services firms. Our Chief Information Security Officer, James Okonkwo, holds CISSP and CISM certifications and 14 years of security leadership experience in healthcare and financial services. The leadership team averages 17 years of industry experience and has collectively delivered technology programs for over 300 enterprise clients, providing the strategic depth and operational credibility our clients require for complex, mission-critical engagements.",
    category: "General",
    tags: ["executive", "leadership", "ceo", "cto", "management"],
    confidence_base: 0.89,
  },
  {
    question: "Describe your media coverage, industry recognition, and awards.",
    answer: "We have earned consistent recognition from industry analysts, trade publications, and peer organizations that validates our delivery capabilities and market position in the competitive technology services landscape. TechBridge Solutions has been named to the Inc. 5000 list of America's Fastest-Growing Private Companies for three consecutive years, ranking in the top 500 in the IT services category based on revenue growth. Consulting Magazine named us one of the Best Firms to Work For in our size category two years running, reflecting employee satisfaction and professional development investments. We have received AWS Partner of the Year recognition in the Southeast region for two consecutive years, a competitive distinction based on customer satisfaction, innovation, and revenue performance within the AWS partner ecosystem. CRN Magazine has included us on its Solution Provider 500 list for the past two years, recognizing our scale and growth among technology solution providers nationally. Our healthcare IT work has been highlighted in Health Data Management, Healthcare IT News, and Modern Healthcare, with case studies featuring our FHIR interoperability and population health analytics implementations. Analyst firms including Gartner have cited our approaches to DevSecOps and cloud migration in research notes, and we have been quoted as industry sources in Wall Street Journal technology coverage. We view industry recognition as a reflection of client success rather than a primary goal — every award and mention traces back to outcomes we delivered for clients who were willing to share their stories publicly.",
    category: "General",
    tags: ["awards", "recognition", "media", "industry", "press"],
    confidence_base: 0.87,
  },
  {
    question: "How do you measure and report client satisfaction?",
    answer: "We measure client satisfaction through a multi-dimensional program that captures quantitative scores, qualitative feedback, and behavioral loyalty indicators, providing our leadership team with a complete picture of how clients experience our work across every engagement. We administer Net Promoter Score surveys quarterly to all active engagement sponsors and executive stakeholders, achieving a consistent organizational NPS of 68 over the past eight quarters — well above the technology services industry average of 41. Post-milestone surveys gather more granular feedback on delivery quality, communication effectiveness, responsiveness, and value for investment after each major program phase or deliverable acceptance. Our Client Success Managers conduct structured quarterly business reviews with every account spending more than $250,000 annually, reviewing objectives progress, escalating any emerging concerns, and documenting client priorities for the upcoming quarter. We track behavioral satisfaction indicators including contract renewal rates, scope expansion velocity, and reference willingness — our 94% renewal rate and the fact that 72% of new revenue comes from existing clients or their referrals are the most meaningful satisfaction metrics we track. Client feedback is reviewed in monthly leadership meetings and feeds directly into delivery process improvements and individual performance evaluations. When satisfaction scores decline, our Client Recovery Protocol requires the account executive and delivery lead to jointly develop and present a remediation plan to the client within five business days of score receipt.",
    category: "General",
    tags: ["client-satisfaction", "nps", "csat", "feedback", "retention"],
    confidence_base: 0.89,
  },
  {
    question: "How do you develop and publish client case studies?",
    answer: "We develop client case studies through a structured process that captures measurable outcomes, preserves client voice, and creates reference materials that prospective clients can use to evaluate our capabilities in contexts directly relevant to their own challenges. Our case study development begins during delivery — project managers document baseline metrics, implementation approaches, and outcome milestones as they occur, building the factual foundation before the engagement closes. Post-engagement, our marketing team conducts a 45-minute structured interview with the client's primary decision-maker, exploring business context, selection criteria, delivery experience, and quantified results achieved. Case studies follow a Problem-Approach-Results structure designed to be readable by both technical evaluators and executive decision-makers, with a summary metrics box highlighting the top three to five quantified outcomes prominently. All case studies require explicit written approval from the client before publication, with a review cycle that allows clients to verify accuracy, request anonymization of sensitive details, and confirm they are comfortable with public attribution. We maintain a library of more than 85 published case studies organized by industry, service line, and technology platform, accessible through our website and sales team. For clients preferring not to be publicly named, we develop anonymized case studies that preserve outcome metrics and technical detail while protecting client identity. Our case study program generates qualified inbound interest, with prospects frequently citing a specific case study as their reason for initiating contact with our sales team.",
    category: "General",
    tags: ["case-studies", "client-stories", "outcomes", "marketing", "reference"],
    confidence_base: 0.86,
  },
  // ── GENERAL entries 21-30 ──
  {
    question: "Describe your thought leadership and content program.",
    answer: "We operate a structured thought leadership program that produces original, practitioner-authored content across multiple channels, positioning TechBridge Solutions as a trusted expert voice in cloud transformation, healthcare IT, cybersecurity, and data engineering. Our content program produces a minimum of four long-form technical blog posts per month authored by our engineering and consulting staff, covering emerging technology topics, lessons learned from delivery, and practical implementation guidance with code examples and architecture diagrams. We publish quarterly white papers on topics at the intersection of technology and our target industry verticals — recent titles have addressed FHIR R4 production deployment patterns, Zero Trust implementation for healthcare payers, and FinOps maturity frameworks for mid-market enterprises. Our monthly TechBridge Insights newsletter reaches 8,400 subscribers comprising CIOs, CTOs, and technology leaders across our target markets, delivering curated commentary on technology trends relevant to their strategic planning. We host a bi-monthly podcast, Cloud Forward, featuring conversations with engineering leaders about real-world cloud transformation challenges and solutions, accumulating 12,000 downloads per episode on average. Content quality is governed by a peer review process requiring all published material to be reviewed by at least one subject matter expert and our content director before publication. Our thought leadership generates measurable pipeline impact — 24% of new business inquiries in the past fiscal year cited a TechBridge content asset as their initial point of engagement.",
    category: "General",
    tags: ["thought-leadership", "content", "blog", "whitepapers", "expertise"],
    confidence_base: 0.86,
  },
  {
    question: "What industry conferences do your leaders speak at?",
    answer: "We maintain an active conference speaking program that places TechBridge Solutions leaders and subject matter experts on stages at the most influential technology and industry events attended by our clients and prospects. Our executives and senior practitioners presented at 22 conferences in the past 12 months, spanning healthcare IT, cloud technology, and cybersecurity domains. HIMSS Annual Conference is our most important healthcare IT speaking venue, where we have delivered three to five sessions annually for the past four years covering interoperability, cloud migration, and analytics topics evaluated competitively through HIMSS's abstract review process. AWS re:Invent has featured our engineers presenting technical sessions on healthcare cloud architectures and DevSecOps implementations, reaching thousands of cloud practitioners. We present regularly at ViVE, the College of Healthcare Information Management Executives annual conference, CHIME Fall Forum, and Health Datapalooza on digital health and data strategy topics. In cybersecurity, our CISO and security practice leaders speak at RSA Conference, AWS re:Inforce, and regional ISACA and ISSA chapter events. Microsoft Build and Google Cloud Next have featured our solution architects presenting customer success stories and technical deep dives. Our speaking selection is intentional — we target events where our clients and prospective clients are the audience, and we measure speaking program ROI through qualified opportunity generation and brand awareness metrics captured in post-event surveys.",
    category: "General",
    tags: ["conferences", "speaking", "himss", "aws-reinvent", "industry"],
    confidence_base: 0.85,
  },
  {
    question: "Describe your Research and Innovation Lab and its outputs.",
    answer: "We operate a Research and Innovation Lab staffed by six full-time researchers and engineers dedicated to evaluating emerging technologies, building proof-of-concept implementations, and developing proprietary accelerators that give our delivery teams and clients a competitive advantage. The Lab operates on a quarterly research cycle, selecting focus areas based on client advisory board input, technology trend analysis, and strategic competitive positioning. Current active research tracks include generative AI integration patterns for healthcare workflows, post-quantum cryptography migration strategies for regulated industries, and edge computing architectures for real-time clinical monitoring use cases. Lab outputs take multiple forms — research reports shared with clients and published publicly, open-source tooling contributed to the developer community, proprietary accelerator frameworks incorporated into our delivery methodology, and patent applications protecting novel approaches. In the past two years, the Lab has published 14 research reports, contributed five open-source repositories with more than 200 combined GitHub stars, and developed four proprietary delivery accelerators that have reduced project kickoff timelines by an average of three weeks. Our Lab engineers present research findings at industry conferences, establishing TechBridge Solutions as a credible voice in emerging technology discussions. Client advisory board members receive early access to Lab research findings, providing exclusive insight into technology trends that inform their multi-year strategic roadmaps before we publish publicly.",
    category: "General",
    tags: ["innovation", "research", "r&d", "lab", "emerging-technology"],
    confidence_base: 0.85,
  },
  {
    question: "What intellectual property and patents does your organization hold?",
    answer: "We hold a portfolio of intellectual property spanning registered trademarks, pending patent applications, and proprietary software frameworks developed through our client delivery and research programs. Our trademark portfolio includes the TechBridge Solutions name and logo, the CloudBridge Migration Framework brand, and the HealthLink Interoperability Accelerator product name, all registered with the USPTO and protected in key international markets. We have filed four patent applications in the past three years covering novel approaches to healthcare data de-identification for federated analytics, automated cloud cost anomaly detection using behavioral baselines, dynamic FHIR resource mapping across heterogeneous EHR schemas, and zero-downtime database schema migration orchestration for multi-tenant SaaS platforms. Our proprietary software frameworks — including the CloudBridge Migration Assessment Toolkit, the HealthLink FHIR Accelerator, and the SecureOps DevSecOps Pipeline Library — are licensed to clients under defined commercial terms that allow client use without transferring underlying IP ownership. We maintain clear IP ownership provisions in all client contracts, ensuring that work product developed using our frameworks and methodologies remains owned by TechBridge Solutions unless explicitly negotiated otherwise. Our IP portfolio represents significant investment and competitive differentiation — we reinvest 4% of annual revenue into R&D activities that generate new IP, and we actively evaluate opportunities to license our proprietary tools to complementary technology partners.",
    category: "General",
    tags: ["intellectual-property", "patents", "ip", "proprietary", "innovation"],
    confidence_base: 0.84,
  },
  {
    question: "Describe your open source program and community contributions.",
    answer: "We maintain an active open source program that reflects our belief in giving back to the developer communities whose tools underpin our client delivery, while building brand credibility and recruiting pipelines among technically sophisticated engineers who value employers that contribute to the ecosystem. Our Open Source Program Office governs contribution policies, approves new project releases, and ensures that open-sourced code does not inadvertently expose proprietary client data, trade secrets, or security vulnerabilities. Our public GitHub organization hosts 18 repositories accumulated over six years, covering topics including Terraform module libraries for healthcare cloud deployments, FHIR R4 testing utilities, Kubernetes policy libraries for regulated industries, and DevSecOps pipeline templates. Our most popular repository, a FHIR validation testing framework, has accumulated 340 stars and 85 forks from healthcare IT engineers globally, and has been cited in three industry research reports as a community reference implementation. We contribute pull requests to upstream projects we depend on, including HAPI FHIR, Open Policy Agent, and Backstage, with 23 accepted contributions in the past 18 months addressing bugs, documentation gaps, and performance improvements. Our engineers participate in open source community forums, Discord channels, and GitHub Discussions for the projects we use most heavily, building relationships and reputation within those communities. We allocate up to four hours per week per engineer for approved open source contribution activities, treating community engagement as a legitimate professional development and company investment activity.",
    category: "General",
    tags: ["open-source", "github", "community", "contributions", "program"],
    confidence_base: 0.84,
  },
  {
    question: "What employee health, wellness, and benefits programs do you offer?",
    answer: "We offer a comprehensive benefits package designed to support the physical, mental, and financial wellbeing of our team members and their families, reflecting our belief that investing in employee wellbeing directly correlates with delivery quality and client outcomes. Our health benefits include three medical plan options including a zero-deductible PPO plan for employees who prefer comprehensive coverage without out-of-pocket cost uncertainty, dental and vision coverage with above-market employer contribution rates, and employer-funded Health Savings Account contributions of $750 for individuals and $1,500 for families annually. Mental health benefits include access to Headspace premium subscriptions, an Employee Assistance Program providing eight free therapy sessions per year per employee, and a dedicated mental health PTO policy allowing two additional personal wellness days per year without requiring manager approval or explanation. Physical wellness programs include a $600 annual fitness reimbursement applicable to gym memberships, fitness equipment, sports leagues, or wellness apps, and optional access to a virtual fitness platform with 150 or more live and on-demand classes weekly. Our parental leave policy provides 16 weeks of paid leave for primary caregivers and six weeks for secondary caregivers regardless of gender, substantially above industry averages. We conduct an annual benefits survey with 80% or higher participation rates, and we update our benefits package annually based on survey results — three benefits introduced in the past two years were direct responses to employee feedback on gaps in coverage.",
    category: "General",
    tags: ["wellness", "benefits", "health", "employee", "perks"],
    confidence_base: 0.86,
  },
  {
    question: "Describe your total compensation philosophy and benefits package.",
    answer: "We design our total compensation program to attract and retain top technology talent by targeting median-to-above-median cash compensation combined with meaningful long-term incentive participation and industry-leading benefits, competing effectively against both large consulting firms and high-growth technology companies. Our cash compensation philosophy targets the 65th percentile of market for each role and geography, benchmarked annually using Radford, Levels.fyi, and Mercer compensation surveys to ensure our pay remains competitive as market rates evolve rapidly in technology talent markets. Performance bonuses are paid semi-annually, with pools funded based on company financial performance and individual ratings, averaging 12% of base salary for fully performing employees and reaching 25% or higher for exceptional performers in critical roles. We offer a phantom equity program for senior employees and key contributors, providing meaningful upside participation in company value creation without requiring equity dilution — phantom equity units vest over four years with a one-year cliff, and participants have received payouts averaging $28,000 per year for vested units in the past two payout cycles. Our 401(k) program matches 100% of the first 4% of employee contributions with no vesting cliff, enabling immediate access to employer match contributions. Total compensation statements are provided annually to all employees, transparently presenting the full value of cash, benefits, bonuses, and equity participation to ensure team members understand the comprehensive value of their employment relationship with TechBridge Solutions.",
    category: "General",
    tags: ["compensation", "benefits", "salary", "equity", "total-rewards"],
    confidence_base: 0.86,
  },
  {
    question: "How does your remote-first or flexible work culture operate?",
    answer: "We operate as a distributed-first company where remote work is the default and in-person collaboration is intentional rather than mandatory, enabling us to hire top talent nationally and provide flexibility that our team members consistently cite as a top retention factor in engagement surveys. Sixty-eight percent of our workforce is fully remote, distributed across 31 U.S. states, with no expectation of relocation to an office city. Our three office locations — Atlanta, Chicago, and Austin — serve as collaboration hubs available to local team members and as hosting spaces for quarterly all-hands gatherings and client executive briefings. We have invested in the infrastructure and rituals that make distributed work effective: standardized asynchronous documentation practices using Notion for persistent knowledge, Loom for async video communication that replaces unnecessary synchronous meetings, and structured Slack channel conventions that reduce information retrieval friction. Every team has a defined meeting-minimal cadence — we protect four hours of uninterrupted deep work time daily by default, reserving synchronous collaboration for decisions requiring real-time deliberation. Client-facing roles may require periodic on-site presence determined by client preference and contract requirements, and we are transparent about any on-site obligations during the recruiting process. Our remote-first culture has expanded our talent access dramatically — 40% of our hires in the past two years were from markets where we have no office, and our voluntary attrition of 8% is 40% below the industry average for technology services firms.",
    category: "General",
    tags: ["remote-work", "flexible", "culture", "hybrid", "distributed"],
    confidence_base: 0.85,
  },
  {
    question: "What is your annual learning and development investment per employee?",
    answer: "We invest a minimum of $4,200 per employee annually in formal learning and development activities, placing us in the top quartile of technology services firms by per-capita L&D spend and reflecting our strategic belief that continuous skill development is our most important competitive advantage and talent retention tool. Each employee receives an annual learning budget of $2,500 applicable to external training courses, certifications, conference attendance, technical books, and online learning platform subscriptions — with no approval required for expenditures below $500, reducing friction and encouraging continuous self-directed learning. Our internal TechBridge Academy delivers 120 or more hours of structured curriculum annually across technical domains, delivery methodology, client management, and leadership development, available to all employees at no charge and delivered through a combination of live virtual sessions, self-paced modules, and peer-led study groups. Certification achievement is financially rewarded — we pay exam fees for approved certifications, provide paid study time equivalent to 40 hours per certification attempt, and award one-time bonuses of $500 for associate-level certifications and $1,000 for professional and specialty certifications upon first pass. Manager development receives dedicated investment through a TechBridge Leadership Series delivered quarterly, covering coaching skills, performance management, distributed team leadership, and client executive communication. We track L&D completion rates, certification growth, and the correlation between learning investment and individual performance scores quarterly, and we have observed that employees with above-average L&D engagement score 22% higher on performance reviews and are promoted 1.4 times faster.",
    category: "General",
    tags: ["learning", "development", "training", "budget", "growth"],
    confidence_base: 0.85,
  },
  {
    question: "Describe your Corporate Social Responsibility and ESG commitments.",
    answer: "We approach Corporate Social Responsibility and Environmental, Social, and Governance commitments as integrated business priorities rather than peripheral activities, with formal programs, measurable targets, and annual public reporting that holds us accountable to our stated values. Our environmental commitments include achieving carbon neutrality for our direct operations by 2027 through a combination of operational efficiency improvements and verified carbon offset purchases for emissions we cannot yet eliminate. We have already achieved a 35% reduction in per-employee carbon intensity since 2021 by transitioning to a distributed-first work model that eliminated routine commuting and reduced office square footage by 40%. Socially, our TechBridge Community Foundation directs 1% of annual pre-tax profits to STEM education programs serving underrepresented communities, with a focus on coding bootcamps and technology apprenticeship programs in Atlanta's Westside and Chicago's South Side neighborhoods that have collectively trained 340 students since 2020. We sponsor five university scholarship recipients annually from historically Black colleges and universities, with scholarship recipients offered internship positions and priority interview access for full-time roles. Our supplier diversity program commits to sourcing a minimum of 15% of addressable spend from certified small, minority, women-owned, or veteran-owned businesses. Governance commitments include annual ESG reporting aligned with GRI Standards, quarterly Board-level ESG reviews, and executive compensation tied in part to ESG metric achievement, ensuring our sustainability commitments are backed by organizational accountability at the highest level.",
    category: "General",
    tags: ["csr", "esg", "sustainability", "community", "social-impact"],
    confidence_base: 0.87,
  },
];

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set in .env.local");

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "voyage-3-lite",
      input: [text],
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Voyage AI error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch existing titles to avoid duplicates
  const { data: existing } = await supabase
    .from("knowledge_base")
    .select("title");
  const existingTitles = new Set(
    (existing ?? []).map((e: { title: string }) => e.title)
  );

  const toInsert = batch4Entries.filter(
    (e) => !existingTitles.has(e.question)
  );
  console.log(
    `\n🚀 Batch 4: ${batch4Entries.length} entries defined, ${toInsert.length} new to insert.\n`
  );

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i++) {
    const entry = toInsert[i];
    const text = `${entry.question}\n${entry.answer}`;

    // 21s delay between Voyage AI calls — safe for 3 RPM free tier
    if (i > 0) await new Promise((r) => setTimeout(r, 21000));

    try {
      const embedding = await generateEmbedding(text);

      const { error } = await supabase.from("knowledge_base").insert({
        title: entry.question,
        category: entry.category,
        content: entry.answer,
        tags: entry.tags,
        embedding: JSON.stringify(embedding),
      });

      if (error) {
        console.error(
          `  ❌ [${i + 1}/${toInsert.length}] DB error: ${error.message}`
        );
        failed++;
      } else {
        inserted++;
        if (inserted % 10 === 0 || inserted === toInsert.length) {
          console.log(
            `  ✅ Inserted entry ${inserted}/${toInsert.length} (${entry.category})`
          );
        }
      }
    } catch (err) {
      console.error(
        `  ❌ [${i + 1}/${toInsert.length}] Error: ${(err as Error).message}`
      );
      failed++;
    }
  }

  console.log(
    `\n🎉 Batch 4 complete! ${inserted} inserted, ${failed} failed.\n`
  );

  const catCounts: Record<string, number> = {};
  toInsert.forEach((e) => {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });
  console.log("📊 Category breakdown:");
  Object.entries(catCounts).forEach(([cat, count]) =>
    console.log(`   ${cat}: ${count}`)
  );
  console.log("");
}

seed().catch((err) => {
  console.error("\n❌ Batch 4 seed failed:", err.message);
  process.exit(1);
});
