import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Escena, cámara, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1c1c24);
scene.fog = new THREE.FogExp2(0x1c1c24, 0.008);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 6, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';

// Controles orbitales
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.target.set(0, 0, 0);

// TransformControls
export const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
});
transformControls.addEventListener('objectChange', () => {
    if (onObjectTransformCallback) onObjectTransformCallback();
});
scene.add(transformControls);

let onObjectTransformCallback = null;
export function setOnObjectTransform(callback) { onObjectTransformCallback = callback; }

// Raycaster para selección
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', (event) => {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects.map(obj => obj.mesh), true);
    if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !objects.some(obj => obj.mesh === hit)) {
            hit = hit.parent;
        }
        if (hit && objects.some(obj => obj.mesh === hit)) {
            const obj = objects.find(o => o.mesh === hit);
            if (obj) selectObject(obj.id);
        }
    }
});

// Iluminación
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const keyLight = new THREE.DirectionalLight(0xfff5e0, 1);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
scene.add(keyLight);
const fillLight = new THREE.PointLight(0x4466cc, 0.5);
fillLight.position.set(-4, 2, 5);
scene.add(fillLight);
const rimLight = new THREE.PointLight(0xffaa66, 0.6);
rimLight.position.set(2, 3, -6);
scene.add(rimLight);
const bottomLight = new THREE.PointLight(0x88aaff, 0.3);
bottomLight.position.set(0, -3, 0);
scene.add(bottomLight);

// Rejilla y ejes
const gridHelper = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588);
gridHelper.position.y = -0.01;
scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

let objects = [];
let selectedObjectId = null;
let objectCounter = 0;

// Texturas procedurales
function createCheckerTexture(color1, color2, repeats = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / repeats;
    for (let i = 0; i < repeats; i++) {
        for (let j = 0; j < repeats; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? color1 : color2;
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 200; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = `rgba(70,40,20,${Math.random() * 0.5 + 0.2})`;
        ctx.lineWidth = Math.random() * 3 + 1;
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}
function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(60,60,70,${Math.random() * 0.5})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
}
function createMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#C0C0C0');
    grad.addColorStop(0.5, '#A0A0A0');
    grad.addColorStop(1, '#808080');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(255,255,200,${Math.random() * 0.3})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}
export const textures = {
    default: null,
    grid: createCheckerTexture('#444', '#aaa', 8),
    brick: createCheckerTexture('#b85c1a', '#a04010', 6),
    stone: createStoneTexture(),
    wood: createWoodTexture(),
    metal: createMetalTexture()
};

function createMaterial(color, textureKey = null) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7 });
    if (textureKey && textures[textureKey]) {
        material.map = textures[textureKey];
        material.needsUpdate = true;
    }
    return material;
}

// Primitivas
export function createCube(name = 'Cubo') {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'cube');
}
export function createCylinder(name = 'Cilindro') {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'cylinder');
}
export function createSphere(name = 'Esfera') {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'sphere');
}
export function createCone(name = 'Cono') {
    const geometry = new THREE.ConeGeometry(0.5, 1, 32);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'cone');
}
export function createTorus(name = 'Toro') {
    const geometry = new THREE.TorusGeometry(0.5, 0.2, 32, 64);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'torus');
}
export function createTrapezoidalPrism(name = 'Prisma Trapezoidal') {
    const geometry = new THREE.CylinderGeometry(0.3, 0.7, 1, 4);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'trapezoidal');
}
export function createTetrahedron(name = 'Tetraedro') {
    const geometry = new THREE.TetrahedronGeometry(0.7);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'tetrahedron');
}
export function createCylinderTruncated(name = 'Cilindro truncado') {
    const geometry = new THREE.CylinderGeometry(0.3, 0.7, 1, 32);
    const material = createMaterial(0x5f91d7);
    const mesh = new THREE.Mesh(geometry, material);
    return addObject(mesh, name, 'truncated');
}

export function addObject(mesh, name, type = 'primitive') {
    mesh.castShadow = true;
    mesh.userData = { id: objectCounter++, name, type };
    scene.add(mesh);
    objects.push({ id: mesh.userData.id, name, mesh, type });
    updateObjectNames();
    return mesh.userData.id;
}
export function removeObject(id) {
    const index = objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
        const obj = objects[index];
        if (selectedObjectId === id) {
            transformControls.detach();
            selectedObjectId = null;
        }
        scene.remove(obj.mesh);
        objects.splice(index, 1);
        updateObjectNames();
    }
}
export function selectObject(id) {
    if (selectedObjectId === id) return;
    selectedObjectId = id;
    const obj = getObject(id);
    if (obj) {
        transformControls.attach(obj.mesh);
        transformControls.setMode('translate');
    } else {
        transformControls.detach();
    }
    if (onSelectionChangeCallback) onSelectionChangeCallback(id);
}
export function getObject(id) { return objects.find(obj => obj.id === id); }
export function getSelectedObject() { return selectedObjectId === null ? null : getObject(selectedObjectId); }
export function getAllMeshes() { return objects.map(obj => obj.mesh); }
export function getObjectList() { return objects.map(obj => ({ id: obj.id, name: obj.name, type: obj.type })); }

