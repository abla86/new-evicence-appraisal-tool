import React, { useState } from 'react';
import { 
  AppraisalAssessment, 
  AppraisalInstrument, 
  DomainRating,
  MultiRaterComparison, 
  MultiRaterDomainRow, 
  RatingAnswer, 
  ReviewerProfile, 
  StudyRecord 
} from '../types';
import { getFrameworkDomains } from '../utils/frameworks';
import { calculateFleissKappa } from '../utils/statistics';
import { 
  Users2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Scale, 
  Lock,
  ArrowRight,
  HelpCircle,
  Sparkles,
  UserCheck,
  Check,
  Filter,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Table,
  Zap,
  Award,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MultiReviewerComparisonProps {
  study: StudyRecord;
  instrument: AppraisalInstrument;
  assessments: AppraisalAssessment[];
  reviewers: ReviewerProfile[];
  onSaveConsensus: (consensusAssessment: AppraisalAssessment) => void;
  onClose: () => void;
}

export const MultiReviewerComparison: React.FC<MultiReviewerComparisonProps> = ({
  study,
  instrument,
  assessments,
  reviewers,
  onSaveConsensus,
  onClose
}) => {
  const domains = getFrameworkDomains(instrument);
  const relevantAssessments = assessments.filter(a => a.instrument === instrument);

  // Ensure we have active assessments matched to reviewer profiles (minimum 2, up to 8)
  const activeAssessments: AppraisalAssessment[] = relevantAssessments.length > 0
    ? relevantAssessments
    : [
        {
          id: `assess-${instrument.toLowerCase()}-1`,
          studyId: study.id,
          instrument,
          reviewerId: reviewers[0]?.id || 'rev-sarah',
          reviewerName: reviewers[0]?.name || 'Dr. Sarah Lindqvist',
          reviewerRole: reviewers[0]?.role || 'Lead Reviewer',
          ratings: {},
          updatedAt: new Date().toISOString()
        },
        {
          id: `assess-${instrument.toLowerCase()}-2`,
          studyId: study.id,
          instrument,
          reviewerId: reviewers[1]?.id || 'rev-marcus',
          reviewerName: reviewers[1]?.name || 'Dr. Marcus Vance',
          reviewerRole: reviewers[1]?.role || 'Independent Reviewer',
          ratings: {},
          updatedAt: new Date().toISOString()
        }
      ];

  // Calculate Fleiss Multi-Rater Kappa & Pairwise statistics
  const stats: MultiRaterComparison = calculateFleissKappa(activeAssessments, domains, reviewers);

  // Active view tab: 'matrix' | 'discrepancies' | 'pairwise'
  const [activeTab, setActiveTab] = useState<'matrix' | 'discrepancies' | 'pairwise'>('discrepancies');
  const [filterMode, setFilterMode] = useState<'all' | 'split_majority' | 'split_only' | 'critical'>('all');
  const [arbiterName, setArbiterName] = useState<string>(
    reviewers.find(r => r.role === 'Consensus Arbiter')?.name || 'Consensus Review Panel'
  );

  // Consensus resolution state per domain
  const [resolvedRatings, setResolvedRatings] = useState<Record<string, { answer: RatingAnswer; note: string }>>(() => {
    const init: Record<string, { answer: RatingAnswer; note: string }> = {};
    for (const row of stats.domainRows) {
      if (row.isResolved && row.majorityAnswer) {
        init[row.domainId] = {
          answer: row.majorityAnswer,
          note: 'Unanimous concordance across all independent evaluators.'
        };
      }
    }
    return init;
  });

  const handleSetResolvedAnswer = (domainId: string, answer: RatingAnswer, note: string = '') => {
    setResolvedRatings(prev => ({
      ...prev,
      [domainId]: {
        answer,
        note: note || prev[domainId]?.note || 'Consensus harmonized by arbiter panel.'
      }
    }));
  };

  const handleHarmonizeAllToMajority = () => {
    setResolvedRatings(prev => {
      const next = { ...prev };
      stats.domainRows.forEach(row => {
        if (row.majorityAnswer && !next[row.domainId]) {
          next[row.domainId] = {
            answer: row.majorityAnswer,
            note: `Harmonized to majority consensus (${row.majorityPercentage}% panel vote).`
          };
        }
      });
      return next;
    });
  };

  const handleLockConsensus = () => {
    const finalRatings: Record<string, DomainRating> = {};
    let resolvedByArbiterCount = 0;
    let unanimousCount = 0;
    let unresolvedCount = 0;

    for (const domain of domains) {
      const res = resolvedRatings[domain.id];
      const row = stats.domainRows.find(r => r.domainId === domain.id);

      let chosenAnswer: RatingAnswer;
      let chosenRationale: string;
      let isVerified = false;

      if (res?.answer) {
        // Explicitly adjudicated by arbiter
        chosenAnswer = res.answer;
        chosenRationale = res.note ? `Arbiter-beslutning (${arbiterName}): ${res.note}` : `Avgjort av arbiter (${arbiterName}) etter paneldiskusjon.`;
        isVerified = true;
        resolvedByArbiterCount++;
      } else if (row?.status === 'unanimous' && row.majorityAnswer) {
        // Unanimous agreement across all reviewers
        chosenAnswer = row.majorityAnswer;
        chosenRationale = 'Enstemmig enighet (100% konsensus) på tvers av samtlige uavhengige vurderere.';
        isVerified = activeAssessments.some(a => a.ratings[domain.id]?.verifiedByResearcher === true);
        unanimousCount++;
      } else if (row?.majorityAnswer) {
        // Majority decision from panel
        chosenAnswer = row.majorityAnswer;
        chosenRationale = `Flertallsbeslutning fra vurdererpanelet (${row.majorityPercentage}% enighet).`;
        isVerified = activeAssessments.some(a => a.ratings[domain.id]?.verifiedByResearcher === true);
      } else {
        // No consensus or ratings provided
        const anyExistingAnswer = activeAssessments.find(a => a.ratings[domain.id]?.answer)?.ratings[domain.id]?.answer;
        if (anyExistingAnswer) {
          chosenAnswer = anyExistingAnswer;
          chosenRationale = 'Enkeltvurdering overført (ingen konsensus eller flertall etablert).';
          isVerified = false;
        } else {
          chosenAnswer = 'unclear';
          chosenRationale = 'Uavklart metodisk domene: Verken vurderere eller arbiter har registrert en eksplisitt vurdering.';
          isVerified = false;
          unresolvedCount++;
        }
      }
      
      finalRatings[domain.id] = {
        answer: chosenAnswer,
        rationale: chosenRationale,
        verifiedByResearcher: isVerified,
        timestamp: new Date().toISOString()
      };
    }

    const consensusAssessment: AppraisalAssessment = {
      id: `consensus-${instrument.toLowerCase()}-${Date.now()}`,
      studyId: study.id,
      instrument,
      reviewerId: 'rev-panel-consensus',
      reviewerName: `${arbiterName} (${activeAssessments.length} raters)`,
      reviewerRole: 'Consensus Arbiter',
      ratings: finalRatings,
      updatedAt: new Date().toISOString(),
      isConsensus: true,
      summaryNotes: `Fler-bedømmer konsensus: ${activeAssessments.length} vurderere. Fleiss' Kappa κ=${stats.fleissKappa} (${stats.fleissInterpretation}), Enstemmighet: ${stats.unanimityPercentage}%. ${unanimousCount} enstemmige, ${resolvedByArbiterCount} arbiter-besluttet, ${unresolvedCount} uavklarte.`
    };

    onSaveConsensus(consensusAssessment);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    onClose();
  };

  // Filter domain rows
  const filteredRows = stats.domainRows.filter(row => {
    if (filterMode === 'split_only') return row.status === 'split';
    if (filterMode === 'split_majority') return row.status !== 'unanimous';
    if (filterMode === 'critical') return row.isCritical;
    return true;
  });

  const unresolvedCount = stats.domainRows.filter(r => !r.isResolved && !resolvedRatings[r.domainId]).length;

  const getAnswerBadgeStyle = (answer: RatingAnswer) => {
    switch (answer) {
      case 'yes':
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'no':
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'partial':
      case 'some_concerns':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'not_applicable':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden max-w-6xl w-full flex flex-col max-h-[90vh]">
      
      {/* Modal Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-lg flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white leading-tight">
                Multi-Reviewer Concordance &amp; Consensus Panel
              </h3>
              <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase">
                {activeAssessments.length} Reviewers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instrument: <strong className="text-white">{instrument}</strong> • Fleiss’ Multi-Rater Kappa ($κ$) &amp; Majority Resolution
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-800 transition-colors"
          title="Lukk / Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Multi-Rater Statistical Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-950 text-white border-b border-slate-800">
        
        {/* Fleiss' Kappa */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            <span>Fleiss' Kappa (κ)</span>
            <span className="text-[9px] text-blue-400 font-mono">{activeAssessments.length} Raters</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-blue-400">
              {stats.fleissKappa.toFixed(2)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700 font-semibold truncate">
              {stats.fleissInterpretation}
            </span>
          </div>
        </div>

        {/* 100% Unanimity Rate */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            100% Unanimous Agreement
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {stats.unanimityPercentage}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({stats.unanimousCount}/{stats.totalDomains} items)
            </span>
          </div>
        </div>

        {/* Majority / Split breakdown */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Majority vs Split Items
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-amber-300 bg-amber-950/80 px-2 py-1 rounded border border-amber-800">
              {stats.majorityCount} Majority
            </span>
            <span className="text-xs font-semibold text-rose-300 bg-rose-950/80 px-2 py-1 rounded border border-rose-800">
              {stats.splitCount} Split
            </span>
          </div>
        </div>

        {/* Arbiter Action Required */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Arbiter Status
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-slate-300">
              {unresolvedCount === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Klar til låsing
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> {unresolvedCount} uavklarte
                </span>
              )}
            </span>
            {stats.majorityCount > 0 && unresolvedCount > 0 && (
              <button
                type="button"
                onClick={handleHarmonizeAllToMajority}
                className="text-[11px] font-bold text-blue-300 hover:text-white bg-blue-900/80 hover:bg-blue-800 px-2 py-1 rounded border border-blue-700 transition-colors flex items-center gap-1"
                title="Sett alle flertallsvedtak automatisk"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Flertall</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Reviewer Panel Strip */}
      <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Panel ({activeAssessments.length}):</span>
          </span>
          {activeAssessments.map((ass, idx) => {
            const profile = reviewers.find(r => r.id === ass.reviewerId || r.name === ass.reviewerName);
            const initials = ass.reviewerName.split(' ').map(n => n[0]).join('').substring(0, 2);
            return (
              <div 
                key={ass.id || idx}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-300 shadow-2xs font-medium text-slate-700"
              >
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${profile?.avatarColor || 'bg-blue-600'}`}>
                  {initials}
                </span>
                <span className="font-semibold">{ass.reviewerName.replace(/\s\(.*\)/, '')}</span>
                <span className="text-[10px] text-slate-400 font-mono">({profile?.role || ass.reviewerRole})</span>
                {profile?.isBlinded && (
                  <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-semibold" title="Blinded Reviewer">
                    Blindet
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
          <button
            onClick={() => setActiveTab('discrepancies')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'discrepancies'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Avvik &amp; Harmoniser
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vurderingsmatrise
          </button>
          <button
            onClick={() => setActiveTab('pairwise')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'pairwise'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parvis Enighet (N×N)
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        
        {/* TAB 1: DISCREPANCIES & ARBITER RECONCILIATION */}
        {activeTab === 'discrepancies' && (
          <div>
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-600">Vis:</span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${filterMode === 'all' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'}`}
                >
                  Alle ({stats.domainRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('split_majority')}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${filterMode === 'split_majority' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 text-slate-700'}`}
                >
                  Uenigheter ({stats.majorityCount + stats.splitCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('split_only')}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${filterMode === 'split_only' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-700'}`}
                >
                  Kun Split ({stats.splitCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('critical')}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${filterMode === 'critical' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 text-slate-700'}`}
                >
                  Kritiske domener
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Viser {filteredRows.length} av {stats.domainRows.length} domener
              </div>
            </div>

            {/* List of Domains with Multi-Rater Cards */}
            <div className="space-y-3">
              {filteredRows.map((row) => {
                const resolved = resolvedRatings[row.domainId];
                const isUnanimous = row.status === 'unanimous';
                const isMajority = row.status === 'majority';

                return (
                  <div
                    key={row.domainId}
                    className={`p-4 rounded-lg border transition-all ${
                      isUnanimous
                        ? 'border-slate-200 bg-slate-50/60'
                        : resolved
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : isMajority
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-rose-300 bg-rose-50/50'
                    }`}
                  >
                    {/* Domain Title & Status Badge */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{row.domainNumber}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {row.domainTitle}
                          </span>
                          {row.isCritical && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">
                              Kritisk domene
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnanimous ? (
                          <span className="text-xs text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Enstemmig ({row.majorityAnswer})</span>
                          </span>
                        ) : resolved ? (
                          <span className="text-xs text-blue-900 font-bold bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Harmonisert: {resolved.answer}</span>
                          </span>
                        ) : isMajority ? (
                          <span className="text-xs text-amber-900 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Flertall ({row.majorityPercentage}%: {row.majorityAnswer})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-rose-900 font-bold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Uavklart / Split</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reviewers answers strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 my-2.5">
                      {activeAssessments.map((ass, rIdx) => {
                        const revId = ass.reviewerId || `rev-${rIdx}`;
                        const r = row.ratingsByReviewer[revId] || {
                          reviewerId: revId,
                          reviewerName: ass.reviewerName,
                          answer: ass.ratings[row.domainId]?.answer || 'unclear',
                          rationale: ass.ratings[row.domainId]?.rationale
                        };
                        const profile = reviewers.find(p => p.id === revId || p.name === ass.reviewerName);

                        return (
                          <div 
                            key={revId}
                            className="p-2 bg-white rounded-md border border-slate-200 shadow-2xs flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-semibold text-slate-700 truncate">
                                {ass.reviewerName.replace(/\s\(.*\)/, '')}
                              </span>
                              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded uppercase border ${getAnswerBadgeStyle(r.answer)}`}>
                                {r.answer}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 italic line-clamp-2">
                              {r.rationale ? `"${r.rationale}"` : 'Ingen begrunnelse angitt'}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Arbiter Decision Controls for Non-Unanimous domains */}
                    {!isUnanimous && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-blue-600" />
                            <span>Vedtatt svar:</span>
                          </span>

                          {/* Quick buttons for each distinct answer present in the distribution */}
                          {Object.keys(row.distribution).map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              onClick={() => handleSetResolvedAnswer(
                                row.domainId, 
                                ans as RatingAnswer, 
                                `Vedtak basert på ${ans.toUpperCase()} (${row.distribution[ans]} stemmer).`
                              )}
                              className={`px-2.5 py-1 rounded font-semibold text-xs border transition-colors ${
                                resolved?.answer === ans
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                              }`}
                            >
                              {ans.toUpperCase()} ({row.distribution[ans]} vurd.)
                            </button>
                          ))}
                        </div>

                        {/* Rationale Input */}
                        <input
                          type="text"
                          placeholder="Arbiter begrunnelse / konsensusnotat..."
                          value={resolved?.note || ''}
                          onChange={(e) => handleSetResolvedAnswer(row.domainId, (resolved?.answer || row.majorityAnswer || 'yes'), e.target.value)}
                          className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded flex-1 min-w-[220px]"
                        />
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FULL HEATMAP / MATRIX VIEW */}
        {activeTab === 'matrix' && (
          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 w-12">#</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 min-w-[200px]">Domene</th>
                  {activeAssessments.map((ass, i) => (
                    <th key={ass.id || i} className="p-2.5 font-bold text-[11px] border-b border-slate-700 text-center min-w-[120px]">
                      <div>{ass.reviewerName.replace(/\s\(.*\)/, '')}</div>
                      <div className="text-[9px] text-slate-400 font-mono font-normal">{ass.reviewerRole}</div>
                    </th>
                  ))}
                  <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 text-center min-w-[130px]">Status</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 text-center min-w-[120px]">Konsensus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats.domainRows.map((row) => {
                  const resolved = resolvedRatings[row.domainId];
                  return (
                    <tr key={row.domainId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500 font-bold">{row.domainNumber}</td>
                      <td className="p-2.5 font-medium text-slate-900">
                        {row.domainTitle}
                        {row.isCritical && (
                          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-rose-100 text-rose-800 rounded font-bold">Kritisk</span>
                        )}
                      </td>
                      {activeAssessments.map((ass, i) => {
                        const revId = ass.reviewerId || `rev-${i}`;
                        const r = row.ratingsByReviewer[revId];
                        const ans = r?.answer || 'unclear';
                        return (
                          <td key={revId} className="p-2 text-center">
                            <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase border ${getAnswerBadgeStyle(ans)}`}>
                              {ans}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">
                        {row.status === 'unanimous' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            100% Enstemmig
                          </span>
                        ) : row.status === 'majority' ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Flertall ({row.majorityPercentage}%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Uavklart Split
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                          {resolved?.answer || row.majorityAnswer || 'Venter'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: PAIRWISE N x N AGREEMENT TABLE */}
        {activeTab === 'pairwise' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
              <p className="font-semibold">Parvis Cohen's Kappa ($κ$) &amp; Observerte Sammenfall mellom alle {activeAssessments.length} bedømmere:</p>
              <p className="text-blue-700 mt-0.5">
                Gir dypere innsikt i hvilke par av bedømmere som har høyest metodologisk samstemthet og hvor systematiske avvik oppstår.
              </p>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">Vurderer 1</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">Vurderer 2</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 text-center">Cohen's Kappa (κ)</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 text-center">Tolkning</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700 text-center">Sammenfall %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.pairwiseMatrix.map((pair, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-800">{pair.reviewer1Name}</td>
                      <td className="p-2.5 font-bold text-slate-800">{pair.reviewer2Name}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-700 text-sm">
                        {pair.kappa.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          pair.kappa >= 0.8 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          pair.kappa >= 0.6 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          pair.kappa >= 0.4 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {pair.interpretation}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                        {pair.agreementPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold">Panelansvarlig / Arbiter:</span>
          <input
            type="text"
            value={arbiterName}
            onChange={(e) => setArbiterName(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-800 text-xs w-52"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          
          <button
            id="confirm-multi-consensus-lock-button"
            onClick={handleLockConsensus}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lagre og Forsegl Konsensus ({activeAssessments.length} Vurderere)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
