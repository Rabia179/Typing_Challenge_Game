
/* ==========================================
   TYPING CHALLENGE GAME
   Bubbles + KeyMagnet
========================================== */

const gameSettings = {
    easy: {
        bubbles: { time: 75, maxMisses: 7, speed: 34, spawn: 1400, maxBubbles: 5 },
        keymagnet: { time: 90, rounds: 20 }
    },
    medium: {
        bubbles: { time: 65, maxMisses: 6, speed: 48, spawn: 1050, maxBubbles: 6 },
        keymagnet: { time: 70, rounds: 20 }
    },
    hard: {
        bubbles: { time: 55, maxMisses: 5, speed: 65, spawn: 800, maxBubbles: 8 },
        keymagnet: { time: 55, rounds: 25 }
    }
};

const practiceKeySets = {
    home: "ASDFJKL".split(""),
    top: "QWERTYUIOPASDFJKL".split(""),
    all: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
};

/* GAME VARIABLES */

let currentMode = "bubbles";
let currentDifficulty = "easy";
let currentKeySet = "home";

let score = 0;
let correct = 0;
let incorrect = 0;
let misses = 0;
let level = 1;

let remainingTime = 0;
let totalRounds = 0;
let completedRounds = 0;

let isPlaying = false;

let bubbles = [];
let bubbleCounter = 0;

let targetKey = "";
let targetStartTime = 0;

let responseTimes = [];

let timerInterval = null;
let spawnInterval = null;
let animationFrame = null;
let nextTargetTimeout = null;
let feedbackTimeout = null;

let lastFrameTime = 0;

/* HTML ELEMENTS */

const homeScreen = document.getElementById("homeScreen");
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");

const setupIcon = document.getElementById("setupIcon");
const setupTitle = document.getElementById("setupTitle");
const setupDescription = document.getElementById("setupDescription");

const difficultySelect = document.getElementById("difficulty");
const keySetSelect = document.getElementById("keySet");
const keySetGroup = document.getElementById("keySetGroup");
const difficultyInfo = document.getElementById("difficultyInfo");

const gameTitle = document.getElementById("gameTitle");
const difficultyBadge = document.getElementById("difficultyBadge");

const scoreElement = document.getElementById("score");
const secondLabel = document.getElementById("secondLabel");
const secondStat = document.getElementById("secondStat");
const thirdLabel = document.getElementById("thirdLabel");
const thirdStat = document.getElementById("thirdStat");
const timerElement = document.getElementById("timer");

const bubbleArea = document.getElementById("bubbleArea");
const magnetArea = document.getElementById("magnetArea");
const bubbleContainer = document.getElementById("bubbleContainer");
const gameIntro = document.getElementById("gameIntro");

const targetKeyElement = document.getElementById("targetKey");
const feedbackElement = document.getElementById("feedback");

const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const finalScoreElement = document.getElementById("finalScore");
const resultStats = document.getElementById("resultStats");

const resultLabel = document.querySelector(".result-card .small-label");
const resultIcon = document.querySelector(".result-icon");

/* SCREEN MANAGEMENT */

function showScreen(screen) {
    [homeScreen, setupScreen, gameScreen, resultScreen]
        .forEach(item => item.classList.remove("active"));

    screen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
    stopGame();
    showScreen(homeScreen);
}

/* OPEN SETUP */

function openSetup(mode) {
    stopGame();

    currentMode = mode;

    difficultySelect.value = "easy";
    keySetSelect.value = "home";

    if (mode === "bubbles") {
        setupIcon.textContent = "✦";
        setupTitle.textContent = "Bubbles Challenge";
        setupDescription.textContent =
            "Pop floating letter bubbles by pressing their matching keys before they escape.";

        keySetGroup.classList.add("hidden");
    } else {
        setupIcon.textContent = "⌨";
        setupTitle.textContent = "KeyMagnet";
        setupDescription.textContent =
            "Follow the target letters, practice your keyboard skills and improve your accuracy.";

        keySetGroup.classList.remove("hidden");
    }

    updateDifficultyInfo();
    showScreen(setupScreen);
}

/* DIFFICULTY */

