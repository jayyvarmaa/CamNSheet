const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const cameraSelect = document.getElementById('cameraSelect');

// Debug bindings
const debugCamera = document.getElementById('debug-camera');
const debugMediaPipe = document.getElementById('debug-mediapipe');
const debugGesture = document.getElementById('debug-gesture');
const debugConsole = document.getElementById('debug-log-console');
const toggleDebugBtn = document.getElementById('toggle-debug-btn');
const debugPanel = document.getElementById('debug-panel');

// Capture bindings
const snapPhotoBtn = document.getElementById('snap-photo-btn');
const recordVideoBtn = document.getElementById('record-video-btn');
const timerDisplay = document.getElementById('recording-timer');
const galleryBtn = document.getElementById('gallery-btn');
const galleryBadge = document.getElementById('gallery-badge');
const helpBtn = document.getElementById('help-btn');

// Overlays & Modal Bindings
const onboardingOverlay = document.getElementById('onboarding-overlay');
const prevSlideBtn = document.getElementById('prev-slide-btn');
const nextSlideBtn = document.getElementById('next-slide-btn');
const slideDotsContainer = document.querySelector('.slide-dots');
const galleryOverlay = document.getElementById('gallery-overlay');
const closeGalleryBtn = document.getElementById('close-gallery-btn');
const galleryGrid = document.getElementById('gallery-grid');
const previewOverlay = document.getElementById('preview-overlay');
const closePreviewBtn = document.getElementById('close-preview-btn');
const previewContent = document.getElementById('preview-content');
const downloadPreviewBtn = document.getElementById('download-preview-btn');
const deletePreviewBtn = document.getElementById('delete-preview-btn');

let currentStream = null;
let mediaGallery = [];
let tourActiveSlide = 0;

// Logging helpers
function logDebug(msg) {
    console.log(msg);
    if (debugConsole) {
        debugConsole.textContent += msg + "\n";
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
}

function logError(msg, err) {
    console.error(msg, err);
    if (debugConsole) {
        debugConsole.textContent += `[ERR] ${msg}: ${err ? err.message || err : ''}\n`;
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
}

// Distance helper (3D Euclidean distance to handle hand/finger angles and foreshortening)
function distance(p1, p2) {
    const dz = (p1.z !== undefined && p2.z !== undefined) ? (p1.z - p2.z) : 0;
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(dz, 2));
}

// Check if a finger is extended
function isFingerOpen(landmarks, tipIndex, pipIndex, wristIndex = 0) {
    return distance(landmarks[tipIndex], landmarks[wristIndex]) > distance(landmarks[pipIndex], landmarks[wristIndex]);
}

// Gesture detection rules
function detectGesture(landmarks) {
    const thumbOpen = isFingerOpen(landmarks, 4, 2);
    const indexOpen = isFingerOpen(landmarks, 8, 6);
    const middleOpen = isFingerOpen(landmarks, 12, 10);
    const ringOpen = isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = isFingerOpen(landmarks, 20, 18);
    
    // OK Gesture: Tip of thumb (4) and index (8) close together
    const thumbIndexDist = distance(landmarks[4], landmarks[8]);
    if (thumbIndexDist < 0.06 && middleOpen && ringOpen && pinkyOpen) {
        return "ok";
    }

    // L Gesture: Thumb and index open, others closed, with thumb extended wide
    const thumbIndexMcpDist = distance(landmarks[4], landmarks[5]);
    if (thumbOpen && indexOpen && !middleOpen && !ringOpen && !pinkyOpen && thumbIndexMcpDist > 0.08) {
        return "l_sign";
    }

    // Count open fingers (excluding thumb)
    const openFingersCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

    if (openFingersCount === 0) {
        if (thumbOpen && landmarks[4].y < landmarks[5].y) return "thumbs_up";
        return "fist";
    }
    
    if (openFingersCount === 1 && indexOpen) {
        return "index";
    }
    
    if (openFingersCount === 2 && indexOpen && middleOpen) {
        return "peace";
    }
    
    if (openFingersCount === 2 && indexOpen && pinkyOpen) {
        return "rock";
    }
    
    if (openFingersCount === 4) {
        return "open";
    }
    
    if (thumbOpen && openFingersCount === 1 && pinkyOpen) {
        return "call";
    }

    // Fallbacks to handle slightly messy positions
    if (indexOpen && middleOpen) return "peace";
    if (indexOpen) return "index";
    if (middleOpen && ringOpen && pinkyOpen) return "open";

    return "unknown";
}

// Repeating pattern generators
let ditherPattern = null;
function initDitherPattern(ctx) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 4;
    tempCanvas.height = 4;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    tempCtx.fillRect(0, 0, 1, 1);
    tempCtx.fillRect(2, 2, 1, 1);
    ditherPattern = ctx.createPattern(tempCanvas, 'repeat');
}

