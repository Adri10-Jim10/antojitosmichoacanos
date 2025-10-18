let carrito = [];
let total = 0;

function toggleCarrito() {
	const carritoDiv = document.getElementById('carrito');
	carritoDiv.style.display = carritoDiv.style.display === 'none' ? 'block' : 'none';
}

function agregarAlCarrito(nombre, precio) {
	carrito.push({ nombre, precio });
	total += precio;
	renderizarCarrito();
}

function renderizarCarrito() {
	const itemsDiv = document.getElementById('items');
	const totalSpan = document.getElementById('total');
	itemsDiv.innerHTML = '';

	carrito.forEach((item, index) => {
		const div = document.createElement('div');
		div.classList.add('item');
		div.innerHTML = `
			<p>${item.nombre}</p>
			<p>$${item.precio}</p>
			<button onclick="eliminarItem(${index})">🗑️</button>
		`;
		itemsDiv.appendChild(div);
	});

	totalSpan.textContent = total;
}

function eliminarItem(index) {
	total -= carrito[index].precio;
	carrito.splice(index, 1);
	renderizarCarrito();
}

function finalizarCompra() {
	if (carrito.length === 0) {
		alert("Tu carrito está vacío.");
		return;
	}
	alert("¡Gracias por tu compra!");
	carrito = [];
	total = 0;
	renderizarCarrito();
	toggleCarrito();
}
