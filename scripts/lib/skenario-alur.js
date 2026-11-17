import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";

// Fixture milik pengujian; tidak memakai akun atau penawaran latihan yang ada.
export async function ujiAlur(pool, api) {
  const marker = "uji-alur-" + randomBytes(6).toString("hex");
  const kataSandi = randomBytes(24).toString("hex");
  const hash = await bcrypt.hash(kataSandi, 12);
  const pengguna = [],
    penyedia = [],
    offers = [];
  const hasil = [];
  const cek = (nama, fn) => {
    fn();
    hasil.push(nama);
    console.log("PASS " + nama);
  };
  const sukses = (r, code = 200) => {
    assert.equal(r.status, code, JSON.stringify(r.body?.error));
    return r.body.data;
  };
  const stok = async (id) =>
    Number(
      (await pool.query("SELECT stok FROM penawaran WHERE id=$1", [id])).rows[0]
        .stok,
    );
  const aksi = (id, value, token, extra = {}) =>
    api(
      "/api/pesanan/" + id + "/aksi",
      "POST",
      { aksi: value, ...extra },
      token,
    );
  try {
    const akun = [];
    for (const [nama, peran] of [
      ["Penyedia", "penyedia"],
      ["Pembeli", "pembeli"],
      ["Penyedia lain", "penyedia"],
      ["Pembeli lain", "pembeli"],
    ]) {
      const email = marker + "-" + akun.length + "@example.test";
      const u = await pool.query(
        "INSERT INTO pengguna (nama_lengkap,email,peran,kata_sandi_hash) VALUES ($1,$2,$3,$4) RETURNING id",
        [nama + " " + marker, email, peran, hash],
      );
      const id = String(u.rows[0].id);
      pengguna.push(id);
      if (peran === "penyedia") {
        const p = await pool.query(
          `INSERT INTO penyedia (pengguna_id,nama_usaha,alamat,nomor_telepon,status_verifikasi)
          VALUES ($1,$2,'Alamat fixture','0000000000','terverifikasi') RETURNING id`,
          [id, "Usaha " + marker + " " + akun.length],
        );
        penyedia.push(String(p.rows[0].id));
      }
      const sesi = sukses(
        await api("/api/auth/login", "POST", { email, kataSandi }),
      );
      assert.equal(sesi.pengguna.id, id); // Memastikan API memakai DB fixture yang sama.
      akun.push({ id, token: sesi.accessToken });
    }
    const [seller, buyer, sellerLain, buyerLain] = akun.map((a) => a.token);
    const isian = {
      nama: "Paket " + marker,
      kategori: "roti",
      hargaNormal: 20000,
      hargaPenawaran: 7000,
      stok: 5,
      satuan: "paket",
      status: "aktif",
      berakhirPada: new Date(Date.now() + 86400000).toISOString(),
    };
    async function buatOffer(extra = {}) {
      const p = sukses(
        await api("/api/penawaran", "POST", { ...isian, ...extra }, seller),
        201,
      );
      offers.push(p.id);
      return p;
    }
    const p = await buatOffer();
    cek("penawaran tanpa foto menggunakan fallback dan versi awal", () => {
      assert.equal(p.fotoUrl, null);
      assert.equal(p.versi, "0");
    });
    const pesan = async (id = p.id, n = 1) =>
      sukses(
        await api(
          "/api/pesanan",
          "POST",
          { items: [{ penawaranId: id, kuantitas: n }] },
          buyer,
        ),
        201,
      );
    const o = await pesan(p.id, 2);
    const s0 = await stok(p.id);
    cek("reservasi mengurangi stok sekali dan memakai harga server", () => {
      assert.equal(s0, 3);
      assert.equal(o.total, 14000);
      assert.equal(o.metodePembayaran, "di-tempat");
      assert.equal(o.statusPembayaran, "belum-dibayar");
      assert.deepEqual(o.bolehAksi, ["batal"]);
    });
    assert.equal((await aksi(o.id, "konfirmasi", buyer)).status, 403);
    cek("pembeli tidak dapat menerima pesanan sendiri", () => {});
    assert.equal((await aksi(o.id, "konfirmasi", sellerLain)).status, 404);
    assert.equal(
      (await api("/api/pesanan/" + o.id, "GET", undefined, buyerLain)).status,
      404,
    );
    assert.equal(
      (await aksi(o.id, "batal", buyerLain, { alasan: "Fixture" })).status,
      404,
    );
    cek("penyedia dan pembeli lain tidak dapat mengakses pesanan", () => {});
    const dibatal = sukses(
      await aksi(o.id, "batal", buyer, { alasan: "Rencana berubah" }),
    );
    const s1 = await stok(p.id);
    cek("pembatalan pembeli sebelum konfirmasi mengembalikan stok", () => {
      assert.equal(dibatal.status, "dibatalkan");
      assert.equal(dibatal.jenisPembatalan, "pembeli");
      assert.equal(s1, 5);
      assert.equal(dibatal.alasanPembatalan, "Rencana berubah");
    });
    assert.equal(
      (await aksi(o.id, "batal", buyer, { alasan: "Ulang" })).status,
      409,
    );
    const s2 = await stok(p.id);
    cek("pengulangan pembatalan tidak mengembalikan stok dua kali", () =>
      assert.equal(s2, 5),
    );
    const rejected = await pesan();
    const tolak = sukses(
      await aksi(rejected.id, "tolak", seller, {
        alasan: "Makanan tidak tersedia",
      }),
    );
    const s3 = await stok(p.id);
    cek("penolakan penyedia tercatat dan memulihkan reservasi", () => {
      assert.equal(tolak.jenisPembatalan, "ditolak-penyedia");
      assert.equal(s3, 5);
    });
    const done = await pesan(p.id, 2);
    assert.equal(
      (await aksi(done.id, "selesai", seller, { pembayaranDiterima: true }))
        .status,
      409,
    );
    const confirmed = sukses(await aksi(done.id, "konfirmasi", seller));
    assert.equal(
      (await aksi(done.id, "batal", buyer, { alasan: "Terlambat" })).status,
      409,
    );
    assert.equal(
      (await aksi(done.id, "tolak", seller, { alasan: "Sudah diterima" }))
        .status,
      409,
    );
    const s4 = await stok(p.id);
    cek(
      "konfirmasi membatasi pembatalan pembeli tanpa mengurangi stok lagi",
      () => {
        assert.equal(confirmed.status, "dikonfirmasi");
        assert.equal(s4, 3);
      },
    );
    const ready = sukses(await aksi(done.id, "siap", seller));
    assert.equal((await aksi(done.id, "selesai", seller)).status, 400);
    const beforePaid = sukses(
      await api("/api/dashboard", "GET", undefined, seller),
    );
    cek("pesanan siap belum menjadi pendapatan atau pengambilan", () => {
      assert.equal(ready.status, "siap-diambil");
      assert.ok(ready.pengambilan.kode);
      assert.equal(beforePaid.pendapatanDiterima, "0");
      assert.equal(beforePaid.unitTersalurkan, "0");
    });
    const completed = sukses(
      await aksi(done.id, "selesai", seller, { pembayaranDiterima: true }),
    );
    const s5 = await stok(p.id);
    cek(
      "serah terima berbayar mencatat pembayaran dan pengambilan secara atomik",
      () => {
        assert.equal(completed.status, "selesai");
        assert.equal(completed.statusPembayaran, "dibayar");
        assert.ok(completed.dibayarPada);
        assert.equal(completed.pengambilan.status, "diambil");
        assert.ok(completed.pengambilan.diambilPada);
        assert.equal(s5, 3);
      },
    );
    assert.equal(
      (await aksi(done.id, "selesai", seller, { pembayaranDiterima: true }))
        .status,
      409,
    );
    assert.equal(
      (await aksi(done.id, "batal", seller, { alasan: "Sudah selesai" }))
        .status,
      409,
    );
    cek(
      "pesanan selesai tidak dapat diselesaikan atau dibatalkan ulang",
      () => {},
    );
    const free = await buatOffer({
      hargaNormal: 18000,
      hargaPenawaran: 0,
      stok: 2,
      kategori: "bahan-segar",
    });
    const gratis = await pesan(free.id, 1);
    sukses(await aksi(gratis.id, "konfirmasi", seller));
    sukses(await aksi(gratis.id, "siap", seller));
    const gratisSelesai = sukses(await aksi(gratis.id, "selesai", seller));
    cek("makanan gratis selesai tanpa menambah pendapatan", () => {
      assert.equal(gratisSelesai.statusPembayaran, "gratis");
      assert.equal(gratisSelesai.total, 0);
      assert.equal(gratisSelesai.dibayarPada, null);
    });
    const dbBuyer = sukses(
      await api("/api/dashboard", "GET", undefined, buyer),
    );
    const dbSeller = sukses(
      await api("/api/dashboard", "GET", undefined, seller),
    );
    cek(
      "dashboard menghitung belanja, diskon, unit, nilai normal dan pembatalan tepat",
      () => {
        assert.equal(dbBuyer.totalBelanja, "14000");
        assert.equal(dbBuyer.penghematanPembeli, "44000");
        assert.equal(dbBuyer.unitTersalurkan, "3");
        assert.equal(dbBuyer.jumlahDibatalkan, "2");
        assert.equal(dbSeller.pendapatanDiterima, "14000");
        assert.equal(dbSeller.nilaiNormalTersalurkan, "58000");
        assert.equal(dbSeller.diskonDiberikan, "44000");
        assert.equal(dbSeller.penghematanBiayaPenjual, null);
      },
    );
    const dbLain = sukses(
      await api("/api/dashboard", "GET", undefined, sellerLain),
    );
    cek("dashboard usaha lain tetap nol", () =>
      assert.equal(dbLain.pendapatanDiterima, "0"),
    );
    const pic = await sharp({
      create: { width: 40, height: 30, channels: 3, background: "#16634a" },
    })
      .png()
      .toBuffer();
    const photoOffer = await buatOffer({
      foto: "data:image/png;base64," + pic.toString("base64"),
    });
    const gambar = await api(photoOffer.fotoUrl, "GET");
    const metadata = await sharp(gambar.bytes).metadata();
    cek("foto PNG diproses sebagai WebP dan terlayani dari database", () => {
      assert.equal(gambar.status, 200);
      assert.equal(gambar.contentType, "image/webp");
      assert.equal(metadata.format, "webp");
      assert.ok(gambar.bytes.length <= 409600);
    });
    assert.equal(
      (
        await api(
          "/api/penawaran",
          "POST",
          { ...isian, foto: "data:image/svg+xml;base64,PHN2Zz4=" },
          seller,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await api(
          "/api/penawaran",
          "POST",
          { ...isian, foto: "data:image/png;base64,YWJj" },
          seller,
        )
      ).status,
      400,
    );
    cek("SVG dan berkas palsu ditolak tanpa penawaran parsial", () => {});
    assert.equal(
      (
        await api(
          "/api/penawaran/" + photoOffer.id,
          "PUT",
          { ...isian, versi: photoOffer.versi },
          sellerLain,
        )
      ).status,
      404,
    );
    assert.equal(
      (await api("/api/penawaran/" + photoOffer.id, "PUT", isian, seller))
        .status,
      400,
    );
    const retained = sukses(
      await api(
        "/api/penawaran/" + photoOffer.id,
        "PUT",
        {
          ...isian,
          versi: photoOffer.versi,
        },
        seller,
      ),
    );
    cek("edit tanpa foto baru mempertahankan foto yang sudah ada", () =>
      assert.equal(retained.fotoUrl, photoOffer.fotoUrl),
    );
    const edited = sukses(
      await api(
        "/api/penawaran/" + photoOffer.id,
        "PUT",
        {
          ...isian,
          versi: retained.versi,
          foto: null,
          nama: "Nama yang telah diubah",
        },
        seller,
      ),
    );
    cek(
      "edit hanya untuk pemilik dan foto dapat dikembalikan ke default",
      () => {
        assert.equal(edited.nama, "Nama yang telah diubah");
        assert.equal(edited.fotoUrl, null);
        assert.equal(edited.versi, "2");
      },
    );
    const raceEdit = await pesan(photoOffer.id, 1);
    assert.equal(
      (
        await api(
          "/api/penawaran/" + photoOffer.id,
          "PUT",
          { ...isian, versi: edited.versi },
          seller,
        )
      ).status,
      409,
    );
    const own = sukses(
      await api("/api/penawaran/milik-saya?limit=50", "GET", undefined, seller),
    );
    const actual = own.find((x) => x.id === photoOffer.id);
    sukses(
      await api(
        "/api/penawaran/" + photoOffer.id,
        "PUT",
        {
          ...isian,
          versi: actual.versi,
          nama: "Nama baru setelah reservasi",
          hargaPenawaran: 8000,
          stok: actual.stok,
        },
        seller,
      ),
    );
    const history = sukses(
      await api("/api/pesanan/" + raceEdit.id, "GET", undefined, buyer),
    );
    cek(
      "edit usang ditolak; riwayat nama, harga dan satuan tidak mengikuti edit baru",
      () => {
        assert.equal(history.items[0].nama, "Nama yang telah diubah");
        assert.equal(history.items[0].hargaSatuan, 7000);
        assert.equal(history.items[0].satuan, "paket");
        assert.equal(history.total, 7000);
      },
    );
    sukses(await aksi(raceEdit.id, "konfirmasi", seller));
    sukses(
      await aksi(raceEdit.id, "batal", seller, {
        alasan: "Usaha perlu menutup pesanan",
      }),
    );
    const s6 = await stok(photoOffer.id);
    cek(
      "penyedia boleh membatalkan setelah konfirmasi dan memulihkan stok",
      () => assert.equal(s6, 5),
    );
    const cancelReady = await pesan();
    sukses(await aksi(cancelReady.id, "konfirmasi", seller));
    sukses(await aksi(cancelReady.id, "siap", seller));
    const cancelledReady = sukses(
      await aksi(cancelReady.id, "batal", seller, {
        alasan: "Kondisi makanan berubah",
      }),
    );
    const stockReady = await stok(p.id);
    cek("penyedia membatalkan pesanan siap dan menutup pengambilan", () => {
      assert.equal(cancelledReady.pengambilan.status, "gagal");
      assert.equal(stockReady, 3);
    });
    const raceConfirm = await pesan();
    const decisions = await Promise.all([
      aksi(raceConfirm.id, "konfirmasi", seller),
      aksi(raceConfirm.id, "batal", buyer, {
        alasan: "Pembeli berubah rencana",
      }),
    ]);
    const afterDecision = sukses(
      await api("/api/pesanan/" + raceConfirm.id, "GET", undefined, seller),
    );
    const decisionStock = await stok(p.id);
    cek(
      "konfirmasi dan pembatalan bersamaan menghasilkan satu keputusan yang sah",
      () => {
        assert.deepEqual(decisions.map((r) => r.status).sort(), [200, 409]);
        assert.equal(
          decisionStock,
          afterDecision.status === "dibatalkan" ? 3 : 2,
        );
      },
    );
    if (afterDecision.status === "dikonfirmasi")
      sukses(
        await aksi(raceConfirm.id, "batal", seller, { alasan: "Cleanup race" }),
      );
    const expired = await buatOffer({ stok: 1 });
    const expiryOrder = await pesan(expired.id);
    await pool.query(
      `UPDATE penawaran SET dibuat_pada=clock_timestamp()-INTERVAL '1 day',
      berakhir_pada=clock_timestamp()-INTERVAL '1 second' WHERE id=$1`,
      [expired.id],
    );
    sukses(
      await aksi(expiryOrder.id, "batal", buyer, {
        alasan: "Penawaran sudah berakhir",
      }),
    );
    const expiredState = (
      await pool.query("SELECT stok,status FROM penawaran WHERE id=$1", [
        expired.id,
      ])
    ).rows[0];
    const expiredPublic = await api("/api/penawaran/" + expired.id);
    cek(
      "pemulihan stok kedaluwarsa tidak menampilkan makanan kembali ke katalog",
      () => {
        assert.equal(expiredState.stok, 1);
        assert.equal(expiredState.status, "kedaluwarsa");
        assert.equal(expiredPublic.status, 404);
      },
    );
    const last = await buatOffer({ stok: 1 });
    const pairs = await Promise.all([
      api(
        "/api/pesanan",
        "POST",
        { items: [{ penawaranId: last.id, kuantitas: 1 }] },
        buyer,
      ),
      api(
        "/api/pesanan",
        "POST",
        { items: [{ penawaranId: last.id, kuantitas: 1 }] },
        buyer,
      ),
    ]);
    const accepted = pairs.find((r) => r.status === 201).body.data;
    const s7 = await stok(last.id);
    cek(
      "dua permintaan untuk stok terakhir menghasilkan satu reservasi",
      () => {
        assert.deepEqual(pairs.map((r) => r.status).sort(), [201, 409]);
        assert.equal(s7, 0);
      },
    );
    const cancels = await Promise.all([
      aksi(accepted.id, "batal", buyer, { alasan: "Batal fixture" }),
      aksi(accepted.id, "batal", seller, { alasan: "Batal fixture" }),
    ]);
    const s8 = await stok(last.id);
    const revived = sukses(await api("/api/penawaran/" + last.id));
    cek(
      "dua pembatalan memulihkan stok sekali dan mengaktifkan stok habis",
      () => {
        assert.deepEqual(cancels.map((r) => r.status).sort(), [200, 409]);
        assert.equal(s8, 1);
        assert.equal(revived.status, "aktif");
      },
    );
    const beforeMany = sukses(
      await api("/api/dashboard", "GET", undefined, buyer),
    );
    for (let i = 0; i < 3; i++) await pesan(p.id);
    const halaman = await api("/api/pesanan?limit=2", "GET", undefined, buyer);
    const afterMany = sukses(
      await api("/api/dashboard", "GET", undefined, buyer),
    );
    cek(
      "dashboard mencakup semua halaman tanpa menghitung reservasi sebagai pendapatan",
      () => {
        assert.equal(halaman.body.data.length, 2);
        assert.equal(
          BigInt(afterMany.jumlahPesananTotal),
          BigInt(beforeMany.jumlahPesananTotal) + 3n,
        );
        assert.equal(afterMany.totalBelanja, "14000");
        assert.equal(afterMany.penghematanPembeli, "44000");
      },
    );
    return hasil;
  } finally {
    // Hapus hanya baris fixture dengan ID yang dibuat oleh eksekusi ini.
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query("DELETE FROM pesanan WHERE pembeli_id=ANY($1::bigint[])", [
        pengguna,
      ]);
      await c.query(
        "DELETE FROM penawaran WHERE penyedia_id=ANY($1::bigint[])",
        [penyedia],
      );
      await c.query("DELETE FROM penyedia WHERE id=ANY($1::bigint[])", [
        penyedia,
      ]);
      await c.query("DELETE FROM pengguna WHERE id=ANY($1::bigint[])", [
        pengguna,
      ]);
      await c.query("COMMIT");
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
}