function drawDitherPattern(ctx, w, h) {
    if (!ditherPattern) {
        initDitherPattern(ctx);
    }
    ctx.save();
    ctx.fillStyle = ditherPattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

let mysticParticles = [];
class MysticParticle {
    constructor(x, y, radius) {
        // Spawn particles along the outer boundary of the circular shield
        const angle = Math.random() * Math.PI * 2;
        this.x = x + Math.cos(angle) * radius;
        this.y = y + Math.sin(angle) * radius;
        // Particle moves outwards with a circular spinning velocity bias
        const spinForce = 1.5 + Math.random() * 2.0;
        this.vx = (Math.cos(angle) * (0.5 + Math.random() * 1.5)) - (Math.sin(angle) * spinForce);
        this.vy = (Math.sin(angle) * (0.5 + Math.random() * 1.5)) + (Math.cos(angle) * spinForce);
        this.life = 1.0;
        this.decay = 0.015 + Math.random() * 0.025;
        this.color = Math.random() > 0.4 ? '#F07B3F' : '#FFD460';
        this.size = 1.5 + Math.random() * 3.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96; // slight drag
        this.vy *= 0.96;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let shieldAngle = 0;
function drawMysticShield(ctx, x, y, radius) {
    shieldAngle += 0.05; // Rotation speed
    
    // Spawn spark particles on the rim of the shield
    for (let i = 0; i < 4; i++) {
        mysticParticles.push(new MysticParticle(x, y, radius));
    }
    
    // Update and draw sparkles
    mysticParticles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    // Filter dead particles
    mysticParticles = mysticParticles.filter(p => p.life > 0 && p.x > 0 && p.y > 0);

    ctx.save();
    ctx.translate(x, y);
    
    // Core settings
    ctx.strokeStyle = '#F07B3F'; // Orange glow
    ctx.shadowColor = '#FFD460'; // Gold yellow glow
    ctx.shadowBlur = 12;
    
    // Outer glowing rim
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner dashed ring rotating clockwise
    ctx.save();
    ctx.rotate(shieldAngle);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // 12-pointed geometric star rotating counterclockwise
    ctx.save();
    ctx.rotate(-shieldAngle * 1.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.moveTo(0, -radius + 18);
        ctx.lineTo(0, radius - 18);
    }
    ctx.stroke();
    ctx.restore();

    // Solid inner ring
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 24, 0, Math.PI * 2);
    ctx.stroke();

    // Center core rotating sparks
    ctx.save();
    ctx.rotate(shieldAngle * 2.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
    }
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();
}

function drawVHSOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    const lineSpacing = 6;
    for (let y = 0; y < h; y += lineSpacing) {
        ctx.fillRect(0, y, w, 2);
    }
    
    // Tiny VHS watermark text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('PLAY 📁', 30, h - 30);
    const now = new Date();
    ctx.fillText(`JUN 19 2026  ${now.toTimeString().split(' ')[0]}`, w - 240, h - 30);
}

let matrixColumns = [];
function drawMatrixRain(ctx, w, h) {
    ctx.save();
    // Dark green tinted overlay
    ctx.fillStyle = 'rgba(0, 20, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 13px monospace';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 4;
    
    const cols = Math.floor(w / 14);
    if (matrixColumns.length !== cols) {
        matrixColumns = Array(cols).fill(0).map(() => Math.floor(Math.random() * -50));
    }
    
    for (let i = 0; i < matrixColumns.length; i++) {
        const char = String.fromCharCode(0x30A0 + Math.random() * 96);
        const x = i * 14;
        const y = matrixColumns[i] * 14;
        ctx.fillText(char, x, y);
        
        if (y > h && Math.random() > 0.97) {
            matrixColumns[i] = 0;
        } else {
            matrixColumns[i]++;
        }
    }
    ctx.restore();
}

function drawSpotlight(ctx, w, h, x, y) {
    // Create offscreen canvas for masking
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d');

    // Fill mask with dark overlay
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0.93)';
    maskCtx.fillRect(0, 0, w, h);

    // Cut out spotlight circle using destination-out
    maskCtx.globalCompositeOperation = 'destination-out';
    const gradient = maskCtx.createRadialGradient(x, y, 40, x, y, 160);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    maskCtx.beginPath();
    maskCtx.arc(x, y, 160, 0, 2 * Math.PI);
    maskCtx.fillStyle = gradient;
    maskCtx.fill();

    // Draw the mask on top of the main canvas
    ctx.drawImage(maskCanvas, 0, 0);
}

