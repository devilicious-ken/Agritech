import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { ScrollArea } from 'components/ui/scroll-area';
import { Button } from "components/ui/button";

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Mock data for deleted records
  const deletedRecords = [
    { id: 'RS-2025-0034', name: 'Eduardo Santos', type: 'Farmer', date: '2025-09-15', by: 'John Doe', reason: 'Duplicate record', location: 'Quezon City', contact: '09123456789' },
    { id: 'RS-2025-0056', name: 'Maria Gonzales', type: 'Fisherfolk', date: '2025-09-14', by: 'Maria Santos', reason: 'Incorrect information', location: 'Marikina City', contact: '09234567890' },
    { id: 'RS-2025-0078', name: 'Roberto Cruz', type: 'Farmer', date: '2025-09-12', by: 'John Doe', reason: 'Requested by registrant', location: 'Pasig City', contact: '09345678901' },
    { id: 'RS-2025-0091', name: 'Ana Reyes', type: 'Agri-youth', date: '2025-09-10', by: 'Carlos Reyes', reason: 'Moved to different region', location: 'Mandaluyong City', contact: '09456789012' },
    { id: 'RS-2025-0112', name: 'Pedro Lim', type: 'Farmer', date: '2025-09-08', by: 'Maria Santos', reason: 'Duplicate record', location: 'San Juan City', contact: '09567890123' },
    { id: 'RS-2025-0134', name: 'Carmen Dela Cruz', type: 'Fisherfolk', date: '2025-09-06', by: 'Ana Garcia', reason: 'Invalid documents', location: 'Muntinlupa City', contact: '09678901234' },
    { id: 'RS-2025-0156', name: 'Miguel Torres', type: 'Agri-youth', date: '2025-09-04', by: 'Roberto Silva', reason: 'Age verification failed', location: 'Parañaque City', contact: '09789012345' }
  ];

  // Mock data for activity logs
  const activityLogs = [
    { user: 'John Doe', action: 'Log In', target: 'System', time: '10 minutes ago', ip: '192.168.1.100' },
    { user: 'Maria Santos', action: 'Register', target: 'RS-2025-0200 (New Farmer)', time: '25 minutes ago', ip: '192.168.1.101' },
    { user: 'Carlos Reyes', action: 'Export', target: 'Registry Data (PDF)', time: '1 hour ago', ip: '192.168.1.102' },
    { user: 'Ana Garcia', action: 'Edit', target: 'RS-2025-0198 (Jose Martinez)', time: '2 hours ago', ip: '192.168.1.103' },
    { user: 'Roberto Silva', action: 'Delete', target: 'RS-2025-0134 (Carmen Dela Cruz)', time: '3 hours ago', ip: '192.168.1.104' },
    { user: 'Elena Tan', action: 'Import', target: 'Bulk Registry Data (50 records)', time: '4 hours ago', ip: '192.168.1.105' },
    { user: 'Miguel Cruz', action: 'Log Out', target: 'System', time: '5 hours ago', ip: '192.168.1.106' },
    { user: 'Sofia Reyes', action: 'Register', target: 'RS-2025-0199 (New Fisherfolk)', time: '6 hours ago', ip: '192.168.1.107' },
    { user: 'David Lim', action: 'Edit', target: 'RS-2025-0197 (Ana Villanueva)', time: '8 hours ago', ip: '192.168.1.108' },
    { user: 'Carmen Santos', action: 'Export', target: 'Activity Report (Excel)', time: '1 day ago', ip: '192.168.1.109' },
    { user: 'Luis Garcia', action: 'Log In', target: 'System', time: '1 day ago', ip: '192.168.1.110' },
    { user: 'Isabella Cruz', action: 'Delete', target: 'RS-2025-0132 (Pedro Morales)', time: '2 days ago', ip: '192.168.1.111' }
  ];

  // Filter records based on search term
  const filteredRecords = deletedRecords.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleRestore = (record) => {
    setSelectedRecord(record);
    setShowRestoreModal(true);
  };

  const handlePermanentDelete = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const confirmRestore = () => {
    // Logic to restore record
    alert(`Record ${selectedRecord.id} has been restored successfully!`);
    setShowRestoreModal(false);
    setSelectedRecord(null);
  };

  const confirmPermanentDelete = () => {
    // Logic to permanently delete record
    alert(`Record ${selectedRecord.id} has been permanently deleted!`);
    setShowDeleteModal(false);
    setSelectedRecord(null);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Log In': return 'bg-green-900/50 text-green-300';
      case 'Log Out': return 'bg-gray-900/50 text-gray-300';
      case 'Register': return 'bg-blue-900/50 text-blue-300';
      case 'Edit': return 'bg-yellow-900/50 text-yellow-300';
      case 'Delete': return 'bg-red-900/50 text-red-300';
      case 'Import': return 'bg-purple-900/50 text-purple-300';
      case 'Export': return 'bg-indigo-900/50 text-indigo-300';
      default: return 'bg-gray-900/50 text-gray-300';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'Log In': return 'fa-sign-in-alt';
      case 'Log Out': return 'fa-sign-out-alt';
      case 'Register': return 'fa-plus-circle';
      case 'Edit': return 'fa-edit';
      case 'Delete': return 'fa-trash';
      case 'Import': return 'fa-upload';
      case 'Export': return 'fa-download';
      default: return 'fa-circle';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Soft Deleted Data Section */}
      <Card className="bg-[#1e1e1e] border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-xl">Soft Deleted Data</CardTitle>
          <div className="flex gap-3">
            <div className="relative">
              <Input 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 bg-[#252525] border-[#333333] text-white placeholder:text-gray-500"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilterModal(true)}
              className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-filter mr-2"></i> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#252525]">
                <TableRow>
                  <TableHead className="text-gray-300 w-[100px]">RSBSA No.</TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Deleted On</TableHead>
                  <TableHead className="text-gray-300">Deleted By</TableHead>
                  <TableHead className="text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record) => (
                  <TableRow key={record.id} className="border-t border-[#333333] hover:bg-[#252525]">
                    <TableCell className="text-gray-400 font-mono">{record.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-200">{record.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        record.type === 'Farmer' ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' :
                        record.type === 'Fisherfolk' ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' :
                        'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70'
                      }>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{record.date}</TableCell>
                    <TableCell className="text-gray-400">{record.by}</TableCell>
                    <TableCell className="text-gray-400">{record.reason}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleView(record)}
                          className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
                        >
                          <i className="fas fa-eye mr-1 text-xs"></i> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRestore(record)}
                          className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-green-400 hover:text-green-300 !rounded-button whitespace-nowrap"
                        >
                          <i className="fas fa-undo mr-1 text-xs"></i> Restore
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePermanentDelete(record)}
                          className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-red-400 hover:text-red-300 !rounded-button whitespace-nowrap"
                        >
                          <i className="fas fa-trash-alt mr-1 text-xs"></i> Permanent Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} deleted records
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap disabled:opacity-50"
              >
                <i className="fas fa-chevron-left mr-1 text-xs"></i> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap disabled:opacity-50"
              >
                Next <i className="fas fa-chevron-right ml-1 text-xs"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Section */}
      <Card className="bg-[#1e1e1e] border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-white text-lg">Activity Logs</CardTitle>
          <CardDescription className="text-gray-400">Recorded activities including Log In, Log Out, Import, Export, Register, Edit, Delete</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#252525]">
                <TableRow>
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Action</TableHead>
                  <TableHead className="text-gray-300">Target</TableHead>
                  <TableHead className="text-gray-300">Time</TableHead>
                  <TableHead className="text-gray-300">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log, index) => (
                  <TableRow key={index} className="border-t border-[#333333] hover:bg-[#252525]">
                    <TableCell className="text-gray-200 font-medium">{log.user}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#333333] flex items-center justify-center">
                          <i className={`fas ${getActionIcon(log.action)} text-xs text-gray-400`}></i>
                        </div>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">{log.target}</TableCell>
                    <TableCell className="text-gray-400">
                      <i className="fas fa-clock mr-1 text-xs"></i>
                      {log.time}
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-sm">{log.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Filter Options</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Type</label>
                <select className="w-full bg-[#252525] border border-[#333333] text-white p-2 rounded">
                  <option value="">All Types</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Fisherfolk">Fisherfolk</option>
                  <option value="Agri-youth">Agri-youth</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <Input type="date" className="bg-[#252525] border-[#333333] text-white" />
                  <Input type="date" className="bg-[#252525] border-[#333333] text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-[#333333] hover:bg-[#404040] text-white"
              >
                Apply Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilterModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Record Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm">RSBSA No.</label>
                <p className="text-white font-mono">{selectedRecord.id}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <p className="text-white">{selectedRecord.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Type</label>
                <p className="text-white">{selectedRecord.type}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Location</label>
                <p className="text-white">{selectedRecord.location}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Contact</label>
                <p className="text-white">{selectedRecord.contact}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Deleted On</label>
                <p className="text-white">{selectedRecord.date}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Deleted By</label>
                <p className="text-white">{selectedRecord.by}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Reason</label>
                <p className="text-white">{selectedRecord.reason}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowViewModal(false)}
              className="w-full mt-6 bg-[#333333] hover:bg-[#404040] text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Confirm Restore</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to restore the record for <strong className="text-white">{selectedRecord.name}</strong> ({selectedRecord.id})?
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={confirmRestore}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <i className="fas fa-undo mr-2"></i>
                Restore
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRestoreModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-96">
            <h3 className="text-white text-lg font-semibold mb-4">Confirm Permanent Delete</h3>
            <div className="bg-red-900/20 border border-red-900/50 rounded p-3 mb-4">
              <p className="text-red-300 text-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                This action cannot be undone. The record will be permanently deleted from the system.
              </p>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete the record for <strong className="text-white">{selectedRecord.name}</strong> ({selectedRecord.id})?
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={confirmPermanentDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                Permanent Delete
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;