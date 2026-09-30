import React, { useState, useMemo } from 'react';
import { 
  ReferenceItem, 
  StudyRecord, 
  ResearchProject,
  CitationStyle,
  ReferenceAuthor,
  ReferenceDirectQuote,
  ReferenceThoughtMemo,
  AppraisalInstrument
} from '../types';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Quote, 
  Lightbulb, 
  Download, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Tag, 
  FolderPlus, 
  Trash2,
  GitMerge,
  Eye,
  CheckCircle2,
  Clock,
  BookMarked,
  X
} from 'lucide-react';
import { 
  formatReferenceInStyle, 
  generateCwywToken, 
  generateInTextCitation,
  validateReferenceCompleteness,
  detectDuplicates,
  mergeReferenceItems,
  promoteReferenceToStudy,
  exportToBibtex,
  exportToRis,
  exportToEndNoteXml,
  exportToCsv,
  parseRis
} from '../utils/referenceEngine';
import { calculateSha256Sync } from '../utils/crypto';

interface ReferenceHubViewProps {
  project: ResearchProject;
  references: ReferenceItem[];
  studies: StudyRecord[];
  onUpdateReferences: (references: ReferenceItem[]) => void;
  onPromoteToStudy: (study: StudyRecord) => void;
  onNavigateToAppraisal: (studyId: string, instrument?: AppraisalInstrument) => void;
}