function updateDifficultyInfo() {
    const descriptions = {
        easy: "Easy: Relaxed speed and beginner-friendly practice.",
        medium: "Medium: Faster gameplay and more challenging targets.",
        hard: "Hard: High speed, quick reactions and tougher challenges."
    };

    difficultyInfo.textContent =
        descriptions[difficultySelect.value];
}

difficultySelect.addEventListener("change", updateDifficultyInfo);

/* START GAME */

function startGame() {
    if (isPlaying) return;

    currentDifficulty = difficultySelect.value;
    currentKeySet = keySetSelect.value;

    prepareGame();

    showScreen(gameScreen);

    isPlaying = true;

    const config = gameSettings[currentDifficulty][currentMode];

    remainingTime = config.time;
    timerElement.textContent = remainingTime;

    gameTitle.textContent =
        currentMode === "bubbles"
            ? "Bubbles Challenge"
            : "KeyMagnet";

    difficultyBadge.textContent =
        currentDifficulty.toUpperCase();

    if (currentMode === "bubbles") {
        startBubblesGame();
    } else {
        startKeyMagnetGame();
    }

    timerInterval = setInterval(() => {
        if (!isPlaying) return;

        remainingTime--;
        timerElement.textContent = remainingTime;

        if (remainingTime <= 0) {
            finishGame("Time is up! Your challenge has ended.");
        }
    }, 1000);
}

/* PREPARE GAME */

function prepareGame() {
    stopGame();

    score = 0;
    correct = 0;
    incorrect = 0;
    misses = 0;
    level = 1;

    remainingTime = 0;
    totalRounds = 0;
    completedRounds = 0;

    bubbles = [];
    bubbleCounter = 0;

    targetKey = "";
    targetStartTime = 0;

    responseTimes = [];

    scoreElement.textContent = "0";
    timerElement.textContent = "--";

    secondStat.textContent = "0";
    thirdStat.textContent = "0";

    bubbleContainer.innerHTML = "";
    gameIntro.classList.remove("hidden");

    targetKeyElement.textContent = "?";

    feedbackElement.textContent = "Your challenge is ready!";
    feedbackElement.style.color = "#a5b4cc";

    clearKeyboardHighlights();

    if (currentMode === "bubbles") {
        bubbleArea.classList.remove("hidden");
        magnetArea.classList.add("hidden");

        secondLabel.textContent = "MISSES";
        thirdLabel.textContent = "LEVEL";
    } else {
        bubbleArea.classList.add("hidden");
        magnetArea.classList.remove("hidden");

        secondLabel.textContent = "INCORRECT";
        thirdLabel.textContent = "CORRECT";
    }
}

/* RESET AND RESTART */

function resetGame() {
    if (!gameScreen.classList.contains("active")) return;

    prepareGame();

    feedbackElement.textContent = "Press Start Game to begin!";
}

function restartGame() {
    if (!gameScreen.classList.contains("active")) return;

    stopGame();
    startGame();
}

function playAgain() {
    showScreen(setupScreen);
    startGame();
}

/* STOP GAME */

function stopGame() {
    isPlaying = false;

    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    cancelAnimationFrame(animationFrame);
    clearTimeout(nextTargetTimeout);
    clearTimeout(feedbackTimeout);

    timerInterval = null;
    spawnInterval = null;
    animationFrame = null;
    nextTargetTimeout = null;
    feedbackTimeout = null;
}

/* SCORE */

function updateScore() {
    scoreElement.textContent = score;
}

function updateStatistics() {
    if (currentMode === "bubbles") {
        secondStat.textContent = misses;
        thirdStat.textContent = level;
    } else {
        secondStat.textContent = incorrect;
        thirdStat.textContent = correct;
    }
}

/* FEEDBACK */

function showFeedback(message, isCorrect) {
    feedbackElement.textContent = message;

    feedbackElement.style.color =
        isCorrect ? "#4ade80" : "#fb7185";

    clearTimeout(feedbackTimeout);

    feedbackTimeout = setTimeout(() => {
        if (isPlaying) feedbackElement.textContent = "";
    }, 1000);
}

/* BUBBLES GAME */

