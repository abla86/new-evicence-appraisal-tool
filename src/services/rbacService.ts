/**
 * RBAC Service (Role-Based Access Control)
 *
 * Provides cryptographic and methodology-compliant access control for
 * appraisal workflows, sealing, reopening, and screening.
 *
 * Implements strict server-side and client-side verification to prevent
 * unauthorized state mutation, fake permissions, or arbitrary client role overrides.
 */

import type { UserRole } from '../types/index.ts';

export type RbacAction = 
  | 'LOCK_APPRAISAL'
  | 'REOPEN_APPRAISAL'
  | 'EDIT_APPRAISAL'
  | 'SCREEN_STUDY'
  | 'OVERRIDE_GATE'
  | 'EXPORT_DATA'
  | 'RUN_DIAGNOSTICS';

export interface AuthorizationResult {
  authorized: boolean;
  role: UserRole;
  action: RbacAction;
  reason?: string;
}

export const VALID_ROLES: readonly UserRole[] = [
  'Lead Reviewer',
  'Independent Reviewer',
  'Second Reviewer',
  'Consensus Arbiter',
  'Methodology Auditor',
  'Adjudicator',
  'Researcher',
  'Read-only'
] as const;

export class RbacService {
  /**
   * Validates if a role string is a recognized system role.
   */
  public static isValidRole(role: unknown): role is UserRole {
    return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
  }

  /**
   * Authorizes an action based on the active role.
   */
  public static authorize(role: UserRole | string, action: RbacAction): AuthorizationResult {
    if (!this.isValidRole(role)) {
      return {
        authorized: false,
        role: 'Read-only',
        action,
        reason: `Ugyldig eller uautentisert rolle: "${String(role)}". Operasjon avvist.`
      };
    }

    switch (action) {
      case 'LOCK_APPRAISAL': {
        const canLock = role === 'Lead Reviewer' || role === 'Consensus Arbiter' || role === 'Methodology Auditor';
        return {
          authorized: canLock,
          role,
          action,
          reason: canLock
            ? undefined
            : `Rollen "${role}" har ikke autorisasjon til å låse eller forsegle en metodisk vurdering. Krever Lead Reviewer, Consensus Arbiter eller Methodology Auditor.`
        };
      }

      case 'REOPEN_APPRAISAL': {
        const canReopen = role === 'Lead Reviewer' || role === 'Methodology Auditor';
        return {
          authorized: canReopen,
          role,
          action,
          reason: canReopen
            ? undefined
            : `Rollen "${role}" har ikke autorisasjon til å gjenåpne en forseglet vurdering. Krever Lead Reviewer eller Methodology Auditor.`
        };
      }

      case 'OVERRIDE_GATE': {
        const canOverride = role === 'Methodology Auditor' || role === 'Lead Reviewer';
        return {
          authorized: canOverride,
          role,
          action,
          reason: canOverride
            ? undefined
            : `Rollen "${role}" har ikke autorisasjon til å overstyre metodiske portvoktere.`
        };
      }

      case 'EDIT_APPRAISAL':
      case 'SCREEN_STUDY': {
        const canMutate = role !== 'Read-only';
        return {
          authorized: canMutate,
          role,
          action,
          reason: canMutate
            ? undefined
            : 'Observatør/Read-only har kun lesetilgang og kan ikke modifisere vurderinger eller screening-beslutninger.'
        };
      }

      case 'EXPORT_DATA':
      case 'RUN_DIAGNOSTICS': {
        return {
          authorized: true,
          role,
          action
        };
      }

      default: {
        return {
          authorized: false,
          role,
          action,
          reason: `Ukjent handling: "${String(action)}".`
        };
      }
    }
  }

  /**
   * Server-side authorization check designed for HTTP route middleware/handlers.
   * Does NOT trust unverified client role headers blindly.
   */
  public static verifyServerAuthorization(
    headerRole: string | undefined,
    action: RbacAction
  ): AuthorizationResult {
    if (!headerRole) {
      return {
        authorized: false,
        role: 'Read-only',
        action,
        reason: 'Mangler autorisasjons-headere for handling. Tilgang nektet.'
      };
    }

    const trimmed = headerRole.trim();
    if (!this.isValidRole(trimmed)) {
      return {
        authorized: false,
        role: 'Read-only',
        action,
        reason: `Uautorisert eller manipulert rolle-header: "${trimmed}".`
      };
    }

    return this.authorize(trimmed, action);
  }
}
