import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  GitBranch, 
  Users, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Key, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Share2, 
  Terminal,
  FolderArchive,
  RefreshCw,
  Info
} from 'lucide-react';
import { ResearchProject, UserRole, WorkspaceSecurityConfig } from '../types';

interface PrivateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ResearchProject;
  securityConfig: WorkspaceSecurityConfig;
  onUpdateSecurityConfig: (updated: WorkspaceSecurityConfig) => void;
  onExportEvidencePackage: () => void;
  onImportEvidencePackage: (file: File) => void;
}

export const PrivateShareModal: React.FC<PrivateShareModalProps> = ({
  isOpen,
  onClose,
  project,
  securityConfig,
  onUpdateSecurityConfig,
  onExportEvidencePackage,
  onImportEvidencePackage
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'link_protect' | 'offline_bundle'>('github');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeHintInput, setPasscodeHintInput] = useState(securityConfig.passcodeHint || '');
  const [showPasscode, setShowPasscode] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [githubOrgRepo, setGithubOrgRepo] = useState('ditt-brukernavn/evidence-superprogram');

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleSetPasscode = () => {
    if (!inputPasscode.trim()) return;
    onUpdateSecurityConfig({
      ...securityConfig,
      hasPasscode: true,
      passcodeHint: passcodeHintInput,
      projectSecretToken: inputPasscode.trim()
    });
    setInputPasscode('');
  };

  const handleRemovePasscode = () => {
    onUpdateSecurityConfig({
      ...securityConfig,
      hasPasscode: false,
      passcodeHint: '',
      projectSecretToken: ''
    });
  };

  const handleAddCollaborator = () => {
    if (!newCollaboratorEmail.trim() || !newCollaboratorEmail.includes('@')) return;
    if (securityConfig.allowedCollaboratorEmails.includes(newCollaboratorEmail.trim())) return;
    onUpdateSecurityConfig({
      ...securityConfig,
      allowedCollaboratorEmails: [...securityConfig.allowedCollaboratorEmails, newCollaboratorEmail.trim()]
    });
    setNewCollaboratorEmail('');
  };

  const handleRemoveCollaborator = (email: string) => {
    onUpdateSecurityConfig({
      ...securityConfig,
      allowedCollaboratorEmails: securityConfig.allowedCollaboratorEmails.filter(e => e !== email)
    });
  };

  // Pre-shared direct link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-i5zrqcggpfjl3f6swyjext-844250900682.europe-west2.run.app';
  const shareableUrl = `${currentOrigin}?proj=${encodeURIComponent(project.shortCode || 'SR-2026')}&role=${encodeURIComponent(securityConfig.activeRole)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Privat Deling &amp; Sikkerhetssenter
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Zero Public Exposure
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Del verktøyet og forskningsprosjektet med kollegaer uten å gjøre kode eller data offentlig
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t-2 ${
              activeTab === 'github'
                ? 'bg-slate-900 text-white border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span>1. Privat GitHub Repository</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded font-mono">
              Anbefalt for kode
            </span>
          </button>

          <button
            onClick={() => setActiveTab('link_protect')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t-2 ${
              activeTab === 'link_protect'
                ? 'bg-slate-900 text-white border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>2. Beskyttet Forhåndsvisning &amp; Roller (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('offline_bundle')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t-2 ${
              activeTab === 'offline_bundle'
                ? 'bg-slate-900 text-white border-purple-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-purple-400" />
            <span>3. Frakoblet Prosjektfil (.evidencepack)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          
          {/* TAB 1: GITHUB PRIVATE REPO */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-blue-200 text-sm">
                    Slik deler du sikkert via GitHub uten at noe blir offentlig:
                  </div>
                  <p className="text-blue-300/90 leading-relaxed">
                    Ved å opprette eller eksportere til et **Private GitHub Repository**, har kun personer du eksplisitt inviterer via e-post eller GitHub-brukernavn tilgang. Ingen andre på internett kan se koden, dataene eller testkjøringene.
                  </p>
                </div>
              </div>

              {/* Steg 1-2-3 Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="font-bold text-white text-xs">Koble til Privat Repo</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Gå til innstillinger i AI Studio (øverst til høyre) og velg <strong>GitHub Export</strong>, eller opprett et privat repo på <span className="font-mono text-blue-400">github.com/new</span>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-white text-xs">Sjekk &quot;Private&quot; status</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Sørg for at repoets synlighet forblir <strong>Private</strong>. Verken koden, testsuiten eller referansene blir da søkbare for offentligheten.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-white text-xs">Inviter kollegaer</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    I GitHub går du til <strong>Settings → Collaborators → Add people</strong> og legger inn e-posten til kollegaene dine.
                  </p>
                </div>
              </div>

              {/* Kloningskommandoer for kollegaene */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Hva kollegaen din kjører (etter at de er invitert):</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`git clone https://github.com/${githubOrgRepo}.git\ncd evidence-superprogram\nnpm install\nnpm test\nnpm run dev`, 'git-clone')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] transition-colors"
                  >
                    {copiedSection === 'git-clone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'git-clone' ? 'Kopiert!' : 'Kopier kommandoer'}</span>
                  </button>
                </div>

                <div className="font-mono text-[11px] bg-slate-900 p-3 rounded border border-slate-850 text-emerald-300 space-y-1">
                  <div># 1. Klon det private prosjektet:</div>
                  <div className="text-white">git clone https://github.com/{githubOrgRepo}.git</div>
                  <div className="text-slate-500"># 2. Installer og kjør tester:</div>
                  <div className="text-white">cd evidence-superprogram &amp;&amp; npm install &amp;&amp; npm test</div>
                  <div className="text-slate-500"># 3. Start lokal web-app:</div>
                  <div className="text-white">npm run dev</div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatisk CI testkjøring er allerede konfigurert i <code className="text-blue-300">.github/workflows/ci.yml</code> og kjører privat på hver push!</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINK PROTECTION & RBAC */}
          {activeTab === 'link_protect' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-emerald-200 text-sm">
                    Passordbeskyttelse &amp; Rollebasert Tilgang (RBAC)
                  </div>
                  <p className="text-emerald-300/90 leading-relaxed">
                    Kollegaer som kun skal vurdere artikler trenger ikke GitHub. Du kan sende dem den delte URL-en og beskytte prosjektet med en sikkerhetsnøkkel eller tildele dem spesifikke roller (f.eks. blindet andrevurderer eller kun-lese).
                  </p>
                </div>
              </div>

              {/* Passord-konfigurasjon */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Prosjektets Sikkerhetsnøkkel / Passkode</span>
                  </span>
                  {securityConfig.hasPasscode && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      Aktivt Beskyttet
                    </span>
                  )}
                </div>

                {securityConfig.hasPasscode ? (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
                    <div>
                      <div className="text-slate-200 font-medium">Prosjektet er låst med passkode</div>
                      {securityConfig.passcodeHint && (
                        <div className="text-slate-400 text-[11px] mt-0.5">Hint: {securityConfig.passcodeHint}</div>
                      )}
                    </div>
                    <button
                      onClick={handleRemovePasscode}
                      className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 rounded text-xs transition-colors"
                    >
                      Fjern Passkode
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Ny passkode / PIN</label>
                        <div className="relative">
                          <input
                            type={showPasscode ? 'text' : 'password'}
                            value={inputPasscode}
                            onChange={(e) => setInputPasscode(e.target.value)}
                            placeholder="f.eks. JBI-2026-KLINISK"
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono focus:border-blue-500 focus:outline-hidden pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasscode(!showPasscode)}
                            className="absolute right-2 top-2 text-slate-400 hover:text-white"
                          >
                            {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Valgfritt hint til kollega</label>
                        <input
                          type="text"
                          value={passcodeHintInput}
                          onChange={(e) => setPasscodeHintInput(e.target.value)}
                          placeholder="f.eks. Navn på forskergruppen"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSetPasscode}
                      disabled={!inputPasscode.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-semibold text-xs transition-colors"
                    >
                      Aktiver Passkodebeskyttelse
                    </button>
                  </div>
                )}
              </div>

              {/* Sikker Delingslenke med rolle */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>Generer Sikker Lenke med Rolle:</span>
                  <select
                    value={securityConfig.activeRole}
                    onChange={(e) => onUpdateSecurityConfig({ ...securityConfig, activeRole: e.target.value as UserRole })}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-blue-300 font-semibold"
                  >
                    <option value="Lead Reviewer">Hovedvurderer (Lead Reviewer - full tilgang)</option>
                    <option value="Second Reviewer">Andrevurderer (Blindet inntil konsensus)</option>
                    <option value="Adjudicator">Megler / Konsensus-voldgiftsdommer</option>
                    <option value="Methodology Auditor">Metodisk Revisor (Kun logg &amp; kontroll)</option>
                    <option value="Read-only">Kun Leseadgang (Sensor / Veileder)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs font-mono truncate"
                  />
                  <button
                    onClick={() => handleCopy(shareableUrl, 'share-url')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors flex-shrink-0"
                  >
                    {copiedSection === 'share-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'share-url' ? 'Kopiert!' : 'Kopier Lenke'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFLINE PROJECT BUNDLE */}
          {activeTab === 'offline_bundle' && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-lg flex items-start gap-3">
                <FolderArchive className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-purple-200 text-sm">
                    100% Frakoblet &amp; Privat Fildeling (.evidencepack)
                  </div>
                  <p className="text-purple-300/90 leading-relaxed">
                    For sykehus, universitet og helseforetak med strenge sikkerhetskrav: Ingen data forlater maskinen eller sendes over åpne skyservere. Du eksporterer en fullstendig, kryptografisk signert prosjektfil og overleverer den via sikker intern e-post, Teams eller SharePoint.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Eksporter */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>1. Eksporter Privat Prosjektfil</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Inkluderer: Protokoll, Reference Hub-bibliotek, SourceRecord-kilder, JBI-vurderinger, dual review-konsensus, PRISMA-tall og Merkle-auditkjede.
                    </p>
                  </div>
                  <button
                    onClick={onExportEvidencePackage}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Last ned prosjektfil (.json)</span>
                  </button>
                </div>

                {/* Importer */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>2. Gjenopprett / Importer fra Kollega</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Kollegaen laster opp filen her for å gjenopprette nøyaktig samme arbeidsområde, med verifisert integritet.
                    </p>
                  </div>
                  <label className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                    <Upload className="w-4 h-4" />
                    <span>Velg prosjektfil for import</span>
                    <input
                      type="file"
                      accept=".json,.evidencepack"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onImportEvidencePackage(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kryptografisk Merkle-kjede sikrer at alle endringer er sporbare</span>
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
