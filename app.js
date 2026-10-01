console.log("GYM TRACKER APP JS - VERSION 20");

let workouts = [];
let activeWorkout = null;

const savedPlan =
    localStorage.getItem("workout-plan");

if (savedPlan) {
    workouts = JSON.parse(savedPlan);
}



const workoutContainer =
    document.getElementById("workout");

const daySelection =
    document.getElementById("day-selection");

restoreActiveWorkout();

function selectDay(dayIndex) {

    const savedActiveWorkout =
        localStorage.getItem("active-workout");

    if (savedActiveWorkout) {

        try {

            const savedWorkout =
                JSON.parse(savedActiveWorkout);

            if (
                savedWorkout &&
                savedWorkout.sessionId &&
                savedWorkout.startedAt
            ) {

                activeWorkout =
                    savedWorkout;

                // Same day → resume it
                if (
                    activeWorkout.dayIndex === dayIndex
                ) {

                    daySelection.style.display =
                        "none";

                    displayWorkout(
                        activeWorkout.dayIndex
                    );

                    return;
                }

                // Different day → don't start another workout
                alert(
                    "You already have an active workout.\n\nFinish or reset Day " +
                    (activeWorkout.dayIndex + 1) +
                    " before starting another day."
                );

                return;
            }

        } catch (error) {

            console.error(
                "Could not read active workout:",
                error
            );

            localStorage.removeItem(
                "active-workout"
            );
        }
    }

    // No active workout → create a new one
    daySelection.style.display = "none";

    activeWorkout = {

        dayIndex: dayIndex,

        startedAt: null,

        sessionId: null,

        exercises: []

    };

    showWorkoutStart(dayIndex);
}

function showWorkoutStart(dayIndex) {

    const workout =
        workouts[dayIndex];

    workoutContainer.innerHTML = `

        <button
            type="button"
            onclick="goBack()"
        >
            ← Back
        </button>

        <h2>${workout.name}</h2>

        <p>
            ${workout.exercises.length} exercises
        </p>

        <button
            type="button"
            onclick="startWorkout()"
        >
            Start Workout
        </button>
    `;
}

function startWorkout() {

    if (!activeWorkout) {
        return;
    }

    activeWorkout.startedAt =
        new Date().toISOString();

    activeWorkout.sessionId =
        crypto.randomUUID();

    activeWorkout.exercises =
        activeWorkout.exercises || [];

    localStorage.setItem(
        "active-workout",
        JSON.stringify(activeWorkout)
    );

    console.log(
        "Active workout saved:",
        activeWorkout
    );

    displayWorkout(
        activeWorkout.dayIndex
    );
}

function restoreActiveWorkout() {

    const savedActiveWorkout =
        localStorage.getItem(
            "active-workout"
        );

    if (!savedActiveWorkout) {
        return false;
    }

    try {

        activeWorkout =
            JSON.parse(
                savedActiveWorkout
            );

        if (
            activeWorkout &&
            activeWorkout.sessionId &&
            activeWorkout.dayIndex !== undefined
        ) {
            displayWorkout(
                activeWorkout.dayIndex
            );

            daySelection.style.display =
                "none";

            return true;
        }

    } catch (error) {

        console.error(
            "Could not restore active workout:",
            error
        );

        localStorage.removeItem(
            "active-workout"
        );
    }

    return false;
}

