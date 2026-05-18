// Exportar.js - Módulo de exportación de modelos 3D
import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

/**
 * Exporta un objeto Three.js a formato STL (ASCII)
 * @param {THREE.Object3D} object - Objeto a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportSTL(object, filename = 'modelo') {
    if (!object) {
        console.error('No hay objeto para exportar');
        return;
    }
    const exporter = new STLExporter();
    const stlString = exporter.parse(object, { binary: false });
    downloadFile(stlString, `${filename}.stl`, 'text/plain');
}

/**
 * Exporta un objeto Three.js a formato GLTF (JSON)
 * @param {THREE.Object3D} object - Objeto a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportGLTF(object, filename = 'modelo') {
    if (!object) {
        console.error('No hay objeto para exportar');
        return;
    }
    const exporter = new GLTFExporter();
    exporter.parse(object, (result) => {
        const jsonString = JSON.stringify(result, null, 2);
        downloadFile(jsonString, `${filename}.gltf`, 'application/json');
    }, { binary: false });
}

/**
 * Exporta un objeto Three.js a formato OBJ (texto)
 * @param {THREE.Object3D} object - Objeto a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportOBJ(object, filename = 'modelo') {
    if (!object) {
        console.error('No hay objeto para exportar');
        return;
    }
    const exporter = new OBJExporter();
    const objString = exporter.parse(object);
    downloadFile(objString, `${filename}.obj`, 'text/plain');
}

// Función auxiliar para descargar archivos
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}