function drawDot(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#F07B3F';
    ctx.fill();
    ctx.shadowColor = '#F07B3F';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Frame processing loop
function onResults(results) {
    if (debugMediaPipe) debugMediaPipe.textContent = "Running";
    
    if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    let currentGesture = "unknown";
    let isMagnifying = false;

    // Detect magnifying glass (two hands doing "index" or "peace" sign)
    if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
        const gesture1 = detectGesture(results.multiHandLandmarks[0]);
        const gesture2 = detectGesture(results.multiHandLandmarks[1]);
        
        if ((gesture1 === "index" || gesture1 === "peace") && (gesture2 === "index" || gesture2 === "peace")) {
            const tip1 = results.multiHandLandmarks[0][8]; // index tip
            const tip2 = results.multiHandLandmarks[1][8]; // index tip
            
            const x1 = tip1.x * canvasElement.width;
            const y1 = tip1.y * canvasElement.height;
            const x2 = tip2.x * canvasElement.width;
            const y2 = tip2.y * canvasElement.height;
            
            const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            if (dist > 100) {
                isMagnifying = true;
                currentGesture = "magnify";
                
                // 1. Draw normal background video
                canvasCtx.filter = "none";
                canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                
                // 2. Draw spotlight shadow mask (dim the background)
                canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const radius = Math.max(70, dist / 2.2);
                
                // 3. Clip and draw the zoomed camera view (clear & bright)
                canvasCtx.save();
                canvasCtx.beginPath();
                canvasCtx.arc(midX, midY, radius, 0, Math.PI * 2);
                canvasCtx.clip();
                
                // Pinch to Zoom Scale Math
                const scale = Math.min(5.0, Math.max(1.2, dist / 150));
                let sx = midX - radius / scale;
                let sy = midY - radius / scale;
                let sWidth = (radius * 2) / scale;
                let sHeight = (radius * 2) / scale;
                
                if (sx < 0) { sWidth += sx; sx = 0; }
                if (sy < 0) { sHeight += sy; sy = 0; }
                if (sx + sWidth > videoElement.videoWidth) { sWidth = videoElement.videoWidth - sx; }
                if (sy + sHeight > videoElement.videoHeight) { sHeight = videoElement.videoHeight - sy; }
                
                if (sWidth > 0 && sHeight > 0) {
                    canvasCtx.drawImage(videoElement, sx, sy, sWidth, sHeight, midX - radius, midY - radius, sWidth * scale, sHeight * scale);
                }
                canvasCtx.restore();
                
                // 4. Draw glowing neon border around the lens
                canvasCtx.save();
                canvasCtx.beginPath();
                canvasCtx.arc(midX, midY, radius, 0, Math.PI * 2);
                canvasCtx.lineWidth = 8;
                canvasCtx.strokeStyle = 'var(--gc-yellow)';
                canvasCtx.shadowColor = 'var(--gc-yellow)';
                canvasCtx.shadowBlur = 20;
                canvasCtx.stroke();
                
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = '#ffffff';
                canvasCtx.shadowBlur = 0;
                canvasCtx.stroke();
                canvasCtx.restore();
                
                // 5. Draw active status text inside the lens
                canvasCtx.font = "bold 20px Arial";
                canvasCtx.fillStyle = "var(--gc-yellow)";
                canvasCtx.shadowColor = "rgba(0,0,0,0.5)";
                canvasCtx.shadowBlur = 4;
                canvasCtx.fillText(`ZOOM: ${scale.toFixed(1)}x`, midX - 50, midY + radius + 30);
                canvasCtx.shadowBlur = 0;
                
                drawDot(canvasCtx, x1, y1);
                drawDot(canvasCtx, x2, y2);
            }
        }
    }
    
    // Single-hand filter routing
    if (!isMagnifying) {
        let filterStr = "none";
        let trackingLandmarks = null;
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            trackingLandmarks = results.multiHandLandmarks[0];
            currentGesture = detectGesture(trackingLandmarks);
        }
        
        switch (currentGesture) {
            case "fist":
                filterStr = "grayscale(100%) contrast(200%) brightness(1.2)";
                break;
            case "peace":
                filterStr = "url(#vhs)";
                break;
            case "open":
                filterStr = "url(#water)";
                break;
            case "thumbs_up":
                filterStr = "invert(100%)";
                break;
            case "rock":
                filterStr = "sepia(100%) contrast(150%) hue-rotate(-30deg)";
                break;
            case "call":
                filterStr = "hue-rotate(200deg) saturate(300%)";
                break;
            case "ok":
                filterStr = "grayscale(100%) sepia(100%) hue-rotate(90deg) saturate(300%)";
                break;
            case "l_sign":
                filterStr = "none";
                break;
        }
        
        // Draw image with direct filter context
        canvasCtx.filter = filterStr;
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.filter = "none"; // reset for overlay drawings
        
        // Apply overlays
        if (currentGesture === "fist") {
            drawDitherPattern(canvasCtx, canvasElement.width, canvasElement.height);
        } else if (currentGesture === "peace") {
            drawVHSOverlay(canvasCtx, canvasElement.width, canvasElement.height);
        } else if (currentGesture === "ok") {
            drawMatrixRain(canvasCtx, canvasElement.width, canvasElement.height);
        } else if (currentGesture === "open" && trackingLandmarks) {
            const mcp = trackingLandmarks[9];
            const x = mcp.x * canvasElement.width;
            const y = mcp.y * canvasElement.height;
            const wrist = trackingLandmarks[0];
            const dx = (mcp.x - wrist.x) * canvasElement.width;
            const dy = (mcp.y - wrist.y) * canvasElement.height;
            const shieldRadius = Math.max(60, Math.sqrt(dx * dx + dy * dy) * 1.25);
            drawMysticShield(canvasCtx, x, y, shieldRadius);
        } else if (currentGesture === "l_sign") {
            canvasCtx.save();
            canvasCtx.globalCompositeOperation = 'difference';
            canvasCtx.drawImage(videoElement, 3, 3, canvasElement.width, canvasElement.height);
            canvasCtx.restore();
            
            canvasCtx.save();
            canvasCtx.filter = "contrast(250%) grayscale(100%) brightness(1.8) sepia(100%) hue-rotate(190deg) saturate(1200%)";
            canvasCtx.drawImage(canvasElement, 0, 0);
            canvasCtx.restore();
        } else if (currentGesture === "index" && trackingLandmarks) {
            const indexTip = trackingLandmarks[8];
            const x = indexTip.x * canvasElement.width;
            const y = indexTip.y * canvasElement.height;
            drawSpotlight(canvasCtx, canvasElement.width, canvasElement.height, x, y);
            drawDot(canvasCtx, x, y);
        }
        
        if (trackingLandmarks && currentGesture !== "index") {
            const indexTip = trackingLandmarks[8];
            drawDot(canvasCtx, indexTip.x * canvasElement.width, indexTip.y * canvasElement.height);
        }
    }
    
    if (debugGesture) debugGesture.textContent = currentGesture;
    canvasCtx.restore();
}

