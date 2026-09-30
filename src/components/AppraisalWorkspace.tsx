import React, { useState } from 'react';
import { 
  AppraisalAssessment, 
  AppraisalDomain, 
  AppraisalInstrument, 
  RatingAnswer, 
  ReviewerProfile, 
  StudyRecord 
} from '../types';
import { 
  getFrameworkDomains 
} from '../utils/frameworks';
import { 
  validateStudyAppraisalLock, 
  AppraisalLockValidationResult 
} from '../utils/appraisalLockValidator';
import { 
  evaluateAmstar2OverallConfidence, 
  calculateFleissKappa,
  evaluateAgree2DomainScores 
} from '../utils/statistics';
import { ScreeningGateService } from '../services/screeningGateService';
import { MasterInstrumentRegistryService } from '../services/masterInstrumentRegistry';
import { EvidenceTraceabilityService } from '../services/evidenceTraceabilityService';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Award, 
  Lock, 
  ShieldCheck, 
  Check, 
  Users2, 
  Quote, 
  GitCompare, 
  Plus, 
  Trash2, 
  Scale, 
  UserCheck, 
  Eye, 
  Info,
  Layers,
  CheckCheck,
  Palette,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquareQuote,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Filter,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { getDomainColorByDomainId } from '../utils/domainColors';
import { DomainEvidenceTooltip, OtherReviewerRatingInfo } from './DomainEvidenceTooltip';

interface AppraisalWorkspaceProps {
  study: StudyRecord;
  activeInstrument: AppraisalInstrument;
  reviewers: ReviewerProfile[];
  assessments: AppraisalAssessment[];
  onUpdateAssessment: (assessment: AppraisalAssessment) => void;
  onLockStudy: (studyId: string) => void;
  onOpenDualComparison: () => void;
  onOpenReliabilityReport?: () => void;
  onOpenCitationModal?: () => void;
  onOpenKnowledgeBase?: () => void;
  onSelectDomainForViewer?: (domainId: string) => void;
  onRunAutoScan?: () => void;
}

