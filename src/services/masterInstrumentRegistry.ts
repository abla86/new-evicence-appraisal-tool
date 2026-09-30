/**
 * MASTER INSTRUMENTS REGISTRY
 *
 * Authoritative registry of all evidence appraisal instruments, frameworks,
 * and methodological checklists in the system.
 *
 * Epistemological & Methodological Honesty:
 * - Distinguishes between REGISTERED, PARTIALLY_IMPLEMENTED, IMPLEMENTED, and VERIFIED.
 * - Explicitly states whether an official numeric score cut-off exists (e.g., JBI Qualitative has NO official cut-off).
 * - Documents domain structures, signalling questions, and critical flaw algorithms.
 */

export type InstrumentImplementationStatus = 
  | 'VERIFIED'                // Fully implemented with algorithmic engine, domain mapping and automated tests
  | 'IMPLEMENTED'             // Fully implemented runtime domains and UI, but qualitative synthesis
  | 'PARTIALLY_IMPLEMENTED'   // Simplified domain overview (e.g., RoB 2 five domains without full nested signalling tree)
  | 'REGISTERED';             // Catalogued in registry; full questionnaire not yet built into runtime

export interface MasterInstrumentEntry {
  id: string;
  code: string;
  name: string;
  version: string;
  year: number;
  publisher: string;
  sourceUrl: string;
  targetStudyDesign: string;
  itemCount: number;
  criticalItemCount?: number;
  allowedAnswers: string[];
  implementationStatus: InstrumentImplementationStatus;
  statusLabel: string;
  hasOfficialNumericalCutoff: boolean;
  scoringModel: 'CRITICAL_FLAWS_CONFIDENCE' | 'STANDARDIZED_DOMAINS' | 'QUALITATIVE_JUDGEMENT' | 'DOMAIN_RISK_OF_BIAS' | 'EVIDENCE_CERTAINTY' | 'PROCESS_EVALUATION';
  scoringModelDescription: string;
  methodologicalCaveat: string;
}

