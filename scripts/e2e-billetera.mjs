// Prueba de punta a punta contra un server LOCAL con una base Postgres de verdad.
//
// Existe porque los tests de rutas mockean drizzle y no ven errores de SQL: así
// se escapó BUG-010 (la lista de aulas contaba 0 estudiantes) hasta que esto lo cazó.
//
// Uso:
//   npm run dev              (en otra terminal, con .env.local apuntando a una base local)
//   npm run e2e:billetera
//
// Variables opcionales: BASE (default http://localhost:3000), PIN (default el
// TEACHER_PIN del entorno o "1234") y PREFIJO (ruta donde viven las páginas; ""
// acá, "/billetera-virtual" en Crestech Didáctico).
//
// Seguridad: SOLO corre contra localhost, sin excepciones, así nunca escribe en
// producción. No toca aulas ni estudiantes existentes: crea su propia aula
// ("ZZ E2E <hora>") con dos estudiantes y la cierra al terminar, aunque falle.

const B = process.env.BASE ?? "http://localhost:3000";
const PIN = process.env.PIN ?? process.env.TEACHER_PIN ?? "1234";
const PREFIJO = process.env.PREFIJO ?? "/billetera-virtual";

const LOCALES = ["localhost", "127.0.0.1", "[::1]", "::1"];
if (!LOCALES.includes(new URL(B).hostname)) {
  console.error(`Este script solo corre contra un server local. BASE=${B} no lo es: no se hizo ningún pedido.`);
  process.exit(2);
}

let fallas = 0;

function ok(cond, msg, extra) {
  console.log(`${cond ? "ok   " : "FALLA"} ${msg}${!cond && extra !== undefined ? " -> " + JSON.stringify(extra) : ""}`);
  if (!cond) fallas++;
}

