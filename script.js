const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const cameraSelect = document.getElementById('cameraSelect');

let currentStream = null;

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// More robust checking: is the tip further from the wrist than the PIP/MCP?
function isFingerOpen(landmarks, tipIndex, pipIndex, wristIndex = 0) {
    return distance(landmarks[tipIndex], landmarks[wristIndex]) > distance(landmarks[pipIndex], landmarks[wristIndex]);
}

function detectGesture(landmarks) {
    const thumbOpen = isFingerOpen(landmarks, 4, 2); // using MCP for thumb
    const indexOpen = isFingerOpen(landmarks, 8, 6);
    const middleOpen = isFingerOpen(landmarks, 12, 10);
    const ringOpen = isFingerOpen(landmarks, 16, 14);
    const pinkyOpen = isFingerOpen(landmarks, 20, 18);
    
    if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        // All fingers closed
        if (thumbOpen) return "thumbs_up";
        return "fist";
    } else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        return "peace";
    } else if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        return "index"; // Pointing is pointing, regardless of thumb
    } else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        return "open";
    } else if (indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
        return "rock";
    } else if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && pinkyOpen) {
        return "call";
    }
    
    // Fallback if slightly off
    if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return "index";
    
    return "unknown";
}

const vhsOverlay = document.getElementById('vhs-overlay');
const ditherOverlay = document.getElementById('dither-overlay');
const spotlightCanvas = document.getElementById('spotlight-overlay');
const spotlightCtx = spotlightCanvas.getContext('2d');

function applyFilter(gesture, landmarks) {
    // Set opacities cleanly without resetting first
    vhsOverlay.style.opacity = gesture === "peace" ? '1' : '0';
    ditherOverlay.style.opacity = gesture === "fist" ? '0.7' : '0';
    spotlightCanvas.style.opacity = gesture === "index" ? '1' : '0';
    
    switch (gesture) {
        case "fist": // Dither
            videoElement.style.filter = "grayscale(100%) contrast(200%) brightness(1.2)";
            break;
        case "peace": // VHS
            videoElement.style.filter = "url(#vhs)";
            break;
        case "index": // Spotlight
            videoElement.style.filter = "none";
            if (landmarks) {
                if (spotlightCanvas.width !== videoElement.videoWidth) {
                    spotlightCanvas.width = videoElement.videoWidth;
                    spotlightCanvas.height = videoElement.videoHeight;
                }
                
                spotlightCtx.clearRect(0, 0, spotlightCanvas.width, spotlightCanvas.height);
                spotlightCtx.fillStyle = 'rgba(0,0,0,0.95)';
                spotlightCtx.fillRect(0, 0, spotlightCanvas.width, spotlightCanvas.height);
                
                spotlightCtx.globalCompositeOperation = 'destination-out';
                const indexFingerTip = landmarks[8];
                const x = indexFingerTip.x * spotlightCanvas.width;
                const y = indexFingerTip.y * spotlightCanvas.height;
                
                const gradient = spotlightCtx.createRadialGradient(x, y, 50, x, y, 200);
                gradient.addColorStop(0, 'rgba(255,255,255,1)');
                gradient.addColorStop(1, 'rgba(255,255,255,0)');
                
                spotlightCtx.beginPath();
                spotlightCtx.arc(x, y, 200, 0, 2 * Math.PI);
                spotlightCtx.fillStyle = gradient;
                spotlightCtx.fill();
                spotlightCtx.globalCompositeOperation = 'source-over'; // reset
            }
            break;
        case "open": // Water
            videoElement.style.filter = "url(#water)";
            break;
        case "thumbs_up": // Invert
            videoElement.style.filter = "invert(100%)";
            break;
        case "rock": // Sepia
            videoElement.style.filter = "sepia(100%) contrast(150%) hue-rotate(-30deg)";
            break;
        case "call": // Psychedelic
            videoElement.style.filter = "hue-rotate(200deg) saturate(300%)";
            break;
        default:
            videoElement.style.filter = "none";
            break;
    }
}

