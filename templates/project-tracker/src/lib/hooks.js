import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

export function useToast() {
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);

  const show = useCallback((msg) => {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return [toast, show];
}

/**
 * SSE hook with exponential backoff reconnection.
 * Returns { connected, lastUpdated, disconnectedSince }.
 */
export function useSSE(onData, onEvent) {
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [disconnectedSince, setDisconnectedSince] = useState(null);
  const esRef = useRef(null);
  const rtRef = useRef(null);
  const retryDelayRef = useRef(2000); // Start at 2s
  const unmountedRef = useRef(false);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const MAX_RETRY_DELAY = 32000;
  const MAX_RETRIES = 5;
  const retryCountRef = useRef(0);

  const fetchState = useCallback((projectPath) => {
    const url = projectPath ? `/api/state?project=${encodeURIComponent(projectPath)}` : '/api/state';
    return fetch(url)
      .then(r => r.json())
      .then(d => {
        if (unmountedRef.current) return;
        setLastUpdated(new Date());
        onDataRef.current(d);
      })
      .catch(() => {});
  }, []);

  const connectSSE = useCallback(() => {
    if (unmountedRef.current) return;
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const es = new EventSource('/api/events');
    esRef.current = es;

    es.onopen = () => {
      if (unmountedRef.current) { es.close(); return; }
      setConnected(true);
      setDisconnectedSince(null);
      retryDelayRef.current = 2000; // Reset backoff
      retryCountRef.current = 0;
      if (rtRef.current) { clearTimeout(rtRef.current); rtRef.current = null; }
      // Full state refresh on reconnect
      fetchState();
    };

    es.addEventListener('refresh', (e) => {
      let projectPath = null;
      try { projectPath = e.data ? JSON.parse(e.data).projectPath || null : null; } catch (_) {}
      fetchState(projectPath);
    });

    es.addEventListener('activity', (e) => {
      if (onEventRef.current) {
        try {
          const parsed = e.data ? JSON.parse(e.data) : null;
          if (parsed) onEventRef.current('activity', parsed);
        } catch (_) {}
      }
    });

    es.onerror = () => {
      setConnected(false);
      if (!disconnectedSince) setDisconnectedSince(new Date());
      es.close();
      esRef.current = null;

      if (retryCountRef.current >= MAX_RETRIES) return;
      retryCountRef.current++;

      if (!rtRef.current && !unmountedRef.current) {
        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY);
        rtRef.current = setTimeout(() => { rtRef.current = null; connectSSE(); }, delay);
      }
    };
  }, [fetchState, disconnectedSince]);

  useEffect(() => {
    unmountedRef.current = false;
    fetchState();
    connectSSE();
    return () => {
      unmountedRef.current = true;
      if (esRef.current) esRef.current.close();
      if (rtRef.current) clearTimeout(rtRef.current);
    };
  }, [fetchState, connectSSE]);

  return { connected, lastUpdated, disconnectedSince };
}

/**
 * AbortController-aware fetch hook.
 * Cancels in-flight requests when deps change.
 */
export function useAbortFetch() {
  const controllerRef = useRef(null);

  const fetchWithAbort = useCallback((url, opts = {}) => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    return fetch(url, { ...opts, signal: controllerRef.current.signal });
  }, []);

  useEffect(() => () => {
    if (controllerRef.current) controllerRef.current.abort();
  }, []);

  return fetchWithAbort;
}
