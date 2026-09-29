"use client";
import { useEffect, useRef, useState } from 'react';
import { CALENDAR_MAX, seoulToday, thisWeekend } from '../lib/visit-calendar';
export default function VisitDatePicker({value,onChange}:{value:string;onChange:(date:string)=>void}) {
 const [today,setToday]=useState('');
 const [custom,setCustom]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setToday(seoulToday());},[]);
 const days=today?thisWeekend(today):[];
 return <div className="visit-date">
   <div className="date-options">{days.map((date,i)=><button type="button" key={date} disabled={date<today} aria-pressed={!custom&&value===date} className={!custom&&value===date?'selected':''} onClick={()=>{setCustom(false);onChange(date);}}>이번주 {i===0?'토':'일'} <small>({Number(date.slice(5,7))}/{Number(date.slice(8))})</small></button>)}
   <button type="button" aria-expanded={custom} className={custom?'selected':''} onClick={()=>{setCustom(true);requestAnimationFrame(()=>{input.current?.focus();try{input.current?.showPicker();}catch{ /* 날짜 입력 필드를 통해 선택 가능 */ }});}}><svg className="calendar-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/></svg>직접 선택</button></div>
   {custom&&<label>방문 날짜<input ref={input} aria-label="방문 날짜" type="date" min={today} max={CALENDAR_MAX} value={value} required onChange={e=>onChange(e.target.value)}/></label>}
   {!custom&&!days.includes(value)&&<span className="date-selected">선택한 날짜: {value}</span>}
 </div>;
}
