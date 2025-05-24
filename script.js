let transactions = [];
let filteredTransactions = [];

document.addEventListener('DOMContentLoaded', function () {
    loadTransactions();
    setTodayDate();
    setupEventListeners();
    applyFilters();
    updateSummary();
});

// Establece la fecha actual en el formulario
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Escuchar eventos
function setupEventListeners() {
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', applyFilters);
    document.getElementById('filter-month').addEventListener('change', applyFilters);
}

// Cargar transacciones desde localStorage
function loadTransactions() {
    const stored = localStorage.getItem('transactions');
    transactions = stored ? JSON.parse(stored) : [];
    filteredTransactions = [...transactions];
}

// Guardar transacciones en localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Agregar nueva transacción
function addTransaction(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;

    if (!amount || !description || !category || !type || !date) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const transaction = {
        id: Date.now(),
        amount: type === 'gasto' ? -Math.abs(amount) : Math.abs(amount),
        description,
        category,
        type,
        date
    };

    transactions.unshift(transaction);
    saveTransactions();

    e.target.reset();
    setTodayDate();

    applyFilters();
    updateSummary();
    showSuccessMessage('Transacción agregada exitosamente');
}

// Eliminar una transacción
function deleteTransaction(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        applyFilters();
        updateSummary();
        showSuccessMessage('Transacción eliminada');
    }
}

// Filtrar y mostrar transacciones
function applyFilters() {
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const monthFilter = document.getElementById('filter-month').value;

    filteredTransactions = transactions.filter(transaction => {
        const matchesType = !typeFilter || transaction.type === typeFilter;
        const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
        const matchesMonth = !monthFilter || transaction.date.startsWith(monthFilter);
        return matchesType && matchesCategory && matchesMonth;
    });

    renderTransactions();
}

// Mostrar las transacciones en la tabla
function renderTransactions() {
    const tbody = document.getElementById('transactions-body');
    const noTransactions = document.getElementById('no-transactions');

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '';
        noTransactions.style.display = 'block';
        return;
    }

    noTransactions.style.display = 'none';
    tbody.innerHTML = '';

    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'fade-in';

        const categoryEmoji = getCategoryEmoji(transaction.category);
        const typeClass = transaction.type === 'ingreso' ? 'type-ingreso' : 'type-gasto';
        const amountClass = transaction.amount >= 0 ? 'amount-positive' : 'amount-negative';

        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td><span class="type-badge ${typeClass}">${transaction.type}</span></td>
            <td>${categoryEmoji} ${transaction.category}</td>
            <td>${transaction.description}</td>
            <td class="${amountClass}">S/ ${Math.abs(transaction.amount).toFixed(2)}</td>
            <td>
                <button class="btn btn-delete" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Actualizar las estadísticas financieras
function updateSummary() {
    const currentMonth = new Date().toISOString().slice(0, 7);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let totalBalance = 0;
    let expenseAmounts = [];

    transactions.forEach(transaction => {
        const transactionMonth = transaction.date.slice(0, 7);
        totalBalance += transaction.amount;

        if (transactionMonth === currentMonth) {
            if (transaction.amount > 0) {
                monthlyIncome += transaction.amount;
            } else {
                monthlyExpense += Math.abs(transaction.amount);
                expenseAmounts.push(Math.abs(transaction.amount));
            }
        }
    });

    document.getElementById('monthly-income').textContent = `S/ ${monthlyIncome.toFixed(2)}`;
    document.getElementById('monthly-expense').textContent = `S/ ${monthlyExpense.toFixed(2)}`;
    document.getElementById('total-balance').textContent = `S/ ${totalBalance.toFixed(2)}`;
    document.getElementById('transaction-count').textContent = transactions.length;

    const avgExpense = expenseAmounts.length > 0
        ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length
        : 0;

    const biggestExpense = expenseAmounts.length > 0
        ? Math.max(...expenseAmounts)
        : 0;

    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

    document.getElementById('avg-expense').textContent = `S/ ${avgExpense.toFixed(2)}`;
    document.getElementById('biggest-expense').textContent = `S/ ${biggestExpense.toFixed(2)}`;
    document.getElementById('days-left').textContent = daysLeft;
}

// Mostrar mensaje emergente
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utilidades
function getCategoryEmoji(category) {
    const emojis = {
        alimentacion: '🍽️',
        transporte: '🚗',
        salud: '🏥',
        educacion: '📚',
        entretenimiento: '🎬',
        servicios: '⚡',
        ropa: '👕',
        hogar: '🏠',
        trabajo: '💼',
        otros: '📦'
    };
    return emojis[category] || '📦';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
