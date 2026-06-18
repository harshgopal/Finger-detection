document.getElementById("ai").addEventListener("change", toggleAi)
document.getElementById("fps").addEventListener("input", changeFps)

const video = document.getElementById("video");
const c1 = document.getElementById('c1');
const ctx1 = c1.getContext('2d');
const fingerCountText = document.getElementById("fingerCount");
const fingerSummaryText = document.getElementById("fingerSummary");
const fingerStatusText = document.getElementById("fingerStatus");
var cameraAvailable = false;
var cameraStarting = false;
var aiEnabled = false;
var fps = 16;

/* Setting up the constraint */
var facingMode = "user"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
var constraints = {
    audio: false,
    video: {
        facingMode: facingMode
    }
};

/* Stream it to video element */
camera();
async function camera() {
    if (cameraAvailable || cameraStarting) {
        return;
    }

    const loadingText = document.getElementById("loadingText");
    cameraStarting = true;
    loadingText.innerText = "Waiting for camera permission";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraStarting = false;
        loadingText.innerText = "Camera is not supported in this browser. Use Chrome, Edge, or Firefox on localhost/HTTPS.";
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();

        if (video.readyState < 2) {
            await new Promise(resolve => {
                video.onloadedmetadata = resolve;
            });
        }

        cameraAvailable = true;
        loadingText.innerText = modelIsLoaded ? "Camera ready" : "Loading AI model...";
    } catch (err) {
        cameraAvailable = false;
        const errorMessages = {
            NotAllowedError: "Camera permission was blocked. Allow camera access in the browser and reload the page.",
            PermissionDeniedError: "Camera permission was blocked. Allow camera access in the browser and reload the page.",
            NotFoundError: "No camera was found on this device.",
            NotReadableError: "The camera is already being used by another app.",
            OverconstrainedError: "The selected camera settings are not available on this device."
        };

        loadingText.innerText = errorMessages[err.name] || `Camera error: ${err.message || err.name}`;
    } finally {
        cameraStarting = false;
    }
}

window.onload = function () {
    timerCallback();
}

function timerCallback() {
    if (isReady()) {
        setResolution();
        ctx1.drawImage(video, 0, 0, c1.width, c1.height);
        if (aiEnabled) {
            ai();
        }
    }
    setTimeout(timerCallback, fps);
}

function isReady() {
    if (modelIsLoaded && cameraAvailable) {
        document.getElementById("loadingText").style.display = "none";
        document.getElementById("ai").disabled = false;
        return true;
    } else {
        return false;
    }
}

function setResolution() {
    if (window.screen.width < video.videoWidth) {
        c1.width = window.screen.width * 0.9;
        let factor = c1.width / video.videoWidth;
        c1.height = video.videoHeight * factor;
    } else if (window.screen.height < video.videoHeight) {
        c1.height = window.screen.height * 0.50;
        let factor = c1.height / video.videoHeight;
        c1.width = video.videoWidth * factor;
    }
    else {
        c1.width = video.videoWidth;
        c1.height = video.videoHeight;
    }
};

function toggleAi() {
    aiEnabled = document.getElementById("ai").checked;
}

function changeFps() {
    fps = 1000 / document.getElementById("fps").value;
}

