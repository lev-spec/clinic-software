document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("inventory-table-body");
    const addBtn = document.getElementById("add-inventory-btn");
    const printBtn = document.getElementById("print-inventory-btn");
    const modal = document.getElementById("inventory-modal");
    const closeBtn = document.querySelector(".close-modal");
    const form = document.getElementById("inventory-form");

    // Initialize default inventory data if empty
    if (!localStorage.getItem("inventory")) {
        const defaultData = [
            { id: Date.now() + 1, name: "შპრიცი 5მლ", category: "სახარჯი მასალა", quantity: 1200, unit: "ცალი", minQty: 100 },
            { id: Date.now() + 2, name: "პარაცეტამოლი 500მგ", category: "მედიკამენტი", quantity: 15, unit: "კოლოფი", minQty: 20 }
        ];
        localStorage.setItem("inventory", JSON.stringify(defaultData));
    }

    function loadInventory() {
        const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
        tableBody.innerHTML = "";

        if (inventory.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">საწყობი ცარიელია</td></tr>';
            return;
        }

        inventory.forEach(item => {
            const tr = document.createElement("tr");
            
            let statusText = "ნორმაშია";
            let statusColor = "green";
            let qtyColor = "black";
            
            if (item.quantity <= item.minQty) {
                statusText = "მარაგი იწურება";
                statusColor = "red";
                qtyColor = "red";
            }

            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${qtyColor};">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.unit}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${statusColor};">${statusText}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <button class="edit-btn" data-id="${item.id}" style="padding: 5px 10px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">რედაქტირება</button>
                    <button class="delete-btn" data-id="${item.id}" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">წაშლა</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                const id = parseInt(this.getAttribute("data-id"));
                openModal(id);
            });
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                const id = parseInt(this.getAttribute("data-id"));
                if (confirm("ნამდვილად გსურთ ნივთის წაშლა?")) {
                    let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
                    inventory = inventory.filter(i => i.id !== id);
                    localStorage.setItem("inventory", JSON.stringify(inventory));
                    loadInventory();
                }
            });
        });
    }

    function openModal(id = null) {
        if (id) {
            const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
            const item = inventory.find(i => i.id === id);
            if (item) {
                document.getElementById("inventory-id").value = item.id;
                document.getElementById("inv-name").value = item.name;
                document.getElementById("inv-category").value = item.category;
                document.getElementById("inv-quantity").value = item.quantity;
                document.getElementById("inv-unit").value = item.unit;
                document.getElementById("inv-min-qty").value = item.minQty;
                document.querySelector("#inventory-modal h2").textContent = "ნივთის რედაქტირება";
            }
        } else {
            form.reset();
            document.getElementById("inventory-id").value = "";
            document.querySelector("#inventory-modal h2").textContent = "ნივთის დამატება";
        }
        modal.style.display = "block";
    }

    addBtn.addEventListener("click", () => openModal());

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const id = document.getElementById("inventory-id").value;
        const newItem = {
            id: id ? parseInt(id) : Date.now(),
            name: document.getElementById("inv-name").value,
            category: document.getElementById("inv-category").value,
            quantity: parseInt(document.getElementById("inv-quantity").value),
            unit: document.getElementById("inv-unit").value,
            minQty: parseInt(document.getElementById("inv-min-qty").value)
        };

        let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
        
        if (id) {
            const index = inventory.findIndex(i => i.id === parseInt(id));
            if (index !== -1) inventory[index] = newItem;
        } else {
            inventory.push(newItem);
        }

        localStorage.setItem("inventory", JSON.stringify(inventory));
        modal.style.display = "none";
        loadInventory();
    });

    printBtn.addEventListener("click", function() {
        const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
        let printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>საწყობის ნაშთები</title>');
        printWindow.document.write('<style>body{font-family: sans-serif;} table{width: 100%; border-collapse: collapse; margin-top: 20px;} th, td{border: 1px solid black; padding: 8px; text-align: left;} .header{margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px;} </style>');
        printWindow.document.write('</head><body>');
        
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<h1>Clinic Healthy - საწყობის ნაშთები</h1>');
        printWindow.document.write(`<p><strong>თარიღი:</strong> ${new Date().toLocaleDateString()}</p>`);
        printWindow.document.write('</div>');

        if (inventory.length > 0) {
            printWindow.document.write('<table><thead><tr><th>დასახელება</th><th>კატეგორია</th><th>რაოდენობა</th><th>ერთეული</th><th>სტატუსი</th></tr></thead><tbody>');
            
            inventory.forEach(item => {
                let statusText = "ნორმაშია";
                if (item.quantity <= item.minQty) {
                    statusText = "მარაგი იწურება";
                }
                printWindow.document.write(`<tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${statusText}</td>
                </tr>`);
            });
            printWindow.document.write('</tbody></table>');
        } else {
            printWindow.document.write('<p>საწყობი ცარიელია.</p>');
        }

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    });

    loadInventory();
});