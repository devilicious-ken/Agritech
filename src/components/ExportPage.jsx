import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from 'components/ui/input';

const ExportPage = () => {
  return (
    <div className="p-6 space-y-6">
        <Card className="bg-[#1e1e1e] border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-white text-xl">Export Data</CardTitle>
            <CardDescription className="text-gray-400">Generate reports and export data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <Card className="bg-[#252525] border border-[#333333] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-[#333333] flex items-center justify-center mb-4">
                    <i className="fas fa-map text-blue-400 text-2xl"></i>
                  </div>
                  <h3 className="text-white font-medium mb-2">GIS Data</h3>
                  <p className="text-gray-400 text-sm mb-4">Export KML/KMZ files for GIS applications</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap">
                    <i className="fas fa-file-export mr-2"></i> Export KML
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 bg-[#252525] rounded-lg p-4 border border-[#333333]">
              <h3 className="text-white font-medium mb-4">Export Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Data Type</label>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center">
                        <input type="checkbox" id="farmers" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="farmers" className="ml-2 text-gray-300">Farmers</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="fisherfolks" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="fisherfolks" className="ml-2 text-gray-300">Fisherfolks</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="crops" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="crops" className="ml-2 text-gray-300">Crops</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="animals" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="animals" className="ml-2 text-gray-300">Animals</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Date Range</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">From</label>
                        <Input type="date" className="bg-[#2a2a2a] border-[#333333] text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">To</label>
                        <Input type="date" className="bg-[#2a2a2a] border-[#333333] text-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Include Fields</label>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" id="personal" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="personal" className="ml-2 text-gray-300">Personal Info</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="address" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="address" className="ml-2 text-gray-300">Address</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="contact" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="contact" className="ml-2 text-gray-300">Contact Details</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="farm" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="farm" className="ml-2 text-gray-300">Farm/Fishery Info</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="financial" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="financial" className="ml-2 text-gray-300">Financial Info</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="gis" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="gis" className="ml-2 text-gray-300">GIS Data</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Location Filter</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <select className="w-full h-10 px-3 py-2 bg-[#2a2a2a] border border-[#333333] rounded-md text-white appearance-none cursor-pointer">
                          <option value="">All Barangays</option>
                          <option value="san_isidro">Brgy. San Isidro</option>
                          <option value="mabuhay">Brgy. Mabuhay</option>
                          <option value="bagong_silang">Brgy. Bagong Silang</option>
                          <option value="malaya">Brgy. Malaya</option>
                          <option value="matahimik">Brgy. Matahimik</option>
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                      <div className="relative">
                        <select className="w-full h-10 px-3 py-2 bg-[#2a2a2a] border border-[#333333] rounded-md text-white appearance-none cursor-pointer">
                          <option value="">All Puroks</option>
                          <option value="purok_1">Purok 1</option>
                          <option value="purok_2">Purok 2</option>
                          <option value="purok_3">Purok 3</option>
                          <option value="purok_4">Purok 4</option>
                          <option value="purok_5">Purok 5</option>
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Report Format</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="radio" id="detailed" name="format" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="detailed" className="ml-2 text-gray-300">Detailed Report</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="summary" name="format" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="summary" className="ml-2 text-gray-300">Summary Report</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="statistical" name="format" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="statistical" className="ml-2 text-gray-300">Statistical Report</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Additional Options</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" id="charts" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="charts" className="ml-2 text-gray-300">Include Charts</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="paginate" className="h-4 w-4 text-blue-600" defaultChecked />
                        <label htmlFor="paginate" className="ml-2 text-gray-300">Paginate Report</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="compress" className="h-4 w-4 text-blue-600" />
                        <label htmlFor="compress" className="ml-2 text-gray-300">Compress Output</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap">
                Reset Options
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button whitespace-nowrap">
                <i className="fas fa-file-export mr-2"></i> Generate Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default ExportPage;