function startBubblesGame() {
    gameIntro.classList.add("hidden");

    const config = gameSettings[currentDifficulty].bubbles;

    for (let i = 0; i < 5; i++) {
        createBubble(true);
    }

    lastFrameTime = 0;

    animationFrame = requestAnimationFrame(moveBubbles);

    spawnInterval = setInterval(() => {
        if (isPlaying && bubbles.length < config.maxBubbles) {
            createBubble(false);
        }
    }, config.spawn);

    showFeedback("Pop the bubbles! Press matching letters.", true);
}

function createBubble(initial = false) {
    if (!isPlaying) return;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const letter = letters[
        Math.floor(Math.random() * letters.length)
    ];

    const width = bubbleContainer.clientWidth;
    const height = bubbleContainer.clientHeight;

    const size = window.innerWidth <= 560 ? 45 : 54;

    const x = Math.random() * Math.max(0, width - size);

    const y = initial
        ? height - size - Math.random() * 150
        : height + 10;

    const colors = [
        "#0891b2",
        "#2563eb",
        "#7c3aed",
        "#db2777",
        "#ea580c",
        "#0d9488"
    ];

    const element = document.createElement("div");

    element.className = "bubble";
    element.textContent = letter;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    element.style.background =
        colors[Math.floor(Math.random() * colors.length)];

    bubbleContainer.appendChild(element);

    bubbles.push({
        id: bubbleCounter++,
        letter,
        x,
        y,
        element,
        createdAt: performance.now()
    });
}

function moveBubbles(timestamp) {
    if (!isPlaying || currentMode !== "bubbles") return;

    if (!lastFrameTime) lastFrameTime = timestamp;

    const delta = Math.min(
        (timestamp - lastFrameTime) / 1000,
        0.05
    );

    lastFrameTime = timestamp;

    const config = gameSettings[currentDifficulty].bubbles;

    level = Math.floor(score / 50) + 1;

    const speed = config.speed + (level - 1) * 5;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];

        bubble.y -= speed * delta;
        bubble.element.style.top = `${bubble.y}px`;

        if (bubble.y < -60) {
            bubble.element.remove();
            bubbles.splice(i, 1);

            misses++;

            updateStatistics();

            showFeedback("Missed! Stay alert.", false);

            if (misses >= config.maxMisses) {
                finishGame("Too many bubbles escaped!");
                return;
            }
        }
    }

    updateStatistics();

    animationFrame = requestAnimationFrame(moveBubbles);
}

function handleBubbleInput(key) {
    const index = bubbles.findIndex(
        bubble => bubble.letter === key
    );

    if (index !== -1) {
        const selected = bubbles[index];

        responseTimes.push(
            performance.now() - selected.createdAt
        );

        selected.element.remove();
        bubbles.splice(index, 1);

        score += 10;
        correct++;

        updateScore();
        updateStatistics();

        showFeedback(`Great! ${key} popped. +10 points`, true);
    } else {
        incorrect++;
        score = Math.max(0, score - 3);

        updateScore();
        updateStatistics();

        showFeedback("Wrong key! -3 points", false);
    }
}

/* KEYMAGNET GAME */

function startKeyMagnetGame() {
    totalRounds =
        gameSettings[currentDifficulty].keymagnet.rounds;

    completedRounds = 0;
    responseTimes = [];

    showNextTarget();
}

function getAvailableKeys() {
    return practiceKeySets[currentKeySet];
}

function showNextTarget() {
    if (!isPlaying) return;

    if (completedRounds >= totalRounds) {
        finishGame("Amazing! You completed every target.");
        return;
    }

    const keys = getAvailableKeys();

    let nextKey = keys[
        Math.floor(Math.random() * keys.length)
    ];

    if (keys.length > 1 && nextKey === targetKey) {
        const otherKeys = keys.filter(
            key => key !== targetKey
        );

        nextKey = otherKeys[
            Math.floor(Math.random() * otherKeys.length)
        ];
    }

    targetKey = nextKey;

    targetKeyElement.textContent = targetKey;

    clearKeyboardHighlights();

    const matchingKey = document.querySelector(
        `.key-row span[data-key="${targetKey}"]`
    );

    if (matchingKey) {
        matchingKey.classList.add("active-key");
    }

    targetStartTime = performance.now();

    feedbackElement.textContent =
        `Find the letter ${targetKey} on your keyboard`;

    feedbackElement.style.color = "#22d3ee";
}

