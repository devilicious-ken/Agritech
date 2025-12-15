import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from "@/components/ui/button";
import ApiService from '../services/api';

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('activity');
  const recordsPerPage = 10;

  // ✅ State for database data
  const [activityLogs, setActivityLogs] = useState([]);
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add these new state variables
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [showErrorModal, setShowErrorModal] = useState(false);
const [modalMessage, setModalMessage] = useState('');
const [modalTitle, setModalTitle] = useState('');

  // ✅ Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch activity logs
      const logs = await ApiService.getActivityLogs(100);
      setActivityLogs(logs || []);

      // Fetch deleted registrants
      const deleted = await ApiService.getDeletedRegistrants();
      setDeletedRecords(deleted || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle restore registrant
const handleRestore = async () => {
  if (!selectedRecord) return;

  try {
    await ApiService.restoreRegistrant(selectedRecord.id);
    
    // Log the restore action
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    await ApiService.createActivityLog(
      currentUser.id,
      `${currentUser.first_name} ${currentUser.last_name}`,
      'Restore',
      `${selectedRecord.reference_no} (${selectedRecord.first_name} ${selectedRecord.surname})`,
      null
    );

    // Refresh data
    await fetchData();
    setShowRestoreModal(false);
    setSelectedRecord(null);
    
    // Show success modal
    setModalTitle('Success');
    setModalMessage('Record restored successfully!');
    setShowSuccessModal(true);
  } catch (err) {
    console.error('Error restoring record:', err);
    
    // Show error modal
    setModalTitle('Error');
    setModalMessage('Failed to restore record. Please try again.');
    setShowErrorModal(true);
  }
};

// ✅ Handle permanent delete
const handlePermanentDelete = async () => {
  if (!selectedRecord) return;

  try {
    await ApiService.permanentDeleteRegistrant(selectedRecord.id);
    
    // Log the permanent delete action
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    await ApiService.createActivityLog(
      currentUser.id,
      `${currentUser.first_name} ${currentUser.last_name}`,
      'Permanent Delete',
      `${selectedRecord.reference_no} (${selectedRecord.first_name} ${selectedRecord.surname})`,
      null
    );

    // Refresh data
    await fetchData();
    setShowDeleteModal(false);
    setSelectedRecord(null);
    
    // Show success modal
    setModalTitle('Success');
    setModalMessage('Record permanently deleted!');
    setShowSuccessModal(true);
  } catch (err) {
    console.error('Error deleting record:', err);
    
    // Show error modal
    setModalTitle('Error');
    setModalMessage('Failed to delete record. Please try again.');
    setShowErrorModal(true);
  }
};


  // Filter activity logs
  const filteredActivityLogs = activityLogs.filter(log =>
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter deleted records
  const filteredDeletedRecords = deletedRecords.filter(record => {
    const fullName = `${record.first_name} ${record.surname}`.toLowerCase();
    const refNo = (record.reference_no || '').toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || refNo.includes(searchTerm.toLowerCase());
  });

  // Pagination for activity logs
  const indexOfLastActivity = currentPage * recordsPerPage;
  const indexOfFirstActivity = indexOfLastActivity - recordsPerPage;
  const currentActivityLogs = filteredActivityLogs.slice(indexOfFirstActivity, indexOfLastActivity);
  const totalActivityPages = Math.ceil(filteredActivityLogs.length / recordsPerPage);

  // Pagination for deleted records
  const currentDeletedRecords = filteredDeletedRecords.slice(indexOfFirstActivity, indexOfLastActivity);
  const totalDeletedPages = Math.ceil(filteredDeletedRecords.length / recordsPerPage);

  const getActionBadgeColor = (action) => {
    const colors = {
      'Log In': 'bg-blue-900/50 text-blue-300',
      'Log Out': 'bg-gray-900/50 text-gray-300',
      'Add Registrant': 'bg-green-900/50 text-green-300',
      'Update': 'bg-yellow-900/50 text-yellow-300',
      'Delete': 'bg-red-900/50 text-red-300',
      'Restore': 'bg-purple-900/50 text-purple-300',
      'Import': 'bg-indigo-900/50 text-indigo-300',
      'Export': 'bg-pink-900/50 text-pink-300',
      'Permanent Delete': 'bg-red-900/50 text-red-400'
    };
    return colors[action] || 'bg-gray-900/50 text-gray-300';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-300">Loading history data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-sync mr-2"></i> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">History & Activity Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Track system activities and manage deleted records</p>
        </div>
        <Button 
          onClick={fetchData}
          className="bg-[#444444] hover:bg-[#555555] text-white"
        >
          <i className="fas fa-sync mr-2"></i> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#333333]">
        <Button
          variant={activeTab === 'activity' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('activity');
            setCurrentPage(1);
          }}
          className={activeTab === 'activity' 
            ? 'bg-[#444444] text-white' 
            : 'text-gray-400 hover:text-white hover:bg-[#333333]'}
        >
          <i className="fas fa-history mr-2"></i> Activity Logs
          <Badge className="ml-2 bg-blue-900/50 text-blue-300">{activityLogs.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'deleted' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('deleted');
            setCurrentPage(1);
          }}
          className={activeTab === 'deleted' 
            ? 'bg-[#444444] text-white' 
            : 'text-gray-400 hover:text-white hover:bg-[#333333]'}
        >
          <i className="fas fa-trash-restore mr-2"></i> Deleted Records
          <Badge className="ml-2 bg-red-900/50 text-red-300">{deletedRecords.length}</Badge>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="bg-[#1e1e1e] border-0">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Input
                type="text"
                placeholder={activeTab === 'activity' ? "Search by user, action, or target..." : "Search by name or ID..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#252525] border-[#333333] text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <Card className="bg-[#1e1e1e] border-0">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              System-wide activity logs and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-[#252525]">
                  <TableRow>
                    <TableHead className="text-gray-300">Time</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Target</TableHead>
                    <TableHead className="text-gray-300">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentActivityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentActivityLogs.map((log) => (
                      <TableRow key={log.id} className="border-t border-[#333333] hover:bg-[#252525]">
                        <TableCell className="text-gray-400">
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDateTime(log.created_at)}</span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(log.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-200">{log.user_name}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{log.target}</TableCell>
                        <TableCell className="text-gray-400 font-mono text-sm">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalActivityPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333333]">
                <p className="text-sm text-gray-400">
                  Showing {indexOfFirstActivity + 1} to {Math.min(indexOfLastActivity, filteredActivityLogs.length)} of {filteredActivityLogs.length} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {currentPage} of {totalActivityPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalActivityPages))}
                    disabled={currentPage === totalActivityPages}
                    className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deleted Records Tab */}
      {activeTab === 'deleted' && (
        <Card className="bg-[#1e1e1e] border-0">
          <CardHeader>
            <CardTitle className="text-white">Deleted Records</CardTitle>
            <CardDescription className="text-gray-400">
              Soft-deleted registrants that can be restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-[#252525]">
                  <TableRow>
                    <TableHead className="text-gray-300">Reference No.</TableHead>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Location</TableHead>
                    <TableHead className="text-gray-300">Deleted On</TableHead>
                    <TableHead className="text-gray-300">Reason</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentDeletedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        <i className="fas fa-check-circle text-3xl mb-2"></i>
                        <p>No deleted records found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentDeletedRecords.map((record) => {
                      const address = record.addresses?.[0];
                      return (
                        <TableRow key={record.id} className="border-t border-[#333333] hover:bg-[#252525]">
                          <TableCell className="text-gray-400 font-mono text-sm">
                            {record.reference_no || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-200">
                            {record.first_name} {record.surname}
                          </TableCell>
                          <TableCell>
                            <Badge className={record.registry === 'farmer' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}>
                              {record.registry === 'farmer' ? 'Farmer' : 'Fisherfolk'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {address ? `${address.purok}, ${address.barangay}` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDateTime(record.deleted_at)}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {record.delete_reason || 'No reason provided'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowViewModal(true);
                                }}
                                className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                              >
                                <i className="fas fa-eye mr-1 text-xs"></i> View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowRestoreModal(true);
                                }}
                                className="h-8 border-green-700 bg-transparent hover:bg-green-900/20 text-green-400"
                              >
                                <i className="fas fa-undo mr-1 text-xs"></i> Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowDeleteModal(true);
                                }}
                                className="h-8 border-red-700 bg-transparent hover:bg-red-900/20 text-red-400"
                              >
                                <i className="fas fa-trash-alt mr-1 text-xs"></i> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalDeletedPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333333]">
                <p className="text-sm text-gray-400">
                  Showing {indexOfFirstActivity + 1} to {Math.min(indexOfLastActivity, filteredDeletedRecords.length)} of {filteredDeletedRecords.length} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {currentPage} of {totalDeletedPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalDeletedPages))}
                    disabled={currentPage === totalDeletedPages}
                    className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1e1e1e] border-0 shadow-xl max-w-2xl w-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#333333]">
              <CardTitle className="text-white">Record Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Reference Number</label>
                  <p className="text-white font-mono">{selectedRecord.reference_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Type</label>
                  <p>
                    <Badge className={selectedRecord.registry === 'farmer' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}>
                      {selectedRecord.registry === 'farmer' ? 'Farmer' : 'Fisherfolk'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Full Name</label>
                  <p className="text-white">{selectedRecord.first_name} {selectedRecord.middle_name} {selectedRecord.surname}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Contact Number</label>
                  <p className="text-white">{selectedRecord.mobile_number || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-sm">Address</label>
                  <p className="text-white">
                    {selectedRecord.addresses?.[0] 
                      ? `${selectedRecord.addresses[0].purok}, ${selectedRecord.addresses[0].barangay}, ${selectedRecord.addresses[0].municipality_city}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Deleted On</label>
                  <p className="text-white">{formatDateTime(selectedRecord.deleted_at)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Time Since Deletion</label>
                  <p className="text-white">{formatTimeAgo(selectedRecord.deleted_at)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 text-sm">Deletion Reason</label>
                  <p className="text-white">{selectedRecord.delete_reason || 'No reason provided'}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-[#333333]">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                  className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1e1e1e] border-0 shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-[#333333]">
              <CardTitle className="text-white">Confirm Restore</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-300">
                Are you sure you want to restore this record?
              </p>
              <div className="bg-[#252525] p-4 rounded-md">
                <p className="text-sm text-gray-400">Reference No.</p>
                <p className="text-white font-mono">{selectedRecord.reference_no || 'N/A'}</p>
                <p className="text-sm text-gray-400 mt-2">Name</p>
                <p className="text-white">{selectedRecord.first_name} {selectedRecord.surname}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRestoreModal(false)}
                  className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRestore}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <i className="fas fa-undo mr-2"></i> Restore
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1e1e1e] border-0 shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-[#333333]">
              <CardTitle className="text-white text-red-400">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Permanent Delete
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-300">
                <strong className="text-red-400">Warning:</strong> This action cannot be undone! The record will be permanently deleted from the database.
              </p>
              <div className="bg-[#252525] p-4 rounded-md border border-red-900/50">
                <p className="text-sm text-gray-400">Reference No.</p>
                <p className="text-white font-mono">{selectedRecord.reference_no || 'N/A'}</p>
                <p className="text-sm text-gray-400 mt-2">Name</p>
                <p className="text-white">{selectedRecord.first_name} {selectedRecord.surname}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePermanentDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <i className="fas fa-trash-alt mr-2"></i> Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* ✅ Success Modal */}
{showSuccessModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <div className="flex flex-col items-center text-center">
        {/* Success Icon */}
        <div className="mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {modalTitle}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {modalMessage}
        </p>
        
        {/* Close Button */}
        <Button
          onClick={() => setShowSuccessModal(false)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          OK
        </Button>
      </div>
    </div>
  </div>
)}

{/* ✅ Error Modal */}
{showErrorModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <div className="flex flex-col items-center text-center">
        {/* Error Icon */}
        <div className="mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {modalTitle}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {modalMessage}
        </p>
        
        {/* Close Button */}
        <Button
          onClick={() => setShowErrorModal(false)}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          Close
        </Button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default HistoryPage;