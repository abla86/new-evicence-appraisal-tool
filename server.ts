import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { RbacService } from './src/services/rbacService.ts';
import { CanonicalAppraisalService } from './src/services/canonicalAppraisalService.ts';
import { ScreeningGateService } from './src/services/screeningGateService.ts';
import { MasterInstrumentRegistryService } from './src/services/masterInstrumentRegistry.ts';
import { EvidenceTraceabilityService } from './src/services/evidenceTraceabilityService.ts';
import type { AppraisalInstrument, ReviewerProfile } from './src/types/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security Headers (no inline-eval leaks, prevent framing outside authorized contexts)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes FIRST

  // 1. Health & Readiness
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'complete-evidence-appraisal-tool',
      version: '1.0.0'
    });
  });

  // 2. Instrument Registry Endpoint
  app.get('/api/instruments', (_req, res) => {
    res.json({
      instruments: MasterInstrumentRegistryService.getAll()
    });
  });

  // 3. DOI Format & Verification
  app.get('/api/doi/verify', (req, res) => {
    const doiParam = typeof req.query.doi === 'string' ? req.query.doi.trim() : '';
    if (!doiParam) {
      return res.status(400).json({ valid: false, error: 'DOI-parameter mangler.' });
    }

    const cleaned = doiParam.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
    const isValid = doiRegex.test(cleaned);

    return res.json({
      valid: isValid,
      doi: isValid ? cleaned : null,
      doiUrl: isValid ? `https://doi.org/${cleaned}` : null,
      message: isValid ? 'Gyldig DOI-syntaks.' : 'Ugyldig DOI-format. Må starte med 10.xxxx/'
    });
  });

  // 4. Screening Gate Pre-Appraisal Validation
  app.post('/api/screening/validate', (req, res) => {
    try {
      const { study, instrumentId, reviewerId, isHumanVerified, evidenceVerified, screeningEvents } = req.body;
      const result = ScreeningGateService.validateScreeningGate(study, instrumentId, {
        reviewerId,
        isHumanVerified,
        evidenceVerified,
        screeningEvents
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: 'Validering av screening-gate feilet', details: err.message });
    }
  });

  // 4b. Screening Decision Recording
  app.post('/api/screening/decision', (req, res) => {
    try {
      const { studyId, decision, reviewerId, rationale } = req.body;
      const authHeaderRole = req.headers['x-user-role'] as string | undefined;
      const effectiveRole = authHeaderRole || 'Independent Reviewer';
      const auth = RbacService.verifyServerAuthorization(effectiveRole, 'SCREEN_STUDY');
      if (!auth.authorized) {
        return res.status(403).json({ error: auth.reason });
      }

      if (!studyId || !decision) {
        return res.status(400).json({ error: 'Både studyId og decision er påkrevd for å registrere screening-beslutning.' });
      }

      const validDecisions = ['INCLUDED', 'EXCLUDED', 'MAYBE', 'PENDING'];
      if (!validDecisions.includes(decision)) {
        return res.status(400).json({ error: `Ugyldig screening-beslutning: "${decision}". Tillatte verdier: ${validDecisions.join(', ')}` });
      }

      const record = ScreeningGateService.recordDecision(
        studyId,
        decision,
        reviewerId || 'lead-reviewer',
        rationale || ''
      );

      return res.json({ success: true, record });
    } catch (err: any) {
      return res.status(500).json({ error: 'Registrering av screening-beslutning feilet', details: err.message });
    }
  });

  // 5. Canonical Appraisal Sessions
  app.get('/api/appraisal/session', (req, res) => {
    const studyId = req.query.studyId as string;
    const instrumentId = req.query.instrumentId as AppraisalInstrument;

    if (!studyId || !instrumentId) {
      return res.status(400).json({ error: 'Både studyId og instrumentId kreves.' });
    }

    const session = CanonicalAppraisalService.getSession(studyId, instrumentId);
    if (!session) {
      return res.status(404).json({ error: 'Ingen kanonisk appraisal-sesjon funnet for denne studien og instrumentet.' });
    }

    return res.json({ session });
  });

  app.post('/api/appraisal/session', (req, res) => {
    const { studyId, instrumentId, reviewer, initialResponses } = req.body;
    if (!studyId || !instrumentId || !reviewer) {
      return res.status(400).json({ error: 'studyId, instrumentId og reviewer er obligatoriske.' });
    }

    const latestDecision = ScreeningGateService.getLatestDecision(studyId);
    if (!latestDecision) {
      return res.status(403).json({
        error: 'Screening decision mangler. Studien må ha eksplisitt INCLUDED-beslutning i screening før appraisal kan opprettes.'
      });
    }
    if (latestDecision.decision !== 'INCLUDED') {
      return res.status(403).json({
        error: `Studien har screening-status "${latestDecision.decision}". Kun studier med eksplisitt INCLUDED-beslutning kan gå til appraisal.`
      });
    }

    const session = CanonicalAppraisalService.getOrCreateSession(
      studyId,
      instrumentId,
      reviewer,
      initialResponses
    );

    return res.json({ session });
  });

  app.put('/api/appraisal/session/response', (req, res) => {
    const { studyId, instrumentId, domainId, rating, reviewer } = req.body;
    const authHeaderRole = req.headers['x-user-role'] as string | undefined;
    const effectiveRole = authHeaderRole || reviewer?.role;

    const auth = RbacService.verifyServerAuthorization(effectiveRole, 'EDIT_APPRAISAL');
    if (!auth.authorized) {
      return res.status(403).json({ error: auth.reason });
    }

    const latestDecision = ScreeningGateService.getLatestDecision(studyId);
    if (!latestDecision || latestDecision.decision !== 'INCLUDED') {
      return res.status(403).json({
        error: 'Studien mangler gyldig INCLUDED-beslutning i screening. Appraisal kan ikke modifiseres.'
      });
    }

    const result = CanonicalAppraisalService.saveResponse(
      studyId,
      instrumentId,
      domainId,
      rating,
      reviewer
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error, session: result.session });
    }

    return res.json({ session: result.session });
  });

  app.post('/api/appraisal/finalize', (req, res) => {
    const { studyId, instrumentId, reviewer, validationResult } = req.body;
    const authHeaderRole = req.headers['x-user-role'] as string | undefined;
    const effectiveRole = authHeaderRole || reviewer?.role;

    const auth = RbacService.verifyServerAuthorization(effectiveRole, 'LOCK_APPRAISAL');
    if (!auth.authorized) {
      return res.status(403).json({ error: auth.reason });
    }

    const latestDecision = ScreeningGateService.getLatestDecision(studyId);
    if (!latestDecision || latestDecision.decision !== 'INCLUDED') {
      return res.status(403).json({
        error: 'Studien mangler gyldig INCLUDED-beslutning i screening. Appraisal kan ikke forsegles.'
      });
    }

    const result = CanonicalAppraisalService.finalizeAndLockSession(
      studyId,
      instrumentId,
      reviewer,
      validationResult
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error, blockers: result.blockers, session: result.session });
    }

    return res.json({ session: result.session });
  });

  app.post('/api/appraisal/reopen', (req, res) => {
    const { studyId, instrumentId, reviewer, justification } = req.body;
    const authHeaderRole = req.headers['x-user-role'] as string | undefined;
    const effectiveRole = authHeaderRole || reviewer?.role;

    const auth = RbacService.verifyServerAuthorization(effectiveRole, 'REOPEN_APPRAISAL');
    if (!auth.authorized) {
      return res.status(403).json({ error: auth.reason });
    }

    const result = CanonicalAppraisalService.reopenSession(
      studyId,
      instrumentId,
      reviewer,
      justification
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error, session: result.session });
    }

    return res.json({ session: result.session });
  });

  app.get('/api/appraisal/export', (req, res) => {
    const studyId = req.query.studyId as string;
    const instrumentId = req.query.instrumentId as AppraisalInstrument;

    if (!studyId || !instrumentId) {
      return res.status(400).json({ error: 'Både studyId og instrumentId kreves for eksport.' });
    }

    const exported = CanonicalAppraisalService.exportSession(studyId, instrumentId);
    if (!exported) {
      return res.status(404).json({ error: 'Ingen appraisal-sesjon funnet for eksport.' });
    }

    return res.json({ export: exported });
  });

  // 6. Evidence Quote Traceability & Verification
  app.post('/api/evidence/verify-quote', (req, res) => {
    try {
      const { documentText, quote, claimedLocation } = req.body;
      if (!documentText || !quote) {
        return res.status(400).json({
          error: 'documentText og quote er påkrevde parametere for sitatverifisering.'
        });
      }

      const result = EvidenceTraceabilityService.verifyQuote(documentText, quote, claimedLocation);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        error: 'Sitatverifisering feilet på serveren.',
        diagnostic: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Global Error Handler (Sanitizes stack traces to prevent info leaks in production)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server Internal Error:', err);
    res.status(500).json({
      error: 'En uventet intern serverfeil oppstod.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Vite middleware in dev / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
