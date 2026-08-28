const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

function asPercent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

function calculateRoadmapReadiness(tasks, now = new Date()) {
    const activeTasks = tasks.filter((task) => task.status !== "skipped");
    const totalWeight = activeTasks.reduce((total, task) => total + PRIORITY_WEIGHT[task.priority], 0);
    const completedWeight = activeTasks
        .filter((task) => task.status === "completed")
        .reduce((total, task) => total + PRIORITY_WEIGHT[task.priority], 0);

    const highPriorityTasks = activeTasks.filter((task) => task.priority === "high");
    const completedHighPriority = highPriorityTasks.filter((task) => task.status === "completed").length;
    const dueTasks = activeTasks.filter((task) => new Date(task.scheduledDate) <= now);
    const completedDueTasks = dueTasks.filter((task) => task.status === "completed").length;

    const weightedCompletion = asPercent(completedWeight, totalWeight);
    const highPriorityCompletion = highPriorityTasks.length
        ? asPercent(completedHighPriority, highPriorityTasks.length)
        : weightedCompletion;
    const scheduleAdherence = dueTasks.length
        ? asPercent(completedDueTasks, dueTasks.length)
        : weightedCompletion;

    return {
        score: Math.round((weightedCompletion * 0.55) + (highPriorityCompletion * 0.30) + (scheduleAdherence * 0.15)),
        weightedCompletion,
        highPriorityCompletion,
        scheduleAdherence,
        calculatedAt: now,
    };
}

module.exports = { calculateRoadmapReadiness, PRIORITY_WEIGHT };
