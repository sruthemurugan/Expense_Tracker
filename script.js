class ExpenseTracker {
    constructor() {
        this.transactions = this.getTransactions();
        this.currentEditingId = null;
        this.pendingDeleteId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateUI();
        this.initializeChart();
    }

    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    setupEventListeners() {
        const form = document.getElementById('transaction-form');
        const monthSelector = document.getElementById('month-selector');
        const transactionContainer = document.getElementById('transaction-container');
        const modal = document.getElementById('custom-modal');
        const cancelBtn = document.getElementById('modal-cancel');
        const confirmBtn = document.getElementById('modal-confirm');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        monthSelector.addEventListener('change', () => {
            this.updateDateForSelectedMonth(); 
            this.updateUI();
        });

        transactionContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                this.showDeleteConfirmation(e.target.dataset.id);
            }
            if (e.target.classList.contains('edit-btn')) {
                this.editTransaction(e.target.dataset.id);
            }
        });
    
        cancelBtn.addEventListener('click', () => this.hideModal());
        confirmBtn.addEventListener('click', () => this.confirmDelete());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    showDeleteConfirmation(id) {
        this.pendingDeleteId = id;
        const modal = document.getElementById('custom-modal');
        modal.style.display = 'block';
    }
    
    hideModal() {
        const modal = document.getElementById('custom-modal');
        modal.style.display = 'none';
        this.pendingDeleteId = null;
    }

    confirmDelete() {
        if (this.pendingDeleteId) {
            this.transactions = this.transactions.filter(t => t.id !== this.pendingDeleteId);
            this.saveTransactions();
            this.updateUI();
            this.hideModal();
        }
    }

    updateDateForSelectedMonth() {
        const monthSelector = document.getElementById('month-selector');
        const dateInput = document.getElementById('date');
        const selectedMonth = monthSelector.value;
        
        if (!selectedMonth) {
            dateInput.value = new Date().toISOString().split('T')[0];
            return;
        }
        
        const today = new Date();
        const selectedDate = new Date(selectedMonth + '-01');  
        
        if (selectedDate.getMonth() === today.getMonth() && 
            selectedDate.getFullYear() === today.getFullYear()) {
            dateInput.value = today.toISOString().split('T')[0];
        } else {
            dateInput.value = selectedMonth + '-01';
        }
    }

    setDefaultDate() {
        const monthSelector = document.getElementById('month-selector');
        const dateInput = document.getElementById('date');

        if (!monthSelector.value) {
            const currentMonth = new Date().toISOString().substring(0, 7);
            monthSelector.value = currentMonth;
        }
        
        this.updateDateForSelectedMonth(); 
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: this.currentEditingId || Date.now().toString(),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            description: formData.get('description')
        };

        if (!this.validateForm(transaction)) {
            return;
        }

        if (this.currentEditingId) {
            this.updateTransaction(transaction);
        } else {
            this.addTransaction(transaction);
        }

        this.resetForm();
    }

    validateForm(transaction) {
        if (transaction.type === 'transaction-type') {
            alert('Please select a transaction type');
            return false;
        }
        if (transaction.category === 'category') {
            alert('Please select a category');
            return false;
        }
        if (!transaction.amount || transaction.amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        if (!transaction.date) {
            alert('Please select a date');
            return false;
        }
        return true;
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.saveTransactions();
        this.updateUI();
    }

    updateTransaction(updatedTransaction) {
        const index = this.transactions.findIndex(t => t.id === updatedTransaction.id);
        if (index !== -1) {
            this.transactions[index] = updatedTransaction;
            this.saveTransactions();
            this.updateUI();
        }
    }

    deleteTransaction(id) {
        this.showDeleteConfirmation(id);
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            document.getElementById('type').value = transaction.type;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category').value = transaction.category;
            document.getElementById('date').value = transaction.date;
            document.getElementById('description').value = transaction.description;
            
            this.currentEditingId = id;
            document.querySelector('button[type="submit"]').textContent = 'Update Transaction';
            
            document.getElementById('input-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    resetForm() {
        document.getElementById('transaction-form').reset();
        this.setDefaultDate();
        this.currentEditingId = null;
        document.querySelector('button[type="submit"]').textContent = 'Add Transaction';
    }

    getFilteredTransactions() {
        const monthSelector = document.getElementById('month-selector');
        const selectedMonth = monthSelector.value;
        
        if (!selectedMonth) {
            return this.transactions;
        }

        return this.transactions.filter(transaction => 
            transaction.date.startsWith(selectedMonth)
        );
    }

    calculateSummary(transactions) {
        const summary = {
            income: 0,
            expense: 0,
            balance: 0
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                summary.income += transaction.amount;
            } else {
                summary.expense += transaction.amount;
            }
        });

        summary.balance = summary.income - summary.expense;
        return summary;
    }

    updateUI() {
        const filteredTransactions = this.getFilteredTransactions();
        this.updateSummary(filteredTransactions);
        this.renderTransactionList(filteredTransactions);
        this.updateChart(filteredTransactions);
    }

    updateSummary(transactions) {
        const summary = this.calculateSummary(transactions);
        
        document.getElementById('total-income').innerHTML = 
            `<i class="fa-solid fa-indian-rupee-sign"></i> ${summary.income.toFixed(2)}`;
        
        document.getElementById('total-expense').innerHTML = 
            `<i class="fa-solid fa-indian-rupee-sign"></i> ${summary.expense.toFixed(2)}`;
        
        const balanceElement = document.getElementById('balance');
        
        const balanceSign = summary.balance < 0 ? '-' : '';
        balanceElement.innerHTML = 
            `${balanceSign}<i class="fa-solid fa-indian-rupee-sign"></i> ${Math.abs(summary.balance).toFixed(2)}`;
        
        balanceElement.className = summary.balance >= 0 ? 'positive' : 'negative';
    }

    renderTransactionList(transactions) {
        const container = document.getElementById('transaction-container');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found</p>
                </div>
            `;
            return;
        }

        const sortedTransactions = transactions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        container.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-details">
                    <div class="description">${transaction.description || 'No description'}</div>
                    <div class="category">${transaction.category}</div>
                    <div class="date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount">
                    <span class="amount">
                        <i class="fa-solid fa-indian-rupee-sign"></i> ${transaction.amount.toFixed(2)}
                    </span>
                </div>
                <div class="transaction-actions">
                    <button class="edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }

    initializeChart() {
        const ctx = document.getElementById('expense-chart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ef4444', '#f97316', '#eab308', '#a855f7',
                        '#06b6d4', '#84cc16', '#f59e0b', '#8b5cf6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category',
                        font: {
                            size: 14
                        },
                        padding: 10
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateChart(transactions) {
        if (!this.chart) return;

        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryData = this.groupByCategory(expenseTransactions);

        this.chart.data.labels = categoryData.labels;
        this.chart.data.datasets[0].data = categoryData.amounts;
        this.chart.update();
    }

    groupByCategory(transactions) {
        const categories = {};
        
        transactions.forEach(transaction => {
            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }
            categories[transaction.category] += transaction.amount;
        });

        return {
            labels: Object.keys(categories),
            amounts: Object.values(categories)
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ExpenseTracker();
});