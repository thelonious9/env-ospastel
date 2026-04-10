// Register the datalabels plugin
Chart.register(ChartDataLabels);

let allData = [];
const dashboardContent = document.getElementById('dashboard-content');
const depFilter = document.getElementById('dep-filter');
const timeFilter = document.getElementById('time-filter');

const colors = [
    '#58a6ff', // Blue
    '#bc8cff', // Purple
    '#3fb950', // Green
    '#f85149', // Red
    '#d29922', // Orange
    '#1f6feb', // Dark Blue
    '#8957e5', // Dark Purple
    '#238636', // Dark Green
    '#da3633', // Dark Red
    '#9e6a03'  // Dark Orange
];

async function init() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();
        
        // Populate dependency filter
        const deps = [...new Set(allData.map(d => d.dependencia))].sort();
        deps.forEach(dep => {
            const option = document.createElement('option');
            option.value = dep;
            option.textContent = dep;
            depFilter.appendChild(option);
        });

        // Populate time periods filter
        // We create a sortable string "YYYY-Q" for sorting, then map back to labels
        const timePeriods = [...new Set(allData.map(d => `${d.year}-${d.trimestre}`))].sort().reverse();
        
        timePeriods.forEach(period => {
            const [year, tri] = period.split('-');
            const option = document.createElement('option');
            option.value = period;
            option.textContent = `T${tri} ${year}`;
            timeFilter.appendChild(option);
        });

        // Initial render
        renderDashboard();

        // Filter events
        depFilter.addEventListener('change', renderDashboard);
        timeFilter.addEventListener('change', renderDashboard);

    } catch (error) {
        console.error('Error loading data:', error);
        dashboardContent.innerHTML = '<div class="empty-state">Error al cargar datos. Asegúrate de que data.json existe.</div>';
    }
}

function renderDashboard() {
    const selectedDep = depFilter.value;
    const selectedTime = timeFilter.value;

    let filteredData = allData;

    // Apply Dependency Filter
    if (selectedDep !== 'all') {
        filteredData = filteredData.filter(d => d.dependencia === selectedDep);
    }

    // Apply Time Filter (Year-Trimestre)
    if (selectedTime !== 'all') {
        const [year, tri] = selectedTime.split('-').map(Number);
        filteredData = filteredData.filter(d => d.year === year && d.trimestre === tri);
    }

    dashboardContent.innerHTML = '';

    if (filteredData.length === 0) {
        dashboardContent.innerHTML = '<div class="empty-state">No hay datos para esta combinación de filtros.</div>';
        return;
    }

    // Group by Year+Quarter and then by Dependencia + Month
    const grouped = {};
    filteredData.forEach(d => {
        const periodKey = `${d.year}-T${d.trimestre}`;
        if (!grouped[periodKey]) grouped[periodKey] = {};
        const key = `${d.dependencia}|${d.mes_nombre}`;
        if (!grouped[periodKey][key]) grouped[periodKey][key] = [];
        grouped[periodKey][key].push(d);
    });

    // Sort periods descending (most recent first)
    const sortedPeriods = Object.keys(grouped).sort().reverse();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    sortedPeriods.forEach(periodKey => {
        const qSection = document.createElement('section');
        qSection.className = 'quarter-section';
        
        // Display nice title (e.g. "Trimestre 2 2026")
        const [year, triLabel] = periodKey.split('-');
        const qTitle = document.createElement('h2');
        qTitle.className = 'quarter-title';
        qTitle.innerHTML = `Trimestre ${triLabel.substring(1)} ${year}`;
        qSection.appendChild(qTitle);

        const chartsGrid = document.createElement('div');
        chartsGrid.className = 'charts-grid';
        
        // Sort keys by month index, then by dependency name
        const sortedKeys = Object.keys(grouped[periodKey]).sort((a, b) => {
            const [depA, mesA] = a.split('|');
            const [depB, mesB] = b.split('|');
            
            const monthDiff = monthNames.indexOf(mesA) - monthNames.indexOf(mesB);
            if (monthDiff !== 0) return monthDiff;
            return depA.localeCompare(depB);
        });

        sortedKeys.forEach(key => {
            const [depName, monthName] = key.split('|');
            const card = createChartCard(monthName, grouped[periodKey][key], depName);
            chartsGrid.appendChild(card);
        });

        qSection.appendChild(chartsGrid);
        dashboardContent.appendChild(qSection);
    });
}

function createChartCard(month, data, depName) {
    const card = document.createElement('div');
    card.className = 'chart-card';

    const title = document.createElement('h3');
    title.className = 'chart-title';
    title.innerHTML = `<span class="dep-label">${depName}</span> <span class="title-sep">|</span> ${month}`;
    card.appendChild(title);

    const container = document.createElement('div');
    container.className = 'chart-container';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    card.appendChild(container);

    // Prepare data for chart
    const counts = {};
    data.forEach(d => {
        counts[d.genero] = (counts[d.genero] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#161b22'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#8b949e',
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(0);
                        return `${value}\n(${percentage}%)`;
                    },
                    textAlign: 'center'
                }
            }
        }
    });

    return card;
}

// Start app
init();
