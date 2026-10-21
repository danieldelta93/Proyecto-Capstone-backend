// Todas las fechas viajan como texto AAAA-MM-DD (sin hora) para evitar
// problemas de zona horaria.

// "Hoy" según la zona horaria del negocio (por defecto Chile).
export function hoyISO(zonaHoraria = "America/Santiago") {
  return new Date().toLocaleDateString("en-CA", { timeZone: zonaHoraria }); // en-CA da AAAA-MM-DD
}

export function sumarDias(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Lista de días desde `desde` hasta `hasta`, ambos incluidos
export function rangoDias(desde, hasta) {
  const dias = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

// 0 = domingo ... 6 = sábado
export function diaSemana(iso) {
  return new Date(iso + "T12:00:00Z").getUTCDay();
}

// Lunes de la semana a la que pertenece la fecha
export function inicioSemana(iso) {
  return sumarDias(iso, -((diaSemana(iso) + 6) % 7));
}

export const NOMBRES_DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
