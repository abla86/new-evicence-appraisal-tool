import React, { useState } from 'react';
import { 
  FolderKanban, 
  FileText, 
  Users, 
  Layers, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  X, 
  Lock, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ResearchProject, ResearchProtocol, ReviewerProfile } from '../types';

interface ProjectProtocolModalProps {
  project: ResearchProject;
  onUpdateProject: (updated: ResearchProject) => void;
  onOpenGovernanceGate: () => void;
  onOpenFreezeModal: () => void;
  onClose: () => void;
}

export const ProjectProtocolModal: React.FC<ProjectProtocolModalProps> = ({
  project,
  onUpdateProject,
  onOpenGovernanceGate,
  onOpenFreezeModal,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'protocol' | 'pico' | 'reviewers' | 'milestones'>('protocol');

  const [title, setTitle] = useState(project.title);
  const [shortCode, setShortCode] = useState(project.shortCode || '');
  const [leadInvestigator, setLeadInvestigator] = useState(project.leadInvestigator || '');
  const [organization, setOrganization] = useState(project.organization || '');

  // Protocol state
  const [protocol, setProtocol] = useState<ResearchProtocol>(project.protocol || {
    projectId: project.id,
    registrationNumber: 'PROSPERO CRD42026889211',
    registrationStatus: 'Registered',
    researchQuestion: '',
    pico: {
      population: '',
      intervention: '',
      comparator: '',
      outcomes: '',
      studyDesigns: ['Systematic Reviews', 'Randomized Controlled Trials']
    },
    eligibilityCriteria: {
      inclusion: [],
      exclusion: []
    },
    searchStrategy: {
      databases: ['PubMed/MEDLINE', 'Embase', 'Cochrane CENTRAL', 'Web of Science'],
      searchTerms: '',
      dateRange: '',
      languageRestrictions: 'English and Nordic languages'
    },
    synthesisApproach: 'Random-Effects Meta-Analysis',
    discrepancyProtocol: 'Dual independent blinded appraisal with third-party consensus panel resolution.'
  });

  // Reviewers state
  const [reviewers, setReviewers] = useState<ReviewerProfile[]>(project.reviewers || []);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setProtocol(prev => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        inclusion: [...prev.eligibilityCriteria.inclusion, newInclusion.trim()]
      }
    }));
    setNewInclusion('');
  };

  const handleRemoveInclusion = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        inclusion: prev.eligibilityCriteria.inclusion.filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddExclusion = () => {
    if (!newExclusion.trim()) return;
    setProtocol(prev => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        exclusion: [...prev.eligibilityCriteria.exclusion, newExclusion.trim()]
      }
    }));
    setNewExclusion('');
  };

  const handleRemoveExclusion = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      eligibilityCriteria: {
        ...prev.eligibilityCriteria,
        exclusion: prev.eligibilityCriteria.exclusion.filter((_, i) => i !== index)
      }
    }));
  };

  const handleToggleBlinding = (reviewerId: string) => {
    setReviewers(prev => prev.map(r => r.id === reviewerId ? { ...r, isBlinded: !r.isBlinded } : r));
  };

  const handleSave = () => {
    const updated: ResearchProject = {
      ...project,
      title,
      shortCode,
      leadInvestigator,
      organization,
      updatedAt: new Date().toISOString(),
      protocol,
      reviewers
    };

    onUpdateProject(updated);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Project Configuration &amp; Systematic Protocol</h2>
              <span className="text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-semibold">
                {project.shortCode || 'PROJECT ROOT'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralized protocol configuration, PICO criteria, blinded reviewer teams, and governance enforcement.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'protocol'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Protocol &amp; Metadata
          </button>
          <button
            onClick={() => setActiveTab('pico')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'pico'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            PICO &amp; Eligibility Criteria
          </button>
          <button
            onClick={() => setActiveTab('reviewers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'reviewers'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Reviewer Team ({reviewers.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'milestones'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Snapshots &amp; Freezes ({project.snapshots?.length || 0})
          </button>
        </div>

        {/* Quick Gate & Freeze Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGovernanceGate}
            className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded border border-emerald-300 flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Governance Gate</span>
          </button>
          <button
            onClick={onOpenFreezeModal}
            className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 rounded border border-blue-300 flex items-center gap-1 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            <span>Research Freeze</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
        
        {/* TAB 1: Protocol & Metadata */}
        {activeTab === 'protocol' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Project Identity &amp; Affiliation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Full Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Code / Acronym
                  </label>
                  <input
                    type="text"
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded font-mono font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lead Principal Investigator
                  </label>
                  <input
                    type="text"
                    value={leadInvestigator}
                    onChange={(e) => setLeadInvestigator(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution / Department
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                PROSPERO Registration &amp; Primary Question
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PROSPERO / Registry ID
                  </label>
                  <input
                    type="text"
                    value={protocol.registrationNumber || ''}
                    onChange={(e) => setProtocol(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="e.g. CRD42026889211"
                    className="w-full text-xs p-2 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Status
                  </label>
                  <select
                    value={protocol.registrationStatus}
                    onChange={(e) => setProtocol(prev => ({ ...prev, registrationStatus: e.target.value as ResearchProtocol['registrationStatus'] }))}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 bg-white font-medium cursor-pointer"
                  >
                    <option value="Registered">Registered (PROSPERO a priori)</option>
                    <option value="Published">Published Protocol</option>
                    <option value="Pending Institutional Review">Pending Institutional Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Research Question
                </label>
                <textarea
                  value={protocol.researchQuestion}
                  onChange={(e) => setProtocol(prev => ({ ...prev, researchQuestion: e.target.value }))}
                  rows={3}
                  className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Synthesis Strategy &amp; Discrepancy Protocol
                </label>
                <select
                  value={protocol.synthesisApproach}
                  onChange={(e) => setProtocol(prev => ({ ...prev, synthesisApproach: e.target.value as ResearchProtocol['synthesisApproach'] }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800 mb-2 bg-white font-medium cursor-pointer"
                >
                  <option value="Random-Effects Meta-Analysis">Random-Effects Meta-Analysis</option>
                  <option value="Narrative Synthesis">Narrative Synthesis</option>
                  <option value="Qualitative Comparative Analysis">Qualitative Comparative Analysis</option>
                </select>
                <input
                  type="text"
                  value={protocol.discrepancyProtocol}
                  onChange={(e) => setProtocol(prev => ({ ...prev, discrepancyProtocol: e.target.value }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PICO & Eligibility */}
        {activeTab === 'pico' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                PICO Formulation
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    P — Population / Patient Problem
                  </label>
                  <input
                    type="text"
                    value={protocol.pico.population}
                    onChange={(e) => setProtocol(prev => ({
                      ...prev,
                      pico: { ...prev.pico, population: e.target.value }
                    }))}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    I — Intervention / Exposure
                  </label>
                  <input
                    type="text"
                    value={protocol.pico.intervention}
                    onChange={(e) => setProtocol(prev => ({
                      ...prev,
                      pico: { ...prev.pico, intervention: e.target.value }
                    }))}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    C — Comparator / Control
                  </label>
                  <input
                    type="text"
                    value={protocol.pico.comparator}
                    onChange={(e) => setProtocol(prev => ({
                      ...prev,
                      pico: { ...prev.pico, comparator: e.target.value }
                    }))}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    O — Outcomes (Primary &amp; Secondary)
                  </label>
                  <input
                    type="text"
                    value={protocol.pico.outcomes}
                    onChange={(e) => setProtocol(prev => ({
                      ...prev,
                      pico: { ...prev.pico, outcomes: e.target.value }
                    }))}
                    className="w-full text-xs p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Inclusion / Exclusion Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inclusion */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Inclusion Criteria</span>
                  <span className="text-[10px] text-slate-400 font-normal">({protocol.eligibilityCriteria.inclusion.length})</span>
                </h4>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {protocol.eligibilityCriteria.inclusion.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-emerald-50/60 border border-emerald-100 rounded text-xs text-slate-800">
                      <span className="leading-snug">{item}</span>
                      <button
                        onClick={() => handleRemoveInclusion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInclusion()}
                    placeholder="Add inclusion criterion..."
                    className="flex-1 text-xs p-1.5 border border-slate-300 rounded"
                  />
                  <button
                    onClick={handleAddInclusion}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Exclusion */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Exclusion Criteria</span>
                  <span className="text-[10px] text-slate-400 font-normal">({protocol.eligibilityCriteria.exclusion.length})</span>
                </h4>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {protocol.eligibilityCriteria.exclusion.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-rose-50/60 border border-rose-100 rounded text-xs text-slate-800">
                      <span className="leading-snug">{item}</span>
                      <button
                        onClick={() => handleRemoveExclusion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExclusion()}
                    placeholder="Add exclusion criterion..."
                    className="flex-1 text-xs p-1.5 border border-slate-300 rounded"
                  />
                  <button
                    onClick={handleAddExclusion}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Reviewers */}
        {activeTab === 'reviewers' && (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Reviewer Team &amp; Blinding Matrix</span>
              <span className="text-[10px] font-mono text-slate-400">DUAL REVIEW INTEGRITY</span>
            </h3>

            <div className="space-y-3">
              {reviewers.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {rev.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{rev.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{rev.role} • {rev.affiliation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rev.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBlinding(rev.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                        rev.isBlinded 
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                          : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {rev.isBlinded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{rev.isBlinded ? 'Blinded (Active)' : 'Unblinded'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Milestones & Snapshots */}
        {activeTab === 'milestones' && (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Immutable Research Freeze Milestones</span>
              <button
                onClick={onOpenFreezeModal}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Freeze</span>
              </button>
            </h3>

            {project.snapshots && project.snapshots.length > 0 ? (
              <div className="space-y-3">
                {project.snapshots.map((snap) => (
                  <div key={snap.snapshotId} className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        SNAPSHOT {snap.versionTag}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(snap.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 break-all">
                      Manifest Hash: {snap.manifestRootHashSha256}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Sealed by: {snap.sealedBy} • Studies: {snap.totalStudiesSealed}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">No Research Freezes Sealed Yet</div>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  When your synthesis and appraisals reach milestone completion, use the Research Freeze button to generate an immutable cryptographic certificate.
                </p>
                <button
                  onClick={onOpenFreezeModal}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
                >
                  Create Freeze Snapshot
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          All configuration changes are persisted across sessions in local enclave.
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            id="protocol-save-button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

    </div>
  );
};