function ai() {
    // Detect hand in the canvas element
    handpose.predict(c1, results => {
        updateFingerOutput(results);

        for (let index = 0; index < results.length; index++) {
            const element = results[index];
            // box
            ctx1.beginPath();
            ctx1.strokeStyle = "green";
            ctx1.rect(element.boundingBox.topLeft[0], element.boundingBox.topLeft[1], element.boundingBox.bottomRight[0] - element.boundingBox.topLeft[0], element.boundingBox.bottomRight[1] - element.boundingBox.topLeft[1]);
            ctx1.stroke();
            ctx1.beginPath();
            ctx1.strokeStyle = "red";
            // thumb
            const thumb = element.annotations.thumb;
            ctx1.moveTo(thumb[0][0], thumb[0][1]);
            for (let i = 1; i < thumb.length; i++) {
                const ele = thumb[i];
                ctx1.lineTo(ele[0], ele[1]);
                ctx1.moveTo(ele[0], ele[1]);
            }
            // indexFinger
            const indexFinger = element.annotations.indexFinger;
            ctx1.moveTo(indexFinger[0][0], indexFinger[0][1]);
            for (let i = 1; i < indexFinger.length; i++) {
                const ele = indexFinger[i];
                ctx1.lineTo(ele[0], ele[1]);
                ctx1.moveTo(ele[0], ele[1]);
            }
            // middleFinger
            const middleFinger = element.annotations.middleFinger;
            ctx1.moveTo(middleFinger[0][0], middleFinger[0][1]);
            for (let i = 1; i < middleFinger.length; i++) {
                const ele = middleFinger[i];
                ctx1.lineTo(ele[0], ele[1]);
                ctx1.moveTo(ele[0], ele[1]);
            }
            // ringFinger
            const ringFinger = element.annotations.ringFinger;
            ctx1.moveTo(ringFinger[0][0], ringFinger[0][1]);
            for (let i = 1; i < ringFinger.length; i++) {
                const ele = ringFinger[i];
                ctx1.lineTo(ele[0], ele[1]);
                ctx1.moveTo(ele[0], ele[1]);
            }
            // pinky
            const pinky = element.annotations.pinky;
            ctx1.moveTo(pinky[0][0], pinky[0][1]);
            for (let i = 1; i < pinky.length; i++) {
                const ele = pinky[i];
                ctx1.lineTo(ele[0], ele[1]);
                ctx1.moveTo(ele[0], ele[1]);
            }
            ctx1.stroke();
            // palmBase
            const palmBase = element.annotations.palmBase;
            for (let i = 0; i < palmBase.length; i++) {
                ctx1.beginPath();
                ctx1.strokeStyle = "blue";
                const ele = palmBase[i];
                ctx1.arc(ele[0], ele[1], 10, 0, 2 * Math.PI);
                ctx1.stroke();
            }

            // landmarks
            const landmarks = element.landmarks;
            for (let i = 0; i < landmarks.length; i++) {
                ctx1.beginPath();
                ctx1.strokeStyle = "blue";
                const ele = landmarks[i];
                ctx1.arc(ele[0], ele[1], 2, 0, 2 * Math.PI);
                ctx1.fillStyle = "blue";
                ctx1.fill();
                ctx1.stroke();
            }
        }
    });
}

function updateFingerOutput(results) {
    if (!results.length) {
        showFingerOutput(0, "No hand detected");
        return;
    }

    const fingerCount = countRaisedFingers(results[0].landmarks);
    const label = fingerCount === 1 ? "finger" : "fingers";
    showFingerOutput(fingerCount, `${fingerCount} ${label} detected`);
}

function showFingerOutput(count, status) {
    fingerCountText.innerText = count;
    fingerSummaryText.innerText = count === 1 ? "1 finger" : `${count} fingers`;
    fingerStatusText.innerText = status;
}

function countRaisedFingers(landmarks) {
    const fingers = [
        { tip: 8, pip: 6, mcp: 5 },
        { tip: 12, pip: 10, mcp: 9 },
        { tip: 16, pip: 14, mcp: 13 },
        { tip: 20, pip: 18, mcp: 17 }
    ];

    let count = fingers.filter(finger => isFingerRaised(landmarks, finger)).length;

    if (isThumbRaised(landmarks)) {
        count++;
    }

    return count;
}

function isFingerRaised(landmarks, finger) {
    const wrist = landmarks[0];
    const tip = landmarks[finger.tip];
    const pip = landmarks[finger.pip];
    const mcp = landmarks[finger.mcp];

    return tip[1] < pip[1] && distance(tip, wrist) > distance(pip, wrist) && tip[1] < mcp[1];
}

function isThumbRaised(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const palmWidth = distance(indexMcp, pinkyMcp);
    const thumbOpenness = distance(thumbTip, indexMcp) - distance(thumbIp, indexMcp);

    return thumbOpenness > palmWidth * 0.22;
}

function distance(pointA, pointB) {
    return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
}

window.fingerCounter = {
    countRaisedFingers,
    isFingerRaised,
    isThumbRaised
};
