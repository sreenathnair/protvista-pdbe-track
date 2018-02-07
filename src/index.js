import ProtVistaPDBeTrack from './protvista-pdbe-track';

const loadComponent = function() {
    customElements.define('protvista-pdbe-track', ProtVistaPDBeTrack);
};
// Conditional loading of polyfill
if (window.customElements) {
    loadComponent();
} else {
    document.addEventListener('WebComponentsReady', function() {
        loadComponent();
    });
}


export default ProtVistaPDBeTrack;
