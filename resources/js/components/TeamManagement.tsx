/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  User, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Check, 
  Clock, 
  Lock, 
  Sparkles, 
  Copy,
  ChevronDown,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { PanelUser, TeamMember } from '../types';

interface TeamManagementProps {
  currentUser: PanelUser | null;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [passwordModalMember, setPasswordModalMember] = useState<TeamMember | null>(null);
  const [deleteModalMember, setDeleteModalMember] = useState<TeamMember | null>(null);

  // Form states for Add Member
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'member'>('member');
  const [addStatus, setAddStatus] = useState<'active' | 'inactive'>('active');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states for Edit Member
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form states for Password Reset
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Deletion state
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Toast / feedback message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const fetchMembers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/team/members', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMembers(data.members || []);
      } else {
        showToast('error', data.error || 'Failed to load team members');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleOpenAddModal = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword(generateRandomPassword());
    setAddRole('member');
    setAddStatus('active');
    setShowAddPassword(true);
    setShowAddModal(true);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      showToast('error', 'All fields are required');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          role: addRole,
          status: addStatus
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to add team member');
      }

      showToast('success', `Team member ${data.member.name} created successfully!`);
      setShowAddModal(false);
      await fetchMembers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add member');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditStatus(member.status);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmittingEdit(true);
    try {
      const response = await fetch(`/api/team/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          status: editStatus
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update member');
      }

      showToast('success', `User ${data.member.name} updated successfully!`);
      setEditingMember(null);
      await fetchMembers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update member');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenPasswordModal = (member: TeamMember) => {
    setPasswordModalMember(member);
    setNewPassword(generateRandomPassword());
    setShowNewPassword(true);
    setCopiedPassword(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalMember || !newPassword) return;

    setIsSubmittingPassword(true);
    try {
      const response = await fetch(`/api/team/members/${passwordModalMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          name: passwordModalMember.name,
          email: passwordModalMember.email,
          password: newPassword
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update password');
      }

      showToast('success', `Password for ${passwordModalMember.name} changed successfully!`);
      setPasswordModalMember(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (!isAdmin) {
      showToast('error', 'Only Admins can change member status');
      return;
    }

    if (member.id === currentUser?.id) {
      showToast('error', 'You cannot deactivate your own account');
      return;
    }

    const nextStatus = member.status === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          status: nextStatus
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update status');
      }

      showToast('success', `User ${member.name} is now ${nextStatus}`);
      await fetchMembers();
    } catch (err: any) {
      showToast('error', err.message || 'Status update failed');
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteModalMember) return;

    setIsSubmittingDelete(true);
    try {
      const response = await fetch(`/api/team/members/${deleteModalMember.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to delete user');
      }

      showToast('success', `User ${deleteModalMember.name} removed successfully.`);
      setDeleteModalMember(null);
      await fetchMembers();
    } catch (err: any) {
      showToast('error', err.message || 'Deletion failed');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'active').length;
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const memberCount = members.filter((m) => m.role === 'member').length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border flex items-center justify-between shadow-sm transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="card p-5 sm:p-6 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Access Control & Permissions
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
              Team Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Create and manage user accounts with custom roles and passwords so other team members can operate this GBP panel securely.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchMembers(true)}
              disabled={refreshing}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 shadow-2xs transition-colors flex items-center justify-center cursor-pointer"
              title="Refresh Members"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-slate-200 rounded-lg flex items-center gap-3 shadow-2xs border-l-4 border-l-indigo-600">
          <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Members</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 rounded-lg flex items-center gap-3 shadow-2xs border-l-4 border-l-emerald-600">
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Operators</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 rounded-lg flex items-center gap-3 shadow-2xs border-l-4 border-l-purple-600">
          <div className="w-9 h-9 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Administrators</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{adminCount}</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 rounded-lg flex items-center gap-3 shadow-2xs border-l-4 border-l-blue-600">
          <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Dashboard Members</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{memberCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="card p-3.5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="member">Members Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Members List Table */}
      <div className="card bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs sm:text-sm font-medium">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-700">No team members found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'No results matched your search criteria.' : 'Click "Add New Member" to invite team members.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4 sm:px-6">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredMembers.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  const isAdminMember = member.role === 'admin';
                  const isActive = member.status === 'active';

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${!isActive ? 'opacity-65' : ''}`}
                    >
                      {/* User Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs shrink-0 relative ${
                            isAdminMember 
                              ? 'bg-purple-600 text-white shadow-2xs' 
                              : 'bg-blue-50 border border-blue-200 text-blue-700'
                          }`}>
                            {getInitials(member.name)}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {member.name}
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-md border border-blue-200 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {isAdminMember ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3 h-3 text-purple-600" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <User className="w-3 h-3 text-blue-600" />
                            Member
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 hidden md:table-cell text-xs text-slate-500">
                        {member.last_login_at ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(member.last_login_at).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => handleOpenPasswordModal(member)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              title="Change Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Toggle Active / Inactive */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(member)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isActive
                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Deactivate Account' : 'Activate Account'}
                              >
                                {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete */}
                            {!isSelf && (
                              <button
                                onClick={() => setDeleteModalMember(member)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== ADD MEMBER MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 sm:p-6 shadow-xl relative text-slate-800">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Add New Team Member</h3>
                  <p className="text-xs text-slate-500">Provide login credentials for dashboard access</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Login ID)
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddPassword(generateRandomPassword())}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password..."
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters. Team member uses this to sign in.</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role & Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddRole('member')}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                      addRole === 'member'
                        ? 'bg-blue-50 border-blue-400 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-blue-700">
                      <User className="w-3.5 h-3.5" />
                      Member
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Operate dashboard, posts, replies</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddRole('admin')}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                      addRole === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-purple-700">
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Full control + manage team members</div>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Account Status</span>
                <button
                  type="button"
                  onClick={() => setAddStatus(addStatus === 'active' ? 'inactive' : 'active')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    addStatus === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {addStatus === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-md text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmittingAdd ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Team Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT MEMBER MODAL ==================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 sm:p-6 shadow-xl relative text-slate-800">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Edit Team Member</h3>
                  <p className="text-xs text-slate-500">{editingMember.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('member')}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                      editRole === 'member'
                        ? 'bg-blue-50 border-blue-400 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-blue-700">
                      <User className="w-3.5 h-3.5" />
                      Member
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                      editRole === 'admin'
                        ? 'bg-purple-50 border-purple-400 text-purple-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-purple-700">
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Account Status</span>
                <button
                  type="button"
                  onClick={() => setEditStatus(editStatus === 'active' ? 'inactive' : 'active')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    editStatus === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {editStatus === 'active' ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-md text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RESET PASSWORD MODAL ==================== */}
      {passwordModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 sm:p-6 shadow-xl relative text-slate-800">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Change Password</h3>
                  <p className="text-xs text-slate-500">For {passwordModalMember.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generateRandomPassword());
                      setCopiedPassword(false);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-16 py-2 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newPassword);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      title="Copy Password"
                    >
                      {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Make sure to share this password with the user.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalMember(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-md text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE MEMBER MODAL ==================== */}
      {deleteModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-5 sm:p-6 shadow-xl relative text-slate-800">
            <div className="w-10 h-10 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="text-center mb-5">
              <h3 className="font-bold text-slate-800 text-base">Remove Team Member?</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="text-slate-900 font-semibold">{deleteModalMember.name}</span> ({deleteModalMember.email})? They will immediately lose access to this dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalMember(null)}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-md text-xs border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={isSubmittingDelete}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-md text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmittingDelete ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