function saveExercise(dayIndex, exerciseIndex) {

    if (!activeWorkout) {
        alert("No active workout.");
        return;
    }

    const workout =
        workouts[dayIndex];

    const exercise =
        workout.exercises[exerciseIndex];

    const weightInput =
        document.getElementById(
            `weight-${dayIndex}-${exerciseIndex}`
        );
    
    const commentInput =
        document.getElementById(
            `comment-${dayIndex}-${exerciseIndex}`
        );

    if (!weightInput) {
        return;
    }

    const sets = [];

    for (
        let i = 0;
        i < exercise.sets;
        i++
    ) {

        const repsInput =
            document.getElementById(
                `reps-${dayIndex}-${exerciseIndex}-${i}`
            );

        sets.push({
            reps: repsInput
                ? repsInput.value
                : ""
        });
    }

    const savedExercise = {

        exerciseName:
            exercise.name,
    
        weight:
            weightInput.value,
    
        sets:
            sets,
    
        comment:
            commentInput
                ? commentInput.value
                : ""
    };

    // Make sure exercises exists
    activeWorkout.exercises =
        activeWorkout.exercises || [];

    // Check if this exercise was already saved
    const existingIndex =
        activeWorkout.exercises.findIndex(
            saved =>
                saved.exerciseName ===
                exercise.name
        );

    if (existingIndex !== -1) {

        // Update existing exercise
        activeWorkout.exercises[
            existingIndex
        ] = savedExercise;

    } else {

        // Add new exercise
        activeWorkout.exercises.push(
            savedExercise
        );
    }

    // Save the updated active workout
    localStorage.setItem(
        "active-workout",
        JSON.stringify(activeWorkout)
    );

    console.log(
        "Exercise saved:",
        savedExercise
    );

    const saveButton =
            document.getElementById(
                `save-exercise-${dayIndex}-${exerciseIndex}`
            );

        if (saveButton) {

            saveButton.textContent =
                "Exercise Saved ✓";

            saveButton.classList.add(
                "exercise-saved"
            );
        }
}



function displayWorkout(dayIndex) {

    const workout =
        workouts[dayIndex];

    let html = `

        <button
            type="button"
            onclick="goBack()"
        >
            ← Back
        </button>

        <h2>${workout.name}</h2>
    `;

    workout.exercises.forEach(
        (exercise, exerciseIndex) => {

            html += `

                <div class="exercise">

                    <h2>
                        ${exercise.name}
                    </h2>

                    <div class="target">

                        ${exercise.sets}
                        ×
                        ${exercise.minReps}–${exercise.maxReps}
                        /
                        ${exercise.rir} RIR
                        /
                        ${exercise.rest} min

                    </div>

                    ${displayPreviousWorkout(
                        dayIndex,
                        exercise.name
                    )}

                    ${createSets(
                        dayIndex,
                        exerciseIndex,
                        exercise
                    )}
                    
                    <textarea
                        class="exercise-comment"
                        id="comment-${dayIndex}-${exerciseIndex}"
                        placeholder="Comment (optional)"
                    ></textarea>
                    
                    <button
                        type="button"
                        class="save-exercise-button"
                        id="save-exercise-${dayIndex}-${exerciseIndex}"
                        onclick="saveExercise(${dayIndex}, ${exerciseIndex})"
                    >
                        Save Exercise
                    </button>

                    ${displayHistory(
                        dayIndex,
                        exercise.name
                    )}

                </div>
            `;
        }
    );

    html += `

        <button
            type="button"
            onclick="finishWorkout()"
        >
            Finish Workout
        </button>

        <button
            type="button"
            class="secondary-button"
            onclick="resetSession()"
        >
            Reset Session
        </button>
    `;

    workoutContainer.innerHTML = html;

    restoreExerciseComments();

    updateSaveExerciseButtons();
}

function restoreExerciseComments() {

    if (!activeWorkout) {
        return;
    }

    activeWorkout.exercises?.forEach(
        savedExercise => {

            const exerciseIndex =
                workouts[activeWorkout.dayIndex]
                    .exercises
                    .findIndex(
                        exercise =>
                            exercise.name ===
                            savedExercise.exerciseName
                    );

            if (exerciseIndex === -1) {
                return;
            }

            const commentInput =
                document.getElementById(
                    `comment-${activeWorkout.dayIndex}-${exerciseIndex}`
                );

            if (commentInput) {

                commentInput.value =
                    savedExercise.comment || "";
            }
        }
    );
}

