// Variables globales actualizadas
let carritoVisible = false;
let carrito = [];
let isLoggedIn = false;
let username = '';
let userId = null;
let menuItems = [];
let productoSeleccionado = '';
let precioSeleccionado = 0;
let productoSeleccionadoId = 0;
let preciosConsome = {
    '1L': 0,
    '0.5L': 0,
    '0.25L': 0
};
// Agregar mapa temporal para recordar detalle (subproducto) de lo último agregado
let lastAddedDetails = [];

// Cargar menú desde la API al iniciar
async function cargarMenu() {
    try {
        const response = await fetch('api/menu.php');
        const data = await response.json();
        
        if (data.productos) {
            menuItems = data.productos;
            renderizarMenu(data.productos);
        }
    } catch (error) {
        console.error('Error cargando el menú:', error);
    }
}

// Cargar combos desde la API
async function cargarCombos() {
    try {
        const response = await fetch('api/combos.php');
        const data = await response.json();

        if (data.success && Array.isArray(data.combos)) {
            renderizarCombos(data.combos);
        } else {
            const grid = document.getElementById('combos-grid');
            if (grid) grid.innerHTML = '<p style="text-align:center;">No hay combos disponibles.</p>';
        }
    } catch (error) {
        console.error('Error cargando combos:', error);
        const grid = document.getElementById('combos-grid');
        if (grid) grid.innerHTML = '<p style="text-align:center;">Error cargando combos.</p>';
    }
}

