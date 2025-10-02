import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { Badge } from "components/ui/badge";

const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@agritech.gov",
      password: "••••••••",
      role: "Admin",
      status: "Active",
      avatar: "JD",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Active",
      avatar: "MS",
    },
    {
      id: 3,
      name: "Carlos Reyes",
      email: "carlos.reyes@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Inactive",
      avatar: "CR",
    },
    {
      id: 4,
      name: "Ana Lim",
      email: "ana.lim@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Active",
      avatar: "AL",
    },
    {
      id: 5,
      name: "Roberto Cruz",
      email: "roberto.cruz@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Active",
      avatar: "RC",
    },
    {
      id: 6,
      name: "Lisa Wang",
      email: "lisa.wang@agritech.gov",
      password: "••••••••",
      role: "Admin",
      status: "Active",
      avatar: "LW",
    },
    {
      id: 7,
      name: "Miguel Torres",
      email: "miguel.torres@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Inactive",
      avatar: "MT",
    },
    {
      id: 8,
      name: "Sarah Kim",
      email: "sarah.kim@agritech.gov",
      password: "••••••••",
      role: "MAO Staff",
      status: "Active",
      avatar: "SK",
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "MAO Staff",
    status: "Active",
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(paginatedUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleAddUser = () => {
    const id = Math.max(...users.map((u) => u.id)) + 1;
    const avatar = newUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    setUsers([...users, { ...newUser, id, avatar }]);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "MAO Staff",
      status: "Active",
    });
    setShowAddModal(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    setUsers(
      users.map((user) => (user.id === editingUser.id ? editingUser : user))
    );
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleDeleteSelected = () => {
    setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
    setSelectedUsers([]);
    setShowDeleteModal(false);
  };

  const handleToggleStatus = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "Active" ? "Inactive" : "Active",
            }
          : user
      )
    );
  };

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-semibold">{title}</h3>
            <Button
              onClick={onClose}
              className="h-8 w-8 p-0 bg-transparent hover:bg-[#333333] text-gray-400"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-[#1e1e1e] border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-xl">User Management</CardTitle>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap"
          >
            <i className="fas fa-plus mr-2"></i> Add New User
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="MAO Staff">MAO Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-[#252525] rounded-md border border-[#333333]">
              <span className="text-gray-300">
                {selectedUsers.length} selected
              </span>
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white !rounded-button"
                size="sm"
              >
                <i className="fas fa-trash mr-2"></i> Delete Selected
              </Button>
              <Button
                onClick={() => {
                  selectedUsers.forEach((userId) => handleToggleStatus(userId));
                  setSelectedUsers([]);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white !rounded-button"
                size="sm"
              >
                <i className="fas fa-toggle-on mr-2"></i> Toggle Status
              </Button>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#252525]">
                <TableRow>
                  <TableHead className="text-gray-300 w-[50px]">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === paginatedUsers.length &&
                        paginatedUsers.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Email</TableHead>
                  <TableHead className="text-gray-300">Password</TableHead>
                  <TableHead className="text-gray-300">Role</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-t border-[#333333] hover:bg-[#252525]"
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-green-700 to-blue-700 text-white">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-gray-200">
                          {user.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono">
                      {user.password}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono">
                      {user.role}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "Active"
                            ? "bg-green-900/50 text-green-300 hover:bg-green-900/70"
                            : "bg-gray-700/50 text-gray-300 hover:bg-gray-700/70"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </Button>
                        <Button
                          onClick={() => handleToggleStatus(user.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
                        >
                          <i
                            className={`fas ${
                              user.status === "Active"
                                ? "fa-toggle-on"
                                : "fa-toggle-off"
                            } text-xs`}
                          ></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} user records
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 disabled:opacity-50 !rounded-button"
              >
                <i className="fas fa-chevron-left"></i>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className={
                        page === currentPage
                          ? "bg-green-600 hover:bg-green-700 text-white !rounded-button"
                          : "border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 disabled:opacity-50 !rounded-button"
              >
                <i className="fas fa-chevron-right"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Role
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="MAO Staff">MAO Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-green-600 hover:bg-green-700 text-white !rounded-button"
            >
              Add User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Role
              </label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="MAO Staff">MAO Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="bg-green-600 hover:bg-green-700 text-white !rounded-button"
              >
                Update User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete {selectedUsers.length} selected
            user(s)? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white !rounded-button"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
