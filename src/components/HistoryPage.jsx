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
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('activity');
  const recordsPerPage = 10;

  // ✅ State for database data
  const [activityLogs, setActivityLogs] = useState([]);
  const [deletedRecords, setDeletedRecords] = useState([]);
  const [logArchives, setLogArchives] = useState([]);
  const [expandedArchive, setExpandedArchive] = useState(null);
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

      // Fetch log archives
      const archives = await ApiService.getLogArchives();
      setLogArchives(archives || []);

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
  const indexOfFirstDeleted = indexOfFirstActivity;
  const indexOfLastDeleted = indexOfLastActivity;
  const currentDeletedRecords = filteredDeletedRecords.slice(indexOfFirstDeleted, indexOfLastDeleted);
  const totalDeletedPages = Math.ceil(filteredDeletedRecords.length / recordsPerPage);

  const getActionBadgeColor = (action) => {
    const colors = {
      'Log In': 'bg-blue-900/50 text-blue-300',
      'Log Out': 'bg-gray-900/50 text-muted-foreground',
      'Add Registrant': 'bg-green-900/50 text-green-300',
      'Update': 'bg-yellow-900/50 text-yellow-300',
      'Delete': 'bg-red-900/50 text-red-300',
      'Restore': 'bg-purple-900/50 text-purple-300',
      'Import': 'bg-indigo-900/50 text-indigo-300',
      'Export': 'bg-pink-900/50 text-pink-300',
      'Permanent Delete': 'bg-red-900/50 text-red-400'
    };
    return colors[action] || 'bg-gray-900/50 text-muted-foreground';
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

  // Download archive as CSV
  const downloadArchiveAsCSV = (archive) => {
    try {
      const logs = archive.archive_data;
      
      // CSV headers
      const headers = ['Time', 'User', 'Action', 'Target'];
      
      // Convert logs to CSV rows
      const rows = logs.map(log => [
        new Date(log.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        log.user_name,
        log.action,
        log.target
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity_logs_${archive.archive_date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      setModalTitle('Success');
      setModalMessage(`Downloaded ${archive.total_logs} logs from ${formatDate(archive.archive_date)}`);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setModalTitle('Error');
      setModalMessage('Failed to download archive. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const count = deletedRecords.length;
      
      // Delete all records one by one
      for (const record of deletedRecords) {
        await ApiService.permanentDeleteRegistrant(record.id);
      }
      
      setModalTitle('Success');
      setModalMessage(`Successfully deleted all ${count} record${count !== 1 ? 's' : ''} permanently.`);
      setShowSuccessModal(true);
      setShowDeleteAllModal(false);
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error deleting all records:', err);
      setModalTitle('Error');
      setModalMessage('Failed to delete all records. Some records may have been deleted.');
      setShowErrorModal(true);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
          <p className="text-foreground">Loading history data...</p>
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
          <h1 className="text-2xl font-bold text-foreground">History & Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Track system activities and manage deleted records</p>
        </div>
        <Button 
          onClick={fetchData}
          className="bg-accent hover:bg-accent/80 text-foreground"
        >
          <i className="fas fa-sync mr-2"></i> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <Button
          variant={activeTab === 'activity' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('activity');
            setCurrentPage(1);
          }}
          className={activeTab === 'activity' 
            ? 'bg-teal-600 hover:bg-teal-700 text-foreground font-semibold border-b-2 border-teal-400 rounded-b-none' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-b-2 border-transparent rounded-b-none'}
        >
          <i className="fas fa-history mr-2"></i> Activity Logs
          <Badge className={activeTab === 'activity' ? 'ml-2 bg-teal-800 text-teal-200' : 'ml-2 bg-blue-900/50 text-blue-300'}>{activityLogs.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'deleted' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('deleted');
            setCurrentPage(1);
          }}
          className={activeTab === 'deleted' 
            ? 'bg-teal-600 hover:bg-teal-700 text-foreground font-semibold border-b-2 border-teal-400 rounded-b-none' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-b-2 border-transparent rounded-b-none'}
        >
          <i className="fas fa-trash-restore mr-2"></i> Deleted Records
          <Badge className={activeTab === 'deleted' ? 'ml-2 bg-teal-800 text-teal-200' : 'ml-2 bg-red-900/50 text-red-300'}>{deletedRecords.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'archives' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('archives');
            setCurrentPage(1);
          }}
          className={activeTab === 'archives' 
            ? 'bg-teal-600 hover:bg-teal-700 text-foreground font-semibold border-b-2 border-teal-400 rounded-b-none' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-b-2 border-transparent rounded-b-none'}
        >
          <i className="fas fa-archive mr-2"></i> Log Archives
          <Badge className={activeTab === 'archives' ? 'ml-2 bg-teal-800 text-teal-200' : 'ml-2 bg-purple-900/50 text-purple-300'}>{logArchives.length}</Badge>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="bg-card border-0">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Search by user, action, or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <Card className="bg-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">
              System-wide activity logs and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-muted-foreground">Time</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    <TableHead className="text-muted-foreground">Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentActivityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentActivityLogs.map((log) => (
                      <TableRow key={log.id} className="border-t dark:border-border/10 border-border hover:bg-muted/80">
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDateTime(log.created_at)}</span>
                            <span className="text-xs text-muted-foreground/70">{formatTimeAgo(log.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{log.user_name}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{log.target}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalActivityPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-border/10 border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {indexOfFirstActivity + 1} to {Math.min(indexOfLastActivity, filteredActivityLogs.length)} of {filteredActivityLogs.length} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-border bg-transparent hover:bg-muted text-muted-foreground"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Button>
                  <span className="px-4 py-2 text-muted-foreground">
                    Page {currentPage} of {totalActivityPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalActivityPages))}
                    disabled={currentPage === totalActivityPages}
                    className="border-border bg-transparent hover:bg-muted text-muted-foreground"
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
        <Card className="bg-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Deleted Registrants</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage and restore deleted records
                </CardDescription>
              </div>
              {deletedRecords.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAllModal(true)}
                  className="border-red-700 bg-transparent hover:bg-red-900/20 text-red-400"
                >
                  <i className="fas fa-trash-alt mr-2"></i> Delete All ({deletedRecords.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-muted-foreground">Reference No.</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Registry</TableHead>
                    <TableHead className="text-muted-foreground">Address</TableHead>
                    <TableHead className="text-muted-foreground">Deleted At</TableHead>
                    <TableHead className="text-muted-foreground">Reason</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentDeletedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        <i className="fas fa-check-circle text-3xl mb-2"></i>
                        <p>No deleted records found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentDeletedRecords.map((record) => {
                      const address = record.addresses?.[0];
                      return (
                        <TableRow key={record.id} className="border-t dark:border-border/10 border-border hover:bg-muted/80">
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {record.reference_no || 'N/A'}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {record.first_name} {record.surname}
                          </TableCell>
                          <TableCell>
                            <Badge className={record.registry === 'farmer' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}>
                              {record.registry === 'farmer' ? 'Farmer' : 'Fisherfolk'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {address ? `${address.purok}, ${address.barangay}` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(record.deleted_at)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
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
                                className="h-8 border-border bg-transparent hover:bg-muted text-muted-foreground"
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-border/10 border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {indexOfFirstDeleted + 1} to {Math.min(indexOfLastDeleted, filteredDeletedRecords.length)} of {filteredDeletedRecords.length} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-border bg-transparent hover:bg-muted text-muted-foreground"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </Button>
                  <span className="px-4 py-2 text-muted-foreground">
                    Page {currentPage} of {totalDeletedPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalDeletedPages))}
                    disabled={currentPage === totalDeletedPages}
                    className="border-border bg-transparent hover:bg-muted text-muted-foreground"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Log Archives Tab */}
      {activeTab === 'archives' && (
        <Card className="bg-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">Log Archives</CardTitle>
            <CardDescription className="text-muted-foreground">
              Archived activity logs grouped by date (last 14 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {logArchives.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <i className="fas fa-archive text-3xl mb-2"></i>
                    <p>No archived logs found</p>
                  </div>
                ) : (
                  logArchives.map((archive) => (
                    <Card key={archive.id} className="bg-muted border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-archive text-purple-400"></i>
                            <div>
                              <h3 className="text-foreground font-semibold">{formatDate(archive.archive_date)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {archive.total_logs} log{archive.total_logs !== 1 ? 's' : ''} archived
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadArchiveAsCSV(archive)}
                              className="h-8 border-green-700 bg-transparent hover:bg-green-900/20 text-green-400"
                            >
                              <i className="fas fa-download mr-1 text-xs"></i> Download CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedArchive(expandedArchive === archive.id ? null : archive.id)}
                              className="h-8 border-border bg-transparent hover:bg-muted text-muted-foreground"
                            >
                              <i className={`fas fa-chevron-${expandedArchive === archive.id ? 'up' : 'down'} mr-1 text-xs`}></i>
                              {expandedArchive === archive.id ? 'Collapse' : 'Expand'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {expandedArchive === archive.id && (
                        <CardContent className="pt-0">
                          <div className="border-t dark:border-border/10 border-border pt-4">
                            <Table>
                              <TableHeader className="bg-card">
                                <TableRow>
                                  <TableHead className="text-muted-foreground">Time</TableHead>
                                  <TableHead className="text-muted-foreground">User</TableHead>
                                  <TableHead className="text-muted-foreground">Action</TableHead>
                                  <TableHead className="text-muted-foreground">Target</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {archive.archive_data.map((log, index) => (
                                  <TableRow key={index} className="border-t dark:border-border/10 border-border hover:bg-muted/80">
                                    <TableCell className="text-muted-foreground text-sm">
                                      {formatDateTime(log.created_at)}
                                    </TableCell>
                                    <TableCell className="text-foreground">{log.user_name}</TableCell>
                                    <TableCell>
                                      <Badge className={getActionBadgeColor(log.action)}>
                                        {log.action}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{log.target}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border border-gray-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700 bg-gray-800/95 sticky top-0 z-10">
              <CardTitle className="text-white">Record Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="border-gray-600 bg-transparent hover:bg-gray-700 text-gray-300"
              >
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Reference Number</label>
                    <p className="text-white font-mono mt-1">{selectedRecord.reference_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Type</label>
                    <p className="mt-1">
                      <Badge className={selectedRecord.registry === 'farmer' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}>
                        {selectedRecord.registry === 'farmer' ? 'Farmer' : 'Fisherfolk'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Full Name</label>
                    <p className="text-white mt-1">{selectedRecord.first_name} {selectedRecord.middle_name} {selectedRecord.surname}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Contact Number</label>
                    <p className="text-white mt-1">{selectedRecord.mobile_number || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm font-medium">Address</label>
                    <p className="text-white mt-1">
                      {selectedRecord.addresses?.[0] 
                        ? `${selectedRecord.addresses[0].purok}, ${selectedRecord.addresses[0].barangay}, ${selectedRecord.addresses[0].municipality_city}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Deleted On</label>
                    <p className="text-white mt-1">{formatDateTime(selectedRecord.deleted_at)}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Time Since Deletion</label>
                    <p className="text-white mt-1">{formatTimeAgo(selectedRecord.deleted_at)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm font-medium">Deletion Reason</label>
                    <p className="text-white mt-1">{selectedRecord.delete_reason || 'No reason provided'}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                    className="border-gray-600 bg-transparent hover:bg-gray-700 text-gray-300"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">Confirm Restore</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                Are you sure you want to restore this record?
              </p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Reference No.</p>
                <p className="text-foreground font-mono">{selectedRecord.reference_no || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-2">Name</p>
                <p className="text-foreground">{selectedRecord.first_name} {selectedRecord.surname}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRestoreModal(false)}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRestore}
                  className="bg-green-600 hover:bg-green-700 text-foreground"
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
          <Card className="bg-card border shadow-xl max-w-md w-full">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground text-red-400">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Permanent Delete
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                <strong className="text-red-400">Warning:</strong> This action cannot be undone! The record will be permanently deleted from the database.
              </p>
              <div className="bg-muted p-4 rounded-md border border-red-900/50">
                <p className="text-sm text-muted-foreground">Reference No.</p>
                <p className="text-foreground font-mono">{selectedRecord.reference_no || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-2">Name</p>
                <p className="text-foreground">{selectedRecord.first_name} {selectedRecord.surname}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="border-border bg-transparent hover:bg-accent text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePermanentDelete}
                  className="bg-red-600 hover:bg-red-700 text-foreground"
                >
                  <i className="fas fa-trash-alt mr-2"></i> Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-card border border-red-700">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                Delete All Records
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                This action cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to permanently delete <span className="font-bold text-red-400">{deletedRecords.length}</span> deleted record{deletedRecords.length !== 1 ? 's' : ''}?
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                This will permanently remove all deleted registrants from the database. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAllModal(false)}
                  className="border-border bg-transparent hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAll}
                  className="bg-red-600 hover:bg-red-700 text-foreground"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete All Permanently
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
          {modalTitle}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-muted-foreground mb-6">
          {modalMessage}
        </p>
        
        {/* Close Button */}
        <Button
          onClick={() => setShowSuccessModal(false)}
          className="w-full bg-green-600 hover:bg-green-700 text-foreground"
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
          {modalTitle}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-muted-foreground mb-6">
          {modalMessage}
        </p>
        
        {/* Close Button */}
        <Button
          onClick={() => setShowErrorModal(false)}
          className="w-full bg-red-600 hover:bg-red-700 text-foreground"
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
