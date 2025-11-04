// Dashboard Admin JavaScript
let currentUser = null;
let charts = {};

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadDashboardData();
});

// Verificar autenticación de administrador
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.rol !== 'administrador') {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    console.log('Usuario admin:', currentUser);
}

// Navegación entre secciones
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remover clase active de todos los links
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    document.getElementById(sectionName).style.display = 'block';
    
    // Activar link correspondiente
    const activeLink = Array.from(document.querySelectorAll('.nav-links li')).find(li => 
        li.getAttribute('onclick')?.includes(sectionName)
    );
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard Principal',
        'pedidos': 'Gestión de Pedidos',
        'usuarios': 'Gestión de Usuarios',
        'pagos': 'Gestión de Pagos',
        'resenas': 'Gestión de Reseñas',
        'productos': 'Gestión de Productos',
        'inventario': 'Gestión de Inventario'
    };
    
    const descriptions = {
        'dashboard': 'Resumen general del sistema',
        'pedidos': 'Administrar y monitorear pedidos',
        'usuarios': 'Gestionar usuarios del sistema',
        'pagos': 'Monitorear transacciones y pagos',
        'resenas': 'Revisar calificaciones y comentarios',
        'productos': 'Administrar productos del menú',
        'inventario': 'Control de stock y almacén'
    };
    
    document.getElementById('section-title').textContent = titles[sectionName] || 'Dashboard';
    document.getElementById('section-description').textContent = descriptions[sectionName] || 'Resumen general';
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionName);
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const response = await fetch('api/admin_dashboard.php');
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.stats);
            renderRecentOrders(data.recentOrders);
            renderCharts(data.chartData);
        } else {
            console.error('Error en dashboard:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('pedidos-recientes').innerHTML = '<p>Error cargando datos del dashboard</p>';
    }
}

// Actualizar estadísticas
function updateDashboardStats(stats) {
    document.getElementById('total-pedidos').textContent = stats.totalPedidos || 0;
    document.getElementById('pedidos-mes').textContent = stats.pedidosEsteMes || 0;
    document.getElementById('total-usuarios').textContent = stats.totalUsuarios || 0;
    document.getElementById('total-clientes').textContent = stats.totalClientes || 0;
    document.getElementById('total-ingresos').textContent = parseFloat(stats.ingresosTotales || 0).toFixed(2);
    document.getElementById('ingresos-mes').textContent = parseFloat(stats.ingresosEsteMes || 0).toFixed(2);
    document.getElementById('promedio-resenas').textContent = parseFloat(stats.promedioResenas || 0).toFixed(1);
    document.getElementById('total-resenas').textContent = stats.totalResenas || 0;
}

