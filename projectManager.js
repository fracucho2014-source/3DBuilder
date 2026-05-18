let keyframes = [];
let animationTimer = null;
let isPlaying = false;
let currentTime = 0;
let onTimeUpdateCallback = null;
let applyTransformCallback = null;
let getCurrentObjectCallback = null;
let getAllObjectsCallback = null;
let lessonsList = [];
let currentLessonIndex = 0;
let lessonStatus = "Esperando acción...";

export function initProject(getObjectCallback, applyTransformCallbackFn, getAllObjectsCallbackFn) {
    getCurrentObjectCallback = getObjectCallback;
    applyTransformCallback = applyTransformCallbackFn;
    getAllObjectsCallback = getAllObjectsCallbackFn;
    addKeyframe(0);
}
export function setLessons(lessons) {
    lessonsList = lessons;
    if (lessons.length) { currentLessonIndex = 0; lessonStatus = "Lección 1: " + lessons[0].title; }
}
export function addKeyframe(time) {
    const obj = getCurrentObjectCallback();
    if (!obj) return;
    keyframes.push({ time, position: obj.position.clone(), rotation: obj.rotation.clone(), scale: obj.scale.clone() });
    keyframes.sort((a,b) => a.time - b.time);
}
export function clearKeyframes() { keyframes = []; addKeyframe(0); }
export function setCurrentTime(time) {
    currentTime = Math.min(Math.max(time, 0), getMaxTime());
    if (onTimeUpdateCallback) onTimeUpdateCallback(currentTime);
    interpolateAndApply(currentTime);
}
function getMaxTime() { return keyframes.length ? keyframes[keyframes.length-1].time : 0; }
function interpolateAndApply(time) {
    if (!keyframes.length) return;
    let prev = null, next = null;
    for (let i = 0; i < keyframes.length; i++) {
        if (keyframes[i].time <= time) prev = keyframes[i];
        if (keyframes[i].time >= time && next === null) next = keyframes[i];
    }
    if (!prev) prev = keyframes[0];
    if (!next) next = keyframes[keyframes.length-1];
    if (prev.time === next.time) { applyKeyframe(prev); return; }
    const t = (time - prev.time) / (next.time - prev.time);
    const lerp = (a,b,t) => a + (b-a)*t;
    const pos = { x: lerp(prev.position.x, next.position.x, t), y: lerp(prev.position.y, next.position.y, t), z: lerp(prev.position.z, next.position.z, t) };
    const rot = { x: lerp(prev.rotation.x, next.rotation.x, t), y: lerp(prev.rotation.y, next.rotation.y, t), z: lerp(prev.rotation.z, next.rotation.z, t) };
    const scale = { x: lerp(prev.scale.x, next.scale.x, t), y: lerp(prev.scale.y, next.scale.y, t), z: lerp(prev.scale.z, next.scale.z, t) };
    if (applyTransformCallback) applyTransformCallback(pos, rot, scale);
}
function applyKeyframe(kf) { if (applyTransformCallback) applyTransformCallback(kf.position, kf.rotation, kf.scale); }
export function playAnimation() {
    if (isPlaying) stopAnimation();
    isPlaying = true;
    let last = performance.now() / 1000;
    function step(now) {
        if (!isPlaying) return;
        const nowSec = now / 1000;
        let delta = nowSec - last;
        last = nowSec;
        let newTime = currentTime + delta;
        if (newTime >= getMaxTime()) { newTime = getMaxTime(); stopAnimation(); }
        setCurrentTime(newTime);
        if (isPlaying) requestAnimationFrame(step);
    }
    last = performance.now() / 1000;
    requestAnimationFrame(step);
}
export function stopAnimation() { isPlaying = false; }
export function getCurrentLessonStep() {
    if (currentLessonIndex >= lessonsList.length) return { description: "🏆 ¡Todas las lecciones completadas!" };
    return lessonsList[currentLessonIndex];
}
export function getLessonStatus() { return lessonStatus; }
export function nextLesson() {
    if (currentLessonIndex + 1 < lessonsList.length) {
        currentLessonIndex++;
        lessonStatus = "Lección activa: " + lessonsList[currentLessonIndex].title;
    } else lessonStatus = "🏆 ¡Felicidades! Has completado todas las lecciones.";
}
export function updateLessonValidation(textures = {}) {
    if (currentLessonIndex >= lessonsList.length) return;
    const lesson = lessonsList[currentLessonIndex];
    if (!lesson || !lesson.validate) return;
    try {
        const selectedObj = getCurrentObjectCallback();
        const sceneObjects = getAllObjectsCallback ? getAllObjectsCallback() : [];
        const validateFn = new Function('selectedObject', 'sceneObjects', 'textures', 'return (' + lesson.validate + ')');
        if (validateFn(selectedObj, sceneObjects, textures)) lessonStatus = "✅ ¡Correcto! Usa 'Siguiente lección'.";
    } catch(e) { console.warn(e); }
}
export function resetProject() {
    stopAnimation(); keyframes = []; currentTime = 0; currentLessonIndex = 0;
    if (lessonsList.length) lessonStatus = "Lección 1: " + lessonsList[0].title;
    addKeyframe(0); setCurrentTime(0);
}
export function setOnTimeUpdate(callback) { onTimeUpdateCallback = callback; }