function updateSaveExerciseButtons() {

    const savedActiveWorkout =
        localStorage.getItem("active-workout");

    if (!savedActiveWorkout) {
        return;
    }

    let savedWorkout;

    try {

        savedWorkout =
            JSON.parse(savedActiveWorkout);

    } catch (error) {

        console.error(
            "Could not read active workout:",
            error
        );

        return;
    }

    const savedExercises =
        savedWorkout.exercises || [];

    savedExercises.forEach(
        savedExercise => {

            const exerciseIndex =
                workouts[savedWorkout.dayIndex]
                    .exercises
                    .findIndex(
                        exercise =>
                            exercise.name ===
                            savedExercise.exerciseName
                    );

            if (exerciseIndex === -1) {
                return;
            }

            const button =
                document.getElementById(
                    `save-exercise-${savedWorkout.dayIndex}-${exerciseIndex}`
                );

            if (!button) {
                return;
            }

            button.textContent =
                "Exercise Saved ✓";

            button.classList.add(
                "exercise-saved"
            );
        }
    );
}


function createSets(
    dayIndex,
    exerciseIndex,
    exercise
) {

    let html = "";

    /*
     * Current active workout
     */
    const activeExercise =
        activeWorkout?.exercises?.find(
            savedExercise =>
                savedExercise.exerciseName ===
                exercise.name
        );

    /*
     * Previous completed workout
     */
    let previousWorkout = null;

    if (!activeExercise) {

        const savedSessions =
            localStorage.getItem(
                "workout-sessions"
            );

        const sessions =
            savedSessions
                ? JSON.parse(savedSessions)
                : [];

        const previousSession =
            sessions
                .filter(session =>
                    session.dayIndex === dayIndex &&
                    session.exercises.some(
                        savedExercise =>
                            savedExercise.exerciseName ===
                            exercise.name
                    )
                )
                .sort(
                    (a, b) =>
                        new Date(b.completedAt) -
                        new Date(a.completedAt)
                )[0];

        previousWorkout =
            previousSession
                ? previousSession.exercises.find(
                    savedExercise =>
                        savedExercise.exerciseName ===
                        exercise.name
                )
                : null;
    }

    /*
     * Active workout takes priority.
     * Otherwise use previous workout.
     */
    const workoutData =
        activeExercise ||
        previousWorkout;

    const previousWeight =
        workoutData?.weight || "";

    /*
     * Weight
     */
    html += `
        <div class="weight-input">

            <label>
                Weight
            </label>

            <input
                type="text"
                readonly
                class="number-picker-input"
                value="${previousWeight}"
                placeholder="Select kg"
                id="weight-${dayIndex}-${exerciseIndex}"
                onclick="openNumberPicker(
                    'weight',
                    'weight-${dayIndex}-${exerciseIndex}'
                )"
            >

        </div>
    `;

    /*
     * Reps
     */
    for (
        let i = 0;
        i < exercise.sets;
        i++
    ) {

        const previousSet =
            workoutData?.sets?.[i];

        const previousReps =
            previousSet?.reps || "";

        html += `
            <div class="set">

                <strong>
                    Set ${i + 1}
                </strong>

                <input
                    type="text"
                    readonly
                    class="number-picker-input"
                    value="${previousReps}"
                    placeholder="Select reps"
                    id="reps-${dayIndex}-${exerciseIndex}-${i}"
                    onclick="openNumberPicker(
                        'reps',
                        'reps-${dayIndex}-${exerciseIndex}-${i}'
                    )"
                >

            </div>
        `;
    }

    return html;
}







