class ResourceBusyError extends Error {
    constructor(resourceName) {
        super(`${resourceName} is busy. Please try again in a moment.`);
        this.name = "ResourceBusyError";
        this.statusCode = 503;
    }
}

class WorkQueue {
    constructor({ resourceName, maxConcurrent, maxQueued }) {
        this.resourceName = resourceName;
        this.maxConcurrent = maxConcurrent;
        this.maxQueued = maxQueued;
        this.active = 0;
        this.queue = [];
    }

    run(task) {
        if (this.active < this.maxConcurrent) {
            return this.execute(task);
        }

        if (this.queue.length >= this.maxQueued) {
            return Promise.reject(new ResourceBusyError(this.resourceName));
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
        });
    }

    async execute(task) {
        this.active += 1;
        try {
            return await task();
        } finally {
            this.active -= 1;
            this.startNext();
        }
    }

    startNext() {
        const next = this.queue.shift();
        if (!next) {
            return;
        }

        this.execute(next.task).then(next.resolve, next.reject);
    }
}

module.exports = { ResourceBusyError, WorkQueue };
