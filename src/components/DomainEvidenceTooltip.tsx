import React, { useState, useRef, useEffect } from 'react';
import { 
  AppraisalDomain, 
  DomainRating, 
  DocumentAnalysisFinding, 
  RatingAnswer 
} from '../types';
import { 
  MessageSquareQuote, 
  Quote, 
  Check, 
  Copy, 
  AlertTriangle, 
  Sparkles, 
  Users2, 
  Clock, 
  CheckCircle2, 
  FileText,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export interface OtherReviewerRatingInfo {
  reviewerId?: string;
  reviewerName: string;
  reviewerRole: string;
  avatarColor?: string;
  answer: RatingAnswer;
  rationale?: string;
  verifiedByResearcher?: boolean;
}

interface DomainEvidenceTooltipProps {
  domain: AppraisalDomain;
  activeReviewerName: string;
  rating?: DomainRating;
  matchingFinding?: DocumentAnalysisFinding;
  otherRatings?: OtherReviewerRatingInfo[];
  isConflict?: boolean;
  conflictType?: 'divergent' | 'partial' | 'none';
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  preferredPosition?: 'top' | 'bottom';
  className?: string;
}

export const DomainEvidenceTooltip: React.FC<DomainEvidenceTooltipProps> = ({
  domain,
  activeReviewerName,
  rating,
  matchingFinding,
  otherRatings = [],
  isConflict = false,
  conflictType = 'none',
  children,
  align = 'left',
  preferredPosition = 'bottom',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopiedQuote, setIsCopiedQuote] = useState(false);
  const [isCopiedRationale, setIsCopiedRationale] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 200); // 200ms grace period so user can move cursor onto tooltip
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchingFinding?.excerpt) {
      navigator.clipboard.writeText(matchingFinding.excerpt);
      setIsCopiedQuote(true);
      setTimeout(() => setIsCopiedQuote(false), 2000);
    }
  };

  const handleCopyRationale = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rating?.rationale) {
      navigator.clipboard.writeText(rating.rationale);
      setIsCopiedRationale(true);
      setTimeout(() => setIsCopiedRationale(false), 2000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isVisible]);

  const hasRationale = !!rating?.rationale && rating.rationale.trim().length > 0;
  const hasFinding = !!matchingFinding?.excerpt;
  const hasContent = hasRationale || hasFinding || otherRatings.length > 0;

  // Format rating answer badge color
  const formatAnswerColor = (ans: RatingAnswer | string) => {
    switch (ans) {
      case 'yes':
      case 'low':
      case '7':
      case '6':
      case 'ja':
        return 'bg-emerald-600 text-white';
      case 'partial':
      case 'some_concerns':
      case '5':
      case '4':
      case 'delvis':
        return 'bg-amber-500 text-white';
      case 'no':
      case 'high':
      case '1':
      case '2':
      case 'nei':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={isVisible}
    >
      {/* Trigger element passed as children */}
      {children}

      {/* Floating Interactive Tooltip Popover */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute z-50 w-80 sm:w-96 p-3.5 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700/90 text-xs animate-fade-in backdrop-blur-md ${
            preferredPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
          }`}
          style={{ maxWidth: 'calc(100vw - 24px)' }}
        >
          {/* Header Strip with Domain and Conflict Warning */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-750">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
              <span className="bg-blue-600/90 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                Q{domain.number}
              </span>
              <span className="font-bold text-slate-200 truncate text-[11px]">
                {domain.title}
              </span>
            </div>

            {isConflict ? (
              <span className="bg-rose-950 text-rose-300 border border-rose-700/80 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                <span>Konflikt</span>
              </span>
            ) : rating?.answer ? (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${formatAnswerColor(rating.answer)}`}>
                {rating.answer.replace('_', ' ')}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Ubesvart</span>
            )}
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-0.5 custom-scrollbar">
            
            {/* 1. Reviewer's Rationale Section */}
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/80">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <MessageSquareQuote className="w-3 h-3 text-blue-400" />
                  <span>Begrunnelse ({activeReviewerName.split(' ')[0]}):</span>
                </span>
                {hasRationale && (
                  <button
                    onClick={handleCopyRationale}
                    className="hover:text-blue-300 text-slate-400 flex items-center gap-0.5 cursor-pointer transition-colors"
                    title="Kopier begrunnelse"
                  >
                    {isCopiedRationale ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Kopiert
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-2.5 h-2.5" /> Kopier
                      </span>
                    )}
                  </button>
                )}
              </div>

              {hasRationale ? (
                <div>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{rating?.rationale}"
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-750">
                    {rating?.verifiedByResearcher ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verifisert mot artikkel
                      </span>
                    ) : (
                      <span className="text-slate-500">Ikke eksplisitt verifisert</span>
                    )}
                    {rating?.timestamp && (
                      <span className="font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(rating.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Ingen skriftlig begrunnelse lagt til for denne vurderingen ennå.
                </p>
              )}
            </div>

            {/* 2. Source Text Quote Section (from Manuscript Findings) */}
            {matchingFinding ? (
              <div className="bg-amber-950/40 rounded-lg p-2.5 border border-amber-850/80 text-amber-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <Quote className="w-3 h-3 text-amber-400" />
                    <span>Kildesitat ({matchingFinding.sectionOrPage}):</span>
                  </span>
                  <button
                    onClick={handleCopyQuote}
                    className="hover:text-amber-200 text-amber-400 flex items-center gap-0.5 cursor-pointer transition-colors"
                    title="Kopier kildesitat"
                  >
                    {isCopiedQuote ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Kopiert
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-2.5 h-2.5" /> Kopier
                      </span>
                    )}
                  </button>
                </div>
                <p className="font-serif italic text-xs leading-relaxed text-amber-100 bg-amber-950/60 p-1.5 rounded border border-amber-900/60">
                  "{matchingFinding.excerpt}"
                </p>
                <div className="mt-1 flex items-center justify-between text-[9px] text-amber-400/80">
                  <span>Nøkkelterm: <strong>{matchingFinding.matchedTerm || matchingFinding.topic}</strong></span>
                  <span className="font-medium">Konfidens: {matchingFinding.confidence}</span>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded bg-slate-800/40 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-500" />
                <span>Ingen autoskannede sitater knyttet til dette domenet.</span>
              </div>
            )}

            {/* 3. Multi-Reviewer Comparison / Conflict Breakdown */}
            {otherRatings.length > 0 && (
              <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users2 className="w-3 h-3 text-indigo-400" />
                    <span>Alle vurdereres svar ({otherRatings.length + 1}):</span>
                  </span>
                  {isConflict ? (
                    <span className="text-rose-400 font-bold text-[9px]">Uoverensstemmelse</span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[9px]">Enstemmig</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {/* Current reviewer line */}
                  <div className="flex items-center justify-between text-[11px] p-1 bg-slate-850 rounded border border-slate-750">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0">
                        {activeReviewerName.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{activeReviewerName}</span>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${formatAnswerColor(rating?.answer || 'unclear')}`}>
                      {rating?.answer || 'Ikke satt'}
                    </span>
                  </div>

                  {/* Other reviewers lines */}
                  {otherRatings.map((or, idx) => (
                    <div key={or.reviewerId || idx} className="flex items-center justify-between text-[11px] p-1 bg-slate-850 rounded border border-slate-750">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                        <span className={`w-4 h-4 rounded-full ${or.avatarColor || 'bg-indigo-600'} text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0`}>
                          {or.reviewerName.substring(0, 2).toUpperCase()}
                        </span>
                        <span className="text-slate-300 truncate">{or.reviewerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${formatAnswerColor(or.answer)}`}>
                          {or.answer || 'Ikke satt'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Domain Guidance Snippet */}
            {domain.description && (
              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 flex items-start gap-1">
                <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{domain.description}</span>
              </div>
            )}

          </div>

          {/* Tooltip Footer Help text */}
          <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500">
            <span>Trykk [Esc] eller flytt markøren bort for å lukke</span>
            <span className="font-mono text-slate-400">Interaktiv hurtigvisning</span>
          </div>

        </div>
      )}
    </div>
  );
};
