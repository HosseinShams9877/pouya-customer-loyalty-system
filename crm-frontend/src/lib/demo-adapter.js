/**
 * Demo Mode Axios Adapter
 *
 * When VITE_DEMO_MODE=true, this adapter intercepts ALL requests BEFORE
 * they go to the network and returns mock data immediately (zero network delay).
 */

export function createDemoAdapter(getMockResponse) {
  return function demoAdapter(config) {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    const mock = getMockResponse(url, method);

    if (mock) {
      return Promise.resolve({
        data: mock,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      });
    }

    // No mock found → reject with a network error
    const error = new Error(`Demo Mode: No mock for ${method.toUpperCase()} ${url}`);
    error.code = 'ERR_NETWORK';
    return Promise.reject(error);
  };
}