window.addEventListener('error', (event) => {
    logError("Unhandled error caught", event.error || event.message);
});

// Setup MediaPipe
logDebug("Initializing MediaPipe Hands...");
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);
if (debugMediaPipe) debugMediaPipe.textContent = "Loaded";
logDebug("MediaPipe Hands loaded successfully.");

let isCameraRunning = false;
async function processVideo() {
    if (!isCameraRunning) return;
    
    if (videoElement.readyState >= 2) {
        try {
            await hands.send({image: videoElement});
        } catch (err) {
            logError("MediaPipe process frame error", err);
        }
    }
    requestAnimationFrame(processVideo);
}

async function startCamera(deviceId) {
    logDebug("Requesting camera access...");
    if (debugCamera) debugCamera.textContent = "Requesting...";
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        
        videoElement.onloadedmetadata = async () => {
            try {
                await videoElement.play();
                isCameraRunning = true;
                logDebug("Camera playing successfully.");
                if (debugCamera) debugCamera.textContent = "Running";
                processVideo();
            } catch (err) {
                logError("Failed to play video element", err);
                if (debugCamera) debugCamera.textContent = "Play Blocked";
            }
        };
    } catch (error) {
        logError("Camera failed to start", error);
        if (debugCamera) debugCamera.textContent = "Failed";
        alert("Error accessing the camera: " + error.message);
    }
}

