document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("billing-table-body");
    const btnNewInvoice = document.getElementById("btn-new-invoice");

    let invoices = JSON.parse(localStorage.getItem("invoices"));
    if (!invoices) {
        // Create initial demo data
        invoices = [
            { id: "INV-00101", patientName: "გიორგი მაისურაძე", date: "2024-05-15", amount: 150.00, status: "Paid" },
            { id: "INV-00102", patientName: "ნინო ბერიძე", date: "2024-05-15", amount: 80.00, status: "Unpaid" }
        ];
        localStorage.setItem("invoices", JSON.stringify(invoices));
    }

    const patients = JSON.parse(localStorage.getItem("patients")) || [];
    const services = JSON.parse(localStorage.getItem("services")) || [];

    // Inject Modal HTML
    const modalHTML = `
    <div id="invoice-modal" class="modal" style="display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
        <div class="modal-content" style="background-color: #fefefe; margin: 10% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 500px; border-radius: 8px;">
            <span class="close-invoice-modal" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            <h2>ახალი ინვოისი</h2>
            <form id="invoice-form" style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">პაციენტი:</label>
                    <select id="invoice-patient" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- აირჩიეთ პაციენტი --</option>
                        ${patients.map(p => `<option value="${p.firstName} ${p.lastName}">${p.firstName} ${p.lastName} (${p.personalId})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">სერვისი:</label>
                    <select id="invoice-service" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="" data-price="">-- აირჩიეთ სერვისი --</option>
                        ${services.map(s => `<option value="${s.name}" data-price="${s.price}">${s.name} - ${s.price} GEL</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">თანხა (GEL):</label>
                    <input type="number" id="invoice-amount" required readonly style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #e9ecef;">
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">სტატუსი:</label>
                    <select id="invoice-status" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="Unpaid">გადასახდელი</option>
                        <option value="Paid">გადახდილი</option>
                    </select>
                </div>
                <button type="submit" style="padding: 12px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">შენახვა</button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const invoiceModal = document.getElementById("invoice-modal");
    const closeInvoiceModalBtn = document.querySelector(".close-invoice-modal");
    const invoiceForm = document.getElementById("invoice-form");
    const invoiceService = document.getElementById("invoice-service");
    const invoiceAmount = document.getElementById("invoice-amount");

    // Modal Events
    if (btnNewInvoice) {
        btnNewInvoice.addEventListener("click", () => {
            invoiceForm.reset();
            invoiceModal.style.display = "block";
        });
    }

    if (closeInvoiceModalBtn) {
        closeInvoiceModalBtn.addEventListener("click", () => {
            invoiceModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === invoiceModal) {
            invoiceModal.style.display = "none";
        }
    });

    // Auto-fill amount based on selected service
    if (invoiceService) {
        invoiceService.addEventListener("change", (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.getAttribute("data-price");
            if (price) {
                invoiceAmount.value = parseFloat(price).toFixed(2);
            } else {
                invoiceAmount.value = "";
            }
        });
    }

    // Form Submission
    if (invoiceForm) {
        invoiceForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newId = "INV-00" + (invoices.length + 101);
            const patientName = document.getElementById("invoice-patient").value;
            const amount = parseFloat(invoiceAmount.value);
            const status = document.getElementById("invoice-status").value;
            const date = new Date().toISOString().split('T')[0];

            const newInvoice = {
                id: newId,
                patientName: patientName,
                date: date,
                amount: amount,
                status: status
            };

            invoices.unshift(newInvoice);
            localStorage.setItem("invoices", JSON.stringify(invoices));
            renderInvoices();
            invoiceModal.style.display = "none";
        });
    }

    // Render Invoices
    function renderInvoices() {
        if (!tableBody) return;
        tableBody.innerHTML = "";
        
        invoices.forEach(inv => {
            const tr = document.createElement("tr");
            
            let statusHtml = '';
            let actionBtnHtml = '';

            if (inv.status === "Paid") {
                statusHtml = '<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">გადახდილი</span>';
                actionBtnHtml = `<button onclick="printInvoice('${inv.id}')" style="border:none; background:none; cursor:pointer; color:#2196f3; font-weight: bold;"><i class="fa-solid fa-print"></i> ბეჭდვა</button>`;
            } else {
                statusHtml = '<span style="background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">გადასახდელი</span>';
                actionBtnHtml = `<button onclick="payInvoice('${inv.id}')" style="border:none; background:none; cursor:pointer; color:#4caf50; font-weight: bold;"><i class="fa-solid fa-money-bill-wave"></i> გადახდა</button>`;
            }

            tr.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.patientName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.date}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">${parseFloat(inv.amount).toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${statusHtml}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${actionBtnHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Global Functions for buttons
    window.payInvoice = function(id) {
        if(confirm("დაადასტურეთ გადახდა?")) {
            const idx = invoices.findIndex(i => i.id === id);
            if(idx !== -1) {
                invoices[idx].status = "Paid";
                localStorage.setItem("invoices", JSON.stringify(invoices));
                renderInvoices();
            }
        }
    };

    window.printInvoice = function(id) {
        const inv = invoices.find(i => i.id === id);
        if(!inv) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>ინვოისი ${inv.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin-bottom: 30px; line-height: 1.6; }
                    .total { font-size: 1.2em; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Clinic Healthy</h1>
                    <h2>ინვოისი ${inv.id}</h2>
                </div>
                <div class="details">
                    <p><strong>პაციენტი:</strong> ${inv.patientName}</p>
                    <p><strong>თარიღი:</strong> ${inv.date}</p>
                    <p><strong>სტატუსი:</strong> ${inv.status === 'Paid' ? 'გადახდილი' : 'გადასახდელი'}</p>
                </div>
                <div class="total">
                    <p>სულ გადასახდელი: ${parseFloat(inv.amount).toFixed(2)} GEL</p>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    renderInvoices();
});
