import { describe, it, expect } from 'vitest'

// RBAC permission matrix — mirrors the policies in supabase/migrations/001
// Tests the expected access rules without hitting the DB

type Role = 'admin' | 'manager' | 'end_user'
type Action = 'chat' | 'upload_doc' | 'delete_doc' | 'view_all_users' | 'invite_user' | 'view_dashboard' | 'view_audit_logs'

const PERMISSIONS: Record<Role, Action[]> = {
  admin:    ['chat', 'upload_doc', 'delete_doc', 'view_all_users', 'invite_user', 'view_dashboard', 'view_audit_logs'],
  manager:  ['chat', 'upload_doc', 'delete_doc', 'view_dashboard'],
  end_user: ['chat', 'upload_doc'],
}

function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role].includes(action)
}

describe('RBAC Permission Matrix', () => {
  describe('Admin role', () => {
    it('can chat', () => expect(can('admin', 'chat')).toBe(true))
    it('can upload documents', () => expect(can('admin', 'upload_doc')).toBe(true))
    it('can delete documents', () => expect(can('admin', 'delete_doc')).toBe(true))
    it('can view all users', () => expect(can('admin', 'view_all_users')).toBe(true))
    it('can invite users', () => expect(can('admin', 'invite_user')).toBe(true))
    it('can view dashboard', () => expect(can('admin', 'view_dashboard')).toBe(true))
    it('can view audit logs', () => expect(can('admin', 'view_audit_logs')).toBe(true))
  })

  describe('Manager role', () => {
    it('can chat', () => expect(can('manager', 'chat')).toBe(true))
    it('can upload documents', () => expect(can('manager', 'upload_doc')).toBe(true))
    it('can delete documents', () => expect(can('manager', 'delete_doc')).toBe(true))
    it('can view dashboard', () => expect(can('manager', 'view_dashboard')).toBe(true))
    it('CANNOT view all users', () => expect(can('manager', 'view_all_users')).toBe(false))
    it('CANNOT invite users', () => expect(can('manager', 'invite_user')).toBe(false))
    it('CANNOT view audit logs', () => expect(can('manager', 'view_audit_logs')).toBe(false))
  })

  describe('End User role', () => {
    it('can chat', () => expect(can('end_user', 'chat')).toBe(true))
    it('can upload documents', () => expect(can('end_user', 'upload_doc')).toBe(true))
    it('CANNOT delete documents', () => expect(can('end_user', 'delete_doc')).toBe(false))
    it('CANNOT view dashboard', () => expect(can('end_user', 'view_dashboard')).toBe(false))
    it('CANNOT view all users', () => expect(can('end_user', 'view_all_users')).toBe(false))
    it('CANNOT invite users', () => expect(can('end_user', 'invite_user')).toBe(false))
    it('CANNOT view audit logs', () => expect(can('end_user', 'view_audit_logs')).toBe(false))
  })

  describe('Privilege escalation', () => {
    it('end_user cannot gain admin actions', () => {
      const adminOnlyActions: Action[] = ['view_all_users', 'invite_user', 'view_audit_logs', 'delete_doc', 'view_dashboard']
      adminOnlyActions.forEach(action => {
        expect(can('end_user', action)).toBe(false)
      })
    })

    it('manager cannot gain admin-only actions', () => {
      const adminOnlyActions: Action[] = ['view_all_users', 'invite_user', 'view_audit_logs']
      adminOnlyActions.forEach(action => {
        expect(can('manager', action)).toBe(false)
      })
    })
  })
})
