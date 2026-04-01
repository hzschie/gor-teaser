console.log('Testing basic map functionality...');

// Test if Mapbox is loaded
if (typeof mapboxgl !== 'undefined') {
    console.log('Mapbox GL is loaded');
    console.log('Mapbox version:', mapboxgl.version);
} else {
    console.error('Mapbox GL is not loaded!');
}

// Test if the map container exists
const container = document.getElementById('mapbox-map');
if (container) {
    console.log('Map container found:', container);
    console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
} else {
    console.error('Map container not found!');
}

// Test CSV file access
fetch('assets/NS_Lager-Österreich-2019-12-02_öffentlich.csv')
    .then(response => {
        console.log('CSV fetch response:', response.status, response.statusText);
        return response.text();
    })
    .then(text => {
        console.log('CSV loaded, first 200 chars:', text.substring(0, 200));
    })
    .catch(error => {
        console.error('CSV fetch error:', error);
    });
