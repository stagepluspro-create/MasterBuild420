self.onmessage = function(e) {
  const { type, data } = e.data;

  if (type === 'INIT') {
    self.postMessage({ type: 'READY' });
  } else if (type === 'SIMULATE_STEP') {
    try {
      self.postMessage({
        type: 'STEP_COMPLETE',
        data: {
          step: data.step,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error.message
      });
    }
  } else if (type === 'TERMINATE') {
    self.close();
  }
};

self.postMessage({ type: 'WORKER_LOADED' });
