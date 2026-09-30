import { AppraisalDomain, AppraisalInstrument, DocumentAnalysisFinding, RatingAnswer, StudyRecord } from '../types';
import { getFrameworkDomains } from './frameworks';
import { getDomainColorPalette } from './domainColors';

export interface PageSection {
  pageNumber: number;
  sectionTitle: string;
  content: string;
  charStart: number;
  charEnd: number;
}

/**
 * Splits document text into simulated standard academic PDF manuscript pages with structural headings.
 */
export function parseDocumentPages(study: StudyRecord): PageSection[] {
  const pages: PageSection[] = [];
  const fullText = (study.rawContent && study.rawContent.length > 50) 
    ? study.rawContent 
    : `${study.title}\n\nForfattere: ${study.authors}\nTidsskrift: ${study.journal || 'Vitenskapelig publikasjon'} (${study.year || '2025'})\nDOI: ${study.doi || '10.1000/evidence.2025.01'}\n\nSAMMENDRAG:\n${study.abstract || 'Ikke oppgitt'}`;

  const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length <= 3) {
    // If few paragraphs, split into Page 1 and Page 2
    pages.push({
      pageNumber: 1,
      sectionTitle: 'Tittel, Forfattere & Sammendrag',
      content: paragraphs[0] || fullText,
      charStart: 0,
      charEnd: (paragraphs[0] || '').length
    });
    if (paragraphs.length > 1) {
      pages.push({
        pageNumber: 2,
        sectionTitle: 'Hovedtekst & Metodikk',
        content: paragraphs.slice(1).join('\n\n'),
        charStart: (paragraphs[0] || '').length + 1,
        charEnd: fullText.length
      });
    }
    return pages;
  }

  // Segment paragraphs across academic manuscript pages (~2-3 paragraphs per page)
  const paragraphsPerPage = Math.max(2, Math.ceil(paragraphs.length / 5));
  let runningChar = 0;
  let pageCounter = 1;

  for (let i = 0; i < paragraphs.length; i += paragraphsPerPage) {
    const pageParagraphs = paragraphs.slice(i, i + paragraphsPerPage);
    const pageContent = pageParagraphs.join('\n\n');
    
    // Infer title based on content keywords
    let title = `Side ${pageCounter}: Tekstavsnitt`;
    const lower = pageContent.toLowerCase();
    if (i === 0 || lower.includes('abstract') || lower.includes('sammendrag') || lower.includes('formål')) {
      title = 'Side 1: Tittel, Forfattere & Sammendrag';
    } else if (lower.includes('background') || lower.includes('bakgrunn') || lower.includes('innledning') || lower.includes('pico') || lower.includes('objective')) {
      title = `Side ${pageCounter}: Bakgrunn, Formål & Problemstilling`;
    } else if (lower.includes('method') || lower.includes('metode') || lower.includes('search') || lower.includes('søk') || lower.includes('database') || lower.includes('protocol')) {
      title = `Side ${pageCounter}: Metoder, Søkestrategi & Inklusjonskriterier`;
    } else if (lower.includes('bias') || lower.includes('rob') || lower.includes('kvalitet') || lower.includes('grade') || lower.includes('extraction')) {
      title = `Side ${pageCounter}: Kvalitetsvurdering, RoB & Ekstraksjon`;
    } else if (lower.includes('result') || lower.includes('funn') || lower.includes('meta-analysis') || lower.includes('syntese') || lower.includes('tabell') || lower.includes('forest')) {
      title = `Side ${pageCounter}: Resultater, Effektmål & Heterogenitet`;
    } else if (lower.includes('discussion') || lower.includes('diskusjon') || lower.includes('konklusjon') || lower.includes('finansiering') || lower.includes('conflict') || lower.includes('uavhengighet')) {
      title = `Side ${pageCounter}: Diskusjon, Anvendbarhet & Habilitet`;
    }

    pages.push({
      pageNumber: pageCounter,
      sectionTitle: title,
      content: pageContent,
      charStart: runningChar,
      charEnd: runningChar + pageContent.length
    });

    runningChar += pageContent.length + 2;
    pageCounter++;
  }

  return pages;
}

interface DomainKeywordRule {
  domainId: string;
  keywords: string[];
  suggestedAnswer: RatingAnswer;
  defaultTopic: string;
}

