import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';

const ImportPage = () => {
  return (
    <div className="p-6 space-y-6">
        <Card className="bg-[#1e1e1e] border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-white text-xl">Import Data</CardTitle>
            <CardDescription className="text-gray-400">Upload CSV files to import farmer and fisherfolk records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center bg-[#252525]">
                <div className="mx-auto h-16 w-16 rounded-full bg-[#333333] flex items-center justify-center mb-4">
                  <i className="fas fa-file-upload text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-white font-medium mb-2">Upload CSV File</h3>
                <p className="text-gray-400 text-sm mb-4">Drag and drop your file here, or click to browse</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap">
                  <i className="fas fa-folder-open mr-2"></i> Browse Files
                </Button>
                <p className="text-gray-500 text-xs mt-4">Supported formats: .CSV, .XLS, .XLSX (max 10MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e1e] border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-white text-xl">Export Data</CardTitle>
            <CardDescription className="text-gray-400">Generate reports and export data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
              <Card className="bg-[#252525] border border-[#333333] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-[#333333] flex items-center justify-center mb-4">
                    <i className="fas fa-file-pdf text-red-400 text-2xl"></i>
                  </div>
                  <h3 className="text-white font-medium mb-2">PDF Reports</h3>
                  <p className="text-gray-400 text-sm mb-4">Generate formatted reports with charts and tables</p>
                  <Button className="bg-red-600 hover:bg-red-700 text-white !rounded-button whitespace-nowrap">
                    <i className="fas fa-file-export mr-2"></i> Export PDF
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#252525] border border-[#333333] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-[#333333] flex items-center justify-center mb-4">
                    <i className="fas fa-file-csv text-green-400 text-2xl"></i>
                  </div>
                  <h3 className="text-white font-medium mb-2">CSV Data</h3>
                  <p className="text-gray-400 text-sm mb-4">Export raw data for further analysis or backup</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap">
                    <i className="fas fa-file-export mr-2"></i> Export CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};


export default ImportPage;