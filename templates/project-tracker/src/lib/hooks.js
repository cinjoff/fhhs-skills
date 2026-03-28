import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

export function useToast() {
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);

  const show = useCallback((msg) => {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 1200);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return [toast, show];
}

export function useSSE(onData) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const rtRef = useRef(null);
  const unmountedRef = useRef(false);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const fetchState = useCallback(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(d => {
        if (unmountedRef.current) return;
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
      if (rtRef.current) { clearTimeout(rtRef.current); rtRef.current = null; }
    };
    es.addEventListener('refresh', fetchState);
    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      if (!rtRef.current && !unmountedRef.current) {
        rtRef.current = setTimeout(() => { rtRef.current = null; connectSSE(); }, 2000);
      }
    };
  }, [fetchState]);

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

  return { connected };
}
