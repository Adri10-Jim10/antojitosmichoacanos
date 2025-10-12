let carritoVisible = false;
let carrito = [];

function toggleCarrito() {
	const cart = document.getElementById('carrito');
	cart.style.display = carritoVisible ? 'none' : 'block';
	carritoVisible = !carritoVisible;
}

function agregarAlCarrito(nombre, precio) {
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
	const titulo = document.getElementById('modal-titulo');
	modal.style.display = 'flex';
	titulo.textContent = tipo === 'login' ? 'Iniciar sesión' : 'Registro de usuario';
}

function cerrarModal() {
	document.getElementById('modal').style.display = 'none';
}
