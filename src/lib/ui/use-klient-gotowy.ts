"use client";

import { useEffect, useState } from "react";

/** Po pierwszym mountcie na kliencie — unika błędów hydratacji (czas, localStorage, searchParams). */
export function useKlientGotowy(): boolean {
  const [gotowy, setGotowy] = useState(false);
  useEffect(() => {
    setGotowy(true);
  }, []);
  return gotowy;
}
