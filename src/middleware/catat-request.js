export function catatRequest(req, res, next) {
  const mulai = performance.now();
  const jalur = req.path;
  res.on("finish", () => {
    const durasi = Math.round(performance.now() - mulai);
    console.log(`${req.method} ${jalur} ${res.statusCode} ${durasi}ms`);
  });
  next();
}