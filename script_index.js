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

function renderizarMenu(productos) {
    const grid = document.querySelector('.grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let botonHTML = '';
        if (producto.tipo === 'alimento') {
            botonHTML = `<button onclick="abrirModalGuisos('${producto.nombre}', ${producto.precio}, ${producto.id_producto})">Seleccionar guiso</button>`;
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
        const response = await fetch('api/carrito.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: userId,
                id_producto: producto.id_producto,
                cantidad: producto.cantidad,
                precio: producto.precio
            })
        });

        const data = await response.json();
        
        if (data.success) {
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
        const itemTotal = item.cantidad * item.precio;
        total += itemTotal;
        
        html += `
            <div class="item">
                <span>${item.nombre} x${item.cantidad}</span>
                <span>$${itemTotal}</span>
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

function abrirModalGuisos(nombre, precio, idProducto) {
    productoSeleccionado = nombre;
    precioSeleccionado = precio;
    productoSeleccionadoId = idProducto;
    
    // Resetear cantidades
    document.getElementById('cantidad-pastor').value = 0;
    document.getElementById('cantidad-asada').value = 0;
    document.getElementById('cantidad-surtida').value = 0;
    
    const modal = document.getElementById('modalGuisos');
    if (modal) {
        document.getElementById('tituloGuisos').textContent = `Seleccionar Guisos - ${nombre}`;
        modal.style.display = 'flex';
    }
}

function cerrarModalGuisos() {
    const modal = document.getElementById('modalGuisos');
    if (modal) {
        modal.style.display = 'none';
    }
}

function cambiarCantidad(tipo, cambio) {
    const input = document.getElementById(`cantidad-${tipo}`);
    if (input) {
        let valor = parseInt(input.value) + cambio;
        if (valor < 0) valor = 0;
        input.value = valor;
    }
}

function confirmarGuisos() {
    const pastor = parseInt(document.getElementById('cantidad-pastor').value) || 0;
    const asada = parseInt(document.getElementById('cantidad-asada').value) || 0;
    const surtida = parseInt(document.getElementById('cantidad-surtida').value) || 0;

    const totalGuisos = pastor + asada + surtida;

    if (totalGuisos === 0) {
        alert('Selecciona al menos un guiso para agregar al carrito.');
        return;
    }

    // Agregar cada guiso a la BD
    if (pastor > 0) {
        agregarAlCarritoBD({
            id_producto: productoSeleccionadoId,
            nombre: `${productoSeleccionado} (Pastor x${pastor})`,
            cantidad: pastor,
            precio: precioSeleccionado
        });
    }
    
    if (asada > 0) {
        agregarAlCarritoBD({
            id_producto: productoSeleccionadoId,
            nombre: `${productoSeleccionado} (Asada x${asada})`,
            cantidad: asada,
            precio: precioSeleccionado
        });
    }
    
    if (surtida > 0) {
        agregarAlCarritoBD({
            id_producto: productoSeleccionadoId,
            nombre: `${productoSeleccionado} (Surtida x${surtida})`,
            cantidad: surtida,
            precio: precioSeleccionado
        });
    }

    cerrarModalGuisos();
}

function seleccionarBebida(nombre, precio, idProducto) {
    abrirModalBebidas(nombre, precio, idProducto);
}

function abrirModalBebidas(nombre, precio, idProducto) {
    console.log("abrirModalBebidas called with:", nombre, precio, idProducto);
    productoSeleccionado = nombre;
    precioSeleccionado = precio;
    productoSeleccionadoId = idProducto;

    const opcionesContainer = document.getElementById('opciones-bebidas');
    opcionesContainer.innerHTML = ''; // Limpiar opciones anteriores

    let sabores = [];
    if (nombre.toLowerCase().includes('aguas')) {
        sabores = ['Horchata', 'Jamaica', 'Pozol'];
    } else if (nombre.toLowerCase().includes('refrescos')) {
        sabores = ['Coca-Cola', 'Fresca', 'Sangria', 'Fanta de naranja', 'Fanta de fresa'];
    }

    sabores.forEach(sabor => {
        const saborId = sabor.toLowerCase().replace(/\s/g, '-');
        opcionesContainer.innerHTML += `
            <div class="guiso-item">
                <span>${sabor}</span>
                <div class="cantidad-control">
                    <button onclick="cambiarCantidadBebida('${saborId}', -1)">-</button>
                    <input type="number" id="cantidad-${saborId}" value="0" min="0">
                    <button onclick="cambiarCantidadBebida('${saborId}', 1)">+</button>
                </div>
            </div>
        `;
    });

    const modal = document.getElementById('modalBebidas');
    if (modal) {
        document.getElementById('tituloBebidas').textContent = `Seleccionar - ${nombre}`;
        modal.style.display = 'flex';
    }
}

function cerrarModalBebidas() {
    const modal = document.getElementById('modalBebidas');
    if (modal) {
        modal.style.display = 'none';
    }
}

function cambiarCantidadBebida(sabor, cambio) {
    const input = document.getElementById(`cantidad-${sabor}`);
    if (input) {
        let valor = parseInt(input.value) + cambio;
        if (valor < 0) valor = 0;
        input.value = valor;
    }
}

function confirmarBebidas() {
    console.log("confirmarBebidas called");
    const opcionesContainer = document.getElementById('opciones-bebidas');
    const inputs = opcionesContainer.querySelectorAll('input[type="number"]');
    let totalBebidas = 0;

    inputs.forEach(input => {
        const cantidad = parseInt(input.value) || 0;
        if (cantidad > 0) {
            const saborId = input.id.replace('cantidad-', '');
            const saborNombre = saborId.charAt(0).toUpperCase() + saborId.slice(1).replace('-', ' ');
            agregarAlCarritoBD({
                id_producto: productoSeleccionadoId,
                nombre: `${productoSeleccionado} (${saborNombre})`,
                cantidad: cantidad,
                precio: precioSeleccionado
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

    // Carousel logic
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');

        // Establecer la primera diapositiva como actual
        slides[0].classList.add('current-slide');

        // Arrange the slides next to one another
        slides.forEach((slide, index) => {
            slide.style.left = `${index * 100}%`;
        });

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

        // Iniciar la rotación automática
        let autoRotateInterval = startAutoRotation();

        // Pausar la rotación automática cuando el mouse está sobre el carrusel
        track.parentElement.addEventListener('mouseenter', () => {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                autoRotateInterval = null;
            }
        });

        // Reanudar la rotación automática cuando el mouse sale del carrusel
        track.parentElement.addEventListener('mouseleave', () => {
            if (!autoRotateInterval) {
                autoRotateInterval = startAutoRotation();
            }
        });

        // Reiniciar el temporizador cuando se hace clic en los botones
        const resetTimer = () => {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                autoRotateInterval = startAutoRotation();
            }
        };

        // When I click left, move slides to the left
        prevButton.addEventListener('click', e => {
            const currentSlide = slides[currentIndex];
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            const prevSlide = slides[currentIndex];
            moveToSlide(track, currentSlide, prevSlide);
            resetTimer(); // Reiniciar el temporizador después de la navegación manual
        });

        // When I click right, move slides to the right
        nextButton.addEventListener('click', e => {
            const currentSlide = slides[currentIndex];
            currentIndex = (currentIndex + 1) % totalSlides;
            const nextSlide = slides[currentIndex];
            moveToSlide(track, currentSlide, nextSlide);
            resetTimer(); // Reiniciar el temporizador después de la navegación manual
        });
    }
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