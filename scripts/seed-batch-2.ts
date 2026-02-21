/**
 * Seed Batch 2 — Experience & References (25) + Staffing (25)
 * Run: npx tsx scripts/seed-batch-2.ts
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

const batch2Entries: BatchEntry[] = [
  // ── EXPERIENCE & REFERENCES entries 1-10 ──
  {
    question: "Describe a major financial services digital transformation engagement your firm has completed.",
    answer: "We led a comprehensive digital transformation for a top-10 U.S. regional bank, modernizing 14 legacy systems across retail banking, commercial lending, and wealth management divisions over a 30-month program. Our team of 45 architects, engineers, and change management specialists replaced a patchwork of on-premises monoliths with a cloud-native microservices platform on AWS, integrating with the bank's existing Fiserv core through a purpose-built event-driven API layer. We delivered a new mobile banking application achieving 4.8-star App Store ratings within 60 days of launch, onboarding 220,000 digital users in the first quarter. Straight-through processing automation reduced loan origination cycle times from 12 days to 3 days, and API-first architecture enabled 18 new fintech partner integrations within the first year. The program achieved $28 million in annual operational savings through process automation and infrastructure consolidation. TechBridge Solutions served as the prime systems integrator, maintaining a 98.7% on-time milestone delivery rate across 6 program phases and earning a client satisfaction score of 4.9 out of 5.0 from the bank's executive steering committee.",
    category: "Experience & References",
    tags: ["financial-services", "digital-transformation", "banking", "modernization", "case-study"],
    confidence_base: 0.91,
  },
  {
    question: "What experience do you have with core banking system modernization?",
    answer: "We have delivered core banking modernization engagements for three mid-tier banks and one credit union, migrating customers off legacy FIS Profile and Jack Henry Silverlake platforms onto modern cloud-native cores and enabling real-time processing capabilities previously unavailable on batch-oriented legacy systems. Our methodology applies a parallel-run migration strategy: we operate the legacy core and modern platform simultaneously for 90 days, reconciling every transaction nightly to verify data integrity before executing the final cutover during a low-volume weekend window. Data migration pipelines processed 85 million customer records, 200 million transaction histories, and 4 million loan records with 100% reconciliation accuracy verified by independent audit. We implemented a Core Banking Adapter layer that preserved connectivity with 40-plus downstream systems during the transition period, eliminating the need for simultaneous replacement of peripheral systems. Post-migration, clients achieved real-time account balance updates, sub-second transaction processing, and 99.99% core availability compared to 99.5% on legacy platforms. TechBridge Solutions completed all three bank migrations without a single customer-impacting data error, and our most recent engagement received a banking industry innovation award for seamless cutover execution.",
    category: "Experience & References",
    tags: ["core-banking", "financial-services", "modernization", "migration", "banking"],
    confidence_base: 0.89,
  },
  {
    question: "Describe an insurance platform implementation you have delivered.",
    answer: "We designed and implemented a modern property and casualty insurance platform for a regional carrier managing $1.4 billion in written premium, replacing a 25-year-old policy administration system with a cloud-native Guidewire InsuranceSuite deployment on AWS. Our implementation team of 38 consultants configured Guidewire PolicyCenter, BillingCenter, and ClaimCenter across 12 personal lines and commercial lines product portfolios, completing the rollout 6 weeks ahead of the original 24-month schedule. We developed 140 custom integrations connecting Guidewire to the carrier's reinsurance systems, credit scoring services, ISO rating bureau, and state reporting portals using a MuleSoft API-led integration layer. Straight-through processing rates for new business increased from 22% to 71%, reducing manual underwriting intervention and cutting policy issuance time from 48 hours to under 4 hours for eligible risks. Claims cycle times decreased by 28% through automated first notice of loss routing, vendor assignment, and payment disbursement workflows. TechBridge Solutions also delivered a reusable integration accelerator library of 60 pre-built Guidewire connectors that the carrier's internal team now uses independently to add new integrations without external support.",
    category: "Experience & References",
    tags: ["insurance", "claims", "platform", "implementation", "modernization"],
    confidence_base: 0.88,
  },
  {
    question: "What federal agency cloud migration projects have you completed?",
    answer: "We have completed cloud migration programs for four federal agencies, migrating over 300 applications to AWS GovCloud and Azure Government environments under FedRAMP Moderate and High authorization boundaries. Our most significant engagement involved migrating a civilian agency's data center portfolio of 180 applications serving 50,000 federal employees, executed over 22 months under a $42 million task order. We applied the 7Rs migration framework to categorize every application, retiring 35 redundant systems, rehosting 90 applications with automated lift-and-shift tooling, and refactoring 55 mission-critical systems to cloud-native architectures using containerization on Amazon EKS. All migrated systems operate within FedRAMP-authorized boundaries, with Authority to Operate documentation updated and validated by the agency's Authorizing Official prior to production cutover. Post-migration, the agency reduced data center operating costs by $8.5 million annually and achieved 99.95% application availability, up from 99.1% on-premises. TechBridge Solutions maintained DISA-approved security baselines throughout migration and delivered continuous FedRAMP compliance monitoring dashboards enabling the agency's ISSO to demonstrate ongoing authorization status to OMB reviewers with real-time evidence.",
    category: "Experience & References",
    tags: ["federal", "government", "cloud-migration", "aws", "fedramp"],
    confidence_base: 0.90,
  },
  {
    question: "Describe a state or local government IT modernization project you have led.",
    answer: "We led the modernization of a state department of labor's unemployment insurance system, replacing a 1980s COBOL mainframe with a modern Java-based platform deployed on Azure Government, serving 2.3 million claimants across a state with 6 million workers. The engagement spanned 28 months and involved 52 TechBridge Solutions professionals working alongside 30 state agency staff, applying agile delivery in four-week sprints with monthly demonstrations to agency leadership and legislative oversight stakeholders. We redesigned the claimant-facing portal using human-centered design principles, conducting 48 usability sessions with actual claimants to inform interface decisions that reduced application abandonment rates from 38% to 9%. The new system processes initial claims in real time, with straight-through adjudication for 64% of submissions compared to 11% on the legacy system, reducing time-to-first-payment from 21 days to 7 days. During the COVID-19 surge period immediately following go-live, the platform successfully scaled to handle a 900% increase in daily claim volume without degradation, demonstrating the elasticity advantage of cloud-native architecture. TechBridge Solutions delivered the engagement on schedule and 4% under the contracted budget, earning the state CIO's award for technology delivery excellence.",
    category: "Experience & References",
    tags: ["state-government", "local-government", "modernization", "digital-services", "legacy"],
    confidence_base: 0.89,
  },
  {
    question: "What experience do you have modernizing healthcare payer core systems?",
    answer: "We have delivered healthcare payer core system modernization for two regional health plans with combined membership exceeding 1.8 million covered lives, migrating from legacy TriZetto FACETS and Amisys platforms to modern cloud-native claims administration architectures. Our approach uses a domain-driven decomposition model, extracting enrollment, eligibility, benefits configuration, claims adjudication, and provider data management as independent services with well-defined APIs, enabling incremental replacement without a big-bang cutover. In our most recent engagement, we migrated a 900,000-member health plan's core claims system to AWS in 26 months, achieving 94.2% auto-adjudication rates compared to 78.5% on the legacy platform, reducing per-claim processing cost by $1.47. We implemented real-time eligibility verification integrated with CMS federally facilitated marketplace feeds, reducing eligibility-related claim denials by 41%. The claims processing engine handles 800,000 claims monthly at sub-second adjudication speed for auto-adjudicated claims. TechBridge Solutions also developed a proprietary payer data migration framework used across both engagements that accelerated benefit plan migration by 60% compared to manual configuration approaches and delivered zero benefit loading errors verified through 100% benefit equivalence testing.",
    category: "Experience & References",
    tags: ["healthcare-payer", "insurance", "claims-processing", "modernization", "health-plan"],
    confidence_base: 0.90,
  },
  {
    question: "Describe a large multi-hospital system integration program you have delivered.",
    answer: "We served as the lead systems integrator for a 14-hospital health system's enterprise integration modernization, replacing a legacy point-to-point integration landscape of 320 custom interfaces with a modern integration platform built on MuleSoft Anypoint and HL7 FHIR R4 standards. The program connected Epic EHR, Cerner ancillary systems, Philips medical devices, 7 revenue cycle management applications, and 4 population health platforms through a centralized integration hub processing 4.2 million HL7 messages daily. We designed and deployed 85 new FHIR-compliant APIs exposing clinical, claims, and operational data to authorized consumers including research teams, quality reporting systems, and patient-facing applications. Laboratory result delivery times decreased from 45 minutes to under 8 minutes through real-time HL7 ADT and ORU message routing replacing batch file exchanges. Prior authorization integrations with 12 payer systems reduced manual PA submission work by 72%. The integration platform achieved 99.98% message delivery reliability with complete end-to-end audit trails supporting Joint Commission readiness. TechBridge Solutions completed all 85 interface migrations 3 months ahead of schedule, maintaining zero EHR downtime attributable to integration activities throughout the 30-month program.",
    category: "Experience & References",
    tags: ["health-system", "hospital", "integration", "ehr", "interoperability"],
    confidence_base: 0.91,
  },
  {
    question: "What pharmacy benefits management platform experience do you have?",
    answer: "We have delivered technology modernization and platform engineering services for two pharmacy benefits management organizations, supporting systems that collectively process over 200 million prescription claims annually across commercial, Medicare Part D, and Medicaid benefit lines. Our largest PBM engagement involved designing and implementing a real-time formulary management and clinical rules engine that evaluates drug utilization management criteria — step therapy, quantity limits, and prior authorization requirements — in under 150 milliseconds per claim adjudication request. We built a member-facing pharmacy benefits portal integrated with the client's PBM adjudication platform via NCPDP SCRIPT standards, enabling members to view formulary alternatives, estimate out-of-pocket costs, and initiate prior authorization requests digitally, reducing call center volume by 34%. Clinical pharmacist workflow tools we developed reduced prior authorization review cycle times from 4.2 days to 1.1 days through intelligent pre-population of clinical criteria from EHR data via FHIR integrations. TechBridge Solutions also implemented real-time drug interaction and duplicate therapy alerts integrated into the adjudication pathway, flagging 12,000 potential medication safety events monthly before claims are paid, demonstrating measurable clinical quality impact alongside operational efficiency gains.",
    category: "Experience & References",
    tags: ["pbm", "pharmacy", "benefits", "platform", "healthcare"],
    confidence_base: 0.87,
  },
  {
    question: "Describe a clinical analytics platform you have designed and deployed.",
    answer: "We designed and deployed an enterprise clinical analytics platform for a 9-hospital academic medical center, consolidating data from Epic EHR, 3 specialty registries, claims data feeds, and patient-reported outcome instruments into a unified data lakehouse on Azure Synapse Analytics serving 850 physician and quality analyst users. The platform processes 2.1 terabytes of new clinical data daily through streaming and batch ingestion pipelines, applying a FHIR R4 data normalization layer that standardizes clinical terminology across SNOMED CT, ICD-10-CM, CPT, and LOINC code systems. We developed 120 pre-built quality measure dashboards covering CMS quality payment program measures, HEDIS metrics, and Joint Commission core measures, enabling quality teams to monitor performance in near real time rather than relying on quarterly retrospective reports. Predictive models for 30-day readmission risk and sepsis early warning — trained on 5 years of encounter data — achieved AUROC scores of 0.82 and 0.88 respectively in independent validation cohorts, and both models are operationalized in production clinical workflows. TechBridge Solutions delivered the platform in 18 months, and within 6 months of go-live the health system documented a 19% reduction in preventable 30-day readmissions attributable to the readmission risk model's integration into care management workflows.",
    category: "Experience & References",
    tags: ["clinical-analytics", "healthcare", "data-platform", "quality", "reporting"],
    confidence_base: 0.89,
  },
  {
    question: "How do you approach enterprise digital transformation strategy engagements?",
    answer: "We approach digital transformation strategy engagements using a structured four-phase methodology: Discover, Align, Design, and Roadmap. In the Discover phase, we conduct current-state assessments spanning technology architecture, operating model maturity, workforce digital capabilities, and customer experience benchmarks, using our proprietary Digital Maturity Model to produce a scored baseline across 8 capability dimensions. The Align phase engages executive and business unit leaders through facilitated workshops to establish transformation objectives, define success metrics tied to business outcomes, and surface competing priorities requiring explicit executive resolution before planning proceeds. Design translates aligned objectives into an initiative portfolio organized by strategic theme, with each initiative sized for effort, investment, risk, and expected business value using our benefits realization framework. The Roadmap sequences initiatives across a 3-to-5-year horizon, identifying interdependencies, capability prerequisites, and quick-win opportunities that demonstrate value within 90 days to sustain organizational commitment. TechBridge Solutions has delivered digital transformation strategies for 22 enterprises across financial services, healthcare, retail, and public sector, with 87% of clients reporting that our roadmaps remained actionable guides 18 months after delivery — a benchmark we track through annual client follow-up assessments.",
    category: "Experience & References",
    tags: ["digital-transformation", "strategy", "enterprise", "roadmap", "consulting"],
    confidence_base: 0.88,
  },
  // ── EXPERIENCE & REFERENCES entries 11-20 ──
  {
    question: "Describe a legacy mainframe application modernization project you have led.",
    answer: "We led the modernization of a Fortune 100 insurance company's COBOL mainframe application portfolio, migrating 4.2 million lines of COBOL across 680 programs from IBM z/OS to a Java-based microservices architecture on AWS over a 36-month engagement. Our team of 60 engineers used automated COBOL-to-Java transpilation tooling to accelerate the migration, supplemented by manual refactoring for complex business logic patterns that automated tools could not safely transform. We validated every migrated component using equivalence testing frameworks that compared mainframe batch output to cloud-native output across 10 years of historical transaction data, achieving 100% output equivalence before retiring any mainframe capability. The new platform processes end-of-day batch jobs that previously required 14-hour mainframe windows in under 3 hours using parallel cloud processing, creating 11 hours of additional processing capacity for new business initiatives. Infrastructure costs decreased by $12 million annually by eliminating mainframe software licensing and hardware maintenance contracts. TechBridge Solutions conducted the cutover in rolling waves, retiring mainframe capacity incrementally to reduce financial risk, and the client achieved full mainframe decommission 4 months ahead of the scheduled contractual milestone.",
    category: "Experience & References",
    tags: ["mainframe", "cobol", "modernization", "legacy", "migration"],
    confidence_base: 0.87,
  },
  {
    question: "What experience do you have rebuilding large-scale e-commerce platforms?",
    answer: "We rebuilt the e-commerce platform for a national specialty retailer generating $2.1 billion in annual online revenue, migrating from a monolithic Oracle ATG implementation to a composable commerce architecture on Google Cloud using Commercetools as the headless commerce engine. Our re-platform program delivered a React and Next.js storefront with sub-2-second page load times, improving Google Core Web Vitals scores from failing to 94th percentile across all three metrics. The composable architecture decomposed the monolith into 22 bounded-context microservices covering catalog, search, cart, pricing, promotions, order management, and customer data — each independently deployable, enabling the retailer's engineering team to ship features 5 times faster than on the monolith. Integration with the client's existing SAP OMS and warehouse management systems was achieved through event-driven APIs, eliminating overnight batch synchronization that previously caused 6-hour data latency windows. A/B testing infrastructure powered by LaunchDarkly enabled 40 concurrent product experiments at peak. During the first peak holiday season post-launch, the platform handled 3.2 times the prior year's peak traffic without degradation. TechBridge Solutions delivered the full re-platform in 20 months, and the client reported 18% revenue uplift attributable to improved site performance and conversion optimization features enabled by the new architecture.",
    category: "Experience & References",
    tags: ["e-commerce", "platform", "modernization", "retail", "cloud-native"],
    confidence_base: 0.86,
  },
  {
    question: "Describe a global supply chain management system implementation.",
    answer: "We implemented a global supply chain visibility and management platform for a multinational consumer goods manufacturer operating across 42 countries, integrating data from 8 ERP instances, 200-plus contract manufacturers, 15 third-party logistics providers, and 12,000 retail partners into a unified supply chain control tower on Azure. The platform ingests 5 million supply chain events daily through EDI, API, and IoT sensor feeds, normalizing data from disparate formats into a common supply chain ontology that enables end-to-end inventory and order visibility from raw material sourcing to retail shelf placement. Machine learning demand forecasting models — trained on 6 years of sales history, promotional calendars, and macroeconomic indicators — achieved 12% improvement in forecast accuracy compared to the client's legacy statistical models, directly reducing safety stock carrying costs by $31 million annually. Supplier collaboration portals provided 450 suppliers with real-time purchase order visibility, shipment tracking, and capacity commitment tools, reducing buyer-supplier inquiry call volume by 58%. TechBridge Solutions delivered the control tower in 18 months across 3 regional deployment waves and supported the client's supply chain team through a disruptive ocean freight disruption event 4 months after go-live, where the platform's real-time visibility enabled alternative routing decisions that preserved 94% of planned on-time delivery performance.",
    category: "Experience & References",
    tags: ["supply-chain", "logistics", "erp", "integration", "global"],
    confidence_base: 0.86,
  },
  {
    question: "What smart manufacturing or industrial IoT platform experience do you have?",
    answer: "We designed and deployed an Industrial IoT platform for a Tier 1 automotive components manufacturer operating 9 plants across North America, connecting 3,200 CNC machines, robotic assembly cells, and quality inspection systems to a cloud-based operations intelligence platform on AWS IoT Greengrass and AWS IoT Core. Edge computing nodes at each plant aggregate and pre-process sensor data locally, enabling real-time machine monitoring at 50-millisecond sampling intervals while transmitting only exception events and aggregated metrics to the cloud, reducing data transfer costs by 78% compared to naive cloud streaming architectures. Machine learning predictive maintenance models — trained on 18 months of vibration, temperature, and cycle-count sensor data — identify tooling wear patterns 72 hours before failure, enabling planned maintenance interventions that reduced unplanned downtime by 34% across the fleet. Overall Equipment Effectiveness dashboards, available to plant managers and corporate operations leadership in real time, enabled data-driven shift scheduling decisions that improved average OEE from 71% to 83% within 12 months. TechBridge Solutions also implemented anomaly detection on quality inspection data that reduced defect escape rates by 22%, preventing warranty claims valued at $8.4 million annually. The platform now serves as the client's standard manufacturing intelligence architecture for future plant expansions.",
    category: "Experience & References",
    tags: ["iot", "manufacturing", "industrial", "edge-computing", "real-time"],
    confidence_base: 0.85,
  },
  {
    question: "Describe a retail analytics and personalization platform you have implemented.",
    answer: "We implemented an enterprise retail analytics and personalization platform for a 1,400-store specialty apparel retailer, unifying point-of-sale, e-commerce, loyalty program, and customer service interaction data into a real-time Customer Data Platform on Google Cloud BigQuery, enabling personalization at a scale the client had never previously achieved. The platform resolves customer identities across 11 data sources using probabilistic and deterministic matching, creating unified profiles for 28 million customers that power product recommendations, personalized email content, and targeted promotional offers. Recommendation models built on Vertex AI Matching Engine deliver sub-50-millisecond personalized product suggestions on the e-commerce site, processing 800,000 daily sessions and updating models on 24-hour retraining cycles to incorporate the latest behavioral signals. Email personalization A/B testing demonstrated 31% higher click-through rates and 19% higher conversion rates for AI-personalized campaigns versus rule-based segmentation approaches. Markdown optimization models — applied to end-of-season inventory across 6,000 SKUs — preserved $14 million in gross margin compared to historical clearance strategies by optimizing discount depth and timing. TechBridge Solutions delivered the platform in 16 months, and the client recognized it as a top-3 strategic technology investment in their annual shareholder report, citing measurable revenue impact in the first year of operation.",
    category: "Experience & References",
    tags: ["retail", "analytics", "personalization", "customer-data", "machine-learning"],
    confidence_base: 0.86,
  },
  {
    question: "What is your experience designing and deploying Customer Data Platforms?",
    answer: "We have designed and deployed Customer Data Platforms for six enterprise clients across retail, financial services, and telecommunications, enabling unified customer profiles, real-time segmentation, and cross-channel activation that were impossible with siloed point solutions. Our CDP implementations typically integrate 8 to 15 data sources including CRM, e-commerce, mobile apps, call center platforms, loyalty systems, and marketing automation tools, applying identity resolution algorithms that achieve 95-plus percent match rates across known and anonymous identities. We have delivered CDPs using Segment, mParticle, and custom-built solutions on cloud data warehouse foundations, selecting the architecture based on client data volume, real-time requirements, and existing technology investments. One financial services client CDP we built consolidates 240 million customer events daily, enabling next-best-action models that surface personalized product recommendations in mobile banking, branch advisor tools, and digital marketing channels with consistent identity across all touchpoints. Privacy compliance is designed in from the start — consent management, data subject access request automation, and right-to-erasure workflows are implemented alongside the CDP core, satisfying CCPA and GDPR requirements without post-implementation retrofit. TechBridge Solutions CDP clients have achieved average return on investment of 340% within 24 months, driven by improved marketing efficiency, increased cross-sell conversion, and reduced customer churn.",
    category: "Experience & References",
    tags: ["cdp", "customer-data", "analytics", "identity-resolution", "marketing"],
    confidence_base: 0.87,
  },
  {
    question: "Describe a large-scale Salesforce CRM enterprise deployment you have delivered.",
    answer: "We delivered an enterprise Salesforce Sales Cloud and Service Cloud implementation for a global B2B technology company with 3,200 sales representatives operating across 28 countries, replacing 7 regional CRM systems with a unified Salesforce platform serving as the global system of record for customer relationships and revenue operations. Our 30-month program deployed Salesforce Sales Cloud with custom opportunity management workflows tailored to the client's complex multi-product, multi-region deal structures, integrating with SAP ERP for quote-to-cash processes through Salesforce CPQ. We migrated 4.1 million account, contact, and opportunity records from legacy systems with 99.8% data integrity verified through automated reconciliation. Service Cloud implementation included an omnichannel contact center connecting phone, email, chat, and social channels with a unified agent desktop that reduced average handle time by 22%. Einstein Analytics dashboards provide sales leadership with real-time pipeline visibility, win-rate analysis by segment and product, and quota attainment forecasting. We deployed Salesforce with a global Change Management program that achieved 91% user adoption within 60 days of go-live — 15 percentage points above the industry benchmark for enterprise CRM deployments. TechBridge Solutions holds Salesforce Ridge Partner status with 180-plus certified Salesforce professionals across Sales Cloud, Service Cloud, CPQ, and Marketing Cloud specializations.",
    category: "Experience & References",
    tags: ["salesforce", "crm", "enterprise", "sales-cloud", "implementation"],
    confidence_base: 0.88,
  },
  {
    question: "What experience do you have with SAP S/4HANA migrations?",
    answer: "We have delivered SAP S/4HANA migration programs for four manufacturing and distribution clients, executing both Greenfield implementations and System Conversion brownfield approaches based on client timeline, customization debt, and business transformation appetite. Our largest engagement migrated a $4.2 billion industrial manufacturer from SAP ECC 6.0 to S/4HANA 2023 on Azure, decommissioning 14 years of customizations through a selective data migration approach that rebuilt core business processes using standard S/4HANA best practices. We applied SAP Activate methodology across 5 workstreams — finance, procurement, manufacturing, sales, and plant maintenance — completing fit-to-standard workshops that resolved 340 process delta items before configuration began, reducing costly late-stage design changes. Custom ABAP code remediation addressed 2,800 identified incompatibilities using SAP's Custom Code Migration tool, with 68% resolved through automated conversion and 32% requiring manual refactoring by our ABAP Center of Excellence. The go-live cutover — involving data migration of 280 million open items and 6 years of transactional history — completed in a 60-hour weekend window with zero data exceptions. TechBridge Solutions SAP practice holds SAP Gold Partner status, and our S/4HANA implementations have achieved go-live within planned budgets in 3 of 4 engagements, compared to the industry average of less than 50% of S/4HANA programs delivering on budget.",
    category: "Experience & References",
    tags: ["sap", "s4hana", "erp", "migration", "enterprise"],
    confidence_base: 0.87,
  },
  {
    question: "Describe an enterprise content management or document management platform you have implemented.",
    answer: "We implemented an enterprise content management platform for a regional insurance holding company managing 85 million policy documents, claims files, and correspondence records, migrating from a legacy Documentum system to Microsoft SharePoint Online and Azure Blob Storage with an intelligent document processing layer powered by Azure Form Recognizer and custom machine learning models. The migration extracted and re-indexed 85 million documents with automated content classification, applying retention labels aligned with the client's records retention schedule across 47 document types, ensuring regulatory compliance with state insurance department document preservation requirements. Intelligent document processing workflows extract structured data from unstructured incoming correspondence — coverage inquiries, claims submissions, and broker communications — routing documents to appropriate queues with extracted data pre-populated, reducing manual data entry by 76% in the claims intake process. Full-text search across the enterprise content repository returns results in under 2 seconds for 99% of queries across the 85 million document corpus using Azure Cognitive Search with custom relevance tuning. The platform integrates with Guidewire ClaimCenter to surface relevant claim history documents directly in the adjuster workflow without context switching. TechBridge Solutions delivered the platform on a 14-month timeline, achieved 98.6% document migration fidelity verified through automated sampling and manual review, and reduced document storage costs by 61% compared to the legacy on-premises Documentum infrastructure.",
    category: "Experience & References",
    tags: ["ecm", "document-management", "content", "sharepoint", "enterprise"],
    confidence_base: 0.85,
  },
  {
    question: "What patient engagement portal experience do you have?",
    answer: "We have designed and implemented patient engagement portals for four health systems and two large physician group practices, building HIPAA-compliant digital health experiences that extend Epic MyChart and Cerner HealtheLife with custom functionality tailored to each organization's patient population and clinical workflows. Our most comprehensive engagement delivered a patient portal for a 700,000-member integrated delivery network, implementing Epic MyChart Open Access scheduling, pre-visit questionnaire automation, care gap notification campaigns, and post-discharge follow-up workflows that reduced avoidable emergency department readmissions by 17%. We developed a custom chronic disease management module integrated with remote patient monitoring devices, enabling patients to submit blood pressure, glucose, and weight readings directly into the portal, with clinical decision support rules that alert care managers to out-of-range values within 15 minutes. Portal adoption reached 68% of eligible patients within 12 months, exceeding the client's 55% target, driven by proactive digital outreach campaigns and same-day enrollment workflows embedded in the check-in process. Accessibility compliance with WCAG 2.1 AA standards and availability in 7 languages addressed the health system's diverse patient population. TechBridge Solutions also implemented a unified patient identity management layer that resolved duplicate medical record numbers, improving portal record matching accuracy from 91% to 99.4%.",
    category: "Experience & References",
    tags: ["patient-portal", "patient-engagement", "healthcare", "myChart", "digital-health"],
    confidence_base: 0.89,
  },
  // ── EXPERIENCE & REFERENCES entries 21-25 ──
  {
    question: "Describe a telehealth platform you have rapidly deployed.",
    answer: "We rapidly designed and deployed a telehealth platform for a 400-physician multi-specialty physician group during the COVID-19 pandemic, going from contract signature to first live patient video visit in 18 days — a timeline that required parallel workstreams across design, technical configuration, integration, and clinical staff training operating simultaneously around the clock. The platform integrated Zoom for Healthcare as the HIPAA-compliant video engine with Epic scheduling workflows, enabling patients to self-schedule telehealth visits through MyChart and receive automated pre-visit links without staff intervention. We implemented automated patient intake questionnaires, virtual waiting rooms, and post-visit care plan delivery — replicating the key touchpoints of an in-person visit in a digital modality. The platform scaled from zero to 1,200 daily telehealth visits within 30 days of launch as in-person care was suspended, processing over 180,000 total telehealth encounters in the first 6 months. Patient satisfaction scores for telehealth visits averaged 4.7 out of 5.0, exceeding the group's in-person satisfaction benchmark of 4.5. TechBridge Solutions subsequently enhanced the platform with asynchronous e-visit capabilities, remote patient monitoring integrations, and multi-language interpreter services, positioning the client to sustain telehealth as a permanent care delivery channel serving 30% of eligible visit volume post-pandemic.",
    category: "Experience & References",
    tags: ["telehealth", "virtual-care", "video", "patient-engagement", "healthcare"],
    confidence_base: 0.90,
  },
  {
    question: "What experience do you have automating insurance claims processing?",
    answer: "We delivered an intelligent claims automation program for a national property and casualty insurer processing 2.4 million claims annually, implementing AI-powered triage, fraud detection, and straight-through processing capabilities that fundamentally changed the economics of claims handling across personal auto, homeowners, and commercial lines. Our AI claims triage model — trained on 8 years of historical claims data — classifies incoming first notice of loss submissions into complexity tiers within seconds, routing simple claims to automated resolution pathways and complex or potentially fraudulent claims to senior adjusters. Straight-through processing automation resolves straightforward claims end-to-end without adjuster intervention, issuing payment within 24 hours for 38% of personal auto claims — up from effectively zero under the prior manual process. Computer vision models analyze uploaded vehicle damage photographs and structure fire images to estimate repair costs with 89% accuracy compared to professional appraiser estimates, accelerating settlement for photo-eligible claims. Fraud detection models using network analysis, behavioral signals, and text mining flag 94% of confirmed fraudulent claims for investigation before payment, reducing fraud losses by $22 million annually. TechBridge Solutions also implemented a claims status self-service portal that deflected 44% of inbound status inquiry calls, reducing claims call center volume and improving claimant satisfaction scores by 18 points.",
    category: "Experience & References",
    tags: ["claims-processing", "automation", "insurance", "ai", "workflow"],
    confidence_base: 0.88,
  },
  {
    question: "Describe a prior authorization AI automation project you have delivered.",
    answer: "We implemented an AI-powered prior authorization automation platform for a regional health plan processing 1.1 million prior authorization requests annually, reducing the administrative burden on clinical staff and improving turnaround times that were a significant source of provider and member dissatisfaction. Our solution applied natural language processing to extract clinical criteria from unstructured physician notes and supporting documentation submitted with authorization requests, mapping extracted clinical evidence to the health plan's medical necessity criteria libraries for automated determination recommendations. Auto-approval logic for requests meeting all criteria without human review increased the auto-approval rate from 11% to 54% of applicable request types within 6 months of deployment, enabling clinical staff to concentrate on complex cases requiring genuine medical judgment. For requests requiring clinical review, our AI pre-populates the reviewer's decision interface with extracted clinical highlights, relevant member history, and comparable case decisions, reducing average review time per case from 22 minutes to 8 minutes. Integration with provider EHRs through FHIR APIs enables electronic submission of authorization requests and real-time status communication, reducing phone and fax inquiry volume by 61%. TechBridge Solutions delivered the platform in 14 months, and the health plan's first-pass approval rate increased by 9 percentage points, reducing unnecessary appeals and improving the plan's CMS Quality Rating System scores for care coordination measures.",
    category: "Experience & References",
    tags: ["prior-authorization", "ai", "automation", "healthcare", "workflow"],
    confidence_base: 0.89,
  },
  {
    question: "What quality reporting and regulatory compliance platform experience do you have?",
    answer: "We have implemented quality reporting and regulatory compliance platforms for five health plans and three integrated delivery networks, automating HEDIS measure calculation, CMS STAR ratings reporting, and state Medicaid quality withhold reporting that previously required months of manual data extraction and analysis. Our most comprehensive engagement built an enterprise quality intelligence platform for a 1.6 million-member health plan, integrating medical claims, pharmacy claims, laboratory results, EHR clinical data, and care management encounter data to calculate all HEDIS measures continuously rather than annually. The platform applies measure-specific hybrid medical record collection workflows that route outreach tasks to supplemental data collection teams when administrative data is insufficient for measure closure, increasing hybrid measure rates by an average of 8.4 percentage points. CMS STAR ratings forecasting models — updated monthly with the latest rate calculations — provide quality leadership with visibility into projected STAR ratings 12 months ahead of CMS publication, enabling targeted intervention programs before the measurement year closes. Regulatory submission automation generates required CMS HEDIS submissions, Quality Rating System data submissions, and state-specific quality reports in required formats with automated validation against CMS technical specifications. TechBridge Solutions clients have improved their CMS STAR ratings by an average of 0.7 stars within 2 years of platform deployment, translating to millions in additional quality bonus payments under the Medicare Advantage quality bonus program.",
    category: "Experience & References",
    tags: ["quality-reporting", "hedis", "cms", "compliance", "analytics"],
    confidence_base: 0.89,
  },
  {
    question: "Describe a health plan member portal redesign you have completed.",
    answer: "We redesigned the member portal for a regional Blue Cross Blue Shield plan serving 1.2 million commercial and Medicare Advantage members, replacing a legacy vendor portal with a modern, accessible digital experience designed around member needs identified through 6 months of human-centered design research including 120 member interviews, usability sessions, and journey mapping workshops. The new portal — built on a React and Next.js frontend integrated with the plan's HealthEdge claims administration platform — delivers real-time benefits and cost-sharing information, digital ID cards, claim status and Explanation of Benefits access, provider directory search with accurate network status, and care management program enrollment in a unified, mobile-first experience. We implemented single sign-on integration with the plan's 14 vendor partner portals — pharmacy, dental, vision, behavioral health — so members navigate seamlessly without re-authentication, addressing a top complaint in the pre-redesign member satisfaction surveys. Digital self-service adoption for common transactions — ID card requests, prior authorization status, and appeal submissions — increased from 23% to 67% within 9 months of launch, reducing call center volume by 34,000 calls monthly. Net Promoter Score for digital experience increased by 41 points from pre-redesign baseline. TechBridge Solutions delivered the portal 2 months ahead of the plan's Annual Enrollment Period launch deadline, ensuring members could use the new experience during the highest-traffic period of the benefit year.",
    category: "Experience & References",
    tags: ["member-portal", "health-plan", "ux", "digital", "engagement"],
    confidence_base: 0.88,
  },
  // ── STAFFING entries 26-35 ──
  {
    question: "How do you structure project teams for large, complex IT engagements?",
    answer: "We structure large engagement teams using a Delivery Unit model that organizes professionals into discipline-aligned squads governed by an integrated program leadership layer. At the program level, an Executive Sponsor and Program Director provide strategic oversight and escalation authority, supported by a Delivery Management Office that tracks cross-workstream dependencies, risks, budget, and schedule through unified governance tooling. Each workstream — typically aligned to a business domain or technology layer — is led by a Workstream Lead who reports to the Program Director and manages a dedicated squad of 5 to 12 engineers, analysts, and testers. Technical architecture decisions are owned by a Chief Architect who spans workstreams, ensuring design consistency, interface contract governance, and technical risk management across the full engagement scope. An Organizational Change Management Lead and Training Lead operate as a dedicated change enablement squad, ensuring that technology delivery is matched by stakeholder readiness and user adoption. Quality assurance is organized as an independent function embedded within each workstream, reporting through a QA Lead to the Program Director to preserve independence. TechBridge Solutions calibrates team size and structure to engagement complexity — we have successfully delivered programs ranging from 8-person agile teams to 120-person multi-workstream programs — and we adjust governance rigor proportionally, avoiding bureaucratic overhead on smaller engagements while providing necessary structure for large programs.",
    category: "Staffing",
    tags: ["team-structure", "staffing", "project-management", "governance", "delivery"],
    confidence_base: 0.90,
  },
  {
    question: "What are the qualifications and certifications of your Solution Architects?",
    answer: "Our Solution Architects are senior professionals with a minimum of 12 years of technology delivery experience, holding undergraduate degrees in computer science, engineering, or mathematics from accredited universities, with the majority holding graduate degrees. Certification standards for Solution Architects include AWS Certified Solutions Architect Professional or Azure Solutions Architect Expert as a baseline cloud certification, supplemented by domain-specific credentials relevant to their primary practice areas. Across our Solution Architect population, we hold 84 AWS Professional-level certifications, 62 Azure Expert-level certifications, 41 Google Cloud Professional certifications, 38 TOGAF 9.2 Enterprise Architecture certifications, and 29 CKAD or CKA Kubernetes certifications. Beyond technical credentials, our architects complete TechBridge Solutions' internal Architecture Excellence Program — a 200-hour curriculum covering systems thinking, architecture decision records, non-functional requirements analysis, and client communication skills — before assuming independent solution architect responsibilities on client engagements. Architects are required to maintain certification currency and complete 40 hours of professional development annually, tracked through our Learning Management System. We assign architects to engagements based on domain expertise alignment — our healthcare IT architects hold CPHIMS credentials, our financial services architects hold CISSP or CISM certifications, and our federal architects hold appropriate security clearances. Clients may review architect resumes and conduct interviews prior to assignment confirmation.",
    category: "Staffing",
    tags: ["solution-architect", "certifications", "qualifications", "aws", "azure"],
    confidence_base: 0.89,
  },
  {
    question: "How do you manage onshore and offshore hybrid delivery models?",
    answer: "We operate a structured hybrid delivery model with onshore delivery centers in Atlanta, Chicago, and Dallas, and offshore delivery centers in Hyderabad, Pune, and Bangalore, India, employing over 800 offshore professionals integrated into client delivery programs through proven collaboration frameworks. Onshore presence focuses on client-facing roles — project management, business analysis, solution architecture, and stakeholder engagement — while offshore teams deliver engineering, testing, data engineering, and support functions that benefit from time-zone-extended coverage and cost efficiency, achieving typical blended rate savings of 35% to 45% compared to fully onshore delivery. We follow an Offshore Integration Protocol that assigns every offshore professional an onshore counterpart for knowledge continuity, establishes a minimum two-hour daily overlap window for synchronous collaboration, and requires offshore leads to spend 4 to 8 weeks onsite at engagement start to build relationships and absorb context that accelerates effective remote delivery. All offshore staff complete background investigations equivalent to U.S. onshore standards, and sensitive client data never leaves U.S.-based cloud environments — offshore access uses virtual desktops with data residency controls. TechBridge Solutions' hybrid model has delivered average cost savings of 38% compared to fully onshore alternatives while maintaining client satisfaction scores indistinguishable from onshore-only engagements across 5 years of client survey data.",
    category: "Staffing",
    tags: ["onshore", "offshore", "hybrid-delivery", "global", "staffing"],
    confidence_base: 0.88,
  },
  {
    question: "Describe your employee retention strategy and average staff tenure metrics.",
    answer: "We maintain an average employee tenure of 5.4 years across TechBridge Solutions — significantly above the consulting industry average of 2.9 years — through a retention strategy built on career growth transparency, competitive total compensation, recognition culture, and meaningful work on high-impact client programs. Our retention framework addresses the four primary drivers of voluntary attrition identified through annual stay interview research: career growth visibility, manager quality, compensation competitiveness, and sense of belonging. Biannual Career Growth conversations between each employee and their manager use a structured framework to review current performance, identify skill development goals, and confirm the employee's 12- to 24-month career trajectory within TechBridge Solutions. Total compensation benchmarking occurs annually against McLagan and Radford survey data, with compensation adjustments targeting the 65th percentile for all roles. Our Employee Resource Groups — including the Women in Technology Network, Veterans Alliance, and LGBTQ+ Alliance — host monthly events and mentoring connections that build community among distributed staff. Voluntary turnover was 9.2% in the most recent fiscal year, compared to a consulting industry benchmark of 18% to 22%, reducing the continuity risk that clients experience when staff turn over mid-engagement. We track client-assigned team stability as a delivery metric and maintain a target of less than 10% unplanned staff changes per engagement quarter.",
    category: "Staffing",
    tags: ["retention", "tenure", "employee", "culture", "satisfaction"],
    confidence_base: 0.87,
  },
  {
    question: "How do you approach succession planning and bench strength management?",
    answer: "We maintain a formal succession planning program reviewed semi-annually by executive leadership that identifies successors for all critical roles — practice leads, delivery directors, and technical fellows — across immediate, near-term, and developmental readiness tiers. Critical role mapping identifies the 15% of positions whose vacancy would materially impair delivery continuity or business development capability, and succession slates for these positions include at least two identified successors with documented readiness timelines and development action plans. Bench strength is managed through our Talent Pipeline Program, which identifies high-potential professionals at the Manager and Senior Manager levels through performance calibration sessions and accelerated development cohorts that prepare future leaders for roles 12 to 18 months before openings occur. For client engagement continuity specifically, we implement Shadow Staffing on engagements exceeding 12 months, maintaining a designated backup resource familiar with the engagement context for every critical role, reducing key-person dependency risk. Cross-training rotations move high-potential engineers through 6-month assignments in adjacent practice areas, broadening skills and building bench depth across specializations. TechBridge Solutions has successfully filled 94% of critical role vacancies from internal succession pipelines over the past 3 years, minimizing external recruiting timelines that would delay client delivery continuity.",
    category: "Staffing",
    tags: ["succession", "bench", "leadership", "planning", "talent"],
    confidence_base: 0.86,
  },
  {
    question: "Describe your technical career development program for engineers.",
    answer: "We operate a structured technical career development program called TechBridge Craft that provides engineers with clear, transparent advancement criteria, dedicated learning investment, and internal mentorship connections at every career stage from Associate Engineer through Distinguished Engineer. The Craft framework defines 7 engineering levels with behavioral and technical competency expectations at each level, including system design scope, code quality standards, mentorship responsibilities, and client impact expectations — published internally so every engineer understands what advancement requires. Each engineer receives 40 hours of paid learning time annually and a $3,000 professional development budget for certifications, conferences, and training programs, tracked through our Learning Management System with manager accountability for utilization. The TechBridge Academy delivers 12 internally taught technical curriculum tracks — cloud architecture, platform engineering, data engineering, AI/ML, cybersecurity, and others — through cohort-based programs of 6 to 10 weeks combining live instruction with hands-on lab projects. Senior Engineers are matched with a Distinguished Engineer mentor from a different practice area for quarterly 1:1 sessions focused on architectural thinking and career strategy. Our internal hack weeks — held twice annually — allow engineers to explore new technologies and present findings to leadership, with the top 3 projects receiving investment funding for production prototyping. Promotion rates from Associate to Mid-level engineer average 18 months, and Mid to Senior average 24 months — among the fastest advancement timelines benchmarked against comparable consulting peers.",
    category: "Staffing",
    tags: ["career-development", "training", "engineers", "growth", "mentorship"],
    confidence_base: 0.87,
  },
  {
    question: "What professional certification incentives do you offer staff?",
    answer: "We fund 100% of examination fees for all approved professional certifications and provide paid study time of up to 16 hours per certification within the quarter preceding the scheduled exam date, removing the financial and time barriers that cause many consulting firms to lose certification investment to voluntary attrition. Upon passing a first professional certification in a new domain — such as a first AWS certification — employees receive a $1,500 cash bonus. Subsequent certifications in the same domain earn $750 bonuses. Achieving an expert or professional-level certification — AWS Solutions Architect Professional, Azure Solutions Architect Expert, CISSP, or PMP — earns a $2,500 bonus and a permanent $5,000 annual salary premium added to base compensation, recognizing that these credentials represent sustained expert-level capability. Employees who achieve 5 or more certifications are recognized in our annual TechBridge Excellence Awards and receive priority selection for high-profile client assignments and internal leadership opportunities. Our certification incentive program has driven 340 net new certifications across the organization in the past fiscal year alone, growing our AWS-certified staff by 28% and our Azure-certified staff by 34%. We publish a quarterly certification leaderboard that generates healthy competitive motivation among peer teams, and practice leads incorporate certification goals into team OKRs with leadership visibility into progress.",
    category: "Staffing",
    tags: ["certifications", "incentives", "training", "aws", "professional-development"],
    confidence_base: 0.86,
  },
  {
    question: "How do you approach knowledge transfer throughout an engagement?",
    answer: "We treat knowledge transfer as a continuous engagement responsibility — not a final-phase activity — embedding it into delivery cadence from day one through paired working practices, living documentation standards, and deliberate capability-building events that ensure client teams grow their own competency throughout the engagement rather than remaining dependent on TechBridge Solutions throughout. Every deliverable we produce includes a knowledge transfer artifact: architecture decision records capture rationale, not just decisions; runbooks document operational procedures with step-by-step fidelity; and training materials are developed alongside features rather than retrospectively. We assign a Knowledge Transfer Lead on engagements exceeding 6 months, whose explicit responsibility is tracking client staff readiness milestones against a Knowledge Transfer Plan reviewed monthly with the client program sponsor. Lunch-and-learn sessions — held bi-weekly throughout the engagement — provide client technical staff with structured exposure to the technologies, patterns, and design choices being applied, building conceptual understanding that supports post-engagement maintenance and enhancement. Shadow staffing programs pair client engineers with TechBridge Solutions engineers in a 1:1 learning arrangement for 90 days before handover milestones. Our Knowledge Transfer Readiness Assessment — delivered at 30, 60, and 90 days before engagement close — objectively measures client team readiness across defined capability domains and triggers remediation activities if gaps are identified. TechBridge Solutions' knowledge transfer approach has achieved client self-sufficiency ratings of 4.3 out of 5.0 on post-engagement assessments across our portfolio.",
    category: "Staffing",
    tags: ["knowledge-transfer", "documentation", "training", "self-sufficiency", "handoff"],
    confidence_base: 0.90,
  },
  {
    question: "Describe your new employee onboarding process for project staff.",
    answer: "We operate a structured 90-day onboarding program called TechBridge Launch that prepares new hires for effective client delivery while immersing them in our culture, values, and operational practices. The program is divided into three 30-day phases: Orientation, Integration, and Contribution. During Orientation, new hires complete enterprise systems access and security training, attend a 3-day Welcome Cohort event with peers hired in the same quarter, meet their assigned buddy and career advisor, and complete mandatory compliance training covering information security, HIPAA, and professional conduct standards. Integration introduces client engagement context through shadowing and read-only access to project artifacts before assuming active delivery responsibilities — a practice we find significantly accelerates productive contribution compared to throwing new hires into delivery work immediately. By day 30, each new hire completes a structured First Deliverable milestone reviewed by their manager and career advisor. Technical staff complete a Technical Onboarding Track covering TechBridge Solutions' standard toolchain, code quality standards, and delivery methodology in the first 60 days. At day 90, a Onboarding Completion Review between the new hire, manager, and HR partner assesses integration success and identifies any unresolved questions or concerns. Our onboarding program earned a 4.6 out of 5.0 satisfaction rating from new hires in our most recent annual survey, with 94% reporting they felt prepared to contribute effectively to their client engagement within 30 days.",
    category: "Staffing",
    tags: ["onboarding", "new-hire", "training", "process", "readiness"],
    confidence_base: 0.87,
  },
  {
    question: "What federal security clearance levels can your staff obtain and maintain?",
    answer: "We maintain a cleared workforce of over 120 professionals holding active Secret and Top Secret clearances, with 38 staff holding active Top Secret/Sensitive Compartmented Information eligibility, enabling TechBridge Solutions to support classified federal programs across defense, intelligence community, and civilian agency environments requiring cleared personnel. Our Security Officer manages the clearance sponsorship process for new hires requiring clearances, coordinating with client Facility Security Officers to initiate investigations through the Defense Counterintelligence and Security Agency DISS system, and monitoring investigation status to minimize time-to-cleared for staff assigned to classified programs. We maintain a cleared talent pipeline by actively recruiting veterans and former federal employees with existing active clearances, reducing the 12-to-18-month investigation timeline for new clearance requests on time-sensitive programs. Annual security refresher training, SF-86 continuous reporting guidance, and foreign contact reporting processes are managed through our Security Officer to maintain clearance holder compliance with reporting obligations. TechBridge Solutions holds a Facility Security Clearance at the Secret level, enabling classified work performance at our Atlanta and Washington D.C. office locations. We have supported cleared programs for three federal agencies and maintain relationships with cleared subcontractors to rapidly augment cleared capacity when program demands exceed our standing cleared workforce.",
    category: "Staffing",
    tags: ["security-clearance", "federal", "background", "government", "personnel"],
    confidence_base: 0.88,
  },
  // ── STAFFING entries 36-50 ──
  {
    question: "How do you conduct background investigations for staff assigned to client engagements?",
    answer: "We conduct multi-tier background investigations for all staff assigned to client engagements, calibrated to the sensitivity of client data and system access the role will require. Our standard background investigation — completed for all new hires before first client assignment — includes criminal history checks in all jurisdictions of residence and employment over the past 7 years, employment verification covering the past 10 years, education credential verification, professional license verification, and Social Security number trace. For staff assigned to financial services clients or roles with access to PII or financial data, we conduct credit history reviews. For federal and regulated industry engagements, we conduct enhanced investigations including personal reference interviews and expanded criminal jurisdiction checks. All investigations are conducted through a certified Consumer Reporting Agency in compliance with the Fair Credit Reporting Act, with adjudication criteria documented, consistently applied, and reviewed by legal counsel for compliance with applicable state ban-the-box and fair chance hiring regulations. Re-investigation occurs every 3 years for staff holding sensitive client access and immediately upon client or internal escalation of conduct concerns. TechBridge Solutions has never had a staff member involved in a security incident attributable to inadequate pre-employment screening, and our investigation standards meet or exceed those required by NIST SP 800-53 Personnel Security controls for Moderate and High baseline systems.",
    category: "Staffing",
    tags: ["background-check", "screening", "personnel", "security", "compliance"],
    confidence_base: 0.88,
  },
  {
    question: "How do distributed teams communicate and collaborate across time zones and locations?",
    answer: "We operate a deliberate distributed collaboration model built around asynchronous-first communication norms supported by a curated toolchain, ensuring that geographic dispersion does not create information asymmetry between onsite and remote team members. Microsoft Teams serves as our primary communication and meeting platform, with defined channel taxonomy for each engagement that separates daily operational discussions, technical decisions, client communications, and social interaction into structured, searchable spaces. We establish a Collaboration Charter at engagement start — co-created with the client — that defines working hours, response time expectations by message urgency, meeting-free focus blocks, and documentation standards, giving distributed teams an agreed social contract that prevents ambiguity-driven friction. All significant technical and design decisions are documented in Architecture Decision Records and posted to Confluence before synchronous discussion, enabling team members in different time zones to review context and prepare input before meetings rather than processing information in real time for the first time. Video-on norms during all team synchronous sessions — supported by our provision of quality webcams to home-based staff — preserve social cues that reduce miscommunication in remote interactions. TechBridge Solutions distributed teams have maintained client satisfaction scores averaging 4.7 out of 5.0 across 3 years of primarily remote delivery, demonstrating that our collaboration model produces outcomes indistinguishable from co-located delivery models.",
    category: "Staffing",
    tags: ["collaboration", "remote", "communication", "tools", "distributed-teams"],
    confidence_base: 0.87,
  },
  {
    question: "Describe your agile pod team structure for software delivery engagements.",
    answer: "We organize software delivery teams into cross-functional agile pods of 6 to 9 members, each pod containing the full set of skills required to design, build, test, and operate a defined product area independently, minimizing handoffs between teams that slow delivery velocity. A standard pod comprises a Product Owner who holds the backlog and prioritization authority, a Technical Lead who guides architecture and code quality, 3 to 5 engineers spanning frontend, backend, and data disciplines appropriate to the pod's scope, a QA Engineer who owns test automation and acceptance criteria, and a DevOps Engineer who manages the CI/CD pipeline and infrastructure as code for the pod's services. Pods operate in 2-week sprints with standardized ceremonies — daily standups of 15 minutes, sprint planning, backlog refinement, sprint review, and retrospective — using a consistent Jira board configuration that enables portfolio-level visibility across all pods simultaneously. Inter-pod dependencies are managed through a weekly Scrum of Scrums where Technical Leads from all pods surface cross-cutting concerns, API contract changes, and shared service coordination needs. TechBridge Solutions pod teams consistently deliver 40-plus story points per sprint per pod, maintain defect escape rates below 2%, and achieve sprint goal completion rates of 88% or higher across our active delivery portfolio, demonstrating the effectiveness of our staffing model and delivery discipline.",
    category: "Staffing",
    tags: ["agile", "pod", "scrum", "team-structure", "delivery"],
    confidence_base: 0.89,
  },
  {
    question: "What is your Center of Excellence model and how does it benefit clients?",
    answer: "We operate 8 Centers of Excellence — Cloud & Infrastructure, Application Modernization, Data & AI, Cybersecurity, Healthcare IT, Financial Services Technology, Enterprise Applications, and Digital Experience — each functioning as an internal knowledge community that develops intellectual capital, delivery standards, and reusable assets that accelerate and improve client delivery across our portfolio. Each CoE is led by a Practice Fellow with 15-plus years of domain expertise, supported by a council of Principal Engineers and Architects who contribute standards development, technology evaluation, and peer review alongside their client delivery responsibilities. CoEs produce three categories of assets that directly benefit clients: Accelerators — pre-built, tested code libraries and infrastructure templates that reduce implementation effort by 30% to 50%; Playbooks — documented implementation methodologies with decision trees for common engagement scenarios; and Benchmarks — performance and quality standards derived from cross-client delivery data that set outcome targets before engagements begin. Clients benefit from CoE investment in three concrete ways: faster delivery through reusable accelerators, higher quality through standardized patterns validated across multiple prior engagements, and access to innovation that would not be economically justifiable within a single engagement budget. TechBridge Solutions CoEs have published 340 accelerators used across our delivery portfolio, and CoE-sourced assets contribute to an average 28% reduction in discovery and design phase duration compared to building equivalent deliverables from scratch.",
    category: "Staffing",
    tags: ["center-of-excellence", "coe", "governance", "best-practices", "knowledge"],
    confidence_base: 0.87,
  },
  {
    question: "How do you forecast resource demand and manage capacity across engagements?",
    answer: "We manage resource demand and capacity through a centralized Resource Management Office that maintains real-time visibility into supply — available staff by skill, location, clearance, and engagement availability — and demand — confirmed and pipeline project staffing requirements by role and start date — enabling proactive capacity planning rather than reactive scrambling when new work is awarded. Our Resource Management System updates availability forecasts weekly as engagement timelines shift and new opportunities progress through the pipeline, providing Resource Managers with a rolling 12-week capacity view. Demand forecasting uses opportunity-weighted pipeline analysis — each opportunity in our CRM carries an estimated probability, start date, and staffing model that feeds an aggregated demand forecast, enabling us to begin recruiting or bench development actions before contracts are executed for high-probability opportunities. Staff utilization targets are managed at the individual level, with alerts for staff approaching under-utilization thresholds who require near-term placement, and for staff approaching overutilization who may need workload relief. Our staffing process for new engagements follows a 48-hour matching SLA — when a project need is submitted to the Resource Management Office, a ranked slate of qualified candidates is returned within 2 business days. TechBridge Solutions maintains bench utilization below 4% of our billable workforce, meaning clients benefit from rapid access to available talent without the overhead costs of large idle bench populations reflected in billing rates.",
    category: "Staffing",
    tags: ["resource-forecasting", "capacity", "demand", "planning", "staffing"],
    confidence_base: 0.86,
  },
  {
    question: "How do you assess and track staff competencies and skills?",
    answer: "We maintain a Skills Inventory for all 1,400-plus TechBridge Solutions professionals, capturing self-assessed and manager-validated proficiency ratings across 280 technical and functional skill dimensions, updated semi-annually and following each engagement completion to reflect newly developed capabilities. The Skills Inventory feeds our Resource Management System directly, enabling Resource Managers to search for staff with specific skill combinations — for example, Python engineers with Databricks experience and healthcare domain knowledge — and receive ranked results sorted by proficiency level and engagement availability. Skill assessments use a 4-tier proficiency model: Awareness (theoretical knowledge), Practitioner (applied experience on 1 to 2 projects), Expert (deep applied experience, capable of leading others), and Distinguished (industry-recognized expertise). Manager validation is required for Expert and Distinguished ratings, preventing grade inflation that would undermine the inventory's usefulness in staffing decisions. Annual skills gap analyses compare our inventory distribution against projected market demand from our pipeline, identifying areas where we need to invest in training or recruiting to maintain competitive capability. In 2024, this analysis identified Generative AI engineering as an emerging gap, leading to a structured 200-person upskilling program that certified 210 engineers in AI application development within 9 months. TechBridge Solutions clients benefit from skills inventory transparency — we share role-specific skills evidence as part of our staffing proposals, enabling informed assessment of team capability fit before engagement start.",
    category: "Staffing",
    tags: ["skills-matrix", "competency", "assessment", "talent", "development"],
    confidence_base: 0.85,
  },
  {
    question: "Describe your performance management framework for consulting staff.",
    answer: "We operate a continuous performance management framework that replaces the traditional annual review cycle with quarterly Check-In conversations, enabling real-time feedback, goal adjustment, and recognition rather than saving all performance dialogue for a year-end event that is too late to influence outcomes. Each quarter, employees and managers complete structured Check-In conversations covering three dimensions: Contribution Quality, Growth Progress, and Collaboration Impact — the three pillars of our competency model. Goals are set at the beginning of each year in alignment with engagement commitments, practice development priorities, and personal career objectives, reviewed at each quarterly Check-In for relevance and progress. Calibration sessions — held semi-annually across all staff within a practice — bring together managers to discuss relative performance assessments using behavioral evidence, ensuring rating consistency and identifying high-potential professionals for accelerated development investments. Compensation decisions are formally decoupled from performance conversations, occurring once annually in a separate process, which research demonstrates produces more honest performance dialogue than systems where every performance discussion feels like a compensation negotiation. Underperformance is addressed through a structured Performance Improvement Plan process with clear expectations, support resources, and timelines — with the primary goal of enabling the individual to succeed rather than managing them out. TechBridge Solutions' performance management approach earned a Glassdoor rating of 4.4 out of 5.0 for career opportunities, reflecting employee confidence that performance management fairly supports advancement.",
    category: "Staffing",
    tags: ["performance-management", "reviews", "goals", "feedback", "consulting"],
    confidence_base: 0.86,
  },
  {
    question: "How do you measure and improve employee engagement and satisfaction?",
    answer: "We measure employee engagement through a combination of a quarterly Employee Net Promoter Score pulse survey and an annual comprehensive engagement survey administered by a third-party vendor, ensuring measurement frequency that captures sentiment trends while providing sufficient depth to diagnose root causes and design effective interventions. Our quarterly eNPS survey asks three questions: likelihood to recommend TechBridge Solutions as an employer, likelihood to recommend the employee's current manager, and an open-ended prompt on what most needs to change. Results are reported to all senior leaders within 5 days of survey close, with individual manager scores shared with those managers and their directors to enable direct accountability. Our most recent annual engagement survey achieved 91% participation and reported an overall engagement score of 78% — 12 percentage points above the professional services industry benchmark of 66%. Areas scoring below the 60th percentile on the annual survey trigger mandatory Action Planning: the relevant VP and their leadership team produce a 90-day improvement plan reviewed by the Chief People Officer with quarterly progress reporting to executive leadership. We track engagement score trends at the team level, enabling identification of specific pockets of disengagement before they escalate to attrition events. TechBridge Solutions' engagement investment has correlated with our 9.2% voluntary turnover rate — less than half the industry average — demonstrating that sustained engagement measurement and response directly produces the retention outcomes clients depend on for delivery continuity.",
    category: "Staffing",
    tags: ["employee-engagement", "satisfaction", "culture", "nps", "retention"],
    confidence_base: 0.85,
  },
  {
    question: "What university and academic recruiting partnerships do you maintain?",
    answer: "We maintain active university recruiting partnerships with 18 universities across the United States, including flagship state universities and historically Black colleges and universities, engaging through on-campus career fairs, technical recruiting events, sponsored capstone projects, and guest lecture series that build TechBridge Solutions brand recognition among student talent pools. Our anchor university partnerships — with Georgia Tech, University of Illinois, Carnegie Mellon, Howard University, and Morgan State — include dedicated recruiting coordinators, executive sponsor relationships with department chairs, and multi-year sponsorship commitments that fund scholarships, hackathons, and research projects in areas aligned with our technology practice priorities. We hire 60 to 80 new graduates annually through university recruiting pipelines across software engineering, data science, cybersecurity, and business analysis disciplines, with an explicit target of sourcing 40% of new graduate hires from HBCU and Hispanic-Serving Institution partners in support of our diversity and inclusion commitments. Faculty advisor relationships with 14 professors provide TechBridge Solutions with early access to research talent and enable collaborative curriculum development that ensures graduates are exposed to technologies and practices relevant to consulting career paths. TechBridge Solutions' university recruiting team includes 8 dedicated campus recruiters who attend 35 campus events annually, supplemented by 120 employee alumni ambassadors who serve as informal brand advocates on their undergraduate campuses.",
    category: "Staffing",
    tags: ["university", "recruiting", "pipeline", "campus", "talent"],
    confidence_base: 0.84,
  },
  {
    question: "Describe your internship-to-full-time pipeline and conversion metrics.",
    answer: "We operate a 12-week Summer Internship Program that we design explicitly as a 12-week extended interview — providing interns with real client delivery exposure, structured mentorship, and peer community while giving TechBridge Solutions an evidence-based foundation for full-time offer decisions that significantly outperforms traditional campus recruiting. Our summer cohort of 45 to 60 interns is organized into cross-functional project teams that tackle real internal or pro bono client challenges, enabling interns to demonstrate collaboration, problem-solving, and communication skills in conditions that reflect actual consulting work rather than contrived evaluation exercises. Each intern is paired with an Intern Manager — a senior staff member accountable for the intern's development and evaluation — and a Peer Buddy who provides informal guidance and cultural onboarding. Weekly technical and professional development sessions cover consulting fundamentals, TechBridge Solutions methodologies, and domain knowledge relevant to our major practice areas. Formal mid-program and end-of-program evaluations produce evidence-based hiring recommendations reviewed by practice leaders. Our internship-to-full-time offer rate was 78% in the most recent program year, with 91% of offer recipients accepting — metrics that reflect both selective offer decisions and a program experience compelling enough to earn strong acceptance rates in a competitive talent market. Intern-sourced full-time hires have demonstrated 15% lower voluntary turnover in their first two years compared to direct campus hires, validating the internship as an effective mutual selection process.",
    category: "Staffing",
    tags: ["internship", "new-grad", "pipeline", "recruiting", "conversion"],
    confidence_base: 0.84,
  },
  {
    question: "How do you hire and support veterans transitioning from military service?",
    answer: "We operate the TechBridge Veterans Transition Program, a structured hiring and onboarding program specifically designed to attract, evaluate, and support military veterans transitioning to civilian technology consulting careers, recognizing that veterans bring exceptional leadership, discipline, mission focus, and clearance eligibility that make them outstanding consulting professionals. Our military recruiting partnerships include relationships with Hiring Our Heroes, Veterati, and American Corporate Partners, and we participate in Transition Assistance Program job fairs at 6 military installations annually. Veteran candidates complete a skills translation interview process — distinct from our standard technical screening — that focuses on leadership competencies, problem-solving under pressure, and team cohesion skills, with technical assessment calibrated to the candidate's civilian technology training rather than prior commercial experience. All veteran new hires are enrolled in TechBridge Launch with supplemental Military-to-Consulting modules covering client relationship norms, consulting communication styles, and civilian performance management conventions that differ meaningfully from military culture. The TechBridge Veterans Alliance — our largest Employee Resource Group with 140 members — provides peer community, mentorship from veteran staff in senior roles, and advocacy for veteran-inclusive policies. We maintain a target of sourcing 12% of annual new hires from military veteran pipelines. In the past fiscal year, we hired 68 veterans, 31 of whom held active security clearances enabling immediate assignment to federal programs. Our veteran retention rate of 91% after 2 years exceeds our overall company retention rate, confirming the program's mutual value.",
    category: "Staffing",
    tags: ["veterans", "military", "hiring", "transition", "diversity"],
    confidence_base: 0.86,
  },
  {
    question: "How do you manage subcontractor selection, onboarding, and quality assurance?",
    answer: "We manage subcontractor relationships through a formal Subcontractor Management Program that applies the same rigor to partner selection, onboarding, and performance management that we apply to our own staff, ensuring that subcontracted personnel deliver outcomes consistent with TechBridge Solutions quality standards and do not create risk for client engagements. Subcontractor selection begins with qualification assessment covering technical capabilities, past performance references, financial stability, security posture, and workforce practices — we will not engage subcontractors with unresolved OSHA violations, adverse past performance findings, or inadequate information security programs. All subcontractors execute our standard Subcontractor Agreement, which incorporates flow-down of all prime contract requirements including security, compliance, and performance standards, and grants TechBridge Solutions audit rights over subcontractor delivery personnel records and security controls. Subcontractor personnel complete TechBridge Solutions security awareness training, receive role-specific engagement onboarding equivalent to direct staff, and are covered under our security and background investigation standards. Performance is assessed monthly against defined delivery metrics, and subcontractor performance ratings are documented and considered in future sourcing decisions. TechBridge Solutions maintains an approved subcontractor registry of 45 pre-qualified firms across technology specializations, enabling rapid staffing augmentation without full qualification cycles delaying program starts. In the past 3 years, we have managed 12 subcontractor relationships across prime contract programs with zero quality or security incidents attributable to subcontracted personnel.",
    category: "Staffing",
    tags: ["subcontractor", "vendor-management", "quality", "onboarding", "compliance"],
    confidence_base: 0.87,
  },
  {
    question: "Describe your staff augmentation process and rapid scaling capabilities.",
    answer: "We offer staff augmentation services supported by a dedicated Talent Solutions practice with access to a pre-screened professional network of 2,400 technology specialists across cloud engineering, data engineering, cybersecurity, enterprise applications, and software development disciplines, enabling rapid deployment of qualified professionals in response to client surge demands. Our Rapid Augmentation SLA commits to presenting qualified candidate slates within 5 business days for standard roles and within 48 hours for roles matching our pre-positioned bench talent. Augmentation candidates complete a structured screening process covering technical assessment, behavioral interview, background investigation, and skills verification before presentation, ensuring clients receive only pre-qualified professionals rather than unvetted resumes requiring additional screening. For federal engagements requiring cleared personnel, our cleared talent pipeline supports placements with active clearances within 2 to 3 weeks — compared to 12 to 18 months for new clearance investigations — by maintaining a standing community of cleared professionals interested in federal consulting opportunities. We provide augmented staff with a TechBridge Solutions Engagement Handbook covering tools, standards, and reporting expectations, reducing the assimilation time burden on client teams. Surge capacity — adding 10 or more resources within 30 days — has been successfully executed on 8 separate occasions in our history, including a COVID-19 response program where we deployed 47 engineers within 3 weeks to support a state public health agency. Our largest current client relationship began as a 2-person staff augmentation and grew to a 60-person managed delivery engagement over 4 years through demonstrated quality and trust.",
    category: "Staffing",
    tags: ["staff-augmentation", "scaling", "flex-staffing", "capacity", "surge"],
    confidence_base: 0.88,
  },
  {
    question: "What is your remote and hybrid work policy and how does it affect delivery?",
    answer: "We operate a Flex First work model that empowers employees and engagement teams to determine the working arrangement — fully remote, hybrid, or onsite — that best serves client delivery goals and team collaboration needs, rather than imposing a uniform policy that prioritizes office attendance over outcomes. For client-facing engagements, work location decisions are made collaboratively between TechBridge Solutions and the client at engagement start, documented in the Engagement Operating Model, and revisited quarterly as needs evolve. We provide all remote and hybrid employees with a $1,500 home office setup stipend and a $100 monthly internet and equipment allowance, ensuring that distributed team members have professional-grade working environments that support high-quality video collaboration. Our Collaboration Principles governing distributed teams — covering communication norms, documentation standards, and synchronous meeting design — ensure that remote participation is a first-class experience rather than an afterthought. Delivery performance data from our portfolio shows no statistically significant difference in client satisfaction scores, defect rates, or schedule adherence between co-located and remote-first engagements when our Collaboration Principles are consistently applied. TechBridge Solutions' Flex First policy has expanded our recruiting geography from commuting-distance talent pools around our office locations to a national talent market, increasing the quality of candidates available for specialized roles by 3x and reducing average time-to-fill for technical positions from 52 days to 34 days.",
    category: "Staffing",
    tags: ["remote-work", "hybrid", "policy", "distributed", "productivity"],
    confidence_base: 0.85,
  },
  {
    question: "How does your organization attract, retain, and advance women and underrepresented groups in technology?",
    answer: "We advance equity in our workforce through a comprehensive DEI strategy that sets measurable representation targets, addresses systemic barriers at each talent lifecycle stage, and holds leadership accountable for outcomes rather than activity metrics. Our current workforce is 38% women — above the 28% industry average for technology consulting — and 31% underrepresented racial and ethnic groups, with explicit targets to reach 45% women and 36% underrepresented groups by 2027 through recruiting, retention, and advancement initiatives. Recruiting equity actions include structured interview scorecards that eliminate unanchored subjective assessments, diverse interview panels required for all hiring decisions at Senior Associate and above, and partnerships with Women Who Code, Lesbians Who Tech, AfroTech, and the National Society of Black Engineers that expand our candidate sourcing beyond traditional channels. Retention programs include our Women in Technology Network — which runs a 6-month mentoring program matching 80 women with senior leaders annually — a Sponsorship Program that pairs Directors with high-potential underrepresented professionals for active career advocacy, and pay equity audits conducted annually by a third-party firm with corrective actions implemented within 90 days of audit findings. Advancement tracking monitors promotion rates, assignment quality, and compensation growth by demographic segment at each level, with equity gaps surfaced to the Chief People Officer and CEO quarterly. TechBridge Solutions was recognized on the Bloomberg Gender-Equality Index in 2024 and earned the Human Rights Campaign Foundation Corporate Equality Index score of 100, reflecting the breadth and depth of our inclusion commitments.",
    category: "Staffing",
    tags: ["diversity", "inclusion", "women-in-tech", "equity", "dei"],
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

  const toInsert = batch2Entries.filter(
    (e) => !existingTitles.has(e.question)
  );
  console.log(
    `\n🚀 Batch 2: ${batch2Entries.length} entries defined, ${toInsert.length} new to insert.\n`
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
    `\n🎉 Batch 2 complete! ${inserted} inserted, ${failed} failed.\n`
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
  console.error("\n❌ Batch 2 seed failed:", err.message);
  process.exit(1);
});
