import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Plus, Minus, CheckCircle } from "lucide-react";

const RegisterPage = () => {
  const [registryType, setRegistryType] = useState('farmer');
  const [activeTab, setActiveTab] = useState('personal');
  const [isHouseholdHead, setIsHouseholdHead] = useState(true);
  const [civilStatus, setCivilStatus] = useState('');
  const [sameAsPermAddress, setSameAsPermAddress] = useState(false);
  const [hasGovId, setHasGovId] = useState(false);
  const [isPwd, setIsPwd] = useState(false);
  const [is4ps, setIs4ps] = useState(false);
  const [isIndigenous, setIsIndigenous] = useState(false);
  const [isMemberCoop, setIsMemberCoop] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Dynamic form arrays
  const [farmParcels, setFarmParcels] = useState([{ id: 1 }]);
  const [parcelInfo, setParcelInfo] = useState([{ id: 1 }]);
  const [otherCrops, setOtherCrops] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [poultry, setPoultry] = useState([]);
  const [fishingActivities, setFishingActivities] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [involvementTypes, setInvolvementTypes] = useState([]);
  const [religion, setReligion] = useState('');
  const [cornType, setCornType] = useState('');
  const [isCornChecked, setIsCornChecked] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedPurok, setSelectedPurok] = useState('');
  const [selectedBarangayPresent, setSelectedBarangayPresent] = useState('');
  const [selectedPurokPresent, setSelectedPurokPresent] = useState('');

  const getPurokOptions = (barangay) => {
    if (barangay === 'Upper Jasaan') {
      return ['Purok 5', 'Purok 6', 'Purok 7', 'Purok 8', 'Purok 9'];
    } else if (barangay === 'Lower Jasaan') {
      return ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 10', 'Purok 11'];
    }
    return [];
  };

  const addFormItem = (setter, currentArray) => {
    if (currentArray.length < 3) {
      const newId = Math.max(...currentArray.map(item => item.id)) + 1;
      setter([...currentArray, { id: newId }]);
    }
  };

  const removeFormItem = (setter, currentArray, id) => {
    if (currentArray.length > 1) {
      setter(currentArray.filter(item => item.id !== id));
    }
  };

  const addParcelInfo = () => {
    if (parcelInfo.length < 5) {
      const newId = Math.max(...parcelInfo.map(item => item.id)) + 1;
      setParcelInfo([...parcelInfo, { id: newId }]);
    }
  };

  const removeParcelInfo = (id) => {
    if (parcelInfo.length > 1) {
      setParcelInfo(parcelInfo.filter(item => item.id !== id));
    }
  };

  const handleSubmit = () => {
    setShowSuccessModal(true);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setActiveTab('personal'); // Reset to first tab after successful submission
  };

  const extensionOptions = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
  const religionOptions = ['Christianity', 'Islam', 'Others'];
  const civilStatusOptions = ['Single', 'Married', 'Widowed', 'Separated'];
  const educationOptions = ['Pre-School', 'Elementary', 'High School (non-K12)', 'Junior High School (K-12)', 'Senior High School (K-12)', 'College', 'Vocational', 'Post-Graduate', 'None'];
  const ownershipDocOptions = ['Certificate of Land Transfer', 'Emancipation Patent', 'Individual Certificate of Land Ownership Award (CLOA)', 'Collective CLOA', 'Co-ownership CLOA', 'Agricultural Sales Patent', 'Homestead Patent', 'Free Patent', 'Certificate of Title or Regular Title', 'Certificate of Ancestral Domain Title', 'Certificate of Ancestral Land Title', 'Tax Declaration', 'Others'];
  const ownershipTypeOptions = ['Registered Owner', 'Tenant', 'Lessee', 'Others'];
  const farmTypeOptions = ['Irrigated', 'Rainfed Upland', 'Rainfed Lowland'];
  const cropCommodityOptions = ['Rice', 'Corn', 'HVC', 'Poultry', 'Agri-Fishery', 'Livestock'];

  const renderRegistrySelector = () => (
    <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B] mb-6">
      <h3 className="text-gray-200 font-medium mb-4">Select Registry Type</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {[
          { value: 'farmer', label: 'Farmer', desc: 'Register as a farmer with crop and animal production details', color: '#3366CC' },
          { value: 'fisherfolk', label: 'Fisherfolk', desc: 'Register as a fisherfolk with fishing activities', color: '#33CC33' }
        ].map((type) => (
          <div
            key={type.value}
            className={`border rounded-md p-4 cursor-pointer transition-colors ${
              registryType === type.value
                ? `border-${type.color} bg-${type.color}/20`
                : 'border-[#3B3B3B] bg-[#252525] hover:bg-[#1A1A1A]'
            }`}
            onClick={() => setRegistryType(type.value)}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                checked={registryType === type.value}
                onChange={() => setRegistryType(type.value)}
                className={`h-4 w-4 text-${type.color}`}
              />
              <label className="ml-2 text-gray-200 font-medium">{type.label}</label>
            </div>
            <p className="text-gray-400 text-sm">{type.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPersonalInfoTab = () => (
    <div className="space-y-6">
      {/* Reference Number */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-1 block">Reference Number</label>
        <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="00-00-00-000-000000" />
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Surname</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Surname" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">First Name</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="First Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Middle Name</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Middle Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Extension Name</label>
          <select className="w-full h-10 px-3 py-2 bg-[#252525] border border-[#3B3B3B] rounded-md text-gray-200">
            <option value="">Select</option>
            {extensionOptions.map(ext => (
              <option key={ext} value={ext}>{ext}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Sex</label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center">
              <input type="radio" name="sex" value="male" className="h-4 w-4 text-blue-600" />
              <label className="ml-2 text-gray-400">Male</label>
            </div>
            <div className="flex items-center">
              <input type="radio" name="sex" value="female" className="h-4 w-4 text-blue-600" />
              <label className="ml-2 text-gray-400">Female</label>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Mobile Number</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="+63 XXX XXX XXXX" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Landline Number</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Landline Number" />
        </div>
      </div>

      {/* Birth Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Date of Birth</label>
          <Input type="date" className="bg-[#252525] border-[#3B3B3B] text-gray-200" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Place of Birth</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Municipality, Province/State, Country" />
        </div>
      </div>

      {/* Religion and Civil Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Religion</label>
          <select 
            className="w-full h-10 px-3 py-2 bg-[#252525] border border-[#3B3B3B] rounded-md text-gray-200"
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
          >
            <option value="">Select Religion</option>
            {religionOptions.map(religion => (
              <option key={religion} value={religion}>{religion}</option>
            ))}
          </select>
          {religion === 'Others' && (
            <Input 
              className="bg-[#252525] border-[#3B3B3B] text-gray-200 mt-2" 
              placeholder="Specify Religion" 
            />
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Civil Status</label>
          <select 
            className="w-full h-10 px-3 py-2 bg-[#252525] border border-[#3B3B3B] rounded-md text-gray-200"
            value={civilStatus}
            onChange={(e) => setCivilStatus(e.target.value)}
          >
            <option value="">Select Civil Status</option>
            {civilStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spouse Name (if married) */}
      {civilStatus === 'Married' && (
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Name of Spouse</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Name of Spouse" />
        </div>
      )}

      {/* Mother's Name */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-1 block">Mother's Full Name</label>
        <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Mother's Full Name" />
      </div>

      {/* Household Head */}
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-400 mb-2 block">Household Head</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input 
                type="radio" 
                name="householdHead" 
                checked={isHouseholdHead} 
                onChange={() => setIsHouseholdHead(true)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">Yes</label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                name="householdHead" 
                checked={!isHouseholdHead}
                onChange={() => setIsHouseholdHead(false)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">No</label>
            </div>
          </div>
        </div>

        {!isHouseholdHead && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Name of Household Head</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Name of Household Head" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Relationship</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Relationship" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">No. of Living Household Members</label>
                <Input type="number" className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" min="1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">No. of Males</label>
                <Input type="number" className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" min="0" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">No. of Females</label>
                <Input type="number" className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" min="0" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Education */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-1 block">Highest Formal Education</label>
        <select className="w-full h-10 px-3 py-2 bg-[#252525] border border-[#3B3B3B] rounded-md text-gray-200">
          <option value="">Select Education Level</option>
          {educationOptions.map(edu => (
            <option key={edu} value={edu}>{edu}</option>
          ))}
        </select>
      </div>

      {/* Status Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">Person with Disability (PWD)</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input 
                type="radio" 
                name="pwd" 
                checked={isPwd} 
                onChange={() => setIsPwd(true)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">Yes</label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                name="pwd" 
                checked={!isPwd}
                onChange={() => setIsPwd(false)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">No</label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">4P's Beneficiary</label>
          <div className="flex gap-4">
            <div className="flex items-center">
              <input 
                type="radio" 
                name="fourps" 
                checked={is4ps} 
                onChange={() => setIs4ps(true)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">Yes</label>
            </div>
            <div className="flex items-center">
              <input 
                type="radio" 
                name="fourps" 
                checked={!is4ps}
                onChange={() => setIs4ps(false)}
                className="h-4 w-4 text-blue-600" 
              />
              <label className="ml-2 text-gray-400">No</label>
            </div>
          </div>
        </div>
      </div>

      {/* Indigenous Group */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-2 block">Member of Indigenous Group</label>
        <div className="flex gap-4 mb-2">
          <div className="flex items-center">
            <input 
              type="radio" 
              name="indigenous" 
              checked={isIndigenous} 
              onChange={() => setIsIndigenous(true)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">Yes</label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              name="indigenous" 
              checked={!isIndigenous}
              onChange={() => setIsIndigenous(false)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">No</label>
          </div>
        </div>
        {isIndigenous && (
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Specify Indigenous Group Name" />
        )}
      </div>

      {/* Government ID */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-2 block">With Government ID</label>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center">
            <input 
              type="radio" 
              name="govid" 
              checked={hasGovId} 
              onChange={() => setHasGovId(true)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">Yes</label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              name="govid" 
              checked={!hasGovId}
              onChange={() => setHasGovId(false)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">No</label>
          </div>
        </div>
        {hasGovId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">ID Type</label>
              <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="ID Type" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">ID Number</label>
              <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="ID Number" />
            </div>
          </div>
        )}
      </div>

      {/* Cooperative Member */}
      <div>
        <label className="text-sm font-medium text-gray-400 mb-2 block">Member of any Farmers Association/Cooperative</label>
        <div className="flex gap-4 mb-2">
          <div className="flex items-center">
            <input 
              type="radio" 
              name="coop" 
              checked={isMemberCoop} 
              onChange={() => setIsMemberCoop(true)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">Yes</label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              name="coop" 
              checked={!isMemberCoop}
              onChange={() => setIsMemberCoop(false)}
              className="h-4 w-4 text-blue-600" 
            />
            <label className="ml-2 text-gray-400">No</label>
          </div>
        </div>
        {isMemberCoop && (
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Specify Association/Cooperative Name" />
        )}
      </div>

      {/* Emergency Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Person to Notify in Case of Emergency</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Emergency Contact Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 mb-1 block">Contact Number</label>
          <Input className="bg-[#252525] border-[#3B3B3B] text-gray-200" placeholder="Contact Number" />
        </div>
      </div>
    </div>
  );

  const renderAddressTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Permanent Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Barangay</label>
            <select 
              className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200"
              value={selectedBarangay}
              onChange={(e) => {
                setSelectedBarangay(e.target.value);
                setSelectedPurok(''); // Reset purok when barangay changes
              }}
            >
              <option value="">Select Barangay</option>
              <option value="Upper Jasaan">Upper Jasaan</option>
              <option value="Lower Jasaan">Lower Jasaan</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Purok</label>
            <select 
              className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200"
              value={selectedPurok}
              onChange={(e) => setSelectedPurok(e.target.value)}
              disabled={!selectedBarangay}
            >
              <option value="">Select Purok</option>
              {getPurokOptions(selectedBarangay).map(purok => (
                <option key={purok} value={purok}>{purok}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Municipality/City</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Municipality/City" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Street/Sitio/Subdv.</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Street/Sitio/Subdv." />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Province</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Province" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Region</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Region" />
          </div>
        </div>
      </div>

      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-medium">Present Address</h3>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="sameAddress" 
              checked={sameAsPermAddress}
              onChange={(e) => setSameAsPermAddress(e.target.checked)}
              className="h-4 w-4 text-blue-600" 
            />
            <label htmlFor="sameAddress" className="ml-2 text-gray-400 text-sm">Same as Permanent Address</label>
          </div>
        </div>
        {!sameAsPermAddress && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Barangay</label>
                <select 
                  className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200"
                  value={selectedBarangayPresent}
                  onChange={(e) => {
                    setSelectedBarangayPresent(e.target.value);
                    setSelectedPurokPresent(''); // Reset purok when barangay changes
                  }}
                >
                  <option value="">Select Barangay</option>
                  <option value="Upper Jasaan">Upper Jasaan</option>
                  <option value="Lower Jasaan">Lower Jasaan</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Purok</label>
                <select 
                  className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200"
                  value={selectedPurokPresent}
                  onChange={(e) => setSelectedPurokPresent(e.target.value)}
                  disabled={!selectedBarangayPresent}
                >
                  <option value="">Select Purok</option>
                  {getPurokOptions(selectedBarangayPresent).map(purok => (
                    <option key={purok} value={purok}>{purok}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Municipality/City</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Municipality/City" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Street/Sitio/Subdv.</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Street/Sitio/Subdv." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Province</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Province" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Region</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Region" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderFarmDataTab = () => (
    <div className="space-y-6">
      {/* Farming Activity Form */}
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Farming Activity</h3>
        
        {/* Main Crops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="h-4 w-4 text-blue-600" />
            <label className="text-gray-400">Rice</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 w-24" placeholder="Value" />
          </div>
          <div className="space-y-2">
  <div className="flex items-center space-x-3">
    <input 
      type="checkbox" 
      className="h-4 w-4 text-blue-600"
      checked={isCornChecked}
      onChange={(e) => {
        setIsCornChecked(e.target.checked);
        if (!e.target.checked) {
          setCornType(''); // Reset corn type when unchecked
        }
      }}
    />
    <label className="text-gray-400">Corn</label>
    <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 w-24" placeholder="Value" />
    </div>
    {isCornChecked && (
      <div className="ml-7 flex items-center space-x-4">
        <div className="flex items-center">
          <input 
            type="radio" 
            name="cornType" 
            value="yellow"
            checked={cornType === 'yellow'}
            onChange={(e) => setCornType(e.target.value)}
            className="h-3 w-3 text-blue-600" 
          />
          <label className="ml-2 text-gray-400 text-sm">Yellow</label>
        </div>
        <div className="flex items-center">
          <input 
            type="radio" 
            name="cornType" 
            value="white"
            checked={cornType === 'white'}
            onChange={(e) => setCornType(e.target.value)}
            className="h-3 w-3 text-blue-600" 
          />
          <label className="ml-2 text-gray-400 text-sm">White</label>
        </div>
      </div>
    )}
  </div>
        </div>

        {/* Other Crops */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Other Crops</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setOtherCrops, otherCrops)}
              className="bg-blue-600/20 hover:bg-blue-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Crop
            </Button>
          </div>
          {otherCrops.map((crop) => (
            <div key={crop.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Crop" />
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 w-24" placeholder="Value" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setOtherCrops, otherCrops, crop.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Livestock */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Livestock</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setLivestock, livestock)}
              className="bg-blue-600/20 hover:bg-blue-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Livestock
            </Button>
          </div>
          {livestock.map((animal) => (
            <div key={animal.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Livestock" />
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 w-32" placeholder="No. of Head" type="number" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setLivestock, livestock, animal.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Poultry */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Poultry</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setPoultry, poultry)}
              className="bg-blue-600/20 hover:bg-blue-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Poultry
            </Button>
          </div>
          {poultry.map((bird) => (
            <div key={bird.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Poultry" />
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 w-32" placeholder="No. of Head" type="number" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setPoultry, poultry, bird.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Parcel Forms */}
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-medium">Farm Parcels (Max 3)</h3>
          <Button 
            type="button"
            onClick={() => addFormItem(setFarmParcels, farmParcels)}
            disabled={farmParcels.length >= 3}
            className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-3 py-1 text-xs disabled:opacity-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Parcel
          </Button>
        </div>

        {farmParcels.map((parcel, index) => (
          <div key={parcel.id} className="border border-[#3B3B3B] rounded-md p-4 mb-4 bg-[#1A1A1A]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-400 font-medium">Farm Parcel {index + 1}</h4>
              {farmParcels.length > 1 && (
                <Button 
                  type="button"
                  onClick={() => removeFormItem(setFarmParcels, farmParcels, parcel.id)}
                  className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1 text-xs"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Name of Farmer's in Rotation</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Name of Farmer's in Rotation" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Farm Location</label>
                  <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Barangay, City/Municipality" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Total Farm Area (ha)</label>
                  <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Total Farm Area" type="number" step="0.01" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Ownership Document</label>
                  <select className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200">
                    <option value="">Select Document</option>
                    {ownershipDocOptions.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Ownership Document No.</label>
                  <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Document Number" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Ownership Type</label>
                <select className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200">
                  <option value="">Select Ownership Type</option>
                  {ownershipTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Within Ancestral Domain</label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input type="radio" name={`ancestral_${parcel.id}`} className="h-4 w-4 text-blue-600" />
                      <label className="ml-2 text-gray-400">Yes</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" name={`ancestral_${parcel.id}`} className="h-4 w-4 text-blue-600" />
                      <label className="ml-2 text-gray-400">No</label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Agrarian Reform Beneficiary</label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input type="radio" name={`reform_${parcel.id}`} className="h-4 w-4 text-blue-600" />
                      <label className="ml-2 text-gray-400">Yes</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" name={`reform_${parcel.id}`} className="h-4 w-4 text-blue-600" />
                      <label className="ml-2 text-gray-400">No</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Farm Parcel Information */}
              <div className="border-t border-[#3B3B3B] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-gray-400 font-medium">Farm Parcel Information (Max 5)</h5>
                  <Button 
                    type="button"
                    onClick={addParcelInfo}
                    disabled={parcelInfo.length >= 5}
                    className="bg-blue-600/20 hover:bg-blue-600/20/80 text-gray-200 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Info
                  </Button>
                </div>

                {parcelInfo.map((info, infoIndex) => (
                  <div key={info.id} className="border border-[#3B3B3B] rounded-md p-3 mb-3 bg-[#1A1A1A]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm font-medium">Parcel Info {infoIndex + 1}</span>
                      {parcelInfo.length > 1 && (
                        <Button 
                          type="button"
                          onClick={() => removeParcelInfo(info.id)}
                          className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-1 py-1 text-xs"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Crop/Commodity</label>
                        <select className="w-full h-8 px-2 py-1 bg-[#1A1A1A] border border-[#3B3B3B] rounded text-gray-200 text-sm">
                          <option value="">Select</option>
                          {cropCommodityOptions.map(crop => (
                            <option key={crop} value={crop}>{crop}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Size (ha)</label>
                        <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 h-8 text-sm" type="number" step="0.01" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">No. of Head</label>
                        <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 h-8 text-sm" type="number" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Farm Type</label>
                        <select className="w-full h-8 px-2 py-1 bg-[#1A1A1A] border border-[#3B3B3B] rounded text-gray-200 text-sm">
                          <option value="">Select</option>
                          {farmTypeOptions.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-2 block">Organic Practitioner</label>
                        <div className="flex gap-3">
                          <div className="flex items-center">
                            <input type="radio" name={`organic_${info.id}`} className="h-3 w-3 text-blue-600" />
                            <label className="ml-1 text-gray-400 text-sm">Y</label>
                          </div>
                          <div className="flex items-center">
                            <input type="radio" name={`organic_${info.id}`} className="h-3 w-3 text-blue-600" />
                            <label className="ml-1 text-gray-400 text-sm">N</label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Remarks</label>
                        <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 h-8 text-sm" placeholder="Remarks" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFishDataTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Type of Fishing Activity</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {['Fish Capture', 'Aquaculture', 'Gleaning', 'Fish Processing', 'Fish Vending'].map((activity) => (
            <div key={activity} className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-green-600" />
              <label className="ml-2 text-gray-400">{activity}</label>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Other Activities</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setFishingActivities, fishingActivities)}
              className="bg-green-600/20 hover:bg-green-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Activity
            </Button>
          </div>
          {fishingActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Activity" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setFishingActivities, fishingActivities, activity.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFarmWorkerTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Kind of Work</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {['Land Preparation', 'Planting/Transplanting', 'Cultivation', 'Harvesting'].map((work) => (
            <div key={work} className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-yellow-600" />
              <label className="ml-2 text-gray-400">{work}</label>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Other Work Types</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setWorkTypes, workTypes)}
              className="bg-yellow-600/20 hover:bg-yellow-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Work Type
            </Button>
          </div>
          {workTypes.map((work) => (
            <div key={work.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Work Type" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setWorkTypes, workTypes, work.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Parcel Forms for Farm Worker */}
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-medium">Work Location Parcels (Max 3)</h3>
          <Button 
            type="button"
            onClick={() => addFormItem(setFarmParcels, farmParcels)}
            disabled={farmParcels.length >= 3}
            className="bg-yellow-600/20 hover:bg-yellow-600/20/80 text-gray-200 px-3 py-1 text-xs disabled:opacity-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Parcel
          </Button>
        </div>

        {farmParcels.map((parcel, index) => (
          <div key={parcel.id} className="border border-[#3B3B3B] rounded-md p-4 mb-4 bg-[#1A1A1A]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-400 font-medium">Work Parcel {index + 1}</h4>
              {farmParcels.length > 1 && (
                <Button 
                  type="button"
                  onClick={() => removeFormItem(setFarmParcels, farmParcels, parcel.id)}
                  className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1 text-xs"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Farm Location</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Barangay, City/Municipality" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Farm Owner</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Farm Owner Name" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAgriYouthTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Type of Involvement</h3>
        
        <div className="space-y-3 mb-4">
          {[
            'Part of farming household',
            'Attending/attended formal agri-fishery related course',
            'Attending/attended non-formal agri-fishery related course',
            'Participated in any agricultural activity/program'
          ].map((involvement) => (
            <div key={involvement} className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-purple-600" />
              <label className="ml-2 text-gray-400">{involvement}</label>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-400 font-medium">Other Involvement Types</h4>
            <Button 
              type="button"
              onClick={() => addFormItem(setInvolvementTypes, involvementTypes)}
              className="bg-purple-600/20 hover:bg-purple-600/20/80 text-gray-200 px-3 py-1 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Type
            </Button>
          </div>
          {involvementTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-3 mb-2">
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200 flex-1" placeholder="Specify Involvement Type" />
              <Button 
                type="button"
                onClick={() => removeFormItem(setInvolvementTypes, involvementTypes, type.id)}
                className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Parcel Forms for Agri-Youth */}
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-medium">Activity Location Parcels (Max 3)</h3>
          <Button 
            type="button"
            onClick={() => addFormItem(setFarmParcels, farmParcels)}
            disabled={farmParcels.length >= 3}
            className="bg-purple-600/20 hover:bg-purple-600/20/80 text-gray-200 px-3 py-1 text-xs disabled:opacity-50"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Parcel
          </Button>
        </div>

        {farmParcels.map((parcel, index) => (
          <div key={parcel.id} className="border border-[#3B3B3B] rounded-md p-4 mb-4 bg-[#1A1A1A]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-400 font-medium">Activity Parcel {index + 1}</h4>
              {farmParcels.length > 1 && (
                <Button 
                  type="button"
                  onClick={() => removeFormItem(setFarmParcels, farmParcels, parcel.id)}
                  className="bg-red-600 hover:bg-red-600/80 text-gray-200 px-2 py-1 text-xs"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Activity Location</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Barangay, City/Municipality" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">Activity Description</label>
                <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="Describe the activity" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">RSBSA Reference Number</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="RSBSA Reference Number" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">TIN Number</label>
            <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="TIN Number" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Profession</label>
            <select className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200">
              <option value="">Select Profession</option>
              <option value="farmer">Farmer</option>
              <option value="fisherfolk">Fisherfolk</option>
              <option value="farm_worker">Farm Worker</option>
              <option value="agri_youth">Agri-Youth</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">Source of Funds</label>
            <select className="w-full h-10 px-3 py-2 bg-[#1A1A1A] border border-[#3B3B3B] rounded-md text-gray-200">
              <option value="">Select Source of Funds</option>
              <option value="salary">Salary</option>
              <option value="business">Business</option>
              <option value="remittance">Remittance</option>
              <option value="pension">Pension</option>
              <option value="investment">Investment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-gray-400 font-medium mb-4">Gross Income Last Year</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Farming</label>
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="₱ 0.00" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Non-Farming</label>
              <Input className="bg-[#1A1A1A] border-[#3B3B3B] text-gray-200" placeholder="₱ 0.00" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-6">
      <div className="bg-[#252525] p-4 rounded-md border border-[#3B3B3B]">
        <h3 className="text-gray-200 font-medium mb-4">Review Registration Information</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-gray-400 font-medium mb-2">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex">
                <span className="text-gray-400 w-36">Registry Type:</span>
                <span className="text-gray-200 capitalize">{registryType}</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Reference Number:</span>
                <span className="text-gray-200">01-03-15-001-000001</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Full Name:</span>
                <span className="text-gray-200">Juan Dela Cruz</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Mother's Name:</span>
                <span className="text-gray-200">Maria Santos</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Birthdate:</span>
                <span className="text-gray-200">January 15, 1985</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Sex:</span>
                <span className="text-gray-200">Male</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Mobile Number:</span>
                <span className="text-gray-200">+63 912 345 6789</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Civil Status:</span>
                <span className="text-gray-200">Married</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Education:</span>
                <span className="text-gray-200">College</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Religion:</span>
                <span className="text-gray-200">Christianity</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3B3B3B] pt-4">
            <h4 className="text-gray-400 font-medium mb-2">Address Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <h5 className="text-gray-400 text-sm mb-1">Permanent Address</h5>
                <p className="text-gray-200">123 Main St., Brgy. San Isidro, Tacloban City, Leyte, Region VIII</p>
              </div>
              <div>
                <h5 className="text-gray-400 text-sm mb-1">Present Address</h5>
                <p className="text-gray-200">123 Main St., Brgy. San Isidro, Tacloban City, Leyte, Region VIII</p>
              </div>
            </div>
          </div>

          {registryType === 'farmer' && (
            <div className="border-t border-[#3B3B3B] pt-4">
              <h4 className="text-gray-400 font-medium mb-2">Farm Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex">
                  <span className="text-gray-400 w-36">Farm Parcels:</span>
                  <span className="text-gray-200">2</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-36">Total Area:</span>
                  <span className="text-gray-200">1.5 hectares</span>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <span className="text-gray-400 mb-1">Crops:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600/20 text-blue-600">Rice</Badge>
                    <Badge className="bg-blue-600/20 text-blue-600">Corn</Badge>
                    <Badge className="bg-blue-600/20 text-blue-600">Vegetables</Badge>
                  </div>
                </div>
                <div className="flex flex-col md:col-span-2 mt-2">
                  <span className="text-gray-400 mb-1">Livestock & Poultry:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-600/20 text-blue-600">Carabao (2)</Badge>
                    <Badge className="bg-blue-600/20 text-blue-600">Chicken (25)</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {registryType === 'fisherfolk' && (
            <div className="border-t border-[#3B3B3B] pt-4">
              <h4 className="text-gray-400 font-medium mb-2">Fishing Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex flex-col md:col-span-2">
                  <span className="text-gray-400 mb-1">Fishing Activities:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-600/20 text-green-600">Fish Capture</Badge>
                    <Badge className="bg-green-600/20 text-green-600">Aquaculture</Badge>
                    <Badge className="bg-green-600/20 text-green-600">Fish Vending</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {registryType === 'farmworker' && (
            <div className="border-t border-[#3B3B3B] pt-4">
              <h4 className="text-gray-400 font-medium mb-2">Farm Worker Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex flex-col md:col-span-2">
                  <span className="text-gray-400 mb-1">Kind of Work:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-yellow-600/20/50 text-yellow-600">Land Preparation</Badge>
                    <Badge className="bg-yellow-600/20/50 text-yellow-600">Planting/Transplanting</Badge>
                    <Badge className="bg-yellow-600/20/50 text-yellow-600">Harvesting</Badge>
                  </div>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-36">Work Locations:</span>
                  <span className="text-gray-200">2 farms</span>
                </div>
              </div>
            </div>
          )}

          {registryType === 'agriyouth' && (
            <div className="border-t border-[#3B3B3B] pt-4">
              <h4 className="text-gray-400 font-medium mb-2">Agri-Youth Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex flex-col md:col-span-2">
                  <span className="text-gray-400 mb-1">Type of Involvement:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-600/20 text-purple-600">Part of farming household</Badge>
                    <Badge className="bg-purple-600/20 text-purple-600">Formal agri course</Badge>
                    <Badge className="bg-purple-600/20 text-purple-600">Agricultural program</Badge>
                  </div>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-36">Activity Locations:</span>
                  <span className="text-gray-200">1 location</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-[#3B3B3B] pt-4">
            <h4 className="text-gray-400 font-medium mb-2">Financial Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex">
                <span className="text-gray-400 w-36">RSBSA Number:</span>
                <span className="text-gray-200">RS-2025-0006</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">TIN Number:</span>
                <span className="text-gray-200">123-456-789-000</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Profession:</span>
                <span className="text-gray-200 capitalize">{registryType}</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Source of Funds:</span>
                <span className="text-gray-200">Business</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Farming Income:</span>
                <span className="text-gray-200">₱ 150,000.00</span>
              </div>
              <div className="flex">
                <span className="text-gray-400 w-36">Non-Farming Income:</span>
                <span className="text-gray-200">₱ 50,000.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#252525] border border-[#3B3B3B] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300 scale-100">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Registration Successful!</h3>
          <p className="text-gray-400 mb-6">Your registration has been successfully submitted. You will receive a confirmation soon.</p>
          <Button 
            onClick={closeModal}
            className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  const getDataTabContent = () => {
    switch (registryType) {
      case 'fisherfolk':
        return renderFishDataTab();
      case 'farmworker':
        return renderFarmWorkerTab();
      case 'agriyouth':
        return renderAgriYouthTab();
      default:
        return renderFarmDataTab();
    }
  };

  const getDataTabLabel = () => {
    switch (registryType) {
      case 'fisherfolk':
        return 'Fish Data';
      case 'farmworker':
        return 'Work Data';
      case 'agriyouth':
        return 'Youth Data';
      default:
        return 'Farm Data';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {renderRegistrySelector()}
      
      <Card className="bg-[#252525] border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-gray-200 text-xl">Register New RSBSA - {registryType.charAt(0).toUpperCase() + registryType.slice(1)}</CardTitle>
          <CardDescription className="text-gray-400">Fill in the details to register a new {registryType}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 bg-[#1A1A1A] mb-6">
              <TabsTrigger value="personal" className="data-[state=active]:bg-[#252525] data-[state=active]:text-gray-200 text-gray-400">
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="address" className="data-[state=active]:bg-[#252525] data-[state=active]:text-gray-200 text-gray-400">
                Address
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-[#252525] data-[state=active]:text-gray-200 text-gray-400">
                {getDataTabLabel()}
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-[#252525] data-[state=active]:text-gray-200 text-gray-400">
                Financial
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-[#252525] data-[state=active]:text-gray-200 text-gray-400">
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              {renderPersonalInfoTab()}
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => setActiveTab('address')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="address" className="mt-0">
              {renderAddressTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('personal')}
                  variant="outline" 
                  className="border-[#3B3B3B] bg-transparent hover:bg-[#1A1A1A] text-gray-400 px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('data')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              {getDataTabContent()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('address')}
                  variant="outline" 
                  className="border-[#3B3B3B] bg-transparent hover:bg-[#1A1A1A] text-gray-400 px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('financial')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="mt-0">
              {renderFinancialTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('data')}
                  variant="outline" 
                  className="border-[#3B3B3B] bg-transparent hover:bg-[#1A1A1A] text-gray-400 px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={() => setActiveTab('preview')}
                  className="bg-blue-600 hover:bg-blue-600/80 text-blue-600-foreground px-6 py-2 rounded-md"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              {renderPreviewTab()}
              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => setActiveTab('financial')}
                  variant="outline" 
                  className="border-[#3B3B3B] bg-transparent hover:bg-[#1A1A1A] text-gray-400 px-6 py-2 rounded-md"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="bg-blue-600/20 hover:bg-blue-600/20/80 text-gray-200 px-6 py-2 rounded-md"
                >
                  <i className="fas fa-check mr-2"></i> Submit Registration
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showSuccessModal && renderSuccessModal()}
    </div>
  );
};

export default RegisterPage;