import assert from "node:assert/strict";

let jumlah = 0;
try {
  const asal = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
  assert.equal(asal.pathname, "/", "Gunakan alamat dasar tanpa /api.");
  assert.ok(!asal.search && !asal.hash && !asal.username && !asal.password);
  assert.ok(
    asal.protocol === "https:" ||
      (asal.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(asal.hostname)),
    "Alamat publik wajib HTTPS.",
  );
  async function baca(path) {
    return fetch(new URL(path, asal), {
      headers: { Accept: "application/json, text/html" },
      signal: AbortSignal.timeout(120000),
    });
  }
  function lulus(nama) {
    jumlah++;
    console.log(`PASS ${nama}`);
  }
  for (const path of ["/healthz", "/api/health"]) {
    const r = await baca(path);
    assert.equal(r.status, 200, path);
    assert.match(r.headers.get("content-type") ?? "", /application\/json/);
    const json = await r.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, "ok");
    if (path === "/api/health") assert.equal(json.data.database, "connected");
    lulus(path);
  }
  const halaman = await baca("/");
  assert.equal(halaman.status, 200);
  assert.match(halaman.headers.get("content-type") ?? "", /text\/html/);
  const html = await halaman.text();
  assert.match(html, /id="app"/);
  lulus("HTML Vue");
  const aset = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)]
    .map((x) => x[1]);
  assert.ok(aset.some((x) => x.endsWith(".js")));
  assert.ok(aset.some((x) => x.endsWith(".css")));
  for (const path of aset) {
    const r = await baca(path);
    assert.equal(r.status, 200, path);
    assert.match(
      r.headers.get("content-type") ?? "",
      path.endsWith(".css") ? /text\/css/ : /javascript/,
    );
  }
  lulus("aset JavaScript dan CSS");
  for (const [path, status] of [
    ["/api/tidak-ada", 404],
    ["/api/auth/saya", 401],
    ["/api/dashboard", 401],
    ["/api/pesanan", 401],
    ["/.env", 404],
    ["/server.js", 404],
  ]) {
    const r = await baca(path);
    assert.equal(r.status, status, path);
    assert.match(r.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await r.json()).success, false);
    lulus(`${path} menolak dengan ${status}`);
  }
  console.log(`Selesai: ${jumlah} pemeriksaan lulus. Tidak ada data ditulis.`);
} catch (error) {
  console.error(`FAIL setelah ${jumlah} pemeriksaan: ${error.message}`);
  process.exitCode = 1;
}