function displayPreviousWorkout(
    dayIndex,
    exerciseName
) {

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    const previousSession =
        sessions
            .filter(session =>
                session.dayIndex === dayIndex &&
                session.exercises.some(
                    exercise =>
                        exercise.exerciseName ===
                        exerciseName
                )
            )
            .sort(
                (a, b) =>
                    new Date(b.completedAt) -
                    new Date(a.completedAt)
            )[0];

    if (!previousSession) {

        return `
            <div class="previous">
                No previous workout
            </div>
        `;
    }

    const previousExercise =
        previousSession.exercises.find(
            exercise =>
                exercise.exerciseName ===
                exerciseName
        );

    if (!previousExercise) {
        return "";
    }

    const date =
        formatDate(
            previousSession.completedAt
        );

    const weight =
        previousExercise.weight || "";

    const reps =
        previousExercise.sets
            .map(set => set.reps)
            .join(" / ");

    const comment =
        previousExercise.comment || "";

    return `
        <div class="previous">

            <strong>
                Previous: ${date}
            </strong>

            <br>

            ${weight} kg —
            ${reps}

            ${
                comment
                    ? `
                        <div class="previous-comment">
                            ${comment}
                        </div>
                    `
                    : ""
            }

        </div>
    `;
}





function displayHistory(
    dayIndex,
    exerciseName
) {

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    const exerciseHistory =
        sessions
            .filter(session =>
                session.dayIndex === dayIndex &&
                session.exercises.some(
                    exercise =>
                        exercise.exerciseName ===
                        exerciseName
                )
            )
            .sort(
                (a, b) =>
                    new Date(b.completedAt) -
                    new Date(a.completedAt)
            )
            .slice(0, 3);

    if (exerciseHistory.length === 0) {
        return "";
    }

    let html = `
        <div class="history">

            <h3>Last 3 workouts</h3>

            <div class="history-row history-header">

                <strong>Date</strong>

                <strong>Weight</strong>

                <strong>Reps</strong>

            </div>
    `;

    exerciseHistory.forEach(
        session => {

            const exercise =
                session.exercises.find(
                    exercise =>
                        exercise.exerciseName ===
                        exerciseName
                );

            if (!exercise) {
                return;
            }

            const date =
                formatDate(
                    session.completedAt
                );

            const weight =
                exercise.weight || "";

            const reps =
                exercise.sets
                    .map(
                        set => set.reps
                    )
                    .join(" / ");

            html += `
                <div class="history-row">

                    <span>
                        ${date}
                    </span>

                    <span>
                        ${weight} kg
                    </span>

                    <span>
                        ${reps}
                    </span>

                </div>
            `;
        }
    );

    html += `
        </div>
    `;

    return html;
}



function hasUnsavedChanges() {

    if (!activeWorkout) {
        return false;
    }

    const savedExercises =
        activeWorkout.exercises || [];

    const dayIndex =
        activeWorkout.dayIndex;

    const workout =
        workouts[dayIndex];

    for (
        let exerciseIndex = 0;
        exerciseIndex < workout.exercises.length;
        exerciseIndex++
    ) {

        const exercise =
            workout.exercises[exerciseIndex];

        const weightInput =
            document.getElementById(
                `weight-${dayIndex}-${exerciseIndex}`
            );

        if (!weightInput) {
            continue;
        }

        const savedExercise =
            savedExercises.find(
                saved =>
                    saved.exerciseName ===
                    exercise.name
            );

        // Exercise has never been saved
        if (!savedExercise) {
            return true;
        }

        // Weight changed
        if (
            weightInput.value !==
            (savedExercise.weight || "")
        ) {
            return true;
        }

        // Check reps
        for (
            let i = 0;
            i < exercise.sets;
            i++
        ) {

            const repsInput =
                document.getElementById(
                    `reps-${dayIndex}-${exerciseIndex}-${i}`
                );

            const currentReps =
                repsInput
                    ? repsInput.value
                    : "";

            const savedReps =
                savedExercise.sets?.[i]?.reps || "";

            if (
                currentReps !==
                savedReps
            ) {
                return true;
            }
        }
    }

    return false;
}