// Media Capture implementation
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordTimerInterval = null;
let recordDurationSec = 0;

function snapPhoto() {
    // Flash Animation
    canvasElement.style.filter = "brightness(3)";
    setTimeout(() => {
        canvasElement.style.filter = "none";
    }, 150);

    try {
        const dataUrl = canvasElement.toDataURL("image/jpeg", 0.9);
        addMediaItem({
            id: Date.now(),
            type: "image",
            url: dataUrl,
            date: new Date()
        });
        logDebug("Snapshot taken!");
    } catch (e) {
        logError("Failed to capture photo", e);
    }
}

function updateRecordingTimer() {
    const mins = String(Math.floor(recordDurationSec / 60)).padStart(2, '0');
    const secs = String(recordDurationSec % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
}

function startRecording() {
    recordedChunks = [];
    // Stream canvas content at 30 fps
    const stream = canvasElement.captureStream(30);
    
    // Add microphone audio if available
    navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
        audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
    }).catch(() => {
        logDebug("Audio source not added (mic permission denied or unavailable)");
    }).finally(() => {
        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordedChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                addMediaItem({
                    id: Date.now(),
                    type: "video",
                    url: videoUrl,
                    date: new Date()
                });
                logDebug("Video recording saved!");
            };
            
            mediaRecorder.start();
            isRecording = true;
            recordVideoBtn.classList.add('recording');
            timerDisplay.classList.add('active');
            recordDurationSec = 0;
            updateRecordingTimer();
            
            recordTimerInterval = setInterval(() => {
                recordDurationSec++;
                updateRecordingTimer();
            }, 1000);
            
            logDebug("Recording started...");
        } catch (err) {
            logError("Failed to start MediaRecorder", err);
        }
    });
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordVideoBtn.classList.remove('recording');
        timerDisplay.classList.remove('active');
        clearInterval(recordTimerInterval);
        logDebug("Recording stopped.");
    }
}

function addMediaItem(item) {
    mediaGallery.push(item);
    updateGalleryUI();
}

function updateGalleryUI() {
    galleryBadge.textContent = mediaGallery.length;
    galleryGrid.innerHTML = '';
    
    if (mediaGallery.length === 0) {
        galleryGrid.innerHTML = '<div class="empty-gallery-msg">No photos or videos captured yet. Make a gesture and click snap!</div>';
        return;
    }

    mediaGallery.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.url;
            div.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = item.url;
            video.muted = true;
            div.appendChild(video);
            
            const badge = document.createElement('span');
            badge.className = 'video-badge';
            badge.textContent = 'VIDEO';
            div.appendChild(badge);
        }
        
        div.addEventListener('click', () => showPreview(item));
        galleryGrid.appendChild(div);
    });
}

