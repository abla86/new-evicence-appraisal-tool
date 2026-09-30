import type { AppraisalDomain, AppraisalInstrument } from '../types/index.ts';

/**
 * AMSTAR 2: A critical appraisal tool for systematic reviews that include randomised 
 * or non-randomised studies of healthcare interventions, or both (Shea et al., BMJ 2017).
 * Critical domains: 2 (Protocol), 4 (Search), 7 (Justification for excluding studies),
 * 9 (RoB in individual studies), 11 (Appropriate meta-analytical methods),
 * 13 (Account for RoB in interpreting results), 15 (Publication bias assessment).
 */
export const AMSTAR2_DOMAINS: AppraisalDomain[] = [
  {
    id: 'amstar2-q1',
    number: 1,
    title: 'PICO Question & Inclusion Criteria',
    question: 'Did the research questions and inclusion criteria for the review include the components of PICO?',
    description: 'Population, Intervention, Comparator group, Outcome, and Timing/Setting must be explicitly defined in advance.',
    isCritical: false,
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Population clearly described',
      'Intervention clearly described',
      'Comparator group clearly described',
      'Outcome clearly described'
    ]
  },
  {
    id: 'amstar2-q2',
    number: 2,
    title: 'Protocol Registration & Deviations',
    question: 'Did the report of the review contain an explicit statement that the review methods were established prior to the conduct of the review and did the report justify any significant deviations from the protocol?',
    description: 'Protocol published or registered (e.g. PROSPERO, Cochrane, Open Science Framework) before study initiation with clear objectives and search strategy.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Registration in PROSPERO or clinicaltrials.gov prior to screening',
      'Pre-specified statistical analysis plan and search strategy',
      'Explicit justification for deviations from protocol'
    ]
  },
  {
    id: 'amstar2-q3',
    number: 3,
    title: 'Explanation of Study Designs Selected',
    question: 'Did the review authors explain their selection of the study designs for inclusion in the review?',
    description: 'Explanation for including only RCTs, or RCTs and NRSI (non-randomized studies of interventions).',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Review justified inclusion of RCTs, observational or both study designs'
    ]
  },
  {
    id: 'amstar2-q4',
    number: 4,
    title: 'Comprehensive Literature Search Strategy',
    question: 'Did the review authors use a comprehensive literature search strategy?',
    description: 'Must search at least 2 major bibliographic databases (e.g., MEDLINE/PubMed, Embase, Cochrane), provide full search strings, search trial registries, grey literature, and reference lists.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Searched at least 2 key electronic databases (e.g., MEDLINE, Embase, Cochrane)',
      'Provided full search strategy/keywords and date ranges',
      'Searched trial/study registries and contacted experts',
      'Searched reference lists of included studies'
    ]
  },
  {
    id: 'amstar2-q5',
    number: 5,
    title: 'Duplicate Study Selection',
    question: 'Did the review authors perform study selection in duplicate?',
    description: 'At least two reviewers independently agreed on study eligibility, with a documented consensus or arbitration procedure.',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Two authors independently screened titles/abstracts and full text',
      'Disagreements resolved by third arbiter or consensus'
    ]
  },
  {
    id: 'amstar2-q6',
    number: 6,
    title: 'Duplicate Data Extraction',
    question: 'Did the review authors perform data extraction in duplicate?',
    description: 'At least two reviewers independently extracted study characteristics and numerical outcomes, or one extracted and second verified.',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Two authors independently extracted data or one extracted and second verified'
    ]
  },
  {
    id: 'amstar2-q7',
    number: 7,
    title: 'List of Excluded Studies & Justifications',
    question: 'Did the review authors provide a list of excluded studies and justify the exclusions?',
    description: 'Must provide a list of potentially relevant studies read in full text that were excluded, alongside specific methodological/clinical reasons for each.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Provided a list of excluded full-text articles',
      'Provided specific, justified reason for exclusion of each article'
    ]
  },
  {
    id: 'amstar2-q8',
    number: 8,
    title: 'Adequate Description of Included Studies',
    question: 'Did the review authors describe the included studies in adequate detail?',
    description: 'Populations, interventions, comparators, outcomes, study designs, settings, follow-up durations, and baseline characteristics described in tables.',
    isCritical: false,
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Detailed PICO characteristics of each included trial',
      'Dosing, duration, study designs, and participant demographics'
    ]
  },
  {
    id: 'amstar2-q9',
    number: 9,
    title: 'Risk of Bias Assessment Methodology',
    question: 'Did the review authors use a satisfactory technique for assessing the risk of bias (RoB) in individual studies included in the review?',
    description: 'For RCTs: RoB 2, Cochrane RoB tool (allocation concealment, blinding, selective reporting). For NRSI: ROBINS-I, Newcastle-Ottawa.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'partial', 'no'],
    guidanceCriteria: [
      'Used validated tool (e.g. RoB 2, ROBINS-I, Cochrane tool)',
      'Assessed allocation sequence generation & concealment',
      'Assessed blinding of participants and outcome assessors'
    ]
  },
  {
    id: 'amstar2-q10',
    number: 10,
    title: 'Sources of Funding in Included Studies',
    question: 'Did the review authors report on the sources of funding for the studies included in the review?',
    description: 'Reporting whether included trials were industry sponsored or non-commercially funded.',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Reported sources of funding for individual included trials'
    ]
  },
  {
    id: 'amstar2-q11',
    number: 11,
    title: 'Appropriate Statistical Synthesis Methods',
    question: 'If meta-analysis was performed, did the review authors use appropriate methods for statistical combination of results?',
    description: 'Random-effects vs fixed-effects models justified, heterogeneity (I², Chi-square) evaluated, pooling justified.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'no', 'not_applicable'],
    guidanceCriteria: [
      'Justified combining data and assessed statistical heterogeneity (I² / Tau²)',
      'Used appropriate weighting and synthesis model (e.g., DerSimonian-Laird, REML)'
    ]
  },
  {
    id: 'amstar2-q12',
    number: 12,
    title: 'Impact of RoB in Individual Studies on Synthesis',
    question: 'If meta-analysis was performed, did the review authors assess the potential impact of RoB in individual studies on the results of the meta-analysis or other evidence synthesis?',
    description: 'Sensitivity analyses or subgroup analysis restricted to low risk of bias studies.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'not_applicable'],
    guidanceCriteria: [
      'Sensitivity analysis comparing low vs high RoB trials'
    ]
  },
  {
    id: 'amstar2-q13',
    number: 13,
    title: 'Account for RoB in Discussion and Interpretation',
    question: 'Did the review authors account for RoB in primary studies when interpreting/discussing the results of the review?',
    description: 'Authors only drew firm conclusions if evidence was from low RoB trials, or explicitly tempered conclusions with RoB concerns.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Conclusions explicitly reflect and qualify risk of bias of primary studies'
    ]
  },
  {
    id: 'amstar2-q14',
    number: 14,
    title: 'Explanation & Discussion of Heterogeneity',
    question: 'Did the review authors provide a satisfactory explanation for, and discussion of, any heterogeneity observed in the results of the review?',
    description: 'Clinical or methodological sources of variance (age, dosage, disease severity) investigated if I² is substantial.',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Observed heterogeneity investigated via meta-regression or subgroup analyses'
    ]
  },
  {
    id: 'amstar2-q15',
    number: 15,
    title: 'Quantitative Investigation of Publication Bias',
    question: 'If they performed quantitative synthesis, did the review authors carry out an adequate investigation of publication bias (small study effects) and discuss its likely impact?',
    description: 'Funnel plot inspection, Egger’s regression test, Begg’s test (when >= 10 studies included), or trim-and-fill method.',
    isCritical: true, // CRITICAL DOMAIN
    allowedAnswers: ['yes', 'no', 'not_applicable'],
    guidanceCriteria: [
      'Generated funnel plots and calculated regression tests (e.g. Egger, Harbord)',
      'Discussed potential impact of publication and dissemination bias on conclusions'
    ]
  },
  {
    id: 'amstar2-q16',
    number: 16,
    title: 'Declaration of Conflicts of Interest & Funding',
    question: 'Did the review authors report any potential sources of conflict of interest, including any funding they received for conducting the review?',
    description: 'Full ICMJE conflict of interest disclosures and external grant sponsor details.',
    isCritical: false,
    allowedAnswers: ['yes', 'no'],
    guidanceCriteria: [
      'Reported grant support and financial interests of all authors'
    ]
  }
];