function saveAllExercises() {

    if (!activeWorkout) {
        return;
    }

    const dayIndex =
        activeWorkout.dayIndex;

    const workout =
        workouts[dayIndex];

    activeWorkout.exercises =
        activeWorkout.exercises || [];

    workout.exercises.forEach(
        (exercise, exerciseIndex) => {

            const weightInput =
                document.getElementById(
                    `weight-${dayIndex}-${exerciseIndex}`
                );

            const commentInput =
                document.getElementById(
                    `comment-${dayIndex}-${exerciseIndex}`
                );

            const weight =
                weightInput
                    ? weightInput.value
                    : "";

            const sets = [];

            for (
                let i = 0;
                i < exercise.sets;
                i++
            ) {

                const repsInput =
                    document.getElementById(
                        `reps-${dayIndex}-${exerciseIndex}-${i}`
                    );

                sets.push({
                    reps: repsInput
                        ? repsInput.value
                        : ""
                });
            }

            const savedExercise = {

                exerciseName:
                    exercise.name,

                weight:
                    weight,

                sets:
                    sets,

                comment:
                    commentInput
                        ? commentInput.value
                        : ""
            };

            const existingIndex =
                activeWorkout.exercises.findIndex(
                    saved =>
                        saved.exerciseName ===
                        exercise.name
                );

            if (existingIndex !== -1) {

                activeWorkout.exercises[
                    existingIndex
                ] = savedExercise;

            } else {

                activeWorkout.exercises.push(
                    savedExercise
                );
            }
        }
    );

    localStorage.setItem(
        "active-workout",
        JSON.stringify(activeWorkout)
    );
}

function finishWorkout() {

    if (!activeWorkout) {
        alert("No active workout.");
        return;
    }

    const confirmed =
        confirm(
            "Finish this workout?\n\n" +
            "All current exercise entries will be saved."
        );

    if (!confirmed) {
        return;
    }

    // Save all current entries first
    saveAllExercises();

    const completedAt =
        new Date().toISOString();

    const workout =
        workouts[activeWorkout.dayIndex];

    const session = {

        sessionId:
            activeWorkout.sessionId,

        dayIndex:
            activeWorkout.dayIndex,

        dayName:
            workout.name,

        startedAt:
            activeWorkout.startedAt,

        completedAt:
            completedAt,

        exercises:
            activeWorkout.exercises || []

    };

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    sessions.push(session);

    localStorage.setItem(
        "workout-sessions",
        JSON.stringify(sessions)
    );

    // Remove active workout
    localStorage.removeItem(
        "active-workout"
    );

    activeWorkout = null;

    alert(
        "Workout completed and saved."
    );

    workoutContainer.innerHTML = "";

    daySelection.style.display =
        "block";
}

function resetSession() {

    const confirmed =
        confirm(
            "Reset this workout?\n\nYour current entries will be discarded. Your workout history will not be affected."
        );

    if (!confirmed) {
        return;
    }

    // Remove the persistent active workout
    localStorage.removeItem("active-workout");

    // Remove the in-memory active workout
    activeWorkout = null;

    // Clear the workout screen
    workoutContainer.innerHTML = "";

    // Return to day selection
    daySelection.style.display = "block";

    console.log(
        "Active workout after reset:",
        localStorage.getItem("active-workout")
    );
}



function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short"
        }
    );
}

function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    return date.toLocaleTimeString(
        "en-GB",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}



function goBack() {

    workoutContainer.innerHTML = "";

    daySelection.style.display = "block";
}

