/**
 * StudyDesignGateService
 * 
 * Metodologisk portvoktertjeneste (Gatekeeper) for kobling mellom studiedesign og
 * vurderingsinstrumenter.
 * 
 * Metodologiske kjernekrav:
 * 1. Studiedesign må komme før metodisk appraisal.
 * 2. Ingen gjetting: Ved ukjent eller uavklart studiedesign ('unknown-uncertain') gis det
 *    INGEN automatisk instrumentanbefaling (primaryInstrumentId er undefined).
 * 3. validateCompatibility() returnerer status 'UNKNOWN' når designet ikke er avklart.
 * 4. Kasus-kontroll kobles eksplisitt mot 'casp-case-control' (aldri 'casp-cohort').
 * 5. Scoping review kobles mot 'prisma-scr' (ikke generisk 'prisma-2020').
 * 6. Kvalitativ syntese kobles mot 'casp-systematic-review' som primærinstrument,
 *    med GRADE-CERQual som et alternativt certainty-framework (ikke general appraisal av review-metodikk).
 */

export type StudyDesignId =
  | 'unknown-uncertain'
  | 'qualitative'
  | 'systematic-review'
  | 'scoping-review'
  | 'qualitative-synthesis'
  | 'rct'
  | 'cohort'
  | 'case-control'
  | 'cross-sectional'
  | 'diagnostic'
  | 'guideline'
  | 'case-report'
  | 'implementation'
  | 'non-randomised-intervention';

export type CompatibilityStatus = 'COMPATIBLE' | 'PARTIAL' | 'INCOMPATIBLE' | 'UNKNOWN';

export interface AlternativeFramework {
  id: string;
  label: string;
  role?: 'appraisal_tool' | 'certainty_framework' | 'reporting_guideline';
  rationale?: string;
}

export interface StudyDesignRecommendation {
  designId: StudyDesignId;
  name: string;
  description: string;
  primaryInstrumentId?: string; // Undefined for 'unknown-uncertain'
  primaryInstrumentLabel?: string;
  rationale: string;
  reportingStandard?: string;
  alternativeFrameworks: AlternativeFramework[];
  isClarified: boolean;
}

export interface CompatibilityValidationResult {
  status: CompatibilityStatus;
  canAppraise: boolean;
  message: string;
  matchedDesign?: StudyDesignId;
  primaryInstrumentId?: string;
  alternativeInstruments: AlternativeFramework[];
}

