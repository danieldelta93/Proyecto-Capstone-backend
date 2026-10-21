// Permite usar async/await en las rutas de Express 4 sin repetir try/catch.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