export const AppraisalWorkspace: React.FC<AppraisalWorkspaceProps> = ({
  study,
  activeInstrument,
  reviewers,
  assessments,
  onUpdateAssessment,
  onLockStudy,
  onOpenDualComparison,
  onOpenReliabilityReport,
  onOpenCitationModal,
  onOpenKnowledgeBase,
  onSelectDomainForViewer,
  onRunAutoScan
}) => {
  const domains = getFrameworkDomains(activeInstrument);
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const [selectedReviewerIndex, setSelectedReviewerIndex] = useState<number>(0);
  const [showAddReviewerDropdown, setShowAddReviewerDropdown] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'conflicts' | 'unanswered' | 'critical'>('all');
  const [isConflictHighlighterActive, setIsConflictHighlighterActive] = useState<boolean>(true);
  const [activeConflictIndex, setActiveConflictIndex] = useState<number>(0);
  const [lockValidationModal, setLockValidationModal] = useState<AppraisalLockValidationResult | null>(null);
  const [showConfirmSeal, setShowConfirmSeal] = useState<boolean>(false);

  // Filter assessments for this active instrument and study
  const currentAssessments = assessments.filter(
    a => a.studyId === study.id && a.instrument === activeInstrument
  );

  // Ensure there is at least one active assessment
  const activeAssessment: AppraisalAssessment = currentAssessments[selectedReviewerIndex] || currentAssessments[0] || {
    id: `assess-${activeInstrument.toLowerCase()}-${Date.now()}-primary`,
    studyId: study.id,
    instrument: activeInstrument,
    reviewerId: reviewers[0]?.id || 'rev-sarah',
    reviewerName: reviewers[0]?.name || 'Dr. Sarah Lindqvist',
    reviewerRole: reviewers[0]?.role || 'Lead Reviewer',
    ratings: {},
    updatedAt: new Date().toISOString()
  };

  // Validate Screening Gate for canonical appraisal workflow
  const gateResult = React.useMemo(() => {
    return ScreeningGateService.validateScreeningGate(study, activeInstrument, {
      reviewerId: activeAssessment.reviewerId
    });
  }, [study, activeInstrument, activeAssessment.reviewerId]);

  const instrumentEntry = MasterInstrumentRegistryService.getByCode(activeInstrument);
  const isPartiallyImplemented = instrumentEntry?.implementationStatus === 'PARTIALLY_IMPLEMENTED';

  // Calculate live statistics for Multi-Rater panel
  const multiRaterStats = currentAssessments.length >= 2
    ? calculateFleissKappa(currentAssessments, domains, reviewers)
    : null;

  // Calculate live statistics for AMSTAR 2
  const amstarEvaluation = activeInstrument === 'AMSTAR2' 
    ? evaluateAmstar2OverallConfidence(activeAssessment.ratings, domains)
    : null;

  // Calculate AGREE II domain scores
  const agree2Evaluation = activeInstrument === 'AGREE2'
    ? evaluateAgree2DomainScores(activeAssessment.ratings)
    : null;

  // Compute Domain Conflicts & Discrepancies across all reviewers
  const domainConflictMap = React.useMemo(() => {
    const map = new Map<string, {
      isConflict: boolean;
      distinctAnswers: RatingAnswer[];
      ratersInfo: OtherReviewerRatingInfo[];
      isUnanswered: boolean;
    }>();

    for (const d of domains) {
      const answers: RatingAnswer[] = [];
      const ratersInfo: OtherReviewerRatingInfo[] = [];

      for (const ass of currentAssessments) {
        const rating = ass.ratings[d.id];
        const rProfile = reviewers.find(r => r.id === ass.reviewerId || r.name === ass.reviewerName);
        
        if (rating?.answer && rating.answer !== 'unclear') {
          answers.push(rating.answer);
        }

        ratersInfo.push({
          reviewerId: ass.reviewerId,
          reviewerName: ass.reviewerName,
          reviewerRole: ass.reviewerRole,
          avatarColor: rProfile?.avatarColor || 'bg-indigo-600',
          answer: rating?.answer || 'unclear',
          rationale: rating?.rationale,
          verifiedByResearcher: rating?.verifiedByResearcher
        });
      }

      const distinct = Array.from(new Set(answers));
      const hasConflict = distinct.length > 1;
      const isUnanswered = !activeAssessment.ratings[d.id]?.answer;

      map.set(d.id, {
        isConflict: hasConflict,
        distinctAnswers: distinct,
        ratersInfo,
        isUnanswered
      });
    }

    return map;
  }, [domains, currentAssessments, activeAssessment.ratings, reviewers]);

  // List of conflicting domains for quick navigation
  const conflictingDomains = React.useMemo(() => {
    return domains.filter(d => domainConflictMap.get(d.id)?.isConflict);
  }, [domains, domainConflictMap]);

  const unansweredCount = domains.filter(d => domainConflictMap.get(d.id)?.isUnanswered).length;
  const criticalCount = domains.filter(d => d.isCritical).length;

  // Filtered domains based on current filter mode
  const displayedDomains = React.useMemo(() => {
    switch (filterMode) {
      case 'conflicts':
        return domains.filter(d => domainConflictMap.get(d.id)?.isConflict);
      case 'unanswered':
        return domains.filter(d => domainConflictMap.get(d.id)?.isUnanswered);
      case 'critical':
        return domains.filter(d => d.isCritical);
      case 'all':
      default:
        return domains;
    }
  }, [domains, filterMode, domainConflictMap]);

  const handleJumpToConflict = (direction: 'next' | 'prev') => {
    if (conflictingDomains.length === 0) return;
    let nextIdx = direction === 'next' ? activeConflictIndex + 1 : activeConflictIndex - 1;
    if (nextIdx >= conflictingDomains.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = conflictingDomains.length - 1;
    
    setActiveConflictIndex(nextIdx);
    const targetDomain = conflictingDomains[nextIdx];
    if (targetDomain) {
      const el = document.getElementById(`domain-card-${targetDomain.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-rose-500', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-rose-500');
        }, 1500);
      }
    }
  };

  const handleJumpToDomain = (domainId: string) => {
    const el = document.getElementById(`domain-card-${domainId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-blue-500', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-500');
      }, 1500);
    }
  };

  const handleRatingChange = (domainId: string, answer: RatingAnswer) => {
    if (study.isLocked || !gateResult.canAppraise) return;

    const existingRating = activeAssessment.ratings[domainId] || {
      answer: 'unclear',
      rationale: '',
      verifiedByResearcher: false,
      timestamp: new Date().toISOString()
    };

    const updatedRatings = {
      ...activeAssessment.ratings,
      [domainId]: {
        ...existingRating,
        answer,
        timestamp: new Date().toISOString()
      }
    };

    const updatedAssessment: AppraisalAssessment = {
      ...activeAssessment,
      ratings: updatedRatings,
      updatedAt: new Date().toISOString(),
      overallConfidence: amstarEvaluation?.overallConfidence
    };

    onUpdateAssessment(updatedAssessment);
  };

  const handleRationaleChange = (domainId: string, rationale: string) => {
    if (study.isLocked || !gateResult.canAppraise) return;

    const existingRating = activeAssessment.ratings[domainId] || {
      answer: 'unclear',
      rationale: '',
      verifiedByResearcher: false,
      timestamp: new Date().toISOString()
    };

    const updatedRatings = {
      ...activeAssessment.ratings,
      [domainId]: {
        ...existingRating,
        rationale,
        timestamp: new Date().toISOString()
      }
    };

    const updatedAssessment: AppraisalAssessment = {
      ...activeAssessment,
      ratings: updatedRatings,
      updatedAt: new Date().toISOString()
    };

    onUpdateAssessment(updatedAssessment);
  };

  const handleToggleVerified = (domainId: string) => {
    if (study.isLocked || !gateResult.canAppraise) return;

    const existingRating = activeAssessment.ratings[domainId] || {
      answer: 'unclear',
      rationale: '',
      verifiedByResearcher: false,
      timestamp: new Date().toISOString()
    };

    const updatedRatings = {
      ...activeAssessment.ratings,
      [domainId]: {
        ...existingRating,
        verifiedByResearcher: !existingRating.verifiedByResearcher,
        timestamp: new Date().toISOString()
      }
    };

    const updatedAssessment: AppraisalAssessment = {
      ...activeAssessment,
      ratings: updatedRatings,
      updatedAt: new Date().toISOString()
    };

    onUpdateAssessment(updatedAssessment);
  };

  const handleAddReviewerAssessment = (revProfile: ReviewerProfile) => {
    const existingIndex = currentAssessments.findIndex(a => a.reviewerId === revProfile.id || a.reviewerName === revProfile.name);
    if (existingIndex >= 0) {
      setSelectedReviewerIndex(existingIndex);
      setShowAddReviewerDropdown(false);
      return;
    }

    const newAssessment: AppraisalAssessment = {
      id: `assess-${activeInstrument.toLowerCase()}-${Date.now()}-${revProfile.id}`,
      studyId: study.id,
      instrument: activeInstrument,
      reviewerId: revProfile.id,
      reviewerName: revProfile.name,
      reviewerRole: revProfile.role,
      ratings: {},
      updatedAt: new Date().toISOString()
    };

    onUpdateAssessment(newAssessment);
    setSelectedReviewerIndex(currentAssessments.length);
    setShowAddReviewerDropdown(false);
  };

  // Progress metrics
  const completedQuestions = Object.keys(activeAssessment.ratings).filter(k => !!activeAssessment.ratings[k]?.answer).length;
  const totalQuestions = domains.length;
  const completionPercentage = Math.round((completedQuestions / (totalQuestions || 1)) * 100);

  const unassignedReviewers = reviewers.filter(r => 
    !currentAssessments.some(a => a.reviewerId === r.id || a.reviewerName === r.name)
  );

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      
      {/* Unified Professional Workspace Header */}
      <div className="bg-slate-900 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 border-b border-slate-800">
        
        {/* Left: Framework, Seal & Reviewer Tabs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-tight text-white flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>{activeInstrument}</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
              study.isLocked ? 'bg-emerald-600 text-white' : 'bg-blue-600/90 text-white'
            }`}>
              {study.isLocked ? 'FORSEGLET' : 'AKTIV'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-750 hidden sm:block" />

          {/* Reviewer Selector Ribbon */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {currentAssessments.map((ass, idx) => {
              const profile = reviewers.find(r => r.id === ass.reviewerId || r.name === ass.reviewerName);
              const isSelected = selectedReviewerIndex === idx;
              const initials = ass.reviewerName.split(' ').map(n => n[0]).join('').substring(0, 2);

              return (
                <button
                  key={ass.id || idx}
                  id={`reviewer-tab-${idx}`}
                  onClick={() => setSelectedReviewerIndex(idx)}
                  className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`${ass.reviewerName} (${ass.reviewerRole})`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${profile?.avatarColor || 'bg-blue-500'}`}>
                    {initials}
                  </span>
                  <span className="truncate max-w-[110px]">{ass.reviewerName.replace(/\s\(.*\)/, '')}</span>
                  {ass.isConsensus && (
                    <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded font-mono font-bold">
                      KONSENSUS
                    </span>
                  )}
                </button>
              );
            })}

            {unassignedReviewers.length > 0 && (
              <div className="relative">
                <button
                  id="add-reviewer-assessment-btn"
                  onClick={() => setShowAddReviewerDropdown(!showAddReviewerDropdown)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-dashed border-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Legg til en ekstra bedømmer fra forskningspanelet (opptil 8)"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span className="hidden md:inline">Legg til</span>
                </button>

                {showAddReviewerDropdown && (
                  <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-2 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 mb-1 border-b border-slate-800">
                      Velg forsker for uavhengig vurdering:
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {unassignedReviewers.map(rev => (
                        <button
                          key={rev.id}
                          onClick={() => handleAddReviewerAssessment(rev)}
                          className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <div className={`w-5 h-5 rounded-full ${rev.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-[9px] font-bold`}>
                            {rev.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{rev.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{rev.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {multiRaterStats && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
              <span className="text-slate-400">κ:</span>
              <span className="font-bold text-blue-400">{multiRaterStats.fleissKappa.toFixed(2)}</span>
              <span className="text-emerald-400 font-sans text-[10px]">({multiRaterStats.unanimityPercentage}%)</span>
            </div>
          )}
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1.5">
          {onRunAutoScan && (
            <button
              onClick={onRunAutoScan}
              className="px-2 py-1 text-xs font-semibold text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/40 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Kjør fulltekst evidens-skanning for dette skjemaet"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Autoskann</span>
            </button>
          )}

          {onOpenKnowledgeBase && (
            <button
              onClick={onOpenKnowledgeBase}
              className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Åpne Metodeguide & Hjelpesenter"
            >
              <BookOpen className="w-3 h-3 text-blue-400" />
              <span className="hidden md:inline">Metode</span>
            </button>
          )}

          {onOpenCitationModal && (
            <button
              onClick={onOpenCitationModal}
              title="Sitér artikkel (APA 7, Vancouver, BibTeX)"
              className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Quote className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Sitér</span>
            </button>
          )}

          {onOpenReliabilityReport && (
            <button
              id="workspace-reliability-btn"
              onClick={onOpenReliabilityReport}
              className="px-2 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Åpne prosjektets Cohen's Kappa & Inter-Rater Reliabilitetsrapport"
            >
              <Scale className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Reliabilitet</span>
            </button>
          )}

          {/* Multi-Rater Consensus Panel Button */}
          <button
            id="open-multi-consensus-matrix-btn"
            onClick={onOpenDualComparison}
            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Åpne Fleiss' Kappa & Fler-bedømmer konsensuspanel"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Konsensus</span>
            <span className="bg-blue-950 px-1 py-0.2 rounded text-[10px] font-mono text-blue-300">
              {currentAssessments.length || 2}
            </span>
          </button>
        </div>
      </div>

      {/* Partially Implemented Notice Banner */}
      {isPartiallyImplemented && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Delvis implementert instrument (PARTIALLY_IMPLEMENTED): </span>
              <span>{instrumentEntry?.methodologicalCaveat}</span>
            </div>
          </div>
          <span className="bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
            Delvis Implementert
          </span>
        </div>
      )}

      {/* Screening Gate Advisory / Blocking Banner */}
      {!gateResult.canAppraise && (
        <div className="bg-rose-50 border-b border-rose-300 px-4 py-2 flex items-center justify-between gap-3 text-xs text-rose-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Metodisk Forhåndskontroll (Screening Gate Blokkert): </span>
              <span>{gateResult.blockers.join('. ')}</span>
            </div>
          </div>
          <span className="bg-rose-200 border border-rose-300 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
            Vurdering Blokkert
          </span>
        </div>
      )}

      {/* Streamlined Filter & Domain Map Navigation Strip */}
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
        
        {/* Left: Filter Controls & Conflict Highlighting */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-white rounded-md p-0.5 border border-slate-200 shadow-2xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Alle ({domains.length})
            </button>
            <button
              onClick={() => setFilterMode('conflicts')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'conflicts'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : conflictingDomains.length > 0
                  ? 'text-rose-700 hover:bg-rose-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Konflikter ({conflictingDomains.length})</span>
            </button>
            <button
              onClick={() => setFilterMode('unanswered')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'unanswered'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Ubesvarte ({unansweredCount})
            </button>
            <button
              onClick={() => setFilterMode('critical')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                filterMode === 'critical'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Kritiske ({criticalCount})
            </button>
          </div>

          <button
            id="toggle-conflict-highlighter-btn"
            onClick={() => setIsConflictHighlighterActive(!isConflictHighlighterActive)}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              isConflictHighlighterActive
                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Slå av/på markering av uoverensstemmelser mellom vurderere"
          >
            <Highlighter className={`w-3 h-3 ${isConflictHighlighterActive ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Konflikt-lys</span>
          </button>

          {conflictingDomains.length > 0 && (
            <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              <button
                onClick={() => handleJumpToConflict('prev')}
                className="p-0.5 hover:bg-slate-100 text-slate-700 rounded transition-colors cursor-pointer"
                title="Forrige uoverensstemmelse"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-700 px-0.5">
                {activeConflictIndex + 1}/{conflictingDomains.length}
              </span>
              <button
                onClick={() => handleJumpToConflict('next')}
                className="p-0.5 hover:bg-slate-100 text-slate-700 rounded transition-colors cursor-pointer"
                title="Neste uoverensstemmelse"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Inline Quick-Map Indicator Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[420px] custom-scrollbar">
          {domains.map((dom) => {
            const conflictInfo = domainConflictMap.get(dom.id);
            const isConf = conflictInfo?.isConflict || false;
            const myRating = activeAssessment.ratings[dom.id];
            const isAns = !!myRating?.answer;
            const matchFinding = study.findings?.find(f => f.domainId === dom.id);
            const otherRaters = conflictInfo?.ratersInfo.filter(r => r.reviewerId !== activeAssessment.reviewerId) || [];

            let badgeStyle = 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300';
            if (isConf && isConflictHighlighterActive) {
              badgeStyle = 'bg-rose-600 text-white font-bold ring-1 ring-rose-400 border-rose-700';
            } else if (isAns) {
              badgeStyle = 'bg-emerald-600 text-white font-bold border-emerald-700';
            } else if (dom.isCritical) {
              badgeStyle = 'bg-amber-100 text-amber-900 font-bold border-amber-300';
            }

            return (
              <DomainEvidenceTooltip
                key={dom.id}
                domain={dom}
                activeReviewerName={activeAssessment.reviewerName}
                rating={myRating}
                matchingFinding={matchFinding}
                otherRatings={otherRaters}
                isConflict={isConf}
                preferredPosition="bottom"
              >
                <button
                  onClick={() => handleJumpToDomain(dom.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] transition-all border cursor-pointer ${badgeStyle}`}
                  title={`Q${dom.number}: ${dom.title}`}
                >
                  {dom.number}
                </button>
              </DomainEvidenceTooltip>
            );
          })}
        </div>

      </div>

      {/* AMSTAR 2 Overall Confidence Banner */}
      {amstarEvaluation && (
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">AMSTAR 2 Tillitsgrad:</span>
            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
              amstarEvaluation.overallConfidence === 'High'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : amstarEvaluation.overallConfidence === 'Moderate'
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : amstarEvaluation.overallConfidence === 'Low'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {amstarEvaluation.overallConfidence} Confidence ({amstarEvaluation.scorePercentage}%)
            </span>
          </div>

          {amstarEvaluation.criticalFlawsCount > 0 && (
            <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {amstarEvaluation.criticalFlawsCount} Kritiske metodologiske mangler
            </span>
          )}
        </div>
      )}

      {/* AGREE II Domain Scores Summary Strip */}
      {agree2Evaluation && (
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>AGREE II Standardiserte domeneskår (%):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Beregnet etter offisiell AGREE II formel</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {agree2Evaluation.domains.map(ds => (
              <div key={ds.domainKey} className="bg-white p-2 rounded border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">{ds.domainKey}</div>
                <div className={`text-sm font-black ${
                  ds.standardizedPercentage >= 70 ? 'text-emerald-700' : ds.standardizedPercentage >= 50 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {ds.standardizedPercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Questions List */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {displayedDomains.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Ingen spørsmål matcher filteret</h4>
            <p className="text-xs text-slate-500 mt-1">
              {filterMode === 'conflicts'
                ? 'Det er ingen uoverensstemmelser mellom bedømmerne for dette skjemaet! Full enstemmighet.'
                : 'Alle spørsmål i denne kategorien er behandlet.'}
            </p>
            <button
              onClick={() => setFilterMode('all')}
              className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Vis alle spørsmål ({domains.length})
            </button>
          </div>
        ) : (
          displayedDomains.map((domain) => {
            const rating = activeAssessment.ratings[domain.id];
            const isExpanded = expandedDomainId === domain.id;
            const isRated = !!rating?.answer;
            const isVerified = rating?.verifiedByResearcher || false;
            const palette = getDomainColorByDomainId(domain.id);

            // Find finding if already scanned in study
            const matchingFinding = study.findings?.find(f => f.domainId === domain.id);

            // Conflict and other raters info
            const conflictInfo = domainConflictMap.get(domain.id);
            const isConflict = conflictInfo?.isConflict || false;
            const otherRaters = conflictInfo?.ratersInfo.filter(r => r.reviewerId !== activeAssessment.reviewerId) || [];

            // Card highlight styling when conflict highlighter is active
            const cardHighlightStyle = isConflict && isConflictHighlighterActive
              ? 'bg-rose-50/30 border-rose-300 ring-2 ring-rose-400/70 shadow-sm'
              : isRated && isVerified
              ? 'bg-emerald-50/20 border-slate-200'
              : domain.isCritical
              ? 'bg-amber-50/20 border-slate-200'
              : 'bg-white border-slate-200';

            return (
              <div
                key={domain.id}
                id={`domain-card-${domain.id}`}
                style={{ borderLeftColor: isConflict && isConflictHighlighterActive ? '#f43f5e' : palette.hex, borderLeftWidth: '5px' }}
                className={`p-4 rounded-r-lg border shadow-2xs transition-all relative ${cardHighlightStyle}`}
              >
                {/* Question Header with Integrated Evidence Tooltip */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      
                      {/* Interactive Q-Badge with Tooltip */}
                      <DomainEvidenceTooltip
                        domain={domain}
                        activeReviewerName={activeAssessment.reviewerName}
                        rating={rating}
                        matchingFinding={matchingFinding}
                        otherRatings={otherRaters}
                        isConflict={isConflict}
                      >
                        <span 
                          style={{ backgroundColor: palette.hex }}
                          className="text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase cursor-help hover:opacity-90 shadow-2xs flex items-center gap-1"
                          title="Hold over for sitat & begrunnelse"
                        >
                          <span>{activeInstrument} Q{domain.number}</span>
                        </span>
                      </DomainEvidenceTooltip>

                      <span className="text-[11px] font-bold text-slate-700">
                        {domain.title}
                      </span>

                      {/* Conflict Badge with Direct Visual Indicator */}
                      {isConflict && (
                        <DomainEvidenceTooltip
                          domain={domain}
                          activeReviewerName={activeAssessment.reviewerName}
                          rating={rating}
                          matchingFinding={matchingFinding}
                          otherRatings={otherRaters}
                          isConflict={true}
                        >
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 cursor-help animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Uoverensstemmelse ({conflictInfo?.distinctAnswers.length} svar)</span>
                          </span>
                        </DomainEvidenceTooltip>
                      )}

                      {domain.isCritical && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-900 border border-rose-300">
                          Kritisk domene
                        </span>
                      )}

                      {isVerified && (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Verifisert mot tekst
                        </span>
                      )}

                      {/* Instant Rationale & Quote Summary Chip (Interactive Tooltip Trigger) */}
                      <DomainEvidenceTooltip
                        domain={domain}
                        activeReviewerName={activeAssessment.reviewerName}
                        rating={rating}
                        matchingFinding={matchingFinding}
                        otherRatings={otherRaters}
                        isConflict={isConflict}
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 cursor-help transition-all ${
                          rating?.rationale || matchingFinding?.excerpt
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}>
                          <MessageSquareQuote className="w-3 h-3 text-blue-600" />
                          <span>
                            {rating?.rationale ? 'Begrunnelse registrert' : matchingFinding?.excerpt ? 'Kildesitat funnet' : 'Hurtigvisning'}
                          </span>
                        </span>
                      </DomainEvidenceTooltip>

                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {domain.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {onSelectDomainForViewer && (
                      <button
                        onClick={() => onSelectDomainForViewer(domain.id)}
                        className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        title="Finn og fargekod svar i artikkel"
                      >
                        <Palette className="w-3 h-3" />
                        <span className="hidden sm:inline">Vis i tekst</span>
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedDomainId(isExpanded ? null : domain.id)}
                      className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0 rounded hover:bg-slate-100 cursor-pointer"
                      title="Veiledningskriterier og metodisk forklaring"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prominent Conflict Highlighter Banner */}
                {isConflict && isConflictHighlighterActive && (
                  <div className="mt-2.5 p-2.5 bg-rose-50/90 border border-rose-200 rounded-lg flex flex-wrap items-center justify-between gap-2 animate-fade-in">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Uoverensstemmelse mellom vurderere</span>
                          <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-mono font-bold">
                            {conflictInfo?.distinctAnswers.length} ulike svar
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {conflictInfo?.ratersInfo.map((rInfo) => (
                            <span 
                              key={rInfo.reviewerId || rInfo.reviewerName}
                              className="text-[10px] bg-white border border-rose-200 rounded px-1.5 py-0.5 text-slate-800 flex items-center gap-1 shadow-2xs"
                            >
                              <span className={`w-3.5 h-3.5 rounded-full ${rInfo.avatarColor || 'bg-indigo-600'} text-[8px] text-white flex items-center justify-center font-bold`}>
                                {rInfo.reviewerName.substring(0, 2).toUpperCase()}
                              </span>
                              <span className="font-medium text-slate-700">{rInfo.reviewerName.split(' ')[0]}:</span>
                              <strong className="uppercase font-bold text-slate-900">
                                {rInfo.answer === 'unclear' ? 'Ubesvart' : rInfo.answer.replace('_', ' ')}
                              </strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenDualComparison}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      title="Åpne felles konsensuspanel for å harmonisere dette domenet"
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>Løs i konsensus</span>
                    </button>
                  </div>
                )}

                {/* Guidance / Description Accordion */}
                {isExpanded && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200 space-y-2 animate-fade-in">
                    <p className="font-medium leading-relaxed">{domain.description}</p>
                    {domain.guidanceCriteria && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Offisielle vurderingskriterier:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-800">
                          {domain.guidanceCriteria.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {matchingFinding && (
                      <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-950">
                        <span className="font-bold text-[10px] uppercase tracking-wider block text-amber-800">
                          Funnet i artikkel ({matchingFinding.sectionOrPage}):
                        </span>
                        <p className="italic font-serif text-xs mt-0.5">"{matchingFinding.excerpt}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating Button Selection */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 mr-1">Vurdering:</span>
                  {domain.allowedAnswers.map((ans) => {
                    const isSelected = rating?.answer === ans;
                    return (
                      <button
                        key={ans}
                        id={`rating-btn-${domain.id}-${ans}`}
                        type="button"
                        disabled={study.isLocked || !gateResult.canAppraise}
                        onClick={() => handleRatingChange(domain.id, ans)}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-all disabled:opacity-50 cursor-pointer ${
                          isSelected
                            ? ans === 'yes' || ans === 'low' || ans === '7' || ans === '6' || ans === 'ja'
                              ? 'bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-600'
                              : ans === 'partial' || ans === 'some_concerns' || ans === '5' || ans === '4' || ans === 'delvis'
                              ? 'bg-amber-500 text-white shadow-xs font-black ring-2 ring-amber-500'
                              : ans === 'no' || ans === 'high' || ans === '1' || ans === '2' || ans === 'nei'
                              ? 'bg-rose-600 text-white shadow-xs font-black ring-2 ring-rose-600'
                              : 'bg-slate-800 text-white shadow-xs font-black'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ans === '7' ? '7 (Sterkt enig)' : ans === '1' ? '1 (Sterkt uenig)' : ans.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>

                {/* Researcher Rationale & Quote Box */}
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      id={`rationale-input-${domain.id}`}
                      disabled={study.isLocked || !gateResult.canAppraise}
                      value={rating?.rationale || ''}
                      onChange={(e) => handleRationaleChange(domain.id, e.target.value)}
                      placeholder="Metodisk begrunnelse, sitat fra artikkel eller sidetall..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600 italic text-slate-800 disabled:opacity-50"
                    />
                  </div>

                  {/* Evidence Traceability Quote Verification Indicator */}
                  {rating?.rationale && rating.rationale.trim().length >= 6 && study.rawContent && (() => {
                    const quoteVer = EvidenceTraceabilityService.verifyQuote(study.rawContent, rating.rationale);
                    return (
                      <div className={`p-1.5 rounded text-[11px] flex items-center justify-between gap-1.5 border ${
                        quoteVer.matchType === 'EXACT_MATCH'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : quoteVer.matchType === 'NORMALIZED_MATCH'
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : quoteVer.matchType === 'FUZZY_MATCH'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {quoteVer.isVerified ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          )}
                          <span className="font-semibold">
                            {quoteVer.matchType === 'EXACT_MATCH' && 'Eksakt sitat verifisert i artikkel'}
                            {quoteVer.matchType === 'NORMALIZED_MATCH' && 'Sitat verifisert (normalisert)'}
                            {quoteVer.matchType === 'FUZZY_MATCH' && `Sitat delvis funnet (${Math.round(quoteVer.confidence * 100)}% tekstsamsvar)`}
                            {quoteVer.matchType === 'NOT_FOUND' && 'Sitatet ble ikke gjenfunnet i kildeteksten'}
                          </span>
                        </div>
                        {quoteVer.detectedPage && (
                          <span className="font-mono text-[10px] opacity-75">
                            ca. side {quoteVer.detectedPage} av {quoteVer.totalEstimatedPages}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id={`verify-checkbox-${domain.id}`}
                        disabled={study.isLocked || !gateResult.canAppraise}
                        checked={rating?.verifiedByResearcher || false}
                        onChange={() => handleToggleVerified(domain.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="font-semibold">Verifisert mot kildetekst</span>
                    </label>

                    {rating?.timestamp && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Logget {new Date(rating.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Bottom Finalize / Action Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex-1 min-w-[180px]">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Fremdrift ({activeAssessment.reviewerName.split(' ')[0]})</span>
            <span>{completedQuestions} / {totalQuestions} ({completionPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!study.isLocked ? (
            <button
              id="lock-study-assessment-btn"
              disabled={study.isLocked || !gateResult.canAppraise || isPartiallyImplemented}
              onClick={() => {
                if (!gateResult.canAppraise || isPartiallyImplemented) return;
                const result = validateStudyAppraisalLock(study, activeAssessment, domains);
                if (!result.canLock) {
                  setLockValidationModal(result);
                } else {
                  setShowConfirmSeal(true);
                }
              }}
              title={
                isPartiallyImplemented
                  ? 'Forsegling er blokkert: Instrumentet er PARTIALLY_IMPLEMENTED'
                  : !gateResult.canAppraise
                  ? `Forsegling er blokkert av Screening Gate: ${gateResult.blockers.join('; ')}`
                  : 'Forsegl og lås vurdering med SHA-256'
              }
              className={`font-bold text-xs py-2 px-4 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                !gateResult.canAppraise || isPartiallyImplemented
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Forsegl Vurdering (SHA-256)</span>
            </button>
          ) : (
            <div className="bg-slate-800 text-emerald-400 font-mono text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Forseglet av {study.lockedBy || 'Lead Reviewer'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Methodological Lock Validation Gate Modal */}
      {lockValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Metodisk Integritetslås: Forsegling Avvist</span>
              </div>
              <button
                onClick={() => setLockValidationModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Lukk
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vurderingen kan ikke forsegles ennå fordi obligatoriske metodiske eller vitenskapelige krav ikke er oppfylt. Forsegling (Lock) er en ugjenkallelig integritetsfunksjon som krever fullført faglig grunnlag.
            </p>

            <div className="space-y-2 bg-red-950/40 border border-red-900/60 rounded-lg p-3.5">
              <span className="text-xs font-bold text-red-300 block uppercase tracking-wider">
                Mangler som blokkerer forsegling ({lockValidationModal.blockers.length}):
              </span>
              <ul className="space-y-1.5 text-xs text-red-200">
                {lockValidationModal.blockers.map((blocker, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">&bull;</span>
                    <span>{blocker}</span>
                  </li>
                ))}
              </ul>
            </div>

            {lockValidationModal.warnings.length > 0 && (
              <div className="space-y-1 bg-amber-950/30 border border-amber-900/40 rounded-lg p-3 text-xs text-amber-200">
                <span className="font-bold text-amber-300 block">Advarsler:</span>
                {lockValidationModal.warnings.map((warn, i) => (
                  <p key={i}>&bull; {warn}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className={lockValidationModal.metrics.hasValidDesign ? 'text-emerald-400' : 'text-red-400'}>
                  {lockValidationModal.metrics.hasValidDesign ? '✓' : '✗'}
                </span>
                <span className="text-slate-400">Validert studiedesign:</span>
                <span className="text-white font-medium">{study.documentType || 'Mangler'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={lockValidationModal.metrics.humanVerified ? 'text-emerald-400' : 'text-red-400'}>
                  {lockValidationModal.metrics.humanVerified ? '✓' : '✗'}
                </span>
                <span className="text-slate-400">Human Verification:</span>
                <span className="text-white font-medium">{lockValidationModal.metrics.humanVerified ? 'Bekreftet' : 'Mangler'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={lockValidationModal.metrics.criticalItemsAnswered ? 'text-emerald-400' : 'text-red-400'}>
                  {lockValidationModal.metrics.criticalItemsAnswered ? '✓' : '✗'}
                </span>
                <span className="text-slate-400">Kritiske domener:</span>
                <span className="text-white font-medium">{lockValidationModal.metrics.criticalItemsAnswered ? 'Alle besvart' : 'Ufullstendig'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={lockValidationModal.metrics.provenanceValid ? 'text-emerald-400' : 'text-red-400'}>
                  {lockValidationModal.metrics.provenanceValid ? '✓' : '✗'}
                </span>
                <span className="text-slate-400">Kryptografisk SHA-256:</span>
                <span className="text-white font-mono">{study.documentHashSha256 ? 'OK' : 'Mangler'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setLockValidationModal(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Gå tilbake og fullfør vurderingen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Seal Modal */}
      {showConfirmSeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-blue-500/60 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>Bekreft Kryptografisk Forsegling (SHA-256)</span>
              </div>
              <button
                onClick={() => setShowConfirmSeal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Avbryt
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Er du sikker på at du vil forsegle denne studien? Forsegling låser vurderingen og oppretter en uforanderlig revisjonslogg med SHA-256-signatur i henhold til Cochrane/WHO-standarder.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1.5">
              <div><span className="text-slate-400">Studie:</span> <span className="text-white font-semibold">{study.title.substring(0, 50)}...</span></div>
              <div><span className="text-slate-400">Instrument:</span> <span className="text-blue-300">{activeInstrument}</span></div>
              <div><span className="text-slate-400">Vurderer:</span> <span className="text-emerald-300">{activeAssessment.reviewerName}</span></div>
              <div><span className="text-slate-400">SHA-256:</span> <span className="text-slate-300 break-all">{study.documentHashSha256}</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSeal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Avbryt
              </button>
              <button
                id="confirm-seal-btn"
                onClick={() => {
                  setShowConfirmSeal(false);
                  onLockStudy(study.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ja, forsegl og lås studien</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
