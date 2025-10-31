let carritoVisible = false;
let carrito = [];
let isLoggedIn = false;
let username = '';

// Datos del menú
const menuItems = [
    { nombre: 'Tacos', precio: 25, tipo: 'guiso', imagen: '../img/tacos.jpg' },
    { nombre: 'Quesadillas', precio: 30, tipo: 'guiso', imagen: '../img/quesadillas.jpg' },
    { nombre: 'Gorditas', precio: 35, tipo: 'guiso', imagen: '../img/gorditas.jpg' },
    { nombre: 'Aguas Naturales', precio: 20, tipo: 'bebida', sabores: ['Jamaica', 'Horchata', 'Limón'], imagen: '../img/aguas.jpg' },
    { nombre: 'Refrescos', precio: 25, tipo: 'bebida', sabores: ['Coca-Cola', 'Sprite', 'Fanta'], imagen: '../img/refrescos.jpg' }
];

// Variables del carrusel
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const track = document.querySelector('.carousel-track');

// Configurar el carrusel al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    if (slides.length > 0) {
        // Configurar los botones del carrusel
        document.querySelector('.carousel-button.prev').addEventListener('click', () => moveSlide(-1));
        document.querySelector('.carousel-button.next').addEventListener('click', () => moveSlide(1));
        
        // Iniciar rotación automática
        setInterval(() => moveSlide(1), 5000);
    }
});