/**
 * CASP (Critical Appraisal Skills Programme) - Systematic Review & RCT Checklists
 */
export const CASP_DOMAINS: AppraisalDomain[] = [
  {
    id: 'casp-q1',
    number: 1,
    title: 'Clear Focus',
    question: 'Did the review/study address a clearly focused question?',
    description: 'Was the target population, intervention/exposure, and outcomes clear?',
    allowedAnswers: ['yes', 'unclear', 'no'],
    guidanceCriteria: ['PICO question clearly stated']
  },
  {
    id: 'casp-q2',
    number: 2,
    title: 'Appropriate Study Design',
    question: 'Did the authors look for the right type of papers/study design?',
    description: 'Did the selected design address the clinical question appropriately?',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q3',
    number: 3,
    title: 'Comprehensive Identification',
    question: 'Do you think all the important, relevant studies were included?',
    description: 'Search across databases, unpublished literature, conference abstracts.',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q4',
    number: 4,
    title: 'Quality Assessment Rigour',
    question: 'Did the review’s authors do enough to assess the quality of the included studies?',
    description: 'Pre-specified scoring criteria, scoring duplicate validation.',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q5',
    number: 5,
    title: 'Combining Results',
    question: 'If the results of the review have been combined, was it reasonable to do so?',
    description: 'Check for clinical and statistical heterogeneity before pooling.',
    allowedAnswers: ['yes', 'unclear', 'no', 'not_applicable']
  },
  {
    id: 'casp-q6',
    number: 6,
    title: 'Bottom Line Results',
    question: 'What are the overall results of the review/study?',
    description: 'Effect sizes (RR, OR, MD, SMD) and precision (95% CI).',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q7',
    number: 7,
    title: 'Precision of Estimates',
    question: 'How precise are the results?',
    description: 'Are confidence intervals narrow or wide enough to encompass clinical insignificance?',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q8',
    number: 8,
    title: 'Local Applicability',
    question: 'Can the results be applied to the local population / setting?',
    description: 'Are participants similar enough to your clinical cohort?',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q9',
    number: 9,
    title: 'All Important Outcomes',
    question: 'Were all important outcomes considered?',
    description: 'Patient-reported outcomes, adverse events, quality of life, economic costs.',
    allowedAnswers: ['yes', 'unclear', 'no']
  },
  {
    id: 'casp-q10',
    number: 10,
    title: 'Value of Benefits vs Harm',
    question: 'Are the benefits worth the harms and costs?',
    description: 'Risk-benefit ratio and clinical net utility.',
    allowedAnswers: ['yes', 'unclear', 'no']
  }
];

/**
 * AGREE II: Appraisal of Guidelines for Research & Evaluation (Brouwers et al., 2010 / 2016)
 * 23 items across 6 domains + 2 overall assessment items evaluated on a 1–7 Likert Scale.
 */
