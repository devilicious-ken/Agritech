import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Badge } from "components/ui/badge";

const RsbsaRecordsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const [records, setRecords] = useState([
      {
        id: 'RS-2025-0001',
        name: 'Juan Dela Cruz',
        address: 'Brgy. San Isidro, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-05-12',
        modifiedOn: '2025-05-15',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Rice', 'Corn'],
        farmSize: '2.5 hectares',
        phone: '09123456789',
        coordinates: '11.2428, 125.0048'
      },
      {
        id: 'RS-2025-0002',
        name: 'Maria Reyes',
        address: 'Brgy. Mabuhay, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-05-15',
        modifiedOn: '2025-05-18',
        modifiedBy: 'Ana Lim',
        status: 'Updating',
        fishing: ['Municipal Waters'],
        boatType: 'Motorized Banca',
        phone: '09234567890',
        coordinates: '11.2528, 125.0148'
      },
      {
        id: 'RS-2025-0003',
        name: 'Pedro Santos',
        address: 'Brgy. Bagong Silang, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-05-18',
        modifiedOn: '2025-05-18',
        modifiedBy: 'Roberto Cruz',
        status: 'Created',
        crops: ['Coconut', 'Banana'],
        farmSize: '3.2 hectares',
        phone: '09345678901',
        coordinates: '11.2628, 125.0248'
      },
      {
        id: 'RS-2025-0004',
        name: 'Ana Gonzales',
        address: 'Brgy. Malaya, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-05-20',
        modifiedOn: '2025-05-22',
        modifiedBy: 'John Doe',
        status: 'Updated',
        fishing: ['Commercial Waters'],
        boatType: 'Steel Hulled Vessel',
        phone: '09456789012',
        coordinates: '11.2728, 125.0348'
      },
      {
        id: 'RS-2025-0005',
        name: 'Roberto Lim',
        address: 'Brgy. Matahimik, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-05-22',
        modifiedOn: '2025-05-24',
        modifiedBy: 'Lisa Wang',
        status: 'Updated',
        crops: ['Vegetables', 'Fruits'],
        farmSize: '1.8 hectares',
        phone: '09567890123',
        coordinates: '11.2828, 125.0448'
      },
      {
        id: 'RS-2025-0006',
        name: 'Carla Mendoza',
        address: 'Brgy. Pag-asa, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-05-25',
        modifiedOn: '2025-05-27',
        modifiedBy: 'Jose Ramirez',
        status: 'Created',
        employer: 'Santos Family Farm',
        role: 'Rice Harvester',
        phone: '09678901234',
        coordinates: '11.2928, 125.0548'
      },
      {
        id: 'RS-2025-0007',
        name: 'Daniel Cruz',
        address: 'Brgy. San Jose, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-05-26',
        modifiedOn: '2025-05-28',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Rice', 'Vegetables'],
        farmSize: '4.0 hectares',
        phone: '09789012345',
        coordinates: '11.3028, 125.0648'
      },
      {
        id: 'RS-2025-0008',
        name: 'Josefa Ramos',
        address: 'Brgy. Kalinaw, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-05-28',
        modifiedOn: '2025-05-29',
        modifiedBy: 'Ana Lim',
        status: 'Updating',
        fishing: ['Municipal Waters'],
        boatType: 'Non-motorized Banca',
        phone: '09890123456',
        coordinates: '11.3128, 125.0748'
      },
      {
        id: 'RS-2025-0009',
        name: 'Luis Delgado',
        address: 'Brgy. Masagana, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-05-29',
        modifiedOn: '2025-05-30',
        modifiedBy: 'John Doe',
        status: 'Created',
        employer: 'Reyes Agricultural Corp',
        role: 'Coconut Climber',
        phone: '09901234567',
        coordinates: '11.3228, 125.0848'
      },
      {
        id: 'RS-2025-0010',
        name: 'Sofia Aquino',
        address: 'Brgy. Luntian, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-05-30',
        modifiedOn: '2025-06-01',
        modifiedBy: 'Lisa Wang',
        status: 'Updated',
        crops: ['Rootcrops', 'Vegetables'],
        farmSize: '2.0 hectares',
        phone: '09111222333',
        coordinates: '11.3328, 125.0948'
      },
      {
        id: 'RS-2025-0011',
        name: 'Ramon Villanueva',
        address: 'Brgy. Bagong Buhay, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-02',
        modifiedOn: '2025-06-03',
        modifiedBy: 'Maria Santos',
        status: 'Created',
        crops: ['Rice', 'Sugarcane'],
        farmSize: '5.5 hectares',
        phone: '09122334455',
        coordinates: '11.3428, 125.1048'
      },
      {
        id: 'RS-2025-0012',
        name: 'Elena Cruz',
        address: 'Brgy. Paglaum, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-03',
        modifiedOn: '2025-06-05',
        modifiedBy: 'Ana Lim',
        status: 'Updated',
        fishing: ['Commercial Waters'],
        boatType: 'Fiberglass Boat',
        phone: '09133445566',
        coordinates: '11.3528, 125.1148'
      },
      {
        id: 'RS-2025-0013',
        name: 'Mark Bautista',
        address: 'Brgy. Kaunlaran, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-05',
        modifiedOn: '2025-06-06',
        modifiedBy: 'Jose Ramirez',
        status: 'Updating',
        employer: 'Aquino Plantations',
        role: 'Sugarcane Cutter',
        phone: '09144556677',
        coordinates: '11.3628, 125.1248'
      },
      {
        id: 'RS-2025-0014',
        name: 'Patricia Flores',
        address: 'Brgy. Masinop, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-06',
        modifiedOn: '2025-06-07',
        modifiedBy: 'Lisa Wang',
        status: 'Created',
        crops: ['Banana', 'Papaya'],
        farmSize: '1.5 hectares',
        phone: '09155667788',
        coordinates: '11.3728, 125.1348'
      },
      {
        id: 'RS-2025-0015',
        name: 'Carlos Hernandez',
        address: 'Brgy. Maharlika, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-07',
        modifiedOn: '2025-06-09',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Corn', 'Cassava'],
        farmSize: '6.0 hectares',
        phone: '09166778899',
        coordinates: '11.3828, 125.1448'
      },
      {
        id: 'RS-2025-0016',
        name: 'Angela Navarro',
        address: 'Brgy. Kapayapaan, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-08',
        modifiedOn: '2025-06-10',
        modifiedBy: 'Ana Lim',
        status: 'Created',
        fishing: ['Municipal Waters'],
        boatType: 'Wooden Boat',
        phone: '09177889900',
        coordinates: '11.3928, 125.1548'
      },
      {
        id: 'RS-2025-0017',
        name: 'Miguel Ramos',
        address: 'Brgy. Maganda, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-10',
        modifiedOn: '2025-06-11',
        modifiedBy: 'Jose Ramirez',
        status: 'Updated',
        employer: 'Delgado Farms',
        role: 'Vegetable Planter',
        phone: '09188990011',
        coordinates: '11.4028, 125.1648'
      },
      {
        id: 'RS-2025-0018',
        name: 'Isabel Cortez',
        address: 'Brgy. Maligaya, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-11',
        modifiedOn: '2025-06-12',
        modifiedBy: 'Lisa Wang',
        status: 'Updating',
        crops: ['Flowers', 'Vegetables'],
        farmSize: '1.2 hectares',
        phone: '09199001122',
        coordinates: '11.4128, 125.1748'
      },
      {
        id: 'RS-2025-0019',
        name: 'Victor Garcia',
        address: 'Brgy. Mapayapa, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-12',
        modifiedOn: '2025-06-13',
        modifiedBy: 'Maria Santos',
        status: 'Created',
        crops: ['Cacao', 'Coffee'],
        farmSize: '3.8 hectares',
        phone: '09200112233',
        coordinates: '11.4228, 125.1848'
      },
      {
        id: 'RS-2025-0020',
        name: 'Liza Fernandez',
        address: 'Brgy. Luntian, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-13',
        modifiedOn: '2025-06-15',
        modifiedBy: 'Ana Lim',
        status: 'Updated',
        fishing: ['Commercial Waters'],
        boatType: 'Motorized Banca',
        phone: '09211223344',
        coordinates: '11.4328, 125.1948'
      },
      {
        id: 'RS-2025-0021',
        name: 'Ricardo Lopez',
        address: 'Brgy. Kaangayan, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-14',
        modifiedOn: '2025-06-16',
        modifiedBy: 'Jose Ramirez',
        status: 'Created',
        employer: 'Hernandez Family Farm',
        role: 'Banana Harvester',
        phone: '09222334455',
        coordinates: '11.4428, 125.2048'
      },
      {
        id: 'RS-2025-0022',
        name: 'Marites David',
        address: 'Brgy. Kalayaan, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-15',
        modifiedOn: '2025-06-16',
        modifiedBy: 'Lisa Wang',
        status: 'Created',
        crops: ['Tomatoes', 'Eggplants'],
        farmSize: '1.6 hectares',
        phone: '09233445566',
        coordinates: '11.4528, 125.2148'
      },
      {
        id: 'RS-2025-0023',
        name: 'Francisco Jimenez',
        address: 'Brgy. Matatag, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-16',
        modifiedOn: '2025-06-17',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Pineapple', 'Papaya'],
        farmSize: '2.7 hectares',
        phone: '09244556677',
        coordinates: '11.4628, 125.2248'
      },
      {
        id: 'RS-2025-0024',
        name: 'Angela Diaz',
        address: 'Brgy. Kanlungan, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-17',
        modifiedOn: '2025-06-19',
        modifiedBy: 'Ana Lim',
        status: 'Updating',
        fishing: ['Municipal Waters'],
        boatType: 'Fiberglass Boat',
        phone: '09255667788',
        coordinates: '11.4728, 125.2348'
      },
      {
        id: 'RS-2025-0025',
        name: 'Jose Ramos',
        address: 'Brgy. Malikhain, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-18',
        modifiedOn: '2025-06-19',
        modifiedBy: 'Jose Ramirez',
        status: 'Created',
        employer: 'Villanueva Plantations',
        role: 'Fruit Picker',
        phone: '09266778899',
        coordinates: '11.4828, 125.2448'
      },
      {
        id: 'RS-2025-0026',
        name: 'Camila Torres',
        address: 'Brgy. Mahigugmaon, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-19',
        modifiedOn: '2025-06-20',
        modifiedBy: 'Lisa Wang',
        status: 'Created',
        crops: ['Vegetables', 'Herbs'],
        farmSize: '1.4 hectares',
        phone: '09277889900',
        coordinates: '11.4928, 125.2548'
      },
      {
        id: 'RS-2025-0027',
        name: 'Diego Castillo',
        address: 'Brgy. Makabayan, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-20',
        modifiedOn: '2025-06-21',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Rice', 'Vegetables', 'Coconut'],
        farmSize: '7.0 hectares',
        phone: '09288990011',
        coordinates: '11.5028, 125.2648'
      },
      {
        id: 'RS-2025-0028',
        name: 'Teresa Morales',
        address: 'Brgy. Kapatiran, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-21',
        modifiedOn: '2025-06-22',
        modifiedBy: 'Ana Lim',
        status: 'Created',
        fishing: ['Commercial Waters'],
        boatType: 'Steel Hulled Vessel',
        phone: '09299001122',
        coordinates: '11.5128, 125.2748'
      },
      {
        id: 'RS-2025-0029',
        name: 'Eduardo Perez',
        address: 'Brgy. Kalinga, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-22',
        modifiedOn: '2025-06-23',
        modifiedBy: 'Jose Ramirez',
        status: 'Updating',
        employer: 'Garcia Agricultural Estate',
        role: 'Carabao Tender',
        phone: '09300112233',
        coordinates: '11.5228, 125.2848'
      },
      {
        id: 'RS-2025-0030',
        name: 'Helena Ramos',
        address: 'Brgy. Katipunan, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-23',
        modifiedOn: '2025-06-24',
        modifiedBy: 'Lisa Wang',
        status: 'Updated',
        crops: ['Corn', 'Mango'],
        farmSize: '2.2 hectares',
        phone: '09311223344',
        coordinates: '11.5328, 125.2948'
      },
      {
        id: 'RS-2025-0031',
        name: 'Rogelio Bautista',
        address: 'Brgy. Pag-ibig, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-25',
        modifiedOn: '2025-06-26',
        modifiedBy: 'Maria Santos',
        status: 'Created',
        crops: ['Rice', 'Vegetables'],
        farmSize: '3.1 hectares',
        phone: '09322334455',
        coordinates: '11.5428, 125.3048'
      },
      {
        id: 'RS-2025-0032',
        name: 'Melissa Cruz',
        address: 'Brgy. Malipayon, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-06-26',
        modifiedOn: '2025-06-28',
        modifiedBy: 'Ana Lim',
        status: 'Updated',
        fishing: ['Municipal Waters'],
        boatType: 'Non-motorized Banca',
        phone: '09333445566',
        coordinates: '11.5528, 125.3148'
      },
      {
        id: 'RS-2025-0033',
        name: 'Jonathan Perez',
        address: 'Brgy. Bayanihan, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-06-27',
        modifiedOn: '2025-06-29',
        modifiedBy: 'Jose Ramirez',
        status: 'Created',
        employer: 'Garcia Farm Estate',
        role: 'Corn Harvester',
        phone: '09344556677',
        coordinates: '11.5628, 125.3248'
      },
      {
        id: 'RS-2025-0034',
        name: 'Gabriela Flores',
        address: 'Brgy. Mabini, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-06-28',
        modifiedOn: '2025-06-29',
        modifiedBy: 'Lisa Wang',
        status: 'Updating',
        crops: ['Vegetables', 'Herbs'],
        farmSize: '1.7 hectares',
        phone: '09355667788',
        coordinates: '11.5728, 125.3348'
      },
      {
        id: 'RS-2025-0035',
        name: 'Antonio Ramos',
        address: 'Brgy. Malig-on, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-06-29',
        modifiedOn: '2025-07-01',
        modifiedBy: 'Maria Santos',
        status: 'Updated',
        crops: ['Coconut', 'Banana'],
        farmSize: '4.6 hectares',
        phone: '09366778899',
        coordinates: '11.5828, 125.3448'
      },
      {
        id: 'RS-2025-0036',
        name: 'Cynthia Delgado',
        address: 'Brgy. Maligaya, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-07-01',
        modifiedOn: '2025-07-02',
        modifiedBy: 'Ana Lim',
        status: 'Created',
        fishing: ['Commercial Waters'],
        boatType: 'Motorized Banca',
        phone: '09377889900',
        coordinates: '11.5928, 125.3548'
      },
      {
        id: 'RS-2025-0037',
        name: 'Fernando Cruz',
        address: 'Brgy. Mapagmahal, Tacloban City',
        type: 'Farm Worker/Laborer',
        registeredOn: '2025-07-02',
        modifiedOn: '2025-07-04',
        modifiedBy: 'Jose Ramirez',
        status: 'Updated',
        employer: 'Aquino Family Farm',
        role: 'Coconut Harvester',
        phone: '09388990011',
        coordinates: '11.6028, 125.3648'
      },
      {
        id: 'RS-2025-0038',
        name: 'Angela Torres',
        address: 'Brgy. Maginhawa, Tacloban City',
        type: 'Agri-Youth',
        registeredOn: '2025-07-03',
        modifiedOn: '2025-07-05',
        modifiedBy: 'Lisa Wang',
        status: 'Created',
        crops: ['Rootcrops', 'Vegetables'],
        farmSize: '2.1 hectares',
        phone: '09399001122',
        coordinates: '11.6128, 125.3748'
      },
      {
        id: 'RS-2025-0039',
        name: 'Jorge Villanueva',
        address: 'Brgy. Mapag-isa, Tacloban City',
        type: 'Farmer',
        registeredOn: '2025-07-04',
        modifiedOn: '2025-07-06',
        modifiedBy: 'Maria Santos',
        status: 'Created',
        crops: ['Coffee', 'Cacao'],
        farmSize: '5.0 hectares',
        phone: '09400112233',
        coordinates: '11.6228, 125.3848'
      },
      {
        id: 'RS-2025-0040',
        name: 'Lucia Hernandez',
        address: 'Brgy. Mapagmalasakit, Tacloban City',
        type: 'Fisherfolk',
        registeredOn: '2025-07-05',
        modifiedOn: '2025-07-07',
        modifiedBy: 'Ana Lim',
        status: 'Updating',
        fishing: ['Municipal Waters'],
        boatType: 'Wooden Boat',
        phone: '09411223344',
        coordinates: '11.6328, 125.3948'
      }
          
  ]);

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecords(paginatedRecords.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  const handleDeleteRecords = () => {
    setRecords(records.filter(record => !selectedRecords.includes(record.id)));
    setSelectedRecords([]);
    setShowDeleteModal(false);
    setShowDeleteMode(false);
    setDeleteReason('');
  };

  const handleViewRecord = (record) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Created':
        return 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/70';
      case 'Updating':
        return 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70';
      case 'Updated':
        return 'bg-green-900/50 text-green-300 hover:bg-green-900/70';
      default:
        return 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Farmer':
        return 'bg-green-900/50 text-green-300 hover:bg-green-900/70';
      case 'Fisherfolk':
        return 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70';
      case 'Farm Worker/Laborer':
          return 'bg-orange-900/50 text-orange-300 hover:bg-orange-900/70';
      case 'Agri-Youth':
        return 'bg-red-900/50 text-red-300 hover:bg-red-900/70';
      default:
        return 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70';
    }
  };

  const Modal = ({ show, onClose, title, children, size = "md" }) => {
    if (!show) return null;
    
    const sizeClasses = {
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-2xl"
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`bg-[#1e1e1e] border border-[#333333] rounded-lg p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
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
          <CardTitle className="text-white text-xl">RSBSA Records</CardTitle>
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
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
            >
              <i className="fas fa-filter mr-2"></i> Filter
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap">
              <i className="fas fa-plus mr-2"></i> Register New
            </Button>
            <Button 
              onClick={() => {
                setShowDeleteMode(!showDeleteMode);
                setSelectedRecords([]);
              }}
              className={`${showDeleteMode ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white !rounded-button whitespace-nowrap`}
            >
              <i className={`fas ${showDeleteMode ? 'fa-times' : 'fa-trash'} mr-2`}></i> 
              {showDeleteMode ? 'Cancel' : 'Delete'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-[#252525] rounded-md border border-[#333333] space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="all">All Types</option>
                    <option value="Farmer">Farmer</option>
                    <option value="Fisherfolk">Fisherfolk</option>
                    <option value="Farm Worker/Laborer">Farm Worker/Laborer</option>
                    <option value="Agri-Youth">Agri-Youth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#333333] rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="all">All Status</option>
                    <option value="Created">Created</option>
                    <option value="Updating">Updating</option>
                    <option value="Updated">Updated</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {showDeleteMode && selectedRecords.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-[#252525] rounded-md border border-[#333333]">
              <span className="text-gray-300">{selectedRecords.length} selected</span>
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white !rounded-button"
                size="sm"
              >
                <i className="fas fa-trash mr-2"></i> Delete Selected
              </Button>
            </div>
          )}

          {/* Records Table */}
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#252525]">
                <TableRow>
                  {showDeleteMode && (
                    <TableHead className="text-gray-300 w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === paginatedRecords.length && paginatedRecords.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-gray-300">RSBSA No.</TableHead>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Address</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Registered On</TableHead>
                  <TableHead className="text-gray-300">Modified On</TableHead>
                  <TableHead className="text-gray-300">Modified By</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} className="border-t border-[#333333] hover:bg-[#252525]">
                    {showDeleteMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                          className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-gray-400 font-mono">{record.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-200">{record.name}</div>
                    </TableCell>
                    <TableCell className="text-gray-400">{record.address}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(record.type)}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{record.registeredOn}</TableCell>
                    <TableCell className="text-gray-400">{record.modifiedOn}</TableCell>
                    <TableCell className="text-gray-400">{record.modifiedBy}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => handleViewRecord(record)}
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
                        >
                          <i className="fas fa-eye mr-1 text-xs"></i> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button whitespace-nowrap"
                        >
                          <i className="fas fa-edit mr-1 text-xs"></i> Edit
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
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} registered records
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 disabled:opacity-50 !rounded-button"
              >
                <i className="fas fa-chevron-left mr-1 text-xs"></i> Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className={page === currentPage ? 
                        "h-8 bg-green-600 hover:bg-green-700 text-white !rounded-button" :
                        "h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="h-8 border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 disabled:opacity-50 !rounded-button"
              >
                Next <i className="fas fa-chevron-right ml-1 text-xs"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Records">
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete {selectedRecords.length} selected record(s)? This action cannot be undone.
          </p>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Reason for Deletion *</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Please provide a reason for deleting these records..."
              className="w-full px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              rows="3"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteRecords}
              disabled={!deleteReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white !rounded-button disabled:opacity-50"
            >
              Delete Records
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Record Modal */}
      <Modal show={showViewModal} onClose={() => setShowViewModal(false)} title="RSBSA Record Details" size="xl">
        {viewingRecord && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-green-400 font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm">RSBSA Number</label>
                  <p className="text-gray-200 font-mono">{viewingRecord.id}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm">Full Name</label>
                  <p className="text-gray-200">{viewingRecord.name}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-400 text-sm">Address</label>
                  <p className="text-gray-200">{viewingRecord.address}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm">Type</label>
                  <Badge className={getTypeBadgeColor(viewingRecord.type)}>
                    {viewingRecord.type}
                  </Badge>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm">Phone Number</label>
                  <p className="text-gray-200">{viewingRecord.phone}</p>
                </div>
              </div>
            </div>

            {/* Farming/Fishing Details */}
            <div>
              <h4 className="text-green-400 font-semibold mb-3">
                {viewingRecord.type === 'Fisherfolk' ? 'Fishing Details' : 'Farming Details'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingRecord.crops && (
                  <div>
                    <label className="block text-gray-400 text-sm">Crops</label>
                    <p className="text-gray-200">{viewingRecord.crops.join(', ')}</p>
                  </div>
                )}
                {viewingRecord.farmSize && (
                  <div>
                    <label className="block text-gray-400 text-sm">Farm Size</label>
                    <p className="text-gray-200">{viewingRecord.farmSize}</p>
                  </div>
                )}
                {viewingRecord.fishing && (
                  <div>
                    <label className="block text-gray-400 text-sm">Fishing Area</label>
                    <p className="text-gray-200">{viewingRecord.fishing.join(', ')}</p>
                  </div>
                )}
                {viewingRecord.boatType && (
                  <div>
                    <label className="block text-gray-400 text-sm">Boat Type</label>
                    <p className="text-gray-200">{viewingRecord.boatType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-green-400 font-semibold mb-3">Location</h4>
              <div>
                <label className="block text-gray-400 text-sm">Coordinates</label>
                <p className="text-gray-200 font-mono">{viewingRecord.coordinates}</p>
              </div>
            </div>

            {/* Record Status */}
            <div>
              <h4 className="text-green-400 font-semibold mb-3">Record Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm">Status</label>
                  <Badge className={getStatusBadgeColor(viewingRecord.status)}>
                    {viewingRecord.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm">Registered On</label>
                  <p className="text-gray-200">{viewingRecord.registeredOn}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm">Last Modified</label>
                  <p className="text-gray-200">{viewingRecord.modifiedOn}</p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-gray-400 text-sm">Modified By</label>
                  <p className="text-gray-200">{viewingRecord.modifiedBy}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#333333]">
              <Button
                onClick={() => setShowViewModal(false)}
                variant="outline"
                className="border-[#444444] bg-transparent hover:bg-[#333333] text-gray-300 !rounded-button"
              >
                Close
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white !rounded-button"
              >
                <i className="fas fa-edit mr-2"></i> Edit Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RsbsaRecordsPage;