function moveSlide(direction) {
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function toggleCarrito() {
	const cart = document.getElementById('carrito');
	cart.style.display = carritoVisible ? 'none' : 'block';
	carritoVisible = !carritoVisible;
}

function agregarAlCarrito(nombre, precio) {
	carrito.push({ nombre, precio });
	renderCarrito();
}

function finalizarCompra() {
    if (!isLoggedIn) {
        abrirModal('login');
    } else {
        alert('¡Compra finalizada con éxito!');
        carrito = [];
        renderCarrito();
    }
}

function renderCarrito() {
	const itemsDiv = document.getElementById('items');
	const totalSpan = document.getElementById('total');
	itemsDiv.innerHTML = '';
	let total = 0;

	carrito.forEach((item, index) => {
		const div = document.createElement('div');
		div.textContent = `${item.nombre} - $${item.precio}`;
		const btn = document.createElement('button');
		btn.textContent = '❌';
		btn.onclick = () => eliminarItem(index);
		div.appendChild(btn);
		itemsDiv.appendChild(div);
		total += item.precio;
	});

	totalSpan.textContent = total;
}

function eliminarItem(index) {
	carrito.splice(index, 1);
	renderCarrito();
}

/* Modal funciones */
function abrirModal(tipo) {
    const modal = document.getElementById('modal');
    showTab(tipo);
    modal.style.display = 'flex';
}

function cerrarModal() {
	document.getElementById('modal').style.display = 'none';
}

function showTab(tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    const tabButton = document.querySelector(`.tab-link[onclick*="'${tabName}'"]`);
    if (tabButton) {
        tabButton.className += " active";
    }
}

function login() {
	const userInput = document.getElementById('user-input').value;
	if (userInput) {
		isLoggedIn = true;
		username = userInput;
		cerrarModal();
		actualizarHeader();
	}
}

function register() {
    const userInput = document.getElementById('register-user-input').value;
    if (userInput) {
        isLoggedIn = true;
        username = userInput;
        cerrarModal();
        actualizarHeader();
    }
}

function logout() {
	isLoggedIn = false;
	username = '';
	actualizarHeader();
}

function actualizarHeader() {
	const userActions = document.querySelector('.user-actions');
	if (isLoggedIn) {
		userActions.innerHTML = `
			<span class="welcome-user">Hola, ${username}</span>
			<button class="btn-logout" onclick="logout()">Cerrar sesión</button>
			<button class="btn-cart" onclick="toggleCarrito()">🛒 Carrito</button>
		`;
	} else {
		userActions.innerHTML = `
			<button class="btn-login" onclick="abrirModal('login')">Iniciar sesión</button>
			<button class="btn-register" onclick="abrirModal('register')">Registrarse</button>
			<button class="btn-cart" onclick="toggleCarrito()">🛒 Carrito</button>
		`;
	}
}

/* ==============================
   SECCIÓN DE GUISOS
================================= */

let productoSeleccionado = '';
let precioSeleccionado = 0;

function abrirModalGuisos(nombre, precio) {
    productoSeleccionado = nombre;
    precioSeleccionado = precio;

    // Reiniciar cantidades
    document.getElementById('cantidad-pastor').value = 0;
    document.getElementById('cantidad-asada').value = 0;
    document.getElementById('cantidad-surtida').value = 0;

    document.getElementById('tituloGuisos').textContent = `Seleccionar guisos - ${nombre}`;
    document.getElementById('modalGuisos').style.display = 'flex';
}

function cerrarModalGuisos() {
    document.getElementById('modalGuisos').style.display = 'none';
}

function cambiarCantidad(guiso, delta) {
    const input = document.getElementById(`cantidad-${guiso}`);
    let valor = parseInt(input.value) + delta;
    if (valor < 0) valor = 0;
    input.value = valor;
}

function confirmarGuisos() {
    const pastor = parseInt(document.getElementById('cantidad-pastor').value);
    const asada = parseInt(document.getElementById('cantidad-asada').value);
    const surtida = parseInt(document.getElementById('cantidad-surtida').value);

    const totalGuisos = pastor + asada + surtida;

    if (totalGuisos === 0) {
        alert('Selecciona al menos un guiso para agregar al carrito.');
        return;
    }

    // Agrega cada guiso como producto individual en el carrito
    if (pastor > 0) carrito.push({ nombre: `${productoSeleccionado} (Pastor x${pastor})`, precio: precioSeleccionado * pastor });
    if (asada > 0) carrito.push({ nombre: `${productoSeleccionado} (Asada x${asada})`, precio: precioSeleccionado * asada });
    if (surtida > 0) carrito.push({ nombre: `${productoSeleccionado} (Surtida x${surtida})`, precio: precioSeleccionado * surtida });

    renderCarrito();
    cerrarModalGuisos();
    alert('Productos agregados al carrito con éxito.');
}

/* ==============================
   SECCIÓN DE BEBIDAS
================================= */

function seleccionarBebida(tipo, precio) {
    productoSeleccionado = tipo;
    precioSeleccionado = precio;

    // Mostrar el panel correspondiente
    document.getElementById('opcionesAguas').style.display = tipo === 'Aguas' ? 'block' : 'none';
    document.getElementById('opcionesRefrescos').style.display = tipo === 'Refrescos' ? 'block' : 'none';

    // Reiniciar cantidades
    const inputs = document.querySelectorAll('#modalBebidas input[type="number"]');
    inputs.forEach(input => input.value = 0);

    document.getElementById('tituloBebidas').textContent = `Seleccionar ${tipo}`;
    document.getElementById('modalBebidas').style.display = 'flex';
}

function cerrarModalBebidas() {
    document.getElementById('modalBebidas').style.display = 'none';
}

function cambiarCantidadBebida(bebida, delta) {
    const input = document.getElementById(`cantidad-${bebida}`);
    let valor = parseInt(input.value) + delta;
    if (valor < 0) valor = 0;
    input.value = valor;
}

function confirmarBebidas() {
    let totalBebidas = 0;
    const bebidasSeleccionadas = productoSeleccionado === 'Aguas' ? 
        ['jamaica', 'horchata', 'limon'] : 
        ['coca', 'sprite', 'fanta'];
    
    bebidasSeleccionadas.forEach(bebida => {
        const cantidad = parseInt(document.getElementById(`cantidad-${bebida}`).value);
        if (cantidad > 0) {
            carrito.push({
                nombre: `${productoSeleccionado} (${bebida.charAt(0).toUpperCase() + bebida.slice(1)} x${cantidad})`,
                precio: precioSeleccionado * cantidad
            });
            totalBebidas += cantidad;
        }
    });

    if (totalBebidas === 0) {
        alert('Selecciona al menos una bebida para agregar al carrito.');
        return;
    }

    renderCarrito();
    cerrarModalBebidas();
    alert('Bebidas agregadas al carrito con éxito.');
}

// ===============================
// Validación mejorada de cantidad
// ===============================

// Función de búsqueda
function initSearchBar() {
    const searchInput = document.querySelector('.search input');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchInput.parentElement.appendChild(searchResults);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filteredItems = menuItems.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm)
        );

        if (filteredItems.length > 0) {
            searchResults.innerHTML = filteredItems.map(item => `
                <div class="search-item" onclick="handleSearchItemClick('${item.nombre}', ${item.precio}, '${item.tipo}')">
                    <img src="${item.imagen}" alt="${item.nombre}">
                    <div class="search-item-info">
                        <h4>${item.nombre}</h4>
                        <p>$${item.precio}</p>
                    </div>
                </div>
            `).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="no-results">No se encontraron productos</div>';
            searchResults.style.display = 'block';
        }
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function handleSearchItemClick(nombre, precio, tipo) {
    if (tipo === 'guiso') {
        abrirModalGuisos(nombre, precio);
    } else if (tipo === 'bebida') {
        seleccionarBebida(nombre, precio);
    }
    document.querySelector('.search-results').style.display = 'none';
    document.querySelector('.search input').value = '';
}

// Inicializar búsqueda cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    initSearchBar();
    if (slides.length > 0) {
        document.querySelector('.carousel-button.prev').addEventListener('click', () => moveSlide(-1));
        document.querySelector('.carousel-button.next').addEventListener('click', () => moveSlide(1));
        setInterval(() => moveSlide(1), 5000);
    }
});

document.querySelectorAll('.cantidad-control input').forEach(input => {
    input.addEventListener('input', (e) => {
        let valor = e.target.value;

		// Quita todo lo que no sea número
		valor = valor.replace(/\D/g, '');

		// Si se borra todo con backspace, muestra 0 temporalmente
		if (valor === '') {
			valor = '0';
		}

		// Evita valores negativos o muy grandes si quieres limitarlo (ej. 99)
		if (parseInt(valor) < 0) {
			valor = '0';
		}

		e.target.value = valor;
	});

	input.addEventListener('blur', (e) => {
		// Si al salir el valor es 0 o vacío, corrige a 1
		if (e.target.value === '' || parseInt(e.target.value) === 0) {
			e.target.value = 1;
		}
	});
});