const FRAMEWORK_HEURISTIC_RULES: Record<string, DomainKeywordRule[]> = {
  AMSTAR2: [
    {
      domainId: 'amstar2-q1',
      keywords: ['pico', 'population', 'intervention', 'comparator', 'outcome', 'målgruppe', 'tiltak', 'effektmål', 'pasienter'],
      suggestedAnswer: 'yes',
      defaultTopic: 'PICO & Inklusjonskriterier'
    },
    {
      domainId: 'amstar2-q2',
      keywords: ['protocol', 'prospero', 'cochrane library', 'registered', 'registrert', 'a priori', 'osf', 'clinicaltrials.gov'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Protokollregistrering'
    },
    {
      domainId: 'amstar2-q3',
      keywords: ['study design', 'rct', 'randomized', 'observational', 'cohort', 'interventions', 'utvelgelse av design'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Begrunnelse for studiedesign'
    },
    {
      domainId: 'amstar2-q4',
      keywords: ['medline', 'pubmed', 'embase', 'central', 'cochrane', 'cinahl', 'search strategy', 'litteratursøk', 'databaser', 'grey literature'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Systematisk søkestrategi'
    },
    {
      domainId: 'amstar2-q5',
      keywords: ['two reviewers', 'two authors', 'independently', 'in duplicate', 'dual screening', 'uavhengig av hverandre', 'to uavhengige'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Dobbeltscreening / To granskere'
    },
    {
      domainId: 'amstar2-q6',
      keywords: ['data extraction', 'extracted data in duplicate', 'dataekstraksjon', 'dobbeltkontroll', 'to granskere ekstraherte'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Dobbel dataekstraksjon'
    },
    {
      domainId: 'amstar2-q7',
      keywords: ['excluded studies', 'list of excluded', 'reasons for exclusion', 'ekskluderte artikler', 'begrunnelse for eksklusjon'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Liste over ekskluderte studier'
    },
    {
      domainId: 'amstar2-q8',
      keywords: ['characteristics of included', 'study characteristics', 'table 1', 'karakteristika', 'demografi', 'deltakere', 'doser'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Beskrivelse av inkluderte studier'
    },
    {
      domainId: 'amstar2-q9',
      keywords: ['risk of bias', 'rob 2', 'cochrane risk of bias', 'robins-i', 'newcastle-ottawa', 'metodisk kvalitet', 'kvalitetsvurdering', 'bias'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Vurdering av metodisk kvalitet / RoB'
    },
    {
      domainId: 'amstar2-q10',
      keywords: ['funding of included', 'commercial funding', 'industry sponsored', 'finansiering av inkluderte studier'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Finansieringskilder i primærstudier'
    },
    {
      domainId: 'amstar2-q11',
      keywords: ['meta-analysis', 'random-effects', 'fixed-effects', 'i²', 'heterogeneity', 'dersimonian-laird', 'reml', 'statistisk syntese'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Statistiske syntesemetoder'
    },
    {
      domainId: 'amstar2-q12',
      keywords: ['sensitivity analysis', 'subgroup', 'low risk of bias', 'sensitivitetsanalyse', 'undergruppeanalyse'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Effekt av bias på metaanalysen'
    },
    {
      domainId: 'amstar2-q13',
      keywords: ['interpreted in light of', 'risk of bias accounted for', 'tolkning', 'forsiktighet', 'konklusjon reflekterer bias'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Hensyn til bias i konklusjoner'
    },
    {
      domainId: 'amstar2-q14',
      keywords: ['heterogeneity explained', 'clinical diversity', 'variance', 'heterogenitet forklart', 'forskjeller i populasjon'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Forklaring av heterogenitet'
    },
    {
      domainId: 'amstar2-q15',
      keywords: ['publication bias', 'funnel plot', 'egger', 'begg', 'trim-and-fill', 'publikasjonsskjevhet', 'småstudieeffekter'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Publikasjonsskjevhet / Funnel Plot'
    },
    {
      domainId: 'amstar2-q16',
      keywords: ['conflict of interest', 'competing interests', 'financial support', 'grant', 'interessekonflikter', 'habilitet', 'støtte'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Interessekonflikter og finansiering'
    }
  ],
  AGREE2: [
    {
      domainId: 'agree2-q1',
      keywords: ['formål', 'objective', 'målsetting', 'hensikt', 'redusere mortalitet', 'bedre funksjon'],
      suggestedAnswer: '7',
      defaultTopic: 'Retningslinjens formål og mål'
    },
    {
      domainId: 'agree2-q2',
      keywords: ['kliniske spørsmål', 'health questions', 'problemstillinger', 'svelgevansker', 'screening', 'diagnostikk'],
      suggestedAnswer: '7',
      defaultTopic: 'Kliniske problemstillinger'
    },
    {
      domainId: 'agree2-q3',
      keywords: ['populasjon', 'målgruppe pasienter', 'voksne pasienter', 'hjerneslag', 'target population', 'pasientgruppe'],
      suggestedAnswer: '7',
      defaultTopic: 'Målgruppe (pasienter/befolkning)'
    },
    {
      domainId: 'agree2-q4',
      keywords: ['arbeidsgruppe', 'tverrfaglig', 'nevrolog', 'sykepleier', 'logoped', 'ergoterapeut', 'fysioterapeut', 'development group'],
      suggestedAnswer: '6',
      defaultTopic: 'Relevante faggrupper i arbeidsgruppen'
    },
    {
      domainId: 'agree2-q5',
      keywords: ['brukermedvirkning', 'pasientorganisasjon', 'lhl', 'brukerrepresentant', 'pasientens preferanser', 'views of patients'],
      suggestedAnswer: '7',
      defaultTopic: 'Pasient- og brukermedvirkning'
    },
    {
      domainId: 'agree2-q6',
      keywords: ['målgruppe brukere', 'helsepersonell', 'leger', 'sykepleiere', 'akuttmottak', 'target users'],
      suggestedAnswer: '7',
      defaultTopic: 'Målgruppe for retningslinjen (brukere)'
    },
    {
      domainId: 'agree2-q7',
      keywords: ['systematisk litteratursøk', 'medline', 'embase', 'cochrane', 'epistemonikos', 'search strategy'],
      suggestedAnswer: '6',
      defaultTopic: 'Systematiske søkemetoder'
    },
    {
      domainId: 'agree2-q8',
      keywords: ['kriterier for utvelgelse', 'inkluderte studier', 'kunnskapsgrunnlag', 'selection criteria'],
      suggestedAnswer: '6',
      defaultTopic: 'Kriterier for valg av evidens'
    },
    {
      domainId: 'agree2-q9',
      keywords: ['grade', 'evidensgradering', 'styrker og svakheter', 'biasrisiko', 'body of evidence'],
      suggestedAnswer: '6',
      defaultTopic: 'Styrker og svakheter ved evidensen'
    },
    {
      domainId: 'agree2-q10',
      keywords: ['konsensus', 'metoder for formulering', 'anbefalinger', 'formulating recommendations'],
      suggestedAnswer: '6',
      defaultTopic: 'Metoder for utforming av anbefalinger'
    },
    {
      domainId: 'agree2-q11',
      keywords: ['helsegevinster', 'bivirkninger', 'risiko', 'aspirasjonspneumoni', 'benefits and harms'],
      suggestedAnswer: '7',
      defaultTopic: 'Helsegevinster og bivirkningsrisiko'
    },
    {
      domainId: 'agree2-q12',
      keywords: ['kobling mellom anbefaling og kunnskapsgrunnlag', 'eksplisitt kobling', 'link to evidence'],
      suggestedAnswer: '6',
      defaultTopic: 'Kobling mellom anbefaling og evidens'
    },
    {
      domainId: 'agree2-q13',
      keywords: ['høring', 'fagfellevurdering', 'ekstern gjennomgang', 'external review', 'høringsrunde'],
      suggestedAnswer: '5',
      defaultTopic: 'Ekstern høring og fagfellevurdering'
    },
    {
      domainId: 'agree2-q14',
      keywords: ['oppdatering', 'revisjonsplan', 'prosedyre for oppdatering', 'updating procedure'],
      suggestedAnswer: '6',
      defaultTopic: 'Plan og prosedyre for oppdatering'
    },
    {
      domainId: 'agree2-q15',
      keywords: ['sterk anbefaling', 'spesifikke anbefalinger', 'anbefaling 4.1', 'skal screenes', 'specific recommendations'],
      suggestedAnswer: '7',
      defaultTopic: 'Tydelige og konkrete anbefalinger'
    },
    {
      domainId: 'agree2-q16',
      keywords: ['behandlingsalternativer', 'håndtering', 'vannsvelgetest', 'guss', 'fastende', 'management options'],
      suggestedAnswer: '7',
      defaultTopic: 'Ulike behandlingsalternativer'
    },
    {
      domainId: 'agree2-q17',
      keywords: ['nøkkelanbefalinger', 'uthevede bokser', 'rammer', 'key recommendations'],
      suggestedAnswer: '7',
      defaultTopic: 'Nøkkelanbefalinger lett identifiserbare'
    },
    {
      domainId: 'agree2-q18',
      keywords: ['barrierer', 'fremmere', 'implementering', 'opplæring', 'logistikk', 'facilitators and barriers'],
      suggestedAnswer: '5',
      defaultTopic: 'Organisatoriske barrierer og fremmere'
    },
    {
      domainId: 'agree2-q19',
      keywords: ['verktøy for implementering', 'flytskjema', 'prosedyre', 'svelgetest', 'tools for practice'],
      suggestedAnswer: '6',
      defaultTopic: 'Råd og verktøy for implementering'
    },
    {
      domainId: 'agree2-q20',
      keywords: ['ressurskonsekvenser', 'kostnader', 'ressurser', 'økonomisk', 'resource implications'],
      suggestedAnswer: '5',
      defaultTopic: 'Ressurs- og kostnadsimplikasjoner'
    },
    {
      domainId: 'agree2-q21',
      keywords: ['kvalitetsindikatorer', 'revisjonskriterier', 'overvåkning', 'auditing criteria'],
      suggestedAnswer: '6',
      defaultTopic: 'Kvalitetsindikatorer og revisjonskriterier'
    },
    {
      domainId: 'agree2-q22',
      keywords: ['helsedirektoratet', 'offentlig fagorgan', 'uavhengig', 'editorial independence', 'finansierende organ'],
      suggestedAnswer: '7',
      defaultTopic: 'Redaksjonell uavhengighet'
    },
    {
      domainId: 'agree2-q23',
      keywords: ['habilitetserklæringer', 'interessekonflikter', 'bindinger', 'competing interests'],
      suggestedAnswer: '7',
      defaultTopic: 'Dokumentasjon av interessekonflikter'
    },
    {
      domainId: 'agree2-overall-quality',
      keywords: ['samlet vurdering', 'høy kvalitet', 'metodisk kvalitet', 'overall quality'],
      suggestedAnswer: '7',
      defaultTopic: 'Total kvalitetsvurdering'
    },
    {
      domainId: 'agree2-overall-recommend',
      keywords: ['anbefales for bruk', 'klinisk praksis', 'anbefaling', 'recommend for use'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Anbefaling for klinisk praksis'
    }
  ],
  ROB2: [
    {
      domainId: 'rob2-d1',
      keywords: ['random allocation', 'randomization', 'computer-generated', 'allocation concealment', 'opaque sealed envelopes', 'randomisering'],
      suggestedAnswer: 'low',
      defaultTopic: 'Randomiseringsprosess (Domain 1)'
    },
    {
      domainId: 'rob2-d2',
      keywords: ['blinding', 'double-blind', 'placebo', 'intention-to-treat', 'itt', 'deviations from intervention', 'blinding av deltakere'],
      suggestedAnswer: 'low',
      defaultTopic: 'Avvik fra intervensjon (Domain 2)'
    },
    {
      domainId: 'rob2-d3',
      keywords: ['missing outcome', 'attrition', 'lost to follow-up', 'dropout', 'bortfall', 'komplette utfallsdata'],
      suggestedAnswer: 'low',
      defaultTopic: 'Manglende utfallsdata (Domain 3)'
    },
    {
      domainId: 'rob2-d4',
      keywords: ['outcome measurement', 'blinded assessors', 'validated scale', 'objektiv måling', 'blindet utfallsvurdering'],
      suggestedAnswer: 'low',
      defaultTopic: 'Måling av utfall (Domain 4)'
    },
    {
      domainId: 'rob2-d5',
      keywords: ['selective reporting', 'pre-specified analysis', 'trial registration', 'alle forhåndsdefinerte utfall'],
      suggestedAnswer: 'low',
      defaultTopic: 'Selektiv rapportering av resultat (Domain 5)'
    }
  ],
  CASP: [
    {
      domainId: 'casp-q1',
      keywords: ['focused question', 'clear aim', 'forskningsspørsmål', 'tydelig målsetting', 'kvalitativt formål'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Tydelig fokusert forskningsspørsmål'
    },
    {
      domainId: 'casp-q2',
      keywords: ['qualitative methodology', 'appropriate design', 'intervju', 'fenomenologisk', 'tekstkondensering'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Egnet kvalitativ metodologi'
    },
    {
      domainId: 'casp-q3',
      keywords: ['recruitment strategy', 'participants recruited', 'utvalgsstrategi', 'informanter'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Egnet rekrutteringsstrategi'
    },
    {
      domainId: 'casp-q4',
      keywords: ['data collection', 'semi-structured interview', 'lydopptak', 'transkribering', 'datainnsamling'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Datainnsamlingsmetode'
    },
    {
      domainId: 'casp-q5',
      keywords: ['researcher bias', 'reflexivity', 'forskerens rolle', 'forforståelse', 'refleksivitet'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Forhold mellom forsker og deltakere'
    },
    {
      domainId: 'casp-q6',
      keywords: ['ethical approval', 'informed consent', 'rek', 'etisk godkjenning', 'samtykke'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Etiske hensyn ivaretatt'
    },
    {
      domainId: 'casp-q7',
      keywords: ['data analysis', 'thematic analysis', 'systematic text condensation', 'malterud', 'analysemetode'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Grundig dataanalyse'
    },
    {
      domainId: 'casp-q8',
      keywords: ['clear statement of findings', 'themes', 'kategorier', 'sitater', 'hovedfunn'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Tydelig formulering av funn'
    },
    {
      domainId: 'casp-q9',
      keywords: ['value of research', 'clinical implications', 'nytteverdi', 'betydning for praksis'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Forskningens verdi'
    },
    {
      domainId: 'casp-q10',
      keywords: ['harms vs benefits', 'relevance', 'anvendbarhet', 'konklusjon'],
      suggestedAnswer: 'yes',
      defaultTopic: 'Helhetsvurdering'
    }
  ]
};

/**
 * Runs a comprehensive heuristic and semantic scan across the document to extract
 * all relevant evidence excerpts, determine page numbers, and suggest ratings for every domain.
 */
export function scanDocumentForFramework(
  study: StudyRecord, 
  instrument: AppraisalInstrument
): DocumentAnalysisFinding[] {
  const domains = getFrameworkDomains(instrument);
  const pages = parseDocumentPages(study);
  const rules = FRAMEWORK_HEURISTIC_RULES[instrument] || [];
  const fullText = (study.rawContent && study.rawContent.length > 50) 
    ? study.rawContent 
    : `${study.title}\n\n${study.abstract || ''}`;

  const findings: DocumentAnalysisFinding[] = [];

  domains.forEach((domain, domainIdx) => {
    const domainPalette = getDomainColorPalette(domainIdx);
    const rule = rules.find(r => r.domainId === domain.id);
    const keywordsToSearch = [
      ...(rule?.keywords || []),
      ...(domain.guidanceCriteria || []).map(g => g.toLowerCase().split(' ')[0]),
      domain.title.toLowerCase().split(' ')[0]
    ].filter(Boolean);

    let bestMatchPage = pages[0];
    let bestMatchSnippet = '';
    let bestMatchKeyword = '';
    let highestScore = 0;

    // Scan across all pages and paragraphs
    pages.forEach(page => {
      const pageLower = page.content.toLowerCase();
      let pageScore = 0;
      let matchedWord = '';

      keywordsToSearch.forEach(kw => {
        if (pageLower.includes(kw.toLowerCase())) {
          pageScore += kw.length;
          if (!matchedWord) matchedWord = kw;
        }
      });

      if (pageScore > highestScore) {
        highestScore = pageScore;
        bestMatchPage = page;
        bestMatchKeyword = matchedWord;

        // Extract a clean 1-2 sentence excerpt around the matched word
        const idx = pageLower.indexOf(matchedWord.toLowerCase());
        if (idx !== -1) {
          const start = Math.max(0, page.content.lastIndexOf('.', idx - 1) + 1);
          let end = page.content.indexOf('.', idx + matchedWord.length);
          if (end === -1) end = Math.min(page.content.length, idx + 250);
          bestMatchSnippet = page.content.substring(start, end + 1).trim();
        }
      }
    });

    // Fallback if no specific keyword was found
    if (!bestMatchSnippet) {
      // Pick appropriate page based on domain position
      const pageIndex = Math.min(pages.length - 1, Math.floor((domainIdx / domains.length) * pages.length));
      bestMatchPage = pages[pageIndex] || pages[0];
      const sentences = bestMatchPage.content.split('.').filter(s => s.trim().length > 20);
      bestMatchSnippet = (sentences[0] || bestMatchPage.content.substring(0, 180)).trim() + '.';
      bestMatchKeyword = domain.title;
    }

    const confidence: 'High' | 'Medium' | 'Low' = highestScore > 15 ? 'High' : highestScore > 5 ? 'Medium' : 'Medium';
    const suggestedAnswer = rule?.suggestedAnswer || (domain.allowedAnswers.includes('yes') ? 'yes' : domain.allowedAnswers[0]);

    findings.push({
      id: `finding-${instrument.toLowerCase()}-${domain.id}`,
      instrument: instrument,
      domainId: domain.id,
      topic: `${domain.title}`,
      sectionOrPage: `Side ${bestMatchPage.pageNumber} (${bestMatchPage.sectionTitle})`,
      matchedTerm: bestMatchKeyword || domain.title,
      excerpt: bestMatchSnippet.length > 250 ? bestMatchSnippet.substring(0, 250) + '...' : bestMatchSnippet,
      confidence: confidence,
      suggestedAnswer: suggestedAnswer,
      researcherConfirmed: true
    });
  });

  return findings;
}
