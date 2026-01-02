import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/services/api';
import { ThemeContext } from "../App";

const Modal = React.memo(({ show, onClose, title, children, theme }) => {
  if (!show) return null;

  const modalClass = theme === 'dark'
    ? 'bg-[#1e1e1e] border border-[#333333] shadow-2xl'
    : 'bg-card border-0 shadow-2xl';

  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-card-foreground';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]" role="dialog" aria-modal="true">
      <div
        className={`${modalClass} rounded-xl p-6 w-full max-w-md transform transition-all scale-100`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`${textClass} text-lg font-semibold`}>{title}</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
});

const UserManagementPage = () => {
  const { theme } = useContext(ThemeContext);

  const getAvatarColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-600';
      case 'moderator': return 'bg-blue-600';
      case 'user': return 'bg-green-600';
      case 'agritech': return 'bg-orange-600';
      default: return 'bg-purple-600';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const itemsPerPage = 10;

  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [editFormErrors, setEditFormErrors] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const hasDomain = value.endsWith('@agritech.gov');
    if (!hasDomain) return 'Email must end with @agritech.gov';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    const hasMinLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    if (!hasMinLength) return 'Password must be at least 8 characters';
    if (!hasUpper) return 'Password must include at least 1 uppercase letter';
    if (!hasNumber) return 'Password must include at least 1 number';
    if (!hasSpecial) return 'Password must include at least 1 special character';
    return '';
  };

  const isFormValid = newUser.firstName.trim() && newUser.lastName.trim() &&
    validateEmail(newUser.email) === '' && validatePassword(newUser.password) === '';

  const isEditFormValid = editingUser && editingUser.firstName?.trim() && editingUser.lastName?.trim() &&
    validateEmail(editingUser.email || '') === '' &&
    ((editingUser.newPassword || '').length === 0 || validatePassword(editingUser.newPassword) === '');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, password, role, is_active, created_at, last_login, avatar_url')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedUsers = (data || []).map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        password: user.password || '',
        role: user.role === 'admin' ? 'Admin' : user.role === 'agritech' ? 'Agritech' : 'MAO Staff',
        roleValue: user.role,
        status: user.is_active ? 'Active' : 'Inactive',
        avatar: `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() || (user.email?.charAt(0) || 'U').toUpperCase(),
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));

      console.log('Fetched Users Raw Data:', data);
      console.log('first user avatar_url:', data?.[0]?.avatar_url);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users from Supabase:', JSON.stringify(error, null, 2));
      setError('Failed to load users from Supabase.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(
        paginatedUsers.filter(user => user.role !== 'Admin').map(user => user.id)
      );
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      const emailError = validateEmail(newUser.email);
      const passwordError = validatePassword(newUser.password);
      const updatedErrors = {
        ...formErrors,
        email: emailError,
        password: passwordError,
        firstName: newUser.firstName.trim() ? '' : 'First name is required',
        lastName: newUser.lastName.trim() ? '' : 'Last name is required',
      };
      setFormErrors(updatedErrors);
      if (updatedErrors.firstName || updatedErrors.lastName || emailError || passwordError) {
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('users').insert([{
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        is_active: true
      }]);
      if (error) throw error;
      await fetchUsers();
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
      setFormErrors({ firstName: '', lastName: '', email: '', password: '' });
      setShowPassword(false);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      firstName: user.firstName || user.name.split(' ')[0] || '',
      lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
      newPassword: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const updates = {
        first_name: editingUser.firstName,
        last_name: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.roleValue || (editingUser.role === 'Admin' ? 'admin' : editingUser.role === 'Agritech' ? 'agritech' : 'user')
      };
      if ((editingUser.newPassword || '').length > 0) {
        updates.password = editingUser.newPassword;
      }
      const { error } = await supabase.from('users').update(updates).eq('id', editingUser.id);
      if (error) throw error;
      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormErrors({ firstName: '', lastName: '', email: '', password: '' });
      setShowEditPassword(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from('users').delete().in('id', selectedUsers);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      setError('Failed to delete selected users.');
    } finally {
      setSelectedUsers([]);
      setShowDeleteModal(false);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const newIsActive = !(user?.status === 'Active');
      const { error } = await supabase.from('users').update({ is_active: newIsActive }).eq('id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to toggle status.');
    }
  };

  // --- Dynamic Style Helpers based on Theme ---
  const isDark = theme === 'dark';

  // Container/Card Styles - Slight border added (#333333)
  const cardClass = isDark
    ? 'bg-[#1e1e1e] border border-[#333333] shadow-md'
    : 'bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300';

  const textClass = isDark ? 'text-white' : 'text-foreground';
  const subTextClass = isDark ? 'text-gray-400' : 'text-muted-foreground';

  // Input/Select Styles - Slight border added
  const inputClass = isDark
    ? 'bg-[#252525] border border-[#333333] text-gray-200 focus:ring-green-600'
    : 'bg-muted/50 border-0 text-foreground focus:ring-primary';

  // Table Styles - Slight border added
  const tableHeaderClass = isDark ? 'bg-[#252525]' : 'bg-muted/50';
  const tableBorderClass = isDark ? 'border-[#333333]' : 'border-border/50';
  const tableRowHoverClass = isDark ? 'hover:bg-[#252525]' : 'hover:bg-muted/30';

  if (loading && users.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className={cardClass}>
        <CardHeader className={`flex flex-row items-center justify-between border-b ${tableBorderClass} pb-4`}>
          <div>
            <CardTitle className={`${textClass} text-xl font-bold`}>User Management</CardTitle>
            {error && (
              <p className="text-destructive text-sm mt-1">
                <i className="fas fa-exclamation-triangle mr-1"></i> {error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchUsers}
              className="bg-primary hover:bg-primary/90 text-primary-foreground !rounded-button shadow-sm border-0"
              disabled={loading}
            >
              <i className="fas fa-sync-alt mr-2"></i> Refresh
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap shadow-sm border-0"
            >
              <i className="fas fa-plus mr-2"></i> Add New User
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className={`fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 ${subTextClass}`}></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-all ${inputClass}`}
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 cursor-pointer ${inputClass}`}
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="MAO Staff">MAO Staff</option>
              <option value="Agritech">Agritech</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 cursor-pointer ${inputClass}`}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className={`flex items-center gap-4 p-3 rounded-md border ${tableBorderClass} ${isDark ? 'bg-[#252525]' : 'bg-muted/20'} animate-in fade-in slide-in-from-top-2`}>
              <span className={`text-sm font-medium ${subTextClass}`}>{selectedUsers.length} selected</span>
              {/* UPDATED: Red Delete Button */}
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white !rounded-button shadow-sm border-0"
                size="sm"
              >
                <i className="fas fa-trash mr-2"></i> Delete Selected
              </Button>
              <Button
                onClick={() => {
                  selectedUsers.forEach(userId => handleToggleStatus(userId));
                  setSelectedUsers([]);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white !rounded-button shadow-sm border-0"
                size="sm"
              >
                <i className="fas fa-toggle-on mr-2"></i> Toggle Status
              </Button>
            </div>
          )}

          {/* Users Table */}
          <div className={`rounded-md overflow-hidden border ${tableBorderClass}`}>
            <Table>
              <TableHeader className={tableHeaderClass}>
                <TableRow className={`border-b ${tableBorderClass} hover:bg-transparent`}>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === paginatedUsers.filter(u => u.role !== 'Admin').length &&
                        paginatedUsers.filter(u => u.role !== 'Admin').length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary bg-card border-gray-500 rounded focus:ring-primary"
                    />
                  </TableHead>
                  <TableHead className={`${subTextClass} font-semibold`}>Name</TableHead>
                  <TableHead className={`${subTextClass} font-semibold`}>Email</TableHead>
                  <TableHead className={`${subTextClass} font-semibold`}>Password</TableHead>
                  <TableHead className={`${subTextClass} font-semibold`}>Role</TableHead>
                  <TableHead className={`${subTextClass} font-semibold`}>Status</TableHead>
                  <TableHead className={`${subTextClass} font-semibold text-right`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className={`border-b ${tableBorderClass} ${tableRowHoverClass} transition-colors`}>
                    <TableCell className={`${user.role === 'Admin' ? 'invisible opacity-0' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-primary bg-card border-gray-500 rounded focus:ring-primary"
                        disabled={user.role === 'Admin'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-1 ring-border/50">
                          <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
                          <AvatarFallback className={`text-white text-xs font-bold ${getAvatarColor(user.role)}`}>
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`font-medium ${textClass}`}>{user.name}</div>
                          {user.lastLogin && (
                            <div className={`text-xs ${subTextClass}`}>
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={subTextClass}>{user.email}</TableCell>
                    <TableCell className={`${subTextClass} font-mono text-sm`}>{user.password}</TableCell>
                    <TableCell>
                      <Badge className={user.role === 'Admin' ?
                        'bg-red-500/10 text-red-600 border border-red-500/20' :
                        'bg-green-500/10 text-green-600 border border-green-500/20'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.status === 'Active' ?
                        'bg-green-500/10 text-green-600 border border-green-500/20' :
                        'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                      }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${subTextClass} hover:text-primary hover:bg-muted/50 rounded-full`}
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </Button>
                        <Button
                          onClick={() => handleToggleStatus(user.id)}
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${subTextClass} hover:text-primary hover:bg-muted/50 rounded-full ${user.role === 'Admin' ? 'invisible opacity-0' : ''}`}
                          disabled={user.role === 'Admin'}
                        >
                          <i className={`fas ${user.status === 'Active' ? 'fa-toggle-on text-green-600' : 'fa-toggle-off'} text-xs`}></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className={`${subTextClass} text-sm`}>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 bg-transparent hover:bg-muted ${textClass} border ${tableBorderClass} disabled:opacity-50 !rounded-button`}
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-8 p-0 !rounded-button ${page === currentPage ?
                      "bg-primary text-primary-foreground shadow-sm" :
                      `${subTextClass} hover:bg-muted hover:${textClass} border border-transparent`
                      }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 bg-transparent hover:bg-muted ${textClass} border ${tableBorderClass} disabled:opacity-50 !rounded-button`}
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" theme={theme}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block ${subTextClass} text-sm font-medium mb-2`}>First Name</label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                autoFocus
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
              />
              {formErrors.firstName && <p className="text-destructive text-xs mt-1">{formErrors.firstName}</p>}
            </div>
            <div>
              <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Last Name</label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
              />
              {formErrors.lastName && <p className="text-destructive text-xs mt-1">{formErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => {
                const value = e.target.value;
                setNewUser({ ...newUser, email: value });
                setFormErrors({ ...formErrors, email: validateEmail(value) });
              }}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
            />
            {formErrors.email && <p className="text-destructive text-xs mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newUser.password}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewUser({ ...newUser, password: value });
                  setFormErrors({ ...formErrors, password: validatePassword(value) });
                }}
                className={`w-full pr-10 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 px-3 ${subTextClass} hover:${textClass} transition-colors`}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {formErrors.password && <p className="text-destructive text-xs mt-1">{formErrors.password}</p>}
          </div>
          <div>
            <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${inputClass}`}
            >
              <option value="user">MAO Staff</option>
              <option value="agritech">Agritech</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className={`bg-transparent hover:bg-muted ${textClass} border ${tableBorderClass} !rounded-button`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-green-600 hover:bg-green-700 text-white !rounded-button shadow-sm border-0"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" theme={theme}>
        {editingUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${subTextClass} text-sm font-medium mb-2`}>First Name</label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Last Name</label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
                />
              </div>
            </div>
            <div>
              <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditingUser({ ...editingUser, email: value });
                  setEditFormErrors({ ...editFormErrors, email: validateEmail(value) });
                }}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
              />
              {editFormErrors.email && <p className="text-destructive text-xs mt-1">{editFormErrors.email}</p>}
            </div>
            <div>
              <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Password</label>
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editingUser.newPassword || ''}
                  placeholder="Leave blank to keep current"
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingUser({ ...editingUser, newPassword: value });
                    setEditFormErrors({ ...editFormErrors, password: value ? validatePassword(value) : '' });
                  }}
                  className={`w-full pr-10 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className={`absolute inset-y-0 right-0 px-3 ${subTextClass} hover:${textClass} transition-colors`}
                >
                  <i className={`fas ${showEditPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {editFormErrors.password && <p className="text-destructive text-xs mt-1">{editFormErrors.password}</p>}
            </div>
            <div>
              <label className={`block ${subTextClass} text-sm font-medium mb-2`}>Role</label>
              <select
                value={editingUser.roleValue || (editingUser.role === 'Admin' ? 'admin' : editingUser.role === 'Agritech' ? 'agritech' : 'user')}
                onChange={(e) => setEditingUser({
                  ...editingUser,
                  roleValue: e.target.value,
                  role: e.target.value === 'admin' ? 'Admin' : e.target.value === 'agritech' ? 'Agritech' : 'MAO Staff'
                })}
                className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${inputClass}`}
              >
                <option value="user">MAO Staff</option>
                <option value="agritech">Agritech</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className={`bg-transparent hover:bg-muted ${textClass} border ${tableBorderClass} !rounded-button`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="bg-green-600 hover:bg-green-700 text-white !rounded-button shadow-sm border-0"
                disabled={loading || !isEditFormValid}
              >
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion" theme={theme}>
        <div className="space-y-4">
          <p className={subTextClass}>
            Are you sure you want to delete <span className={`font-semibold ${textClass}`}>{selectedUsers.length}</span> selected user(s)? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className={`bg-transparent hover:bg-muted ${textClass} border ${tableBorderClass} !rounded-button`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white !rounded-button shadow-sm border-0"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;