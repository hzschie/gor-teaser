// Simple map test without CSV data
mapboxgl.accessToken = 'pk.eyJ1Ijoiamd1ZXJyYWciLCJhIjoiY2pueW9uMGhzMDA3NDN3bXp5b2Rqbzk1YiJ9.3scgV-j4d394mvOUqtz1XQ';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Simple map test starting...');
    
    // Wait a bit for CSS to be applied
    setTimeout(() => {
        const mapContainer = document.getElementById('mapbox-map');
        if (!mapContainer) {
            console.error('No map container found');
            return;
        }
        
        const styles = window.getComputedStyle(mapContainer);
        console.log('Container computed height:', styles.height);
        console.log('Container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
        console.log('Container parent:', mapContainer.parentElement.id);
        
        if (mapContainer.offsetHeight === 0) {
            console.error('Container has zero height!');
            mapContainer.style.height = '600px';
            console.log('Forced height to 600px');
        }
        
        try {
            const map = new mapboxgl.Map({
                container: 'mapbox-map',
                style: 'mapbox://styles/mapbox/light-v10',
                center: [11.4, 47.3],
                zoom: 8
            });
            
            map.on('load', () => {
                console.log('Simple map loaded successfully');
                
                // Add a simple marker for Reichenau
                new mapboxgl.Marker()
                    .setLngLat([11.430947, 47.272109])
                    .setPopup(new mapboxgl.Popup().setText('Arbeitserziehungslager Reichenau'))
                    .addTo(map);
            });
            
            map.on('error', (e) => {
                console.error('Map error:', e);
            });
            
        } catch (error) {
            console.error('Error creating map:', error);
        }
    }, 500);
});