// Renderizar combos en grid
function renderizarCombos(combos) {
    const grid = document.getElementById('combos-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!combos || combos.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay combos disponibles.</p>';
        return;
    }

    combos.forEach(combo => {
        const card = document.createElement('div');
        card.className = 'combo-card';

        const imagenSrc = combo.imagen || 'img/logo.png';

        card.innerHTML = `
            <div style="position:relative;">
                <div class="combo-badge">¡COMBO!</div>
                <img src="${imagenSrc}" alt="${combo.nombre}" class="combo-card-image" onerror="this.style.display='none'">
            </div>
            <div class="combo-card-content">
                <h4 class="combo-card-name">${combo.nombre}</h4>
                <p class="combo-card-description">${combo.descripcion || ''}</p>
                <div class="combo-card-price">$${(combo.precio_combo || 0).toFixed(2)}</div>
                <button class="combo-card-button" onclick="agregarComboAlCarrito(${combo.id_combo}, 1, ${combo.precio_combo || 0})">Agregar</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Cargar productos en oferta
// Reemplazo: cargarOfertasProductos ahora llama a api/ofertas.php y renderiza ofertas (productos + combos)
async function cargarOfertasProductos() {
    try {
        const response = await fetch('api/ofertas.php');
        const data = await response.json();

        if (data.success && Array.isArray(data.ofertas)) {
            renderizarCarruselOfertas(data.ofertas);
            renderizarOfertasProductos(data.ofertas);
        } else {
            // Si no hay ofertas, mostrar mensaje
            const grid = document.getElementById('ofertas-grid');
            if (grid) grid.innerHTML = '<p style="text-align:center;">No hay ofertas disponibles.</p>';
        }
    } catch (error) {
        console.error('Error cargando ofertas:', error);
        const grid = document.getElementById('ofertas-grid');
        if (grid) grid.innerHTML = '<p style="text-align:center;">Error cargando ofertas.</p>';
    }
}

// Renderizar el carrusel dinámicamente con las ofertas
function renderizarCarruselOfertas(ofertas) {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    
    track.innerHTML = '';
    
    if (!ofertas || ofertas.length === 0) {
        track.innerHTML = '<div style="text-align:center; padding:40px;">No hay ofertas disponibles.</div>';
        return;
    }

    ofertas.forEach((oferta, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        // Obtener imagen del primer producto de la oferta
        const imagenSrc = (oferta.productos && oferta.productos[0] && oferta.productos[0].imagen) 
            ? oferta.productos[0].imagen 
            : 'img/logo.png';
        
        slide.innerHTML = `
            <img src="${imagenSrc}" alt="${oferta.nombre}" onerror="this.style.display='none'">
            <div class="slide-content">
                <h3>${oferta.nombre}</h3>
                <p>${oferta.descripcion || ''}</p>
                <p style="font-size: 0.9rem; color: var(--muted);">Descuento: ${oferta.descuento_porcentaje}%</p>
            </div>
        `;
        
        // Establecer posición del slide
        slide.style.left = `${index * 100}%`;
        
        track.appendChild(slide);
    });
}

// Nueva renderización para la estructura devuelta por api/ofertas.php
// Ahora renderiza CADA PRODUCTO en su propio card (no agrupa por oferta)
function renderizarOfertasProductos(ofertas) {
    const grid = document.getElementById('ofertas-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Extraer todos los productos individuales de todas las ofertas
    let productosEnOferta = [];
    
    ofertas.forEach(oferta => {
        if (Array.isArray(oferta.productos) && oferta.productos.length) {
            oferta.productos.forEach(prod => {
                productosEnOferta.push({
                    ...prod,
                    oferta_nombre: oferta.nombre,
                    descuento: oferta.descuento_porcentaje
                });
            });
        }
    });

    // Si no hay productos, mostrar mensaje
    if (productosEnOferta.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay productos en oferta.</p>';
        return;
    }

    // Renderizar cada producto en su propio card
    productosEnOferta.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'oferta-card';

        const imagenSrc = prod.imagen || 'img/logo.png';

        card.innerHTML = `
            <div style="position:relative;">
                <div class="oferta-badge">¡${prod.descuento}% OFF!</div>
                <img src="${imagenSrc}" alt="${prod.nombre}" class="oferta-card-image" onerror="this.style.display='none'">
            </div>
            <div class="oferta-card-content">
                <h4 class="oferta-card-name">${prod.nombre}</h4>
                <p class="oferta-card-description">${prod.descripcion || ''}</p>
                <div style="margin-bottom:8px;">
                    <span style="font-size:0.85rem; color:var(--muted); text-decoration:line-through;">$${(prod.precio_original || 0).toFixed(2)}</span>
                    <div style="font-weight:700; color:var(--accent); font-size:1.2rem;">$${(prod.precio_oferta || 0).toFixed(2)}</div>
                </div>
                <button class="oferta-card-button" onclick="agregarOfertaProductoAlCarrito(${prod.id_producto}, ${prod.precio_oferta || prod.precio_original || 0}, 1)">Agregar</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Helper: agregar producto de oferta al carrito usando la API existente
async function agregarOfertaProductoAlCarrito(id_producto, precio, cantidad = 1) {
    if (!userId) {
        showToast('Por favor inicia sesión para agregar productos');
        abrirModal('login');
        return;
    }
    try {
        const response = await fetch('api/carrito.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: userId,
                id_producto: id_producto,
                cantidad: cantidad,
                precio: precio
            })
        });
        const data = await response.json();
        if (data.success) {
            await cargarCarritoUsuario();
            showToast('Producto de oferta agregado al carrito');
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (err) {
        console.error('Error al agregar producto de oferta:', err);
        showToast('Error de conexión');
    }
}

// Helper: agregar combo al carrito usando api/carrito_combo.php
async function agregarComboAlCarrito(id_combo, cantidad = 1, precio = 0) {
    if (!userId) {
        showToast('Por favor inicia sesión para agregar combos');
        abrirModal('login');
        return;
    }
    try {
        const response = await fetch('api/carrito_combo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: userId,
                id_combo: id_combo,
                cantidad: cantidad,
                precio: precio
            })
        });
        const data = await response.json();
        if (data.success) {
            await cargarCarritoUsuario();
            showToast('Combo agregado al carrito');
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (err) {
        console.error('Error al agregar combo:', err);
        showToast('Error de conexión');
    }
}

function renderizarMenu(productos) {
    const grid = document.querySelector('.grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let botonHTML = '';
        // DETECCIÓN DE CONSOMÉ primero (para que no entre en 'alimento' y muestre guisos)
        const nombreLower = (producto.nombre || '').toLowerCase();
        if (nombreLower.includes('consome') || nombreLower.includes('consomé') || nombreLower.includes('consom')) {
            botonHTML = `<button onclick="abrirModalConsome('${producto.nombre}', ${producto.precio}, ${producto.id_producto})">Seleccionar litros</button>`;
        } else if (producto.tipo === 'alimento') {
            botonHTML = `<button onclick="abrirModalGuisos('${producto.nombre}', ${producto.precio}, ${producto.id_producto})">Seleccionar guiso</button>`;
        } else if (nombreLower.includes('consome') || nombreLower.includes('consomé')) {
            botonHTML = `<button onclick="abrirModalConsome('${producto.nombre}', ${producto.precio}, ${producto.id_producto})">Seleccionar litros</button>`;
        } else {
            botonHTML = `<button onclick="seleccionarBebida('${producto.nombre}', ${producto.precio}, ${producto.id_producto})">Seleccionar sabor</button>`;
        }

        card.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.style.display='none'">
        <h3>${producto.nombre}</h3>
        <p class="description">${producto.descripcion || 'Delicioso producto'}</p>
        <p class="price">$${producto.precio}</p>
        ${botonHTML}
`;
        
        grid.appendChild(card);
    });
}

// Login actualizado para usar API
async function login() {
    const userInput = document.getElementById('user-input');
    const passwordInput = document.querySelector('#login input[type="password"]');
    
    if (!userInput || !passwordInput) {
        showToast('Error: Campos no encontrados');
        return;
    }

    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: userInput.value,
                contraseña: passwordInput.value
            })
        });

        const data = await response.json();

        if (data.success) {
            isLoggedIn = true;
            username = data.user.usuario;
            userId = data.user.id_usuario;
            // Guardar usuario en localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            cerrarModal();
            actualizarHeader();
            showToast('¡Bienvenido ' + username + '!');
            
            // Cargar carrito del usuario
            await cargarCarritoUsuario();
            
            // Renderizar el cuadro de reseña
            renderReviewBox();
            
            // Redirigir a dashboard si es admin
            if (data.user.rol === 'administrador') {
                setTimeout(() => {
                    window.location.href = 'dashboard_admin.html';
                }, 1000);
            }
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error de conexión');
    }
}


// Registro actualizado para usar API
async function register() {
    const userInput = document.getElementById('register-user-input');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm-password');
    
    if (!userInput || !emailInput || !passwordInput || !confirmInput) {
        showToast('Error: Campos no encontrados');
        return;
    }

    // Validaciones en cliente: contraseñas iguales y longitud mínima
    if (passwordInput.value !== confirmInput.value) {
        showToast('Las contraseñas no coinciden');
        return;
    }

    if (passwordInput.value.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: userInput.value.trim(),
                contraseña: passwordInput.value,
                correo: emailInput.value.trim()
            })
        });

        const data = await response.json();

        if (data.success) {
            isLoggedIn = true;
            username = data.user.usuario;
            userId = data.user.id_usuario;
            // Guardar usuario en localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            cerrarModal();
            actualizarHeader();
            showToast('¡Cuenta creada exitosamente!');
            
            // Renderizar el cuadro de reseña
            renderReviewBox();
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error en registro:', error);
        showToast('Error de conexión');
    }
}

// Cargar carrito desde la base de datos
async function cargarCarritoUsuario() {
    if (!userId) return;

    try {
        const response = await fetch(`api/carrito.php?id_usuario=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            carrito = data.items || [];

            // Asociar detalles (subproductos) guardados temporalmente a los items devueltos por la API
            if (lastAddedDetails.length > 0 && Array.isArray(carrito)) {
                carrito.forEach(item => {
                    if (item.detalle) return; // ya tiene detalle
                    const prodId = item.producto_id ?? item.productoId ?? item.id_producto ?? item.idProducto ?? null;
                    const precioItem = Number(item.precio ?? item.precio_unitario ?? 0);
                    const cantidadItem = Number(item.cantidad ?? 0);

                    const matchIndex = lastAddedDetails.findIndex(d =>
                        Number(d.id_producto) == Number(prodId) &&
                        Number(d.precio) == precioItem &&
                        Number(d.cantidad) == cantidadItem
                    );

                    if (matchIndex !== -1) {
                        item.detalle = lastAddedDetails[matchIndex].detalle;
                        // eliminar matched para no reasignarlo varias veces
                        lastAddedDetails.splice(matchIndex, 1);
                    }
                });
            }

            renderCarrito();
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
    }
}

// Agregar producto al carrito en la BD
async function agregarAlCarritoBD(producto) {
    if (!userId) {
        showToast('Por favor inicia sesión para agregar productos');
        abrirModal('login');
        return;
    }

    try {
        const payload = {
            id_usuario: userId,
            id_producto: producto.id_producto,
            cantidad: producto.cantidad,
            precio: producto.precio
        };
        // enviar id_subproducto si viene (para mantener sabor/medida)
        if (producto.id_subproducto) {
            payload.id_subproducto = producto.id_subproducto;
        }

        const response = await fetch('api/carrito.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.success) {
            // Guardar temporalmente el detalle para asociarlo cuando se reciba el carrito desde la API
            if (producto.detalle) {
                lastAddedDetails.push({
                    id_producto: producto.id_producto,
                    cantidad: producto.cantidad,
                    precio: Number(producto.precio),
                    detalle: producto.detalle,
                    id_subproducto: producto.id_subproducto ?? null
                });
            }

            await cargarCarritoUsuario();
            showToast('¡Producto agregado al carrito!');
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        showToast('Error de conexión');
    }
}

// Eliminar item del carrito
async function eliminarItemBD(index) {
    const item = carrito[index];
    if (!item) return;
    
    try {
        const response = await fetch('api/carrito.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: userId,
                id_item: item.id,
                tipo: item.tipo,
                _method: 'DELETE'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            await cargarCarritoUsuario();
            showToast('Producto eliminado del carrito');
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error eliminando item:', error);
        showToast('Error de conexión');
    }
}

// Funciones del carrito
function toggleCarrito() {
    const carrito = document.getElementById('carrito');
    if (carrito) {
        carritoVisible = !carritoVisible;
        carrito.style.display = carritoVisible ? 'block' : 'none';
    }
}

function renderCarrito() {
    const itemsContainer = document.getElementById('items');
    const totalElement = document.getElementById('total');
    
    if (!itemsContainer || !totalElement) return;
    
    if (carrito.length === 0) {
        itemsContainer.innerHTML = '<p>El carrito está vacío</p>';
        totalElement.textContent = '0';
        return;
    }
    
    let total = 0;
    let html = '';
    
    carrito.forEach((item, index) => {
        const itemTotal = Number(item.cantidad) * Number(item.precio);
        total += itemTotal;

        // Construir nombre con detalle (subproducto) si existe
        const detalle = item.detalle ? ` ${item.detalle}` : '';
        const displayName = `${item.nombre}${detalle}`;

        html += `
            <div class="item">
                <span>${item.cantidad} ${displayName}</span>
                <span>$${itemTotal.toFixed(2)}</span>
                <button onclick="eliminarItem(${index})">❌</button>
            </div>
        `;
    });
    
    itemsContainer.innerHTML = html;
    totalElement.textContent = total.toFixed(2);
}

function eliminarItem(index) {
    eliminarItemBD(index);
}

function finalizarCompra() {
    if (carrito.length === 0) {
        showToast('El carrito está vacío');
        return;
    }
    
    if (!isLoggedIn) {
        showToast('Por favor inicia sesión para finalizar la compra');
        abrirModal('login');
        return;
    }
    // Abrir modal de métodos de pago para seleccionar/confirmar
    abrirModalPago();
}

// ------------------ Métodos de pago ------------------
function abrirModalPago() {
    const modal = document.getElementById('modalPago');
    if (modal) {
        modal.style.display = 'flex';
        renderSavedMethods();
        actualizarCamposPago(); // Asegurarnos que los campos correctos estén visibles
    }
}

function cerrarModalPago() {
    const modal = document.getElementById('modalPago');
    if (modal) modal.style.display = 'none';
}

function getSavedPaymentMethods() {
    try {
        const raw = localStorage.getItem('paymentMethods');
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error parseando métodos de pago:', e);
        return [];
    }
}

function setSavedPaymentMethods(list) {
    localStorage.setItem('paymentMethods', JSON.stringify(list));
}

function renderSavedMethods() {
    const container = document.getElementById('savedMethods');
    if (!container) return;

    const methods = getSavedPaymentMethods();
    if (methods.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--muted);">No tienes métodos guardados.</p>';
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    methods.forEach((m, idx) => {
        const safeLabel = m.label || m.type;
        const masked = m.number ? (' ****' + m.number.slice(-4)) : '';
        html += `\n            <label style="display:flex; align-items:center; gap:8px; background:#fafafa; padding:8px; border-radius:8px; border:1px solid #eee;">\n                <input type=\"radio\" name=\"selectedPayment\" value=\"${idx}\">\n                <div style=\"flex:1\">\n                    <div style=\"font-weight:700\">${safeLabel}</div>\n                    <div style=\"font-size:0.9rem; color:var(--muted)\">${m.type}${masked}</div>\n                </div>\n                <button onclick=\"eliminarMetodoPago(${idx})\" style=\"background:#ffecec; border:none; padding:6px 8px; border-radius:8px; cursor:pointer;\">Eliminar</button>\n            </label>`;
    });
    html += '\n</div>';
    container.innerHTML = html;
}

function actualizarCamposPago() {
    const tipo = document.getElementById('payment-type').value;
    const camposTarjeta = document.getElementById('campos-tarjeta');
    
    // Ocultar todos primero
    camposTarjeta.style.display = 'none';
    
    // Mostrar según selección
    if (tipo === 'tarjeta_credito' || tipo === 'tarjeta_debito') {
        camposTarjeta.style.display = 'block';
    }
}

function guardarMetodoPago() {
    const type = document.getElementById('payment-type').value;
    const label = document.getElementById('payment-label').value.trim();
    const number = document.getElementById('payment-number').value.trim();

    if (!type) {
        showToast('Selecciona un tipo de pago');
        return;
    }
    
    if (type === 'efectivo') {
        const methods = getSavedPaymentMethods();
        methods.push({ type, label: 'Efectivo' });
        setSavedPaymentMethods(methods);
        renderSavedMethods();
        showToast('Método guardado');
        return;
    }

    const methods = getSavedPaymentMethods();
    methods.push({ type, label: label || type, number });
    setSavedPaymentMethods(methods);
    renderSavedMethods();
    document.getElementById('payment-label').value = '';
    document.getElementById('payment-number').value = '';
    showToast('Método guardado');
}

function eliminarMetodoPago(index) {
    const methods = getSavedPaymentMethods();
    if (index < 0 || index >= methods.length) return;
    methods.splice(index, 1);
    setSavedPaymentMethods(methods);
    renderSavedMethods();
    showToast('Método eliminado');
}

async function confirmarPago() {
    const radios = document.getElementsByName('selectedPayment');
    let selectedIndex = -1;
    for (let r of radios) {
        if (r.checked) {
            selectedIndex = parseInt(r.value);
            break;
        }
    }

    let metodo_pago = document.getElementById('payment-type').value;
    let nombre_banco = null;

    if (selectedIndex !== -1) {
        const methods = getSavedPaymentMethods();
        const selectedMethod = methods[selectedIndex];
        metodo_pago = selectedMethod.type;
        if (selectedMethod.type === 'Tarjeta') {
            nombre_banco = selectedMethod.label;
        }
    }

    if (!metodo_pago) {
        showToast('Selecciona un método de pago');
        return;
    }

    const tipoPedidoInput = document.querySelector('input[name="tipo_pedido_pago"]:checked');
    const tipo_pedido = tipoPedidoInput ? tipoPedidoInput.value : 'local';

    const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

    try {
        const response = await fetch('api/checkout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: userId,
                tipo_pedido: tipo_pedido,
                tipo_venta: 'normal',
                total_pedido: total,
                metodo_pago: metodo_pago,
                nombre_banco: nombre_banco
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('¡Pedido realizado con éxito!');
            carrito = [];
            renderCarrito();
            toggleCarrito();
            cerrarModalPago();
        } else {
            showToast('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error en el checkout:', error);
        showToast('Error de conexión al procesar el pedido.');
    }
}

// Funciones de modales
function abrirModal(tipo) {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'flex';
        showTab(tipo);
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
}

// --- Añadidos: wrapper y cierres de modales ---
function seleccionarBebida(nombre, precio, idProducto) {
    // wrapper para mantener compatibilidad con el HTML generado
    abrirModalBebidas(nombre, precio, idProducto);
}

function cerrarModalGuisos() {
    const modal = document.getElementById('modalGuisos');
    if (modal) modal.style.display = 'none';
    // limpiar estado si hace falta
    currentSubproductos = [];
}

function cerrarModalBebidas() {
    const modal = document.getElementById('modalBebidas');
    if (modal) modal.style.display = 'none';
    currentSubproductos = [];
}

function cerrarModalConsome() {
    const modal = document.getElementById('modalConsome');
    if (modal) modal.style.display = 'none';
    currentSubproductos = [];
}

// Variable para mantener los subproductos cargados en el modal actual
let currentSubproductos = [];

/**
 * Fetch de sub_productos por id_producto
 * Espera respuesta JSON: { success: true, subproductos: [...] } o un array directo.
 */
async function fetchSubproductos(id_producto) {
    try {
        const res = await fetch(`api/get_sub_productos.php?id_producto=${encodeURIComponent(id_producto)}`);
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.subproductos)) return data.subproductos;
        return [];
    } catch (err) {
        console.error('Error cargando sub_productos:', err);
        return [];
    }
}

/* ---------- GUISES (antes estático) ---------- */
async function abrirModalGuisos(nombre, precio, idProducto) {
    productoSeleccionado = nombre;
    precioSeleccionado = precio;
    productoSeleccionadoId = idProducto;

    const container = document.getElementById('guisos-list');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--muted);">Cargando opciones...</p>';

    currentSubproductos = await fetchSubproductos(idProducto);

    if (!currentSubproductos.length) {
        container.innerHTML = '<p style="text-align:center; color:var(--muted);">No hay guisos disponibles.</p>';
        return;
    }

    container.innerHTML = '';
    currentSubproductos.forEach(sub => {
        const id = sub.id_subproducto;
        const nombreSub = sub.nombre;
        const precioSub = (sub.precio !== null && sub.precio !== undefined) ? parseFloat(sub.precio) : null;

        const div = document.createElement('div');
        div.className = 'guiso-item';
        div.innerHTML = `
            <span>${nombreSub}</span>
            <div class="cantidad-control">
                <button onclick="cambiarCantidadSub(${id}, -1)">-</button>
                <input type="number" id="cantidad-sub-${id}" value="0" min="0">
                <button onclick="cambiarCantidadSub(${id}, 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('tituloGuisos').textContent = `Seleccionar Guisos - ${nombre}`;
    const modal = document.getElementById('modalGuisos');
    if (modal) modal.style.display = 'flex';
}

function cambiarCantidadSub(idSub, cambio) {
    const input = document.getElementById(`cantidad-sub-${idSub}`);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += cambio;
    if (val < 0) val = 0;
    input.value = val;
}

async function confirmarGuisos() {
    if (!currentSubproductos.length) {
        alert('No hay opciones para agregar.');
        return;
    }

    let totalSeleccionados = 0;

    for (const sub of currentSubproductos) {
        const id = sub.id_subproducto;
        const cantidad = parseInt(document.getElementById(`cantidad-sub-${id}`).value) || 0;
        if (cantidad > 0) {
            totalSeleccionados += cantidad;
            const precioUsar = (sub.precio !== null && sub.precio !== undefined) ? parseFloat(sub.precio) : precioSeleccionado;
            agregarAlCarritoBD({
                id_producto: productoSeleccionadoId,
                id_subproducto: id,
                nombre: `${productoSeleccionado} (${sub.nombre})`,
                cantidad: cantidad,
                precio: precioUsar,
                detalle: sub.nombre // <-- agregar detalle
            });
        }
    }

    if (totalSeleccionados === 0) {
        alert('Selecciona al menos un guiso para agregar al carrito.');
        return;
    }

    cerrarModalGuisos();
}

/* ---------- BEBIDAS (usar sub_productos) ---------- */
async function abrirModalBebidas(nombre, precio, idProducto) {
    console.log("abrirModalBebidas called with:", nombre, precio, idProducto);
    productoSeleccionado = nombre;
    precioSeleccionado = precio;
    productoSeleccionadoId = idProducto;

    const opcionesContainer = document.getElementById('opciones-bebidas');
    opcionesContainer.innerHTML = '<p style="color:var(--muted);">Cargando opciones...</p>';

    currentSubproductos = await fetchSubproductos(idProducto);

    if (!currentSubproductos.length) {
        opcionesContainer.innerHTML = '<p style="text-align:center; color:var(--muted);">No hay bebidas disponibles.</p>';
    } else {
        opcionesContainer.innerHTML = '';
        currentSubproductos.forEach(sub => {
            const id = sub.id_subproducto;
            const nombreSub = sub.nombre;
            const div = document.createElement('div');
            div.className = 'guiso-item';
            div.innerHTML = `
                <span>${nombreSub}</span>
                <div class="cantidad-control">
                    <button onclick="cambiarCantidadBebida('sub-${id}', -1)">-</button>
                    <input type="number" id="cantidad-sub-${id}" value="0" min="0">
                    <button onclick="cambiarCantidadBebida('sub-${id}', 1)">+</button>
                </div>
            `;
            opcionesContainer.appendChild(div);
        });
    }

    const modal = document.getElementById('modalBebidas');
    if (modal) {
        document.getElementById('tituloBebidas').textContent = `Seleccionar - ${nombre}`;
        modal.style.display = 'flex';
    }
}

function cambiarCantidadBebida(sabor, cambio) {
    // sabor viene como 'sub-<id>' en los botones; input id será 'cantidad-sub-<id>'
    const id = sabor.startsWith('sub-') ? sabor.replace('sub-', '') : sabor;
    const input = document.getElementById(`cantidad-sub-${id}`);
    if (!input) return;
    let valor = parseInt(input.value) || 0;
    valor += cambio;
    if (valor < 0) valor = 0;
    input.value = valor;
}

function confirmarBebidas() {
    console.log("confirmarBebidas called");
    if (!currentSubproductos.length) {
        alert('No hay opciones seleccionadas.');
        return;
    }

    let totalBebidas = 0;

    currentSubproductos.forEach(sub => {
        const id = sub.id_subproducto;
        const cantidad = parseInt(document.getElementById(`cantidad-sub-${id}`).value) || 0;
        if (cantidad > 0) {
            const precioUsar = (sub.precio !== null && sub.precio !== undefined) ? parseFloat(sub.precio) : precioSeleccionado;
            agregarAlCarritoBD({
                id_producto: productoSeleccionadoId,
                id_subproducto: id,
                nombre: `${productoSeleccionado} (${sub.nombre})`,
                cantidad: cantidad,
                precio: precioUsar,
                detalle: sub.nombre // <-- agregar detalle
            });
            totalBebidas += cantidad;
        }
    });

    if (totalBebidas === 0) {
        alert('Selecciona al menos una bebida para agregar al carrito.');
        return;
    }

    cerrarModalBebidas();
}

/* ---------- CONSOMÉ (radios dinámicos) ---------- */
async function abrirModalConsome(nombre, precio, idProducto) {
    productoSeleccionado = nombre;
    precioSeleccionado = precio;
    productoSeleccionadoId = idProducto;

    const container = document.getElementById('consome-options');
    container.innerHTML = '<p style="color:var(--muted);">Cargando opciones...</p>';

    currentSubproductos = await fetchSubproductos(idProducto);

    if (!currentSubproductos.length) {
        container.innerHTML = '<p style="text-align:center; color:var(--muted);">No hay presentaciones disponibles.</p>';
    } else {
        container.innerHTML = '';
        currentSubproductos.forEach((sub, idx) => {
            const id = sub.id_subproducto;
            const nombreSub = sub.nombre;
            // calcular precio: si sub.precio existe usarlo, si no intentar deducir por nombre (1/2, 1/4) respecto a precioSeleccionado
            let precioSub = null;
            if (sub.precio !== null && sub.precio !== undefined) {
                precioSub = parseFloat(sub.precio);
            } else {
                const lname = nombreSub.toLowerCase();
                if (lname.includes('1/2') || lname.includes('1/2 litro') || lname.includes('1/2 lit')) precioSub = Math.round(precioSeleccionado * 0.5 * 100) / 100;
                else if (lname.includes('1/4') || lname.includes('1/4 litro')) precioSub = Math.round(precioSeleccionado * 0.25 * 100) / 100;
                else precioSub = precioSeleccionado; // por defecto 1L
            }

            const label = document.createElement('div');
            label.className = 'consome-item';
            label.innerHTML = `
                <label>
                    <input type="radio" name="consome-size" value="${id}" ${idx === 0 ? 'checked' : ''}>
                    <span class="size-label">${nombreSub}</span>
                    <span class="size-price" id="precio-sub-${id}">$${precioSub.toFixed(2)}</span>
                </label>
            `;
            container.appendChild(label);
        });
    }

    // Reset cantidad
    document.getElementById('cantidad-consome').value = 1;

    const modal = document.getElementById('modalConsome');
    if (modal) modal.style.display = 'flex';
}

function confirmarConsome() {
    if (!currentSubproductos.length) {
        showToast('No hay opciones disponibles.');
        return;
    }

    const selectedRadio = document.querySelector('input[name="consome-size"]:checked');
    if (!selectedRadio) {
        showToast('Selecciona una presentación');
        return;
    }

    const idSub = parseInt(selectedRadio.value);
    const sub = currentSubproductos.find(s => s.id_subproducto == idSub);
    if (!sub) {
        showToast('Opción no encontrada');
        return;
    }

    const cantidad = parseInt(document.getElementById('cantidad-consome').value) || 1;
    if (cantidad <= 0) {
        showToast('Selecciona una cantidad');
        return;
    }

    const precioFinal = (sub.precio !== null && sub.precio !== undefined) ? parseFloat(sub.precio) : (() => {
        const lname = sub.nombre.toLowerCase();
        if (lname.includes('1/2') || lname.includes('1/2 litro')) return Math.round(precioSeleccionado * 0.5 * 100) / 100;
        if (lname.includes('1/4') || lname.includes('1/4 litro')) return Math.round(precioSeleccionado * 0.25 * 100) / 100;
        return precioSeleccionado;
    })();

    agregarAlCarritoBD({
        id_producto: productoSeleccionadoId,
        id_subproducto: idSub,
        nombre: `${productoSeleccionado} (${sub.nombre})`,
        cantidad: cantidad,
        precio: precioFinal,
        detalle: sub.nombre // <-- agregar detalle
    });

    cerrarModalConsome();
}

function actualizarHeader() {
    const userActions = document.querySelector('.user-actions');
    if (userActions && isLoggedIn) {
        userActions.innerHTML = `
            <span>Hola, ${username}</span>
            ${username === 'nelson' || username === 'admin2' ? 
                `<button class="btn-dashboard" onclick="window.location.href='dashboard_admin.html'">Dashboard</button>` : ''}
            <button class="btn-logout" onclick="logout()">Cerrar sesión</button>
            <button class="btn-cart" onclick="toggleCarrito()">🛒 Carrito</button>
        `;
    }
}

function logout() {
    isLoggedIn = false;
    username = '';
    userId = null;
    carrito = [];
    localStorage.removeItem('user');
    actualizarHeader();
    renderCarrito();
    showToast('Sesión cerrada');
    
    // Restaurar botones de login/register
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
        userActions.innerHTML = `
            <button class="btn-login" onclick="abrirModal('login')">Iniciar sesión</button>
            <button class="btn-register" onclick="abrirModal('register')">Registrarse</button>
            <button class="btn-cart" onclick="toggleCarrito()">🛒 Carrito</button>
        `;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        const messageElement = toast.querySelector('.message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Verificar si hay usuario logueado al cargar la página
function checkLoggedIn() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        isLoggedIn = true;
        username = user.usuario;
        userId = user.id_usuario;
        actualizarHeader();
        cargarCarritoUsuario();
    }
    // renderizar cuadro de reseña (si corresponde)
    renderReviewBox();
}

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
    cargarOfertasProductos();
    cargarCombos();
    checkLoggedIn();
    
    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModal();
            }
        });
    }
    
    const modalGuisos = document.getElementById('modalGuisos');
    if (modalGuisos) {
        modalGuisos.addEventListener('click', (e) => {
            if (e.target === modalGuisos) {
                cerrarModalGuisos();
            }
        });
    }

    const modalConsome = document.getElementById('modalConsome');
    if (modalConsome) {
        modalConsome.addEventListener('click', (e) => {
            if (e.target === modalConsome) {
                cerrarModalConsome();
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredMenu = menuItems.filter(item => 
                item.nombre.toLowerCase().includes(searchTerm) || 
                (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm))
            );
            renderizarMenu(filteredMenu);
        });
    }

    // Carousel logic - Inicializar después de cargar las ofertas
    const initCarousel = () => {
        const track = document.querySelector('.carousel-track');
        if (!track) return;
        
        const slides = Array.from(track.children);
        if (slides.length === 0) return;
        
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');

        // Establecer la primera diapositiva como actual
        slides[0].classList.add('current-slide');

        const moveToSlide = (track, currentSlide, targetSlide) => {
            const targetLeft = targetSlide.style.left;
            track.style.transform = `translateX(-${targetLeft})`;
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        }

        let currentIndex = 0;
        const totalSlides = slides.length;

        const startAutoRotation = () => {
            return setInterval(() => {
                const currentSlide = slides[currentIndex];
                currentIndex = (currentIndex + 1) % totalSlides;
                const nextSlide = slides[currentIndex];
                moveToSlide(track, currentSlide, nextSlide);
            }, 3000);
        };

        // Iniciar la rotación automática solo si hay más de una diapositiva
        let autoRotateInterval = totalSlides > 1 ? startAutoRotation() : null;

        // Pausar la rotación automática cuando el mouse está sobre el carrusel
        track.parentElement.addEventListener('mouseenter', () => {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                autoRotateInterval = null;
            }
        });

        // Reanudar la rotación automática cuando el mouse sale del carrusel
        track.parentElement.addEventListener('mouseleave', () => {
            if (!autoRotateInterval && totalSlides > 1) {
                autoRotateInterval = startAutoRotation();
            }
        });

        // Reiniciar el temporizador cuando se hace clic en los botones
        const resetTimer = () => {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                if (totalSlides > 1) {
                    autoRotateInterval = startAutoRotation();
                }
            }
        };

        // When I click left, move slides to the left
        if (prevButton) {
            prevButton.addEventListener('click', e => {
                const currentSlide = slides[currentIndex];
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                const prevSlide = slides[currentIndex];
                moveToSlide(track, currentSlide, prevSlide);
                resetTimer();
            });
        }

        // When I click right, move slides to the right
        if (nextButton) {
            nextButton.addEventListener('click', e => {
                const currentSlide = slides[currentIndex];
                currentIndex = (currentIndex + 1) % totalSlides;
                const nextSlide = slides[currentIndex];
                moveToSlide(track, currentSlide, nextSlide);
                resetTimer();
            });
        }
    };

    // Inicializar carrusel después de un pequeño delay para asegurar que se hayan renderizado las ofertas
    setTimeout(initCarousel, 100);
});

// Renderizar el cuadro de reseña (se muestra solo si hay sesión)
function renderReviewBox() {
    const container = document.getElementById('review-box-container');
    if (!container) return;

    if (!isLoggedIn || !userId) {
        container.innerHTML = '<p style="text-align:center; color:var(--muted);">Inicia sesión para dejar una reseña.</p>';
        return;
    }

    container.innerHTML = `
        <div class="review-box">
            <h3 class="review-title">Tu opinión nos importa</h3>
            <div class="form-group">
                <label for="review-rating" class="form-label">Calificación:</label>
                <select id="review-rating" class="form-select">
                    <option value="5">5 - Excelente</option>
                    <option value="4">4 - Muy bueno</option>
                    <option value="3">3 - Bueno</option>
                    <option value="2">2 - Regular</option>
                    <option value="1">1 - Malo</option>
                </select>
            </div>
            <div class="form-group">
                <label for="review-comment" class="form-label">Comentario:</label>
                <textarea id="review-comment" placeholder="Escribe tu opinión..." rows="4" class="form-textarea"></textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="submitReview()">Enviar reseña</button>
            </div>
        </div>
    `;
}

// Enviar reseña a la API
async function submitReview() {
    if (!isLoggedIn || !userId) {
        showToast('Inicia sesión para enviar una reseña');
        abrirModal('login');
        return;
    }

    const ratingEl = document.getElementById('review-rating');
    const commentEl = document.getElementById('review-comment');

    if (!ratingEl || !commentEl) return;

    const calificacion = parseInt(ratingEl.value) || 5;
    const comentario = commentEl.value.trim();

    if (comentario.length === 0) {
        showToast('Escribe una opinión antes de enviar');
        return;
    }

    try {
        const response = await fetch('api/resenas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: userId,
                calificacion: calificacion,
                comentario: comentario
            })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Reseña enviada. Gracias por tu opinión.');
            // limpiar campos
            commentEl.value = '';
            // opcional: refrescar otras vistas si es necesario
        } else {
            showToast('Error: ' + (data.message || 'No se pudo enviar la reseña'));
        }
    } catch (error) {
        console.error('Error enviando reseña:', error);
        showToast('Error de conexión al enviar la reseña');
    }
}