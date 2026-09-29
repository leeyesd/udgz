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
   <button type="button" aria-expanded={custom} className={custom?'selected':''} onClick={()=>{setCustom(true);requestAnimationFrame(()=>{input.current?.focus();try{input.current?.showPicker();}catch{ /* 날짜 입력 필드를 통해 선택 가능 */ }});}}>직접 선택</button></div>
   {custom&&<label>방문 날짜<input ref={input} aria-label="방문 날짜" type="date" min={today} max={CALENDAR_MAX} value={value} required onChange={e=>onChange(e.target.value)}/></label>}
   {!custom&&!days.includes(value)&&<span className="date-selected">선택한 날짜: {value}</span>}
   <small>평일 선택시 평일요금, 주말 선택시 주말 요금으로 나옵니다. 공휴일 선택시 운영 중인 장소만 나옵니다.</small>
 </div>;
}
