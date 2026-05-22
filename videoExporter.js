import * as THREE from 'three';

export async function exportAnimationFromCamera(cameraMesh, duration, speed, onProgress, scene, setCurrentTime, gridGroup) {
    // Guardar estado original de la rejilla y la cámara
    const originalGridVisible = gridGroup.visible;
    const originalCameraVisible = cameraMesh.visible;
    gridGroup.visible = false;
    cameraMesh.visible = false;

    const fps = 30;
    const width = 1280;
    const height = 720;
    const realDuration = duration / speed; // duración real del vídeo

    // Crear canvas y renderer offscreen
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    // NO usar getContext('2d') porque bloquea el contexto webgl
    const offscreenRenderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true, alpha: false });
    offscreenRenderer.setSize(width, height);
    offscreenRenderer.setClearColor(0x000000);
    offscreenRenderer.setPixelRatio(1);

    // Cámara temporal que sigue al objeto cámara
    const tempCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    // Capturar stream y configurar MediaRecorder
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `animacion_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        offscreenRenderer.dispose();
        // Restaurar estado
        gridGroup.visible = originalGridVisible;
        cameraMesh.visible = originalCameraVisible;
        if (onProgress) onProgress(100);
        console.log("✅ Exportación terminada");
    };

    mediaRecorder.start();
    const totalFrames = Math.ceil(realDuration * fps);

    for (let frame = 0; frame <= totalFrames; frame++) {
        const tReal = frame / fps;                 // tiempo real transcurrido
        const tAnim = Math.min(duration, tReal * speed); // tiempo de la línea de tiempo

        setCurrentTime(tAnim);

        // Actualizar la cámara temporal según la posición/orientación del objeto cámara
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraMesh.quaternion);
        const lensOffset = new THREE.Vector3(0, 0.1, 0.45).applyQuaternion(cameraMesh.quaternion);
        tempCamera.position.copy(cameraMesh.position.clone().add(lensOffset));
        tempCamera.lookAt(cameraMesh.position.clone().add(forward.multiplyScalar(2)));

        offscreenRenderer.render(scene, tempCamera);

        // Esperar un fotograma real para no saturar
        await new Promise(r => requestAnimationFrame(r));

        if (onProgress) {
            const percent = (frame / totalFrames) * 100;
            onProgress(percent);
        }
    }

    mediaRecorder.stop();
}