export const AGREE2_DOMAINS: AppraisalDomain[] = [
  // Domene 1: Omfang og formål (Scope and Purpose)
  {
    id: 'agree2-q1',
    number: 1,
    category: 'Domene 1: Omfang og formål (Scope and Purpose)',
    title: 'Punkt 1: Formål og målsetting',
    question: 'Er formålet med retningslinjen tydelig og spesifikt beskrevet?',
    description: 'The overall objective(s) of the guideline is (are) specifically described (helsegevinster, forventet utkomme).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q2',
    number: 2,
    category: 'Domene 1: Omfang og formål (Scope and Purpose)',
    title: 'Punkt 2: Kliniske problemstillinger',
    question: 'Er de kliniske spørsmålene og problemstillingene klart formulert?',
    description: 'The health question(s) covered by the guideline is (are) specifically described (PICO spørsmål, intervensjoner, målgrupper).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q3',
    number: 3,
    category: 'Domene 1: Omfang og formål (Scope and Purpose)',
    title: 'Punkt 3: Målgruppe (pasienter/befolkning)',
    question: 'Er målgruppen og populasjonen for retningslinjen tydelig definert?',
    description: 'The population (patients, public, etc.) to whom the guideline is meant to apply is specifically described.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Domene 2: Involvering av interessenter (Stakeholder Involvement)
  {
    id: 'agree2-q4',
    number: 4,
    category: 'Domene 2: Involvering av interessenter (Stakeholder Involvement)',
    title: 'Punkt 4: Relevante faggrupper',
    question: 'Inkluderer utviklingsgruppen representanter fra alle relevante faggrupper?',
    description: 'The guideline development group includes individuals from all relevant professional groups (tverrfaglig arbeidsgruppe).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q5',
    number: 5,
    category: 'Domene 2: Involvering av interessenter (Stakeholder Involvement)',
    title: 'Punkt 5: Pasient- og brukermedvirkning',
    question: 'Er pasient- og brukerperspektivet, erfaringer og preferanser ivaretatt?',
    description: 'The views and preferences of the target population (patients, public, carers) have been sought.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q6',
    number: 6,
    category: 'Domene 2: Involvering av interessenter (Stakeholder Involvement)',
    title: 'Punkt 6: Målgruppe for retningslinjen (brukere)',
    question: 'Er de tiltenkte brukerne av retningslinjen tydelig beskrevet?',
    description: 'The target users of the guideline are clearly defined (f.eks. leger, sykepleiere, helseledere).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Domene 3: Rigor i utvikling (Rigour of Development)
  {
    id: 'agree2-q7',
    number: 7,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 7: Systematiske søkemetoder',
    question: 'Er det benyttet systematiske metoder i litteratursøket etter evidens?',
    description: 'Systematic methods were used to search for evidence (databaser, søkestrenger, tidsrom).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q8',
    number: 8,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 8: Kriterier for valg av evidens',
    question: 'Er kriteriene for utvelgelse og inklusjon av evidens tydelig beskrevet?',
    description: 'The criteria for selecting the evidence are clearly described (inkluderte/ekskluderte studiedesign).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q9',
    number: 9,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 9: Styrker og svakheter ved evidensen',
    question: 'Er styrker og begrensninger ved evidensgrunnlaget eksplisitt vurdert?',
    description: 'The strengths and limitations of the body of evidence are clearly described (f.eks. GRADE vurdering, biasrisiko).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q10',
    number: 10,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 10: Metoder for formulering av anbefalinger',
    question: 'Er metodene som er brukt for å formulere anbefalingene klart beskrevet?',
    description: 'The methods for formulating the recommendations are clearly described (konsensusprosesser, beslutningskriterier).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q11',
    number: 11,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 11: Helsegevinster og bivirkningsrisiko',
    question: 'Er helsegevinster, bivirkninger og risiko vurdert i anbefalingene?',
    description: 'The health benefits, side effects, and risks have been considered in formulating the recommendations.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q12',
    number: 12,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 12: Kobling mellom anbefaling og evidens',
    question: 'Er det en eksplisitt og synlig kobling mellom anbefalingene og evidensgrunnlaget?',
    description: 'There is an explicit link between the recommendations and the supporting evidence.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q13',
    number: 13,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 13: Ekstern fagfellevurdering',
    question: 'Er retningslinjen fagfellevurdert av eksterne eksperter før publisering?',
    description: 'The guideline has been externally reviewed by experts prior to its publication (høringsrunder, ekstern fagfellevurdering).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q14',
    number: 14,
    category: 'Domene 3: Rigor i utvikling (Rigour of Development)',
    title: 'Punkt 14: Plan for oppdatering',
    question: 'Inneholder retningslinjen en prosedyre og tidsplan for framtidig oppdatering?',
    description: 'A procedure for updating the guideline is provided (revisjonsintervall, nye studier).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Domene 4: Klarhet i presentasjon (Clarity of Presentation)
  {
    id: 'agree2-q15',
    number: 15,
    category: 'Domene 4: Klarhet i presentasjon (Clarity of Presentation)',
    title: 'Punkt 15: Tydelige og konkrete anbefalinger',
    question: 'Er anbefalingene spesifikke, utvetydige og konkrete?',
    description: 'The recommendations are specific and unambiguous (hva skal gjøres, for hvem, og når).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q16',
    number: 16,
    category: 'Domene 4: Klarhet i presentasjon (Clarity of Presentation)',
    title: 'Punkt 16: Ulike behandlingsalternativer',
    question: 'Er de ulike behandlingsalternativene eller håndteringsmulighetene tydelig presentert?',
    description: 'The different options for management of the condition or health issue are clearly presented.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q17',
    number: 17,
    category: 'Domene 4: Klarhet i presentasjon (Clarity of Presentation)',
    title: 'Punkt 17: Nøkkelanbefalinger lett identifiserbare',
    question: 'Er de viktigste nøkkelanbefalingene lett identifiserbare og uthevet?',
    description: 'Key recommendations are easily identifiable (oppsummeringstabeller, uthevet typografi).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Domene 5: Anvendbarhet (Applicability)
  {
    id: 'agree2-q18',
    number: 18,
    category: 'Domene 5: Anvendbarhet (Applicability)',
    title: 'Punkt 18: Organisatoriske barrierer og fremmere',
    question: 'Beskriver retningslinjen faktorer som fremmer eller hemmer implementeringen?',
    description: 'The guideline describes facilitators and barriers to its application (organisatoriske utfordringer).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q19',
    number: 19,
    category: 'Domene 5: Anvendbarhet (Applicability)',
    title: 'Punkt 19: Råd og verktøy for implementering',
    question: 'Inneholder retningslinjen råd og/eller verktøy for hvordan anbefalingene kan tas i bruk?',
    description: 'The guideline provides advice and/or tools on how the recommendations can be put into practice (flytskjemaer, sjekklister).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q20',
    number: 20,
    category: 'Domene 5: Anvendbarhet (Applicability)',
    title: 'Punkt 20: Ressurs- og kostnadsimplikasjoner',
    question: 'Er ressurs- og kostnadskonsekvenser ved å ta i bruk anbefalingene vurdert?',
    description: 'The potential resource implications of applying the recommendations have been considered.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q21',
    number: 21,
    category: 'Domene 5: Anvendbarhet (Applicability)',
    title: 'Punkt 21: Overvåknings- og evalueringskriterier',
    question: 'Inneholder retningslinjen kriterier for monitorering, revisjon eller evaluering?',
    description: 'The guideline presents monitoring and/or auditing criteria (kvalitetsindikatorer, målbare kriterier).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Domene 6: Redaksjonell uavhengighet (Editorial Independence)
  {
    id: 'agree2-q22',
    number: 22,
    category: 'Domene 6: Redaksjonell uavhengighet (Editorial Independence)',
    title: 'Punkt 22: Uavhengighet fra finansierende organ',
    question: 'Er retningslinjen uavhengig av særinteressene til det finansierende organet?',
    description: 'The views of the funding body have not influenced the content of the guideline.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-q23',
    number: 23,
    category: 'Domene 6: Redaksjonell uavhengighet (Editorial Independence)',
    title: 'Punkt 23: Dokumentasjon av interessekonflikter',
    question: 'Er interessekonflikter og bindinger hos alle i utviklingsgruppen dokumentert og håndtert?',
    description: 'Competing interests of guideline development group members have been recorded and addressed.',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },

  // Overall Assessment (Totalvurdering)
  {
    id: 'agree2-overall-quality',
    number: 24,
    category: 'Overall Assessment (Totalvurdering)',
    title: 'Punkt 24: Total kvalitetsvurdering',
    question: 'Hva er din samlede vurdering av retningslinjens metodologiske kvalitet (1-7)?',
    description: 'Rate the overall quality of this guideline (1 = Lowest possible quality, 7 = Highest possible quality).',
    allowedAnswers: ['7', '6', '5', '4', '3', '2', '1']
  },
  {
    id: 'agree2-overall-recommend',
    number: 25,
    category: 'Overall Assessment (Totalvurdering)',
    title: 'Punkt 25: Anbefaling for klinisk praksis',
    question: 'Vil du anbefale at denne retningslinjen tas i bruk i praksis?',
    description: 'Would you recommend this guideline for use in practice? (Ja / Delvis med modifikasjoner / Nei)',
    allowedAnswers: ['ja', 'delvis', 'nei', 'yes', 'partial', 'no']
  }
];

/**
 * GRADE (Grading of Recommendations Assessment, Development and Evaluation)
 */
export const GRADE_DOMAINS: AppraisalDomain[] = [
  {
    id: 'grade-d1',
    number: 1,
    title: 'Risk of Bias (Study Limitations)',
    question: 'Is there serious or very serious risk of bias across the body of evidence?',
    description: 'Inadequate sequence generation, allocation concealment, unblinded outcome assessment.',
    allowedAnswers: ['no', 'some_concerns', 'high'], // no downgrade, serious (-1), very serious (-2)
    guidanceCriteria: ['No serious limitation (0)', 'Serious limitation (-1)', 'Very serious limitation (-2)']
  },
  {
    id: 'grade-d2',
    number: 2,
    title: 'Inconsistency of Results',
    question: 'Is there unexplained statistical or clinical heterogeneity across included trials?',
    description: 'Point estimates vary widely, confidence intervals minimal overlap, I² > 50% without clinical explanation.',
    allowedAnswers: ['no', 'some_concerns', 'high']
  },
  {
    id: 'grade-d3',
    number: 3,
    title: 'Indirectness of Evidence',
    question: 'Are differences between the population, intervention, comparator, or outcome studied and the PICO question of interest?',
    description: 'Surrogate endpoints, indirect comparisons, distinct patient sub-populations.',
    allowedAnswers: ['no', 'some_concerns', 'high']
  },
  {
    id: 'grade-d4',
    number: 4,
    title: 'Imprecision of Effect Estimates',
    question: 'Are sample sizes or number of events small, or 95% confidence intervals wide spanning clinical decision thresholds?',
    description: 'Optimal Information Size (OIS) not met, CI includes both substantial benefit and harm.',
    allowedAnswers: ['no', 'some_concerns', 'high']
  },
  {
    id: 'grade-d5',
    number: 5,
    title: 'Publication Bias',
    question: 'Is there strong suspicion that negative or non-significant studies were not published?',
    description: 'Asymmetric funnel plots, small commercial studies, failure to search grey literature.',
    allowedAnswers: ['no', 'some_concerns', 'high']
  },
  {
    id: 'grade-d6',
    number: 6,
    title: 'Upgrades: Large Effect / Dose-Response',
    question: 'Are there reasons to upgrade observational evidence (Large effect RR>2 or RR>5, dose-response gradient, opposing residual confounding)?',
    description: 'Upgrade by +1 or +2 if magnitude of effect is large and no plausible confounding.',
    allowedAnswers: ['no', 'yes']
  }
];

/**
 * Cochrane RoB 2 (Risk of Bias in Randomized Trials)
 */
export const ROB2_DOMAINS: AppraisalDomain[] = [
  {
    id: 'rob2-d1',
    number: 1,
    title: 'Domain 1: Randomization Process',
    question: 'Risk of bias arising from the randomization process',
    description: 'Random allocation sequence generated, allocation sequence concealed, baseline imbalances balanced.',
    allowedAnswers: ['low', 'some_concerns', 'high']
  },
  {
    id: 'rob2-d2',
    number: 2,
    title: 'Domain 2: Deviations from Intended Interventions',
    question: 'Risk of bias due to deviations from the intended interventions (effect of assignment / adherence)',
    description: 'Blinding of participants & personnel, deviations arose due to experimental context, intention-to-treat (ITT) analysis used.',
    allowedAnswers: ['low', 'some_concerns', 'high']
  },
  {
    id: 'rob2-d3',
    number: 3,
    title: 'Domain 3: Missing Outcome Data',
    question: 'Risk of bias due to missing outcome data',
    description: 'Data available for all or nearly all participants, proportions and reasons for missing data balanced.',
    allowedAnswers: ['low', 'some_concerns', 'high']
  },
  {
    id: 'rob2-d4',
    number: 4,
    title: 'Domain 4: Measurement of the Outcome',
    question: 'Risk of bias in measurement of the outcome',
    description: 'Method of measuring outcome inappropriate, outcome assessors blinded, measurement influenced by knowledge of intervention.',
    allowedAnswers: ['low', 'some_concerns', 'high']
  },
  {
    id: 'rob2-d5',
    number: 5,
    title: 'Domain 5: Selection of the Reported Result',
    question: 'Risk of bias in selection of the reported result',
    description: 'Pre-specified trial analysis plan followed, multiple outcome measurements or analyses selectively reported.',
    allowedAnswers: ['low', 'some_concerns', 'high']
  }
];

/**
 * CFIR 2.0 (Consolidated Framework for Implementation Research)
 */
export const CFIR_DOMAINS: AppraisalDomain[] = [
  {
    id: 'cfir-d1',
    number: 1,
    title: 'Domain I: Innovation Domain',
    question: 'Innovation source, evidence-base, relative advantage, adaptability, trialability, complexity, and cost',
    description: 'Key characteristics of the clinical evidence intervention being implemented.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'cfir-d2',
    number: 2,
    title: 'Domain II: Outer Setting',
    question: 'Patient/client needs, cosmopolitanism, peer pressure, external policy & incentives',
    description: 'Economic, political, and social context in which the organization resides.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'cfir-d3',
    number: 3,
    title: 'Domain III: Inner Setting',
    question: 'Structural characteristics, networks & communication, culture, climate, and readiness for implementation',
    description: 'Structural, political, and cultural context through which the implementation process proceeds.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'cfir-d4',
    number: 4,
    title: 'Domain IV: Individuals Involved',
    question: 'Roles, capability, motivation, identification with organization, and psychological safety',
    description: 'Characteristics of individuals who interact with the innovation.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'cfir-d5',
    number: 5,
    title: 'Domain V: Implementation Process',
    question: 'Planning, engaging, executing, reflecting, and evaluating',
    description: 'Activities and strategies used to implement the innovation.',
    allowedAnswers: ['yes', 'partial', 'no']
  }
];

/**
 * KTA (Knowledge-to-Action Framework - Graham et al.)
 */
export const KTA_DOMAINS: AppraisalDomain[] = [
  {
    id: 'kta-d1',
    number: 1,
    title: '1. Identify Problem & Knowledge Creation',
    question: 'Identify the evidence gap and synthesize high-grade scientific knowledge (Knowledge Funnel)',
    description: 'Synthesizing evidence and tailoring knowledge products.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'kta-d2',
    number: 2,
    title: '2. Adapt Knowledge to Local Context',
    question: 'Assess applicability and feasibility of the evidence in the local clinical environment',
    description: 'Contextual adaptation of clinical guidelines or recommendations.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'kta-d3',
    number: 3,
    title: '3. Assess Barriers & Facilitators',
    question: 'Identify provider, patient, and organizational barriers to knowledge uptake',
    description: 'Barrier analysis through surveys, interviews, and audits.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'kta-d4',
    number: 4,
    title: '4. Select & Tailor Interventions',
    question: 'Implement tailored interventions (education, electronic reminders, clinical champions)',
    description: 'Targeted change strategies matched to identified barriers.',
    allowedAnswers: ['yes', 'partial', 'no']
  },
  {
    id: 'kta-d5',
    number: 5,
    title: '5. Monitor Knowledge Use & Evaluate Outcomes',
    question: 'Track practice change, adherence, clinical outcomes, and sustainment over time',
    description: 'Quality indicators, patient health metrics, and long-term audits.',
    allowedAnswers: ['yes', 'partial', 'no']
  }
];

/**
 * JBI: Joanna Briggs Institute Critical Appraisal Tools
 * Widely used internationally and in Scandinavian health sciences, nursing, and clinical research.
 * Based on the JBI Checklist for Systematic Reviews and Research Syntheses (Aromataris et al.)
 * and Qualitative Evidence Synthesis.
 */
export const JBI_DOMAINS: AppraisalDomain[] = [
  {
    id: 'jbi-q1',
    number: 1,
    title: 'Q1: Review Question & Inclusion Criteria (PICO)',
    question: 'Is the review question clearly and explicitly stated in terms of the inclusion criteria?',
    description: 'PICO/PECO components (Population, Intervention/Exposure, Comparator, Outcomes, and Study Design) must be explicitly stated in the protocol.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Target population and setting explicitly defined',
      'Intervention/phenomenon of interest clearly stated',
      'Comparators and control conditions pre-specified',
      'Primary and secondary clinical/experiential outcomes detailed'
    ]
  },
  {
    id: 'jbi-q2',
    number: 2,
    title: 'Q2: Search Strategy & Database Adequacy',
    question: 'Were the search strategy and bibliographic sources adequate?',
    description: 'Should search multiple international databases (MEDLINE, Embase, CINAHL, Cochrane) with transparent full search strings and date limits.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Searched at least two major medical/health databases',
      'Provided full search string with Boolean operators and MeSH/Emtree terms',
      'Date restrictions justified and transparent'
    ]
  },
  {
    id: 'jbi-q3',
    number: 3,
    title: 'Q3: Comprehensive Sources & Grey Literature',
    question: 'Were the sources and resources searched comprehensively?',
    description: 'Efforts to identify unpublished studies, trial registries (ClinicalTrials.gov), grey literature (OpenGrey, Google Scholar), and reference chaining.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Trial registries searched for completed unpublished trials',
      'Grey literature, dissertations or conference proceedings screened',
      'Forward/backward citation tracking conducted'
    ]
  },
  {
    id: 'jbi-q4',
    number: 4,
    title: 'Q4: Critical Appraisal Criteria Appropriateness',
    question: 'Were the criteria for appraising studies appropriate?',
    description: 'Appropriate validated tools applied to the specific study designs (e.g., JBI, RoB 2, ROBINS-I, CASP).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Validated methodological quality checklist utilized',
      'Appraisal criteria match included study designs'
    ]
  },
  {
    id: 'jbi-q5',
    number: 5,
    title: 'Q5: Independent Dual Critical Appraisal',
    question: 'Was critical appraisal conducted by two or more reviewers independently?',
    description: 'At least two reviewers must appraise methodological quality independently, with a formal conflict resolution procedure.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Independent assessment by at least two researchers',
      'Disagreements resolved by third arbiter or consensus consensus meeting'
    ]
  },
  {
    id: 'jbi-q6',
    number: 6,
    title: 'Q6: Error Minimization in Data Extraction',
    question: 'Were there methods to minimize errors in data extraction?',
    description: 'Data extracted in duplicate with standardized, piloted extraction templates.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Standardized extraction form pre-piloted',
      'Duplicate extraction or primary extraction with formal independent audit'
    ]
  },
  {
    id: 'jbi-q7',
    number: 7,
    title: 'Q7: Methods to Combine Studies Appropriate',
    question: 'Were the methods used to combine studies appropriate?',
    description: 'Assessment of clinical/methodological heterogeneity; appropriate statistical pooling (random effects/fixed effects) or meta-synthesis/thematic analysis.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Heterogeneity evaluated statistically (I², Q test) and clinically',
      'Appropriate synthesis framework selected (e.g. Meta-analysis or JBI Qualitative Meta-aggregation)'
    ]
  },
  {
    id: 'jbi-q8',
    number: 8,
    title: 'Q8: Publication Bias Likelihood Assessed',
    question: 'Was the likelihood of publication bias assessed?',
    description: 'Funnel plots, Egger’s test, or qualitative evaluation of reporting bias across published and unpublished evidence.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Funnel plot asymmetry inspected (if >=10 studies)',
      'Statistical testing for small-study effects conducted'
    ]
  },
  {
    id: 'jbi-q9',
    number: 9,
    title: 'Q9: Policy & Practice Recommendations Supported',
    question: 'Were recommendations for policy and/or practice supported by the reported data?',
    description: 'Conclusions must be solidly grounded in the quality and strength of evidence synthesized, avoiding overstated clinical recommendations.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Recommendations explicitly linked to synthesis findings',
      'GRADE or certainty of evidence reflected in strength of recommendation'
    ]
  },
  {
    id: 'jbi-q10',
    number: 10,
    title: 'Q10: Directives for Future Research Appropriate',
    question: 'Were the specific directives for new research appropriate?',
    description: 'Evidence gaps identified and structured methodological suggestions given for future clinical trials or qualitative research.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Specific clinical/knowledge gaps delineated',
      'Methodological guidance provided for future trials'
    ]
  },
  {
    id: 'jbi-q11',
    number: 11,
    title: 'Q11: Conflict of Interest & Funding Disclosed',
    question: 'Were funding sources and competing interests declared transparently?',
    description: 'Review authors and included primary study sponsors/competing interests declared according to ICMJE standards.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Financial support and grant numbers reported',
      'Author potential commercial conflicts of interest stated'
    ]
  }
];