export const ReferenceHubView: React.FC<ReferenceHubViewProps> = ({
  project,
  references,
  studies,
  onUpdateReferences,
  onPromoteToStudy,
  onNavigateToAppraisal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('APA7');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');
  const [selectedRefId, setSelectedRefId] = useState<string>(references[0]?.id || '');
  
  // UI Modals & Popovers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Feedback states
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // New Quote form
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteTags, setQuoteTags] = useState('');

  // New Memo form
  const [isAddingMemo, setIsAddingMemo] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoTags, setMemoTags] = useState('');

  // New Reference form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newJournal, setNewJournal] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPages, setNewPages] = useState('');
  const [newDoi, setNewDoi] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newTags, setNewTags] = useState('');

  const allCollections = useMemo(() => {
    const set = new Set<string>();
    references.forEach(r => (r.collections || []).forEach(c => set.add(c)));
    return Array.from(set);
  }, [references]);

  const filteredReferences = useMemo(() => {
    return references.filter(ref => {
      if (statusFilter !== 'ALL' && ref.status !== statusFilter) return false;
      if (collectionFilter !== 'ALL' && !(ref.collections || []).includes(collectionFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const authors = (ref.authors || []).map(a => `${a.family} ${a.given}`).join(' ').toLowerCase();
        const title = (ref.title || '').toLowerCase();
        const journal = (ref.journal || '').toLowerCase();
        const doi = (ref.doi || '').toLowerCase();
        const tags = (ref.tags || []).join(' ').toLowerCase();
        if (!title.includes(q) && !authors.includes(q) && !journal.includes(q) && !doi.includes(q) && !tags.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [references, statusFilter, collectionFilter, searchQuery]);

  const selectedRef = useMemo(() => {
    return references.find(r => r.id === selectedRefId) || filteredReferences[0] || references[0];
  }, [references, selectedRefId, filteredReferences]);

  // Duplicate pairs
  const duplicatePairs = useMemo(() => {
    return detectDuplicates(references);
  }, [references]);

  // Check if current reference is already promoted to a study
  const linkedStudy = useMemo(() => {
    if (!selectedRef) return null;
    return studies.find(s => s.sourceRefId === selectedRef.id || s.id.includes(selectedRef.id) || (s.doi && selectedRef.doi && s.doi.toLowerCase() === selectedRef.doi.toLowerCase()));
  }, [selectedRef, studies]);

  const handleCopy = (text: string, type: 'token' | 'citation', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedTokenId(id);
      setTimeout(() => setCopiedTokenId(null), 2000);
    } else {
      setCopiedCitationId(id);
      setTimeout(() => setCopiedCitationId(null), 2000);
    }
  };

  const handleCreateReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedAuthors: ReferenceAuthor[] = newAuthors.split(';').map(part => {
      const trimmed = part.trim();
      if (trimmed.includes(',')) {
        const [family, given] = trimmed.split(',').map(s => s.trim());
        return { family, given };
      }
      const parts = trimmed.split(' ');
      const family = parts.pop() || trimmed;
      const given = parts.join(' ');
      return { family, given };
    }).filter(a => a.family.length > 0);

    const refId = `ref-${Date.now().toString(36)}`;
    const newRef: ReferenceItem = {
      id: refId,
      projectId: project.id,
      title: newTitle.trim(),
      authors: parsedAuthors.length > 0 ? parsedAuthors : [{ family: 'Ukjent' }],
      year: newYear.trim() || undefined,
      journal: newJournal.trim() || undefined,
      volume: newVolume.trim() || undefined,
      issue: newIssue.trim() || undefined,
      pages: newPages.trim() || undefined,
      doi: newDoi.trim() || undefined,
      abstract: newAbstract.trim() || undefined,
      itemType: 'journalArticle',
      status: 'VALIDATED',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      collections: ['Hovedbibliotek'],
      categories: ['1. Vitenskapelige artikler'],
      directQuotes: [],
      thoughtMemos: [],
      cwywToken: `{${parsedAuthors[0]?.family || 'Ref'}, ${newYear.trim() || 'u.å.'} #${refId}}`,
      inTextCitation: `(${parsedAuthors[0]?.family || 'Ref'}, ${newYear.trim() || 'u.å.'})`,
      provenanceHashSha256: calculateSha256Sync(`${newTitle}|${newAuthors}|${newYear}`),
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newRef.cwywToken = generateCwywToken(newRef);
    const inText = generateInTextCitation(newRef);
    newRef.inTextCitation = inText.parenthetical;

    const updated = [newRef, ...references];
    onUpdateReferences(updated);
    setSelectedRefId(refId);
    setShowAddModal(false);

    // Reset fields
    setNewTitle('');
    setNewAuthors('');
    setNewYear('');
    setNewJournal('');
    setNewVolume('');
    setNewIssue('');
    setNewPages('');
    setNewDoi('');
    setNewAbstract('');
    setNewTags('');
  };

  const handleAddQuote = () => {
    if (!selectedRef || !quoteText.trim()) return;
    const newQuote: ReferenceDirectQuote = {
      id: `quote-${Date.now().toString(36)}`,
      text: quoteText.trim(),
      page: quotePage.trim(),
      tags: quoteTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };
    const updated = references.map(r => {
      if (r.id === selectedRef.id) {
        return {
          ...r,
          directQuotes: [...(r.directQuotes || []), newQuote],
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    onUpdateReferences(updated);
    setQuoteText('');
    setQuotePage('');
    setQuoteTags('');
    setIsAddingQuote(false);
  };

  const handleAddMemo = () => {
    if (!selectedRef || !memoContent.trim()) return;
    const newMemo: ReferenceThoughtMemo = {
      id: `memo-${Date.now().toString(36)}`,
      title: memoTitle.trim() || 'Uten tittel',
      content: memoContent.trim(),
      tags: memoTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };
    const updated = references.map(r => {
      if (r.id === selectedRef.id) {
        return {
          ...r,
          thoughtMemos: [...(r.thoughtMemos || []), newMemo],
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    onUpdateReferences(updated);
    setMemoTitle('');
    setMemoContent('');
    setMemoTags('');
    setIsAddingMemo(false);
  };

  const handlePromote = (ref: ReferenceItem) => {
    const newStudy = promoteReferenceToStudy(ref, project.id);
    onPromoteToStudy(newStudy);
  };

  const handleImportRis = () => {
    setImportError(null);
    if (!importText.trim()) return;
    try {
      const parsedList = parseRis(importText);
      if (!parsedList || parsedList.length === 0) {
        setImportError('Ingen gyldige RIS-referanser ble funnet. Vennligst sjekk formatet.');
        return;
      }
      const newItems: ReferenceItem[] = parsedList.map((p, idx) => {
        const item: ReferenceItem = {
          id: `ref-import-${Date.now().toString(36)}-${idx}`,
          projectId: project.id,
          title: p.title || 'Uten tittel',
          authors: p.authors || [{ family: 'Ukjent' }],
          year: p.year,
          journal: p.journal,
          volume: p.volume,
          issue: p.issue,
          pages: p.pages,
          doi: p.doi,
          abstract: p.abstract,
          itemType: 'journalArticle',
          status: 'VALIDATED',
          tags: ['RIS-import'],
          collections: ['Importert'],
          categories: ['Importerte referanser'],
          directQuotes: [],
          thoughtMemos: [],
          cwywToken: `{${(p.authors?.[0]?.family) || 'Ref'}, ${p.year || 'u.å.'} #${idx + 1}}`,
          inTextCitation: `(${(p.authors?.[0]?.family) || 'Ref'}, ${p.year || 'u.å.'})`,
          provenanceHashSha256: calculateSha256Sync(p.title || String(idx)),
          importedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        item.cwywToken = generateCwywToken(item);
        const inText = generateInTextCitation(item);
        item.inTextCitation = inText.parenthetical;
        return item;
      });

      onUpdateReferences([...newItems, ...references]);
      setShowImportModal(false);
      setImportText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Feil under import av RIS.';
      setImportError(msg);
    }
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div id="reference-hub-view" className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-50 text-slate-900">
      {/* Top Action Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Referansehub & Vitenskapelig Bibliotek</h1>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {references.length} kilder
              </span>
            </div>
            <p className="text-xs text-slate-500">
              EndNote CWYW, Zotero-stilformattering (APA 7, Vancouver m.fl.), Citavi kunnskapsorganisering og PRISMA-overføring
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Citation Style Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs font-medium">
            <span className="text-slate-500">Stil:</span>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CitationStyle)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="APA7">APA 7th</option>
              <option value="Vancouver">Vancouver</option>
              <option value="Harvard">Harvard</option>
              <option value="Chicago">Chicago</option>
              <option value="MLA">MLA 9th</option>
              <option value="IEEE">IEEE</option>
            </select>
          </div>

          {/* Duplicate pairs alert if any */}
          {duplicatePairs.length > 0 && (
            <button
              onClick={() => setShowDuplicateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <GitMerge className="w-3.5 h-3.5 text-amber-600" />
              <span>{duplicatePairs.length} mulige duplikater</span>
            </button>
          )}

          {/* Export Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Eksporter</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 text-xs text-slate-700">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Bibliografiske formater
                </div>
                <button
                  onClick={() => handleDownloadFile(exportToBibtex(references), `${project.shortCode || 'project'}_references.bib`, 'text/plain')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>BibTeX (.bib)</span>
                  <span className="text-[10px] text-slate-400">Overleaf / LaTeX</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(exportToRis(references), `${project.shortCode || 'project'}_references.ris`, 'application/x-research-info-systems')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>RIS (.ris)</span>
                  <span className="text-[10px] text-slate-400">EndNote / Zotero</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(exportToEndNoteXml(references), `${project.shortCode || 'project'}_endnote.xml`, 'application/xml')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>EndNote XML (.xml)</span>
                  <span className="text-[10px] text-slate-400">EndNote 20/21</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(exportToCsv(references), `${project.shortCode || 'project'}_references.csv`, 'text/csv')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>CSV regneark (.csv)</span>
                  <span className="text-[10px] text-slate-400">Excel / Sheets</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Importer RIS</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ny referanse</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: List & Filter */}
        <div className="w-96 flex flex-col bg-white border-r border-slate-200 shrink-0">
          {/* Search & Filter Controls */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk tittel, forfatter, DOI, tagg..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none"
              >
                <option value="ALL">Alle statuser</option>
                <option value="VALIDATED">Validert</option>
                <option value="VALIDATION_REQUIRED">Krever validering</option>
                <option value="RETRACTED">Tilbaketrukket (Retracted)</option>
              </select>

              {allCollections.length > 0 && (
                <select
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Alle mapper</option>
                  {allCollections.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Reference List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredReferences.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Ingen referanser samsvarer med søket.</p>
              </div>
            ) : (
              filteredReferences.map((ref) => {
                const isSelected = selectedRef?.id === ref.id;
                const authorStr = (ref.authors || []).map(a => a.family).join(', ') || 'Ukjent forfatter';
                const token = ref.cwywToken || generateCwywToken(ref);
                const isLinked = studies.some(s => s.sourceRefId === ref.id || s.id.includes(ref.id));

                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedRefId(ref.id)}
                    className={`p-3 text-left cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {ref.year || 'u.å.'} • {authorStr}
                      </span>
                      {isLinked && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-800 shrink-0">
                          I kunnskapsoversikt
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
                      {ref.title}
                    </h3>

                    <div className="text-[11px] text-slate-500 italic line-clamp-1 mb-2">
                      {ref.journal || 'Ingen tidsskriftangivelse'}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100/60">
                      <code className="text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded font-mono">
                        {token}
                      </code>

                      <div className="flex items-center gap-2 text-[10px]">
                        {ref.directQuotes && ref.directQuotes.length > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-600">
                            <Quote className="w-2.5 h-2.5" />
                            {ref.directQuotes.length}
                          </span>
                        )}
                        {ref.thoughtMemos && ref.thoughtMemos.length > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <Lightbulb className="w-2.5 h-2.5" />
                            {ref.thoughtMemos.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Reference Detail & Workspace */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {selectedRef ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Primary Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700">
                        {selectedRef.itemType || 'Vitenskapelig artikkel'}
                      </span>
                      {selectedRef.status === 'VALIDATED' ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validert integritet
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Krever feltvalidering
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-snug">
                      {selectedRef.title}
                    </h2>
                  </div>

                  {/* Promote to Study button */}
                  <div>
                    {linkedStudy ? (
                      <button
                        onClick={() => onNavigateToAppraisal(linkedStudy.id, 'JBI_QUALITATIVE')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Åpne kritisk vurdering</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromote(selectedRef)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Inkluder i kunnskapsoversikt (JBI)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Formatted Citation Live Card */}
                <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Bibliografisk innførsel ({selectedStyle})
                    </span>
                    <button
                      onClick={() => handleCopy(formatReferenceInStyle(selectedRef, selectedStyle), 'citation', selectedRef.id)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {copiedCitationId === selectedRef.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopier referanse</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 font-serif leading-relaxed select-text">
                    {formatReferenceInStyle(selectedRef, selectedStyle)}
                  </p>
                </div>

                {/* EndNote CWYW & In-text Tokens */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-900 uppercase">
                        EndNote CWYW-token
                      </div>
                      <code className="text-xs font-mono font-bold text-indigo-700">
                        {selectedRef.cwywToken || generateCwywToken(selectedRef)}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedRef.cwywToken || generateCwywToken(selectedRef), 'token', selectedRef.id)}
                      className="p-1.5 bg-white text-indigo-700 hover:bg-indigo-100 rounded-md border border-indigo-200"
                      title="Kopier token"
                    >
                      {copiedTokenId === selectedRef.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 uppercase">
                        In-text sitering (parentetisk)
                      </div>
                      <span className="text-xs font-medium text-slate-800">
                        {generateInTextCitation(selectedRef).parenthetical}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(generateInTextCitation(selectedRef).parenthetical, 'citation', `intext-${selectedRef.id}`)}
                      className="p-1.5 bg-white text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
                      title="Kopier in-text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-200">
                  <div>
                    <span className="block text-slate-400 font-medium">Forfattere</span>
                    <span className="font-semibold text-slate-800">
                      {(selectedRef.authors || []).map(a => `${a.family}, ${a.given || ''}`).join('; ') || 'Ikke oppgitt'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">År / Tidsskrift</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRef.year || 'u.å.'} — {selectedRef.journal || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Volum / Sider</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRef.volume ? `Vol. ${selectedRef.volume}` : ''}{selectedRef.issue ? `(${selectedRef.issue})` : ''} {selectedRef.pages ? `s. ${selectedRef.pages}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Identifikatorer</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      {selectedRef.doi && (
                        <a
                          href={`https://doi.org/${selectedRef.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>DOI</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {selectedRef.pmid && (
                        <span className="text-slate-500">PMID: {selectedRef.pmid}</span>
                      )}
                    </span>
                  </div>
                </div>

                {selectedRef.abstract && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Sammendrag (Abstract)
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                      {selectedRef.abstract}
                    </p>
                  </div>
                )}
              </div>

              {/* Citavi Knowledge Hub: Quotes & Thought Memos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direct Quotes Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Quote className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Direkte sitater & tekstutdrag</h3>
                    </div>
                    <button
                      onClick={() => setIsAddingQuote(true)}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                    >
                      + Nytt sitat
                    </button>
                  </div>

                  {isAddingQuote && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                      <textarea
                        value={quoteText}
                        onChange={(e) => setQuoteText(e.target.value)}
                        placeholder="Lim inn ordrett sitat fra kilden..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={quotePage}
                          onChange={(e) => setQuotePage(e.target.value)}
                          placeholder="Sidetall (f.eks. 14-15)"
                          className="w-1/3 p-1.5 bg-white border border-slate-200 rounded text-slate-900"
                        />
                        <input
                          type="text"
                          value={quoteTags}
                          onChange={(e) => setQuoteTags(e.target.value)}
                          placeholder="Tagger (kommaseparert)"
                          className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-slate-900"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setIsAddingQuote(false)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={handleAddQuote}
                          className="px-3 py-1 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700"
                        >
                          Lagre sitat
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {(!selectedRef.directQuotes || selectedRef.directQuotes.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">Ingen sitater lagt til ennå.</p>
                    ) : (
                      selectedRef.directQuotes.map((q) => (
                        <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <p className="font-serif italic text-slate-800 leading-relaxed mb-2">
                            "{q.text}"
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{q.page ? `Side ${q.page}` : 'Uspesifisert side'}</span>
                            <button
                              onClick={() => handleCopy(`"${q.text}" (${(selectedRef.authors?.[0]?.family || 'Forfatter')}, ${selectedRef.year || 'u.å.'}${q.page ? `, s. ${q.page}` : ''})`, 'citation', q.id)}
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>Kopier med kilde</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Thought Memos Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Refleksjonsnotater & Memos</h3>
                    </div>
                    <button
                      onClick={() => setIsAddingMemo(true)}
                      className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
                    >
                      + Nytt notat
                    </button>
                  </div>

                  {isAddingMemo && (
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                      <input
                        type="text"
                        value={memoTitle}
                        onChange={(e) => setMemoTitle(e.target.value)}
                        placeholder="Tittel for refleksjon..."
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-900"
                      />
                      <textarea
                        value={memoContent}
                        onChange={(e) => setMemoContent(e.target.value)}
                        placeholder="Skriv dine tanker, metodiske overveielser eller kommentarer..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        rows={3}
                      />
                      <input
                        type="text"
                        value={memoTags}
                        onChange={(e) => setMemoTags(e.target.value)}
                        placeholder="Tagger (kommaseparert)"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-900"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setIsAddingMemo(false)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={handleAddMemo}
                          className="px-3 py-1 bg-amber-600 text-white font-semibold rounded hover:bg-amber-700"
                        >
                          Lagre memo
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {(!selectedRef.thoughtMemos || selectedRef.thoughtMemos.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">Ingen memos lagt til ennå.</p>
                    ) : (
                      selectedRef.thoughtMemos.map((m) => (
                        <div key={m.id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-lg text-xs">
                          <h4 className="font-semibold text-slate-900 mb-1">{m.title}</h4>
                          <p className="text-slate-700 leading-relaxed mb-2">{m.content}</p>
                          <div className="text-[10px] text-slate-400">
                            {new Date(m.createdAt).toLocaleDateString('no-NO')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Velg en referanse fra listen for å vise detaljer.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Ny Referanse */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Registrer ny referanse</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReference} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tittel *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Artikkelens fullstendige tittel"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Forfattere (semikolondelt: Etternavn, Fornavn; ...)</label>
                <input
                  type="text"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  placeholder="F.eks: Hansen, Hans; Berg, Astrid"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publikasjonsår</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="F.eks. 2023 (la stå tom hvis ukjent)"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tidsskrift</label>
                  <input
                    type="text"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    placeholder="Journal of Nursing Scholarship"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volum</label>
                  <input
                    type="text"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    placeholder="12"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hefte</label>
                  <input
                    type="text"
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="4"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sider</label>
                  <input
                    type="text"
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    placeholder="100-112"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DOI</label>
                  <input
                    type="text"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    placeholder="10.1016/..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tagger (kommaseparert)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Kvalitativ, Sykepleie"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sammendrag (Abstract)</label>
                <textarea
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  placeholder="Valgfritt sammendrag..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-900"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Opprett referanse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Importer RIS */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Importer RIS-format</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Lim inn rå RIS-tekst fra PubMed, Web of Science, Embase, Zotero eller EndNote:
            </p>

            {importError && (
              <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {importError}
              </div>
            )}

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"TY  - JOUR\nTI  - Critical appraisal in systematic reviews\nAU  - Hansen, H.\nPY  - 2023\nER  -"}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={8}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleImportRis}
                className="px-5 py-2 text-xs bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
              >
                Importer referanser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Duplikatdeteksjon */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Duplikatdeteksjon & Sikker Sammenslåing
                </h3>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Systemet har identifisert følgende mulige duplikater basert på DOI og tittel/år-likhet. Sammenslåing bevarer sitater, memos og historikk.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {duplicatePairs.map((pair) => (
                <div key={pair.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      {pair.description} ({pair.similarityScore}% likhet)
                    </span>
                    <button
                      onClick={() => {
                        const merged = mergeReferenceItems(pair.source, pair.target, 'primary_source');
                        const updated = references.filter(r => r.id !== pair.target.id).map(r => r.id === pair.source.id ? merged : r);
                        onUpdateReferences(updated);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700"
                    >
                      Slå sammen til én post
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="font-semibold block text-slate-700">A: {pair.source.title}</span>
                      <span className="text-slate-500">{pair.source.journal} ({pair.source.year || 'u.å.'})</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="font-semibold block text-slate-700">B: {pair.target.title}</span>
                      <span className="text-slate-500">{pair.target.journal} ({pair.target.year || 'u.å.'})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
