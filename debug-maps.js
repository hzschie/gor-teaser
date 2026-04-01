// Debug script to check map initialization
console.log('=== MAP DEBUG SCRIPT ===');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking map containers...');
    
    setTimeout(() => {
        // Check main map container
        const mapContainer = document.getElementById('mapbox-map');
        console.log('Main map container:', mapContainer);
        if (mapContainer) {
            console.log('Main map dimensions:', {
                width: mapContainer.offsetWidth,
                height: mapContainer.offsetHeight,
                parent: mapContainer.parentElement.tagName,
                parentHeight: mapContainer.parentElement.offsetHeight
            });
        }
        
        // Check birthplaces map container  
        const birthplacesContainer = document.getElementById('birthplaces-map');
        console.log('Birthplaces map container:', birthplacesContainer);
        if (birthplacesContainer) {
            console.log('Birthplaces map dimensions:', {
                width: birthplacesContainer.offsetWidth,
                height: birthplacesContainer.offsetHeight,
                parent: birthplacesContainer.parentElement.tagName,
                parentHeight: birthplacesContainer.parentElement.offsetHeight
            });
        }
        
        // Check Mapbox GL JS
        console.log('Mapbox GL JS available:', typeof mapboxgl !== 'undefined');
        console.log('Mapbox access token set:', mapboxgl.accessToken ? 'YES' : 'NO');
        
    }, 2000);
});