/**
 * JBI: Joanna Briggs Institute Critical Appraisal Checklist for Qualitative Research
 * (Lockwood, Munn & Porritt, 2015; JBI Reviewer's Manual - Qualitative Evidence Synthesis)
 * International gold standard for critical appraisal of qualitative health, clinical, and nursing research.
 */
export const JBI_QUALITATIVE_DOMAINS: AppraisalDomain[] = [
  {
    id: 'jbi-qual-q1',
    number: 1,
    title: 'Q1: Filosofisk perspektiv & metodologi (Philosophical Congruity)',
    question: 'Is there congruity between the stated philosophical perspective and the research methodology?',
    description: 'Samsvar mellom oppgitt vitenskapsteoretisk/filosofisk paradigme (f.eks. hermeneutikk, fenomenologi, grounded theory, kritisk realisme, sosialkonstruktivisme) og forskningsmetodologien.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Filosofisk paradigme og ontologisk/epistemologisk forankring er eksplisitt redegjort for',
      'Metodologiske valg begrunnes logisk i det filosofiske utgangspunktet',
      'Unngår vitenskapsteoretiske inkonsistenser (f.eks. positivistisk objektivitetskrav i fortolkende fenomenologi)'
    ]
  },
  {
    id: 'jbi-qual-q2',
    number: 2,
    title: 'Q2: Forskningsspørsmål & metodologi (Research Question Congruity)',
    question: 'Is there congruity between the research methodology and the research question or objectives?',
    description: 'Samsvar mellom metodologien og studiens formål, kvalitative problemstilling eller utforskende forskningsspørsmål.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Forskningsspørsmålet søker dybdeforståelse av opplevelser, meningsdannelse, sosiale prosesser eller kulturelle praksiser',
      'Formålet harmonerer med metodetradisjonen (f.eks. levd erfaring -> fenomenologi; prosess/teoriutvikling -> grounded theory)'
    ]
  },
  {
    id: 'jbi-qual-q3',
    number: 3,
    title: 'Q3: Datainnsamlingsmetoder & metodologi (Data Collection Congruity)',
    question: 'Is there congruity between the research methodology and the methods used to collect data?',
    description: 'Samsvar mellom metodologien og datainnsamlingsmetodene (dybdeintervjuer, fokusgrupper, deltakende observasjon, feltnotater).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Innsamlingsmetoden gir tilstrekkelig rike, nyanserte kvalitative data',
      'Intervjuguide, observasjonsprotokoll eller feltprosedyre er transparent beskrevet',
      'Vurdering av informasjonsstyrke (information power / Malterud) eller metning (saturation)'
    ]
  },
  {
    id: 'jbi-qual-q4',
    number: 4,
    title: 'Q4: Representasjon & dataanalyse (Data Representation & Analysis Congruity)',
    question: 'Is there congruity between the research methodology and the representation and analysis of data?',
    description: 'Samsvar mellom metodologien og analyseprosessen (tematisk analyse, konstant komparativ metode, fenomenologisk reduksjon/brakettering, hermeneutisk sirkel).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Transkripsjon, koding og temakonstruksjon er systematisk og stegvis dokumentert',
      'Analyseprosedyren samsvarer med oppgitt metodetradisjon',
      'Bruk av uavhengig medkoding, revisjonsspor (audit trail) eller forsker-triangulering'
    ]
  },
  {
    id: 'jbi-qual-q5',
    number: 5,
    title: 'Q5: Tolkning av resultater (Interpretation Congruity)',
    question: 'Is there congruity between the research methodology and the interpretation of results?',
    description: 'Samsvar mellom metodologien og fortolkningen av studiens funn uten uforankrede kausale generaliseringer.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Tolkningene forblir tro mot deltakernes meningshorisont og kontekst',
      'Funnene tolkes i lys av relevant teoretisk rammeverk'
    ]
  },
  {
    id: 'jbi-qual-q6',
    number: 6,
    title: 'Q6: Forskerens kulturelle/teoretiske posisjonering (Researcher Positionality)',
    question: 'Is there a statement locating the researcher culturally or theoretically?',
    description: 'Redegjørelse som plasserer forskeren teoretisk, faglig eller kulturelt, inkludert forforståelse, klinisk bakgrunn og ståsted.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Forskerens profesjon, teoretiske ståsted og forforståelse er eksplisitt deklarert',
      'Refleksjon rundt hvordan forskerens bakgrunn kan ha formet tilgang til feltet og analytiske briller'
    ]
  },
  {
    id: 'jbi-qual-q7',
    number: 7,
    title: 'Q7: Forsker-deltaker relasjon & refleksivitet (Researcher Influence & Reflexivity)',
    question: 'Is the influence of the researcher on the research, and vice-versa, addressed?',
    description: 'Kritisk refleksivitet over hvordan relasjonen mellom forsker og informanter gjensidig påvirket datagenereringen og tolkningen.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Refleksiv dagbok, feltnotater eller drøfting av maktbalanse mellom forsker og deltakere',
      'Gjensidig påvirkning under intervjusituasjonen eller observasjonen er drøftet'
    ]
  },
  {
    id: 'jbi-qual-q8',
    number: 8,
    title: 'Q8: Deltakernes stemmer & direkte sitater (Representation of Participants Voices)',
    question: 'Are participants, and their voices, adequately represented?',
    description: 'Tilstrekkelig representasjon av informantenes egne stemmer gjennom autentiske, direkte sitater (verbatim quotes) med kontekst.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Direkte, rike sitater belyser og underbygger hvert tema/kategori',
      'Sitater er merket med anonymiserte identifikatorer (f.eks. «P4, kvinne, 42 år») for å sikre bredde og unngå dominans av enkeltinformanter'
    ]
  },
  {
    id: 'jbi-qual-q9',
    number: 9,
    title: 'Q9: Forskningsetisk vurdering & godkjenning (Ethical Clearance)',
    question: 'Is the research ethical according to current criteria or, for recent studies, is there evidence of ethical approval by an appropriate body?',
    description: 'Etisk forankring, herunder godkjenning fra etisk komité (REK / Sikt i Norge, Institutional Review Board / REC internasjonalt), informert samtykke og konfidensialitet.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Formell etisk godkjenning oppgitt med saksnummer/referanse (f.eks. REK eller Sikt)',
      'Frivillig, informert skriftlig eller muntlig samtykke innhentet',
      'Dataoppbevaring, personvern og avidentifisering i henhold til gjeldende personvernforordning (GDPR)'
    ]
  },
  {
    id: 'jbi-qual-q10',
    number: 10,
    title: 'Q10: Konklusjonenes forankring i data (Conclusions Flow from Data)',
    question: 'Do the conclusions drawn in the research report flow from the analysis, or interpretation, of the data?',
    description: 'Konklusjonene og de kliniske/praktiske implikasjonene må springe logisk og forsvarlig ut fra de empiriske dataene.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Konklusjonene er solid forankret i analyseresultatene uten overilt generalisering',
      'Begrensninger, kontekstuell overførbarhet (transferability) og alternative tolkninger er drøftet'
    ]
  }
];

