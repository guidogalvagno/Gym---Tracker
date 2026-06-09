export const calc1RM = (peso, reps) => {
  if (!peso || !reps || reps <= 0) return null;
  if (parseInt(reps) === 1) return Math.round(parseFloat(peso));
  return Math.round(parseFloat(peso) * (1 + parseFloat(reps) / 30));
};
export const TABLA_1RM = [
  {reps:1,pct:100},{reps:2,pct:95},{reps:3,pct:93},{reps:4,pct:90},
  {reps:5,pct:87},{reps:6,pct:85},{reps:8,pct:80},{reps:10,pct:75},
  {reps:12,pct:70},{reps:15,pct:65},
];
export const fmtDate = (iso) => {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
export const today = () => new Date().toISOString().split("T")[0];
