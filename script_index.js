let carritoVisible = false;
let carrito = [];
let isLoggedIn = false;
let username = '';

function toggleCarrito() {
	const cart = document.getElementById('carrito');
	cart.style.display = carritoVisible ? 'none' : 'block';
	carritoVisible = !carritoVisible;
}

function agregarAlCarrito(nombre, precio) {
	if (!isLoggedIn) {
		abrirModal('login');
		return;
	}
	carrito.push({ nombre, precio });
	renderCarrito();
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
    modal.style.display = 'flex';
    switchTab(null, tipo);
}

function cerrarModal() {
	document.getElementById('modal').style.display = 'none';
}

function switchTab(evt, tabName) {
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
    if (evt) {
        evt.currentTarget.className += " active";
    } else {
        // Find the button that corresponds to tabName and add active class
        const tabButton = document.querySelector(`.tab-link[onclick*="'${tabName}'"]`);
        if (tabButton) {
            tabButton.className += " active";
        }
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
