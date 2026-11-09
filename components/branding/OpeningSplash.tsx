"use client";

import { useEffect, useState } from "react";
import { IdxMark } from "./IdxMark";

const STORAGE_KEY="idx-opening-seen-v1";

/**
 * One short, GPU-friendly opening per browser tab/session, not per navigation.
 * No GIF download: the user-supplied IDX mark is rendered as a crisp SVG.
 * CSS also dismisses the overlay if JavaScript fails to hydrate.
 */
export function OpeningSplash() {
  const [visible,setVisible]=useState(true);
  useEffect(()=>{
    try {
      if(sessionStorage.getItem(STORAGE_KEY)==="1") {
        setVisible(false);
        return;
      }
    } catch { /* Browser privacy mode may block sessionStorage. */ }
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer=window.setTimeout(()=>{
      try {sessionStorage.setItem(STORAGE_KEY,"1");}catch{/* no storage */}
      document.documentElement.dataset.idxSplash="skip";
      setVisible(false);
    },reduced?150:2250);
    return ()=>window.clearTimeout(timer);
  },[]);
  if(!visible)return null;
  return <div className="idx-opening" aria-hidden="true">
    <div className="idx-opening-grid"/>
    <div className="idx-opening-halo"/>
    <div className="idx-opening-brand">
      <div className="idx-opening-mark">
        <IdxMark width={310} height={134} className="h-auto w-full" decorative />
      </div>
      <div className="idx-opening-wordmark">
        <strong>Terminal</strong>
      </div>
      <div className="idx-opening-rule"><span/></div>
    </div>
  </div>;
}
