const fs = require('fs');
const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

global.self = global;
global.window = global;

global.FileReader = class FileReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
    }
    readAsDataURL(blob) {
        blob.arrayBuffer().then(buffer => {
            const base64 = Buffer.from(buffer).toString('base64');
            this.result = `data:${blob.type};base64,${base64}`;
            if (this.onload) this.onload({ target: this });
        }).catch(err => {
            if (this.onerror) this.onerror(err);
        });
    }
    readAsArrayBuffer(blob) {
        console.log("readAsArrayBuffer called");
        blob.arrayBuffer().then(buffer => {
            console.log("arrayBuffer resolved");
            this.result = buffer;
            if (this.onload) {
                console.log("calling onload");
                try {
                    this.onload({ target: this });
                } catch (e) {
                    console.error("Error in onload:", e);
                }
                console.log("onload finished");
            } else {
                console.log("onload is null");
            }
            if (this.onloadend) {
                console.log("calling onloadend");
                this.onloadend({ target: this });
            }
        }).catch(err => {
            console.error("arrayBuffer error", err);
            if (this.onerror) this.onerror(err);
        });
    }
};

async function test() {
    const exporter = new GLTFExporter();
    
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    mesh.name = "box";
    group.add(mesh);
    
    // Animation
    const times = [0, 1];
    const values = [0, 0, 0, 1, 1, 1];
    const track = new THREE.VectorKeyframeTrack('box.position', times, values);
    const clip = new THREE.AnimationClip('Move', 1.0, [track]);
    
    console.log("Parsing...");
    exporter.parse(
        group,
        (gltf) => {
            console.log("Success", gltf.byteLength);
        },
        (err) => {
            console.error("Error", err);
        },
        { binary: true, animations: [clip] }
    );
}

test();
