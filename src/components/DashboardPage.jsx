import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as echarts from "echarts";
import ApiService from '../services/api';

const DashboardPage = ({ user, isSidebarCollapsed }) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [modalType, setModalType] = useState(null); // 'crops' or 'animals'
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Real data from database
  const [dashboardData, setDashboardData] = useState({
    totalFarmers: 0,
    totalFisherfolks: 0,
    totalCrops: 0,
    totalAnimals: 0,
    genderData: {
      maleFarmers: 0,
      femaleFarmers: 0,
      maleFisherfolks: 0,
      femaleFisherfolks: 0
    },
    monthlyData: {
      farmers: Array(12).fill(0),
      fisherfolks: Array(12).fill(0)
    },
    productionByArea: {},
    detailedProductionData: {},
    topPuroks: [],
    cropsDataByPurok: {},
    animalsDataByPurok: {},
    cropDensityByArea: {},
    productionSummary: {},
    availableYears: [],
    loading: true
  });

  useEffect(() => {
    setShowWelcome(true);
    const timer = setTimeout(() => setShowWelcome(false), 1800);
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all registrants
        const registrants = await ApiService.getAllRegistrants();
        
        // Calculate statistics (always current totals)
        const farmers = registrants.filter(r => r.registry === 'farmer' && !r.deleted_at);
        const fisherfolks = registrants.filter(r => r.registry === 'fisherfolk' && !r.deleted_at);
        
        const maleFarmers = farmers.filter(r => r.sex?.toLowerCase() === 'male').length;
        const femaleFarmers = farmers.filter(r => r.sex?.toLowerCase() === 'female').length;
        const maleFisherfolks = fisherfolks.filter(r => r.sex?.toLowerCase() === 'male').length;
        const femaleFisherfolks = fisherfolks.filter(r => r.sex?.toLowerCase() === 'female').length;

        // Calculate available years from data
        const uniqueYears = new Set();
        registrants.forEach(r => {
          if (r.created_at && !r.deleted_at) {
            uniqueYears.add(new Date(r.created_at).getFullYear());
          }
        });
        // Ensure current year is always available
        uniqueYears.add(new Date().getFullYear());
        const availableYears = Array.from(uniqueYears).sort((a, b) => b - a);
        
        // Calculate monthly registration trends for selected year
        const monthlyData = {
          farmers: Array(12).fill(0),
          fisherfolks: Array(12).fill(0)
        };
        
        registrants.forEach(r => {
          if (r.created_at && !r.deleted_at) {
            const createdDate = new Date(r.created_at);
            if (createdDate.getFullYear() === selectedYear) {
              const month = createdDate.getMonth(); // 0-11
              if (r.registry === 'farmer') {
                monthlyData.farmers[month]++;
              } else if (r.registry === 'fisherfolk') {
                monthlyData.fisherfolks[month]++;
              }
            }
          }
        });
        
        // Fetch crops and animals
        const crops = await ApiService.getAllCrops();
        const livestock = await ApiService.getAllLivestock();
        const poultry = await ApiService.getAllPoultry();
        
        const activeCrops = crops.filter(c => !c.deleted_at);
        const activeLivestock = livestock.filter(l => !l.deleted_at);
        const activePoultry = poultry.filter(p => !p.deleted_at);
        
        const totalAnimals = activeLivestock.reduce((sum, l) => sum + (l.head_count || 0), 0) +
                            activePoultry.reduce((sum, p) => sum + (p.head_count || 0), 0);
        
        // Calculate production by area (barangay)
        const productionByArea = {};
        
        // Helper to get registrant's barangay and purok
        const getLocation = (registrantId) => {
          const registrant = registrants.find(r => r.id === registrantId);
          if (registrant && registrant.addresses && registrant.addresses[0]) {
            return {
              barangay: registrant.addresses[0].barangay || 'Unknown',
              purok: registrant.addresses[0].purok || 'Unknown'
            };
          }
          return { barangay: 'Unknown', purok: 'Unknown' };
        };
        
        // Calculate detailed data for modal (crops by barangay, purok, and type)
        const detailedProductionData = {};
        
        // Group crops by barangay -> crop type -> purok
        activeCrops.forEach(crop => {
          const { barangay, purok } = getLocation(crop.registrant_id);
          // Use 'name' field for crops
          const cropType = crop.name || 'Other';
          
          if (!detailedProductionData[barangay]) {
            detailedProductionData[barangay] = { crops: {}, animals: {} };
          }
          if (!detailedProductionData[barangay].crops[cropType]) {
            detailedProductionData[barangay].crops[cropType] = {};
          }
          if (!detailedProductionData[barangay].crops[cropType][purok]) {
            detailedProductionData[barangay].crops[cropType][purok] = 0;
          }
          detailedProductionData[barangay].crops[cropType][purok]++;
          
          // Count for production by area
          if (!productionByArea[barangay]) {
            productionByArea[barangay] = { crops: 0, animals: 0 };
          }
          // For crops, we count instances/parcels
          productionByArea[barangay].crops++;
        });
        
        // Group animals by barangay -> animal type -> purok
        // Process livestock (uses 'animal' field)
        activeLivestock.forEach(animal => {
          const { barangay, purok } = getLocation(animal.registrant_id);
          const animalType = animal.animal || 'Other';
          
          if (!detailedProductionData[barangay]) {
            detailedProductionData[barangay] = { crops: {}, animals: {} };
          }
          if (!detailedProductionData[barangay].animals[animalType]) {
            detailedProductionData[barangay].animals[animalType] = {};
          }
          if (!detailedProductionData[barangay].animals[animalType][purok]) {
            detailedProductionData[barangay].animals[animalType][purok] = 0;
          }
          detailedProductionData[barangay].animals[animalType][purok] += (animal.head_count || 1);
          
          // Count for production by area
          if (!productionByArea[barangay]) {
            productionByArea[barangay] = { crops: 0, animals: 0 };
          }
          // Sum head counts for animals
          productionByArea[barangay].animals += (animal.head_count || 1);
        });
        
        // Process poultry (uses 'bird' field)
        activePoultry.forEach(bird => {
          const { barangay, purok } = getLocation(bird.registrant_id);
          const birdType = bird.bird || 'Other';
          
          if (!detailedProductionData[barangay]) {
            detailedProductionData[barangay] = { crops: {}, animals: {} };
          }
          if (!detailedProductionData[barangay].animals[birdType]) {
            detailedProductionData[barangay].animals[birdType] = {};
          }
          if (!detailedProductionData[barangay].animals[birdType][purok]) {
            detailedProductionData[barangay].animals[birdType][purok] = 0;
          }
          detailedProductionData[barangay].animals[birdType][purok] += (bird.head_count || 1);
          
          // Count for production by area
          if (!productionByArea[barangay]) {
            productionByArea[barangay] = { crops: 0, animals: 0 };
          }
          // Sum head counts for poultry
          productionByArea[barangay].animals += (bird.head_count || 1);
        });
        
        // Calculate top 5 puroks by registrant count for selected year
        const purokCounts = {};
        registrants.forEach(r => {
          if (r.deleted_at) return; // Skip deleted registrants
          
          // Filter by selected year
          if (r.created_at) {
            const createdDate = new Date(r.created_at);
            if (createdDate.getFullYear() !== selectedYear) return;
          }
          
          if (r.addresses && r.addresses[0]) {
            const barangay = r.addresses[0].barangay || 'Unknown';
            const purok = r.addresses[0].purok || 'Unknown';
            const key = `${purok} (${barangay})`;
            if (!purokCounts[key]) {
              purokCounts[key] = 0;
            }
            purokCounts[key]++;
          }
        });
        
        // Sort and get top 5
        const topPuroks = Object.entries(purokCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        
        // Calculate crops by purok and type for Top Crops Production chart
        const cropsDataByPurok = {};
        activeCrops.forEach(crop => {
          const { purok } = getLocation(crop.registrant_id);
          const cropName = crop.name || 'Other';
          
          if (!cropsDataByPurok[cropName]) {
            cropsDataByPurok[cropName] = {};
          }
          if (!cropsDataByPurok[cropName][purok]) {
            cropsDataByPurok[cropName][purok] = 0;
          }
          cropsDataByPurok[cropName][purok]++;
        });
        
        // Calculate animals by purok and type for Top Animals Population chart
        const animalsDataByPurok = {};
        
        // Livestock
        activeLivestock.forEach(animal => {
          const { purok } = getLocation(animal.registrant_id);
          const animalName = animal.animal || 'Other';
          
          if (!animalsDataByPurok[animalName]) {
            animalsDataByPurok[animalName] = {};
          }
          if (!animalsDataByPurok[animalName][purok]) {
            animalsDataByPurok[animalName][purok] = 0;
          }
          animalsDataByPurok[animalName][purok] += (animal.head_count || 1);
        });
        
        // Poultry
        activePoultry.forEach(bird => {
          const { purok } = getLocation(bird.registrant_id);
          const birdName = bird.bird || 'Other';
          
          if (!animalsDataByPurok[birdName]) {
            animalsDataByPurok[birdName] = {};
          }
          if (!animalsDataByPurok[birdName][purok]) {
            animalsDataByPurok[birdName][purok] = 0;
          }
          animalsDataByPurok[birdName][purok] += (bird.head_count || 1);
        });
        
        // Calculate crop density (crops per hectare) by area
        const cropDensityByArea = {};
        
        // Get total farm area per barangay from registrants
        const areaByBarangay = {};
        registrants.forEach(r => {
          if (r.deleted_at) return;
          if (r.farm_parcels && r.farm_parcels.length > 0) {
            r.farm_parcels.forEach(parcel => {
              if (parcel.total_farm_area_ha && r.addresses && r.addresses[0]) {
                const barangay = r.addresses[0].barangay || 'Unknown';
                if (!areaByBarangay[barangay]) {
                  areaByBarangay[barangay] = 0;
                }
                areaByBarangay[barangay] += parseFloat(parcel.total_farm_area_ha);
              }
            });
          }
        });
        
        // Calculate density for each barangay
        Object.keys(productionByArea).forEach(barangay => {
          const cropCount = productionByArea[barangay].crops;
          const totalArea = areaByBarangay[barangay] || 0;
          
          if (totalArea > 0) {
            cropDensityByArea[barangay] = {
              cropCount,
              totalArea: totalArea.toFixed(2),
              density: (cropCount / totalArea).toFixed(2)
            };
          }
        });
        
        // Calculate production summary for tables with detailed categorization
        const productionSummary = {};
        
        // First, fetch parcel_infos to get farm_kind data
        const parcelInfos = await ApiService.getAllParcelInfos();
        
        // Create a map for quick lookup: parcel_info_id -> parcel_info (for crops that have parcel_info_id)
        const parcelInfoByIdMap = {};
        parcelInfos.forEach(info => {
          parcelInfoByIdMap[info.id] = info;
        });
        
        // Helper function to parse hectares from value_text
        const parseHectares = (valueText) => {
          if (!valueText) return 0;
          // value_text could be "2.5 ha", "2.5", or just a number
          const match = valueText.toString().match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 0;
        };
        
        // Group crops by barangay with detailed breakdown using REAL hectares
        activeCrops.forEach(crop => {
          const { barangay } = getLocation(crop.registrant_id);
          const cropName = crop.name || 'Others';
          
          // Parse actual hectares from value_text field
          const hectares = parseHectares(crop.value_text);
          
          if (!productionSummary[barangay]) {
            productionSummary[barangay] = {
              crops: {
                rice: { irrigated: { count: 0, area: 0 }, rainfed: { count: 0, area: 0 } },
                corn: { yellow: { count: 0, area: 0 }, white: { count: 0, area: 0 } },
                others: {}
              },
              livestock: {},
              poultry: {},
              totalArea: 0
            };
          }
          
          // Add to total area
          productionSummary[barangay].totalArea += hectares;
          
          // Categorize crops by type and sub-type with REAL areas
          if (cropName.toLowerCase().includes('rice')) {
            // For rice, categorize by farm type using parcel_info_id
            let farmKind = 'rainfed'; // default
            
            // If crop has parcel_info_id, get the farm_kind
            if (crop.parcel_info_id && parcelInfoByIdMap[crop.parcel_info_id]) {
              const parcelInfo = parcelInfoByIdMap[crop.parcel_info_id];
              if (parcelInfo.farm_kind) {
                farmKind = parcelInfo.farm_kind.toLowerCase();
              }
            }
            
            // Assign to irrigated or rainfed based on farm_kind
            if (farmKind.includes('irrigated')) {
              productionSummary[barangay].crops.rice.irrigated.count++;
              productionSummary[barangay].crops.rice.irrigated.area += hectares;
            } else {
              productionSummary[barangay].crops.rice.rainfed.count++;
              productionSummary[barangay].crops.rice.rainfed.area += hectares;
            }
          } else if (cropName.toLowerCase().includes('corn')) {
            // Categorize by corn type (yellow/white)
            const cornType = crop.corn_type ? crop.corn_type.toLowerCase() : 'yellow';
            if (cornType === 'white') {
              productionSummary[barangay].crops.corn.white.count++;
              productionSummary[barangay].crops.corn.white.area += hectares;
            } else {
              productionSummary[barangay].crops.corn.yellow.count++;
              productionSummary[barangay].crops.corn.yellow.area += hectares;
            }
          } else {
            // Other specific crops - store individually with real area
            if (!productionSummary[barangay].crops.others[cropName]) {
              productionSummary[barangay].crops.others[cropName] = { count: 0, area: 0 };
            }
            productionSummary[barangay].crops.others[cropName].count++;
            productionSummary[barangay].crops.others[cropName].area += hectares;
          }
        });
        
        // Group livestock by barangay and type
        activeLivestock.forEach(animal => {
          const { barangay } = getLocation(animal.registrant_id);
          const animalType = animal.animal || 'Unknown';
          
          if (!productionSummary[barangay]) {
            productionSummary[barangay] = {
              crops: {},
              livestock: {},
              poultry: {},
              totalArea: 0
            };
          }
          
          if (!productionSummary[barangay].livestock[animalType]) {
            productionSummary[barangay].livestock[animalType] = 0;
          }
          productionSummary[barangay].livestock[animalType] += (animal.head_count || 1);
        });
        
        // Group poultry by barangay and type
        activePoultry.forEach(bird => {
          const { barangay } = getLocation(bird.registrant_id);
          const birdType = bird.bird || 'Unknown';
          
          if (!productionSummary[barangay]) {
            productionSummary[barangay] = {
              crops: {},
              livestock: {},
              poultry: {},
              totalArea: 0
            };
          }
          
          if (!productionSummary[barangay].poultry[birdType]) {
            productionSummary[barangay].poultry[birdType] = 0;
          }
          productionSummary[barangay].poultry[birdType] += (bird.head_count || 1);
        });
        
        
        setDashboardData({
          totalFarmers: farmers.length,
          totalFisherfolks: fisherfolks.length,
          totalCrops: activeCrops.length,
          totalAnimals: totalAnimals,
          genderData: {
            maleFarmers,
            femaleFarmers,
            maleFisherfolks,
            femaleFisherfolks
          },
          monthlyData,
          productionByArea,
          detailedProductionData,
          topPuroks,
          cropsDataByPurok,
          animalsDataByPurok,
          cropDensityByArea,
          productionSummary,
          availableYears,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchDashboardData();
  }, [selectedYear]); // Re-fetch when year changes

  useEffect(() => {
    // Initialize charts after data is loaded
    if (!dashboardData.loading) {
      const timer = setTimeout(() => {
        initCharts();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dashboardData]); // Re-initialize when data changes

  useEffect(() => {
    // whenever sidebar collapses/expands, resize all charts
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300); // wait for transition
  }, [isSidebarCollapsed]);

  // Listen for theme changes to update charts dynamically
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!dashboardData.loading) {
        initCharts();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [dashboardData]);

  const detailedData = {
    "Upper Jasaan": {
      crops: {
        Rice: {
          purok5: 134,
          purok6: 98,
          purok7: 87,
          purok8: 76,
          purok9: 65,
          total: 460,
        },
        Corn: {
          purok5: 89,
          purok6: 67,
          purok7: 54,
          purok8: 43,
          purok9: 32,
          total: 285,
        },
        Coconut: {
          purok5: 45,
          purok6: 38,
          purok7: 29,
          purok8: 21,
          purok9: 17,
          total: 150,
        },
        Banana: {
          purok5: 23,
          purok6: 19,
          purok7: 15,
          purok8: 12,
          purok9: 8,
          total: 77,
        },
        Vegetables: {
          purok5: 18,
          purok6: 15,
          purok7: 12,
          purok8: 9,
          purok9: 6,
          total: 60,
        },
      },
      animals: {
        Chicken: {
          purok5: 456,
          purok6: 389,
          purok7: 298,
          purok8: 234,
          purok9: 178,
          total: 1555,
        },
        Swine: {
          purok5: 123,
          purok6: 98,
          purok7: 87,
          purok8: 65,
          purok9: 54,
          total: 427,
        },
        Carabao: {
          purok5: 34,
          purok6: 28,
          purok7: 23,
          purok8: 19,
          purok9: 15,
          total: 119,
        },
        Goat: {
          purok5: 45,
          purok6: 38,
          purok7: 31,
          purok8: 25,
          purok9: 18,
          total: 157,
        },
        Cattle: {
          purok5: 28,
          purok6: 23,
          purok7: 19,
          purok8: 15,
          purok9: 12,
          total: 97,
        },
      },
    },
    "Lower Jasaan": {
      crops: {
        Rice: {
          purok1: 145,
          purok2: 123,
          purok3: 134,
          purok4: 109,
          purok10: 87,
          purok11: 68,
          total: 666,
        },
        Corn: {
          purok1: 78,
          purok2: 65,
          purok3: 72,
          purok4: 54,
          purok10: 43,
          purok11: 32,
          total: 344,
        },
        Coconut: {
          purok1: 56,
          purok2: 48,
          purok3: 52,
          purok4: 39,
          purok10: 31,
          purok11: 24,
          total: 250,
        },
        Banana: {
          purok1: 34,
          purok2: 29,
          purok3: 31,
          purok4: 23,
          purok10: 18,
          purok11: 15,
          total: 150,
        },
        Vegetables: {
          purok1: 21,
          purok2: 18,
          purok3: 19,
          purok4: 15,
          purok10: 12,
          purok11: 9,
          total: 94,
        },
      },
      animals: {
        Chicken: {
          purok1: 567,
          purok2: 489,
          purok3: 523,
          purok4: 398,
          purok10: 289,
          purok11: 234,
          total: 2500,
        },
        Swine: {
          purok1: 156,
          purok2: 134,
          purok3: 145,
          purok4: 109,
          purok10: 87,
          purok11: 69,
          total: 700,
        },
        Carabao: {
          purok1: 45,
          purok2: 38,
          purok3: 41,
          purok4: 31,
          purok10: 25,
          purok11: 20,
          total: 200,
        },
        Goat: {
          purok1: 67,
          purok2: 56,
          purok3: 61,
          purok4: 46,
          purok10: 37,
          purok11: 28,
          total: 295,
        },
        Cattle: {
          purok1: 39,
          purok2: 33,
          purok3: 36,
          purok4: 27,
          purok10: 22,
          purok11: 18,
          total: 175,
        },
      },
    },
  };

  const initCharts = () => {
    // Detect theme for chart colors
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#E4E6EB" : "#050505";
    const tooltipBg = isDark ? "#1e1e1e" : "#FFFFFF";
    const tooltipBorder = isDark ? "#333333" : "#E4E6EB";

    const genderChart = echarts.init(document.getElementById("genderChart"));
    const genderOption = {
      animation: true,
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
      },
      legend: {
        top: "5%",
        left: "center",
        textStyle: { color: textColor },
      },
      series: [
        {
          name: "Gender Distribution",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "60%"],
          data: [
            {
              value: dashboardData.genderData.maleFarmers,
              name: "Male Farmers",
              itemStyle: { color: "#10b981" },
            },
            {
              value: dashboardData.genderData.femaleFarmers,
              name: "Female Farmers",
              itemStyle: { color: "#34d399" },
            },
            {
              value: dashboardData.genderData.maleFisherfolks,
              name: "Male Fisherfolks",
              itemStyle: { color: "#3b82f6" },
            },
            {
              value: dashboardData.genderData.femaleFisherfolks,
              name: "Female Fisherfolks",
              itemStyle: { color: "#06b6d4" },
            },
          ],
          label: {
            show: true,
            color: textColor,
            fontSize: 16,
            fontWeight: "bold",
            textBorderColor: "transparent",
            textBorderWidth: 0,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
      backgroundColor: "transparent",
    };
    genderChart.setOption(genderOption);

    const productionChart = echarts.init(
      document.getElementById("productionChart")
    );
    
    // Prepare data from productionByArea
    const areas = Object.keys(dashboardData.productionByArea);
    const cropsCounts = areas.map(area => dashboardData.productionByArea[area].crops);
    const animalsCounts = areas.map(area => dashboardData.productionByArea[area].animals);
    
    const productionOption = {
      animation: true,
      tooltip: {
        trigger: "axis",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
      },
      legend: {
        data: ["Crops", "Animals"],
        textStyle: { color: textColor },
        top: "5%",
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: areas.length > 0 ? areas : ["No Data"],
        axisLabel: { color: textColor, fontSize: 12 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: textColor },
        nameTextStyle: { color: textColor },
      },
      series: [
        {
          name: "Crops",
          type: "bar",
          data: cropsCounts.length > 0 ? cropsCounts : [0],
          itemStyle: { color: "#10b981" },
        },
        {
          name: "Animals",
          type: "bar",
          data: animalsCounts.length > 0 ? animalsCounts : [0],
          itemStyle: { color: "#f59e0b" },
        },
      ],
      backgroundColor: "transparent",
    };
    productionChart.setOption(productionOption);
    productionChart.on("click", function (params) {
      if (params.seriesName === "Crops") {
        setSelectedArea(params.name);
        setModalType("crops");
      } else if (params.seriesName === "Animals") {
        setSelectedArea(params.name);
        setModalType("animals");
      }
    });

    const registrationChart = echarts.init(
      document.getElementById("registrationChart")
    );
    const registrationOption = {
      animation: true,
      tooltip: {
        trigger: "axis",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
      },
      legend: {
        data: ["Farmers", "Fisherfolks"],
        textStyle: { color: textColor },
        top: "5%",
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: textColor },
      },
      series: [
        {
          name: "Farmers",
          type: "line",
          data: dashboardData.monthlyData.farmers,
          smooth: true,
          itemStyle: { color: "#10b981" },
          lineStyle: { color: "#10b981", width: 3 },
        },
        {
          name: "Fisherfolks",
          type: "line",
          data: dashboardData.monthlyData.fisherfolks,
          smooth: true,
          itemStyle: { color: "#3b82f6" },
          lineStyle: { color: "#3b82f6", width: 3 },
        },
      ],
      backgroundColor: "transparent",
    };
    registrationChart.setOption(registrationOption);

    const cropsChart = echarts.init(document.getElementById("cropsChart"));
    
    // Prepare real data for crops chart
    const cropsData = dashboardData.cropsDataByPurok;
    const cropTypes = Object.keys(cropsData);
    
    // Get unique puroks across all crops
    const allPuroks = new Set();
    cropTypes.forEach(cropType => {
      Object.keys(cropsData[cropType]).forEach(purok => allPuroks.add(purok));
    });
    const purokList = Array.from(allPuroks).sort();
    
    // Get top 5 crops by total count - reversed for top to bottom display
    const cropTotals = cropTypes.map(cropType => ({
      name: cropType,
      total: Object.values(cropsData[cropType]).reduce((sum, val) => sum + val, 0)
    })).sort((a, b) => b.total - a.total).slice(0, 5);
    
    const topCropNames = cropTotals.map(c => c.name).reverse();
    
    // Calculate total production per purok and sort by highest first
    const purokTotals = purokList.map(purok => ({
      purok,
      total: topCropNames.reduce((sum, cropName) => sum + (cropsData[cropName]?.[purok] || 0), 0)
    })).sort((a, b) => b.total - a.total);
    
    const sortedPurokList = purokTotals.map(p => p.purok);
    
    // Build series for each purok
    const cropsSeries = sortedPurokList.map((purok, idx) => {
      const colors = [
        "#052e16", "#14532d", "#166534", "#15803d", "#16a34a",
        "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#d9f99d", "#ecfccb"
      ];
      
      return {
        name: purok,
        type: "bar",
        stack: "total",
        data: topCropNames.map(cropName => cropsData[cropName]?.[purok] || 0),
        itemStyle: { color: colors[idx % colors.length] }
      };
    });
    
    const cropsOption = {
      animation: true,
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
        formatter: function (params) {
          return `${params.seriesName}: ${params.value}<br/>${params.name}`;
        },
      },
      legend: {
        data: sortedPurokList,
        textStyle: { color: textColor },
        type: "scroll",
        top: "3%",
      },
      grid: {
        left: "15%",
        right: "10%",
        top: "15%",
        bottom: "10%",
        containLabel: false,
      },
      xAxis: {
        type: "value",
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: "category",
        data: topCropNames.length > 0 ? topCropNames : ["No Data"],
        axisLabel: { color: textColor },
        inverse: false,
      },
      series: cropsSeries.length > 0 ? cropsSeries : [{
        name: "No Data",
        type: "bar",
        data: [0]
      }],
      backgroundColor: "transparent",
    };
    cropsChart.setOption(cropsOption);

    const animalsChart = echarts.init(document.getElementById("animalsChart"));
    
    // Prepare real data for animals chart
    const animalsData = dashboardData.animalsDataByPurok;
    const animalTypes = Object.keys(animalsData);
    const allAnimalPuroks = new Set();
    animalTypes.forEach(animalType => {
      Object.keys(animalsData[animalType]).forEach(purok => allAnimalPuroks.add(purok));
    });
    const animalPurokList = Array.from(allAnimalPuroks).sort();
    const animalTotals = animalTypes.map(animalType => ({
      name: animalType,
      total: Object.values(animalsData[animalType]).reduce((sum, val) => sum + val, 0)
    })).sort((a, b) => b.total - a.total).slice(0, 5);
    const topAnimalNames = animalTotals.map(a => a.name).reverse();
    
    // Calculate total population per purok and sort by highest first
    const animalPurokTotals = animalPurokList.map(purok => ({
      purok,
      total: topAnimalNames.reduce((sum, animalName) => sum + (animalsData[animalName]?.[purok] || 0), 0)
    })).sort((a, b) => b.total - a.total);
    
    const sortedAnimalPurokList = animalPurokTotals.map(p => p.purok);
    
    // Build series for each purok (orange color scheme)
    const animalsSeries = sortedAnimalPurokList.map((purok, idx) => {
      const colors = [
        "#431407", "#7c2d12", "#9a3412", "#c2410c", "#ea580c",
        "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5", "#fff7ed"
      ];
      
      return {
        name: purok,
        type: "bar",
        stack: "total",
        data: topAnimalNames.map(animalName => animalsData[animalName]?.[purok] || 0),
        itemStyle: { color: colors[idx % colors.length] }
      };
    });
    
    const animalsOption = {
      animation: true,
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
        formatter: function (params) {
          return `${params.seriesName}: ${params.value} heads<br/>${params.name}`;
        },
      },
      legend: {
        data: sortedAnimalPurokList,
        textStyle: { color: textColor },
        type: "scroll",
        top: "3%",
      },
      grid: {
        left: "15%",
        right: "10%",
        top: "15%",
        bottom: "10%",
        containLabel: false,
      },
      xAxis: {
        type: "value",
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: "category",
        data: topAnimalNames.length > 0 ? topAnimalNames : ["No Data"],
        axisLabel: { color: textColor },
      },
      series: animalsSeries.length > 0 ? animalsSeries : [{
        name: "No Data",
        type: "bar",
        data: [0]
      }],
      backgroundColor: "transparent",
    };
    animalsChart.setOption(animalsOption);

    // Resize handler
    const handleResize = () => {
      genderChart.resize();
      productionChart.resize();
      registrationChart.resize();
      cropsChart.resize();
      animalsChart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      genderChart.dispose();
      productionChart.dispose();
      registrationChart.dispose();
      cropsChart.dispose();
      animalsChart.dispose();
    };
  };
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Farmers
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {dashboardData.loading ? '...' : dashboardData.totalFarmers.toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Active registrants
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Fisherfolks
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {dashboardData.loading ? '...' : dashboardData.totalFisherfolks.toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Active registrants
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-900/30 flex items-center justify-center">
                <span className="text-2xl">🐟</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Crops</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {dashboardData.loading ? '...' : dashboardData.totalCrops.toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered crops
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-900/30 flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Animals
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {dashboardData.loading ? '...' : dashboardData.totalAnimals.toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Total head count
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-900/30 flex items-center justify-center">
                <span className="text-2xl">🐄</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2 Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Registry Distribution by Gender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="genderChart" className="h-80 w-full"></div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Production by Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="productionChart" className="h-80 w-full"></div>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart - Monthly Registration Trend */}
      <Card className="bg-card text-card-foreground border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg">
              Monthly Registration Trend
            </CardTitle>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1 bg-[#252525] border border-[#3B3B3B] rounded-md text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dashboardData.availableYears?.length > 0 ? (
                dashboardData.availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div id="registrationChart" className="h-80 w-full"></div>
        </CardContent>
      </Card>

      {/* 3 Column Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Puroks */}
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Top 5 Puroks (Registrants)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.topPuroks.length > 0 ? (
                dashboardData.topPuroks.map((purok, index) => {
                  // Calculate percentage based on max count
                  const maxCount = dashboardData.topPuroks[0]?.count || 1;
                  const percent = Math.round((purok.count / maxCount) * 100);
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{purok.name}</span>
                        <span className="text-muted-foreground">{purok.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">No purok data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Crops Chart */}
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Top Crops Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="cropsChart" className="h-80 w-full"></div>
          </CardContent>
        </Card>

        {/* Top Animals Chart */}
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Top Animals Population
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="animalsChart" className="h-80 w-full"></div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Tables by Barangay - Replace the existing grid with these two cards */}
      <div className="space-y-6">
        {/* Crops Production Summary */}
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Crops Production Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scroll-smooth rounded-md border-0" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(156 163 175) transparent'
            }}>
              <style>{`
                .overflow-x-auto::-webkit-scrollbar {
                  height: 8px;
                }
                .overflow-x-auto::-webkit-scrollbar-track {
                  background: transparent;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb {
                  background: rgb(156 163 175);
                  border-radius: 4px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                  background: rgb(107 114 128);
                }
              `}</style>
              <Table>
                <TableHeader className="bg-muted">
                  {(() => {
                    // Extract all unique "other" crop names from all barangays
                    const allOtherCrops = new Set();
                    Object.values(dashboardData.productionSummary || {}).forEach(summary => {
                      if (summary.crops && summary.crops.others) {
                        Object.keys(summary.crops.others).forEach(cropName => allOtherCrops.add(cropName));
                      }
                    });
                    const sortedOtherCrops = Array.from(allOtherCrops).sort();
                    
                    return (
                      <>
                        <TableRow>
                          <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 min-w-[200px] h-12">
                            Barangay
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-12"
                            colSpan="4"
                          >
                            Rice
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-12"
                            colSpan="4"
                          >
                            Corn
                          </TableHead>
                          {sortedOtherCrops.map(cropName => (
                            <TableHead
                              key={cropName}
                              className="text-muted-foreground text-center border-l border-r border-border min-w-[180px] h-12"
                              colSpan="2"
                            >
                              {cropName}
                            </TableHead>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 h-10"></TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-10 min-w-[100px]"
                            colSpan="2"
                          >
                            Irrigated
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-10 min-w-[100px]"
                            colSpan="2"
                          >
                            Rainfed
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-10 min-w-[100px]"
                            colSpan="2"
                          >
                            Yellow
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-r border-border h-10 min-w-[100px]"
                            colSpan="2"
                          >
                            White
                          </TableHead>
                          {sortedOtherCrops.map(cropName => (
                            <React.Fragment key={`sub-${cropName}`}>
                              <TableHead className="text-muted-foreground text-center h-10 border-l border-border"></TableHead>
                              <TableHead className="text-muted-foreground text-center h-10 border-r border-border"></TableHead>
                            </React.Fragment>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 h-10"></TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium h-10">
                            ha
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium border-r border-border h-10">
                            prd'n
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium h-10">
                            ha
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium border-r border-border h-10">
                            prd'n
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium h-10">
                            ha
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium border-r border-border h-10">
                            prd'n
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium h-10">
                            ha
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center text-sm font-medium border-r border-border h-10">
                            prd'n
                          </TableHead>
                          {sortedOtherCrops.map(cropName => (
                            <React.Fragment key={`unit-${cropName}`}>
                              <TableHead className="text-muted-foreground text-center text-sm font-medium h-10 border-l border-border">
                                ha
                              </TableHead>
                              <TableHead className="text-muted-foreground text-center text-sm font-medium h-10 border-r border-border">
                                prd'n
                              </TableHead>
                            </React.Fragment>
                          ))}
                        </TableRow>
                      </>
                    );
                  })()}
                </TableHeader>
                <TableBody>
                  {(() => {
                    const barangays = Object.keys(dashboardData.productionSummary || {});
                    
                    if (barangays.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={99} className="text-center text-muted-foreground py-10 text-base">
                            No production data available
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    // Extract all unique "other" crop names
                    const allOtherCrops = new Set();
                    Object.values(dashboardData.productionSummary || {}).forEach(summary => {
                      if (summary.crops && summary.crops.others) {
                        Object.keys(summary.crops.others).forEach(cropName => allOtherCrops.add(cropName));
                      }
                    });
                    const sortedOtherCrops = Array.from(allOtherCrops).sort();
                    
                    // Initialize totals
                    let totalRiceIrrigatedHa = 0;
                    let totalRiceIrrigatedCount = 0;
                    let totalRiceRainfedHa = 0;
                    let totalRiceRainfedCount = 0;
                    let totalCornYellowHa = 0;
                    let totalCornYellowCount = 0;
                    let totalCornWhiteHa = 0;
                    let totalCornWhiteCount = 0;
                    const totalOtherCrops = {};
                    sortedOtherCrops.forEach(cropName => {
                      totalOtherCrops[cropName] = { ha: 0, production: 0 };
                    });
                    
                    const rows = barangays.map((barangay, idx) => {
                      const data = dashboardData.productionSummary[barangay];
                      
                      // Rice Irrigated
                      const riceIrrigatedHa = data.crops.rice.irrigated.area || 0;
                      const riceIrrigatedProduction = (riceIrrigatedHa * 4).toFixed(1);
                      
                      // Rice Rainfed
                      const riceRainfedHa = data.crops.rice.rainfed.area || 0;
                      const riceRainfedProduction = (riceRainfedHa * 4).toFixed(1);
                      
                      // Corn Yellow
                      const cornYellowHa = data.crops.corn.yellow.area || 0;
                      const cornYellowProduction = (cornYellowHa * 4).toFixed(1);
                      
                      // Corn White
                      const cornWhiteHa = data.crops.corn.white.area || 0;
                      const cornWhiteProduction = (cornWhiteHa * 4).toFixed(1);
                      
                      // Update totals
                      totalRiceIrrigatedHa += riceIrrigatedHa;
                      totalRiceIrrigatedCount += riceIrrigatedHa * 4;
                      totalRiceRainfedHa += riceRainfedHa;
                      totalRiceRainfedCount += riceRainfedHa * 4;
                      totalCornYellowHa += cornYellowHa;
                      totalCornYellowCount += cornYellowHa * 4;
                      totalCornWhiteHa += cornWhiteHa;
                      totalCornWhiteCount += cornWhiteHa * 4;
                      
                      return (
                        <TableRow key={idx} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="text-foreground sticky left-0 bg-card font-medium py-4 px-4 text-sm">
                            {barangay}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm">
                            {riceIrrigatedHa.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center border-r border-border py-4 px-4 text-sm">
                            {riceIrrigatedProduction}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm">
                            {riceRainfedHa.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center border-r border-border py-4 px-4 text-sm">
                            {riceRainfedProduction}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm">
                            {cornYellowHa.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center border-r border-border py-4 px-4 text-sm">
                            {cornYellowProduction}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm">
                            {cornWhiteHa.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-center border-r border-border py-4 px-4 text-sm">
                            {cornWhiteProduction}
                          </TableCell>
                          {sortedOtherCrops.map(cropName => {
                            const cropData = data.crops.others?.[cropName] || { area: 0 };
                            const ha = cropData.area || 0;
                            const production = (ha * 4).toFixed(1);
                            
                            // Update totals
                            totalOtherCrops[cropName].ha += ha;
                            totalOtherCrops[cropName].production += ha * 4;
                            
                            return (
                              <React.Fragment key={`${barangay}-${cropName}`}>
                                <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm border-l border-border">
                                  {ha > 0 ? ha.toFixed(1) : '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-center py-4 px-4 text-sm border-r border-border">
                                  {ha > 0 ? production : '-'}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                        </TableRow>
                      );
                    });
                    
                    // Add total row
                    rows.push(
                      <TableRow key="total" className="border-t-2 border-blue-500 bg-muted/30">
                        <TableCell className="text-foreground font-bold sticky left-0 bg-muted py-4 px-4 text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm">
                          {totalRiceIrrigatedHa.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center border-r border-border py-4 px-4 text-sm">
                          {totalRiceIrrigatedCount.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm">
                          {totalRiceRainfedHa.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center border-r border-border py-4 px-4 text-sm">
                          {totalRiceRainfedCount.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm">
                          {totalCornYellowHa.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center border-r border-border py-4 px-4 text-sm">
                          {totalCornYellowCount.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm">
                          {totalCornWhiteHa.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold text-center border-r border-border py-4 px-4 text-sm">
                          {totalCornWhiteCount.toFixed(1)}
                        </TableCell>
                        {sortedOtherCrops.map(cropName => (
                          <React.Fragment key={`total-${cropName}`}>
                            <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm border-l border-border">
                              {totalOtherCrops[cropName].ha.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-foreground font-bold text-center py-4 px-4 text-sm border-r border-border">
                              {totalOtherCrops[cropName].production.toFixed(1)}
                            </TableCell>
                          </React.Fragment>
                        ))}
                      </TableRow>
                    );
                    
                    return rows;
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Livestock & Poultry Summary */}
        <Card className="bg-card text-card-foreground border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">
              Livestock & Poultry Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border-0">
              <Table>
                <TableHeader className="bg-muted">
                  {(() => {
                    // Extract all unique livestock and poultry names
                    const allLivestock = new Set();
                    const allPoultry = new Set();
                    
                    Object.values(dashboardData.productionSummary || {}).forEach(summary => {
                       if (summary.livestock) {
                         Object.keys(summary.livestock).forEach(name => allLivestock.add(name));
                       }
                       if (summary.poultry) {
                         Object.keys(summary.poultry).forEach(name => allPoultry.add(name));
                       }
                    });
                    
                    const sortedLivestock = Array.from(allLivestock).sort();
                    const sortedPoultry = Array.from(allPoultry).sort();
                    
                    // Allow outer scope access
                    // Note: In React render scope, we can't easily export variables to siblings without context or recalculating
                    // So we'll recalculate in the second row rendering or separate this logic if possible.
                    // For now, simpler to duplicate the set extraction for clean JSX structure
                    
                    return (
                      <>
                        <TableRow>
                          <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 min-w-[150px]">
                            Barangay
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-l border-border"
                            colSpan={sortedLivestock.length || 1}
                          >
                            Livestock
                          </TableHead>
                          <TableHead
                            className="text-muted-foreground text-center border-l border-border"
                            colSpan={sortedPoultry.length || 1}
                          >
                            Poultry
                          </TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10"></TableHead>
                          {sortedLivestock.length > 0 ? (
                            sortedLivestock.map(name => (
                              <TableHead key={`l-${name}`} className="text-muted-foreground text-center border-l border-border px-4 min-w-[100px]">
                                {name}
                              </TableHead>
                            ))
                          ) : (
                             <TableHead className="text-muted-foreground text-center border-l border-border">No Data</TableHead>
                          )}
                          
                          {sortedPoultry.length > 0 ? (
                            sortedPoultry.map(name => (
                              <TableHead key={`p-${name}`} className="text-muted-foreground text-center border-l border-border px-4 min-w-[100px]">
                                {name}
                              </TableHead>
                            ))
                          ) : (
                             <TableHead className="text-muted-foreground text-center border-l border-border">No Data</TableHead>
                          )}
                        </TableRow>
                      </>
                    );
                  })()}
                </TableHeader>
                <TableBody>
                  {(() => {
                    const barangays = Object.keys(dashboardData.productionSummary || {}).sort();
                    
                    if (barangays.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                            No livestock or poultry data available
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Recalculate column headers for row mapping
                    const allLivestock = new Set();
                    const allPoultry = new Set();
                    Object.values(dashboardData.productionSummary || {}).forEach(summary => {
                       if (summary.livestock) Object.keys(summary.livestock).forEach(name => allLivestock.add(name));
                       if (summary.poultry) Object.keys(summary.poultry).forEach(name => allPoultry.add(name));
                    });
                    const sortedLivestock = Array.from(allLivestock).sort();
                    const sortedPoultry = Array.from(allPoultry).sort();
                    
                    // Initialize totals
                    const livestockTotals = {};
                    const poultryTotals = {};
                    sortedLivestock.forEach(name => livestockTotals[name] = 0);
                    sortedPoultry.forEach(name => poultryTotals[name] = 0);
                    
                    const rows = barangays.map((barangay, idx) => {
                      const data = dashboardData.productionSummary[barangay];
                      
                      return (
                        <TableRow key={idx} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <TableCell className="text-foreground sticky left-0 bg-card font-medium">
                            {barangay}
                          </TableCell>
                          
                          {/* Livestock Columns */}
                          {sortedLivestock.length > 0 ? (
                            sortedLivestock.map(name => {
                              const count = data.livestock[name] || 0;
                              livestockTotals[name] += count;
                              return (
                                <TableCell key={`l-${name}`} className="text-muted-foreground text-center border-l border-border">
                                  {count > 0 ? count.toLocaleString() : '-'}
                                </TableCell>
                              );
                            })
                          ) : (
                            <TableCell className="text-center">-</TableCell>
                          )}
                          
                          {/* Poultry Columns */}
                          {sortedPoultry.length > 0 ? (
                            sortedPoultry.map(name => {
                              const count = data.poultry[name] || 0;
                              poultryTotals[name] += count; // Accumulate totals
                              return (
                                <TableCell key={`p-${name}`} className="text-muted-foreground text-center border-l border-border">
                                  {count > 0 ? count.toLocaleString() : '-'}
                                </TableCell>
                              );
                            })
                          ) : (
                             <TableCell className="text-center">-</TableCell>
                          )}
                        </TableRow>
                      );
                    });
                    
                    // Add total row
                    rows.push(
                      <TableRow key="total" className="border-t-2 border-orange-500 bg-muted/30">
                        <TableCell className="text-foreground font-bold sticky left-0 bg-card/0">
                          Total
                        </TableCell>
                        
                        {/* Livestock Totals */}
                        {sortedLivestock.length > 0 ? (
                            sortedLivestock.map(name => (
                              <TableCell key={`l-${name}`} className="text-foreground font-bold text-center border-l border-border">
                                {livestockTotals[name] > 0 ? livestockTotals[name].toLocaleString() : '-'}
                              </TableCell>
                            ))
                        ) : (
                            <TableCell className="text-center border-l border-border">-</TableCell>
                        )}
                        
                         {/* Poultry Totals */}
                         {sortedPoultry.length > 0 ? (
                            sortedPoultry.map(name => (
                              <TableCell key={`p-${name}`} className="text-foreground font-bold text-center border-l border-border">
                                {poultryTotals[name] > 0 ? poultryTotals[name].toLocaleString() : '-'}
                              </TableCell>
                            ))
                        ) : (
                            <TableCell className="text-center border-l border-border">-</TableCell>
                        )}
                      </TableRow>
                    );
                    
                    return rows;
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal for Production Details */}
        {selectedArea && modalType && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
            <div className="bg-card text-card-foreground p-8 rounded-2xl w-full max-w-5xl shadow-2xl transform transition-all duration-300 scale-100">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
                <h2 className="text-2xl font-bold text-foreground">
                  {modalType === "crops"
                    ? "🌾 Crops Production"
                    : "🐄 Animal Population"}{" "}
                  – {selectedArea}
                </h2>
                <button
                  onClick={() => {
                    setSelectedArea(null);
                    setModalType(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border-0">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-muted-foreground">
                        {modalType === "crops" ? "Crop Type" : "Animal Type"}
                      </th>
                      {(() => {
                        const areaData = dashboardData.detailedProductionData[selectedArea];
                        if (!areaData) return null;
                        const data = modalType === "crops" ? areaData.crops : areaData.animals;
                        
                        // Collect ALL unique puroks across all crops/animals
                        const allPuroks = new Set();
                        Object.values(data).forEach(purokData => {
                          Object.keys(purokData).forEach(purok => allPuroks.add(purok));
                        });
                        const purokList = Array.from(allPuroks).sort();
                        
                        return purokList.map((purok, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left text-muted-foreground"
                          >
                            {purok}
                          </th>
                        ));
                      })()}
                      <th className="px-4 py-3 text-left text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const areaData = dashboardData.detailedProductionData[selectedArea];
                      if (!areaData) return null;
                      const data = modalType === "crops" ? areaData.crops : areaData.animals;
                      
                      // Collect ALL unique puroks across all crops/animals (same as header)
                      const allPuroks = new Set();
                      Object.values(data).forEach(purokData => {
                        Object.keys(purokData).forEach(purok => allPuroks.add(purok));
                      });
                      const purokList = Array.from(allPuroks).sort();
                      
                      return Object.entries(data).map(([name, values], idx) => {
                        const total = Object.values(values).reduce((sum, val) => sum + val, 0);
                        return (
                          <tr
                            key={idx}
                            className={`border-t border-border ${
                              idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                            } hover:bg-muted/20 transition-colors`}
                          >
                            <td className="px-4 py-3 text-foreground font-medium">
                              {name}
                            </td>
                            {/* Display value for each purok in the correct column */}
                            {purokList.map((purok) => (
                              <td key={purok} className="px-4 py-3 text-muted-foreground">
                                {values[purok] || 0}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-foreground font-bold">
                              {total}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedArea(null);
                    setModalType(null);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-md text-white font-medium shadow-md transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;