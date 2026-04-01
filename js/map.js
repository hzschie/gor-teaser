// MapLibre GL JS - Open source, cookie-free map library
// Using free OpenStreetMap tiles via CartoDB

// Camp data processing and map initialization
class TirolCampsMap {
    constructor() {
        this.map = null;
        this.popup = null;
        this.campsData = null;
        this.isCollapsed = true;
        
        this.campTypeColors = {
            'Zwangsarbeiterlager': '#e74c3c',
            'Kriegsgefangenenlager': '#3498db', 
            'Umsiedlungslager': '#f39c12',
            'KZ': '#8e44ad',
            'Außenlager': '#27ae60',
            'Anderes Lager': '#95a5a6'
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing TirolCampsMap...');
            await this.loadCampsData();
            console.log('CSV data loaded successfully, features:', this.campsData.features.length);
            this.initMap();
            console.log('Map initialized');
            this.setupEventListeners();
            console.log('Event listeners set up');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }
    
    async loadCampsData() {
        try {
            console.log('Loading CSV data...');
            const response = await fetch('assets/NS_Lager-Österreich-2019-12-02_öffentlich.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            console.log('CSV loaded, size:', csvText.length, 'characters');
            this.campsData = this.parseCSV(csvText);
            console.log('Parsed CSV, found', this.campsData.features.length, 'features');
        } catch (error) {
            console.error('Error loading CSV data:', error);
            throw error;
        }
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const features = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;
            
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            // Filter for all camps with valid coordinates
            if (record['x'] && record['y'] &&
                !isNaN(parseFloat(record['x'])) && 
                !isNaN(parseFloat(record['y']))) {
                
                // Determine camp type
                const campType = this.determineCampType(record);
                if (campType) {
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(record['x']), parseFloat(record['y'])]
                        },
                        properties: {
                            ...record,
                            campType: campType,
                            circleColor: this.campTypeColors[campType] || '#95a5a6'
                        }
                    };
                    features.push(feature);
                }
            }
        }
        
        return {
            type: 'FeatureCollection',
            features: features
        };
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    
    determineCampType(record) {
        if (record['Zwangsarbeiterlager'] === 'J') return 'Zwangsarbeiterlager';
        if (record['Kriegsgefangenenlager'] === 'J') return 'Kriegsgefangenenlager';
        if (record['Umsiedlungslager'] === 'J') return 'Umsiedlungslager';
        if (record['KZ'] === 'J') return 'KZ';
        if (record['Außenlager'] === 'J') return 'Außenlager';
        if (record['Anderes Lager'] === 'J') return 'Anderes Lager';
        return null;
    }
    
    initMap() {
        console.log('Creating MapLibre map...');
        this.map = new maplibregl.Map({
            container: 'mapbox-map',
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [11.4, 47.3], // Centered on Tirol
            zoom: 8,
            pitch: 0,
            scrollZoom: false, // Disabled by default, enabled with Cmd/Ctrl
            attributionControl: false
        });
        
        // Setup cooperative scroll zoom (Cmd/Ctrl + scroll to zoom)
        this.setupCooperativeScrollZoom('mapbox-map');
        
        console.log('Map created, setting up popup...');
        this.popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            className: 'camp-popup'
        });
        
        this.map.on('load', () => {
            console.log('Map loaded successfully');
            this.setMapLanguageToGerman();
            this.addCampsLayer();
            this.setupMapInteractions();
            this.setupZoomControls();
            this.initializeCheckboxIcons();
            this.fitToTirol();
            this.highlightReichenau();
        });
        
        this.map.on('error', (e) => {
            console.error('Mapbox error:', e);
        });
    }
    
    addCampsLayer() {
        console.log('Adding camps layer with', this.campsData.features.length, 'features');
        this.map.addSource('camps', {
            type: 'geojson',
            data: this.campsData
        });
        
        console.log('Source added, adding circle layer...');
        // Add circle layer
        this.map.addLayer({
            id: 'camps-circle',
            type: 'circle',
            source: 'camps',
            paint: {
                'circle-color': ['get', 'circleColor'],
                'circle-radius': [
                    'case',
                    ['==', ['get', 'Bezeichnung'], 'Reichenau'],
                    6,
                    5
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': [
                    'case',
                    ['==', ['get', 'Bezeichnung'], 'Reichenau'],
                    3,
                    1
                ],
                'circle-stroke-color': [
                    'case',
                    ['==', ['get', 'Bezeichnung'], 'Reichenau'],
                    '#2D3C5B',
                    '#ffffff'
                ]
            }
        });
        
        console.log('Circle layer added, adding labels layer...');
        
        // Add labels layer
        this.map.addLayer({
            id: 'camps-labels',
            type: 'symbol',
            source: 'camps',
            minzoom: 9,
            layout: {
                'text-field': ['get', 'Bezeichnung'],
                'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Bold'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 0.8,
                'text-justify': 'auto',
                'text-size': 11
            },
            paint: {
                'text-color': '#2D3C5B',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1
            }
        });
        
        this.updateMapFilter();
    }
    
    setupMapInteractions() {
        // Click handler for markers
        this.map.on('click', 'camps-circle', (e) => {
            e.originalEvent.stopPropagation();
            const feature = e.features[0];
            this.showCampDetails(feature.properties);
            this.showSidebar();

            // Pan to center the selected marker
            this.map.easeTo({
                center: feature.geometry.coordinates,
                duration: 500
            });

            // Always remove any open popup before opening a new one
            if (this.popup) {
                this.popup.remove();
            }
            this.popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: true,
                className: 'camp-popup'
            })
                .setLngLat(feature.geometry.coordinates)
                .setHTML(`<strong>${feature.properties['Bezeichnung']}</strong>`)
                .addTo(this.map);
        });
        
        // Click handler for map background (not on markers)
        this.map.on('click', (e) => {
            // Check if clicked on a marker layer
            const features = this.map.queryRenderedFeatures(e.point, { layers: ['camps-circle'] });
            if (features.length === 0) {
                // Clicked on empty space - reset to default view
                this.resetToDefault();
            }
        });
        
        // Hover effects
        this.map.on('mouseenter', 'camps-circle', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', 'camps-circle', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }
    
    resetToDefault() {
        // Close sidebar
        this.hideSidebar();

        // Fit to Tirol bounds
        this.fitToTirol();

        // Show Reichenau popup
        const reichenauFeature = this.campsData.features.find(f =>
            f.properties['Bezeichnung'] &&
            f.properties['Bezeichnung'].toLowerCase().includes('reichenau')
        );

        if (reichenauFeature) {
            this.showCampDetails(reichenauFeature.properties);
            // Always create a new popup instance for Reichenau
            if (this.popup) {
                this.popup.remove();
            }
            this.popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: true,
                className: 'camp-popup'
            })
                .setLngLat(reichenauFeature.geometry.coordinates)
                .setHTML(`<strong>${reichenauFeature.properties['Bezeichnung']}</strong>`)
                .addTo(this.map);
        }
    }
    
    setupEventListeners() {
        // Checkbox filters
        const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateCheckboxIcon(checkbox);
                this.updateMapFilter();
            });
        });
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('map-sidebar');
        
        sidebarToggle.addEventListener('click', () => {
            if (this.isCollapsed) {
                this.showSidebar();
            } else {
                this.hideSidebar();
            }
        });

        // Sidebar close button (for mobile)
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        sidebarCloseBtn.addEventListener('click', () => {
            this.hideSidebar();
        });
    }
    
    initializeCheckboxIcons() {
        const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            this.updateCheckboxIcon(checkbox);
        });
    }
    
    updateCheckboxIcon(checkbox) {
        const icon = checkbox.nextElementSibling;
        if (checkbox.checked) {
            icon.textContent = 'check_box';
        } else {
            icon.textContent = 'check_box_outline_blank';
        }
    }
    
    updateMapFilter() {
        const selectedTypes = this.getSelectedCampTypes();
        
        if (selectedTypes.length > 0) {
            this.map.setFilter('camps-circle', ['in', 'campType', ...selectedTypes]);
            this.map.setFilter('camps-labels', ['in', 'campType', ...selectedTypes]);
        } else {
            this.map.setFilter('camps-circle', ['==', 'campType', '']);
            this.map.setFilter('camps-labels', ['==', 'campType', '']);
        }
    }
    
    getSelectedCampTypes() {
        const selected = [];
        const checkboxes = document.querySelectorAll('.checkbox-label input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const label = checkbox.nextElementSibling.nextSibling.textContent.trim();
                selected.push(label);
            }
        });
        
        return selected;
    }
    
    showCampDetails(properties) {
        const detailsContainer = document.getElementById('camp-details');
        
        const campType = properties.campType || 'Unknown';
        const period = `${properties['von (Jahr)'] || '?'} - ${properties['bis (Jahr)'] || '?'}`;
        const location = properties['Gemeinde'] || 'Unknown location';
        const description = properties['Beschreibung (Lage der Fundstelle)'] || '';
        const bemerkung = properties['Bemerkung'] || '';
        
        detailsContainer.innerHTML = `
            <div class="camp-info-section">
                <h4 class="camp-name">${properties['Bezeichnung'] || 'Unknown Camp'}</h4>
                <p><strong>Lager Typ:</strong> ${campType}</p>
                <p><strong>Ort:</strong> ${location}</p>
                <p><strong>Aktiv:</strong> ${period}</p>
            </div>
            
            ${description ? `
            <div class="camp-info-section">
                <h4>Fundstelle</h4>
                <p>${description}</p>
            </div>
            ` : ''}
            
            ${bemerkung ? `
            <div class="camp-info-section">
                <h4>Zusätzliche Informationen</h4>
                <p>${bemerkung}</p>
            </div>
            ` : ''}
        `;
    }
    
    showSidebar() {
        const sidebar = document.getElementById('map-sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const icon = toggle.querySelector('.material-icons');
        
        sidebar.classList.remove('collapsed');
        if (icon) {
            icon.textContent = 'close';
        }
        this.isCollapsed = false;
        this.map.resize();
    }
    
    hideSidebar() {
        const sidebar = document.getElementById('map-sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const icon = toggle.querySelector('.material-icons');
        
        sidebar.classList.add('collapsed');
        if (icon) {
            icon.textContent = 'info';
        }
        this.isCollapsed = true;
        this.map.resize();
    }
    
    fitToTirol() {
        // Bounds centered on Reichenau (11.4, 47.27) with all of Tirol visible
        // Symmetric distances ensure Reichenau is exactly centered
        const reichenauCenteredBounds = [
            [9.85, 46.65],   // Southwest: [lng, lat]
            [12.95, 47.89]   // Northeast: [lng, lat]
        ];
        
        this.map.fitBounds(reichenauCenteredBounds, {
            padding: { top: 40, bottom: 40, left: 40, right: 40 },
            duration: 1000
        });
    }
    
    highlightReichenau() {
        // Find and highlight Reichenau if it exists in the data
        setTimeout(() => {
            const reichenauFeature = this.campsData.features.find(f => 
                f.properties['Bezeichnung'] && 
                f.properties['Bezeichnung'].toLowerCase().includes('reichenau')
            );
            
            if (reichenauFeature) {
                this.showCampDetails(reichenauFeature.properties);
                // Sidebar stays collapsed - user must manually open it
                
                this.popup
                    .setLngLat(reichenauFeature.geometry.coordinates)
                    .setHTML(`<strong>${reichenauFeature.properties['Bezeichnung']}</strong>`)
                    .addTo(this.map);
            }
        }, 1500);
    }
    
    setMapLanguageToGerman() {
        // Set all label layers to display German names (if available)
        try {
            const style = this.map.getStyle();
            if (!style || !style.layers) return;
            
            style.layers.forEach((layer) => {
                if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                    // Update text-field to use German language variant
                    this.map.setLayoutProperty(layer.id, 'text-field', [
                        'coalesce',
                        ['get', 'name_de'],
                        ['get', 'name']
                    ]);
                }
            });
        } catch (e) {
            console.log('Could not set German labels:', e.message);
        }
    }
    
    setupCooperativeScrollZoom(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Create overlay element for scroll message
        const overlay = document.createElement('div');
        overlay.className = 'map-scroll-overlay';
        overlay.innerHTML = `<span>${navigator.platform.includes('Mac') ? '⌘' : 'Strg'} + Scrollen zum Zoomen</span>`;
        container.style.position = 'relative';
        container.appendChild(overlay);
        
        let overlayTimeout;
        let isMouseOver = false;
        const isMac = navigator.platform.includes('Mac');
        
        // Track mouse enter/leave
        container.addEventListener('mouseenter', () => {
            isMouseOver = true;
        });
        
        container.addEventListener('mouseleave', () => {
            isMouseOver = false;
            this.map.scrollZoom.disable();
            overlay.classList.remove('visible');
        });
        
        // Handle key events for modifier key
        const handleKeyDown = (e) => {
            if (!isMouseOver) return;
            if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) {
                this.map.scrollZoom.enable();
                overlay.classList.remove('visible');
                clearTimeout(overlayTimeout);
            }
        };
        
        const handleKeyUp = (e) => {
            if (!isMouseOver) return;
            if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Control')) {
                this.map.scrollZoom.disable();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Handle wheel events - show overlay when scrolling without modifier
        container.addEventListener('wheel', (e) => {
            const isZoomModifier = isMac ? e.metaKey : e.ctrlKey;
            
            if (!isZoomModifier) {
                // Show overlay message
                overlay.classList.add('visible');
                
                clearTimeout(overlayTimeout);
                overlayTimeout = setTimeout(() => {
                    overlay.classList.remove('visible');
                }, 1500);
            }
        }, { passive: true });
    }

    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.map.zoomIn();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.map.zoomOut();
            });
        }
    }
}

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing maps...');
    
    // Initialize main map
    const mapContainer = document.getElementById('mapbox-map');
    if (mapContainer) {
        console.log('Main map container found, initializing TirolCampsMap...');
        try {
            new TirolCampsMap();
        } catch (error) {
            console.error('Error initializing TirolCampsMap:', error);
        }
    } else {
        console.error('Main map container not found!');
    }

    // Initialize birthplaces map
    const birthplacesMapContainer = document.getElementById('birthplaces-map');
    if (birthplacesMapContainer) {
        console.log('Birthplaces map container found, initializing BirthplacesMap...');
        try {
            new BirthplacesMap();
        } catch (error) {
            console.error('Error initializing BirthplacesMap:', error);
        }
    } else {
        console.error('Birthplaces map container not found!');
    }
});

