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
            <img src="${producto.imagen || 'img/placeholder.jpg'}" alt="${producto.nombre}" onerror="this.src='img/placeholder.jpg'">
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
    const emailInput = document.querySelector('#register input[type="email"]');
    const passwordInput = document.querySelector('#register input[type="password"]');
    
    if (!userInput || !emailInput || !passwordInput) {
        showToast('Error: Campos no encontrados');
        return;
    }

    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: userInput.value,
                contraseña: passwordInput.value,
                correo: emailInput.value
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
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: userId,
                id_item: item.id,
                tipo: item.tipo
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
    
    showToast('¡Pedido realizado con éxito!');
    // Aquí iría la lógica para crear el pedido en la BD
    carrito = [];
    renderCarrito();
    toggleCarrito();
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
    showToast(`Seleccionaste ${nombre} - Función en desarrollo`);
    // Aquí puedes implementar la lógica para bebidas similar a los guisos
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
});