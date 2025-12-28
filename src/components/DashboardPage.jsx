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
          productionByArea[barangay].animals++;
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
          productionByArea[barangay].animals++;
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
    const cropsData = areas.map(area => dashboardData.productionByArea[area].crops);
    const animalsData = areas.map(area => dashboardData.productionByArea[area].animals);
    
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
          data: cropsData.length > 0 ? cropsData : [0],
          itemStyle: { color: "#10b981" },
        },
        {
          name: "Animals",
          type: "bar",
          data: animalsData.length > 0 ? animalsData : [0],
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
    const cropsOption = {
      animation: true,
      tooltip: {
        trigger: "item",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textColor },
        formatter: function (params) {
          return `${params.seriesName}: ${params.value} tons\n${params.name}`;
        },
      },
      legend: {
        data: [
          "Purok 1",
          "Purok 2",
          "Purok 3",
          "Purok 4",
          "Purok 5",
          "Purok 6",
          "Purok 7",
          "Purok 8",
          "Purok 9",
          "Purok 10",
          "Purok 11",
        ],
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
        data: ["Vegetables", "Banana", "Coconut", "Corn", "Rice"],
        axisLabel: { color: textColor },
        inverse: false, // Bottom to top
      },
      series: [
        {
          name: "Purok 1",
          type: "bar",
          stack: "total",
          data: [21, 34, 56, 78, 145],
          itemStyle: { color: "#052e16" },
        },
        {
          name: "Purok 2",
          type: "bar",
          stack: "total",
          data: [18, 29, 48, 65, 123],
          itemStyle: { color: "#14532d" },
        },
        {
          name: "Purok 3",
          type: "bar",
          stack: "total",
          data: [19, 31, 52, 72, 134],
          itemStyle: { color: "#166534" },
        },
        {
          name: "Purok 4",
          type: "bar",
          stack: "total",
          data: [15, 23, 39, 54, 109],
          itemStyle: { color: "#15803d" },
        },
        {
          name: "Purok 5",
          type: "bar",
          stack: "total",
          data: [18, 23, 45, 89, 134],
          itemStyle: { color: "#16a34a" },
        },
        {
          name: "Purok 6",
          type: "bar",
          stack: "total",
          data: [15, 19, 38, 67, 98],
          itemStyle: { color: "#22c55e" },
        },
        {
          name: "Purok 7",
          type: "bar",
          stack: "total",
          data: [12, 15, 29, 54, 87],
          itemStyle: { color: "#4ade80" },
        },
        {
          name: "Purok 8",
          type: "bar",
          stack: "total",
          data: [9, 12, 21, 43, 76],
          itemStyle: { color: "#86efac" },
        },
        {
          name: "Purok 9",
          type: "bar",
          stack: "total",
          data: [6, 8, 17, 32, 65],
          itemStyle: { color: "#bbf7d0" },
        },
        {
          name: "Purok 10",
          type: "bar",
          stack: "total",
          data: [12, 18, 31, 43, 87],
          itemStyle: { color: "#d9f99d" },
        },
        {
          name: "Purok 11",
          type: "bar",
          stack: "total",
          data: [9, 15, 24, 32, 68],
          itemStyle: { color: "#ecfccb" },
        },
      ],
      backgroundColor: "transparent",
    };
    cropsChart.setOption(cropsOption);

    const animalsChart = echarts.init(document.getElementById("animalsChart"));
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
        data: [
          "Purok 1",
          "Purok 2",
          "Purok 3",
          "Purok 4",
          "Purok 5",
          "Purok 6",
          "Purok 7",
          "Purok 8",
          "Purok 9",
          "Purok 10",
          "Purok 11",
        ],
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
        data: ["Cattle", "Carabao", "Goat", "Swine", "Chicken"],
        axisLabel: { color: textColor },
      },
      series: [
        {
          name: "Purok 1",
          type: "bar",
          stack: "total",
          data: [39, 45, 67, 156, 567],
          itemStyle: { color: "#431407" },
        },
        {
          name: "Purok 2",
          type: "bar",
          stack: "total",
          data: [33, 38, 56, 134, 489],
          itemStyle: { color: "#7c2d12" },
        },
        {
          name: "Purok 3",
          type: "bar",
          stack: "total",
          data: [36, 41, 61, 145, 523],
          itemStyle: { color: "#9a3412" },
        },
        {
          name: "Purok 4",
          type: "bar",
          stack: "total",
          data: [27, 31, 46, 109, 398],
          itemStyle: { color: "#c2410c" },
        },
        {
          name: "Purok 5",
          type: "bar",
          stack: "total",
          data: [28, 34, 45, 123, 456],
          itemStyle: { color: "#ea580c" },
        },
        {
          name: "Purok 6",
          type: "bar",
          stack: "total",
          data: [23, 28, 38, 98, 389],
          itemStyle: { color: "#f97316" },
        },
        {
          name: "Purok 7",
          type: "bar",
          stack: "total",
          data: [19, 23, 31, 87, 298],
          itemStyle: { color: "#fb923c" },
        },
        {
          name: "Purok 8",
          type: "bar",
          stack: "total",
          data: [15, 19, 25, 65, 234],
          itemStyle: { color: "#fdba74" },
        },
        {
          name: "Purok 9",
          type: "bar",
          stack: "total",
          data: [12, 15, 18, 54, 178],
          itemStyle: { color: "#fed7aa" },
        },
        {
          name: "Purok 10",
          type: "bar",
          stack: "total",
          data: [22, 25, 37, 87, 289],
          itemStyle: { color: "#ffedd5" },
        },
        {
          name: "Purok 11",
          type: "bar",
          stack: "total",
          data: [18, 20, 28, 69, 234],
          itemStyle: { color: "#fff7ed" },
        },
      ],
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
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
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
            <div className="overflow-x-auto rounded-md border-0">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 min-w-[50px]">
                      Barangay
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="4"
                    >
                      Rice
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="4"
                    >
                      Corn
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center"
                      colSpan="2"
                    >
                      Others
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10"></TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="2"
                    >
                      Irrigated
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="2"
                    >
                      Rainfed
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="2"
                    >
                      Yellow
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="2"
                    >
                      White
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center"></TableHead>
                    <TableHead className="text-muted-foreground text-center"></TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10"></TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      ha
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs border-r border-border">
                      prd'n
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      ha
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs border-r border-border">
                      prd'n
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      ha
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs border-r border-border">
                      prd'n
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      ha
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs border-r border-border">
                      prd'n
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      ha
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center text-xs">
                      prd'n
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="text-foreground sticky left-0 bg-card font-medium">
                      Upper
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      312.7
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      1,234.8
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      189.4
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      678.9
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      167.2
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      389.5
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      100.6
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      222.8
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      298.1
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      387.6
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="text-foreground sticky left-0 bg-card font-medium">
                      Lower
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      245.5
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      982.1
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      156.8
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      548.2
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      123.8
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      298.3
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      65.5
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      158.4
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      234.2
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      298.5
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 border-blue-500 bg-muted/30">
                    <TableCell className="text-foreground font-bold sticky left-0 bg-card/0">
                      Total
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      558.2
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center border-r border-border">
                      2,216.9
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      346.2
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center border-r border-border">
                      1,227.1
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      291.0
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center border-r border-border">
                      687.8
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      166.1
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center border-r border-border">
                      381.2
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      532.3
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      686.1
                    </TableCell>
                  </TableRow>
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
                  <TableRow>
                    <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10 min-w-[50px]">
                      Barangay
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center border-r border-border"
                      colSpan="3"
                    >
                      Livestock
                    </TableHead>
                    <TableHead
                      className="text-muted-foreground text-center"
                      colSpan="3"
                    >
                      Poultry
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-muted-foreground sticky left-0 bg-muted z-10"></TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Cow
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Pig
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center border-r border-border">
                      Others
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Chicken
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Duck
                    </TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Others
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="text-foreground sticky left-0 bg-card font-medium">
                      Upper
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      332
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      785
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      433
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      1,481
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      89
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      67
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="text-foreground sticky left-0 bg-card font-medium">
                      Lower
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      475
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      1,091
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center border-r border-border">
                      495
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      1,764
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      134
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      98
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 border-orange-500 bg-muted/30">
                    <TableCell className="text-foreground font-bold sticky left-0 bg-card/0">
                      Total
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      807
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      1,876
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center border-r border-border">
                      928
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      3,245
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      223
                    </TableCell>
                    <TableCell className="text-foreground font-bold text-center">
                      165
                    </TableCell>
                  </TableRow>
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