function importPlan() {
    const confirmed =
    confirm(
        "Warning: importing a new workout plan will replace your current plan.\n\nYour workout history will NOT be deleted.\n\nDo you want to continue?"
    );

if (!confirmed) {
    return;
}

    const fileInput =
        document.getElementById("plan-file");

    const file =
        fileInput.files[0];

    if (!file) {
        alert("Please select a CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {

        const csv =
            event.target.result;

        const rows =
            csv
                .trim()
                .split(/\r?\n/);

        // Remove the header row
        rows.shift();

        const importedWorkouts = {};

        rows.forEach(row => {

            const columns =
                row
                    .split(",")
                    .map(column => column.trim());

            const day =
                columns[0];

            const dayName =
                columns[1];

            const exerciseName =
                columns[2];

            const sets =
                columns[3];

            const rep =
                columns[4];

            const rir =
                columns[5];

            const rest =
                columns[6];


            if (!day || !exerciseName) {
                return;
            }


            if (!importedWorkouts[day]) {

                importedWorkouts[day] = {

                    name: dayName,

                    exercises: []

                };

            }


            const repParts =
            rep.split(/[-–—]/);


            importedWorkouts[day].exercises.push({

                name: exerciseName,

                sets: Number(sets),

                minReps:
                    Number(repParts[0]),

                maxReps:
                    Number(repParts[1]),

                rir: rir,

                rest: Number(rest)

            });

        });


        const plan =
            Object.values(importedWorkouts);


        console.log(
            "Imported plan:",
            plan
        );


        localStorage.setItem(
            "workout-plan",
            JSON.stringify(plan)
        );


        workouts = plan;


        displayDayButtons();


        alert(
            `Plan imported successfully: ${plan.length} days`
        );

    };


    reader.readAsText(file);
}


function displayDayButtons() {

    const container =
        document.getElementById("day-buttons");

    container.innerHTML = "";

    workouts.forEach(
        (workout, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                `Day ${index + 1} — ${workout.name}`;

            button.onclick =
                () => selectDay(index);

            container.appendChild(button);
        }
    );
}

displayDayButtons();


function showHistoryPage() {

    daySelection.style.display = "none";

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    const sortedSessions =
        [...sessions].sort(
            (a, b) =>
                new Date(b.completedAt) -
                new Date(a.completedAt)
        );

    let html = `

        <button
            type="button"
            onclick="goBackFromHistory()"
        >
            ← Back
        </button>

        <h2>Workout History</h2>
    `;

    if (sortedSessions.length === 0) {

        html += `

            <div class="previous">

                No completed workouts yet.

            </div>
        `;

        workoutContainer.innerHTML = html;

        return;
    }

    sortedSessions.forEach(
        session => {

            html += `

                <div class="exercise">

                    <h2>
                        ${session.dayName}
                    </h2>

                    <div class="previous">

                        <strong>
                            ${formatDateTime(
                                session.completedAt
                            )}
                        </strong>

                        <br>

                        Started:
                        ${formatTime(
                            session.startedAt
                        )}

                        <br>

                        Completed:
                        ${formatTime(
                            session.completedAt
                        )}

                    </div>
            `;

            /*
             * Use the workout plan order
             * rather than the order in which
             * exercises were saved.
             */
            workouts[session.dayIndex].exercises.forEach(
                plannedExercise => {

                    const exercise =
                        session.exercises.find(
                            savedExercise =>
                                savedExercise.exerciseName ===
                                plannedExercise.name
                        );

                    if (!exercise) {
                        return;
                    }

                    const reps =
                        exercise.sets
                            .map(
                                set => set.reps
                            )
                            .join(" / ");

                    const comment =
                        exercise.comment || "";

                    html += `

                        <div class="history-row">

                            <strong>
                                ${exercise.exerciseName}
                            </strong>

                            <span>
                                ${exercise.weight || "-"} kg
                            </span>

                            <span>
                                ${reps}
                            </span>

                            ${
                                comment
                                    ? `
                                        <div class="history-comment">
                                            ${comment}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }
            );

            html += `

                </div>
            `;
        }
    );

    workoutContainer.innerHTML = html;
}




function goBackFromHistory() {

    workoutContainer.innerHTML = "";

    daySelection.style.display = "block";
}

function resetWorkoutData() {

    const confirmed =
        confirm(
            "This will delete all saved workout history and the current workout plan.\n\nAre you sure?"
        );

    if (!confirmed) {
        return;
    }

    // Remove workout plan
    localStorage.removeItem(
        "workout-plan"
    );

    // Remove new workout sessions
    localStorage.removeItem(
        "workout-sessions"
    );

    // Remove old exercise history
    Object.keys(localStorage)
        .forEach(key => {

            if (
                key.startsWith(
                    "workout-history-"
                )
            ) {
                localStorage.removeItem(key);
            }
        });

    // Remove migration flag, if present
    localStorage.removeItem(
        "workout-history-migrated"
    );

    workouts = [];

    activeWorkout = null;

    alert(
        "Workout data has been reset."
    );

    location.reload();
}

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")
            .then(() => {
                console.log("Service worker registered.");
            })
            .catch(error => {
                console.error(
                    "Service worker registration failed:",
                    error
                );
            });

    });

}

