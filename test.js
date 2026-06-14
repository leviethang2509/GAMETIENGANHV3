// Let's find GLTFExporter in the three package. In modern three.js (v148+), exports are ES modules.
// Let's check if we can import/require three/examples/jsm/exporters/GLTFExporter.js or similar,
// or if we can run it using dynamic imports, or if we can write a browser-based generation or node dynamic import.
// Modern node allows dynamic import for ES modules. Let's see:
async function test() {
    try {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
        console.log('GLTFExporter loaded via dynamic import successfully!');
    } catch (e) {
        console.log('Failed to import GLTFExporter:', e.message);
    }
}
test();
