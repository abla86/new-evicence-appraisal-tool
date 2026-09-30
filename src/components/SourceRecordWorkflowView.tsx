import React, { useState } from 'react';
import { 
  SourceRecord, 
  StudyRecord, 
  ResearchProject,
  AppraisalInstrument
} from '../types';
import { 
  Database, 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Hash, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  FolderPlus
} from 'lucide-react';
import { calculateSha256 } from '../utils/crypto';
import { buildSourceRecord } from '../services/sourceRecordService';

interface SourceRecordWorkflowViewProps {
  project: ResearchProject;
  sourceRecords: SourceRecord[];
  studies: StudyRecord[];
  onAddSourceRecord: (record: SourceRecord) => void;
  onUpdateSourceRecord: (record: SourceRecord) => void;
  onPromoteToStudy: (sourceRecord: SourceRecord, targetInstrument?: AppraisalInstrument) => void;
  onNavigateToAppraisal: (studyId: string, instrument?: AppraisalInstrument) => void;
}

export const SourceRecordWorkflowView: React.FC<SourceRecordWorkflowViewProps> = ({
  project,
  sourceRecords,
  studies,
  onAddSourceRecord,
  onUpdateSourceRecord,
  onPromoteToStudy,
  onNavigateToAppraisal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    sourceRecords[0]?.id || ''
  );
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newJournal, setNewJournal] = useState('');
  const [newDoi, setNewDoi] = useState('');
  const [newSourceOrigin, setNewSourceOrigin] = useState<SourceRecord['sourceOrigin']>('PubMed');
  const [newAbstract, setNewAbstract] = useState('');

  // Filtering
  const filteredRecords = sourceRecords.filter(rec => {
    const matchesSearch = 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.doi && rec.doi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.journal && rec.journal.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || rec.screeningStatus === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || rec.sourceOrigin === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const selectedRecord = sourceRecords.find(r => r.id === selectedRecordId) || filteredRecords[0];

  // Stats calculation for PRISMA alignment
  const totalRecords = sourceRecords.length;
  const unscreenedCount = sourceRecords.filter(r => r.screeningStatus === 'UNSCREENED').length;
  const acceptedScreeningCount = sourceRecords.filter(r => r.screeningStatus === 'TITLE_ABSTRACT_ACCEPTED' || r.screeningStatus === 'FULL_TEXT_PENDING').length;
  const eligibleIncludedCount = sourceRecords.filter(r => r.screeningStatus === 'ELIGIBLE_INCLUDED').length;
  const excludedCount = sourceRecords.filter(r => r.screeningStatus === 'EXCLUDED' || r.screeningStatus === 'TITLE_ABSTRACT_REJECTED').length;

  const handleCreateRecord = async () => {
    if (!newTitle.trim()) return;
    const authorsList = newAuthors.split(/;|,/).map(s => s.trim()).filter(Boolean);
    const rawForHash = `${newTitle}|${newAuthors}|${newYear}|${newDoi}|${newSourceOrigin}|${newAbstract}`;
    const hash = await calculateSha256(rawForHash);

    const record = buildSourceRecord({
      projectId: project.id,
      sourceOrigin: newSourceOrigin,
      title: newTitle.trim(),
      authors: authorsList,
      year: newYear.trim() || undefined,
      journal: newJournal.trim() || undefined,
      doi: newDoi.trim() || undefined,
      abstract: newAbstract.trim() || undefined,
      screeningStatus: 'UNSCREENED',
      provenanceHashSha256: hash
    });

    onAddSourceRecord(record);
    setSelectedRecordId(record.id);
    setShowAddModal(false);

    // Reset fields
    setNewTitle('');
    setNewAuthors('');
    setNewJournal('');
    setNewDoi('');
    setNewAbstract('');
  };

  const handleUpdateStatus = (
    rec: SourceRecord, 
    newStatus: SourceRecord['screeningStatus'], 
    reason?: string
  ) => {
    const updated: SourceRecord = {
      ...rec,
      screeningStatus: newStatus,
      exclusionReason: newStatus === 'EXCLUDED' || newStatus === 'TITLE_ABSTRACT_REJECTED' 
        ? (reason || 'Ekskludert iht. protokollkriterier') 
        : undefined
    };
    onUpdateSourceRecord(updated);
  };

  const getStatusBadge = (status: SourceRecord['screeningStatus']) => {
    switch (status) {
      case 'ELIGIBLE_INCLUDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Inkludert (Klar for JBI)
          </span>
        );
      case 'TITLE_ABSTRACT_ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            Tittel/Sammendrag Godkjent
          </span>
        );
      case 'FULL_TEXT_PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <FileText className="w-3 h-3 text-indigo-600" />
            Fulltekst Vurdering
          </span>
        );
      case 'EXCLUDED':
      case 'TITLE_ABSTRACT_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Ekskludert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            Ubehandlet
          </span>
        );
    }
  };

  // Check if selected record is already promoted to a StudyRecord
  const linkedStudy = selectedRecord?.linkedStudyId 
    ? studies.find(s => s.id === selectedRecord.linkedStudyId)
    : studies.find(s => s.doi && selectedRecord?.doi && s.doi.toLowerCase() === selectedRecord.doi.toLowerCase());

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Top Banner: Workflow Header & PRISMA Ingestion Pipeline Stats */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-md shadow-xs">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                SourceRecord Arbeidsflyt &amp; Kildehåndtering
              </h2>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Separat fra JBI-vurdering
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Dedikert kilderegister for identifisering, provenienssporing (kryptografisk SHA-256) og PRISMA-screening. 
              Kvalifiserte kilder overføres metodisk til <strong>JBI Kvalitativ Vurdering</strong> uten å blande kildedata med metodisk scoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="source-add-record-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Legg til kildepost</span>
            </button>
          </div>
        </div>

        {/* PRISMA 2020 Pipeline Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Identifisert</div>
            <div className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{totalRecords}</div>
            <div className="text-[10px] text-slate-400">Totalt importert</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Ubehandlet</div>
            <div className="text-lg font-extrabold text-amber-900 font-mono mt-0.5">{unscreenedCount}</div>
            <div className="text-[10px] text-amber-600">Venter screening</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Godkjent fase 1</div>
            <div className="text-lg font-extrabold text-blue-900 font-mono mt-0.5">{acceptedScreeningCount}</div>
            <div className="text-[10px] text-blue-600">Til fulltekstvurdering</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Inkludert</div>
            <div className="text-lg font-extrabold text-emerald-900 font-mono mt-0.5">{eligibleIncludedCount}</div>
            <div className="text-[10px] text-emerald-600">Klar for JBI-vurdering</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
            <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Ekskludert</div>
            <div className="text-lg font-extrabold text-rose-900 font-mono mt-0.5">{excludedCount}</div>
            <div className="text-[10px] text-rose-600">Med begrunnelse</div>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Filter & Records List (Left) + Detail & Screening Card (Right) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left List Pane (5 Cols on large screen) */}
        <div className="w-full lg:w-5/12 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
          
          {/* Controls & Search */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i kildeposter (tittel, forfatter, DOI, tidsskrift)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
              >
                <option value="ALL">Alle statuser ({sourceRecords.length})</option>
                <option value="UNSCREENED">Ubehandlet</option>
                <option value="TITLE_ABSTRACT_ACCEPTED">Godkjent tittel/sammendrag</option>
                <option value="FULL_TEXT_PENDING">Fulltekst venter</option>
                <option value="ELIGIBLE_INCLUDED">Inkludert</option>
                <option value="EXCLUDED">Ekskludert</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-36 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
              >
                <option value="ALL">Alle databaser</option>
                <option value="PubMed">PubMed</option>
                <option value="Embase">Embase</option>
                <option value="Web of Science">Web of Science</option>
                <option value="Cochrane Library">Cochrane</option>
                <option value="Lovdata">Lovdata</option>
                <option value="CrossRef">CrossRef</option>
                <option value="Manual Import">Manuell</option>
                <option value="Browser Extension">Utvidelse</option>
              </select>
            </div>
          </div>

          {/* List of Records */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Ingen kildeposter funnet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Juster søkefilteret eller legg til en ny kildepost.</p>
              </div>
            ) : (
              filteredRecords.map(rec => {
                const isSelected = selectedRecord?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    id={`source-item-${rec.id}`}
                    onClick={() => setSelectedRecordId(rec.id)}
                    className={`p-3.5 cursor-pointer transition-colors text-left ${
                      isSelected 
                        ? 'bg-blue-50/90 border-l-4 border-l-blue-600' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                        {rec.sourceOrigin}
                      </span>
                      {getStatusBadge(rec.screeningStatus)}
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {rec.title}
                    </h3>

                    <div className="text-[11px] text-slate-600 mt-1 truncate">
                      {rec.authors.join(', ')}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      {rec.year && <span>År: {rec.year}</span>}
                      {rec.journal && <span className="italic truncate max-w-[140px]">{rec.journal}</span>}
                      {rec.doi && <span className="font-mono truncate max-w-[120px]">DOI: {rec.doi}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail & Actions Pane (7 Cols) */}
        <div className="hidden lg:flex flex-1 flex-col h-full bg-white overflow-y-auto">
          {selectedRecord ? (
            <div className="p-6 max-w-4xl">
              
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-slate-500 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    Kilde ID: {selectedRecord.id}
                  </span>
                  {getStatusBadge(selectedRecord.screeningStatus)}
                </div>

                <div className="text-xs text-slate-400">
                  Importert: {new Date(selectedRecord.importedAt).toLocaleDateString('no-NO')}
                </div>
              </div>

              {/* Title & Bibliographic Core */}
              <h1 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedRecord.title}
              </h1>

              <div className="mt-2 text-sm text-slate-700">
                <strong>Forfattere:</strong> {selectedRecord.authors.join(', ')}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Opprinnelse</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.sourceOrigin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tidsskrift</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedRecord.journal || 'Ikke oppgitt'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Publiseringsår</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.year || 'u.å.'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">DOI / URL</span>
                  <span className="font-mono text-slate-800 truncate block">
                    {selectedRecord.doi ? selectedRecord.doi : 'Ingen'}
                  </span>
                </div>
              </div>

              {/* Cryptographic Provenance Hash */}
              <div className="mt-3 p-2.5 bg-slate-900 text-slate-200 rounded-md font-mono text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Hash className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-400 text-[10px] uppercase">SHA-256 Proveniens:</span>
                  <span className="text-emerald-300 truncate">{selectedRecord.provenanceHashSha256}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans ml-2 flex-shrink-0">Uforanderlig</span>
              </div>

              {/* Abstract */}
              <div className="mt-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Sammendrag (Abstract)
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-800 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {selectedRecord.abstract || 'Ingen sammendragstekst er tilknyttet denne kildeposten.'}
                </div>
              </div>

              {/* Exclusion notes if any */}
              {selectedRecord.exclusionReason && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900">
                  <span className="font-bold">Eksklusjonsbegrunnelse:</span> {selectedRecord.exclusionReason}
                </div>
              )}

              {/* Action Controls: PRISMA Screening Decisions */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Screening-handlinger (Fase 1 &amp; Fase 2)
                </h3>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    id="btn-screen-accept-title"
                    onClick={() => handleUpdateStatus(selectedRecord, 'TITLE_ABSTRACT_ACCEPTED')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Godkjenn tittel/sammendrag</span>
                  </button>

                  <button
                    id="btn-screen-include-eligible"
                    onClick={() => handleUpdateStatus(selectedRecord, 'ELIGIBLE_INCLUDED')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inkluder artikkel (Kvalifisert)</span>
                  </button>

                  <button
                    id="btn-screen-exclude"
                    onClick={() => {
                      const reason = window.prompt(
                        'Angi eksklusjonsbegrunnelse iht. protokoll (f.eks. feil populasjon, ikke kvalitativ metodologi, feil intervensjon):',
                        'Oppfyller ikke inklusjonskriterier'
                      );
                      if (reason !== null) {
                        handleUpdateStatus(selectedRecord, 'EXCLUDED', reason);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Ekskluder kilde...</span>
                  </button>
                </div>
              </div>

              {/* Promotion to JBI Qualitative Appraisal Workspace */}
              <div className="mt-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-700" />
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                        Overgang til JBI Kvalitativ Vurdering
                      </h4>
                    </div>
                    <p className="text-xs text-blue-800 mt-1 max-w-xl">
                      {linkedStudy ? (
                        <>Denne kildeposten er allerede koblet til studieoppføringen: <strong>{linkedStudy.title}</strong></>
                      ) : (
                        <>Opprett en formell <strong>StudyRecord</strong> fra denne kildeposten og start metodisk vurdering i JBI Qualitative 10-punktsverktøyet.</>
                      )}
                    </p>
                  </div>

                  {linkedStudy ? (
                    <button
                      id="btn-open-linked-appraisal"
                      onClick={() => onNavigateToAppraisal(linkedStudy.id, 'JBI_QUALITATIVE')}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      <span>Åpne i JBI Kvalitativ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      id="btn-promote-to-jbi"
                      onClick={() => onPromoteToStudy(selectedRecord, 'JBI_QUALITATIVE')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Overfør til JBI Vurdering</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 my-auto">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Velg en kildepost fra listen</p>
              <p className="text-xs text-slate-400 mt-1">
                Gå gjennom sammendrag, sjekk proveniens og foreta screeningbeslutninger.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Source Record */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Legg til ny kildepost i registeret
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registrer en ny kilde fra en litteraturdatabase. Kildeposten lagres lokalt med SHA-256 integritetshash.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kildedatabase / Opprinnelse</label>
                <select
                  value={newSourceOrigin}
                  onChange={(e) => setNewSourceOrigin(e.target.value as SourceRecord['sourceOrigin'])}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PubMed">PubMed / MEDLINE</option>
                  <option value="Embase">Embase (Elsevier)</option>
                  <option value="Web of Science">Web of Science</option>
                  <option value="Cochrane Library">Cochrane Library</option>
                  <option value="Lovdata">Lovdata</option>
                  <option value="CrossRef">CrossRef</option>
                  <option value="Manual Import">Manuell innlegging</option>
                  <option value="Browser Extension">Nettleserutvidelse</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Artikkeltittel *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Eks: Lived experiences of elderly receiving home care services"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forfattere (kommaseparert)</label>
                  <input
                    type="text"
                    value={newAuthors}
                    onChange={(e) => setNewAuthors(e.target.value)}
                    placeholder="Eks: Hansen, K., Olsen, P. A."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Årstall</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tidsskrift / Journal</label>
                  <input
                    type="text"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    placeholder="Eks: International Journal of Qualitative Studies in Health"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DOI</label>
                  <input
                    type="text"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    placeholder="Eks: 10.1080/17482631.2023.123456"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sammendrag (Abstract)</label>
                <textarea
                  rows={3}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  placeholder="Lim inn sammendrag eller nøkkelinformasjon her..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateRecord}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Lagre kildepost
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