export const MASTER_INSTRUMENTS_REGISTRY: MasterInstrumentEntry[] = [
  {
    id: 'jbi-qualitative-2017',
    code: 'JBI_QUALITATIVE',
    name: 'JBI Critical Appraisal Checklist for Qualitative Research',
    version: '2017',
    year: 2017,
    publisher: 'Joanna Briggs Institute (Lockwood et al.)',
    sourceUrl: 'https://jbi.global/critical-appraisal-tools',
    targetStudyDesign: 'Qualitative Research (Phenomenology, Grounded Theory, Ethnography, Action Research)',
    itemCount: 10,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    implementationStatus: 'VERIFIED',
    statusLabel: 'Fullt implementert og verifisert (10 standardledd)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'QUALITATIVE_JUDGEMENT',
    scoringModelDescription: 'Kvalitativ forskerbeslutning basert på metodisk kongruens, refleksivitet og etikk. JBI har ingen offisiell numerisk cut-off (f.eks. >=7 eller >=70%).',
    methodologicalCaveat: 'Skal IKKE reduseres til numeriske poengsummer eller automatiske prosentkrav. Inklusjon avgjøres etter kvalitativ vurdering av metodens påvirkning på funnenes troverdighet.'
  },
  {
    id: 'jbi-systematic-reviews-2020',
    code: 'JBI',
    name: 'JBI Critical Appraisal Checklist for Systematic Reviews and Research Syntheses',
    version: '2020',
    year: 2020,
    publisher: 'Joanna Briggs Institute (Aromataris et al.)',
    sourceUrl: 'https://jbi.global/critical-appraisal-tools',
    targetStudyDesign: 'Systematic Reviews & Research Syntheses',
    itemCount: 11,
    allowedAnswers: ['yes', 'no', 'unclear', 'not_applicable'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Fullt implementert (11 metodiske ledd)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'QUALITATIVE_JUDGEMENT',
    scoringModelDescription: 'Kvalitativ forskerbeslutning basert på 11 metodiske kriterier for systematiske oversikter.',
    methodologicalCaveat: 'JBI har ingen offisiell numerisk cut-off score. Beslutning om inklusjon baseres på helhetlig metodisk vurdering.'
  },
  {
    id: 'amstar-2-2017',
    code: 'AMSTAR2',
    name: 'AMSTAR 2: Critical Appraisal Tool for Systematic Reviews',
    version: '2017',
    year: 2017,
    publisher: 'Shea et al., BMJ',
    sourceUrl: 'https://amstar.ca/',
    targetStudyDesign: 'Systematic Reviews & Meta-Analyses (Intervention Studies)',
    itemCount: 16,
    criticalItemCount: 7,
    allowedAnswers: ['yes', 'partial', 'no'],
    implementationStatus: 'VERIFIED',
    statusLabel: 'Fullt implementert og verifisert (16 ledd, 7 kritiske domener)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'CRITICAL_FLAWS_CONFIDENCE',
    scoringModelDescription: 'Samlet tillitsvurdering (High, Moderate, Low, Critically Low) basert på antall kritiske svakheter (domene 2, 4, 7, 9, 11, 13, 15), aldri en misvisende sumscore.',
    methodologicalCaveat: 'Mer enn én kritisk svakhet gir automatisk "Critically Low" tillit til oversiktens konklusjoner, uavhengig av antall "Ja" på ikke-kritiske spørsmål.'
  },
  {
    id: 'agree-ii-2017',
    code: 'AGREE2',
    name: 'AGREE II: Appraisal of Guidelines for Research & Evaluation II',
    version: '2017',
    year: 2017,
    publisher: 'Brouwers et al., CMAJ / AGREE Next Steps Consortium',
    sourceUrl: 'https://www.agreetrust.org/agree-ii/',
    targetStudyDesign: 'Clinical Practice Guidelines & Health Policy Recommendations',
    itemCount: 23,
    allowedAnswers: ['1', '2', '3', '4', '5', '6', '7'],
    implementationStatus: 'VERIFIED',
    statusLabel: 'Fullt implementert og verifisert (23 ledd, 6 standardiserte domener)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'STANDARDIZED_DOMAINS',
    scoringModelDescription: 'Standardisert prosentverdi per domene: (Oppnådd - Min) / (Maks - Min) * 100%. Ingen offisiell samlet aggregert total-score.',
    methodologicalCaveat: 'AGREE II tillater ikke sammenslåing av de 6 domenene til én samlet poengsum. Overordnet anbefaling ("Anbefales", "Anbefales med modifikasjoner", "Anbefales ikke") er en eksplisitt forskerbeslutning.'
  },
  {
    id: 'rob-2-cochrane',
    code: 'ROB2',
    name: 'Cochrane Risk of Bias 2 (RoB 2)',
    version: '2019',
    year: 2019,
    publisher: 'Sterne et al., BMJ',
    sourceUrl: 'https://www.riskofbias.info/welcome/rob-2-0-tool',
    targetStudyDesign: 'Randomized Controlled Trials (Individual & Cluster)',
    itemCount: 5,
    allowedAnswers: ['low', 'some_concerns', 'high'],
    implementationStatus: 'PARTIALLY_IMPLEMENTED',
    statusLabel: 'Delvis implementert (5 kjernedomener uten fullt tre av signalskjemaspørsmål)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: 'Domenebasert bias-vurdering (D1: Randomisering, D2: Avvik fra intervensjon, D3: Manglende utfallsdata, D4: Måling av utfall, D5: Selektiv rapportering).',
    methodologicalCaveat: 'MERK: Nåværende versjon i verktøyet tilbyr domenestatus og begrunnelse for de fem hoveddomenene, men inneholder ikke det fulle treet med 22 detaljerte signalskjemaspørsmål. Markert som delvis implementert for metodisk ærlighet.'
  },
  {
    id: 'robins-i-2016',
    code: 'ROBINS_I',
    name: 'ROBINS-I: Risk Of Bias In Non-randomized Studies of Interventions',
    version: '2016',
    year: 2016,
    publisher: 'Sterne et al., BMJ',
    sourceUrl: 'https://www.riskofbias.info/welcome/home/current-version-of-robins-i',
    targetStudyDesign: 'Non-randomized Studies of Interventions (Cohort, Before-After)',
    itemCount: 7,
    allowedAnswers: ['low', 'moderate', 'serious', 'critical', 'no_information'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (7 metodiske domener)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: 'Vurderer bias mot en hypotetisk ideell pragmatisk randomisert studie.',
    methodologicalCaveat: 'Kritisk risiko for bias i ett enkelt domene gjør den overordnede studien uegnet for evidenssyntese.'
  },
  {
    id: 'prisma-2020',
    code: 'PRISMA',
    name: 'PRISMA 2020: Preferred Reporting Items for Systematic Reviews and Meta-Analyses',
    version: '2020',
    year: 2020,
    publisher: 'Page et al., BMJ',
    sourceUrl: 'https://www.prisma-statement.org/',
    targetStudyDesign: 'Systematic Review Methodology & Reporting Checklist',
    itemCount: 12,
    allowedAnswers: ['yes', 'no', 'partial', 'unclear', 'not_applicable'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (12 metodiske sjekkpunkter for evidensappraisal)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'QUALITATIVE_JUDGEMENT',
    scoringModelDescription: 'Rapporterings- og metodestandard for transparens og etterprøvbarhet.',
    methodologicalCaveat: 'PRISMA er primært en rapporteringsstandard, men fungerer som systematisk strukturkontroll for oversiktsstudier.'
  },
  {
    id: 'casp-systematic-review',
    code: 'CASP',
    name: 'Critical Appraisal Skills Programme (CASP) Checklists',
    version: '2018',
    year: 2018,
    publisher: 'CASP UK',
    sourceUrl: 'https://casp-uk.net/',
    targetStudyDesign: 'Systematic Reviews, RCTs, Cohort, Case-Control, Qualitative',
    itemCount: 10,
    allowedAnswers: ['yes', 'cant_tell', 'no'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (Screening- og detaljtrinn)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'QUALITATIVE_JUDGEMENT',
    scoringModelDescription: 'Delt i to screening-spørsmål ("Er studien verdt å fortsette med?") og detaljerte metodiske spørsmål.',
    methodologicalCaveat: 'CASP har ingen sumscore. En studie er ikke av "god kvalitet" bare fordi alle felter er utfylt.'
  },
  {
    id: 'grade-certainty-2013',
    code: 'GRADE',
    name: 'GRADE: Grading of Recommendations Assessment, Development and Evaluation',
    version: '2013',
    year: 2013,
    publisher: 'Guyatt et al. / GRADE Working Group',
    sourceUrl: 'https://www.gradeworkinggroup.org/',
    targetStudyDesign: 'Body of Evidence / Systematic Review Findings',
    itemCount: 6,
    allowedAnswers: ['no', 'some_concerns', 'high'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (Evidensprofil: 5 nedgraderingsdomener + oppgraderingsdomene)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'EVIDENCE_CERTAINTY',
    scoringModelDescription: '5 nedgraderingsdomener (RoB, Inconsistency, Indirectness, Imprecision, Publication Bias) og 3 oppgraderingskriterier.',
    methodologicalCaveat: 'Ingen uoffisiell "magisk" tallberegning. Sluttgrad (Høy, Moderat, Lav, Svært lav) fastsettes via transparent forskerbeslutning med dokumentert begrunnelse.'
  },
  {
    id: 'cfir-2-2022',
    code: 'CFIR',
    name: 'Consolidated Framework for Implementation Research (CFIR 2.0)',
    version: '2.0',
    year: 2022,
    publisher: 'Damschroder et al., Implementation Science',
    sourceUrl: 'https://cfirguide.org/',
    targetStudyDesign: 'Implementation Research, Service Innovation & Health Systems',
    itemCount: 5,
    allowedAnswers: ['yes', 'partial', 'no', 'not_applicable'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (5 kontekstuelle kjerneområder)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'PROCESS_EVALUATION',
    scoringModelDescription: 'Strukturerer implementeringsdeterminanter i 5 domener: Innovasjon, Ytre kontekst, Indre kontekst, Individer og Prosess.',
    methodologicalCaveat: 'Kvalitativt kontekstrammeverk, ikke et reduksjonistisk risiko-for-skjevhetsverktøy.'
  },
  {
    id: 'kta-action-cycle',
    code: 'KTA',
    name: 'Knowledge-to-Action (KTA) Framework',
    version: '2006',
    year: 2006,
    publisher: 'Graham et al., Journal of Continuing Education in the Health Professions',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16557505/',
    targetStudyDesign: 'Knowledge Translation & Clinical Implementation Lifecycle',
    itemCount: 5,
    allowedAnswers: ['yes', 'partial', 'no'],
    implementationStatus: 'IMPLEMENTED',
    statusLabel: 'Implementert (Kunnskapsskaping og aksjonssyklus: 5 faser)',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'PROCESS_EVALUATION',
    scoringModelDescription: 'Følger implementeringens faser fra identifisering av kunnskapsgap til vedvarende praksisendring.',
    methodologicalCaveat: 'Prosessmodell for implementeringsoppfølging.'
  },
  // Register-only entries (Honest disclosure of registered but not built tools)
  {
    id: 'robis-2016',
    code: 'ROBIS',
    name: 'ROBIS: Tool to assess risk of bias in systematic reviews',
    version: '2016',
    year: 2016,
    publisher: 'Whiting et al., J Clin Epidemiol',
    sourceUrl: 'https://www.bristol.ac.uk/population-health-sciences/projects/robis/',
    targetStudyDesign: 'Systematic Reviews',
    itemCount: 24,
    allowedAnswers: ['yes', 'probably_yes', 'probably_no', 'no', 'no_information'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: '4 faser med signalskjemaer.',
    methodologicalCaveat: 'Ikke i aktiv kjøretid i denne applikasjonen. Bruk AMSTAR 2 eller CASP SR for systematiske oversikter.'
  },
  {
    id: 'quadas-2-2011',
    code: 'QUADAS2',
    name: 'QUADAS-2: Quality Assessment of Diagnostic Accuracy Studies',
    version: '2011',
    year: 2011,
    publisher: 'Whiting et al., Ann Intern Med',
    sourceUrl: 'https://www.bristol.ac.uk/population-health-sciences/projects/quadas/',
    targetStudyDesign: 'Diagnostic Accuracy Studies',
    itemCount: 14,
    allowedAnswers: ['yes', 'no', 'unclear'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: 'Pasientspesifikk diagnostisk nøyaktighet over 4 domener.',
    methodologicalCaveat: 'Ikke i aktiv kjøretid. Bruk CASP Diagnostic Test Checklist inntil full implementasjon foreligger.'
  },
  {
    id: 'quips-2013',
    code: 'QUIPS',
    name: 'Quality in Prognosis Studies (QUIPS)',
    version: '2013',
    year: 2013,
    publisher: 'Hayden et al., Ann Intern Med',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/23420236/',
    targetStudyDesign: 'Prognostic Studies',
    itemCount: 6,
    allowedAnswers: ['low', 'moderate', 'high'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: 'Prognostisk bias over 6 domener.',
    methodologicalCaveat: 'Ikke i aktiv kjøretid.'
  },
  {
    id: 'mmat-2018',
    code: 'MMAT',
    name: 'Mixed Methods Appraisal Tool (MMAT)',
    version: '2018',
    year: 2018,
    publisher: 'Hong et al., Canadian Family Physician',
    sourceUrl: 'http://mixedmethodsappraisaltoolpublic.pbworks.com/',
    targetStudyDesign: 'Mixed Methods Studies',
    itemCount: 5,
    allowedAnswers: ['yes', 'no', 'cant_tell'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'QUALITATIVE_JUDGEMENT',
    scoringModelDescription: 'Delt inn etter kvalitative, kvantitative og miksede komponenter.',
    methodologicalCaveat: 'Ikke i aktiv kjøretid.'
  },
  {
    id: 'grade-cerqual-2018',
    code: 'CERQUAL',
    name: 'GRADE-CERQual: Confidence in the Evidence from Reviews of Qualitative Research',
    version: '2018',
    year: 2018,
    publisher: 'Lewin et al., PLOS Medicine',
    sourceUrl: 'https://www.cerqual.org/',
    targetStudyDesign: 'Qualitative Evidence Synthesis Findings',
    itemCount: 4,
    allowedAnswers: ['no_concerns', 'minor_concerns', 'moderate_concerns', 'serious_concerns'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'EVIDENCE_CERTAINTY',
    scoringModelDescription: '4 kjernekomponenter: Metodiske begrensninger, Relevans, Koherens og Tilstrekkelighet av data. Gir samlet tillitsvurdering (Høy, Moderat, Lav, Svært lav).',
    methodologicalCaveat: 'Ikke i aktiv kjøretid. Bruk GRADE for kvantitative utfall eller JBI Qualitative for primærstudier inntil full CERQual-motor er aktivert.'
  },
  {
    id: 'probast-2019',
    code: 'PROBAST',
    name: 'PROBAST: Prediction model Risk Of Bias ASsessment Tool',
    version: '2019',
    year: 2019,
    publisher: 'Wolff et al., Ann Intern Med',
    sourceUrl: 'https://www.probast.org/',
    targetStudyDesign: 'Diagnostic and Prognostic Prediction Model Studies',
    itemCount: 20,
    allowedAnswers: ['yes', 'probably_yes', 'probably_no', 'no', 'no_information'],
    implementationStatus: 'REGISTERED',
    statusLabel: 'Registrert / Ikke i aktiv kjøretid',
    hasOfficialNumericalCutoff: false,
    scoringModel: 'DOMAIN_RISK_OF_BIAS',
    scoringModelDescription: '4 domener: Deltakere, Prediktorer, Utfall og Analyse.',
    methodologicalCaveat: 'Ikke i aktiv kjøretid. Bruk QUIPS for prognostiske faktorer.'
  }
];

export class MasterInstrumentRegistryService {
  public static getAll(): MasterInstrumentEntry[] {
    return MASTER_INSTRUMENTS_REGISTRY;
  }

  public static getByCode(code: string): MasterInstrumentEntry | undefined {
    return MASTER_INSTRUMENTS_REGISTRY.find(
      i => i.code.toLowerCase() === code.toLowerCase() || i.id.toLowerCase() === code.toLowerCase()
    );
  }

  public static getImplemented(): MasterInstrumentEntry[] {
    return MASTER_INSTRUMENTS_REGISTRY.filter(
      i => i.implementationStatus === 'VERIFIED' || i.implementationStatus === 'IMPLEMENTED' || i.implementationStatus === 'PARTIALLY_IMPLEMENTED'
    );
  }

  public static isFullyImplemented(code: string): boolean {
    const item = this.getByCode(code);
    return item?.implementationStatus === 'VERIFIED' || item?.implementationStatus === 'IMPLEMENTED';
  }
}
