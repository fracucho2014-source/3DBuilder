// Timeline.js - Gestión de la línea de tiempo de keyframes
export function createTimeline(containerId, options = {}) {
    const defaultOptions = {
        maxTime: 5,
        onTimeChange: (time) => {},
        onKeyframeAdd: (time) => {},
        onKeyframeRemove: (index, time) => {},
        onKeyframeMove: (index, newTime) => {},
        onPlay: () => {},
        onStop: () => {}
    };
    const config = { ...defaultOptions, ...options };
    
    let timelineKeyframes = []; // { time }
    let selectedKeyframeIndex = -1;
    let currentTime = 0;
    let isPlaying = false;
    let maxTime = config.maxTime;
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return null;
    }
    
    container.innerHTML = `
        <div class="timeline-header" style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span>Línea de tiempo</span>
            <span id="timelineCurrentTime">0.00s</span>
        </div>
        <div class="timeline-canvas" style="background:#1e2a36; border-radius:8px; position:relative; cursor:pointer;">
            <div class="timeline-ruler" style="height:24px; background:#2c3e50; border-radius:4px 4px 0 0;"></div>
            <div class="timeline-track" style="height:40px; background:#1a252f; position:relative; border-radius:0 0 4px 4px;">
                <div class="playhead" style="position:absolute; width:2px; height:100%; background:#e74c3c; left:0; top:0; pointer-events:none;"></div>
            </div>
        </div>
        <div class="timeline-controls" style="display:flex; justify-content:center; gap:12px; margin-top:8px;">
            <button id="timelineAddBtn">➕ Añadir Keyframe</button>
            <button id="timelinePlayBtn">▶ Reproducir</button>
            <button id="timelineStopBtn">⏹ Detener</button>
        </div>
    `;
    
    const trackDiv = container.querySelector('.timeline-track');
    const playhead = container.querySelector('.playhead');
    const currentTimeSpan = container.querySelector('#timelineCurrentTime');
    const addBtn = container.querySelector('#timelineAddBtn');
    const playBtn = container.querySelector('#timelinePlayBtn');
    const stopBtn = container.querySelector('#timelineStopBtn');
    
    let updating = false; // Prevenir recursión
    
    function updateUI() {
        const width = trackDiv.clientWidth;
        if (width === 0) { setTimeout(updateUI, 50); return; }
        const markers = trackDiv.querySelectorAll('.keyframe-marker');
        markers.forEach(m => m.remove());
        timelineKeyframes.forEach((kf, idx) => {
            const left = (kf.time / maxTime) * width;
            const marker = document.createElement('div');
            marker.className = 'keyframe-marker';
            marker.style.position = 'absolute';
            marker.style.width = '12px';
            marker.style.height = '12px';
            marker.style.background = idx === selectedKeyframeIndex ? '#e74c3c' : '#1abc9c';
            marker.style.borderRadius = '50%';
            marker.style.border = '2px solid white';
            marker.style.top = '50%';
            marker.style.transform = 'translate(-50%, -50%)';
            marker.style.left = `${left}px`;
            marker.style.cursor = 'pointer';
            marker.style.zIndex = '10';
            marker.dataset.index = idx;
            marker.addEventListener('click', (e) => { e.stopPropagation(); selectKeyframe(idx); });
            let dragging = false;
            marker.addEventListener('mousedown', (e) => {
                dragging = true;
                const onMouseMove = (moveEvent) => {
                    if (!dragging) return;
                    const rect = trackDiv.getBoundingClientRect();
                    let newLeft = moveEvent.clientX - rect.left;
                    newLeft = Math.max(0, Math.min(rect.width, newLeft));
                    const newTime = (newLeft / rect.width) * maxTime;
                    kf.time = Math.min(maxTime, Math.max(0, newTime));
                    marker.style.left = `${newLeft}px`;
                    timelineKeyframes.sort((a,b) => a.time - b.time);
                    const newIndex = timelineKeyframes.findIndex(k => k.time === kf.time);
                    if (newIndex !== idx) { selectKeyframe(newIndex); config.onKeyframeMove(newIndex, kf.time); } 
                    else { config.onKeyframeMove(idx, kf.time); }
                    updateUI();
                };
                const onMouseUp = () => { dragging = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            });
            trackDiv.appendChild(marker);
        });
        const left = (currentTime / maxTime) * width;
        playhead.style.left = `${left}px`;
        currentTimeSpan.innerText = currentTime.toFixed(2) + 's';
    }
    
    function selectKeyframe(index) {
        selectedKeyframeIndex = index;
        updateUI();
        if (index >= 0 && timelineKeyframes[index]) setCurrentTime(timelineKeyframes[index].time);
    }
    
    function setCurrentTime(time) {
        if (updating) return;
        updating = true;
        currentTime = Math.min(maxTime, Math.max(0, time));
        config.onTimeChange(currentTime);
        updateUI();
        updating = false;
    }
    
    // Método público para actualizar solo la UI sin callback (usado por animación externa)
    function updatePlayheadOnly(time) {
        if (updating) return;
        updating = true;
        currentTime = Math.min(maxTime, Math.max(0, time));
        updateUI();
        updating = false;
    }
    
    function addKeyframe(time) {
        if (timelineKeyframes.some(k => Math.abs(k.time - time) < 0.01)) return;
        timelineKeyframes.push({ time });
        timelineKeyframes.sort((a,b) => a.time - b.time);
        const newIndex = timelineKeyframes.findIndex(k => k.time === time);
        selectKeyframe(newIndex);
        updateUI();
        config.onKeyframeAdd(time);
    }
    
    function removeSelectedKeyframe() {
        if (selectedKeyframeIndex >= 0) {
            const removedTime = timelineKeyframes[selectedKeyframeIndex].time;
            timelineKeyframes.splice(selectedKeyframeIndex, 1);
            selectedKeyframeIndex = -1;
            updateUI();
            config.onKeyframeRemove(selectedKeyframeIndex, removedTime);
        }
    }
    
    function getSelectedKeyframeIndex() { return selectedKeyframeIndex; }
    
    function play() {
        if (isPlaying) stop();
        isPlaying = true;
        const startTime = performance.now() / 1000;
        let lastTime = currentTime;
        function step(now) {
            if (!isPlaying) return;
            const elapsed = (performance.now() / 1000) - startTime;
            let newTime = lastTime + elapsed;
            if (newTime >= maxTime) { newTime = maxTime; stop(); }
            setCurrentTime(newTime);
            if (isPlaying) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        config.onPlay();
    }
    
    function stop() {
        isPlaying = false;
        config.onStop();
    }
    
    const trackContainer = container.querySelector('.timeline-canvas');
    if (trackContainer) {
        trackContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList?.contains('keyframe-marker')) return;
            const rect = trackDiv.getBoundingClientRect();
            let left = e.clientX - rect.left;
            left = Math.max(0, Math.min(rect.width, left));
            const newTime = (left / rect.width) * maxTime;
            setCurrentTime(newTime);
            const onMouseMove = (moveEvent) => {
                let newLeft = moveEvent.clientX - rect.left;
                newLeft = Math.max(0, Math.min(rect.width, newLeft));
                const t = (newLeft / rect.width) * maxTime;
                setCurrentTime(t);
            };
            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }
    
    if (addBtn) addBtn.addEventListener('click', () => addKeyframe(currentTime));
    if (playBtn) playBtn.addEventListener('click', () => play());
    if (stopBtn) stopBtn.addEventListener('click', () => stop());
    
    addKeyframe(0);
    addKeyframe(maxTime);
    
    setTimeout(() => updateUI(), 100);
    window.addEventListener('resize', () => updateUI());
    
    return {
        getCurrentTime: () => currentTime,
        setCurrentTime,
        updatePlayheadOnly,  // nuevo método para actualizar sin callback
        addKeyframe,
        removeSelectedKeyframe,
        getSelectedKeyframeIndex,
        getKeyframes: () => [...timelineKeyframes],
        setKeyframes: (kfs) => {
            timelineKeyframes = kfs.map(t => ({ time: t.time || t }));
            timelineKeyframes.sort((a,b) => a.time - b.time);
            selectedKeyframeIndex = -1;
            updateUI();
        },
        getMaxTime: () => maxTime,
        setMaxTime: (t) => { maxTime = t; updateUI(); },
        play,
        stop
    };
}