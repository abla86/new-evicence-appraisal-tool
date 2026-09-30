import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// 1. JBI Qualitative 2017 Feature Inventory Preservation Contract
test('JBI Feature Inventory Preservation Contract - verifies all 16 core pillars', () => {
  const appTsx = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
  const headerTsx = fs.readFileSync(path.resolve('./src/components/Header.tsx'), 'utf-8');
  const typesTs = fs.readFileSync(path.resolve('./src/types/index.ts'), 'utf-8');
  const appraisalWorkspaceTsx = fs.readFileSync(path.resolve('./src/components/AppraisalWorkspace.tsx'), 'utf-8');

  // Pillar 1: Artikkelbibliotek
  assert.ok(appTsx.includes('ArticleLibraryView') || appTsx.includes('studies'), 'Artikkelbibliotek skal være bevart');

  // Pillar 2: Søk & filtrering
  const libraryView = fs.readFileSync(path.resolve('./src/components/ArticleLibraryView.tsx'), 'utf-8');
  assert.ok(libraryView.includes('searchQuery') && libraryView.includes('typeFilter'), 'Søk og filtrering i bibliotek må finnes');

  // Pillar 3: Detaljvisning
  assert.ok(appTsx.includes('EvidenceDocumentViewer'), 'EvidenceDocumentViewer for detaljvisning må være bevart');

  // Pillar 4: JBI Qualitative Vurdering (10 standardkriterier)
  assert.ok(appraisalWorkspaceTsx.includes('JBI_QUALITATIVE') || typesTs.includes('JBI_QUALITATIVE'), 'JBI Qualitative 2017 instrument skal være støttet');

  // Pillar 5: Dual Review (Inter-rater)
  assert.ok(appTsx.includes('DualReviewerComparison'), 'DualReviewerComparison for dobbeltvurdering skal finnes');

  // Pillar 6: Fagfellevurdering / Multi-rater panel
  assert.ok(appTsx.includes('MultiReviewerComparison'), 'MultiReviewerComparison for panelvurdering skal finnes');

  // Pillar 7: Syntese & PICO
  assert.ok(appTsx.includes('DataExtractionModal') && appTsx.includes('synthesisOutcomes'), 'Syntese- og ekstraksjonsflyt skal finnes');

  // Pillar 8: Audit Trail (Merkle Chain)
  assert.ok(appTsx.includes('createAuditEntry') && appTsx.includes('auditLog'), 'Kryptografisk revisjonslogg med Merkle chain skal være aktiv');

  // Pillar 9: Metodisk kontroll & Governance Gate
  assert.ok(appTsx.includes('GovernanceGateModal') && appTsx.includes('governanceGate'), 'WHO/Governance Gate metodisk kontroll skal finnes');

  // Pillar 10: Referansebibliotek & Benchmark
  assert.ok(appTsx.includes('handleLoadBenchmarkData'), 'Referansebibliotek og benchmark-studier skal være tilgjengelig');

  // Pillar 11: Valideringsdashboard / Testlab
  assert.ok(appTsx.includes('ValidationTestRunnerModal'), 'Valideringsdashboard og testrunner skal finnes');

  // Pillar 12: Hjelpesystem & Kunnskapsbase
  assert.ok(appTsx.includes('KnowledgeBaseModal'), 'Kunnskapsbase og metodeguide skal finnes');

  // Pillar 13: Dokumentanalyse & Evidensskanning
  assert.ok(appTsx.includes('scanDocumentForFramework'), 'Automatisk dokumentskanning mot rammeverk skal finnes');

  // Pillar 14: Import / Eksport
  assert.ok(appTsx.includes('ExportModal') && appTsx.includes('DocumentUploadCard'), 'Import og eksport av evidensdata skal være støttet');

  // Pillar 15: Autosave & Lokalt lager
  assert.ok(appTsx.includes('saveProject') && appTsx.includes('saveStudies') && appTsx.includes('saveAssessments'), 'Autosave til persistent lager skal være aktivt');

  // Pillar 16: Personvern & Zero-telemetry
  assert.ok(headerTsx.includes('Zero-Telemetry') || appTsx.includes('Zero-Telemetry'), 'GDPR og zero-telemetry bekreftelse skal være synlig i UI');
});

