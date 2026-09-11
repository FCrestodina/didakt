import Link from "next/link";
import { ArrowLeft, QrCode, GraduationCap, AlertCircle, CheckCircle2, BookOpen, Clock } from "lucide-react";

export default function AyudaPage() {
  return (
    <main className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <Link
        href="/billetera-virtual"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <h1 className="text-3xl font-black text-gray-900 mb-2">Ayuda para docentes</h1>
      <p className="text-gray-500 mb-8">Todo lo que necesitás para llevar la actividad en el aula.</p>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          Cómo crear un aula
        </h2>
        <ol className="space-y-3 text-gray-700">
          {[
            'Tocá "Soy docente" en la pantalla inicial.',
            "Ingresá el PIN docente (pedíselo al referente técnico de tu escuela).",
            "Escribí el nombre del aula: es libre, puede ser el grado y la sección (ej: 7° B) o algo de la actividad (Feria 2025, Ciudad Cashless).",
            "Definí el crédito inicial que recibirá cada estudiante. Recomendamos $10.000 para una actividad de 40 minutos.",
            'Tocá "Crear aula". El nombre que aparece, junto al QR, es lo que van a usar tus estudiantes para entrar.',
            "Proyectá el QR o dictá el nombre del aula. Los chicos lo ingresan en sus dispositivos.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <strong>¿Querés volver a un aula que creaste otro día?</strong> Entrá con el PIN: vas a ver la lista
          de aulas abiertas con el botón «Entrar». Cada aula sigue abierta hasta que la cerrás desde su panel.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          Cómo entran los estudiantes
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            "Cada estudiante entra con un nombre de usuario y una contraseña, además del nombre del aula.",
            "La contraseña debe tener entre 6 y 8 caracteres e incluir al menos una minúscula, una mayúscula y un número.",
            "La primera vez que entran se crea su perfil automáticamente con ese usuario y contraseña.",
            "Las veces siguientes entran con el mismo usuario y contraseña y recuperan su saldo e historial.",
            "El usuario es por aula: el mismo nombre de usuario en dos aulas distintas son perfiles distintos.",
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <QrCode className="w-6 h-6 text-green-600" />
          Cómo generar los QR
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          La forma más fácil es usar el <strong>generador integrado</strong>: completás los datos
          y descargás el QR listo para imprimir o proyectar.
        </p>
        <Link
          href="/billetera-virtual/generar"
          className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-white font-bold hover:bg-green-600 active:scale-95 transition-all mb-6"
        >
          <QrCode className="w-5 h-5" /> Abrir el generador de QR
        </Link>
        <Link
          href="/billetera-virtual/casos"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-500 px-5 py-3 text-green-700 font-bold hover:bg-green-50 active:scale-95 transition-all mb-6 ml-2"
        >
          <BookOpen className="w-5 h-5" /> QR listos para los Casos 1, 2 y 3
        </Link>
        <p className="text-sm text-gray-600 mb-4">
          También podés usar cualquier generador online de QR de texto plano. En todos los casos,
          el contenido del QR es texto plano con este formato:
        </p>

        <div className="bg-gray-900 rounded-2xl p-4 font-mono text-sm text-green-400 mb-4 overflow-x-auto">
          <pre>{`comercio=Kiosco Escolar
producto=Alfajor
precio=2500
promo=20
modo=porcentaje
tipo=descuento
tope=2`}</pre>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 rounded-tl-xl font-semibold text-gray-700">Campo</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Obligatorio</th>
                <th className="text-left px-3 py-2 rounded-tr-xl font-semibold text-gray-700">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["comercio", "No", "Nombre del comercio (texto libre)"],
                ["producto", "No", "Nombre del producto (texto libre)"],
                ["precio", "Sí", "Valor en pesos simulados (número entero), o libre para que el estudiante escriba el monto al pagar"],
                ["promo", "No", "Valor de la promoción (default: 0)"],
                ["modo", "No", "porcentaje | monto (default: porcentaje)"],
                ["tipo", "No", "descuento | reintegro | nxm (llevá N, pagá M) | segunda (% en la 2.ª unidad) | normal (default: normal)"],
                ["lleva / paga", "Con nxm", "Unidades que se llevan y que se pagan: 2 y 1 es un 2x1; 3 y 2, un 3x2"],
                ["tope", "No", "Máximo de usos por estudiante (opcional)"],
                ["tope_pesos", "No", "Máximo en pesos que devuelve o descuenta la promo a cada estudiante en el mes"],
                ["minimo", "No", "Compra mínima para que se aplique la promo"],
                ["dias", "No", "Días en que aplica, con letras L M X J V S D (ej: V = solo los viernes)"],
                ["acreditacion", "No", "pendiente: el reintegro lo acreditás vos desde el panel del aula"],
                ["plazo", "No", "Días hábiles que muestra la app para ese reintegro (ej: 3)"],
                ["promocion", "No", "Nombre de la promo; los QR con el mismo nombre comparten el tope en pesos"],
                ["modalidad / vigencia / condiciones", "No", "Datos que se muestran al pagar, sin controlarlos"],
              ].map(([campo, oblig, desc]) => (
                <tr key={campo} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-blue-600 font-medium">{campo}</td>
                  <td className="px-3 py-2">
                    {oblig === "Sí" ? (
                      <span className="text-red-600 font-semibold">Sí</span>
                    ) : (
                      <span className="text-gray-400">{oblig}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Ejemplos de QR por tipo de operación
        </h2>
        <div className="space-y-4">
          {[
            {
              titulo: "Pago simple",
              desc: "El estudiante paga $1.200 sin beneficio.",
              codigo: "comercio=Transporte\nproducto=Viaje\nprecio=1200",
            },
            {
              titulo: "Descuento porcentual (20%)",
              desc: "Precio $3.000 con 20% de descuento → paga $2.400.",
              codigo: "comercio=Librería\nproducto=Cartulina\nprecio=3000\npromo=20\nmodo=porcentaje\ntipo=descuento",
            },
            {
              titulo: "Descuento por monto fijo",
              desc: "Precio $5.000 con $1.000 de descuento → paga $4.000.",
              codigo: "comercio=Kiosco Escolar\nproducto=Combo merienda\nprecio=5000\npromo=1000\nmodo=monto\ntipo=descuento",
            },
            {
              titulo: "Reintegro porcentual (25%)",
              desc: "Paga $4.000 y recibe $1.000 de reintegro.",
              codigo: "comercio=Feria Escolar\nproducto=Merienda\nprecio=4000\npromo=25\nmodo=porcentaje\ntipo=reintegro",
            },
            {
              titulo: "Reintegro por monto fijo",
              desc: "Paga $8.000 y recibe $1.500 de reintegro.",
              codigo: "comercio=Evento Escolar\nproducto=Entrada\nprecio=8000\npromo=1500\nmodo=monto\ntipo=reintegro",
            },
            {
              titulo: "Con tope de uso (2 veces)",
              desc: "Promo usable solo 2 veces por estudiante.",
              codigo: "comercio=Kiosco Escolar\nproducto=Promo merienda\nprecio=3000\npromo=20\nmodo=porcentaje\ntipo=reintegro\ntope=2",
            },
            {
              titulo: "Monto libre con compra mínima",
              desc: "El estudiante escribe cuánto gasta; con $100.000 o más recibe 20% de reintegro.",
              codigo: "comercio=Supermercado Verde\nproducto=Compra\nprecio=libre\npromo=20\nmodo=porcentaje\ntipo=reintegro\nminimo=100000",
            },
            {
              titulo: "Llevá 2, pagá 1",
              desc: "Elige la cantidad al pagar: con 2 gaseosas de $3.000 paga $3.000.",
              codigo: "comercio=Almacén\nproducto=Gaseosa\nprecio=3000\ntipo=nxm\nlleva=2\npaga=1",
            },
            {
              titulo: "Reintegro que acreditás vos, con tope en pesos",
              desc: "Cada viaje devuelve el 100% hasta juntar $8.000 en el mes. Queda en «A acreditar» hasta que lo acredites.",
              codigo: "comercio=Colectivo\nproducto=Pasaje\nprecio=837\npromo=100\nmodo=porcentaje\ntipo=reintegro\nacreditacion=pendiente\nplazo=3\ntope_pesos=8000",
            },
          ].map((ej) => (
            <div key={ej.titulo} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="font-semibold text-gray-800">{ej.titulo}</p>
                <p className="text-xs text-gray-500">{ej.desc}</p>
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-gray-700 overflow-x-auto">{ej.codigo}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <Clock className="w-6 h-6 text-amber-500" />
          Reintegros que acreditás vos y mes nuevo
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            "Un QR de reintegro con acreditacion=pendiente no suma la plata en el momento: el estudiante la ve en la pestaña «A acreditar», con la fecha en que llegaría.",
            "Desde el panel del aula, en «Reintegros a acreditar», los acreditás cuando quieras (por ejemplo, en la clase siguiente): los de una sola promo, como la del transporte, o todos juntos.",
            "Cada estudiante ve el reintegro acreditado en su historial, y el saldo sube en ese momento.",
            "Los topes en pesos (tope_pesos) se cuentan por mes simulado. «Empezar mes nuevo», al final del panel, los vuelve a cero sin tocar saldos ni historial.",
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500" />
          Buenas prácticas para la actividad
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            "Imprimí o proyectá los QR con tamaño suficiente para que la cámara los lea bien (mínimo 5x5 cm).",
            "Prepará los QR con anticipación y verificá que sean legibles antes de la clase.",
            "Podés crear una «feria» en el aula con carteles que incluyan el QR de cada «comercio».",
            "Al finalizar, pediles a los estudiantes que revisen el historial y calculen cuánto gastaron en total.",
            "Promové la reflexión: ¿qué promo convino más? ¿Conviene siempre el descuento más alto?",
            "Si un estudiante se queda sin saldo, usalo como oportunidad de discusión grupal.",
          ].map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-400 text-center border-t pt-6">
        Billetera Virtual Educativa · Buenos Aires Aprende · Simulación educativa, no dinero real.
      </p>
    </main>
  );
}
