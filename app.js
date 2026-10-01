
console.log("app.js is working");

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


function selectDay(dayIndex) {

        daySelection.style.display = "none";
    
        activeWorkout = {
            dayIndex: dayIndex,
            startedAt: null,
            sessionId: null
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

    displayWorkout(
        activeWorkout.dayIndex
    );
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
}





function createSets(
    dayIndex,
    exerciseIndex,
    exercise
) {

    let html = "";

    const savedSessions =
        localStorage.getItem(
            "workout-sessions"
        );

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    // Find the most recent completed session
    // containing this exercise.
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

    const previousWorkout =
        previousSession
            ? previousSession.exercises.find(
                savedExercise =>
                    savedExercise.exerciseName ===
                    exercise.name
            )
            : null;

    const previousWeight =
        previousWorkout?.weight || "";

    // One weight input for the entire exercise
    html += `
        <div class="weight-input">

            <label>
                Weight
            </label>

            <input
                type="number"
                step="0.5"
                placeholder="kg"
                value="${previousWeight}"
                id="weight-${dayIndex}-${exerciseIndex}"
            >

            <span>kg</span>

        </div>
    `;

    // Reps input for each set
    for (
        let i = 0;
        i < exercise.sets;
        i++
    ) {

        const previousSet =
            previousWorkout?.sets?.[i];

        const previousReps =
            previousSet?.reps || "";

        html += `
            <div class="set">

                <strong>
                    Set ${i + 1}
                </strong>

                <input
                    type="number"
                    placeholder="reps"
                    value="${previousReps}"
                    id="reps-${dayIndex}-${exerciseIndex}-${i}"
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

    return `
        <div class="previous">

            <strong>
                Previous: ${date}
            </strong>

            <br>

            ${weight} kg —
            ${reps}

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








function finishWorkout() {

    if (!activeWorkout) {
        alert("No active workout.");
        return;
    }

    const confirmed =
        confirm(
            "Finish this workout?\n\nYour completed workout will be saved."
        );

    if (!confirmed) {
        return;
    }

    const dayIndex =
        activeWorkout.dayIndex;

    const workout =
        workouts[dayIndex];

    const completedAt =
        new Date().toISOString();

    const exercises = [];

    workout.exercises.forEach(
        (exercise, exerciseIndex) => {

            const weightInput =
                document.getElementById(
                    `weight-${dayIndex}-${exerciseIndex}`
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

            exercises.push({

                exerciseName:
                    exercise.name,

                weight:
                    weightInput.value,

                sets:
                    sets
            });
        }
    );

    const session = {

        sessionId:
            activeWorkout.sessionId,

        dayIndex:
            dayIndex,

        dayName:
            workout.name,

        startedAt:
            activeWorkout.startedAt,

        completedAt:
            completedAt,

        exercises:
            exercises
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

    console.log(
        "Workout session saved:",
        session
    );

    activeWorkout = null;

    alert(
        "Workout completed and saved."
    );

    workoutContainer.innerHTML = "";

    daySelection.style.display = "block";
}

function resetSession() {

    if (!activeWorkout) {
        return;
    }

    const confirmed =
        confirm(
            "Reset this workout?\n\nYour current entries will be discarded. Your workout history will not be affected."
        );

    if (!confirmed) {
        return;
    }

    activeWorkout = null;

    workoutContainer.innerHTML = "";

    daySelection.style.display = "block";
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

            session.exercises.forEach(
                exercise => {

                    const reps =
                        exercise.sets
                            .map(
                                set => set.reps
                            )
                            .join(" / ");

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

function exportWorkoutHistory() {

    const savedSessions =
        localStorage.getItem("workout-sessions");

    const sessions =
        savedSessions
            ? JSON.parse(savedSessions)
            : [];

    if (sessions.length === 0) {
        alert("There is no workout history to export.");
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
        "Set 6"
    ]);

    sessions.forEach(session => {

        const workoutDate =
            new Date(
                session.completedAt
            ).toLocaleDateString("en-GB");

        session.exercises.forEach(exercise => {

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
                reps[5] || ""
            ]);

        });

    });

    const csv =
        rows
            .map(row =>
                row.map(value => {

                    const text =
                        String(value ?? "");

                    return `"${text.replace(
                        /"/g,
                        '""'
                    )}"`;

                }).join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
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