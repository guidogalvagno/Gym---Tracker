import { useState, useEffect, useRef, useCallback } from "react";
import { EJERCICIOS_DB, MUSCULOS, COLORES } from "./data";
import { calc1RM, TABLA_1RM, fmtDate, today } from "./utils";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const KEY = "gymtracker-v3";
const load = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : { perfiles: [] }; } catch { return { perfiles: [] }; } };
const persist = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Tag = ({ t }) => <span style={{fontSize:"9px",fontFamily:"monospace",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"4px",padding:"2px 5px",color:"#999",marginLeft:"5px",whiteSpace:"nowrap"}}>{t}</span>;
const Mono = ({ c="#aaa", s="11px", children }) => <span style={{fontFamily:"monospace",fontSize:s,color:c}}>{children}</span>;
const Pill = ({ c, children }) => <span style={{background:`${c}22`,border:`1px solid ${c}55`,borderRadius:"20px",padding:"2px 8px",fontSize:"10px",color:c}}>{children}</span>;
const BtnBack = ({ onClick }) => <button onClick={onClick} style={{background:"none",border:"none",color:"#666",fontSize:"14px",cursor:"pointer",padding:"0 0 16px",display:"block"}}>← Volver</button>;

// ─── TIMER ────────────────────────────────────────────────────────────────────
function Timer({ color, onClose }) {
  const [seg, setSeg] = useState(90);
  const [rest, setRest] = useState(90);
  const [run, setRun] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const opts = [30,45,60,90,120,180];

  useEffect(() => {
    if (!run) return;
    ref.current = setInterval(() => {
      setRest(r => {
        if (r <= 1) { clearInterval(ref.current); setRun(false); setDone(true); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [run]);

  const reset = () => { clearInterval(ref.current); setRun(false); setDone(false); setRest(seg); };
  const pct = ((seg - rest) / seg) * 100;
  const C = 2 * Math.PI * 54;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#141418",border:`1px solid ${color}40`,borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",width:"100%",maxWidth:"400px"}}>
        <div style={{width:"36px",height:"4px",background:"#333",borderRadius:"2px",margin:"0 auto 20px"}}/>
        <div style={{textAlign:"center",marginBottom:"20px"}}>
          <Mono c="#555" s="11px">DESCANSO ENTRE SERIES</Mono>
          <svg width="140" height="140" style={{display:"block",margin:"12px auto 0"}}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            <circle cx="70" cy="70" r="54" fill="none" stroke={done?"#4ECDC4":color} strokeWidth="8"
              strokeDasharray={C} strokeDashoffset={C*(1-pct/100)} strokeLinecap="round" transform="rotate(-90 70 70)"
              style={{transition:"stroke-dashoffset 0.5s"}}/>
            <text x="70" y="68" textAnchor="middle" fontSize="28" fontWeight="700" fill={done?"#4ECDC4":"#f0f0f0"} fontFamily="monospace">
              {done?"✓":`${Math.floor(rest/60)}:${(rest%60).toString().padStart(2,"0")}`}
            </text>
            {done && <text x="70" y="90" textAnchor="middle" fontSize="12" fill="#4ECDC4" fontFamily="monospace">listo!</text>}
          </svg>
        </div>
        {!run && (
          <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"16px",flexWrap:"wrap"}}>
            {opts.map(s=>(
              <button key={s} onClick={()=>{setSeg(s);setRest(s);setDone(false);}}
                style={{background:seg===s?color:"rgba(255,255,255,0.06)",color:seg===s?"#000":"#888",border:"none",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"700",cursor:"pointer"}}>
                {s>=60?`${s/60}min`:`${s}s`}
              </button>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={reset} style={{flex:1,padding:"13px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#888",fontSize:"14px",cursor:"pointer"}}>↺ Reset</button>
          <button onClick={run?()=>{clearInterval(ref.current);setRun(false);}:()=>{setDone(false);setRun(true);}}
            style={{flex:2,padding:"13px",background:run?"rgba(255,80,80,0.2)":color,border:"none",borderRadius:"10px",color:run?"#ff6060":"#000",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
            {run?"⏸ Pausar":done?"↺ De nuevo":"▶ Iniciar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CALCULADORA 1RM ──────────────────────────────────────────────────────────
function Calc1RM({ color, onClose }) {
  const [peso, setPeso] = useState("");
  const [reps, setReps] = useState("");
  const rm = calc1RM(peso, reps);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#141418",border:`1px solid ${color}40`,borderRadius:"20px 20px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:"480px",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{width:"36px",height:"4px",background:"#333",borderRadius:"2px",margin:"0 auto 16px"}}/>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"4px"}}>Calculadora 1RM</div>
        <div style={{fontSize:"12px",color:"#555",marginBottom:"20px"}}>Ingresá peso y reps para calcular tu máximo teórico</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          {[["PESO (kg)",peso,setPeso],["REPS",reps,setReps]].map(([lbl,val,set])=>(
            <div key={lbl}>
              <div style={{fontSize:"10px",color:"#555",fontFamily:"monospace",marginBottom:"6px"}}>{lbl}</div>
              <input type="number" value={val} onChange={e=>set(e.target.value)} placeholder="—"
                style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"12px",color:"#f0f0f0",fontSize:"20px",outline:"none",boxSizing:"border-box",fontFamily:"monospace",textAlign:"center"}}/>
            </div>
          ))}
        </div>
        {rm && (
          <>
            <div style={{background:`${color}15`,border:`1px solid ${color}40`,borderRadius:"14px",padding:"20px",textAlign:"center",marginBottom:"16px"}}>
              <div style={{fontSize:"11px",color:"#666",fontFamily:"monospace",letterSpacing:"2px",marginBottom:"8px"}}>TU 1RM ESTIMADO</div>
              <div style={{fontSize:"48px",fontWeight:"700",color,fontFamily:"monospace"}}>{rm}<span style={{fontSize:"18px",marginLeft:"4px"}}>kg</span></div>
            </div>
            <div style={{fontSize:"11px",color:"#555",fontFamily:"monospace",marginBottom:"10px"}}>PESO SEGÚN REPS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px"}}>
              {TABLA_1RM.map(row=>(
                <div key={row.reps} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                  <div style={{fontSize:"16px",fontWeight:"700",color,fontFamily:"monospace"}}>{Math.round(rm*row.pct/100)}kg</div>
                  <div style={{fontSize:"9px",color:"#555",fontFamily:"monospace"}}>{row.reps} rep{row.reps>1?"s":""} · {row.pct}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SELECTOR EJERCICIOS ──────────────────────────────────────────────────────
function SelectorEjercicios({ color, onAdd, onClose, yaAgregados=[], musculoSugerido=null }) {
  const [filtro, setFiltro] = useState(musculoSugerido || "Todos");
  const [busq, setBusq] = useState("");
  const todos = ["Todos", ...MUSCULOS];
  const lista = EJERCICIOS_DB.filter(e => {
    const enFiltro = filtro === "Todos" || e.musculo === filtro;
    const enBusq = e.nombre.toLowerCase().includes(busq.toLowerCase());
    return enFiltro && enBusq;
  });
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#141418",border:`1px solid ${color}40`,borderRadius:"20px 20px 0 0",padding:"20px 16px 32px",width:"100%",maxWidth:"520px",height:"85vh",display:"flex",flexDirection:"column"}}>
        <div style={{width:"36px",height:"4px",background:"#333",borderRadius:"2px",margin:"0 auto 16px"}}/>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"12px"}}>
          {musculoSugerido ? `Ejercicios de ${musculoSugerido}` : "Agregar ejercicio"}
        </div>
        <input placeholder="Buscar..." value={busq} onChange={e=>setBusq(e.target.value)}
          style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:"#f0f0f0",fontSize:"14px",outline:"none",marginBottom:"10px",width:"100%",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"8px",marginBottom:"10px",flexShrink:0}}>
          {todos.map(m=>(
            <button key={m} onClick={()=>setFiltro(m)}
              style={{background:filtro===m?color:"rgba(255,255,255,0.05)",color:filtro===m?"#000":"#888",border:"none",borderRadius:"20px",padding:"5px 12px",fontSize:"11px",fontWeight:filtro===m?"700":"400",cursor:"pointer",whiteSpace:"nowrap"}}>{m}</button>
          ))}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {lista.map(e => {
            const agr = yaAgregados.includes(e.id);
            return (
              <div key={e.id} onClick={()=>!agr&&onAdd(e)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 12px",marginBottom:"6px",background:agr?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",border:`1px solid ${agr?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)"}`,borderRadius:"10px",cursor:agr?"default":"pointer"}}>
                <div>
                  <div style={{fontSize:"13px",color:agr?"#555":"#e0e0e0"}}>{e.nombre}{e.tag&&<Tag t={e.tag}/>}</div>
                  <Mono c="#555" s="10px">{e.musculo}</Mono>
                </div>
                <div style={{fontSize:"18px",color:agr?"#333":color}}>{agr?"✓":"+"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MODAL EJERCICIO (con autoguardado) ───────────────────────────────────────
function ModalEjercicio({ ejercicio, color, existente, onSave, onClose, onTimer, on1RM }) {
  const seriesCount = parseInt((ejercicio.objetivo||"3x10").split("x")[0]) || 3;
  const [series, setSeries] = useState(
    existente?.series?.length > 0
      ? existente.series
      : Array.from({ length: seriesCount }, () => ({ peso:"", reps:"", completada:false }))
  );
  const [nota, setNota] = useState(existente?.nota || "");

  // Autoguardar al cerrar
  const handleClose = useCallback(() => {
    onSave({ series, nota });
    onClose();
  }, [series, nota, onSave, onClose]);

  const upd = (i, f, v) => { const s=[...series]; s[i]={...s[i],[f]:v}; setSeries(s); };
  const tog = (i) => { const s=[...series]; s[i]={...s[i],completada:!s[i].completada}; setSeries(s); };
  const comp = series.filter(s=>s.completada).length;
  const maxP = Math.max(...series.filter(s=>s.completada&&s.peso).map(s=>parseFloat(s.peso)||0), 0);
  const maxR = series.find(s=>s.completada&&parseFloat(s.peso||0)===maxP)?.reps;
  const rm = maxP > 0 && maxR ? calc1RM(maxP, maxR) : null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={handleClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#141418",border:`1px solid ${color}40`,borderRadius:"20px 20px 0 0",padding:"20px 20px 40px",width:"100%",maxWidth:"520px",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{width:"36px",height:"4px",background:"#333",borderRadius:"2px",margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
          <div style={{fontSize:"15px",fontWeight:"700",flex:1,paddingRight:"12px"}}>{ejercicio.nombre}</div>
          <div style={{display:"flex",gap:"6px"}}>
            <button onClick={onTimer} style={{background:`${color}20`,border:`1px solid ${color}40`,borderRadius:"8px",padding:"6px 10px",color,fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>⏱</button>
            <button onClick={on1RM} style={{background:`${color}20`,border:`1px solid ${color}40`,borderRadius:"8px",padding:"6px 10px",color,fontSize:"12px",cursor:"pointer",fontWeight:"700"}}>1RM</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"16px",flexWrap:"wrap"}}>
          <Mono c={color}>{ejercicio.objetivo||"Series libres"}</Mono>
          {ejercicio.tag&&<Tag t={ejercicio.tag}/>}
          {comp>0&&<Pill c="#4ECDC4">✓ {comp}/{series.length} series</Pill>}
          {rm&&<Pill c={color}>1RM ~{rm}kg</Pill>}
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(78,205,196,0.15)",borderRadius:"8px",padding:"6px 10px",marginBottom:"14px",fontSize:"11px",color:"#4ECDC4"}}>
          💾 Los datos se guardan automáticamente al cerrar
        </div>
        <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 28px",gap:"8px",marginBottom:"8px"}}>
          <div/><Mono c="#555" s="10px">PESO (kg)</Mono><Mono c="#555" s="10px">REPS</Mono><div/>
        </div>
        {series.map((s,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 28px",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
            <button onClick={()=>tog(i)}
              style={{width:"28px",height:"28px",borderRadius:"50%",background:s.completada?color:"rgba(255,255,255,0.06)",border:`1px solid ${s.completada?color:"rgba(255,255,255,0.1)"}`,color:s.completada?"#000":"#555",fontSize:"11px",fontWeight:"700",cursor:"pointer"}}>
              {i+1}
            </button>
            <input type="number" placeholder="—" value={s.peso} onChange={e=>upd(i,"peso",e.target.value)}
              style={{background:s.completada?`${color}15`:"rgba(255,255,255,0.05)",border:`1px solid ${s.completada?color+"50":"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"8px 10px",color:"#f0f0f0",fontSize:"16px",width:"100%",outline:"none",boxSizing:"border-box"}}/>
            <input type="number" placeholder="—" value={s.reps} onChange={e=>upd(i,"reps",e.target.value)}
              style={{background:s.completada?`${color}15`:"rgba(255,255,255,0.05)",border:`1px solid ${s.completada?color+"50":"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"8px 10px",color:"#f0f0f0",fontSize:"16px",width:"100%",outline:"none",boxSizing:"border-box"}}/>
            <button onClick={()=>setSeries(series.filter((_,idx)=>idx!==i))}
              style={{background:"none",border:"none",color:"#444",fontSize:"18px",cursor:"pointer"}}>×</button>
          </div>
        ))}
        <button onClick={()=>setSeries([...series,{peso:"",reps:"",completada:false}])}
          style={{background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.12)",borderRadius:"8px",padding:"8px",width:"100%",color:"#666",fontSize:"12px",cursor:"pointer",marginBottom:"12px"}}>
          + Agregar serie
        </button>
        <textarea placeholder="Notas del ejercicio..." value={nota} onChange={e=>setNota(e.target.value)}
          style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"10px",color:"#ccc",fontSize:"13px",resize:"none",height:"52px",outline:"none",marginBottom:"14px",boxSizing:"border-box"}}/>
        <button onClick={()=>{onSave({series,nota});onClose();}}
          style={{width:"100%",padding:"14px",background:color,border:"none",borderRadius:"10px",color:"#000",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
          Guardar y cerrar ✓
        </button>
      </div>
    </div>
  );
}

// ─── PANTALLA CREAR PERFIL ────────────────────────────────────────────────────
function PantallaCrearPerfil({ perfil, onSave, onBack }) {
  const [nombre, setNombre] = useState(perfil?.nombre||"");
  const [objetivo, setObjetivo] = useState(perfil?.objetivo||"");
  const [color, setColor] = useState(perfil?.color||COLORES[0]);
  const [lesion, setLesion] = useState(perfil?.lesion||"");
  const ok = nombre.trim().length > 0;
  const guardar = () => {
    if (!ok) return;
    onSave({ nombre:nombre.trim(), objetivo:objetivo.trim(), color, lesion:lesion.trim(),
      rutina:perfil?.rutina||[], historial:perfil?.historial||{},
      fotos:perfil?.fotos||[], recordatorios:perfil?.recordatorios||{} });
  };
  const inp = (label, val, set, ph) => (
    <div>
      <div style={{fontSize:"11px",color:"#555",fontFamily:"monospace",letterSpacing:"1px",marginBottom:"6px"}}>{label}</div>
      <input placeholder={ph} value={val} onChange={e=>set(e.target.value)}
        style={{display:"block",width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"12px 14px",color:"#f0f0f0",fontSize:"15px",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",padding:"32px 20px 48px"}}>
      <BtnBack onClick={onBack}/>
      <h2 style={{margin:"0 0 4px",fontSize:"22px"}}>{perfil?"Editar perfil":"Crear perfil"}</h2>
      <p style={{color:"#555",fontSize:"13px",margin:"0 0 28px"}}>Completá tus datos</p>
      <div style={{display:"flex",flexDirection:"column",gap:"16px",maxWidth:"480px"}}>
        {inp("NOMBRE *", nombre, setNombre, "Ej: Guido")}
        {inp("OBJETIVO", objetivo, setObjetivo, "Ej: Bajar grasa y ganar músculo")}
        {inp("LESIONES O LIMITACIONES", lesion, setLesion, "Ej: Tendinitis rodilla derecha")}
        <div>
          <div style={{fontSize:"11px",color:"#555",fontFamily:"monospace",letterSpacing:"1px",marginBottom:"10px"}}>COLOR</div>
          <div style={{display:"flex",gap:"10px"}}>
            {COLORES.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:"32px",height:"32px",borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${color===c?"#fff":"transparent"}`}}/>)}
          </div>
        </div>
        <button onClick={guardar} disabled={!ok}
          style={{padding:"14px",background:ok?color:"#222",border:"none",borderRadius:"12px",color:ok?"#000":"#444",fontSize:"15px",fontWeight:"700",cursor:ok?"pointer":"default"}}>
          {perfil?"Guardar cambios":"Crear perfil →"}
        </button>
      </div>
    </div>
  );
}

// ─── PANTALLA ARMAR/EDITAR RUTINA ─────────────────────────────────────────────
function PantallaRutina({ perfil, onSave, onBack }) {
  const [rutina, setRutina] = useState(perfil.rutina||[]);
  const [diaIdx, setDiaIdx] = useState(0);
  const [showSel, setShowSel] = useState(false);
  const [showNuevoDia, setShowNuevoDia] = useState(false);
  const [nombreDia, setNombreDia] = useState("");
  const [colorDia, setColorDia] = useState(COLORES[0]);
  // Para reemplazar ejercicio
  const [reemplazando, setReemplazando] = useState(null); // ejId que se reemplaza

  const dia = rutina[diaIdx];

  const agregarDia = () => {
    if (!nombreDia.trim()) return;
    const n = { id:Date.now().toString(), nombre:nombreDia.trim(), color:colorDia, ejercicios:[] };
    const r = [...rutina, n];
    setRutina(r); setDiaIdx(r.length-1); setNombreDia(""); setShowNuevoDia(false);
  };

  const eliminarDia = (i) => {
    const r = rutina.filter((_,idx)=>idx!==i);
    setRutina(r); setDiaIdx(Math.max(0,diaIdx-1));
  };

  const agregarEj = (ej) => {
    if (!dia) return;
    if (reemplazando) {
      // Reemplaza el ejercicio específico
      const r = rutina.map((d,i)=>i===diaIdx?{...d,ejercicios:d.ejercicios.map(e=>e.id===reemplazando?{...ej,objetivo:"3x10"}:e)}:d);
      setRutina(r); setReemplazando(null); setShowSel(false);
    } else {
      const r = rutina.map((d,i)=>i===diaIdx?{...d,ejercicios:[...d.ejercicios,{...ej,objetivo:"3x10"}]}:d);
      setRutina(r);
    }
  };

  const editarObj = (ejId, val) => {
    const r = rutina.map((d,i)=>i===diaIdx?{...d,ejercicios:d.ejercicios.map(e=>e.id===ejId?{...e,objetivo:val}:e)}:d);
    setRutina(r);
  };

  const eliminarEj = (ejId) => {
    const r = rutina.map((d,i)=>i===diaIdx?{...d,ejercicios:d.ejercicios.filter(e=>e.id!==ejId)}:d);
    setRutina(r);
  };

  const iniciarReemplazo = (ej) => {
    setReemplazando(ej.id);
    setShowSel(true);
  };

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",paddingBottom:"48px"}}>
      <div style={{padding:"20px 16px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:`linear-gradient(180deg,${perfil.color}10 0%,transparent 100%)`}}>
        <BtnBack onClick={onBack}/>
        <h2 style={{margin:"0 0 4px",fontSize:"20px"}}>Armá tu rutina</h2>
        <p style={{color:"#555",fontSize:"12px",margin:"0 0 14px"}}>Creá días y elegí los ejercicios. Podés reemplazar cualquier ejercicio por otro del mismo músculo.</p>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px"}}>
          {rutina.map((d,i)=>(
            <button key={d.id} onClick={()=>setDiaIdx(i)}
              style={{background:diaIdx===i?d.color:"rgba(255,255,255,0.05)",color:diaIdx===i?"#000":"#888",border:`1px solid ${diaIdx===i?d.color:"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>{d.nombre}</button>
          ))}
          <button onClick={()=>setShowNuevoDia(true)}
            style={{background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.15)",borderRadius:"8px",padding:"6px 14px",fontSize:"12px",color:"#555",cursor:"pointer",whiteSpace:"nowrap"}}>+ Día</button>
        </div>
      </div>

      <div style={{padding:"16px",maxWidth:"560px",margin:"0 auto"}}>
        {rutina.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{fontSize:"36px",marginBottom:"12px"}}>📋</div>
            <p style={{color:"#555",marginBottom:"20px"}}>Todavía no tenés días en tu rutina</p>
            <button onClick={()=>setShowNuevoDia(true)}
              style={{padding:"12px 24px",background:`${perfil.color}18`,border:`1px solid ${perfil.color}50`,borderRadius:"10px",color:perfil.color,fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>+ Crear primer día</button>
          </div>
        ) : dia && (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <div>
                <div style={{fontSize:"18px",fontWeight:"700"}}>{dia.nombre}</div>
                <Mono c={dia.color} s="11px">{dia.ejercicios.length} ejercicios</Mono>
              </div>
              <button onClick={()=>eliminarDia(diaIdx)}
                style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.2)",borderRadius:"8px",padding:"6px 10px",color:"#ff6060",fontSize:"11px",cursor:"pointer"}}>Eliminar día</button>
            </div>

            {dia.ejercicios.map(ej=>(
              <div key={ej.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"12px 14px",marginBottom:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",color:"#e0e0e0",marginBottom:"6px"}}>{ej.nombre}{ej.tag&&<Tag t={ej.tag}/>}</div>
                    <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                      <Mono c="#555" s="10px">SERIES×REPS:</Mono>
                      <input value={ej.objetivo} onChange={e=>editarObj(ej.id,e.target.value)}
                        style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${dia.color}40`,borderRadius:"6px",padding:"3px 8px",color:dia.color,fontSize:"12px",fontFamily:"monospace",outline:"none",width:"80px"}}/>
                      <button onClick={()=>iniciarReemplazo(ej)}
                        style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",padding:"3px 10px",color:"#aaa",fontSize:"11px",cursor:"pointer"}}>
                        🔄 Reemplazar
                      </button>
                    </div>
                  </div>
                  <button onClick={()=>eliminarEj(ej.id)}
                    style={{background:"none",border:"none",color:"#444",fontSize:"18px",cursor:"pointer",marginLeft:"8px"}}>×</button>
                </div>
              </div>
            ))}

            <button onClick={()=>{setReemplazando(null);setShowSel(true);}}
              style={{width:"100%",padding:"12px",background:`${dia.color}10`,border:`1px dashed ${dia.color}50`,borderRadius:"12px",color:dia.color,fontSize:"13px",fontWeight:"700",cursor:"pointer",marginTop:"4px"}}>
              + Agregar ejercicio
            </button>
          </>
        )}

        {rutina.length>0&&(
          <button onClick={()=>onSave(rutina)}
            style={{width:"100%",marginTop:"24px",padding:"14px",background:perfil.color,border:"none",borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
            Guardar rutina ✓
          </button>
        )}
      </div>

      {showNuevoDia&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:150,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowNuevoDia(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#141418",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:"480px"}}>
            <div style={{width:"36px",height:"4px",background:"#333",borderRadius:"2px",margin:"0 auto 16px"}}/>
            <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"16px"}}>Nuevo día</div>
            <input placeholder="Ej: Empuje, Piernas, Pull..." value={nombreDia} onChange={e=>setNombreDia(e.target.value)}
              style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"12px 14px",color:"#f0f0f0",fontSize:"15px",outline:"none",marginBottom:"16px",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>
              {COLORES.map(c=><div key={c} onClick={()=>setColorDia(c)} style={{width:"30px",height:"30px",borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${colorDia===c?"#fff":"transparent"}`}}/>)}
            </div>
            <button onClick={agregarDia}
              style={{width:"100%",padding:"13px",background:colorDia,border:"none",borderRadius:"10px",color:"#000",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>Crear día</button>
          </div>
        </div>
      )}

      {showSel&&dia&&(
        <SelectorEjercicios
          color={dia.color}
          onAdd={agregarEj}
          onClose={()=>{setShowSel(false);setReemplazando(null);}}
          yaAgregados={reemplazando ? [] : dia.ejercicios.map(e=>e.id)}
          musculoSugerido={reemplazando ? (dia.ejercicios.find(e=>e.id===reemplazando)?.musculo||null) : null}
        />
      )}
    </div>
  );
}

// ─── PANTALLA ENTRENAR ────────────────────────────────────────────────────────
function PantallaEntrenar({ perfil, onSaveHistorial, onBack }) {
  const [diaIdx, setDiaIdx] = useState(0);
  // sesionEjercicios: guarda datos EN CURSO ejercicio por ejercicio
  const [sesionEjercicios, setSesionEjercicios] = useState({});
  const [sesionActiva, setSesionActiva] = useState(false);
  const [sesionFecha, setSesionFecha] = useState("");
  const [sesionDayId, setSesionDayId] = useState("");
  const [meta, setMeta] = useState({ sensacion:"", nota:"", duracion:"" });
  const [tab, setTab] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [show1RM, setShow1RM] = useState(false);
  const [modalEj, setModalEj] = useState(null);

  const dia = perfil.rutina?.[diaIdx];
  const historial = perfil.historial||{};

  const ejComp = (ejId) => {
    const datos = sesionEjercicios[ejId];
    return datos?.series?.some(s=>s.completada);
  };
  const totalComp = dia?.ejercicios?.filter(e=>ejComp(e.id)).length||0;
  const progreso = dia ? Math.round((totalComp/dia.ejercicios.length)*100) : 0;

  const iniciarSesion = () => {
    setSesionEjercicios({});
    setSesionActiva(true);
    setSesionFecha(today());
    setSesionDayId(dia?.id||"");
    setMeta({ sensacion:"", nota:"", duracion:"" });
  };

  // FIX: guardarEjercicio recibe los datos y los aplica directamente al estado
  const guardarEjercicio = useCallback((ejId, datos) => {
    setSesionEjercicios(prev => ({ ...prev, [ejId]: datos }));
  }, []);

  const finalizarSesion = () => {
    if (!sesionActiva) return;
    // FIX: usar sesionEjercicios directamente como snapshot
    const sesion = {
      id: `${sesionDayId}_${Date.now()}`,
      fecha: sesionFecha,
      dayId: sesionDayId,
      ejercicios: { ...sesionEjercicios },
      sensacion: meta.sensacion,
      nota: meta.nota,
      duracion: meta.duracion,
    };
    const key = sesionDayId;
    const nuevo_historial = { ...historial, [key]: [sesion, ...(historial[key]||[])] };
    onSaveHistorial(nuevo_historial);
    setSesionActiva(false);
    setSesionEjercicios({});
  };

  const cambiarDia = (i) => {
    setDiaIdx(i);
    setSesionActiva(false);
    setSesionEjercicios({});
  };

  const tabs = ["Entrenar","Historial","Progreso"];

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",paddingBottom:"48px"}}>
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:`linear-gradient(180deg,${perfil.color}10 0%,transparent 100%)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#666",fontSize:"14px",cursor:"pointer",padding:0}}>← Perfiles</button>
          <div style={{display:"flex",gap:"6px"}}>
            <button onClick={()=>setShow1RM(true)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"6px 10px",color:"#aaa",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>1RM</button>
            <button onClick={()=>setShowTimer(true)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"6px 10px",color:"#aaa",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>⏱</button>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:perfil.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:"700",color:"#000"}}>{perfil.nombre[0].toUpperCase()}</div>
          <div>
            <div style={{fontSize:"18px",fontWeight:"700"}}>{perfil.nombre}</div>
            {perfil.objetivo&&<Mono c="#555" s="11px">{perfil.objetivo}</Mono>}
          </div>
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {tabs.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              style={{background:tab===i?perfil.color:"rgba(255,255,255,0.05)",color:tab===i?"#000":"#777",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:tab===i?"700":"400",cursor:"pointer"}}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 16px",maxWidth:"560px",margin:"0 auto"}}>

        {/* ══ ENTRENAR ══ */}
        {tab===0&&(
          <>
            {(!perfil.rutina||perfil.rutina.length===0) ? (
              <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{fontSize:"36px",marginBottom:"12px"}}>🏋️</div>
                <p style={{color:"#555"}}>Todavía no armaste tu rutina. Volvé al perfil y tocá "Armar rutina".</p>
              </div>
            ):(
              <>
                <div style={{display:"flex",gap:"6px",marginBottom:"14px",overflowX:"auto",paddingBottom:"4px"}}>
                  {perfil.rutina.map((d,i)=>(
                    <button key={d.id} onClick={()=>cambiarDia(i)}
                      style={{background:diaIdx===i?d.color:"rgba(255,255,255,0.05)",color:diaIdx===i?"#000":"#888",border:`1px solid ${diaIdx===i?d.color:"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>{d.nombre}</button>
                  ))}
                </div>

                {dia&&(
                  <>
                    {sesionActiva&&(
                      <div style={{marginBottom:"12px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                          <Mono c="#888" s="10px">SESIÓN ACTIVA · {fmtDate(sesionFecha)}</Mono>
                          <Mono c={dia.color} s="10px">{totalComp}/{dia.ejercicios.length}</Mono>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:"4px",height:"4px"}}>
                          <div style={{background:dia.color,borderRadius:"4px",height:"4px",width:`${progreso}%`,transition:"width 0.3s"}}/>
                        </div>
                      </div>
                    )}

                    {!sesionActiva&&(
                      <button onClick={iniciarSesion}
                        style={{width:"100%",padding:"14px",background:`${dia.color}18`,border:`1px solid ${dia.color}50`,borderRadius:"12px",color:dia.color,fontSize:"14px",fontWeight:"700",cursor:"pointer",marginBottom:"12px"}}>
                        ▶ Iniciar sesión de hoy
                      </button>
                    )}

                    <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
                      {dia.ejercicios.map(ej=>{
                        const comp = ejComp(ej.id);
                        const datos = sesionEjercicios[ej.id];
                        const sc = datos?.series?.filter(s=>s.completada)||[];
                        const maxP = sc.length>0?Math.max(...sc.map(s=>parseFloat(s.peso)||0)):0;
                        // Último historial
                        const hist = historial[dia.id]||[];
                        const lastSc = hist[0]?.ejercicios?.[ej.id]?.series?.filter(s=>s.completada&&s.peso)||[];
                        const lastP = lastSc.length>0?Math.max(...lastSc.map(s=>parseFloat(s.peso)||0)):0;
                        return (
                          <div key={ej.id} onClick={()=>sesionActiva&&setModalEj(ej)}
                            style={{background:comp?`${dia.color}12`:"rgba(255,255,255,0.04)",border:`1px solid ${comp?dia.color+"50":"rgba(255,255,255,0.07)"}`,borderRadius:"12px",padding:"12px 14px",cursor:sesionActiva?"pointer":"default",transition:"all 0.15s"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:"13px",color:comp?"#fff":"#ddd"}}>
                                  {comp&&<span style={{color:dia.color,marginRight:"6px"}}>✓</span>}
                                  {ej.nombre}{ej.tag&&<Tag t={ej.tag}/>}
                                </div>
                                <div style={{marginTop:"5px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
                                  <Mono c={dia.color} s="11px">{ej.objetivo}</Mono>
                                  {lastP>0&&!comp&&<Mono c="#444" s="10px">último: {lastP}kg</Mono>}
                                  {maxP>0&&<Pill c={dia.color}>↑ {maxP}kg hoy</Pill>}
                                  {sc.length>0&&<Mono c="#777" s="10px">{sc.length} series</Mono>}
                                </div>
                              </div>
                              {sesionActiva&&<Mono c={comp?dia.color:"#333"} s="11px">{comp?"editar":"→"}</Mono>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {sesionActiva&&(
                      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"16px"}}>
                        <div style={{fontSize:"13px",color:"#aaa",marginBottom:"12px",fontWeight:"600"}}>¿Cómo te sentiste hoy?</div>
                        <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
                          {[{v:"bien",e:"💪"},{v:"normal",e:"😐"},{v:"cansado",e:"😴"}].map(({v,e})=>(
                            <button key={v} onClick={()=>setMeta(p=>({...p,sensacion:v}))}
                              style={{flex:1,padding:"10px",background:meta.sensacion===v?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${meta.sensacion===v?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:"8px",fontSize:"20px",cursor:"pointer"}}>{e}</button>
                          ))}
                        </div>
                        <input type="number" placeholder="Duración (min)" value={meta.duracion} onChange={e=>setMeta(p=>({...p,duracion:e.target.value}))}
                          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"9px 12px",color:"#f0f0f0",fontSize:"13px",outline:"none",marginBottom:"10px",boxSizing:"border-box"}}/>
                        <textarea placeholder="Nota de la sesión..." value={meta.nota} onChange={e=>setMeta(p=>({...p,nota:e.target.value}))}
                          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"9px 12px",color:"#ccc",fontSize:"12px",resize:"none",height:"50px",outline:"none",marginBottom:"12px",boxSizing:"border-box"}}/>
                        <button onClick={finalizarSesion}
                          style={{width:"100%",padding:"14px",background:dia.color,border:"none",borderRadius:"10px",color:"#000",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>✓ Guardar sesión completa</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ══ HISTORIAL ══ */}
        {tab===1&&(
          <>
            <div style={{display:"flex",gap:"6px",marginBottom:"14px",overflowX:"auto",paddingBottom:"4px"}}>
              {(perfil.rutina||[]).map((d,i)=>(
                <button key={d.id} onClick={()=>setDiaIdx(i)}
                  style={{background:diaIdx===i?d.color:"rgba(255,255,255,0.05)",color:diaIdx===i?"#000":"#888",border:`1px solid ${diaIdx===i?d.color:"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>{d.nombre}</button>
              ))}
            </div>
            {dia&&(()=>{
              const hist = historial[dia.id]||[];
              if (hist.length===0) return (
                <div style={{textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:"28px",marginBottom:"8px"}}>📋</div>
                  <p style={{color:"#555",fontSize:"13px"}}>Sin sesiones registradas aún.<br/>Iniciá una desde la pestaña Entrenar.</p>
                </div>
              );
              return hist.map(s=>{
                const ejList = Object.entries(s.ejercicios||{});
                const compCount = ejList.filter(([,d])=>d?.series?.some(x=>x.completada)).length;
                return (
                  <details key={s.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",marginBottom:"8px",overflow:"hidden"}}>
                    <summary style={{padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",listStyle:"none"}}>
                      <div>
                        <div style={{fontSize:"14px",fontWeight:"600"}}>{fmtDate(s.fecha)}</div>
                        <div style={{fontSize:"11px",color:"#666"}}>{compCount}/{ejList.length} ejercicios{s.duracion?` · ${s.duracion} min`:""}</div>
                      </div>
                      <span style={{fontSize:"16px"}}>{s.sensacion==="bien"?"💪":s.sensacion==="normal"?"😐":s.sensacion==="cansado"?"😴":""}</span>
                    </summary>
                    <div style={{padding:"0 16px 14px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                      {ejList.map(([ejId,data])=>{
                        const ejInfo=(perfil.rutina||[]).flatMap(d=>d.ejercicios).find(e=>e.id===ejId);
                        if(!ejInfo) return null;
                        const sc=(data?.series||[]).filter(x=>x.completada&&(x.peso||x.reps));
                        if(sc.length===0) return null;
                        const maxP = Math.max(...sc.map(x=>parseFloat(x.peso)||0));
                        const maxReps = sc.find(x=>(parseFloat(x.peso)||0)===maxP)?.reps;
                        const rm1 = calc1RM(maxP, maxReps);
                        return (
                          <div key={ejId} style={{marginTop:"10px"}}>
                            <div style={{fontSize:"12px",color:"#bbb",marginBottom:"5px"}}>{ejInfo.nombre}</div>
                            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                              {sc.map((x,i)=>(
                                <div key={i} style={{background:`${dia.color}15`,border:`1px solid ${dia.color}30`,borderRadius:"6px",padding:"3px 8px",fontSize:"11px",fontFamily:"monospace",color:dia.color}}>
                                  {x.peso?x.peso+"kg":"—"} × {x.reps||"—"}
                                </div>
                              ))}
                              {maxP>0&&<Pill c="#FFD700">↑ {maxP}kg</Pill>}
                              {rm1&&<Pill c="#A78BFA">1RM ~{rm1}kg</Pill>}
                            </div>
                          </div>
                        );
                      })}
                      {s.nota&&<div style={{marginTop:"10px",fontSize:"12px",color:"#555",fontStyle:"italic"}}>📝 {s.nota}</div>}
                    </div>
                  </details>
                );
              });
            })()}
          </>
        )}

        {/* ══ PROGRESO ══ */}
        {tab===2&&(
          <>
            <div style={{display:"flex",gap:"6px",marginBottom:"14px",overflowX:"auto",paddingBottom:"4px"}}>
              {(perfil.rutina||[]).map((d,i)=>(
                <button key={d.id} onClick={()=>setDiaIdx(i)}
                  style={{background:diaIdx===i?d.color:"rgba(255,255,255,0.05)",color:diaIdx===i?"#000":"#888",border:`1px solid ${diaIdx===i?d.color:"rgba(255,255,255,0.08)"}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",whiteSpace:"nowrap"}}>{d.nombre}</button>
              ))}
            </div>
            {dia&&(()=>{
              const hist=[...(historial[dia.id]||[])].reverse();
              return (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"20px"}}>
                    {[
                      {label:"Sesiones",value:(historial[dia.id]||[]).length},
                      {label:"Última",value:(historial[dia.id]||[])[0]?.fecha?fmtDate((historial[dia.id])[0].fecha):"—"},
                      {label:"Ejercicios",value:dia.ejercicios.length},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"12px 8px",textAlign:"center"}}>
                        <div style={{fontSize:"20px",fontWeight:"700",color:dia.color}}>{s.value}</div>
                        <div style={{fontSize:"9px",color:"#555",fontFamily:"monospace",marginTop:"2px"}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {hist.length<2?(
                    <div style={{textAlign:"center",padding:"32px 20px"}}>
                      <div style={{fontSize:"26px",marginBottom:"8px"}}>📈</div>
                      <p style={{color:"#555",fontSize:"13px"}}>Necesitás al menos 2 sesiones para ver el progreso.</p>
                    </div>
                  ):(
                    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",overflowX:"auto"}}>
                      {dia.ejercicios.map(ej=>{
                        const pts=hist
                          .filter(s=>s.ejercicios?.[ej.id]?.series?.some(x=>x.completada&&x.peso))
                          .map(s=>{
                            const sc=(s.ejercicios[ej.id].series||[]).filter(x=>x.completada&&x.peso);
                            return {fecha:fmtDate(s.fecha),maxP:Math.max(...sc.map(x=>parseFloat(x.peso)||0))};
                          }).slice(-6);
                        if(pts.length<2) return null;
                        const maxV=Math.max(...pts.map(p=>p.maxP)),minV=Math.min(...pts.map(p=>p.maxP));
                        const rng=maxV-minV||1,w=300,h=60,pad=12;
                        const coords=pts.map((p,i)=>({x:pad+(i/(pts.length-1))*(w-pad*2),y:h-pad-((p.maxP-minV)/rng)*(h-pad*2),...p}));
                        const path=coords.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
                        return (
                          <div key={ej.id} style={{marginBottom:"20px"}}>
                            <div style={{fontSize:"12px",color:"#bbb",marginBottom:"8px"}}>{ej.nombre}</div>
                            <svg width={w} height={h} style={{overflow:"visible",display:"block"}}>
                              <path d={path} fill="none" stroke={dia.color} strokeWidth="2" strokeLinejoin="round"/>
                              {coords.map((p,i)=>(
                                <g key={i}>
                                  <circle cx={p.x} cy={p.y} r="4" fill={dia.color}/>
                                  <text x={p.x} y={p.y-8} textAnchor="middle" fontSize="9" fill={dia.color} fontFamily="monospace">{p.maxP}kg</text>
                                </g>
                              ))}
                            </svg>
                            <div style={{display:"flex",justifyContent:"space-between",width:w}}>
                              {coords.map((p,i)=><span key={i} style={{fontSize:"9px",color:"#444",fontFamily:"monospace"}}>{p.fecha.slice(0,5)}</span>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      {showTimer&&<Timer color={perfil.color} onClose={()=>setShowTimer(false)}/>}
      {show1RM&&<Calc1RM color={perfil.color} onClose={()=>setShow1RM(false)}/>}
      {modalEj&&sesionActiva&&dia&&(
        <ModalEjercicio
          ejercicio={modalEj}
          color={dia.color}
          existente={sesionEjercicios[modalEj.id]}
          onSave={(datos)=>guardarEjercicio(modalEj.id, datos)}
          onClose={()=>setModalEj(null)}
          onTimer={()=>setShowTimer(true)}
          on1RM={()=>setShow1RM(true)}
        />
      )}
    </div>
  );
}

// ─── PANTALLA FOTOS ───────────────────────────────────────────────────────────
function PantallaFotos({ perfil, onSave, onBack }) {
  const [fotos, setFotos] = useState(perfil.fotos||[]);
  const [vista, setVista] = useState(null);
  const fileRef = useRef();

  const agregar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const f = { id:Date.now().toString(), fecha:today(), data:ev.target.result, nota:"" };
      const nuevas = [f, ...fotos];
      setFotos(nuevas); onSave(nuevas);
    };
    reader.readAsDataURL(file);
  };

  const eliminar = (id) => { const f=fotos.filter(x=>x.id!==id); setFotos(f); onSave(f); setVista(null); };
  const updNota = (id, nota) => { const f=fotos.map(x=>x.id===id?{...x,nota}:x); setFotos(f); onSave(f); };

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",padding:"28px 20px 48px"}}>
      <BtnBack onClick={onBack}/>
      <h2 style={{margin:"0 0 4px",fontSize:"20px"}}>Fotos de progreso</h2>
      <p style={{color:"#555",fontSize:"13px",margin:"0 0 20px"}}>Registrá tu evolución física</p>
      <input ref={fileRef} type="file" accept="image/*" onChange={agregar} style={{display:"none"}}/>
      <button onClick={()=>fileRef.current?.click()}
        style={{width:"100%",maxWidth:"480px",padding:"14px",background:`${perfil.color}15`,border:`1px dashed ${perfil.color}50`,borderRadius:"12px",color:perfil.color,fontSize:"14px",fontWeight:"700",cursor:"pointer",marginBottom:"20px"}}>
        📸 Agregar foto de hoy
      </button>
      {fotos.length===0?(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>📷</div>
          <p style={{color:"#555",fontSize:"14px"}}>Todavía no hay fotos. Agregá una hoy para empezar a ver tu progreso.</p>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",maxWidth:"480px"}}>
          {fotos.map(f=>(
            <div key={f.id} onClick={()=>setVista(f)} style={{borderRadius:"12px",overflow:"hidden",cursor:"pointer",border:"1px solid rgba(255,255,255,0.08)"}}>
              <img src={f.data} alt="" style={{width:"100%",height:"160px",objectFit:"cover",display:"block"}}/>
              <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.03)"}}>
                <Mono c={perfil.color} s="11px">{fmtDate(f.fecha)}</Mono>
                {f.nota&&<div style={{fontSize:"11px",color:"#555",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nota}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {vista&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setVista(null)}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:"480px",width:"100%"}}>
            <img src={vista.data} alt="" style={{width:"100%",borderRadius:"12px",maxHeight:"55vh",objectFit:"contain",display:"block"}}/>
            <div style={{padding:"16px 0"}}>
              <Mono c={perfil.color}>{fmtDate(vista.fecha)}</Mono>
              <textarea placeholder="Nota..." value={vista.nota||""} onChange={e=>{setVista({...vista,nota:e.target.value});updNota(vista.id,e.target.value);}}
                style={{display:"block",width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"10px",color:"#ccc",fontSize:"13px",resize:"none",height:"52px",outline:"none",marginTop:"10px",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:"10px",marginTop:"12px"}}>
                <button onClick={()=>setVista(null)} style={{flex:1,padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#888",fontSize:"13px",cursor:"pointer"}}>Cerrar</button>
                <button onClick={()=>eliminar(vista.id)} style={{flex:1,padding:"12px",background:"rgba(255,80,80,0.1)",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"10px",color:"#ff6060",fontSize:"13px",cursor:"pointer"}}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PANTALLA RECORDATORIOS ───────────────────────────────────────────────────
function PantallaRecordatorios({ perfil, onSave, onBack }) {
  const dias = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const [rec, setRec] = useState(perfil.recordatorios||{});

  const toggle = (d) => {
    setRec(prev => {
      if (prev[d]) { const n={...prev}; delete n[d]; return n; }
      return {...prev,[d]:"08:00"};
    });
  };

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",padding:"28px 20px 48px"}}>
      <BtnBack onClick={onBack}/>
      <h2 style={{margin:"0 0 4px",fontSize:"20px"}}>Recordatorios</h2>
      <p style={{color:"#555",fontSize:"13px",margin:"0 0 8px"}}>Activá los días que querés entrenar</p>
      <p style={{color:"#444",fontSize:"11px",margin:"0 0 24px"}}>Nota: las notificaciones funcionan cuando instalás la app en tu celu y le das permiso.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"10px",maxWidth:"480px"}}>
        {dias.map(d=>{
          const act = !!rec[d];
          return (
            <div key={d} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${act?perfil.color+"50":"rgba(255,255,255,0.08)"}`,borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div onClick={()=>toggle(d)} style={{width:"44px",height:"26px",borderRadius:"13px",background:act?perfil.color:"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                  <div style={{position:"absolute",top:"3px",left:act?"21px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                </div>
                <span style={{fontSize:"15px",fontWeight:act?"600":"400",color:act?"#f0f0f0":"#666"}}>{d}</span>
              </div>
              {act&&(
                <input type="time" value={rec[d]} onChange={e=>setRec(p=>({...p,[d]:e.target.value}))}
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${perfil.color}50`,borderRadius:"8px",padding:"6px 10px",color:perfil.color,fontSize:"14px",fontFamily:"monospace",outline:"none"}}/>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={()=>onSave(rec)}
        style={{marginTop:"24px",width:"100%",maxWidth:"480px",padding:"14px",background:perfil.color,border:"none",borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
        Guardar recordatorios ✓
      </button>
    </div>
  );
}

// ─── PANTALLA DETALLE PERFIL ──────────────────────────────────────────────────
function PantallaDetalle({ perfil, onEntrenar, onRutina, onEditarPerfil, onFotos, onRecordatorios, onBack }) {
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif"}}>
      <div style={{padding:"24px 20px 20px",background:`linear-gradient(180deg,${perfil.color}15 0%,transparent 100%)`,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <BtnBack onClick={onBack}/>
        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{width:"52px",height:"52px",borderRadius:"50%",background:perfil.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:"700",color:"#000"}}>{perfil.nombre[0].toUpperCase()}</div>
          <div>
            <div style={{fontSize:"22px",fontWeight:"700"}}>{perfil.nombre}</div>
            {perfil.objetivo&&<div style={{fontSize:"12px",color:"#666",marginTop:"2px"}}>{perfil.objetivo}</div>}
            {perfil.lesion&&<div style={{fontSize:"11px",color:"#FF6B35",marginTop:"2px"}}>⚠️ {perfil.lesion}</div>}
          </div>
        </div>
      </div>
      <div style={{padding:"20px",maxWidth:"480px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"10px"}}>
        <button onClick={onEntrenar} style={{padding:"16px",background:perfil.color,border:"none",borderRadius:"12px",color:"#000",fontSize:"16px",fontWeight:"700",cursor:"pointer"}}>🏋️ Ir a entrenar</button>
        <button onClick={onRutina} style={{padding:"14px",background:`${perfil.color}15`,border:`1px solid ${perfil.color}40`,borderRadius:"12px",color:perfil.color,fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
          📋 {perfil.rutina?.length>0?"Editar rutina":"Armar rutina"}
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <button onClick={onFotos} style={{padding:"12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",color:"#aaa",fontSize:"13px",cursor:"pointer"}}>📸 Fotos de progreso</button>
          <button onClick={onRecordatorios} style={{padding:"12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",color:"#aaa",fontSize:"13px",cursor:"pointer"}}>🔔 Recordatorios</button>
        </div>
        <button onClick={onEditarPerfil} style={{padding:"12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",color:"#888",fontSize:"13px",cursor:"pointer"}}>✏️ Editar datos del perfil</button>
        {perfil.rutina?.length>0&&(
          <div style={{marginTop:"8px"}}>
            <Mono c="#444" s="10px">TU RUTINA</Mono>
            <div style={{marginTop:"10px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {perfil.rutina.map(d=>(
                <div key={d.id} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${d.color}30`,borderRadius:"10px",padding:"10px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:"14px",fontWeight:"600",color:d.color}}>{d.nombre}</div>
                    <Mono c="#555" s="10px">{d.ejercicios.length} ejercicios</Mono>
                  </div>
                  <div style={{fontSize:"11px",color:"#444",marginTop:"4px"}}>{d.ejercicios.slice(0,3).map(e=>e.nombre).join(" · ")}{d.ejercicios.length>3?"...":""}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PANTALLA PERFILES ────────────────────────────────────────────────────────
function PantallaPerfiles({ perfiles, onSelect, onCrear }) {
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f0",fontFamily:"sans-serif",padding:"40px 20px"}}>
      <div style={{maxWidth:"480px",margin:"0 auto"}}>
        <Mono c="#FF6B35" s="10px">GYM TRACKER</Mono>
        <h1 style={{margin:"8px 0 4px",fontSize:"28px",fontWeight:"700"}}>¿Quién entrena <span style={{color:"#FF6B35"}}>hoy?</span></h1>
        <p style={{color:"#555",fontSize:"13px",margin:"0 0 32px"}}>Cada perfil tiene su rutina e historial separado</p>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"24px"}}>
          {perfiles.map((p,i)=>(
            <div key={i} onClick={()=>onSelect(i)}
              style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${p.color}40`,borderRadius:"14px",padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:"14px"}}>
              <div style={{width:"44px",height:"44px",borderRadius:"50%",background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",color:"#000",flexShrink:0}}>{p.nombre[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:"16px",fontWeight:"700"}}>{p.nombre}</div>
                <div style={{fontSize:"11px",color:"#555",marginTop:"2px"}}>{p.rutina?.length>0?`${p.rutina.length} días de rutina`:"Sin rutina armada"}{p.objetivo?` · ${p.objetivo}`:""}</div>
              </div>
              <div style={{color:p.color,fontSize:"18px"}}>→</div>
            </div>
          ))}
        </div>
        <button onClick={onCrear}
          style={{width:"100%",padding:"14px",background:"rgba(255,107,53,0.1)",border:"1px dashed rgba(255,107,53,0.4)",borderRadius:"12px",color:"#FF6B35",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
          + Agregar perfil nuevo
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [appData, setAppData] = useState({ perfiles:[] });
  const [pantalla, setPantalla] = useState("perfiles");
  const [pidx, setPidx] = useState(null);

  useEffect(()=>{ setAppData(load()); },[]);

  const save = (newData) => { persist(newData); setAppData(newData); };
  const p = pidx !== null ? appData.perfiles[pidx] : null;

  const updPerfil = (datos) => {
    let ps;
    if (pidx!==null && appData.perfiles[pidx]) {
      ps = appData.perfiles.map((x,i)=>i===pidx?{...x,...datos}:x);
    } else {
      ps = [...appData.perfiles, datos];
      setPidx(ps.length-1);
    }
    save({...appData,perfiles:ps});
    setPantalla("detalle");
  };

  const updRutina = (rutina) => { const ps=appData.perfiles.map((x,i)=>i===pidx?{...x,rutina}:x); save({...appData,perfiles:ps}); setPantalla("detalle"); };
  const updHistorial = (historial) => { const ps=appData.perfiles.map((x,i)=>i===pidx?{...x,historial}:x); save({...appData,perfiles:ps}); };
  const updFotos = (fotos) => { const ps=appData.perfiles.map((x,i)=>i===pidx?{...x,fotos}:x); save({...appData,perfiles:ps}); };
  const updRec = (rec) => { const ps=appData.perfiles.map((x,i)=>i===pidx?{...x,recordatorios:rec}:x); save({...appData,perfiles:ps}); setPantalla("detalle"); };

  if (pantalla==="perfiles") return <PantallaPerfiles perfiles={appData.perfiles} onSelect={(i)=>{setPidx(i);setPantalla("detalle");}} onCrear={()=>{setPidx(null);setPantalla("crear");}}/>;
  if (pantalla==="crear") return <PantallaCrearPerfil perfil={pidx!==null?appData.perfiles[pidx]:null} onSave={updPerfil} onBack={()=>setPantalla(pidx!==null?"detalle":"perfiles")}/>;
  if (pantalla==="detalle"&&p) return <PantallaDetalle perfil={p} onEntrenar={()=>setPantalla("entrenar")} onRutina={()=>setPantalla("rutina")} onEditarPerfil={()=>setPantalla("crear")} onFotos={()=>setPantalla("fotos")} onRecordatorios={()=>setPantalla("recordatorios")} onBack={()=>setPantalla("perfiles")}/>;
  if (pantalla==="rutina"&&p) return <PantallaRutina perfil={p} onSave={updRutina} onBack={()=>setPantalla("detalle")}/>;
  if (pantalla==="entrenar"&&p) return <PantallaEntrenar perfil={p} onSaveHistorial={updHistorial} onBack={()=>setPantalla("detalle")}/>;
  if (pantalla==="fotos"&&p) return <PantallaFotos perfil={p} onSave={updFotos} onBack={()=>setPantalla("detalle")}/>;
  if (pantalla==="recordatorios"&&p) return <PantallaRecordatorios perfil={p} onSave={updRec} onBack={()=>setPantalla("detalle")}/>;
  return null;
}