// Renderizar pedidos recientes
function renderRecentOrders(orders) {
    const container = document.getElementById('pedidos-recientes');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p>No hay pedidos recientes</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    orders.forEach(order => {
        const fecha = order.fecha_pedido ? new Date(order.fecha_pedido).toLocaleDateString() : 'N/A';
        html += `
            <tr>
                <td>#${order.id_pedido || 'N/A'}</td>
                <td>${order.cliente || 'Cliente'}</td>
                <td>$${parseFloat(order.total_pedido || 0).toFixed(2)}</td>
                <td><span class="badge ${order.estado || 'pendiente'}">${order.estado || 'pendiente'}</span></td>
                <td>${fecha}</td>
                <td>
                    <button class="btn btn-ver" onclick="viewOrder(${order.id_pedido})">Ver</button>
                    <button class="btn btn-editar" onclick="editOrder(${order.id_pedido})">Editar</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Renderizar gráficos
function renderCharts(chartData) {
    if (!chartData) return;
    
    // Gráfico de estados de pedidos
    const pedidosCtx = document.getElementById('pedidosChart');
    if (!pedidosCtx) return;
    
    if (charts.pedidos) charts.pedidos.destroy();
    
    charts.pedidos = new Chart(pedidosCtx, {
        type: 'doughnut',
        data: {
            labels: chartData.pedidosEstados?.labels || ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'],
            datasets: [{
                data: chartData.pedidosEstados?.data || [0, 0, 0, 0, 0],
                backgroundColor: ['#3498db', '#f39c12', '#2ecc71', '#e74c3c', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico de ingresos mensuales
    const ingresosCtx = document.getElementById('ingresosChart');
    if (!ingresosCtx) return;
    
    if (charts.ingresos) charts.ingresos.destroy();
    
    charts.ingresos = new Chart(ingresosCtx, {
        type: 'line',
        data: {
            labels: chartData.ingresosMensuales?.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Ingresos Mensuales',
                data: chartData.ingresosMensuales?.data || [0, 0, 0, 0, 0, 0],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Cargar datos específicos de sección
async function loadSectionData(sectionName) {
    try {
        const endpoints = {
            'pedidos': 'api/admin_pedidos.php',
            'usuarios': 'api/admin_usuarios.php',
            'pagos': 'api/admin_pagos.php',
            'resenas': 'api/admin_resenas.php',
            'productos': 'api/admin_productos.php',
            'inventario': 'api/admin_inventario.php'
        };
        
        if (endpoints[sectionName]) {
            const response = await fetch(endpoints[sectionName]);
            const data = await response.json();
            
            if (data.success) {
                renderSectionTable(sectionName, data.data);
            } else {
                document.getElementById(`tabla-${sectionName}`).innerHTML = `<p>Error: ${data.message}</p>`;
            }
        }
    } catch (error) {
        console.error(`Error loading ${sectionName} data:`, error);
        document.getElementById(`tabla-${sectionName}`).innerHTML = '<p>Error cargando datos</p>';
    }
}

// Renderizar tablas de secciones
function renderSectionTable(sectionName, data) {
    const container = document.getElementById(`tabla-${sectionName}`);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No hay datos disponibles</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    
    // Encabezados dinámicos basados en la sección
    switch(sectionName) {
        case 'pedidos':
            html += `
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
            `;
            break;
        case 'usuarios':
            html += `
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Acciones</th>
            `;
            break;
        
        case 'resenas':
            html += `
                <th>ID</th>
                <th>Cliente</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th>Acciones</th>
            `;
            break;
        case 'productos':
            html += `
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
            `;
            break;
        case 'inventario':
            html += `
                <th>ID</th>
                <th>Producto</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Última Actualización</th>
                <th>Estado</th>
                <th>Acciones</th>
            `;
            break;
        default:
            html += '<th>Datos</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    data.forEach(item => {
        html += '<tr>';
        
        switch(sectionName) {
            case 'pedidos':
                const fechaPedido = item.fecha_pedido ? new Date(item.fecha_pedido).toLocaleDateString() : 'N/A';
                html += `
                    <td>#${item.id_pedido || 'N/A'}</td>
                    <td>${item.cliente || item.cliente_nombre || 'Cliente'}</td>
                    <td>$${parseFloat(item.total_pedido || 0).toFixed(2)}</td>
                    <td>${item.tipo_pedido || 'local'}</td>
                    <td><span class="badge ${item.estado || 'pendiente'}">${item.estado || 'pendiente'}</span></td>
                    <td>${fechaPedido}</td>
                    <td>
                        <button class="btn btn-ver" onclick="viewOrder(${item.id_pedido})">Ver</button>
                        <button class="btn btn-editar" onclick="editOrder(${item.id_pedido})">Editar</button>
                    </td>
                `;
                break;
            case 'usuarios':
                const fechaRegistro = item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : 'N/A';
                html += `
                    <td>${item.id_usuario || 'N/A'}</td>
                    <td>${item.usuario || 'Usuario'}</td>
                    <td>${item.correo || 'N/A'}</td>
                    <td>${item.rol || 'cliente'}</td>
                    <td>${fechaRegistro}</td>
                    <td>
                        <button class="btn btn-editar" onclick="editUser(${item.id_usuario})">Editar</button>
                        ${item.rol !== 'administrador' ? `<button class="btn btn-eliminar" onclick="deleteUser(${item.id_usuario})">Eliminar</button>` : ''}
                    </td>
                `;
                break;
            case 'pagos':
                const fechaPago = item.fecha_pago ? new Date(item.fecha_pago).toLocaleDateString() : 'N/A';
                html += `
                    <td>${item.id_pago || 'N/A'}</td>
                    <td>#${item.id_pedido || 'N/A'}</td>
                    <td>${item.nombre_usuario || 'Cliente'}</td>
                    <td>${item.metodo_pago || 'efectivo'}</td>
                    <td>$${parseFloat(item.monto_total || 0).toFixed(2)}</td>
                    <td><span class="badge ${item.estado || 'pendiente'}">${item.estado || 'pendiente'}</span></td>
                    <td>${fechaPago}</td>
                `;
                break;
            case 'resenas':
                const fechaResena = item.fecha_reseña ? new Date(item.fecha_reseña).toLocaleDateString() : 'N/A';
                html += `
                    <td>${item.id_reseña || 'N/A'}</td>
                    <td>${item.cliente || 'Cliente'}</td>
                    <td>${'⭐'.repeat(item.calificacion || 0)}</td>
                    <td>${item.comentario || 'Sin comentario'}</td>
                    <td>${fechaResena}</td>
                    <td>
                        <button class="btn btn-ver" onclick="viewReview(${item.id_reseña})">Ver</button>
                        <button class="btn btn-eliminar" onclick="deleteReview(${item.id_reseña})">Eliminar</button>
                    </td>
                `;
                break;

            case 'productos':
                html += `
                    <td>${item.id_producto}</td>
                    <td>${item.nombre}</td>
                    <td>$${parseFloat(item.precio).toFixed(2)}</td>
                    <td>${item.categoria_nombre || 'Sin categoría'}</td>
                    <td>${item.stock ?? 'Sin stock'}</td>
                    <td><span class="badge ${item.activo == 1 ? 'activo' : 'inactivo'}">${item.activo == 1 ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <button class="btn btn-editar" onclick="editProduct(${item.id_producto})">Editar</button>
                        <button class="btn btn-eliminar" onclick="deleteProduct(${item.id_producto})">Eliminar</button>
                    </td>
                `;
                break;

            case 'inventario':
                html += `
                    <td>${item.id_almacen}</td>
                    <td>${item.producto_nombre}</td>
                    <td>${item.stock}</td>
                    <td>${item.stock_minimo}</td>
                    <td>${item.fecha_actualizacion}</td>
                    <td>$${parseFloat(item.precio).toFixed(2)}</td>
                    <td>${item.stock <= item.stock_minimo ? '<span class="badge alerta">Bajo</span>' : '<span class="badge ok">OK</span>'}</td>
                    <td>
                        <button class="btn btn-editar" onclick="editarStock(${item.id_almacen}, ${item.stock})">Editar</button>
                    </td>
                `;
                break;
            default:
                html += `<td>${JSON.stringify(item)}</td>`;
        }
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Funciones de acciones
function viewOrder(orderId) {
    alert(`Ver pedido #${orderId}`);
    // Implementar modal de detalles del pedido
}

function editOrder(orderId) {
    alert(`Editar pedido #${orderId}`);
    // Implementar edición de pedido
}

function editUser(userId) {
    alert(`Editar usuario #${userId}`);
    // Implementar edición de usuario
}

function deleteUser(userId) {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
        fetch('api/admin_usuarios.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_usuario: userId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSection('usuarios');
                alert('Usuario eliminado correctamente');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar usuario');
        });
    }
}

function viewReview(reviewId) {
    alert(`Ver reseña #${reviewId}`);
}

function deleteReview(reviewId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
        fetch('api/admin_resenas.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_resena: reviewId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSection('resenas');
                alert('Reseña eliminada correctamente');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al eliminar reseña');
        });
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Actualizar datos cada 30 segundos
setInterval(() => {
    if (document.getElementById('dashboard').style.display !== 'none') {
        loadDashboardData();
    }
}, 30000);