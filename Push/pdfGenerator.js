
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import daLogo from '../assets/da_logo.png';

/**
 * Generates a PDF report for the simplified RSBSA data requests.
 * 
 * @param {Array} data - Array of record objects to include in the table
 * @param {Object} config - Configuration options
 * @param {string} config.requestText - The customizable body text of the request
 * @param {Array} config.personnel - Array of personnel objects { name, title }
 * @param {Object} config.filters - Detailed filter configuration
 * @param {boolean} config.previewMode - If true, returns blob URL instead of saving
 */
export const generatePDFReport = (data, config) => {
    const doc = new jsPDF();

    // Document Configuration
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // --- Header Section ---
    const addHeader = () => {
        try {
            doc.addImage(daLogo, 'PNG', margin, margin - 5, 25, 25);
        } catch (e) {
            console.warn("Logo image failed to load", e);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Republic of the Philippines', pageWidth / 2, margin, { align: 'center' });
        doc.text('Province of Misamis Oriental', pageWidth / 2, margin + 5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('MUNICIPALITY OF JASAAN', pageWidth / 2, margin + 11, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0); // Dark Green
        doc.text('DEPARTMENT OF AGRICULTURE', pageWidth / 2, margin + 18, { align: 'center' });

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

        return margin + 35;
    };

    currentY = addHeader();
    doc.setTextColor(0, 0, 0);

    // --- Report Title ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DATA REQUEST REPORT', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // --- Date ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(today, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;

    // --- Request Body ---
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(config.requestText, contentWidth);
    doc.text(splitText, margin, currentY);
    currentY += (splitText.length * 5) + 10;

    // --- Dynamic Table Construction ---
    const filters = config.filters || {};

    // Base columns
    const tableColumns = [
        { header: 'RSBSA No.', dataKey: 'reference_no' },
        { header: 'Name', dataKey: 'full_name' },
        { header: 'Barangay', dataKey: 'barangay' },
        { header: 'Registry Type', dataKey: 'registry_type' },
        // { header: 'Farm Size (ha)', dataKey: 'farm_size' }, // Conditionally add? Keep for now
    ];

    // Conditionally add commodity columns
    // Helper to check if a category is enabled
    const isCropsEnabled = filters.crops?.enabled;
    const isLivestockEnabled = filters.livestock?.enabled;
    const isPoultryEnabled = filters.poultry?.enabled;

    if (isCropsEnabled) {
        tableColumns.push({ header: 'Crops', dataKey: 'crops' });
    }
    if (isLivestockEnabled) {
        tableColumns.push({ header: 'Livestock', dataKey: 'livestock' });
    }
    if (isPoultryEnabled) {
        tableColumns.push({ header: 'Poultry', dataKey: 'poultry' });
    }

    // Helper to filter sub-items
    const filterItems = (items, selectedNames, allSelected) => {
        if (!items || items.length === 0) return '';
        if (allSelected) return items.map(i => i.name).join(', ');

        return items
            .filter(i => selectedNames.includes(i.name))
            .map(i => i.name)
            .join(', ');
    };

    // Process Data
    const tableData = data.map(record => {
        const row = {
            reference_no: record.reference_no || 'N/A',
            full_name: `${record.surname}, ${record.first_name} ${record.middle_name ? record.middle_name[0] + '.' : ''}`,
            barangay: record.addresses?.[0]?.barangay || 'N/A',
            registry_type: record.registry || 'N/A',
            farm_size: record.farm_parcels ?
                record.farm_parcels.reduce((sum, p) => sum + (parseFloat(p.total_farm_area_ha) || 0), 0).toFixed(2) : '0',
        };

        if (isCropsEnabled) {
            const selected = filters.crops?.selected || [];
            const all = filters.crops?.all;
            row.crops = filterItems(record.crops, selected, all) || '-';
        }

        if (isLivestockEnabled) {
            const selected = filters.livestock?.selected || [];
            const all = filters.livestock?.all;
            row.livestock = filterItems(record.livestock, selected, all) || '-';
        }

        if (isPoultryEnabled) {
            const selected = filters.poultry?.selected || [];
            const all = filters.poultry?.all;
            row.poultry = filterItems(record.poultry, selected, all) || '-';
        }

        return row;
    });

    // Remove rows that have empty content for selected filters?
    // ... (previous logic comments)

    // --- Aggregation Logic for Summary ---
    const generateSummaryContent = (rawRows, currentY) => {
        // 1. REGISTRANTS BY LOCATION
        const locationStats = {}; // { 'Purok 1 (Barangay A)': { farmer: 0, fisherfolk: 0 } }

        rawRows.forEach(r => {
            const addr = r.addresses?.[0] || {};
            const key = `${addr.purok || 'Unknown Purok'} (${addr.barangay || 'Unknown Brgy'})`;
            if (!locationStats[key]) locationStats[key] = { farmer: 0, fisherfolk: 0 };

            if (r.registry === 'farmer') locationStats[key].farmer++;
            if (r.registry === 'fisherfolk') locationStats[key].fisherfolk++;
        });

        const locationData = Object.entries(locationStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([location, counts]) => [
                location,
                counts.farmer > 0 ? counts.farmer : '-',
                counts.fisherfolk > 0 ? counts.fisherfolk : '-'
            ]);

        // 2. COMMODITIES
        const cropsStats = {};
        const livestockStats = {};
        const poultryStats = {};

        rawRows.forEach(r => {
            // Crops (Count instances for now, or sum areas if available - user said "Value" like dashboard which is count)
            if (isCropsEnabled) {
                // Filter sub-items based on selection
                const selected = filters.crops?.selected || [];
                const all = filters.crops?.all;
                const relevantCrops = r.crops?.filter(c => all || selected.includes(c.name)) || [];

                relevantCrops.forEach(c => {
                    const name = c.name || 'Other';
                    cropsStats[name] = (cropsStats[name] || 0) + 1;
                });
            }

            // Livestock (Sum head_count)
            if (isLivestockEnabled) {
                const selected = filters.livestock?.selected || [];
                const all = filters.livestock?.all;

                // Helper to normalize name
                const getAnimalName = (i) => i.animal || i.name || 'Other';

                const relevantItems = r.livestock?.filter(i => {
                    if (all) return true;
                    const name = getAnimalName(i);
                    // Check if name is in selected list (partial match for strings like 'Carabao')
                    return selected.some(s => s.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.toLowerCase()));
                }) || [];

                relevantItems.forEach(i => {
                    const name = getAnimalName(i);
                    // Map back to standard categories if possible, or use raw name
                    // Actually, we should probably aggregate by the normalized name if it matches an option
                    // But for report, let's show the actual animal name or the category?
                    // Dashboard showed Raw Names. Let's use Raw Names but normalize case.
                    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    const val = parseFloat(i.head_count) || 1;
                    livestockStats[key] = (livestockStats[key] || 0) + val;
                });
            }

            // Poultry (Sum head_count)
            if (isPoultryEnabled) {
                const selected = filters.poultry?.selected || [];
                const all = filters.poultry?.all;

                const getBirdName = (i) => i.bird || i.name || 'Other';

                const relevantItems = r.poultry?.filter(i => {
                    if (all) return true;
                    const name = getBirdName(i);
                    return selected.some(s => s.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.toLowerCase()));
                }) || [];

                relevantItems.forEach(i => {
                    const name = getBirdName(i);
                    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                    const val = parseFloat(i.head_count) || 1;
                    poultryStats[key] = (poultryStats[key] || 0) + val;
                });
            }
        });


        // --- Render Tables ---

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        // --- Render Tables ---

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');

        if (config.registryType !== 'none') {
            doc.text('1. Registrants by Location', margin, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Location (Purok/Barangay)', 'Farmers', 'Fisherfolk']],
                body: locationData,
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center' }, 2: { halign: 'center' } },
                margin: { left: margin, right: margin }
            });
            currentY = doc.lastAutoTable.finalY + 10;
        }

        // Helper for Commodity Tables
        const renderCommodityTable = (title, stats) => {
            const body = Object.entries(stats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, val]) => [name, val]);

            if (body.length === 0) return;

            // Check page break
            if (currentY + 60 > pageHeight) {
                doc.addPage();
                currentY = margin;
            }

            doc.setFontSize(12);
            doc.text(title, margin, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Commodity', 'Total Count/Value']],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [100, 100, 100] },
                columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto', halign: 'center' } },
                margin: { left: margin, right: margin } // Full width
            });
            currentY = doc.lastAutoTable.finalY + 10;
        };

        if (isCropsEnabled) renderCommodityTable('2. Crops Summary', cropsStats);
        if (isLivestockEnabled) renderCommodityTable('3. Livestock Summary', livestockStats);
        if (isPoultryEnabled) renderCommodityTable('4. Poultry Summary', poultryStats);
    };

    if (config.reportType === 'summary') {
        generateSummaryContent(data, currentY);
        // Note: passing 'data' which is the raw rows, not tableData
    } else {
        autoTable(doc, {
            startY: currentY,
            head: [tableColumns.map(c => c.header)],
            body: tableData.map(row => tableColumns.map(c => row[c.dataKey])),
            theme: 'grid',
            headStyles: {
                fillColor: [46, 125, 50],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 25 }, // RSBSA
            },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
        });
        currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- Conclusion ---
    // Recalculate currentY 
    if (config.reportType === 'summary') {
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currentY + 15;
    }

    // Ensure we don't write off page
    if (currentY + 40 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
    }

    const conclusionText = "This data is generated from the AgriTech System and is certified to be true and correct based on the available records. This report is valid for official use only.";
    const splitConclusion = doc.splitTextToSize(conclusionText, contentWidth);
    doc.text(splitConclusion, margin, currentY);
    currentY += 25;

    // --- Signatures ---
    const personnel = config.personnel || [];
    if (personnel.length > 0) {
        const colWidth = contentWidth / Math.min(personnel.length, 3);

        personnel.forEach((person, index) => {
            // Row wrapping logic
            if (index > 0 && index % 3 === 0) {
                currentY += 40;
                if (currentY + 30 > pageHeight - margin) {
                    doc.addPage();
                    currentY = margin;
                }
            }

            const xPos = margin + ((index % 3) * colWidth);
            const centerX = xPos + (colWidth / 2);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(index === 0 ? 'Prepared by:' : (index === personnel.length - 1 ? 'Approved by:' : 'Noted by:'), xPos, currentY);

            const nameY = currentY + 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(person.name.toUpperCase(), centerX, nameY, { align: 'center' });

            doc.setLineWidth(0.5);
            doc.line(centerX - 30, nameY + 2, centerX + 30, nameY + 2);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(person.title, centerX, nameY + 7, { align: 'center' });
        });
    }

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    if (config.previewMode) {
        return doc.output('bloburl');
    } else {
        const filename = `AgriTech_${config.reportType === 'summary' ? 'Summary' : 'Detailed'}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    }
};

const generateSummaryContent = (doc, data, startY, margin, contentWidth, pageWidth) => {
    let currentY = startY;

    // Helper to get location key
    const getLocationKey = (record) => {
        const barangay = record.barangay || 'Unknown';
        // Note: The passed 'data' is already transformed for the table, simplified.
        // It might not have the raw 'addresses' object anymore. 
        // We need to look at 'tableData' construction above.
        // 'barangay' is extracted there. 'Purok' was NOT.
        // We need to fix the data/transformation passing to include Purok if available.
        // BUT wait, 'tableData' is constructed locally in generatePDFReport.
        // We should fix that first or pass raw 'data' to this helper.
        // Let's rely on raw 'data' for aggregation, not 'tableData'.
        return "Temp";
    };

    // Actually, let's inject the logic directly into generatePDFReport to avoid scope issues or re-parsing.
    // I will refactor the whole function in the next step to be cleaner.
    // For now, I'll placehold the structure logic.
};
