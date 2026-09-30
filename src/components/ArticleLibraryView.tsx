import React, { useState } from 'react';
import { StudyRecord, AppraisalAssessment, AppraisalInstrument } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ExternalLink, 
  Hash, 
  Upload, 
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Quote
} from 'lucide-react';

interface ArticleLibraryViewProps {
  studies: StudyRecord[];
  assessments: Record<string, AppraisalAssessment[]>;
  activeStudyId: string;
  onSelectStudy: (id: string) => void;
  onOpenAppraisal: (studyId: string, instrument?: AppraisalInstrument) => void;
  onOpenUpload: () => void;
  onOpenCitationModal?: () => void;
}

export const ArticleLibraryView: React.FC<ArticleLibraryViewProps> = ({
  studies,
  assessments,
  activeStudyId,
  onSelectStudy,
  onOpenAppraisal,
  onOpenUpload,
  onOpenCitationModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredStudies = studies.filter(study => {
    const matchesSearch = 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (study.journal && study.journal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (study.doi && study.doi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || study.documentType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-md shadow-xs">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Forsknings- og Artikkelbibliotek
              </h2>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {studies.length} registrerte studier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Sentralt register for alle inkluderte forskningsartikler, fulltekstkilder og systematiske oversikter med metodisk forsegling og SHA-256 integritetskjede.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="library-import-btn"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importer ny artikkel</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk i bibliotek (tittel, forfatter, tidsskrift, DOI)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-56 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="ALL">Alle publikasjonstyper</option>
            <option value="Qualitative Empirical Study">Kvalitativ empirisk studie</option>
            <option value="Qualitative Systematic Review">Kvalitativ systematisk oversikt</option>
            <option value="Systematic Review / Meta-Analysis">Systematisk oversikt</option>
            <option value="Randomized Controlled Trial">Randomisert kontrollert studie</option>
            <option value="Clinical Practice Guideline">Klinisk retningslinje</option>
          </select>
        </div>
      </div>

      {/* Studies Grid / Table */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredStudies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Ingen artikler matcher søket</h3>
            <p className="text-xs text-slate-500 mt-1">Prøv et annet søkeord eller tilbakestill filteret.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudies.map((study) => {
              const studyAss = assessments[study.id] || [];
              const isSelected = study.id === activeStudyId;
              const hasJbi = studyAss.some(a => a.instrument === 'JBI_QUALITATIVE' || a.instrument === 'JBI');

              return (
                <div
                  key={study.id}
                  id={`library-card-${study.id}`}
                  className={`bg-white rounded-xl border transition-all flex flex-col justify-between p-4.5 ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header Tags & Lock Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {study.documentType}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {study.isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded" title="Forseglet / Låst mot endring">
                            <Lock className="w-2.5 h-2.5" /> Låst
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
                            <Unlock className="w-2.5 h-2.5" /> Åpen
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {study.title}
                    </h3>

                    {/* Authors & Journal */}
                    <div className="text-[11px] text-slate-600 mt-1 truncate">
                      {study.authors}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      {study.year && <span>År: {study.year}</span>}
                      {study.journal && <span className="italic truncate max-w-[140px]">&bull; {study.journal}</span>}
                    </div>

                    {/* Abstract preview */}
                    {study.abstract && (
                      <p className="text-[11px] text-slate-500 line-clamp-3 mt-2.5 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                        {study.abstract}
                      </p>
                    )}

                    {/* Integrity Hash */}
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded truncate">
                      <Hash className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{study.documentHashSha256}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {studyAss.length > 0 ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {studyAss.length} vurdering{studyAss.length > 1 ? 'er' : ''} registrert
                        </span>
                      ) : (
                        <span className="text-slate-400">Ikke vurdert ennå</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectStudy(study.id);
                          onOpenAppraisal(study.id, 'JBI_QUALITATIVE');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>JBI Vurdering</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