function handleMagnetInput(key) {
    if (!targetKey) return;

    const keyboardKey = document.querySelector(
        `.key-row span[data-key="${key}"]`
    );

    if (keyboardKey) {
        keyboardKey.classList.add("pressed-key");

        setTimeout(() => {
            keyboardKey.classList.remove("pressed-key");
        }, 250);
    }

    if (key === targetKey) {
        responseTimes.push(
            performance.now() - targetStartTime
        );

        correct++;
        completedRounds++;
        score += 10;

        updateScore();
        updateStatistics();

        showFeedback(
            `Correct! +10 points (${completedRounds}/${totalRounds})`,
            true
        );

        targetKeyElement.textContent = "✓";

        clearKeyboardHighlights();

        nextTargetTimeout = setTimeout(() => {
            nextTargetTimeout = null;

            if (isPlaying) showNextTarget();
        }, 450);

    } else {
        incorrect++;
        score = Math.max(0, score - 2);

        updateScore();
        updateStatistics();

        showFeedback("Not quite! Try the highlighted key.", false);
    }
}

/* KEYBOARD HIGHLIGHTS */

function clearKeyboardHighlights() {
    document.querySelectorAll(".key-row span").forEach(key => {
        key.classList.remove("active-key", "pressed-key");
    });
}

/* KEYBOARD INPUT */

document.addEventListener("keydown", function(event) {
    if (!isPlaying) return;

    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "SELECT" ||
        event.target.tagName === "TEXTAREA"
    ) return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z]$/.test(key)) return;

    if (currentMode === "bubbles") {
        handleBubbleInput(key);
    } else {
        handleMagnetInput(key);
    }
});

/* FINISH GAME */

function finishGame(message) {
    if (!isPlaying) return;

    stopGame();

    bubbleContainer.innerHTML = "";

    clearKeyboardHighlights();

    showScreen(resultScreen);

    finalScoreElement.textContent = score;

    if (currentMode === "bubbles") {
        showBubbleResults(message);
    } else {
        showMagnetResults(message);
    }
}

/* RESULT HELPERS */

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getAccuracy() {
    const attempts = correct + incorrect;

    return attempts > 0
        ? Math.round(correct / attempts * 100)
        : 0;
}

function getAverageTime() {
    if (!responseTimes.length) return 0;

    return responseTimes.reduce(
        (sum, time) => sum + time, 0
    ) / responseTimes.length / 1000;
}

function resultItem(label, value) {
    return `
        <div class="result-stat">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

/* BUBBLES RESULTS */

function showBubbleResults(message) {
    resultLabel.textContent = "BUBBLES RESULTS";
    resultIcon.textContent = "✦";

    resultTitle.textContent = `${score} Points`;
    resultMessage.textContent = message;

    const attempts = correct + incorrect + misses;

    const accuracy = attempts > 0
        ? Math.round(correct / attempts * 100)
        : 0;

    resultStats.innerHTML =
        resultItem("Correct", correct) +
        resultItem("Incorrect", incorrect) +
        resultItem("Missed Bubbles", misses) +
        resultItem("Accuracy", accuracy + "%") +
        resultItem("Average Response", getAverageTime().toFixed(2) + " sec") +
        resultItem("Final Level", level) +
        resultItem("Difficulty", capitalize(currentDifficulty));
}

/* KEYMAGNET RESULTS */

function showMagnetResults(message) {
    resultLabel.textContent = "KEYMAGNET RESULTS";
    resultIcon.textContent = "⌨";

    resultTitle.textContent = `${score} Points`;
    resultMessage.textContent = message;

    resultStats.innerHTML =
        resultItem("Correct", correct) +
        resultItem("Incorrect", incorrect) +
        resultItem("Accuracy", getAccuracy() + "%") +
        resultItem("Average Response", getAverageTime().toFixed(2) + " sec") +
        resultItem("Completed Targets", `${completedRounds}/${totalRounds}`) +
        resultItem("Practice Set", capitalize(currentKeySet)) +
        resultItem("Difficulty", capitalize(currentDifficulty));
}

/* INITIAL STATE */

updateDifficultyInfo();

console.log("Typing Challenge Game is ready!");
