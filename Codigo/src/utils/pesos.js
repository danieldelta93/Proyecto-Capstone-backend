export const pesos = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("es-CL");