function getWeightValues() {

    const values = [];

    // 0 to 50 in 0.5 kg increments
    for (
        let value = 0;
        value <= 50;
        value += 0.5
    ) {
        values.push(value);
    }

    // 52.5 to 100 in 2.5 kg increments
    for (
        let value = 52.5;
        value <= 100;
        value += 2.5
    ) {
        values.push(value);
    }

    // 105 to 250 in 5 kg increments
    for (
        let value = 105;
        value <= 250;
        value += 5
    ) {
        values.push(value);
    }

    return values;
}


function getRepValues() {

    const values = [];

    for (
        let value = 1;
        value <= 15;
        value++
    ) {
        values.push(value);
    }

    return values;
}


function openNumberPicker(
    type,
    inputId
) {

    const input =
        document.getElementById(inputId);

    if (!input) {
        return;
    }

    const values =
        type === "weight"
            ? getWeightValues()
            : getRepValues();

    const currentValue =
        input.value !== ""
            ? Number(input.value)
            : values[0];

    let selectedIndex =
        values.findIndex(
            value =>
                value === currentValue
        );

    if (selectedIndex === -1) {
        selectedIndex = 0;
    }

    const title =
        type === "weight"
            ? "Weight"
            : "Reps";

    const unit =
        type === "weight"
            ? " kg"
            : "";

    let html = `

        <div
            class="number-picker-overlay"
            onclick="closeNumberPicker(event)"
        >

            <div
                class="number-picker"
                onclick="event.stopPropagation()"
            >

                <h3>
                    ${title}
                </h3>

                <div
                    class="number-picker-list"
                    id="number-picker-list"
                >
    `;

    values.forEach(
        (value, index) => {

            html += `

                <button
                    type="button"
                    class="number-picker-option ${
                        index === selectedIndex
                            ? "selected"
                            : ""
                    }"
                    data-index="${index}"
                >
                    ${value}${unit}
                </button>
            `;
        }
    );

    html += `

                </div>

                <div
                    class="number-picker-actions"
                >

                    <button
                        type="button"
                        onclick="cancelNumberPicker()"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="picker-done"
                        onclick="confirmNumberPicker()"
                    >
                        Done
                    </button>

                </div>

            </div>

        </div>
    `;

    const picker =
        document.createElement("div");

    picker.id =
        "number-picker-container";

    picker.dataset.inputId =
        inputId;

    picker.dataset.type =
        type;

    picker.dataset.originalValue =
        input.value;

    picker.dataset.selectedIndex =
        selectedIndex;

    picker.innerHTML =
        html;

    document.body.appendChild(
        picker
    );

    const list =
        picker.querySelector(
            "#number-picker-list"
        );

    /*
     * Scroll to the current value.
     */
    const selected =
        list.querySelector(
            ".number-picker-option.selected"
        );

    if (selected) {

        list.scrollTop =
            selected.offsetTop -
            list.clientHeight / 2 +
            selected.offsetHeight / 2;
    }

    /*
     * Update selection while scrolling.
     */
    let scrollTimeout;

list.addEventListener(
    "scroll",
    () => {

        clearTimeout(
            scrollTimeout
        );

        /*
         * Update the highlighted value
         * while scrolling.
         */
        updatePickerSelection(
            list
        );

        /*
         * When scrolling stops,
         * smoothly center the selected value.
         */
        scrollTimeout =
            setTimeout(
                () => {

                    const selected =
                        list.querySelector(
                            ".number-picker-option.selected"
                        );

                    if (!selected) {
                        return;
                    }

                    selected.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                },
                120
            );
    }
);
}