// Birthplaces Map Class
class BirthplacesMap {
    constructor() {
        this.map = null;
        this.innsbruckCoords = [11.393, 47.268]; // Innsbruck coordinates
        this.birthplacesData = null;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing BirthplacesMap...');
            await this.loadBirthplacesData();
            console.log('Birthplaces data loaded successfully');
            this.initMap();
            console.log('Birthplaces map initialized');
        } catch (error) {
            console.error('Error initializing birthplaces map:', error);
        }
    }
    
    async loadBirthplacesData() {
        try {
            const response = await fetch('assets/birthplaces.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.birthplacesData = await response.json();
            // Filter out entries with null coordinates
            this.birthplacesData = this.birthplacesData.filter(place => 
                place.lat !== null && place.long !== null
            );
            console.log('Filtered birthplaces data:', this.birthplacesData.length, 'valid locations');
        } catch (error) {
            console.error('Error loading birthplaces data:', error);
            throw error;
        }
    }
    
    initMap() {
        this.map = new maplibregl.Map({
            container: 'birthplaces-map',
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [11.393, 47.268],//this.innsbruckCoords, // Center on Innsbruck
            zoom: 3,
            scrollZoom: false, // Disabled by default, enabled with Cmd/Ctrl
            attributionControl: false
        });
        
        // Setup cooperative scroll zoom (Cmd/Ctrl + scroll to zoom)
        this.setupCooperativeScrollZoom('birthplaces-map');
        
        this.map.on('load', () => {
            this.setMapLanguageToGerman();
            this.addBirthplacesData();
            // this.fitMapToBounds();
        });
        
        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    }
    
    addBirthplacesData() {
        // Create GeoJSON for birthplaces
        const birthplacesGeoJSON = {
            type: 'FeatureCollection',
            features: this.birthplacesData.map(place => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [place.lat, place.long] // JSON has lat/long swapped, so we swap them back
                },
                properties: {
                    name: place.name,
                    geburtsort: place.Geburtsort
                }
            }))
        };
        
        // Add birthplaces source
        this.map.addSource('birthplaces', {
            type: 'geojson',
            data: birthplacesGeoJSON
        });
        
        // Add birthplaces markers
        this.map.addLayer({
            id: 'birthplaces-markers',
            type: 'circle',
            source: 'birthplaces',
            paint: {
                'circle-radius': 2,
                'circle-color': '#ed1c24',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            }
        });
        
        // Add lines from birthplaces to Innsbruck
        const linesGeoJSON = {
            type: 'FeatureCollection',
            features: this.birthplacesData.map(place => ({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [place.lat, place.long], // JSON has lat/long swapped, so we swap them back
                        this.innsbruckCoords
                    ]
                },
                properties: {
                    name: place.name,
                    geburtsort: place.Geburtsort
                }
            }))
        };
        
        // Add lines source
        this.map.addSource('connection-lines', {
            type: 'geojson',
            data: linesGeoJSON
        });
        
        // Add lines layer
        this.map.addLayer({
            id: 'connection-lines',
            type: 'line',
            source: 'connection-lines',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ed1c24',
                'line-width': 1,
                'line-opacity': 0.6
            }
        });
        
        // Add labels for birthplaces
        this.map.addLayer({
            id: 'birthplaces-labels',
            type: 'symbol',
            source: 'birthplaces',
            layout: {
                'text-field': ['get', 'geburtsort'],
                'text-size': 12,
                // 'text-offset': [0, -1],
                'text-anchor': 'bottom',
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
            },
            paint: {
                'text-color': '#333',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1
            }
        });
        
        // Add click handlers for popups
        // this.map.on('click', 'birthplaces-markers', (e) => {
        //     const coordinates = e.features[0].geometry.coordinates.slice();
        //     const { name, geburtsort } = e.features[0].properties;
            
        //     // Ensure that if the map is zoomed out such that multiple
        //     // copies of the feature are visible, the popup appears
        //     // over the copy being pointed to.
        //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        //         coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        //     }
            
        //     new maplibregl.Popup()
        //         .setLngLat(coordinates)
        //         .setHTML(`
        //             <div style="font-weight: bold; color: #ed1c24; margin-bottom: 5px;">${geburtsort}</div>
        //             <div style="color: #666;">Birthplace of victim</div>
        //         `)
        //         .addTo(this.map);
        // });
        
        // Change cursor on hover
        this.map.on('mouseenter', 'birthplaces-markers', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', 'birthplaces-markers', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }
    
    fitMapToBounds() {
        // Fixed bounds for Europe to provide consistent view
        const europeBounds = [
            [-10, 36],  // Southwest: [lng, lat] - Portugal/Spain
            [30, 71]    // Northeast: [lng, lat] - Eastern Europe/Scandinavia
        ];
        
        // Fit the map to European bounds
        this.map.fitBounds(europeBounds, {
            padding: 10
        });
    }
    
    setMapLanguageToGerman() {
        // Set all label layers to display German names (if available)
        try {
            const style = this.map.getStyle();
            if (!style || !style.layers) return;
            
            style.layers.forEach((layer) => {
                if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                    // Update text-field to use German language variant
                    this.map.setLayoutProperty(layer.id, 'text-field', [
                        'coalesce',
                        ['get', 'name_de'],
                        ['get', 'name']
                    ]);
                }
            });
        } catch (e) {
            console.log('Could not set German labels:', e.message);
        }
    }
    
    setupCooperativeScrollZoom(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Create overlay element for scroll message
        const overlay = document.createElement('div');
        overlay.className = 'map-scroll-overlay';
        overlay.innerHTML = `<span>${navigator.platform.includes('Mac') ? '⌘' : 'Strg'} + Scrollen zum Zoomen</span>`;
        container.style.position = 'relative';
        container.appendChild(overlay);
        
        let overlayTimeout;
        let isMouseOver = false;
        const isMac = navigator.platform.includes('Mac');
        
        // Track mouse enter/leave
        container.addEventListener('mouseenter', () => {
            isMouseOver = true;
        });
        
        container.addEventListener('mouseleave', () => {
            isMouseOver = false;
            this.map.scrollZoom.disable();
            overlay.classList.remove('visible');
        });
        
        // Handle key events for modifier key
        const handleKeyDown = (e) => {
            if (!isMouseOver) return;
            if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) {
                this.map.scrollZoom.enable();
                overlay.classList.remove('visible');
                clearTimeout(overlayTimeout);
            }
        };
        
        const handleKeyUp = (e) => {
            if (!isMouseOver) return;
            if ((isMac && e.key === 'Meta') || (!isMac && e.key === 'Control')) {
                this.map.scrollZoom.disable();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Handle wheel events - show overlay when scrolling without modifier
        container.addEventListener('wheel', (e) => {
            const isZoomModifier = isMac ? e.metaKey : e.ctrlKey;
            
            if (!isZoomModifier) {
                // Show overlay message
                overlay.classList.add('visible');
                
                clearTimeout(overlayTimeout);
                overlayTimeout = setTimeout(() => {
                    overlay.classList.remove('visible');
                }, 1500);
            }
        }, { passive: true });
    }
}