// 2. ActiveTab navigation & SourceRecord decoupling contract
test('ActiveTab navigation deklarasjon og SourceRecord workflow separasjon', () => {
  const typesTs = fs.readFileSync(path.resolve('./src/types/index.ts'), 'utf-8');
  const appTsx = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
  const headerTsx = fs.readFileSync(path.resolve('./src/components/Header.tsx'), 'utf-8');

  // Sjekk at ActiveTab har alle nødvendige tab-verdier
  assert.ok(typesTs.includes("'appraisal'"), "ActiveTab må inneholde 'appraisal'");
  assert.ok(typesTs.includes("'source_workflow'"), "ActiveTab må inneholde 'source_workflow'");
  assert.ok(typesTs.includes("'library'"), "ActiveTab må inneholde 'library'");
  assert.ok(typesTs.includes("'synthesis'"), "ActiveTab må inneholde 'synthesis'");
  assert.ok(typesTs.includes("'governance_audit'"), "ActiveTab må inneholde 'governance_audit'");
  assert.ok(typesTs.includes("'validation_lab'"), "ActiveTab må inneholde 'validation_lab'");

  // Sjekk at Header har dedikerte tab-knapper
  assert.ok(headerTsx.includes('tab-btn-appraisal'), 'Header skal ha tab-knapp for appraisal');
  assert.ok(headerTsx.includes('tab-btn-source-workflow'), 'Header skal ha tab-knapp for source_workflow');
  assert.ok(headerTsx.includes('tab-btn-library'), 'Header skal ha tab-knapp for library');

  // Sjekk at SourceRecordWorkflowView er importert og rendres betinget
  assert.ok(appTsx.includes('<SourceRecordWorkflowView'), 'App.tsx skal rendre SourceRecordWorkflowView under source_workflow-tab');
  assert.ok(appTsx.includes('activeTab === \'source_workflow\''), 'Tab-switching skal styre SourceRecordWorkflowView');
});

// 3. UI Diff Budget check - stops unapproved deletions in App.tsx & Header.tsx
test('UI Diff Budget - forhindrer utilsiktet reduksjon av kjernekomponenter', () => {
  const appTsx = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
  const headerTsx = fs.readFileSync(path.resolve('./src/components/Header.tsx'), 'utf-8');

  // Header må inneholde alle essensielle handlinger
  assert.ok(headerTsx.includes('onOpenProjectProtocol'), 'Header må bevare onOpenProjectProtocol');
  assert.ok(headerTsx.includes('onOpenGovernanceGate'), 'Header må bevare onOpenGovernanceGate');
  assert.ok(headerTsx.includes('onOpenAudit'), 'Header må bevare onOpenAudit');
  assert.ok(headerTsx.includes('onOpenExport'), 'Header må bevare onOpenExport');
  assert.ok(headerTsx.includes('onOpenUpload'), 'Header må bevare onOpenUpload');

  // App.tsx må bevare alle modaler og paneler
  assert.ok(appTsx.includes('EvidenceDocumentViewer'), 'App.tsx må bevare EvidenceDocumentViewer');
  assert.ok(appTsx.includes('AppraisalWorkspace'), 'App.tsx må bevare AppraisalWorkspace');
  assert.ok(appTsx.includes('GovernanceGateModal'), 'App.tsx må bevare GovernanceGateModal');
  assert.ok(appTsx.includes('IntegrityAuditTrail'), 'App.tsx må bevare IntegrityAuditTrail');
  assert.ok(appTsx.includes('ValidationTestRunnerModal'), 'App.tsx må bevare ValidationTestRunnerModal');
});

// 4. Deterministiske scoringsregler & metodisk sporbarhet
test('Metodisk integritet - JBI Qualitative 2017 benytter offisiell standard uten kunstig vekting', () => {
  const frameworksTs = fs.readFileSync(path.resolve('./src/utils/frameworks.ts'), 'utf-8');
  const typesTs = fs.readFileSync(path.resolve('./src/types/index.ts'), 'utf-8');

  // JBI standard responsverdier
  assert.ok(typesTs.includes('RatingAnswer') && typesTs.includes('DomainRating'), 'Offisielle svarverdier må finnes');
  assert.ok(typesTs.includes('JBI_QUALITATIVE'), 'JBI_QUALITATIVE må være definert i AppraisalInstrument');
  assert.ok(frameworksTs.includes('JBI_QUALITATIVE_DOMAINS') && frameworksTs.includes('Lockwood'), 'JBI kvalitativ vurdering skal finnes i frameworks');
});