export const ROBINS_I_DOMAINS: AppraisalDomain[] = [
  {
    id: 'robins-i-d1',
    number: 1,
    title: 'Domene 1: Konfundering (Confounding)',
    question: 'Bias due to confounding: Ble konfunderende variabler tilstrekkelig kontrollert for i design og analyse?',
    description: 'Vurderer om prognostiske faktorer som påvirker både intervensjon/eksponering og utfall er håndtert (f.eks. matchet kohort, multivariabel regresjon, propensity score).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Viktige kjente konfundere er målt og justert for',
      'Ingen alvorlig tidsavhengig konfundering uten tilstrekkelig modellering'
    ]
  },
  {
    id: 'robins-i-d2',
    number: 2,
    title: 'Domene 2: Utvalgsskjevhet (Selection of Participants)',
    question: 'Bias in selection of participants into the study: Var utvalget representativt eller oppsto skjevhet ved rekruttering?',
    description: 'Vurderer om inklusjon var betinget av faktorer etter intervensjonsstart eller overlevelsesskjevhet (immortal time bias).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Inklusjon og eksklusjon skjedde ved baseline uavhengig av fremtidig utfall',
      'Start av oppfølging sammenfalt med eksponeringsstart'
    ]
  },
  {
    id: 'robins-i-d3',
    number: 3,
    title: 'Domene 3: Klassifisering av intervensjoner (Classification of Interventions)',
    question: 'Bias in classification of interventions: Var intervensjonsgruppene klart definert og prospektivt registrert?',
    description: 'Vurderer feilklassifisering av eksponering/behandling (misclassification bias).',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Intervensjonsstatus var entydig definert ved validerte kilder',
      'Klassifisering var ikke påvirket av kunnskap om senere utfall'
    ]
  },
  {
    id: 'robins-i-d4',
    number: 4,
    title: 'Domene 4: Avvik fra planlagt intervensjon (Deviations from Intended Interventions)',
    question: 'Bias due to deviations from intended interventions: Oppsto det systematiske avvik under oppfølging?',
    description: 'Vurderer om tilleggsbehandlinger, kryssing mellom grupper eller protokollbrudd forvrengte effektestimatet.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Eventuelle protokollavvik er dokumentert og håndtert i sensitivitetsanalyser'
    ]
  },
  {
    id: 'robins-i-d5',
    number: 5,
    title: 'Domene 5: Manglende data (Missing Data)',
    question: 'Bias due to missing data: Var frafall eller ufullstendige data minimalt eller tilstrekkelig imputert?',
    description: 'Vurderer selektivt frafall (attrition bias) og andel uobserverte utfallsmål.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Utfallsmål er tilgjengelige for nær alle inkluderte deltakere',
      'Årsaker til manglende data er likeartede i eksponerte og ueksponerte grupper'
    ]
  },
  {
    id: 'robins-i-d6',
    number: 6,
    title: 'Domene 6: Utfallsmåling (Measurement of Outcomes)',
    question: 'Bias in measurement of outcomes: Ble utfallsmålene vurdert objektivt eller blindet for eksponeringsstatus?',
    description: 'Vurderer deteksjonsskjevhet (detection bias) ved måling av endepunkter.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Utfallsvurderere var blindet for intervensjonsstatus eller utfallet var objektivt registrert (f.eks. registerdata)'
    ]
  },
  {
    id: 'robins-i-d7',
    number: 7,
    title: 'Domene 7: Selektiv rapportering (Selection of Reported Result)',
    question: 'Bias in selection of the reported result: Er alle forhåndsdefinerte analyser og utfall rapportert i sin helhet?',
    description: 'Vurderer selektiv rapportering av positive funn (reporting bias / p-hacking).',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: [
      'Analysen samsvarer med en forhåndsregistrert protokoll eller statistisk analyseplan',
      'Ingen selektiv utelatelse av ufordelaktige endepunkter eller subgrupper'
    ]
  }
];

