
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generatePDFReport } from '../utils/pdfGenerator';
import { cn } from "@/lib/utils";

const PDFExportModal = ({ show, onClose, allRegistrants }) => {
    const [step, setStep] = useState(1); // 1: Config, 2: Preview
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // --- Constants ---
    const cropNameOptions = [
        'Ampalaya', 'Broccoli', 'Cabbage', 'Carrot', 'Cauliflower', 'Eggplant (Talong)', 'Ginger', 'Gourd (Upo/Patola)', 'Lettuce', 'Okra',
        'Pechay (Native)', 'Pechay (Chinese/Bok choy)', 'Pepper (Chili/Bell)', 'Squash (Kalabasa)', 'String beans/Sitaw', 'Tomato',
        'Sweet potato (Kamote)', 'Cassava', 'Ube (Purple yam)', 'Gabi (Taro)', 'Singkamas', 'Spring onions', 'Celery', 'Mustard (Mustasa)',
        'Onion', 'Onion (bunching)', 'Cucumber', 'Radish (Labanos)', 'Spinach', 'Corn', 'Peas/Sweet peas', 'Beans (bush/pole)',
        'Peanut', 'Mung bean (Munggo)', 'Garlic (Bawang)', 'Kangkong (Water spinach)', 'Alugbati (Malabar spinach)', 'Patola (Sponge gourd)',
        'Sayote (Chayote)',
        'Banana', 'Mango', 'Pineapple', 'Papaya', 'Rambutan', 'Lanzones', 'Durian', 'Guava', 'Pomelo', 'Citrus (Calamansi/Oranges)',
        'Mangosteen', 'Watermelon', 'Melon (Cantaloupe)', 'Coconut (Niyog)', 'Jackfruit (Langka)', 'Calamansi', 'Avocado',
        'Guyabano (Soursop)', 'Atis (Sugar apple)', 'Chico (Sapodilla)', 'Dalandan (Orange)',
        'Coffee', 'Rubber', 'Cashew', 'Sugarcane', 'Rice', 'Abaca', 'Cacao', 'Tobacco'
    ];
    const livestockOptions = ['Carabao', 'Cattle/Cow', 'Goat', 'Pig/Swine', 'Sheep', 'Horse'];
    const poultryOptions = ['Chicken', 'Duck', 'Turkey', 'Gamefowl'];

    // --- Filter State ---
    const [reportType] = useState('summary'); // Fixed to summary
    const [registryType, setRegistryType] = useState('none'); // Default 'Not Include'

    // Commodity Filters
    const [cropsFilter, setCropsFilter] = useState({ enabled: false, selected: [], all: true });
    const [livestockFilter, setLivestockFilter] = useState({ enabled: false, selected: [], all: true });
    const [poultryFilter, setPoultryFilter] = useState({ enabled: false, selected: [], all: true });

    // Customization State
    const [requestText, setRequestText] = useState(
        "Respectfully submitting herewith the summary data of farmers, fisherfolk, and agricultural commodities registered in the Municipality of Jasaan. This data is provided for your reference and record."
    );

    const [personnel, setPersonnel] = useState([
        { name: '', title: '' }
    ]);

    // --- Statistics & Counts ---
    const stats = useMemo(() => {
        // 1. Filter by Registry Type first (If 'none', we use ALL for calculation but hide table later)
        let filtered = allRegistrants;
        if (registryType !== 'all' && registryType !== 'none') {
            filtered = filtered.filter(r => r.registry === registryType);
        }

        const counts = {
            crops: {},
            livestock: {},
            poultry: {}
        };

        // Initialize with 0 for all known options
        cropNameOptions.forEach(c => counts.crops[c] = 0);
        livestockOptions.forEach(l => counts.livestock[l] = 0);
        poultryOptions.forEach(p => counts.poultry[p] = 0);

        filtered.forEach(reg => {
            reg.crops?.forEach(c => {
                if (c.name) {
                    const key = cropNameOptions.find(opt => opt.toLowerCase() === c.name.toLowerCase()) || c.name;
                    counts.crops[key] = (counts.crops[key] || 0) + 1;
                }
            });
            reg.livestock?.forEach(l => {
                const name = l.animal || l.name;
                if (name) {
                    const key = livestockOptions.find(opt => opt.toLowerCase().includes(name.toLowerCase())) || name;
                    counts.livestock[key] = (counts.livestock[key] || 0) + 1;
                }
            });
            reg.poultry?.forEach(p => {
                const name = p.bird || p.name;
                if (name) {
                    const key = poultryOptions.find(opt => opt.toLowerCase().includes(name.toLowerCase())) || name;
                    counts.poultry[key] = (counts.poultry[key] || 0) + 1;
                }
            });
        });

        // Helper to sort: Standard items first, then others
        const getSortedKeys = (obj, standardList) => {
            const keys = Object.keys(obj);
            return keys.sort((a, b) => {
                const idxA = standardList ? standardList.indexOf(a) : -1;
                const idxB = standardList ? standardList.indexOf(b) : -1;
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });
        };

        return {
            totalMatching: filtered.length,
            counts,
            items: {
                crops: getSortedKeys(counts.crops, cropNameOptions),
                livestock: getSortedKeys(counts.livestock, livestockOptions),
                poultry: getSortedKeys(counts.poultry, poultryOptions)
            }
        };
    }, [allRegistrants, registryType]);

    const handleDownload = () => {
        let filteredData = allRegistrants;
        if (registryType !== 'all' && registryType !== 'none') {
            filteredData = filteredData.filter(r => r.registry === registryType);
        }

        const config = {
            requestText,
            personnel: personnel.filter(p => p.name.trim() !== ''),
            filters: {
                crops: cropsFilter,
                livestock: livestockFilter,
                poultry: poultryFilter
            },
            registryType,
            reportType,
            previewMode: false
        };

        generatePDFReport(filteredData, config);
        onClose();
    };

    // Update preview when entering step 2
    useEffect(() => {
        if (step === 2) {
            updatePreview();
        }
    }, [step]);

    const updatePreview = () => {
        let filteredData = allRegistrants;
        if (registryType !== 'all' && registryType !== 'none') {
            filteredData = filteredData.filter(r => r.registry === registryType);
        }

        const config = {
            requestText,
            personnel: personnel.filter(p => p.name.trim() !== ''),
            filters: {
                crops: cropsFilter,
                livestock: livestockFilter,
                poultry: poultryFilter
            },
            registryType,
            reportType,
            previewMode: true
        };

        const blobUrl = generatePDFReport(filteredData, config);
        setPdfPreviewUrl(blobUrl);
    };

    // --- Handlers ---
    const toggleCommodityAll = (type, checked) => {
        if (type === 'crops') setCropsFilter(prev => ({ ...prev, all: checked }));
        if (type === 'livestock') setLivestockFilter(prev => ({ ...prev, all: checked }));
        if (type === 'poultry') setPoultryFilter(prev => ({ ...prev, all: checked }));
    };

    const toggleCommodityItem = (type, name) => {
        const updateState = (prev) => {
            const selected = prev.selected.includes(name)
                ? prev.selected.filter(i => i !== name)
                : [...prev.selected, name];
            return { ...prev, selected, all: false };
        };

        if (type === 'crops') setCropsFilter(updateState);
        if (type === 'livestock') setLivestockFilter(updateState);
        if (type === 'poultry') setPoultryFilter(updateState);
    };

    const handlePersonnelChange = (index, field, value) => {
        const newPersonnel = [...personnel];
        newPersonnel[index][field] = value;
        setPersonnel(newPersonnel);
    };

    if (!show) return null;

    // --- Render Configuration Step ---
    const renderConfigurationStep = () => (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Metric Summary */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center text-blue-600">
                        <i className="fas fa-users text-xl mr-3"></i>
                        <div>
                            <h4 className="font-bold text-lg">{stats.totalMatching}</h4>
                            <p className="text-xs uppercase tracking-wider font-medium">Matching Registrants</p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        Based on selected filters
                    </div>
                </div>

                {/* 1. REGISTRANT FILTER */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center text-sm uppercase tracking-wider border-b border-border/50 pb-2">
                        <span className="bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-bold">1</span>
                        Registrant Filter
                    </h3>
                    <div className="pl-7">
                        <select
                            value={registryType}
                            onChange={(e) => setRegistryType(e.target.value)}
                            className="w-full md:w-1/2 h-9 px-3 bg-card border border-gray-700/30 rounded text-sm transition-colors focus:border-primary"
                        >
                            <option value="none">Not Include (Commodities Only)</option>
                            <option value="all">All Registrants</option>
                            <option value="farmer">Farmers Only</option>
                            <option value="fisherfolk">Fisherfolk Only</option>
                        </select>
                    </div>
                </div>

                {/* 2. COMMODITIES */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center text-sm uppercase tracking-wider border-b border-border/50 pb-2">
                        <span className="bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-bold">2</span>
                        Commodity Data
                    </h3>
                    <div className="pl-7 grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Crops Column */}
                        <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/40">
                            <div className="flex items-center space-x-2 pb-2 border-b border-border/40">
                                <Checkbox
                                    id="enableCrops"
                                    checked={cropsFilter.enabled}
                                    onCheckedChange={(c) => setCropsFilter(prev => ({ ...prev, enabled: c }))}
                                />
                                <Label htmlFor="enableCrops" className="font-bold flex-1 cursor-pointer">Crops</Label>
                            </div>

                            {cropsFilter.enabled && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="allCrops"
                                            checked={cropsFilter.all}
                                            onCheckedChange={(c) => toggleCommodityAll('crops', c)}
                                        />
                                        <Label htmlFor="allCrops" className="text-sm">All Crops</Label>
                                    </div>

                                    <ScrollArea className="h-40 pr-2">
                                        <div className="space-y-2">
                                            {stats.items.crops.length > 0 ? (
                                                stats.items.crops.map(crop => (
                                                    <div key={crop} className="flex items-center space-x-2 text-sm">
                                                        <Checkbox
                                                            id={`crop-${crop}`}
                                                            checked={cropsFilter.selected.includes(crop)}
                                                            onCheckedChange={() => toggleCommodityItem('crops', crop)}
                                                            className="h-3 w-3"
                                                        />
                                                        <Label htmlFor={`crop-${crop}`} className="text-xs cursor-pointer flex-1 truncate">
                                                            {crop} <span className="text-muted-foreground ml-1">({stats.counts.crops[crop]})</span>
                                                        </Label>
                                                    </div>
                                                ))
                                            ) : <p className="text-xs text-muted-foreground italic">No crops found</p>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>

                        {/* Livestock Column */}
                        <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/40">
                            <div className="flex items-center space-x-2 pb-2 border-b border-border/40">
                                <Checkbox
                                    id="enableLivestock"
                                    checked={livestockFilter.enabled}
                                    onCheckedChange={(c) => setLivestockFilter(prev => ({ ...prev, enabled: c }))}
                                />
                                <Label htmlFor="enableLivestock" className="font-bold flex-1 cursor-pointer">Livestock</Label>
                            </div>

                            {livestockFilter.enabled && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="allLivestock"
                                            checked={livestockFilter.all}
                                            onCheckedChange={(c) => toggleCommodityAll('livestock', c)}
                                        />
                                        <Label htmlFor="allLivestock" className="text-sm">All Livestock</Label>
                                    </div>

                                    <ScrollArea className="h-40 pr-2">
                                        <div className="space-y-2">
                                            {stats.items.livestock.length > 0 ? (
                                                stats.items.livestock.map(item => (
                                                    <div key={item} className="flex items-center space-x-2 text-sm">
                                                        <Checkbox
                                                            id={`livestock-${item}`}
                                                            checked={livestockFilter.selected.includes(item)}
                                                            onCheckedChange={() => toggleCommodityItem('livestock', item)}
                                                            className="h-3 w-3"
                                                        />
                                                        <Label htmlFor={`livestock-${item}`} className="text-xs cursor-pointer flex-1 truncate">
                                                            {item} <span className="text-muted-foreground ml-1">({stats.counts.livestock[item]})</span>
                                                        </Label>
                                                    </div>
                                                ))
                                            ) : <p className="text-xs text-muted-foreground italic">No livestock found</p>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>

                        {/* Poultry Column */}
                        <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/40">
                            <div className="flex items-center space-x-2 pb-2 border-b border-border/40">
                                <Checkbox
                                    id="enablePoultry"
                                    checked={poultryFilter.enabled}
                                    onCheckedChange={(c) => setPoultryFilter(prev => ({ ...prev, enabled: c }))}
                                />
                                <Label htmlFor="enablePoultry" className="font-bold flex-1 cursor-pointer">Poultry</Label>
                            </div>

                            {poultryFilter.enabled && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="allPoultry"
                                            checked={poultryFilter.all}
                                            onCheckedChange={(c) => toggleCommodityAll('poultry', c)}
                                        />
                                        <Label htmlFor="allPoultry" className="text-sm">All Poultry</Label>
                                    </div>

                                    <ScrollArea className="h-40 pr-2">
                                        <div className="space-y-2">
                                            {stats.items.poultry.length > 0 ? (
                                                stats.items.poultry.map(item => (
                                                    <div key={item} className="flex items-center space-x-2 text-sm">
                                                        <Checkbox
                                                            id={`poultry-${item}`}
                                                            checked={poultryFilter.selected.includes(item)}
                                                            onCheckedChange={() => toggleCommodityItem('poultry', item)}
                                                            className="h-3 w-3"
                                                        />
                                                        <Label htmlFor={`poultry-${item}`} className="text-xs cursor-pointer flex-1 truncate">
                                                            {item} <span className="text-muted-foreground ml-1">({stats.counts.poultry[item]})</span>
                                                        </Label>
                                                    </div>
                                                ))
                                            ) : <p className="text-xs text-muted-foreground italic">No poultry found</p>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* 3. REQUEST TEXT */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center text-sm uppercase tracking-wider border-b border-border/50 pb-2">
                        <span className="bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-bold">3</span>
                        Report Content
                    </h3>
                    <div className="pl-7">
                        <textarea
                            value={requestText}
                            onChange={(e) => setRequestText(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-card border border-gray-700/30 rounded text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* 4. SIGNATORIES */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center pr-1 border-b border-border/50 pb-2">
                        <h3 className="font-semibold text-foreground flex items-center text-sm uppercase tracking-wider">
                            <span className="bg-foreground text-background w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-bold">4</span>
                            Signatories
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (personnel.length < 4) setPersonnel([...personnel, { name: '', title: '' }]);
                            }}
                            disabled={personnel.length >= 4}
                            className="h-7 text-xs"
                        >
                            <i className="fas fa-plus mr-1"></i> Add Person {personnel.length >= 4 && '(Max 4)'}
                        </Button>
                    </div>
                    <div className="pl-7 space-y-3 max-w-2xl">
                        {personnel.map((person, index) => (
                            <div key={index} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300">
                                <input
                                    type="text"
                                    value={person.name}
                                    onChange={(e) => handlePersonnelChange(index, 'name', e.target.value)}
                                    placeholder="Full Name"
                                    className="flex-1 h-9 px-3 bg-card border border-gray-700/30 rounded text-sm focus:border-primary"
                                />
                                <input
                                    type="text"
                                    value={person.title}
                                    onChange={(e) => handlePersonnelChange(index, 'title', e.target.value)}
                                    placeholder="Official Title"
                                    className="flex-1 h-9 px-3 bg-card border border-gray-700/30 rounded text-sm focus:border-primary"
                                />
                                {personnel.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newP = personnel.filter((_, i) => i !== index);
                                        setPersonnel(newP);
                                    }} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-9 w-9">
                                        <i className="fas fa-trash-alt"></i>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="border-t border-border/50 p-6 flex justify-end gap-3 bg-card mt-auto z-10 relative">
                <Button variant="outline" onClick={onClose} className="!rounded-button">Cancel</Button>
                <Button onClick={() => setStep(2)} className="bg-primary hover:bg-primary/90 text-primary-foreground !rounded-button px-6">
                    Next: Preview <i className="fas fa-chevron-right ml-2 text-xs"></i>
                </Button>
            </div>
        </div>
    );

    // --- Render Preview Step ---
    const renderPreviewStep = () => (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center relative p-8">
                <div className="absolute top-4 left-4 flex gap-4 text-white/70 text-sm">
                    <span><i className="fas fa-file-pdf mr-2"></i>PDF Preview</span>
                    <span><i className="fas fa-users mr-2"></i>{stats.totalMatching} Records</span>
                </div>

                {pdfPreviewUrl ? (
                    <iframe
                        src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full shadow-2xl rounded-sm bg-white border border-gray-800"
                        title="PDF Preview"
                    />
                ) : (
                    <div className="text-white/30 flex flex-col items-center animate-pulse">
                        <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
                        <p>Generating Preview...</p>
                    </div>
                )}
            </div>

            <div className="border-t border-border/50 p-6 flex justify-between items-center bg-card z-10 relative">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="hover:bg-muted !rounded-button">
                    <i className="fas fa-arrow-left mr-2"></i> Back to Configuration
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onClose} className="!rounded-button">Cancel</Button>
                    <Button type="button" onClick={handleDownload} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 !rounded-button px-6">
                        <i className="fas fa-download mr-2"></i> Download PDF Report
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="bg-card border-0 shadow-2xl rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                <CardHeader className="border-b border-border/50 py-4 px-6 flex-shrink-0 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <i className={`fas ${step === 1 ? 'fa-cog' : 'fa-file-pdf'}`}></i>
                            </div>
                            <div>
                                <CardTitle className="text-foreground text-lg">Generate PDF Report</CardTitle>
                                <p className="text-xs text-muted-foreground">Step {step} of 2: {step === 1 ? 'Configure Content' : 'Preview Document'}</p>
                            </div>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-8 rounded-full transition-colors", step === 1 ? "bg-primary" : "bg-muted")}></div>
                            <div className={cn("h-2 w-8 rounded-full transition-colors", step === 2 ? "bg-primary" : "bg-muted")}></div>
                        </div>

                        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                            <i className="fas fa-times"></i>
                        </Button>
                    </div>
                </CardHeader>

                <div className="flex-1 overflow-hidden relative">
                    {step === 1 && renderConfigurationStep()}
                    {step === 2 && renderPreviewStep()}
                </div>

            </Card>
        </div>
    );
};

export default PDFExportModal;