function selectNumberPickerValue(
    value,
    inputId,
    type
) {

    const input =
        document.getElementById(inputId);

    if (!input) {
        return;
    }

    input.value =
        value;

    /*
     * Highlight the selected value.
     */
    const options =
        document.querySelectorAll(
            ".number-picker-option"
        );

    options.forEach(
        option => {

            option.classList.remove(
                "selected"
            );
        }
    );

    options.forEach(
        option => {

            if (
                Number(
                    option.dataset.index
                ) ===
                (
                    type === "weight"
                        ? getWeightValues()
                        : getRepValues()
                ).indexOf(value)
            ) {

                option.classList.add(
                    "selected"
                );
            }
        }
    );
}


function closeNumberPicker(
    event
) {

    if (
        event &&
        event.target !== event.currentTarget
    ) {
        return;
    }

    const picker =
        document.getElementById(
            "number-picker-container"
        );

    if (picker) {
        picker.remove();
    }
}

function updatePickerSelection(list) {

    const picker =
        document.getElementById(
            "number-picker-container"
        );

    if (!picker) {
        return;
    }

    const options =
        Array.from(
            list.querySelectorAll(
                ".number-picker-option"
            )
        );

    const listCenter =
        list.scrollTop +
        list.clientHeight / 2;

    let closestOption = null;
    let closestDistance = Infinity;

    options.forEach(
        option => {

            const optionCenter =
                option.offsetTop +
                option.offsetHeight / 2;

            const distance =
                Math.abs(
                    optionCenter -
                    listCenter
                );

            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closestOption =
                    option;
            }
        }
    );

    if (!closestOption) {
        return;
    }

    options.forEach(
        option => {

            option.classList.remove(
                "selected"
            );
        }
    );

    closestOption.classList.add(
        "selected"
    );

    picker.dataset.selectedIndex =
        closestOption.dataset.index;
}

function confirmNumberPicker() {

    const picker =
        document.getElementById(
            "number-picker-container"
        );

    if (!picker) {
        return;
    }

    const input =
        document.getElementById(
            picker.dataset.inputId
        );

    if (!input) {
        picker.remove();
        return;
    }

    const type =
        picker.dataset.type;

    const values =
        type === "weight"
            ? getWeightValues()
            : getRepValues();

    const selectedIndex =
        Number(
            picker.dataset.selectedIndex
        );

    const value =
        values[selectedIndex];

    if (value !== undefined) {

        input.value =
            value;
    }

    picker.remove();
}

function cancelNumberPicker() {

    const picker =
        document.getElementById(
            "number-picker-container"
        );

    if (!picker) {
        return;
    }

    /*
     * Do not modify the input.
     * The original value remains intact.
     */

    picker.remove();
}

function exportWorkoutHistory() {

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    if (sessions.length === 0) {

        alert(
            "There is no workout history to export."
        );

        return;
    }

    const rows = [];

    rows.push([
        "Workout Date",
        "Day",
        "Exercise",
        "Weight (kg)",
        "Set 1",
        "Set 2",
        "Set 3",
        "Set 4",
        "Set 5",
        "Set 6",
        "Comment"
    ]);

    sessions.forEach(
        session => {

            const workoutDate =
                new Date(
                    session.completedAt
                ).toLocaleDateString(
                    "en-GB"
                );

            session.exercises.forEach(
                exercise => {

                    const reps =
                        exercise.sets.map(
                            set => set.reps
                        );

                    rows.push([
                        workoutDate,
                        session.dayName,
                        exercise.exerciseName,
                        exercise.weight || "",
                        reps[0] || "",
                        reps[1] || "",
                        reps[2] || "",
                        reps[3] || "",
                        reps[4] || "",
                        reps[5] || "",
                        exercise.comment || ""
                    ]);

                }
            );
        }
    );

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value => {

                                const text =
                                    String(
                                        value ?? ""
                                    );

                                return `"${text.replace(
                                    /"/g,
                                    '""'
                                )}"`;

                            }
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `gym-tracker-history-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}