export const PRISMA_DOMAINS: AppraisalDomain[] = [
  {
    id: 'prisma-d1',
    number: 1,
    title: 'Tittel & Sammendrag (Title & Abstract)',
    question: 'Er artikkelen identifisert som en systematisk oversikt og oppsummerer sammendraget bakgrunn, metoder, resultater og konklusjoner transparent?',
    description: 'PRISMA 2020 item 1 og 2: Identifikasjon og strukturert sammendrag.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Tittel angir systematisk oversikt eller meta-analyse', 'Strukturert sammendrag i henhold til PRISMA for Abstracts']
  },
  {
    id: 'prisma-d2',
    number: 2,
    title: 'Protokoll & Registrering (Protocol & Registration)',
    question: 'Ble en forhåndsregistrert protokoll publisert (f.eks. PROSPERO) med dokumenterte eventuelle avvik?',
    description: 'PRISMA 2020 item 24: Protokolltilgjengelighet og registreringsnummer.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['PROSPERO, OSF eller publisert protokollreferanse angitt', 'Eventuelle endringer fra protokollen er forklart']
  },
  {
    id: 'prisma-d3',
    number: 3,
    title: 'Kriterier for Inklusjon & Eksklusjon (Eligibility Criteria)',
    question: 'Er inklusjons- og eksklusjonskriterier spesifisert i henhold til PICO-rammeverket?',
    description: 'PRISMA 2020 item 5: Populasjon, intervensjon, komparator, utfall og studiedesign.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Klare eksplisitte kriterier for studiedesign og populasjon']
  },
  {
    id: 'prisma-d4',
    number: 4,
    title: 'Søkestrategi & Datakilder (Information Sources & Search)',
    question: 'Er alle datakilder og minst én komplett, reproduserbar søkestrategi presentert?',
    description: 'PRISMA 2020 item 6 og 7: Databaser, søkedatoer og full søkestreng.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Minst to vitenskapelige databaser søkt', 'Komplett reproduserbar søkestreng vedlagt']
  },
  {
    id: 'prisma-d5',
    number: 5,
    title: 'Utvelgelsesprosess (Study Selection)',
    question: 'Ble screening og inklusjon gjennomført uavhengig av minst to forskere i par?',
    description: 'PRISMA 2020 item 8: Dual screening og uenighetshåndtering.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Uavhengig dobbeltscreening av titler, sammendrag og fulltekster', 'Konsensusprosedyre beskrevet']
  },
  {
    id: 'prisma-d6',
    number: 6,
    title: 'Dataekstraksjon (Data Collection Process)',
    question: 'Ble data ekstrahert uavhengig eller med verifisering, ved hjelp av et standardisert skjema?',
    description: 'PRISMA 2020 item 9 og 10: Ekstraksjonsprosess og variabler.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Pilotert skjema for dataekstraksjon', 'Dobbeltkontroll av numeriske effektestimater']
  },
  {
    id: 'prisma-d7',
    number: 7,
    title: 'Metodisk Kvalitetsvurdering (Risk of Bias Assessment)',
    question: 'Ble metodisk kvalitet / risiko for skjevhet i inkluderte primærstudier vurdert med et validert instrument?',
    description: 'PRISMA 2020 item 11: Validerte verktøy som RoB 2, ROBINS-I eller CASP.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Validerte instrumenter benyttet', 'Vurdering utført uavhengig av to reviewere']
  },
  {
    id: 'prisma-d8',
    number: 8,
    title: 'Syntesemetoder (Synthesis Methods)',
    question: 'Er metodene for narrativ eller statistisk metaanalyse (f.eks. fiksert/tilfeldig effektmodell, I²) redegjort for?',
    description: 'PRISMA 2020 item 13: Syntesemetodikk og heterogenitetstesting.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Rasjonale for metaanalyse vs narrativ syntese', 'Undersøkelse av statistisk heterogenitet']
  },
  {
    id: 'prisma-d9',
    number: 9,
    title: 'Rapporteringsskjevhet (Reporting Biases)',
    question: 'Ble risikoen for publiseringsskjevhet eller selektiv rapportering vurdert (f.eks. traktplott / Egger-test)?',
    description: 'PRISMA 2020 item 14: Vurdering av publiseringsskjevhet.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Traktplott (funnel plot) eller metodisk begrunnelse hvis antall studier < 10']
  },
  {
    id: 'prisma-d10',
    number: 10,
    title: 'Kunnskapsgrunnlagets Sikkerhet (Certainty Assessment / GRADE)',
    question: 'Ble tilliten til kunnskapsgrunnlaget systematisk gradert (f.eks. GRADE eller CERQual)?',
    description: 'PRISMA 2020 item 15: Vurdering av evidensstyrke for nøkkelutfall.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['GRADE Summary of Findings-tabell eller eksplisitt CERQual-evaluering']
  },
  {
    id: 'prisma-d11',
    number: 11,
    title: 'Flytskjema & Studiekarakteristikker (Flow Diagram & Study Characteristics)',
    question: 'Er et komplett PRISMA-flytskjema og tabeller over inkluderte og ekskluderte studier inkludert?',
    description: 'PRISMA 2020 item 16, 17 og 18: Flytdiagram med eksklusjonsgrunner.',
    isCritical: true,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Eksklusjonsårsaker på fulltekstnivå spesifisert', 'Intervensjons- og deltakerkarakteristikker oppgitt']
  },
  {
    id: 'prisma-d12',
    number: 12,
    title: 'Finansiering & Interessekonflikter (Funding & Conflicts of Interest)',
    question: 'Er finansieringskilder og eventuelle interessekonflikter for både oversikten og primærstudiene oppgitt?',
    description: 'PRISMA 2020 item 25, 26 og 27: Transparens rundt støtte og bindinger.',
    isCritical: false,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    guidanceCriteria: ['Finansieringskildens rolle i protokoll, analyse og publisering er klarlagt', 'Forfatternes interessekonflikter deklarert']
  }
];

export function getFrameworkDomains(instrument: AppraisalInstrument): AppraisalDomain[] {
  switch (instrument) {
    case 'AMSTAR2': return AMSTAR2_DOMAINS;
    case 'CASP': return CASP_DOMAINS;
    case 'AGREE2': return AGREE2_DOMAINS;
    case 'GRADE': return GRADE_DOMAINS;
    case 'ROB2': return ROB2_DOMAINS;
    case 'CFIR': return CFIR_DOMAINS;
    case 'KTA': return KTA_DOMAINS;
    case 'JBI': return JBI_DOMAINS;
    case 'JBI_QUALITATIVE': return JBI_QUALITATIVE_DOMAINS;
    case 'ROBINS_I': return ROBINS_I_DOMAINS;
    case 'PRISMA': return PRISMA_DOMAINS;
    default: {
      console.warn(`[getFrameworkDomains] Uregistrert eller ukjent instrument: "${instrument}". Ingen standarddomener returneres for å forhindre metodisk feilevaluering.`);
      return [];
    }
  }
}
