const queue = [];
let isFlushing = false;
let resolvedPromise = Promise.resolve();
export function queueJob(job) {
    if (!queue.length || !queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}

function queueFlush() {
    if (!isFlushing) {
        isFlushing = true;
        resolvedPromise.then(flushJob);
    }
}

function flushJob() {
    // debugger
    for (let i = 0; i < queue.length; i++) {
        queue[i]();
    }
    queue.length = 0;
    isFlushing = false;
}

export function nextTick(fn) {
    return fn ? resolvedPromise.then(fn) : resolvedPromise;
}
