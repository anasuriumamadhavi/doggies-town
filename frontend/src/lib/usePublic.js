import { useEffect, useState } from "react";
import { api } from "./api";

export function usePublic(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(path)
      .then((r) => { if (active) { setData(r.data); setError(null); } })
      .catch((e) => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path]);
  return { data, loading, error };
}
