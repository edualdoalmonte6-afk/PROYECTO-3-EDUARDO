// Variable global para almacenar los datos de los vehículos
let vehiclesData = [];
// Variable global para el carrito (se inicializará con LocalStorage si hay datos)
let cart = [];
// URL de la API JSON de vehículos
const API_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';

// Variables para el producto seleccionado en el modal de cantidad
let selectedVehicle = null;

// Referencias a elementos del DOM
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const cartCountSpan = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
const addToCartBtn = document.getElementById('addToCartBtn');
const paymentForm = document.getElementById('paymentForm');

// ----------------------------------------------------
// 1. CARGA DE DATOS Y LÓGICA DE INICIALIZACIÓN
// ----------------------------------------------------

// Función asíncrona para cargar los datos de los vehículos
async function loadVehicles() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        vehiclesData = await response.json();
        
        // Ocultar spinner y mostrar vehículos
        loadingSpinner.classList.add('d-none');
        displayVehicles(vehiclesData);
        
        // Cargar carrito desde LocalStorage y actualizar UI
        loadCartFromStorage();

    } catch (error) {
        console.error('Error al cargar los datos de vehículos:', error);
        loadingSpinner.classList.add('d-none');
        productsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">
            <i class="fas fa-times-circle me-2"></i> Error al cargar los vehículos: ${error.message}
        </div></div>`;
    }
}

// ----------------------------------------------------
// 2. RENDERING Y FILTRADO DE VEHÍCULOS
// ----------------------------------------------------

// Función para mostrar los vehículos en el contenedor principal
function displayVehicles(vehicles) {
    productsContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
    
    if (vehicles.length === 0) {
        productsContainer.innerHTML = `<div class="col-12"><p class="text-center text-muted fs-5">
            No se encontraron vehículos que coincidan con la búsqueda. 🧐
        </p></div>`;
        return;
    }

    vehicles.forEach(vehicle => {
        // Eliminar emojis del campo 'tipo' si existen
        const cleanTipo = vehicle.tipo.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim();
        
        const cardHtml = `
            <div class="col">
                <div class="card h-100 product-card shadow-sm" aria-labelledby="vehicleTitle-${vehicle.codigo}">
                    <img src="${vehicle.imagen}" class="card-img-top product-card-img" alt="Foto del ${vehicle.marca} ${vehicle.modelo}" loading="lazy" 
                        role="button" data-action="viewDetails" data-codigo="${vehicle.codigo}">

                    <div class="card-body">
                        <h5 class="card-title fw-bold" id="vehicleTitle-${vehicle.codigo}">
                            <img src="${vehicle.logo}" alt="Logo de ${vehicle.marca}" style="width: 20px; height: 20px; object-fit: contain; margin-right: 5px;">
                            ${vehicle.marca} ${vehicle.modelo}
                        </h5>
                        
                        <p class="card-text text-muted">
                            <span class="badge bg-info text-dark me-2">${vehicle.categoria}</span>
                            Tipo: ${cleanTipo}
                        </p>
                        
                        <div class="d-flex justify-content-between align-items-center mt-2">
                             <p class="card-price mb-0">$${vehicle.precio_venta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                             <button class="btn btn-sm btn-outline-dark viewDetailsBtn" data-codigo="${vehicle.codigo}" 
                                aria-label="Ver detalles del ${vehicle.marca} ${vehicle.modelo}">
                                Ver Detalle
                             </button>
                        </div>
                       

                        <button class="btn btn-primary w-100 mt-3 addToCartBtn" 
                                data-codigo="${vehicle.codigo}" 
                                aria-label="Añadir ${vehicle.marca} ${vehicle.modelo} al carrito">
                            <i class="fas fa-cart-plus me-2"></i> Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Función de filtrado dinámico
function filterVehicles() {
    const searchText = searchInput.value.toLowerCase().trim();
    
    const filtered = vehiclesData.filter(vehicle => {
        const fullTitle = `${vehicle.marca} ${vehicle.modelo}`.toLowerCase();
        const category = vehicle.categoria.toLowerCase();
        
        return fullTitle.includes(searchText) || category.includes(searchText);
    });
    
    displayVehicles(filtered);
}

// ----------------------------------------------------
// 3. GESTIÓN DEL CARRITO (CART)
// ----------------------------------------------------

// Cargar carrito desde LocalStorage
function loadCartFromStorage() {
    const storedCart = localStorage.getItem('Almonte AutoimportCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartUI();
}

// Guardar carrito en LocalStorage
function saveCartToStorage() {
    localStorage.setItem('garageOnlineCart', JSON.stringify(cart));
}

// Muestra el modal de cantidad para el vehículo seleccionado
function showQuantityModal(vehicle) {
    selectedVehicle = vehicle;
    document.getElementById('quantityInput').value = 1; // Resetear la cantidad
    quantityModal.show();
}

// Añadir el vehículo al carrito
function addItemToCart(vehicle, quantity) {
    const existingItem = cart.find(item => item.codigo === vehicle.codigo);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Crear un nuevo objeto ítem de carrito
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            imagen: vehicle.imagen,
            logo: vehicle.logo,
            quantity: quantity
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    console.log('Vehículo añadido/actualizado en el carrito:', vehicle.modelo, 'x', quantity);
}

// Actualizar la interfaz de usuario del carrito
function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let totalItemsCount = 0;

    if (cart.length === 0) {
        emptyCartMessage.classList.remove('d-none');
        checkoutBtn.disabled = true;
    } else {
        emptyCartMessage.classList.add('d-none');
        checkoutBtn.disabled = false;

        cart.forEach(item => {
            const subtotal = item.precio * item.quantity;
            total += subtotal;
            totalItemsCount += item.quantity;

            const itemHtml = `
                <div class="list-group-item d-flex align-items-center py-3" data-codigo="${item.codigo}">
                    <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" style="width: 60px; height: 40px; object-fit: cover;" class="rounded me-3">
                    <div class="flex-grow-1">
                        <p class="mb-0 fw-bold">${item.marca} ${item.modelo}</p>
                        <small class="text-muted">$${item.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} c/u</small>
                    </div>
                    
                    <div class="d-flex align-items-center mx-3">
                         <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartItem(${item.codigo}, -1)" aria-label="Disminuir cantidad de ${item.modelo}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary ms-1" onclick="updateCartItem(${item.codigo}, 1)" aria-label="Aumentar cantidad de ${item.modelo}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <span class="fw-bold me-3 text-primary">$${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    
                    <button class="btn btn-danger btn-sm" onclick="removeItemFromCart(${item.codigo})" aria-label="Eliminar ${item.modelo} del carrito">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
        });
    }

    // Actualizar contadores y total
    cartTotalSpan.textContent = total.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    cartCountSpan.textContent = totalItemsCount;
}

// Actualizar cantidad de un ítem en el carrito
function updateCartItem(codigo, change) {
    const itemIndex = cart.findIndex(item => item.codigo === codigo);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Eliminar si la cantidad llega a 0
        }
        saveCartToStorage();
        updateCartUI();
    }
}

// Eliminar un ítem del carrito
function removeItemFromCart(codigo) {
    cart = cart.filter(item => item.codigo !== codigo);
    saveCartToStorage();
    updateCartUI();
}

// ----------------------------------------------------
// 4. GENERACIÓN DE FACTURA (jsPDF)
// ----------------------------------------------------
function generateInvoice(clientName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 15; // Posición inicial Y

    // 1. Título
    doc.setFontSize(22);
    doc.text("FACTURA DE VENTA", 105, y, { align: 'center' });
    y += 10;

    // 2. Datos de la Tienda y Cliente
    doc.setFontSize(10);
    doc.text("Almonte Autoimport S.A.", 10, y);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, y);
    y += 5;
    doc.text(`Cliente: ${clientName}`, 10, y);
    y += 10;

    // 3. Encabezado de la tabla de productos
    doc.setFontSize(12);
    doc.setFillColor(200, 200, 200); // Gris claro
    doc.rect(10, y, 190, 7, 'F');
    doc.text("CÓDIGO", 12, y + 5);
    doc.text("DESCRIPCIÓN", 40, y + 5);
    doc.text("CANT.", 140, y + 5);
    doc.text("PRECIO U.", 160, y + 5);
    doc.text("SUBTOTAL", 185, y + 5, { align: 'right' });
    y += 12;

    // 4. Detalles de los productos
    doc.setFontSize(10);
    let finalTotal = 0;
    const itemLineHeight = 6;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        finalTotal += subtotal;
        
        // Agregar nueva página si el contenido se sale del margen
        if (y > 280) {
            doc.addPage();
            y = 15;
            doc.setFontSize(10);
        }

        doc.text(String(item.codigo), 12, y);
        doc.text(`${item.marca} ${item.modelo}`, 40, y);
        doc.text(String(item.quantity), 140, y);
        doc.text(`$${item.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 160, y);
        doc.text(`$${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 185, y, { align: 'right' });
        y += itemLineHeight;
    });

    y += 5;
    doc.line(10, y, 200, y); // Línea divisoria
    y += 5;

    // 5. Total Final
    doc.setFontSize(14);
    doc.text("TOTAL FINAL:", 150, y);
    doc.text(`$${finalTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 200, y, { align: 'right' });
    y += 10;
    
    // 6. Mensaje
    doc.setFontSize(10);
    doc.text("¡Gracias por su compra en Almonte Autoimport!", 105, y, { align: 'center' });

    // Guardar el PDF
    doc.save(`Factura_Almonte Autoimport_${new Date().getTime()}.pdf`);
}

// ----------------------------------------------------
// 5. EVENT LISTENERS Y MANIPULACIÓN DEL DOM
// ----------------------------------------------------

// Manejador centralizado de clics en el contenedor de productos
function handleProductClick(event) {
    const target = event.target;
    const button = target.closest('.addToCartBtn');
    const viewDetailsBtn = target.closest('.viewDetailsBtn') || (target.tagName === 'IMG' && target.dataset.action === 'viewDetails' ? target : null);
    
    // 1. Manejar clic en "Añadir al Carrito" (del card)
    if (button) {
        const codigo = parseInt(button.dataset.codigo);
        const vehicle = vehiclesData.find(v => v.codigo === codigo);
        if (vehicle) {
            showQuantityModal(vehicle);
        }
    }
    
    // 2. Manejar clic en "Ver Detalle" o la imagen
    if (viewDetailsBtn) {
        const codigo = parseInt(viewDetailsBtn.dataset.codigo);
        const vehicle = vehiclesData.find(v => v.codigo === codigo);
        if (vehicle) {
            showDetailModal(vehicle);
        }
    }
}

// Función para mostrar el modal de detalles
function showDetailModal(vehicle) {
    // Asignar el vehículo seleccionado para el botón "Añadir al Carrito" dentro del modal
    document.getElementById('detailAddToCartBtn').dataset.codigo = vehicle.codigo;
    
    document.getElementById('detailImage').src = vehicle.imagen;
    document.getElementById('detailImage').alt = `Imagen de ${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailTitle').textContent = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailMarca').textContent = vehicle.marca;
    document.getElementById('detailModelo').textContent = vehicle.modelo;
    document.getElementById('detailCategoria').textContent = vehicle.categoria;
    document.getElementById('detailTipo').textContent = vehicle.tipo.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '').trim(); // Limpiar emojis
    document.getElementById('detailPrecio').textContent = `$${vehicle.precio_venta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

    detailModal.show();
}

// Listener para el botón "Añadir al Carrito" dentro del modal de CANTIDAD
addToCartBtn.addEventListener('click', () => {
    if (selectedVehicle) {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        if (quantity > 0) {
            addItemToCart(selectedVehicle, quantity);
            quantityModal.hide();
        } else {
            alert('La cantidad debe ser mayor que 0.');
        }
    }
});

// Listener para el botón "Añadir al Carrito" dentro del modal de DETALLES
document.getElementById('detailAddToCartBtn').addEventListener('click', (event) => {
    const codigo = parseInt(event.currentTarget.dataset.codigo);
    const vehicle = vehiclesData.find(v => v.codigo === codigo);
    if (vehicle) {
        selectedVehicle = vehicle; // Establecer el vehículo seleccionado
        // El modal de cantidad se abre automáticamente por data-bs-toggle/target
    }
});

// Listener para el formulario de pago
paymentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validación básica (Bootstrap ya maneja 'required' y 'pattern')
    const clientName = document.getElementById('clientName').value;
    
    if (cart.length === 0) {
        alert('❌ El carrito está vacío. No se puede procesar el pago.');
        return;
    }

    // 1. Generar Factura PDF
    generateInvoice(clientName);
    
    // 2. Mensaje de éxito
    alert(`✅ ¡Pago exitoso, ${clientName}! Se ha descargado tu factura.`);
    
    // 3. Vaciar carrito y actualizar UI
    cart = [];
    saveCartToStorage();
    updateCartUI();
    
    // 4. Ocultar modales
    paymentModal.hide();
    cartModal.hide();
    paymentForm.reset();
});

// ----------------------------------------------------
// 6. INICIALIZACIÓN
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos y renderizar al inicio
    loadVehicles(); 

    // Event listener para la búsqueda
    searchInput.addEventListener('input', filterVehicles);
    
    // Event listener centralizado para los botones de las tarjetas
    productsContainer.addEventListener('click', handleProductClick);
});