async function api(method, path, body, headers = {}) {
  const r = await fetch(B + path, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  let d;
  try {
    d = JSON.parse(t);
  } catch {
    d = t;
  }
  return { s: r.status, d };
}

// Los mismos textos que arma src/lib/kit.ts para los Casos 1, 2 y 3.
const QR = {
  colectivo: [
    "comercio=Colectivo", "producto=Pasaje", "precio=837", "promo=100", "modo=porcentaje", "tipo=reintegro",
    "acreditacion=pendiente", "plazo=3", "promocion=Transporte con QR", "tope_pesos=8000",
  ].join("\n"),
  verde: [
    "comercio=Supermercado Verde", "producto=Compra", "precio=libre", "promo=20", "modo=porcentaje",
    "tipo=reintegro", "acreditacion=pendiente", "tope_pesos=25000", "minimo=100000",
  ].join("\n"),
  azul: [
    "comercio=Mercado Azul", "producto=Compra", "precio=libre", "promo=15", "modo=porcentaje",
    "tipo=reintegro", "acreditacion=pendiente", "minimo=30000", "dias=V",
  ].join("\n"),
  gaseosa2x1: "comercio=Almacén\nproducto=Gaseosa\nprecio=3000\ntipo=nxm\nlleva=2\npaga=1",
  papel70: "comercio=Almacén\nproducto=Papel higiénico\nprecio=4000\npromo=70\ntipo=segunda",
  viejo: "comercio=Kiosco\nproducto=Alfajor\nprecio=1000\npromo=10\nmodo=porcentaje\ntipo=descuento\ntope=1",
};

const pagar = (id, qrText, extra = {}) => api("POST", "/api/payments", { studentId: id, qrText, ...extra });
const saldo = async (id) => (await api("GET", `/api/students?id=${id}`)).d.balance;

try {
  await fetch(B);
} catch {
  console.error(`No hay server en ${B}. Levantalo con "npm run dev" y volvé a correr.`);
  process.exit(2);
}

const aula = `ZZ E2E ${Date.now()}`;
const enc = encodeURIComponent(aula);
let aulaCreada = false;

try {
  // Páginas
  for (const p of ["", "/docente", "/casos", "/generar", `/generar?qr=${encodeURIComponent(QR.colectivo)}`, "/ayuda", "/billetera", "/estudiante"]) {
    const r = await fetch(B + PREFIJO + p);
    ok(r.status === 200, `página ${(PREFIJO + p || "/").slice(0, 45)} -> 200`, r.status);
  }

  // 1. Acceso docente y lista de aulas
  ok((await api("GET", "/api/classrooms")).s === 401, "lista de aulas sin PIN -> 401");
  ok((await api("GET", "/api/classrooms", undefined, { "x-teacher-pin": PIN + "x" })).s === 401, "PIN incorrecto -> 401");
  const creada = await api("POST", "/api/classrooms", { pin: PIN, code: aula, initialBalance: 300000 });
  aulaCreada = creada.s === 201;
  ok(aulaCreada, "crear aula", creada);
  if (!aulaCreada) throw new Error("Sin aula no se puede seguir (¿el PIN coincide con TEACHER_PIN?).");
  let lista = await api("GET", "/api/classrooms", undefined, { "x-teacher-pin": PIN });
  ok(lista.s === 200 && lista.d.some((a) => a.code === aula && a.estudiantes === 0), "el aula aparece en la lista con 0 estudiantes", lista.d);

  // 2. Estudiantes
  const alta = async (u) =>
    (await api("POST", "/api/students", { classroomCode: aula, username: u, password: "Abc123", avatar: "astronauta" })).d;
  const juan = await alta("juan");
  const ana = await alta("ana");
  ok(juan.balance === 300000 && ana.balance === 300000, "alta de 2 estudiantes con $300.000");
  lista = await api("GET", "/api/classrooms", undefined, { "x-teacher-pin": PIN });
  ok(lista.d.find((a) => a.code === aula)?.estudiantes === 2, "la lista cuenta 2 estudiantes (BUG-010)");

  // 3. Caso 1: 12 viajes de Juan
  const reintegros = [];
  for (let i = 0; i < 12; i++) {
    const r = await pagar(juan.id, QR.colectivo);
    if (r.s !== 200) ok(false, `viaje ${i + 1}`, r);
    reintegros.push(r.d.reintegro);
  }
  ok(JSON.stringify(reintegros) === JSON.stringify([...Array(9).fill(837), 467, 0, 0]), "12 viajes: 9 x $837, $467, $0, $0", reintegros);
  ok((await saldo(juan.id)) === 300000 - 12 * 837, "el saldo no incluye los reintegros pendientes");
  const pv = await api("GET", `/api/payments?studentId=${juan.id}&qrText=${encodeURIComponent(QR.colectivo)}`);
  ok(pv.d.acumulado === 8000, "el preview trae el tope ya usado ($8.000)", pv.d);
  let movs = (await api("GET", `/api/movements/${juan.id}`)).d;
  const pend = movs.filter((m) => m.estadoReintegro === "pendiente");
  ok(
    pend.length === 10 && pend.every((m) => m.acreditaEl && m.promocion === "Transporte con QR" && m.periodo === 1),
    "10 movimientos pendientes con fecha, promo y mes 1",
    pend.slice(0, 1)
  );
  await pagar(ana.id, QR.colectivo);

  let panel = (await api("GET", `/api/classrooms/${enc}`)).d;
  ok(
    panel.pendientes.reduce((s, p) => s + p.total, 0) === 8837 && panel.classroom.periodo === 1,
    "el panel ve $8.837 pendientes y mes 1",
    panel.pendientes
  );

  // 4. Caso 2 (Ana, saldo 299.163)
  ok((await pagar(ana.id, QR.verde)).s === 400, "Verde sin monto -> 400");
  ok((await pagar(ana.id, QR.azul, { monto: 50000 })).s === 400, "Azul sin día -> 400");
  let r = await pagar(ana.id, QR.azul, { monto: 50000, dia: "M" });
  ok(r.s === 200 && r.d.reintegro === 0 && r.d.movement.diaCompra === "M", "Azul un martes -> $0", r.d);
  r = await pagar(ana.id, QR.azul, { monto: 50000, dia: "V" });
  ok(r.s === 200 && r.d.reintegro === 7500 && r.d.pendiente, "Azul un viernes $50.000 -> $7.500 pendiente", r.d);
  r = await pagar(ana.id, QR.verde, { monto: 50000 });
  ok(r.s === 200 && r.d.reintegro === 0, "Verde $50.000 -> $0 (no llega al mínimo)", r.d);
  r = await pagar(ana.id, QR.verde, { monto: 140000 });
  ok(r.s === 200 && r.d.reintegro === 25000, "Verde $140.000 -> $25.000 (el 20% serían $28.000, lo corta el tope)", r.d);
  r = await pagar(ana.id, QR.verde, { monto: 100000 });
  ok(r.s === 400 && /insuficiente/.test(r.d.error), "saldo insuficiente -> 400", r.d);

  // 5. Caso 3 (Juan)
  r = await pagar(juan.id, QR.gaseosa2x1, { cantidad: 2 });
  ok(r.d.movement?.total === 3000 && r.d.movement?.cantidad === 2, "2x1 con 2 gaseosas -> $3.000", r.d.movement);
  r = await pagar(juan.id, QR.papel70, { cantidad: 3 });
  ok(r.d.movement?.total === 9200, "70% en la 2.ª con 3 papeles -> $9.200", r.d.movement);
  ok((await pagar(juan.id, QR.gaseosa2x1, { cantidad: 0 })).s === 400, "cantidad 0 -> 400");
  const q1 = await pagar(juan.id, QR.viejo);
  const q2 = await pagar(juan.id, QR.viejo);
  ok(q1.s === 200 && q1.d.movement.descuento === 100 && q2.s === 409 && q2.d.limitReached, "QR viejo: descuento y tope de usos como antes", [q1.d, q2.d]);

  // 6. Acreditar solo el transporte
  ok((await api("POST", `/api/classrooms/${enc}/reintegros`, { pin: PIN + "x" })).s === 401, "acreditar con PIN incorrecto -> 401");
  const antes = await saldo(juan.id);
  let acr = await api("POST", `/api/classrooms/${enc}/reintegros`, { pin: PIN, promocion: "Transporte con QR" });
  ok(acr.s === 200 && acr.d.total === 8837 && acr.d.estudiantes === 2 && acr.d.compras === 11, "acredita solo Transporte: $8.837 a 2 estudiantes", acr.d);
  ok((await saldo(juan.id)) === antes + 8000, "a Juan le suben $8.000");
  movs = (await api("GET", `/api/movements/${juan.id}`)).d;
  const acreditacion = movs.find((m) => m.tipoMovimiento === "acreditacion");
  ok(
    acreditacion?.reintegro === 8000 && acreditacion?.producto === "Reintegro de 10 compras" && !movs.some((m) => m.estadoReintegro === "pendiente"),
    "Juan tiene un movimiento de acreditación y ya no le queda nada pendiente",
    acreditacion
  );
  acr = await api("POST", `/api/classrooms/${enc}/reintegros`, { pin: PIN, promocion: "Transporte con QR" });
  ok(acr.d.compras === 0 && (await saldo(juan.id)) === antes + 8000, "acreditar dos veces no paga doble", acr.d);
  panel = (await api("GET", `/api/classrooms/${enc}`)).d;
  ok(panel.pendientes.reduce((s, p) => s + p.total, 0) === 32500, "quedan los $32.500 del súper sin acreditar", panel.pendientes);

  // 7. Mes nuevo
  ok((await api("POST", `/api/classrooms/${enc}/mes`, { pin: PIN + "x" })).s === 401, "mes nuevo con PIN incorrecto -> 401");
  const mes = await api("POST", `/api/classrooms/${enc}/mes`, { pin: PIN });
  ok(mes.s === 200 && mes.d.periodo === 2, "mes nuevo -> periodo 2", mes.d);
  r = await pagar(juan.id, QR.colectivo);
  ok(r.d.reintegro === 837 && r.d.movement.periodo === 2, "en el mes nuevo el colectivo vuelve a devolver $837", r.d);

  // 8. Acreditar todo lo que queda
  acr = await api("POST", `/api/classrooms/${enc}/reintegros`, { pin: PIN });
  ok(acr.d.total === 32500 + 837 && acr.d.estudiantes === 2, "acreditar todos: súper + el viaje nuevo", acr.d);
} catch (e) {
  ok(false, `la prueba se cortó: ${e.message}`);
} finally {
  // Cerrar el aula de la prueba (baja lógica: no borra nada) aunque algo haya fallado.
  if (aulaCreada) {
    await api("DELETE", `/api/classrooms/${enc}`, { pin: PIN });
    const lista = await api("GET", "/api/classrooms", undefined, { "x-teacher-pin": PIN });
    ok(!lista.d.some((a) => a.code === aula), "el aula de la prueba quedó cerrada");
  }
}

console.log(fallas ? `\n${fallas} FALLAS` : "\nTODO OK");
process.exitCode = fallas ? 1 : 0;
