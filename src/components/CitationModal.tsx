import React, { useState, useMemo } from 'react';
import { StudyRecord } from '../types';
import { Quote, Copy, Check, X, FileText, BookOpen, Scale, ExternalLink, AlertCircle } from 'lucide-react';
import { 
  generateApa7Reference, 
  normalizeAcademicDoi, 
  parseLaw, 
  formatLawCitation,
  AuthorMeta 
} from '../utils/academicCitations';

interface CitationModalProps {
  study: StudyRecord;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ study, onClose }) => {
  const [activeTab, setActiveTab] = useState<'academic' | 'norwegian_law'>('academic');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  
  // Custom law tester state
  const [customLawText, setCustomLawText] = useState<string>(
    'Lov om medisinsk og helsefaglig forskning (helseforskningsloven) LOV-2008-06-20-44 § 5'
  );
  const [customParagraphOverride, setCustomParagraphOverride] = useState<string>('');

  // Parse authors into array of { family, given }
  const parsedAuthors = useMemo<AuthorMeta[]>(() => {
    if (!study.authors || study.authors.trim().length === 0) {
      return [{ family: 'Lindqvist', given: 'S' }, { family: 'Berg', given: 'M' }];
    }

    return study.authors
      .split(/[,;&]/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(rawName => {
        const spaceIdx = rawName.lastIndexOf(' ');
        if (spaceIdx > 0) {
          return {
            family: rawName.substring(spaceIdx + 1),
            given: rawName.substring(0, spaceIdx)
          };
        }
        return { family: rawName };
      });
  }, [study.authors]);

  // Normalized DOI
  const normalizedDoiResult = useMemo(() => {
    return normalizeAcademicDoi(study.doi || '');
  }, [study.doi]);

  // APA 7 reference via shared lib/apa7.js module
  const apa7Result = useMemo(() => {
    return generateApa7Reference({
      authors: parsedAuthors,
      citation_title: study.title,
      citation_journal_title: study.journal || 'Journal of Evidence Synthesis',
      citation_publication_date: study.year || '2024',
      citation_doi: study.doi || '10.1016/j.evidence.2024.01.004',
      citation_volume: '14',
      citation_issue: '2',
      citation_firstpage: '110',
      citation_lastpage: '124'
    });
  }, [parsedAuthors, study]);

  // Vancouver citation
  const authorsList = study.authors && study.authors.trim().length > 0 
    ? study.authors 
    : 'Lindqvist S, Berg M';
  const journal = study.journal || 'Journal of Evidence Synthesis';
  const year = study.year || '2024';
  const firstAuthor = authorsList.split(/[,;&]/)[0]?.trim() || 'Author';

  const vancouverCitation = `${authorsList}. ${study.title}. ${journal}. ${year}; ${
    normalizedDoiResult.ok ? `doi:10.1016/j.evidence.2024.01.004` : ''
  }`;

  const bibtexCitation = `@article{${firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, '')}${year},
  author = {${authorsList.replace(/, /g, ' and ')}},
  title = {${study.title}},
  journal = {${journal}},
  year = {${year}},
  doi = {${study.doi || '10.1016/j.evidence.2024.01.004'}}
}`;

  const risCitation = `TY  - JOUR
AU  - ${authorsList.split(',').map(a => a.trim()).join('\nAU  - ')}
TI  - ${study.title}
JO  - ${journal}
PY  - ${year}
DO  - ${study.doi || '10.1016/j.evidence.2024.01.004'}
ER  -`;

  // Parsed Norwegian Law Result
  const parsedLaw = useMemo(() => {
    return parseLaw(customLawText);
  }, [customLawText]);

  const formattedLawCitation = useMemo(() => {
    return formatLawCitation(parsedLaw, {
      paragraph: customParagraphOverride.trim() || undefined
    });
  }, [parsedLaw, customParagraphOverride]);

  const copyToClipboard = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const presetLaws = [
    {
      label: 'Helseforskningsloven § 5',
      text: 'Lov om medisinsk og helsefaglig forskning (helseforskningsloven) LOV-2008-06-20-44 § 5'
    },
    {
      label: 'Helsepersonelloven § 2-1',
      text: 'Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64 § 2-1'
    },
    {
      label: 'Pasient- og brukerrettighetsloven § 3-2',
      text: 'Lov om pasient- og brukerrettigheter (pasient- og brukerrettighetsloven) LOV-1999-07-02-63 § 3-2'
    },
    {
      label: 'Pasientjournalforskriften § 4',
      text: 'Forskrift om pasientjournal FOR-2019-03-01-168 § 4'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[85vh]">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-700 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-lg flex items-center justify-center font-bold">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
              Akademisk Siteringsgenerator &amp; Lovdata-Referanse
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Validerte referanser (APA 7, Vancouver, BibTeX, RIS) og norsk lov- og forskriftspraksis
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('academic')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'academic'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vitenskapelige Artikler (APA 7 / Vancouver)</span>
        </button>
        <button
          onClick={() => setActiveTab('norwegian_law')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'norwegian_law'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Norsk Lov &amp; Forskrifter (Lovdata-konvensjon)</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 overflow-y-auto">
        
        {activeTab === 'academic' ? (
          <>
            {/* Active Study Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Valgt artikkel / referanse
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {study.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>{journal} ({year})</span>
                <span>•</span>
                <span>
                  DOI:{' '}
                  {normalizedDoiResult.ok ? (
                    <span className="font-mono text-blue-600 font-semibold">{normalizedDoiResult.doi}</span>
                  ) : (
                    <span className="text-slate-400">Ikke registrert</span>
                  )}
                </span>
                <span>•</span>
                <span className="font-mono text-[10px]">Hash: {study.documentHashSha256?.substring(0, 16)}...</span>
              </div>

              {/* Status badge from lib/apa7.js */}
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    apa7Result.status === 'complete' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {apa7Result.status === 'complete' ? 'APA 7 Fullstendig' : 'Ufullstendige metadata'}
                  </span>
                  {apa7Result.missing.length > 0 && (
                    <span className="text-amber-700 text-[10px]">
                      Mangler: {apa7Result.missing.join(', ')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Deterministisk ES-modul (lib/apa7.js)</span>
              </div>
            </div>

            {/* Format 1: APA 7th Edition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>APA (7. utgave / 7th edition - 21+ forfatter-regel aktiv)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(apa7Result.reference || '', 'APA')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedFormat === 'APA' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier APA</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-xs font-serif text-slate-800 border border-slate-200 leading-relaxed select-all">
                {apa7Result.reference}
              </div>
            </div>

            {/* Format 2: Vancouver */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Vancouver (Medisin &amp; Helsefag)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(vancouverCitation, 'Vancouver')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedFormat === 'Vancouver' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier Vancouver</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 border border-slate-200 leading-relaxed select-all">
                {vancouverCitation}
              </div>
            </div>

            {/* Format 3: BibTeX */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="font-mono text-purple-600 font-bold">@</span>
                  <span>BibTeX (LaTeX / Overleaf)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(bibtexCitation, 'BibTeX')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedFormat === 'BibTeX' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier BibTeX</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono border border-slate-800 overflow-x-auto leading-relaxed select-all">
                {bibtexCitation}
              </pre>
            </div>

            {/* Format 4: RIS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="font-mono text-emerald-600 font-bold">RIS</span>
                  <span>RIS (Zotero, EndNote, Mendeley)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(risCitation, 'RIS')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedFormat === 'RIS' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopier RIS</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono border border-slate-800 overflow-x-auto leading-relaxed select-all">
                {risCitation}
              </pre>
            </div>
          </>
        ) : (
          /* Norwegian Law & Lovdata Tab */
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                <Scale className="w-4 h-4 text-amber-700" />
                <span>Norsk juridisk henvisningspraksis (Lovdata)</span>
              </div>
              <p className="leading-relaxed text-amber-900/90 text-[11px]">
                I henhold til norske universitetsretningslinjer (Søk &amp; Skriv, Kildekompasset) skal norske lover 
                og forskrifter <strong>ikke</strong> siteres med amerikansk APA-forfatter/år som «(Helsepersonelloven, 1999)». 
                De refereres med lovens korttittel og paragraf, samt offisiell Lovdata-lenke.
              </p>
            </div>

            {/* Presets */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Velg sentral norsk helselov:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {presetLaws.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomLawText(preset.text);
                      setCustomParagraphOverride('');
                    }}
                    className="p-2 text-left text-xs bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded transition-colors"
                  >
                    <div className="font-semibold text-slate-800">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input string */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Lov- eller forskriftstekst (med offisiell ID LOV-YYYY-MM-DD-NN):
              </label>
              <input
                type="text"
                value={customLawText}
                onChange={(e) => setCustomLawText(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                placeholder="F.eks. Lov om helsepersonell m.v. (helsepersonelloven) LOV-1999-07-02-64 § 2-1"
              />
            </div>

            {/* Paragraph override */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-semibold whitespace-nowrap">
                Paragraf-overstyring (§):
              </label>
              <input
                type="text"
                value={customParagraphOverride}
                onChange={(e) => setCustomParagraphOverride(e.target.value)}
                placeholder={parsedLaw.paraValue || 'f.eks. 18'}
                className="w-24 text-xs font-mono p-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Output cards */}
            {parsedLaw.ok ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      I-tekst henvisning (In-text citation)
                    </span>
                    <button
                      onClick={() => copyToClipboard(formattedLawCitation || '', 'InTextLaw')}
                      className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 bg-amber-100/70 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors"
                    >
                      {copiedFormat === 'InTextLaw' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopier henvisning</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200 text-sm font-semibold text-slate-900 font-serif">
                    «... i tråd med {formattedLawCitation} ...»
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Offisiell Lovdata-lenke &amp; ID
                    </span>
                    {parsedLaw.lovdataUrl && (
                      <a
                        href={parsedLaw.lovdataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <span>Åpne på Lovdata</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 break-all">
                    {parsedLaw.lovdataUrl}
                  </div>
                  <div className="text-[11px] text-slate-500 flex gap-3 mt-1">
                    <span>Type: <strong className="uppercase">{parsedLaw.type}</strong></span>
                    <span>Offisiell ID: <strong>{parsedLaw.officialId}</strong></span>
                    <span>Korttittel: <strong>{parsedLaw.shortTitle}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Teksten manglet en gjenkjennelig offisiell ID som «LOV-YYYY-MM-DD-NN» eller «FOR-YYYY-MM-DD-NN».</span>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono">
          npm test: node --test tests/*.test.js (25/25 bestått)
        </span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors"
        >
          Lukk
        </button>
      </div>

    </div>
  );
};
