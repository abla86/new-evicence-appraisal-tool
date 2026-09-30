import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Sliders, 
  Sparkles, 
  Plus, 
  Check, 
  Copy, 
  Download, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  History,
  FileText,
  ExternalLink,
  Filter
} from 'lucide-react';
import { 
  PICOData, 
  ResearchProject, 
  ResearchSearchResult, 
  SavedSearchStrategy, 
  SourceRecord, 
  ReferenceItem 
} from '../types';
import { calculateSha256, generateSecureId } from '../utils/crypto';
import { buildSourceRecord } from '../services/sourceRecordService';

interface ResearchSearchHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
  references: ReferenceItem[];
  sourceRecords: SourceRecord[];
  onImportToSourceRecords: (record: SourceRecord) => void;
  onImportToReferenceHub: (ref: ReferenceItem) => void;
}

export const ResearchSearchHubModal: React.FC<ResearchSearchHubModalProps> = ({
  isOpen,
  onClose,
  project,
  references,
  sourceRecords,
  onImportToSourceRecords,
  onImportToReferenceHub
}) => {
  const [selectedDatabase, setSelectedDatabase] = useState<'ALL' | 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'CrossRef'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYearFrom, setFilterYearFrom] = useState('2018');
  const [filterYearTo, setFilterYearTo] = useState('2026');
  const [filterStudyDesign, setFilterStudyDesign] = useState<string>('ALL');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ResearchSearchResult[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<SavedSearchStrategy[]>([
    {
      id: 'strat-1',
      name: 'Primærsøk: Eldre og fysisk aktivitet',
      database: 'PubMed',
      query: '("elderly"[tiab] OR "older adults"[tiab]) AND ("physical activity"[tiab] OR "exercise"[tiab]) AND ("systematic review"[pt] OR "qualitative"[tiab])',
      hitsCount: 142,
      executedAt: '2026-03-01T10:00:00Z',
      picoContext: {
        population: 'Hjemmeboende eldre over 65 år',
        intervention: 'Styrke- og balansetrening',
        comparator: 'Standard oppfølging / inaktivitet',
        outcome: 'Livskvalitet og funksjonell mobilitet'
      }
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Bygg PICO-søkestreng automatisk
  const handleBuildPicoSearch = () => {
    const p = project.protocol.pico.population ? `(${project.protocol.pico.population.split(/;|,/).map(s => `"${s.trim()}"`).join(' OR ')})` : '';
    const i = project.protocol.pico.intervention ? `(${project.protocol.pico.intervention.split(/;|,/).map(s => `"${s.trim()}"`).join(' OR ')})` : '';
    const c = project.protocol.pico.comparator ? `(${project.protocol.pico.comparator.split(/;|,/).map(s => `"${s.trim()}"`).join(' OR ')})` : '';
    const o = project.protocol.pico.outcomes ? `(${project.protocol.pico.outcomes.split(/;|,/).map(s => `"${s.trim()}"`).join(' OR ')})` : '';

    const parts = [p, i, c, o].filter(Boolean);
    const combined = parts.join(' AND ');
    setSearchQuery(combined || '("qualitative research"[Mesh] OR "interviews"[tiab]) AND ("clinical practice"[tiab])');
  };

  // Kjør søk (med pre-screenet duplikatstatus mot eksisterende poster)
  const handleExecuteSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      // Simulerer realistisk henting fra forskningsdatabaser med akademisk metadata
      const mockHits: ResearchSearchResult[] = [
        {
          id: `search-res-${Date.now()}-1`,
          database: 'PubMed',
          title: 'Older adults experiences with community-based group exercise: A systematic qualitative synthesis',
          authors: ['Dahl, Ingrid', 'Solberg, Terje', 'Bakke, Marie'],
          year: '2024',
          journal: 'BMC Geriatrics',
          doi: '10.1186/s12877-024-04812-3',
          pmid: '38341901',
          abstract: 'Background: Exercise interventions are critical to preserve functional independence in older age. Objective: To synthesize qualitative studies exploring how community-dwelling older adults perceive motivation, social cohesion, and retention in exercise groups.',
          studyDesignSuggested: 'Qualitative Systematic Review / JBI Synthesis',
          alreadyInLibrary: references.some(r => r.doi === '10.1186/s12877-024-04812-3'),
          alreadyInSourceRecords: sourceRecords.some(s => s.doi === '10.1186/s12877-024-04812-3'),
          imported: false
        },
        {
          id: `search-res-${Date.now()}-2`,
          database: 'Europe PMC',
          title: 'Feasibility and participant adherence in digitally supervised home rehabilitation: Qualitative interviews',
          authors: ['Larsen, Jonas', 'Hansen, Erik'],
          year: '2023',
          journal: 'Journal of Medical Internet Research',
          doi: '10.2196/45120',
          pmid: '37210982',
          abstract: 'Methods: Semi-structured interviews with 24 participants undergoing home-based tele-rehabilitation. Findings indicate themes around technological confidence, autonomy, and the value of asynchronous physiotherapist feedback.',
          studyDesignSuggested: 'Qualitative Empirical Study',
          alreadyInLibrary: references.some(r => r.doi === '10.2196/45120'),
          alreadyInSourceRecords: sourceRecords.some(s => s.doi === '10.2196/45120'),
          imported: false
        },
        {
          id: `search-res-${Date.now()}-3`,
          database: 'OpenAlex',
          title: 'Interprofessional collaboration in post-stroke transitional care: A phenomenological study',
          authors: ['Nilsson, Annika', 'Berg, Carina', 'Lindqvist, Sarah'],
          year: '2023',
          journal: 'International Journal of Qualitative Studies on Health and Well-being',
          doi: '10.1080/17482631.2023.2190112',
          abstract: 'Exploring healthcare professional lived experiences during acute to primary care transitions. Three main themes were uncovered: fragmented information pathways, role ambiguity, and relational trust.',
          studyDesignSuggested: 'Qualitative Empirical Study (Phenomenology)',
          alreadyInLibrary: references.some(r => r.doi === '10.1080/17482631.2023.2190112'),
          alreadyInSourceRecords: sourceRecords.some(s => s.doi === '10.1080/17482631.2023.2190112'),
          imported: false
        }
      ];

      setSearchResults(mockHits);
      setIsSearching(false);

      // Lagre i søkestrategier
      const newStrategy: SavedSearchStrategy = {
        id: `strat-${Date.now()}`,
        name: searchQuery.substring(0, 45) || 'Fritekstsøk',
        database: selectedDatabase,
        query: searchQuery,
        hitsCount: mockHits.length,
        executedAt: new Date().toISOString(),
        picoContext: {
          population: project.protocol.pico.population,
          intervention: project.protocol.pico.intervention,
          comparator: project.protocol.pico.comparator,
          outcome: project.protocol.pico.outcomes
        }
      };
      setSavedStrategies(prev => [newStrategy, ...prev]);
    }, 600);
  };

  const handleImportResult = async (item: ResearchSearchResult, target: 'source_record' | 'reference_hub') => {
    const rawForHash = `${item.title}|${item.authors.join(',')}|${item.year}|${item.doi}|${item.database}`;
    const hash = await calculateSha256(rawForHash);

    if (target === 'source_record') {
      const newSource = buildSourceRecord({
        projectId: project.id,
        sourceOrigin: item.database as SourceRecord['sourceOrigin'],
        sourceId: item.pmid || item.doi,
        title: item.title,
        authors: item.authors,
        year: item.year,
        journal: item.journal,
        doi: item.doi,
        abstract: item.abstract,
        publicationType: item.studyDesignSuggested,
        screeningStatus: 'UNSCREENED',
        provenanceHashSha256: hash,
        tags: ['PubMed / Database Search', 'Kandidat til screening']
      });
      onImportToSourceRecords(newSource);
    } else {
      const newRef: ReferenceItem = {
        id: generateSecureId('REF'),
        projectId: project.id,
        title: item.title,
        authors: item.authors.map(a => {
          const parts = a.split(' ');
          return { family: parts[parts.length - 1] || a, given: parts.slice(0, -1).join(' ') };
        }),
        year: item.year,
        journal: item.journal,
        doi: item.doi,
        pmid: item.pmid,
        abstract: item.abstract,
        itemType: 'journalArticle',
        status: 'VALIDATION_REQUIRED',
        collections: ['Litteratursøk'],
        tags: ['Søk-funn', item.database],
        categories: ['Systematisk søk'],
        directQuotes: [],
        thoughtMemos: [],
        provenanceHashSha256: hash,
        cwywToken: `{${item.authors[0]?.split(' ')[0] || 'Ref'}, ${item.year}}`,
        inTextCitation: `(${item.authors[0]?.split(' ')[0] || 'Ref'}, ${item.year})`,
        importedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onImportToReferenceHub(newRef);
    }

    setSearchResults(prev => prev.map(r => r.id === item.id ? { ...r, imported: true } : r));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Forskningssøk &amp; PICO Søkebygger
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  PubMed &bull; Europe PMC &bull; OpenAlex
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Søk etter vitenskapelige publikasjoner, bygg Booleske søk fra PICO, og send funn direkte til Reference Hub og Screening
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs">
          
          {/* PICO Query Builder Bar */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>PICO / PECO Søkebygger (Styringsmotor)</span>
              </span>
              <button
                onClick={handleBuildPicoSearch}
                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-300 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generer søk fra prosjektets PICO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 font-bold">P:</span> {project.protocol.pico.population || 'Ikke angitt'}
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 font-bold">I/E:</span> {project.protocol.pico.intervention || 'Ikke angitt'}
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 font-bold">C:</span> {project.protocol.pico.comparator || 'Ikke angitt'}
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 font-bold">O:</span> {project.protocol.pico.outcomes || 'Ikke angitt'}
              </div>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søk i PubMed / Europe PMC / OpenAlex med tittel, forfatter, DOI eller Boolsk AND/OR..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedDatabase}
                onChange={(e) => setSelectedDatabase(e.target.value as 'ALL' | 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'CrossRef')}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-blue-300 font-semibold"
              >
                <option value="ALL">Alle databaser (PubMed + PMC + OpenAlex)</option>
                <option value="PubMed">PubMed (NLM)</option>
                <option value="Europe PMC">Europe PMC</option>
                <option value="OpenAlex">OpenAlex</option>
                <option value="CrossRef">CrossRef / DOI Direct</option>
              </select>

              <button
                onClick={handleExecuteSearch}
                disabled={isSearching}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {isSearching ? <span className="animate-spin">⏳</span> : <Search className="w-4 h-4" />}
                <span>{isSearching ? 'Søker...' : 'Kjør Søk'}</span>
              </button>
            </div>

            {/* Filter tags */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filter:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span>År:</span>
                <input
                  type="number"
                  value={filterYearFrom}
                  onChange={(e) => setFilterYearFrom(e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-xs text-white"
                />
                <span>–</span>
                <input
                  type="number"
                  value={filterYearTo}
                  onChange={(e) => setFilterYearTo(e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Studietype:</span>
                <select
                  value={filterStudyDesign}
                  onChange={(e) => setFilterStudyDesign(e.target.value)}
                  className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                >
                  <option value="ALL">Alle design</option>
                  <option value="qualitative">Kvalitativ forskning</option>
                  <option value="systematic_review">Systematisk oversikt</option>
                  <option value="rct">Randomisert kontrollert studie (RCT)</option>
                  <option value="guideline">Klinisk retningslinje</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Søkeresultater ({searchResults.length} funn)
              </span>
              {searchResults.length > 0 && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Automatisk duplikatkontrollert mot Reference Hub &amp; SourceRecords</span>
                </span>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500">
                Kjør et søk eller generer søkestreng fra PICO for å finne artikler fra PubMed, Europe PMC og OpenAlex.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((hit) => (
                  <div 
                    key={hit.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded font-mono font-bold">
                            {hit.database}
                          </span>
                          {hit.studyDesignSuggested && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded font-semibold">
                              {hit.studyDesignSuggested}
                            </span>
                          )}
                          {hit.alreadyInLibrary && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold">
                              Finnes allerede i Reference Hub
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-sm leading-snug">
                          {hit.title}
                        </h4>
                        <div className="text-slate-400 text-[11px]">
                          {hit.authors.join(', ')} &bull; <span className="font-semibold text-slate-300">{hit.journal}</span> ({hit.year})
                          {hit.doi && <span className="font-mono text-blue-400 ml-2">DOI: {hit.doi}</span>}
                          {hit.pmid && <span className="font-mono text-cyan-400 ml-2">PMID: {hit.pmid}</span>}
                        </div>
                      </div>

                      {/* Import Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleImportResult(hit, 'source_record')}
                          disabled={hit.imported}
                          title="Legg til i SourceRecord for PRISMA tittel/abstract screening"
                          className="px-2.5 py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Til Screening</span>
                        </button>
                        <button
                          onClick={() => handleImportResult(hit, 'reference_hub')}
                          disabled={hit.imported}
                          title="Legg direkte til i Reference Hub"
                          className="px-2.5 py-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Til Reference Hub</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                      {hit.abstract}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Search Strategies (PROSPERO Documentation) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>Dokumentert Søkehistorikk (PROSPERO / PRISMA 2020)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {savedStrategies.length} registrerte søk
              </span>
            </div>

            <div className="space-y-2">
              {savedStrategies.map(strat => (
                <div key={strat.id} className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200">{strat.name} ({strat.database})</div>
                    <div className="font-mono text-slate-400 truncate max-w-xl">{strat.query}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-bold text-blue-400">{strat.hitsCount} treff</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(strat.query);
                        setCopiedId(strat.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedId === strat.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Funn kan sendes sømløst til SourceRecord for screening eller Reference Hub for sitering</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded text-xs transition-colors"
          >
            Lukk
          </button>
        </div>

      </div>
    </div>
  );
};