function drawDot(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function onResults(results) {
    if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    let currentGesture = "unknown";
    let isMagnifying = false;

    // Magnifying Glass detection: Two hands, both doing "index" gesture
    if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
        const gesture1 = detectGesture(results.multiHandLandmarks[0]);
        const gesture2 = detectGesture(results.multiHandLandmarks[1]);
        
        if (gesture1 === "index" && gesture2 === "index") {
            const tip1 = results.multiHandLandmarks[0][8];
            const tip2 = results.multiHandLandmarks[1][8];
            
            const x1 = tip1.x * canvasElement.width;
            const y1 = tip1.y * canvasElement.height;
            const x2 = tip2.x * canvasElement.width;
            const y2 = tip2.y * canvasElement.height;
            
            const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // If the two index fingers are too close, it's likely a duplicate AI detection of the same hand.
            if (dist > 100) {
                isMagnifying = true;
                currentGesture = "magnify";
                applyFilter("none", null); // Clear filters
                
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const radius = Math.max(50, dist / 2);
                
                // Draw Magnifying Glass
                canvasCtx.save();
                canvasCtx.beginPath();
                canvasCtx.arc(midX, midY, radius, 0, Math.PI * 2);
                canvasCtx.clip();
            
            const scale = 2; // 2x Zoom
            let sx = midX - radius / scale;
            let sy = midY - radius / scale;
            let sWidth = (radius * 2) / scale;
            let sHeight = (radius * 2) / scale;
            
            // Clamp source coordinates to prevent DOMException
            if (sx < 0) { sWidth += sx; sx = 0; }
            if (sy < 0) { sHeight += sy; sy = 0; }
            if (sx + sWidth > videoElement.videoWidth) { sWidth = videoElement.videoWidth - sx; }
            if (sy + sHeight > videoElement.videoHeight) { sHeight = videoElement.videoHeight - sy; }
            
            if (sWidth > 0 && sHeight > 0) {
                // Draw scaled video inside the clip area
                canvasCtx.drawImage(videoElement, sx, sy, sWidth, sHeight, midX - radius, midY - radius, sWidth * scale, sHeight * scale);
            }
            
            // Draw glass border
            canvasCtx.lineWidth = 10;
            canvasCtx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
            canvasCtx.stroke();
            
            // Inner glow/reflection
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            canvasCtx.stroke();
            
            canvasCtx.restore();
            
            // Draw tracking dots
            drawDot(canvasCtx, x1, y1);
            drawDot(canvasCtx, x2, y2);
            
            canvasCtx.font = "30px Arial";
            canvasCtx.fillStyle = "white";
            canvasCtx.fillText("Gesture: " + currentGesture, 20, 50);
            }
        }
    }
    
    if (!isMagnifying && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Just use the first hand
        const landmarks = results.multiHandLandmarks[0];
        currentGesture = detectGesture(landmarks);
        
        const indexFingerTip = landmarks[8];
        const x = indexFingerTip.x * canvasElement.width;
        const y = indexFingerTip.y * canvasElement.height;
        drawDot(canvasCtx, x, y);
        
        applyFilter(currentGesture, landmarks);
        
        canvasCtx.font = "30px Arial";
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText("Gesture: " + currentGesture, 20, 50);
    } else if (!isMagnifying) {
        applyFilter("unknown", null);
    }

    canvasCtx.restore();
}

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

let isCameraRunning = false;
async function processVideo() {
    if (!isCameraRunning) return;
    
    if (videoElement.readyState >= 2) {
        await hands.send({image: videoElement});
    }
    requestAnimationFrame(processVideo);
}

async function startCamera(deviceId) {
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
        
        videoElement.onloadedmetadata = () => {
            isCameraRunning = true;
            processVideo();
        };
    } catch (error) {
        console.error("Camera failed to start:", error);
        alert("Error accessing the camera: " + error.message);
    }
}

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

        // Camera Rememberer Logic
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
            localStorage.setItem('selectedCameraId', deviceId); // Save to LocalStorage
            startCamera(deviceId);
        });

    } catch (error) {
        console.error("Error enumerating devices:", error);
        cameraSelect.innerHTML = '<option>Permission denied</option>';
        alert("Please grant camera permissions so we can list available webcams.");
    }
}

initCameras();