let activePreviewItem = null;
function showPreview(item) {
    activePreviewItem = item;
    previewContent.innerHTML = '';
    
    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        previewContent.appendChild(img);
    } else {
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.autoplay = true;
        previewContent.appendChild(video);
    }
    
    downloadPreviewBtn.href = item.url;
    downloadPreviewBtn.download = item.type === 'image' ? `photo_${item.id}.jpg` : `video_${item.id}.webm`;
    
    previewOverlay.classList.add('active');
}

function deletePreviewItem() {
    if (activePreviewItem) {
        mediaGallery = mediaGallery.filter(item => item.id !== activePreviewItem.id);
        updateGalleryUI();
        previewOverlay.classList.remove('active');
        activePreviewItem = null;
    }
}

// Onboarding logic
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.slide-dots .dot');

function updateOnboardingSlides() {
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === tourActiveSlide);
    });
    
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === tourActiveSlide);
    });

    prevSlideBtn.classList.toggle('disabled', tourActiveSlide === 0);
    
    if (tourActiveSlide === slides.length - 1) {
        nextSlideBtn.textContent = "Get Started";
    } else {
        nextSlideBtn.textContent = "Next";
    }
}

nextSlideBtn.addEventListener('click', () => {
    if (tourActiveSlide === slides.length - 1) {
        onboardingOverlay.classList.remove('active');
        localStorage.setItem('camNSheetTourCompleted', 'true');
    } else {
        tourActiveSlide++;
        updateOnboardingSlides();
    }
});

prevSlideBtn.addEventListener('click', () => {
    if (tourActiveSlide > 0) {
        tourActiveSlide--;
        updateOnboardingSlides();
    }
});

// Setup UI Handlers
toggleDebugBtn.addEventListener('click', () => {
    debugPanel.classList.toggle('collapsed');
});

snapPhotoBtn.addEventListener('click', snapPhoto);

recordVideoBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

galleryBtn.addEventListener('click', () => {
    galleryOverlay.classList.add('active');
});

closeGalleryBtn.addEventListener('click', () => {
    galleryOverlay.classList.remove('active');
});

closePreviewBtn.addEventListener('click', () => {
    previewOverlay.classList.remove('active');
});

deletePreviewBtn.addEventListener('click', deletePreviewItem);

helpBtn.addEventListener('click', () => {
    tourActiveSlide = 0;
    updateOnboardingSlides();
    onboardingOverlay.classList.add('active');
});

// Camera selector logic
async function initCameras() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            stream.getTracks().forEach(t => t.stop());
        });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        cameraSelect.innerHTML = '';
        
        if (videoDevices.length === 0) {
            cameraSelect.innerHTML = '<option>No camera found</option>';
            return;
        }

        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        });

        const savedCameraId = localStorage.getItem('selectedCameraId');
        let cameraToStart = videoDevices[0].deviceId;
        
        if (savedCameraId && videoDevices.some(d => d.deviceId === savedCameraId)) {
            cameraToStart = savedCameraId;
        }

        startCamera(cameraToStart);
        cameraSelect.value = cameraToStart;

        cameraSelect.addEventListener('change', (e) => {
            isCameraRunning = false;
            const deviceId = e.target.value;
            localStorage.setItem('selectedCameraId', deviceId);
            startCamera(deviceId);
        });

    } catch (error) {
        logError("Error enumerating devices", error);
        cameraSelect.innerHTML = '<option>Permission denied</option>';
        alert("Please grant camera permissions so we can list available webcams.");
    }
}

// Initial start checks
if (!localStorage.getItem('camNSheetTourCompleted')) {
    onboardingOverlay.classList.add('active');
}

initCameras();
updateGalleryUI();
updateOnboardingSlides();
