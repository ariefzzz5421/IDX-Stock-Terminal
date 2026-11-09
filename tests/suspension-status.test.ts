import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySuspensionTitle,
  parseSuspensionNotice,
  reconcileSuspensions,
} from "../lib/market-data/suspension-status";

test("BEI unsuspend titles take precedence over the word penghentian",()=>{
  const parsed=parseSuspensionNotice("19 Okt 2026","Pembukaan Penghentian Sementara Perdagangan Efek PT Mitra Komunikasi Nusantara Tbk. (MKNT)");
  assert.equal(parsed?.code,"MKNT");
  assert.equal(parsed?.action,"UNSUSPEND");
  assert.equal(parsed?.date,"2026-10-19");
  assert.equal(classifySuspensionTitle("Pembukaan Kembali Perdagangan (Unsuspend) Saham XYZ (TEST)"),"UNSUSPEND");
  assert.equal(classifySuspensionTitle("Penghentian Sementara Perdagangan (Suspend) Saham PT Test Tbk. (TEST)"),"SUSPEND");
});

test("remove suspension badge once newer BEI unsuspend announcement is verified",()=>{
  const prior=[{code:"MKNT",since:"02-Jul-24"},{code:"ALMI",since:"30-Okt-24"}];
  const current=reconcileSuspensions(prior,"2026-06-30",[]);
  assert.deepEqual(current.map(x=>x.code),["ALMI"]);
});

test("a later new suspension restores status after a past unsuspend",()=>{
  const archive=[{code:"MKNT",since:"02-Jul-24"}];
  const notices=[
    {code:"MKNT",date:"2026-11-02",action:"SUSPEND" as const,title:"Suspend MKNT"},
    {code:"MKNT",date:"2026-10-19",action:"UNSUSPEND" as const,title:"Unsuspend MKNT"},
  ];
  assert.deepEqual(reconcileSuspensions(archive,"2026-06-30",notices).map(x=>x.code),["MKNT"]);
});

test("same-day unsuspend outranks earlier suspend and no other stock changes",()=>{
  const notices=[
    {code:"TEST",date:"2026-11-09",action:"SUSPEND" as const,title:"Suspend TEST"},
    {code:"TEST",date:"2026-11-09",action:"UNSUSPEND" as const,title:"Unsuspend TEST"},
    {code:"ABCD",date:"2026-11-09",action:"SUSPEND" as const,title:"Suspend ABCD"},
  ];
  assert.deepEqual(reconcileSuspensions([],"2026-06-30",notices).map(x=>x.code),["ABCD"]);
  assert.equal(parseSuspensionNotice("19 Okt 2026","Berita pasar tanpa ticker"),null);
});
