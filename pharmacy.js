document.addEventListener("DOMContentLoaded", function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const prescriptionsTableBody = document.getElementById("prescriptions-table-body");
    const searchInput = document.getElementById("search-prescription");
    const addBtn = document.getElementById("add-prescription-btn");
    const modal = document.getElementById("prescription-modal");
    const closeBtn = document.querySelector(".close-modal");
    const form = document.getElementById("prescription-form");
    const patientSelect = document.getElementById("presc-patient");

    let prescriptions = JSON.parse(localStorage.getItem("prescriptions")) || [];
    let patients = JSON.parse(localStorage.getItem("patients")) || [];

    // Initialize patients dropdown
    function loadPatientsDropdown() {
        if (!patientSelect) return;
        patientSelect.innerHTML = '<option value="">აირჩიეთ პაციენტი...</option>';
        patients.forEach(p => {
            const option = document.createElement("option");
            option.value = p.personalId || p.id;
            option.textContent = `${p.firstName} ${p.lastName} (${p.personalId})`;
            patientSelect.appendChild(option);
        });
    }

    function savePrescriptions() {
        localStorage.setItem("prescriptions", JSON.stringify(prescriptions));
    }

    function renderTable(filterText = "") {
        if (!prescriptionsTableBody) return;
        prescriptionsTableBody.innerHTML = "";
        
        const filtered = prescriptions.filter(pr => 
            pr.patientName.toLowerCase().includes(filterText.toLowerCase()) || 
            pr.doctorName.toLowerCase().includes(filterText.toLowerCase()) ||
            pr.medications.some(m => m.name.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filtered.length === 0) {
            prescriptionsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">რეცეპტები არ მოიძებნა</td></tr>`;
            return;
        }

        filtered.reverse().forEach((pr, index) => {
            const tr = document.createElement("tr");
            
            let statusBadge = '';
            if (pr.status === 'გაცემულია') {
                statusBadge = '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">გაცემულია</span>';
            } else {
                statusBadge = '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">აქტიური</span>';
            }

            let medsHtml = pr.medications.map(m => `<div><strong>${m.name}</strong> - ${m.dose}</div>`).join('');

            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${pr.date}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${pr.patientName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${pr.doctorName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${medsHtml}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${statusBadge}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    ${pr.status === 'აქტიური' ? `<button class="dispense-btn" data-id="${pr.id}" style="background: #2196f3; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-pills"></i> გაცემა</button>` : ''}
                    <button class="print-btn" data-id="${pr.id}" style="background: #607d8b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 5px;"><i class="fa-solid fa-print"></i> ბეჭდვა</button>
                    <button class="delete-btn" data-id="${pr.id}" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 5px;"><i class="fa-solid fa-trash"></i> წაშლა</button>
                </td>
            `;
            prescriptionsTableBody.appendChild(tr);
        });

        // Add event listeners for buttons
        document.querySelectorAll('.dispense-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const presc = prescriptions.find(p => p.id === id);
                if (presc) {
                    if (confirm(`ნამდვილად გსურთ გაცემა პაციენტზე: ${presc.patientName}?`)) {
                        presc.status = 'გაცემულია';
                        savePrescriptions();
                        renderTable(searchInput.value);
                    }
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('ნამდვილად გსურთ რეცეპტის წაშლა?')) {
                    prescriptions = prescriptions.filter(p => p.id !== id);
                    savePrescriptions();
                    renderTable(searchInput.value);
                }
            });
        });

        document.querySelectorAll('.print-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const presc = prescriptions.find(p => p.id === id);
                if (presc) {
                    let printHtml = `
                        <div id="print-area" style="font-family: Arial, sans-serif; padding: 20px;">
                            <h3 style="text-align: center; margin-bottom: 20px;">რეცეპტი</h3>
                            <p><strong>თარიღი:</strong> ${presc.date}</p>
                            <p><strong>პაციენტი:</strong> ${presc.patientName}</p>
                            <p><strong>ექიმი:</strong> ${presc.doctorName}</p>
                            <hr style="margin: 15px 0;">
                            <h4>დანიშნულება:</h4>
                            <ul>
                                ${presc.medications.map(m => `<li style="margin-bottom: 10px;"><strong>${m.name}</strong><br><em>მიღების წესი:</em> ${m.dose}</li>`).join('')}
                            </ul>
                            ${presc.notes ? `<p><strong>შენიშვნა/დიაგნოზი:</strong> ${presc.notes}</p>` : ''}
                            <hr style="margin: 20px 0;">
                            <p style="text-align: right; margin-top: 40px;">ექიმის ხელმოწერა: ___________________</p>
                        </div>
                        <div style="text-align: center; margin-top: 20px;" class="no-print">
                            <button onclick="
                                const printWindow = window.open('', '_blank');
                                printWindow.document.write('<html><head><title>Print</title></head><body>' + document.getElementById('print-area').innerHTML + '</body></html>');
                                printWindow.document.close();
                                printWindow.focus();
                                setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                            " style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">ბეჭდვა</button>
                        </div>
                    `;
                    if (window.showCustomModal) {
                        window.showCustomModal("რეცეპტის ბეჭდვა", printHtml);
                    } else {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write('<html><head><title>Print</title></head><body>' + document.getElementById('print-area').innerHTML + '</body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                    }
                }
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    const medsContainer = document.getElementById("medications-container");
    const addMedBtn = document.getElementById("add-medication-btn");

    if (addMedBtn && medsContainer) {
        addMedBtn.addEventListener('click', () => {
            const count = medsContainer.querySelectorAll('.medication-entry').length + 1;
            const entryHtml = `
                <div class="medication-entry" style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px; position: relative;">
                    <button type="button" class="remove-med-btn" style="position: absolute; right: 10px; top: 10px; background: #f44336; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash"></i> წაშლა</button>
                    <label class="med-label" style="display: block; margin-bottom: 5px; font-weight: bold;">მედიკამენტი ${count}:</label>
                    <input type="text" class="presc-med" required placeholder="დასახელება" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <input type="text" class="presc-dose" required placeholder="მიღების წესი" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
            `;
            medsContainer.insertAdjacentHTML('beforeend', entryHtml);
            
            const newEntry = medsContainer.lastElementChild;
            const removeBtn = newEntry.querySelector('.remove-med-btn');
            removeBtn.addEventListener('click', function() {
                newEntry.remove();
                const entries = medsContainer.querySelectorAll('.medication-entry');
                entries.forEach((ent, idx) => {
                    ent.querySelector('.med-label').textContent = 'მედიკამენტი ' + (idx + 1) + ':';
                });
            });
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            loadPatientsDropdown();
            if (medsContainer) {
                medsContainer.innerHTML = `
                    <div class="medication-entry" style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px; position: relative;">
                        <label class="med-label" style="display: block; margin-bottom: 5px; font-weight: bold;">მედიკამენტი 1:</label>
                        <input type="text" class="presc-med" required placeholder="მაგ. პარაცეტამოლი 500მგ" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <input type="text" class="presc-dose" required placeholder="მიღების წესი: 1 აბი 3-ჯერ დღეში" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                `;
            }
            modal.style.display = 'flex';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const patientId = document.getElementById("presc-patient").value;
            const patient = patients.find(p => (p.personalId || p.id) === patientId);
            const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "უცნობი პაციენტი";
            
            const notes = document.getElementById("presc-notes").value;

            const medications = [];
            const medEntries = document.querySelectorAll('.medication-entry');
            medEntries.forEach(entry => {
                const med = entry.querySelector('.presc-med').value.trim();
                const dose = entry.querySelector('.presc-dose').value.trim();
                if (med && dose) {
                    medications.push({ name: med, dose: dose });
                }
            });

            const newPrescription = {
                id: 'pr_' + Date.now(),
                date: new Date().toLocaleDateString('ka-GE'),
                patientId: patientId,
                patientName: patientName,
                doctorId: currentUser.id || 'doc_unknown',
                doctorName: `${currentUser.firstName} ${currentUser.lastName}`,
                medications: medications,
                notes: notes,
                status: 'აქტიური'
            };

            prescriptions.push(newPrescription);
            savePrescriptions();
            renderTable();
            modal.style.display = 'none';
            form.reset();
        });
    }

    // Initial render
    loadPatientsDropdown();
    renderTable();
});