// Serialización para clipboard y undo/redo
export function getObjectData(id) {
    const obj = getObject(id);
    if (!obj) return null;
    const mesh = obj.mesh;
    let textureKey = 'none';
    if (mesh.material.map) {
        for (let k in textures) if (textures[k] === mesh.material.map) textureKey = k;
    }
    return {
        type: obj.type, name: obj.name,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
        color: mesh.material.color.getHex(),
        textureKey, roughness: mesh.material.roughness, metalness: mesh.material.metalness,
        opacity: mesh.material.opacity, emissive: mesh.material.emissive.getHex()
    };
}
export function createObjectFromData(data, newName = null) {
    const name = newName || `${data.name}_copia`;
    let mesh;
    switch (data.type) {
        case 'cube': mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), null); break;
        case 'cylinder': mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,32), null); break;
        case 'sphere': mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32), null); break;
        case 'cone': mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5,1,32), null); break;
        case 'torus': mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5,0.2,32,64), null); break;
        case 'trapezoidal': mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.7,1,4), null); break;
        case 'tetrahedron': mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.7), null); break;
        case 'truncated': mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.7,1,32), null); break;
        default: mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), null);
    }
    const material = new THREE.MeshStandardMaterial({
        color: data.color, roughness: data.roughness, metalness: data.metalness,
        transparent: data.opacity < 1, opacity: data.opacity
    });
    if (data.textureKey !== 'none' && textures[data.textureKey]) {
        material.map = textures[data.textureKey];
        material.needsUpdate = true;
    }
    material.emissive.setHex(data.emissive);
    mesh.material = material;
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
    mesh.castShadow = true;
    return addObject(mesh, name, data.type);
}
export function getSelectedObjectData() { return selectedObjectId === null ? null : getObjectData(selectedObjectId); }

// Propiedades
export function updateSelectedObjectProperty(property, value) {
    const obj = getSelectedObject();
    if (!obj) return;
    const mesh = obj.mesh;
    switch (property) {
        case 'color': mesh.material.color.set(value); break;
        case 'texture':
            if (value && value !== 'none' && textures[value]) {
                mesh.material.map = textures[value];
                mesh.material.needsUpdate = true;
            } else {
                mesh.material.map = null;
                mesh.material.needsUpdate = true;
            }
            break;
        case 'position': mesh.position.set(value.x, value.y, value.z); break;
        case 'scale': mesh.scale.set(value.x, value.y, value.z); break;
        case 'rotation': mesh.rotation.set(value.x, value.y, value.z); break;
        case 'opacity': mesh.material.transparent = true; mesh.material.opacity = value; break;
        case 'roughness': mesh.material.roughness = value; break;
        case 'metalness': mesh.material.metalness = value; break;
        case 'emissive': mesh.material.emissive.set(value); break;
    }
    if (onObjectTransformCallback) onObjectTransformCallback();
}
export function getSelectedObjectProperties() {
    const obj = getSelectedObject();
    if (!obj) return null;
    const mesh = obj.mesh;
    let textureKey = 'none';
    if (mesh.material.map) {
        for (let k in textures) if (textures[k] === mesh.material.map) textureKey = k;
    }
    return {
        name: obj.name,
        position: mesh.position.clone(),
        scale: mesh.scale.clone(),
        rotation: mesh.rotation.clone(),
        color: mesh.material.color.getHex(),
        texture: textureKey,
        opacity: mesh.material.opacity,
        roughness: mesh.material.roughness,
        metalness: mesh.material.metalness,
        emissive: mesh.material.emissive.getHex()
    };
}

// Callbacks
let nameChangeCallback = null, selectionChangeCallback = null;
export function onObjectListChange(callback) { nameChangeCallback = callback; }
export function onSelectionChange(callback) { selectionChangeCallback = callback; }
function updateObjectNames() { if (nameChangeCallback) nameChangeCallback(getObjectList()); }
function onSelectionChangeCallback(id) { if (selectionChangeCallback) selectionChangeCallback(id); }

// Exportación STL
export function exportSelectedSTL() {
    const obj = getSelectedObject();
    if (!obj) return;
    const exporter = new STLExporter();
    const stlString = exporter.parse(obj.mesh, { binary: false });
    const blob = new Blob([stlString], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${obj.name}.stl`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Exportación GLTF
export function exportSelectedGLTF() {
    const obj = getSelectedObject();
    if (!obj) return;
    const exporter = new GLTFExporter();
    exporter.parse(obj.mesh, (result) => {
        const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${obj.name}.gltf`;
        link.click();
        URL.revokeObjectURL(link.href);
    }, { binary: false });
}

// Cámara y rejilla
export function resetCamera() {
    camera.position.set(8, 6, 12);
    controls.target.set(0, 0, 0);
    controls.update();
}
let gridVisible = true;
export function toggleGrid() {
    gridVisible = !gridVisible;
    gridHelper.visible = gridVisible;
    axesHelper.visible = gridVisible;
}

// Carga de modelos
const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
export function loadModel(file, onProgress) {
    return new Promise((resolve, reject) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const url = URL.createObjectURL(file);
        let loader;
        if (extension === 'gltf' || extension === 'glb') loader = gltfLoader;
        else if (extension === 'obj') loader = objLoader;
        else reject(new Error('Formato no soportado'));
        loader.load(url, (result) => {
            URL.revokeObjectURL(url);
            let model = result.scene || result;
            model.traverse(child => { if (child.isMesh) child.castShadow = true; });
            const id = addObject(model, file.name, 'imported');
            resolve(id);
        }, onProgress, (error) => { URL.revokeObjectURL(url); reject(error); });
    });
}

// Exposición de cámara y controles para WASD
export function getCamera() { return camera; }
export function updateCameraControls() {
    controls.target.set(0, 0, 0);
    controls.update();
}
export function setOrbitControls(ctrl) { /* ya tenemos controls global, no necesario */ }

// Animación
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// NOTA: No se crea ningún objeto por defecto