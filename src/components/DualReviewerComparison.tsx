import React from 'react';
import { AppraisalAssessment, AppraisalInstrument, ReviewerProfile, StudyRecord } from '../types';
import { MultiReviewerComparison } from './MultiReviewerComparison';

interface DualReviewerComparisonProps {
  study: StudyRecord;
  instrument: AppraisalInstrument;
  assessments: AppraisalAssessment[];
  reviewers?: ReviewerProfile[];
  onSaveConsensus: (consensusAssessment: AppraisalAssessment) => void;
  onClose: () => void;
}

export const DualReviewerComparison: React.FC<DualReviewerComparisonProps> = ({
  study,
  instrument,
  assessments,
  reviewers = [],
  onSaveConsensus,
  onClose
}) => {
  return (
    <MultiReviewerComparison
      study={study}
      instrument={instrument}
      assessments={assessments}
      reviewers={reviewers}
      onSaveConsensus={onSaveConsensus}
      onClose={onClose}
    />
  );
};