const DESIGN_REGISTRY: Record<StudyDesignId, StudyDesignRecommendation> = {
  'unknown-uncertain': {
    designId: 'unknown-uncertain',
    name: 'Uavklart / Ukjent studiedesign (Unknown / Uncertain)',
    description: 'Studiedesignet er ennå ikke identifisert eller klassifisert i artikkelen.',
    primaryInstrumentId: undefined, // EKSPLISITT INGEN ANBEFALING
    primaryInstrumentLabel: undefined,
    rationale: 'Ingen forhåndsvalgt instrumentanbefaling. Studiedesign må avklares av forsker før metodisk appraisal kan velges for å hindre metodiske feilvalg.',
    reportingStandard: undefined,
    alternativeFrameworks: [],
    isClarified: false
  },
  'qualitative': {
    designId: 'qualitative',
    name: 'Kvalitativ forskning (intervjuer, fokusgrupper, fenomenologi, grounded theory)',
    description: 'Undersøker menneskelige erfaringer, meningsskaping, sosiale prosesser og kontekstuelle forhold.',
    primaryInstrumentId: 'jbi-qualitative',
    primaryInstrumentLabel: 'JBI Kvalitativ Vurdering (2017)',
    rationale: 'JBI Qualitative 2017 er gullstandarden for vurdering av metodisk kongruens, forskerens posisjonering, refleksivitet og etisk forankring.',
    reportingStandard: 'COREQ / SRQR',
    alternativeFrameworks: [
      { id: 'casp-qualitative', label: 'CASP Kvalitativ sjekkliste', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'systematic-review': {
    designId: 'systematic-review',
    name: 'Systematisk kunnskapsoversikt / Meta-analyse (Kvantitativ)',
    description: 'Syntetiserer systematisk kvantitativ evidens fra primærstudier etter transparent protokoll.',
    primaryInstrumentId: 'amstar-2',
    primaryInstrumentLabel: 'AMSTAR 2 (A MeaSurement Tool to Assess systematic Reviews)',
    rationale: 'AMSTAR 2 evaluerer oversikter basert på kritiske svakheter (som forhåndsregistrering, omfattende søk og risiko for skjevhet) fremfor en misvisende sumscore.',
    reportingStandard: 'PRISMA 2020',
    alternativeFrameworks: [
      { id: 'casp-systematic-review', label: 'CASP Systematic Review Checklist', role: 'appraisal_tool' },
      { id: 'robis', label: 'ROBIS (Risk of Bias in Systematic Reviews)', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'scoping-review': {
    designId: 'scoping-review',
    name: 'Scoping Review / Kunnskapskartlegging',
    description: 'Kartlegger bredden, volumet og karakteristika av kunnskapsgrunnlaget på et fagfelt.',
    primaryInstrumentId: 'prisma-scr',
    primaryInstrumentLabel: 'PRISMA-ScR (PRISMA Extension for Scoping Reviews)',
    rationale: 'Scoping reviews har andre metodiske mål enn systematiske oversikter over effekt, og skal rapporteres og evalueres mot PRISMA-ScR fremfor standard PRISMA 2020 eller AMSTAR 2.',
    reportingStandard: 'PRISMA-ScR',
    alternativeFrameworks: [
      { id: 'jbi-scoping-review', label: 'JBI Scoping Review Guidance', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'qualitative-synthesis': {
    designId: 'qualitative-synthesis',
    name: 'Kvalitativ kunnskapssyntese (Meta-syntese / Meta-etnografi)',
    description: 'Systematisk sammenstilling og re-tolkning av kvalitative primærstudier.',
    primaryInstrumentId: 'casp-systematic-review',
    primaryInstrumentLabel: 'CASP Systematic Review Checklist',
    rationale: 'Selve review-metodikken (søk, utvelgelse, dataekstraksjon) vurderes med CASP for oversiktsstudier. GRADE-CERQual fungerer som et komplementært certainty framework for tillit til individuelle syntesefunn, ikke som appraisal for selve review-prosessen.',
    reportingStandard: 'eMERGe / ENTREQ',
    alternativeFrameworks: [
      { 
        id: 'grade-cerqual', 
        label: 'GRADE-CERQual (Confidence in Evidence from Reviews of Qualitative research)', 
        role: 'certainty_framework',
        rationale: 'Tillitsgradering til de kvalitative evidensfunnene (metodiske begrensninger, sammenheng, relevans, adekvathet).'
      }
    ],
    isClarified: true
  },
  'rct': {
    designId: 'rct',
    name: 'Randomisert Kontrollert Studie (RCT)',
    description: 'Eksperimentelt design med tilfeldig fordeling til intervensjons- og kontrollgruppe.',
    primaryInstrumentId: 'cochrane-rob-2',
    primaryInstrumentLabel: 'Cochrane RoB 2 (Risk of Bias 2)',
    rationale: 'RoB 2 er gullstandarden for domene-basert vurdering av randomiseringsprosess, avvik fra tiltenkt intervensjon, manglende utfallsdata og selektiv rapportering.',
    reportingStandard: 'CONSORT 2010',
    alternativeFrameworks: [
      { id: 'casp-rct', label: 'CASP RCT Checklist', role: 'appraisal_tool' },
      { id: 'jbi-rct', label: 'JBI RCT Appraisal Tool', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'cohort': {
    designId: 'cohort',
    name: 'Observasjonsstudie - Kohortstudie (Prospective / Retrospective Cohort)',
    description: 'Følger definerte eksponerte og ueksponerte kohorter over tid for å vurdere insidens eller relativ risiko.',
    primaryInstrumentId: 'casp-cohort',
    primaryInstrumentLabel: 'CASP Kohortstudie Sjekkliste',
    rationale: 'CASP Kohort evaluerer seleksjon av kohort, eksponeringsmåling, konfundering, oppfølgingstid og utfallsklassifisering.',
    reportingStandard: 'STROBE',
    alternativeFrameworks: [
      { id: 'newcastle-ottawa-cohort', label: 'Newcastle-Ottawa Scale (NOS) for Cohort', role: 'appraisal_tool' },
      { id: 'robins-i', label: 'ROBINS-I (dersom intervensjonseffekt evalueres)', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'case-control': {
    designId: 'case-control',
    name: 'Kasus-kontrollstudie (Case-Control Study)',
    description: 'Sammenligner tidligere eksponering hos personer med en tilstand (kasus) mot kontroller uten tilstanden.',
    primaryInstrumentId: 'casp-case-control',
    primaryInstrumentLabel: 'CASP Kasus-kontroll Sjekkliste',
    rationale: 'Kasus-kontrollstudier har spesifikke metodiske utfordringer (recall bias, seleksjon av kontrollgruppe) som må vurderes med et dedikert kasus-kontrollverktøy, aldri et kohortverktøy.',
    reportingStandard: 'STROBE',
    alternativeFrameworks: [
      { id: 'newcastle-ottawa-case-control', label: 'Newcastle-Ottawa Scale (NOS) for Case-Control', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'cross-sectional': {
    designId: 'cross-sectional',
    name: 'Tverrsnittsstudie / Prevalensstudie (Cross-Sectional Study)',
    description: 'Måler eksponering og utfall samtidig på et gitt tidspunkt i en definert populasjon.',
    primaryInstrumentId: 'jbi-cross-sectional',
    primaryInstrumentLabel: 'JBI Critical Appraisal Checklist for Analytical Cross Sectional Studies',
    rationale: 'JBI tverrsnittssjekkliste vurderer inklusjonskriterier, studiedeltakere, kontekstbeskrivelse, konfundere og statistisk analyse.',
    reportingStandard: 'STROBE',
    alternativeFrameworks: [
      { id: 'axotheca-appraisal', label: 'AXIS Tool for Cross-Sectional Studies', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'diagnostic': {
    designId: 'diagnostic',
    name: 'Diagnostisk Nøyaktighetsstudie (Diagnostic Accuracy Study)',
    description: 'Undersøker sensitivitet, spesifisitet og prediktiv verdi for en test mot definert gullstandard.',
    primaryInstrumentId: 'quadas-2',
    primaryInstrumentLabel: 'QUADAS-2 (Quality Assessment of Diagnostic Accuracy Studies)',
    rationale: 'QUADAS-2 er gullstandarden for vurdering av pasientseleksjon, indekssjekk, referansestandard, flyt og timing.',
    reportingStandard: 'STARD 2015',
    alternativeFrameworks: [
      { id: 'casp-diagnostic', label: 'CASP Diagnostisk Test Sjekkliste', role: 'appraisal_tool' }
    ],
    isClarified: true
  },
  'guideline': {
    designId: 'guideline',
    name: 'Klinisk Retningslinje / Faglige Anbefalinger (Clinical Practice Guideline)',
    description: 'Systematisk utviklede faglige råd for å veilede kliniske beslutninger.',
    primaryInstrumentId: 'agree-ii',
    primaryInstrumentLabel: 'AGREE II (Advancing Guideline Development, Reporting and Evaluation in HEALTH)',
    rationale: 'AGREE II er det internasjonale standardinstrumentet for evaluering av retningslinjers metodiske strenghet, transparens, uavhengighet og kliniske anvendbarhet.',
    reportingStandard: 'RIGHT / AGREE-S',
    alternativeFrameworks: [
      { id: 'agree-rex', label: 'AGREE-REX (Recommendation Excellence)', role: 'certainty_framework' }
    ],
    isClarified: true
  },
  'case-report': {
    designId: 'case-report',
    name: 'Kasusrapport / Kasusserie (Case Report / Series)',
    description: 'Klinisk beskrivelse av enkelttilfeller eller serier med uvanlige tilstander eller behandlingsforløp.',
    primaryInstrumentId: 'jbi-case-report',
    primaryInstrumentLabel: 'JBI Critical Appraisal Checklist for Case Reports',
    rationale: 'JBI for kasusrapporter sikrer systematisk vurdering av pasientdemografi, anamnese, diagnostiske tester og utfall.',
    reportingStandard: 'CARE',
    alternativeFrameworks: [],
    isClarified: true
  },
  'implementation': {
    designId: 'implementation',
    name: 'Implementeringsforskning & Tjenesteinnovasjon',
    description: 'Studerer determinanter for implementering, organisatorisk endring og kunnskapstranslasjon i helsetjenesten.',
    primaryInstrumentId: 'cfir-2',
    primaryInstrumentLabel: 'CFIR 2.0 (Consolidated Framework for Implementation Research)',
    rationale: 'CFIR strukturerer evalueringen i fem domener (innovasjon, ytre kontekst, indre kontekst, individer og prosess).',
    reportingStandard: 'StaRI / SQUIRE 2.0',
    alternativeFrameworks: [
      { id: 'kta-framework', label: 'KTA (Knowledge-to-Action) Action Cycle', role: 'certainty_framework' }
    ],
    isClarified: true
  },
  'non-randomised-intervention': {
    designId: 'non-randomised-intervention',
    name: 'Ikke-randomisert intervensjonsstudie (Quasi-experimental / NRS)',
    description: 'Intervensjonsstudie uten formell randomisering til kontrollgrupper.',
    primaryInstrumentId: 'robins-i',
    primaryInstrumentLabel: 'ROBINS-I (Risk Of Bias In Non-randomized Studies - of Interventions)',
    rationale: 'ROBINS-I evaluerer systematisk konfundering, seleksjonsskjevhet, klassifiseringsfeil og manglende data ved manglende randomisering.',
    reportingStandard: 'TREND / STROBE',
    alternativeFrameworks: [
      { id: 'jbi-quasi-experimental', label: 'JBI Quasi-Experimental Appraisal Tool', role: 'appraisal_tool' }
    ],
    isClarified: true
  }
};

export class StudyDesignGateService {
  /**
   * Normaliserer en vilkårlig designstreng til en autoritativ StudyDesignId.
   */
  public static normalizeDesignString(designId: string | undefined | null): StudyDesignId {
    return this.getDesignRecommendation(designId).designId;
  }

  /**
   * Henter metodisk anbefaling for et spesifikt studiedesign.
   */
  public static getDesignRecommendation(designId: string | undefined | null): StudyDesignRecommendation {
    if (!designId || designId.trim() === '' || designId === 'unknown' || designId === 'Unspecified / Unknown') {
      return DESIGN_REGISTRY['unknown-uncertain'];
    }

    const normalized = designId.toLowerCase().trim().replace(/_/g, '-');
    if (normalized in DESIGN_REGISTRY) {
      return DESIGN_REGISTRY[normalized as StudyDesignId];
    }

    // Heuristisk normalisering
    if (normalized.includes('case-control') || normalized.includes('kasus-kontroll')) {
      return DESIGN_REGISTRY['case-control'];
    }
    if (normalized.includes('scoping')) {
      return DESIGN_REGISTRY['scoping-review'];
    }
    if (normalized.includes('qualitative-synthesis') || normalized.includes('meta-synthesis') || normalized.includes('kvalitativ-syntese')) {
      return DESIGN_REGISTRY['qualitative-synthesis'];
    }
    if (normalized.includes('rct') || normalized.includes('randomized')) {
      return DESIGN_REGISTRY['rct'];
    }
    if (normalized.includes('systematic') || normalized.includes('meta-analysis')) {
      return DESIGN_REGISTRY['systematic-review'];
    }
    if (normalized.includes('qualitative')) {
      return DESIGN_REGISTRY['qualitative'];
    }
    if (normalized.includes('cohort') || normalized.includes('kohort')) {
      return DESIGN_REGISTRY['cohort'];
    }
    if (normalized.includes('guideline') || normalized.includes('retningslinje')) {
      return DESIGN_REGISTRY['guideline'];
    }
    if (normalized.includes('diagnostic')) {
      return DESIGN_REGISTRY['diagnostic'];
    }

    return DESIGN_REGISTRY['unknown-uncertain'];
  }

  /**
   * Returnerer alle registrerte studiedesign.
   */
  public static getAllDesignRecommendations(): StudyDesignRecommendation[] {
    return Object.values(DESIGN_REGISTRY);
  }

  /**
   * Validerer metodisk kompatibilitet mellom et studiedesign og et appraisal-instrument.
   * 
   * KANONISK REGEL:
   * Dersom studiedesignet er ukjent, uavklart eller mangler, returneres status 'UNKNOWN'
   * i stedet for et konkret instrument eller falsk godkjenning.
   */
  public static validateCompatibility(
    designId: string | undefined | null,
    instrumentId: string | undefined | null
  ): CompatibilityValidationResult {
    const recommendation = this.getDesignRecommendation(designId);

    // KANONISK REGEL 1: Ukjent / uavklart design
    if (!recommendation.isClarified || recommendation.designId === 'unknown-uncertain') {
      return {
        status: 'UNKNOWN',
        canAppraise: false,
        message: 'Studiedesign er uavklart eller ukjent. Ingen automatisk instrumentanbefaling kan gis før designet er klassifisert av forsker for å hindre metodiske feilvalg.',
        matchedDesign: 'unknown-uncertain',
        primaryInstrumentId: undefined,
        alternativeInstruments: []
      };
    }

    if (!instrumentId) {
      return {
        status: 'INCOMPATIBLE',
        canAppraise: false,
        message: 'Intet appraisal-instrument er angitt.',
        matchedDesign: recommendation.designId,
        primaryInstrumentId: recommendation.primaryInstrumentId,
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    const normInst = instrumentId.toLowerCase().replace(/[_\s]/g, '-');
    const normPrimary = (recommendation.primaryInstrumentId || '').toLowerCase().replace(/[_\s]/g, '-');

    // KANONISK REGEL 2: Kasus-kontroll MÅ IKKE bruke kohort-verktøy
    if (recommendation.designId === 'case-control' && normInst.includes('cohort')) {
      return {
        status: 'INCOMPATIBLE',
        canAppraise: false,
        message: 'Metodisk avvik: Kasus-kontrollstudier kan ikke vurderes med kohort-sjekkliste (f.eks. casp-cohort). Bruk casp-case-control.',
        matchedDesign: 'case-control',
        primaryInstrumentId: recommendation.primaryInstrumentId,
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    // KANONISK REGEL 3: Scoping review MÅ bruke prisma-scr fremfor generisk prisma-2020
    if (recommendation.designId === 'scoping-review' && (normInst === 'prisma' || normInst === 'prisma-2020')) {
      return {
        status: 'PARTIAL',
        canAppraise: true,
        message: 'Delvis kompatibel: Scoping reviews bør evalueres mot den dedikerte PRISMA-ScR utvidelsen fremfor standard PRISMA 2020.',
        matchedDesign: 'scoping-review',
        primaryInstrumentId: 'prisma-scr',
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    // KANONISK REGEL 4: Kvalitativ syntese: GRADE-CERQual er certainty framework, ikke review appraisal
    if (recommendation.designId === 'qualitative-synthesis' && (normInst.includes('cerqual') || normInst.includes('grade'))) {
      return {
        status: 'PARTIAL',
        canAppraise: true,
        message: 'Merknad: GRADE-CERQual er et tillitsgraderingsrammeverk (certainty of qualitative findings), ikke et primært metodisk appraisal-verktøy for selve review-prosessen. Bruk CASP Systematic Review som primær appraisal.',
        matchedDesign: 'qualitative-synthesis',
        primaryInstrumentId: 'casp-systematic-review',
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    // Eksakt eller primærmatch
    if (normInst === normPrimary || normInst.includes(normPrimary) || normPrimary.includes(normInst)) {
      return {
        status: 'COMPATIBLE',
        canAppraise: true,
        message: `Metodisk match: ${recommendation.primaryInstrumentLabel} er gullstandarden for ${recommendation.name}.`,
        matchedDesign: recommendation.designId,
        primaryInstrumentId: recommendation.primaryInstrumentId,
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    // Alternativ match
    const isAlt = recommendation.alternativeFrameworks.some(alt => {
      const normAlt = alt.id.toLowerCase().replace(/[_\s]/g, '-');
      return normInst === normAlt || normInst.includes(normAlt) || normAlt.includes(normInst);
    });

    if (isAlt) {
      return {
        status: 'PARTIAL',
        canAppraise: true,
        message: `Akseptabelt alternativ: Instrumentet er et anerkjent alternativ for ${recommendation.name}.`,
        matchedDesign: recommendation.designId,
        primaryInstrumentId: recommendation.primaryInstrumentId,
        alternativeInstruments: recommendation.alternativeFrameworks
      };
    }

    // Inkompatibel
    return {
      status: 'INCOMPATIBLE',
      canAppraise: false,
      message: `Metodisk advarsel: "${instrumentId}" er ikke standard eller anbefalt for ${recommendation.name}. Anbefalt instrument er ${recommendation.primaryInstrumentLabel || 'ikke fastsatt'}.`,
      matchedDesign: recommendation.designId,
      primaryInstrumentId: recommendation.primaryInstrumentId,
      alternativeInstruments: recommendation.alternativeFrameworks
    };
  }
}
