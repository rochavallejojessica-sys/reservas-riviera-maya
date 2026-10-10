let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";

// Elementos originales
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");

// Nuevos elementos para el Reto
const precioMaximo = document.querySelector("#precioMaximo");
const valorPrecioMax = document.querySelector("#valorPrecioMax");
const btnVaciar = document.querySelector("#btn-vaciar");
const totalPersonas = document.querySelector("#totalPersonas");
const mensajeAlerta = document.querySelector("#mensaje-alerta");

// Función para mostrar mensajes en pantalla (reemplaza a los alert)
function mostrarMensaje(texto) {
  mensajeAlerta.textContent = texto;
  mensajeAlerta.classList.replace("mensaje-oculto", "mensaje-visible");
  
  // Ocultar mensaje después de 3 segundos
  setTimeout(() => {
    mensajeAlerta.classList.replace("mensaje-visible", "mensaje-oculto");
  }, 3000);
}

// Cargar el JSON
async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}

// Filtros y ordenamiento (ahora incluye el precio máximo)
function obtenerResultados() {
  let resultados = [...experiencias];
  
  if (categoriaActual !== "todas") {
    resultados = resultados.filter(e => e.categoria === categoriaActual);
  }
  
  if (textoBusqueda !== "") {
    resultados = resultados.filter(e => e.nombre.toLowerCase().includes(textoBusqueda));
  }
  
  // Nuevo: Filtro de precio máximo
  const maxPrecio = Number(precioMaximo.value);
  resultados = resultados.filter(e => e.precio <= maxPrecio);

  if (ordenActual === "ascendente") resultados.sort((a, b) => a.precio - b.precio);
  if (ordenActual === "descendente") resultados.sort((a, b) => b.precio - a.precio);
  return resultados;
}

// Renderizar las tarjetas
function actualizarCatalogo() {
  const resultados = obtenerResultados();
  if (resultados.length === 0) {
    catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
    estado.textContent = "0 resultados";
    return;
  }
  
  catalogo.innerHTML = resultados.map(e => `
    <article class="tarjeta">
      <div class="imagen">${e.icono}</div>
      <div class="informacion">
        <span class="categoria">${e.categoria}</span>
        <h3>${e.nombre}</h3>
        <p>Cupo disponible: ${e.cupo}</p>
        <p class="precio">$${e.precio} MXN</p>
        <label>Personas:
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
        </label>
        <button class="btn-reservar" data-id="${e.id}">Agregar</button>
      </div>
    </article>
  `).join("");
  
  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(boton => {
    boton.addEventListener("click", () => agregarReserva(Number(boton.dataset.id)));
  });
}

// Lógica para agregar al carrito
function agregarReserva(id) {
  const experiencia = experiencias.find(e => e.id === id);
  const cantidad = Number(document.querySelector(`#cantidad-${id}`).value);
  
  if (cantidad < 1 || cantidad > experiencia.cupo) {
    mostrarMensaje("Cantidad inválida o superior al cupo.");
    return;
  }
  
  const existente = reservas.find(r => r.experienciaId === id);
  
  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      mostrarMensaje(`Solo quedan ${experiencia.cupo - existente.cantidad} lugares disponibles.`);
      return;
    }
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad,
      cupoMaximo: experiencia.cupo,
      subtotal: experiencia.precio * cantidad
    });
  }
  
  mostrarMensaje("¡Reserva agregada con éxito!");
  mostrarReservas();
}

// Renderizar el carrito (Ahora muestra botones +/- y total de personas)
function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    btnVaciar.style.display = "none";
    return;
  }
  
  btnVaciar.style.display = "block";
  
  listaReservas.innerHTML = reservas.map(r => `
    <article class="item-reserva">
      <div>
        <strong>${r.nombre}</strong>
        <p style="display: flex; align-items: center; gap: 8px;">
          <button class="btn-restar" data-id="${r.experienciaId}" style="padding: 2px 8px; border-radius: 4px; background: var(--secundario); color: var(--primario); border: 1px solid var(--primario);">-</button>
          ${r.cantidad} persona(s) x $${r.precio}
          <button class="btn-sumar" data-id="${r.experienciaId}" style="padding: 2px 8px; border-radius: 4px; background: var(--secundario); color: var(--primario); border: 1px solid var(--primario);">+</button>
        </p>
      </div>
      <div style="text-align: right;">
        <strong>$${r.subtotal} MXN</strong><br>
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div>
    </article>
  `).join("");
  
  // Calcular totales
  const totalSuma = reservas.reduce((suma, r) => suma + r.subtotal, 0);
  const totalPers = reservas.reduce((suma, r) => suma + r.cantidad, 0);
  
  total.textContent = `$${totalSuma} MXN`;
  totalPersonas.textContent = totalPers;
  
  agregarEventosCarrito();
}

function agregarEventosCarrito() {
  // Botones de Eliminar todo el ítem
  document.querySelectorAll(".btn-eliminar").forEach(boton => {
    boton.addEventListener("click", () => eliminarReserva(Number(boton.dataset.id)));
  });
  
  // Botones para aumentar cantidad (+)
  document.querySelectorAll(".btn-sumar").forEach(boton => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.id), 1));
  });
  
  // Botones para disminuir cantidad (-)
  document.querySelectorAll(".btn-restar").forEach(boton => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.id), -1));
  });
}

// Función para ajustar cantidades desde el carrito
function cambiarCantidad(id, cambio) {
  const reserva = reservas.find(r => r.experienciaId === id);
  if (reserva) {
    const nuevaCantidad = reserva.cantidad + cambio;
    if (nuevaCantidad > reserva.cupoMaximo) {
      mostrarMensaje("Has alcanzado el cupo máximo para esta experiencia.");
      return;
    }
    if (nuevaCantidad < 1) {
      eliminarReserva(id);
      return;
    }
    reserva.cantidad = nuevaCantidad;
    reserva.subtotal = nuevaCantidad * reserva.precio;
    mostrarReservas();
  }
}

function eliminarReserva(id) {
  reservas = reservas.filter(r => r.experienciaId !== id);
  mostrarReservas();
}

// Vaciar toda la reservación con confirmación
btnVaciar.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que deseas vaciar tu reservación?")) {
    reservas = [];
    mostrarReservas();
    mostrarMensaje("Reservación vaciada correctamente.");
  }
});

// Eventos de filtros
buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});

// Evento de barra deslizable de Precio Máximo
precioMaximo.addEventListener("input", () => {
  valorPrecioMax.textContent = precioMaximo.value;
  actualizarCatalogo();
});

// Arrancar la app
cargarExperiencias();