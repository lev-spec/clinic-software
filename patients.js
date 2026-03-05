document.addEventListener("DOMContentLoaded", function () {
    const patientsListContainer = document.getElementById("patients-list-container");
    const addPatientBtn = document.getElementById("add-patient-btn");
    
    // Add Modal Elements
    const addModal = document.getElementById("patient-modal");
    const closeAddModalBtn = document.querySelector(".close-modal"); // First one (add modal)
    
    // View Modal Elements
    const viewModal = document.getElementById("view-patient-modal");
    const closeViewModalBtn = document.querySelector(".close-view-modal");
    const viewDetailsContainer = document.getElementById("view-patient-details");

    // History Modal Elements
    const historyModal = document.getElementById("history-modal");
    const closeHistoryModalBtn = document.querySelector(".close-history-modal");
    const historyTableBody = document.getElementById("history-table-body");
    const printHistoryBtn = document.getElementById("print-history-btn");
    const printAnketaBtn = document.getElementById("print-anketa-btn");
    const historyPatientInfo = document.getElementById("history-patient-info");

    const patientForm = document.getElementById("patient-form");
    const searchInput = document.getElementById("search-patient");

    let currentHistoryPatient = null;

    // Seed Data if empty
    seedPatients();

    // Load patients on startup
    renderPatients();

    // Check for URL parameter (from Dashboard click)
    const urlParams = new URLSearchParams(window.location.search);
    const linkedPersonalId = urlParams.get('personalId');
    if (linkedPersonalId) {
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        const foundPatient = patients.find(p => p.personalId === linkedPersonalId);
        if (foundPatient) {
            openViewModal(foundPatient);
        }
    }

    // --- Add Patient Logic ---
    if (addPatientBtn) {
        addPatientBtn.addEventListener("click", () => {
            document.querySelector("#patient-modal h2").textContent = "ახალი პაციენტის დამატება";
            document.querySelector("#patient-form .submit-btn").textContent = "შენახვა";
            if(document.getElementById("edit-mode-id")) document.getElementById("edit-mode-id").value = "";
            patientForm.reset();

            addModal.style.display = "block";
            document.body.style.overflow = "hidden";
        });
    }

    if (closeAddModalBtn) {
        closeAddModalBtn.addEventListener("click", () => {
            addModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    // --- View Patient Logic ---
    if (closeViewModalBtn) {
        closeViewModalBtn.addEventListener("click", () => {
            viewModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    // --- History Modal Logic ---
    if (closeHistoryModalBtn) {
        closeHistoryModalBtn.addEventListener("click", () => {
            historyModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    if (printHistoryBtn) {
        printHistoryBtn.addEventListener("click", () => {
            printPatientHistory();
        });
    }

    if (printAnketaBtn) {
        printAnketaBtn.addEventListener("click", () => {
            printPatientAnketa();
        });
    }

    // Close on outside click (all modals)
    window.addEventListener("click", (e) => {
        if (e.target === addModal) {
            addModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
        if (e.target === viewModal) {
            viewModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
        if (e.target === historyModal) {
            historyModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // Handle Form Submission (Patient)
    if (patientForm) {
        patientForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const consent = document.getElementById("consent").checked;
            if (!consent) {
                alert("გთხოვთ, მოაწეროთ ხელი თანხმობის ფორმას გასაგრძელებლად.");
                return;
            }

            const editId = document.getElementById("edit-mode-id") ? document.getElementById("edit-mode-id").value : "";
            
            const newPatient = {
                firstName: document.getElementById("firstName").value,
                lastName: document.getElementById("lastName").value,
                personalId: document.getElementById("personalId").value,
                dob: document.getElementById("dob").value,
                gender: document.getElementById("gender").value,
                citizenship: document.getElementById("citizenship").value,
                phone: document.getElementById("phone").value,
                addressActual: document.getElementById("addressActual").value,
                addressLegal: document.getElementById("addressLegal").value,
                email: document.getElementById("email").value,
                bloodGroup: document.getElementById("bloodGroup").value,
                allergies: document.getElementById("allergies").value,
                status: document.getElementById("status").value,
                familyDoctor: document.getElementById("familyDoctor").value,
                diagnosis: document.getElementById("diagnosis").value,
                insuranceCompany: document.getElementById("insuranceCompany").value,
                policyNumber: document.getElementById("policyNumber").value,
                insuranceType: document.getElementById("insuranceType").value,
                createdAt: editId ? undefined : new Date().toISOString(),
                history: [] // Init history
            };

            if (!/^\d{11}$/.test(newPatient.personalId)) {
                alert("პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან.");
                return;
            }

            let patients = JSON.parse(localStorage.getItem("patients")) || [];
            
            if (editId) {
                // Check if NEW ID already exists (and it's not the same patient)
                if (editId !== newPatient.personalId && patients.some(p => p.personalId === newPatient.personalId)) {
                    alert("პაციენტი ამ პირადი ნომრით უკვე არსებობს.");
                    return;
                }

                // Update existing
                const index = patients.findIndex(p => p.personalId === editId);
                if (index !== -1) {
                    newPatient.createdAt = patients[index].createdAt; // Preserve created date
                    newPatient.history = patients[index].history || []; // Preserve history
                    patients[index] = newPatient;
                    localStorage.setItem("patients", JSON.stringify(patients));
                    alert("პაციენტის მონაცემები განახლდა!");
                }
            } else {
                // Add new
                if (patients.some(p => p.personalId === newPatient.personalId)) {
                    alert("პაციენტი ამ პირადი ნომრით უკვე არსებობს.");
                    return;
                }
                patients.push(newPatient);
                localStorage.setItem("patients", JSON.stringify(patients));
                alert("პაციენტი წარმატებით დაემატა!");
            }

            patientForm.reset();
            addModal.style.display = "none";
            document.body.style.overflow = "auto";

            renderPatients();
        });
    }

    // Search Functionality
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderPatients(e.target.value);
        });
    }

    // Expose deletePatient to global scope or handle via event delegation
    window.deletePatient = function(personalId) {
        if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ პაციენტის წაშლა?")) {
            let patients = JSON.parse(localStorage.getItem("patients")) || [];
            patients = patients.filter(p => p.personalId !== personalId);
            localStorage.setItem("patients", JSON.stringify(patients));
            renderPatients(searchInput ? searchInput.value : "");
            // alert("პაციენტი წარმატებით წაიშალა.");
        }
    }

    function renderPatients(searchTerm = "") {
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        patientsListContainer.innerHTML = "";

        if (patients.length === 0) {
            patientsListContainer.innerHTML = '<div class="no-data">პაციენტები არ მოიძებნა. დააჭირეთ "პაციენტის დამატებას".</div>';
            return;
        }

        const filtered = patients.filter(p => 
            p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.personalId.includes(searchTerm)
        );

        if (filtered.length === 0) {
            patientsListContainer.innerHTML = '<div class="no-data">შესაბამისი პაციენტები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement("div");
            card.className = "patient-card";
            
            let statusColor = "#4caf50"; 
            if(p.status === "Inactive") statusColor = "#ff9800";
            if(p.status === "Deceased") statusColor = "#9e9e9e";

            card.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar">${p.firstName[0]}${p.lastName[0]}</div>
                    <div class="patient-info-main">
                        <h3>${p.firstName} ${p.lastName}</h3>
                        <span class="patient-id">ID: ${p.personalId}</span>
                    </div>
                    <div class="patient-status" style="background-color: ${statusColor}">${p.status}</div>
                </div>
                <div class="patient-body">
                    <p><strong>პრობლემა:</strong> ${p.diagnosis || "N/A"}</p>
                    <p><strong>ტელეფონი:</strong> ${p.phone || "N/A"}</p>
                </div>
                <div class="patient-footer" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="view-btn" style="flex: 1; margin: 0;">დეტალები</button>
                    <button class="history-btn" style="flex: 1; background-color: #607d8b; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">ისტორია</button>
                    <button class="edit-btn" style="flex: 1; background-color: #ff9800; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">რედაქტირება</button>
                    <button class="delete-btn" style="flex: 1; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">წაშლა</button>
                </div>
            `;
            
            // Attach Event Listeners
            const viewBtn = card.querySelector(".view-btn");
            viewBtn.addEventListener("click", () => openViewModal(p));

            const historyBtn = card.querySelector(".history-btn");
            historyBtn.addEventListener("click", () => openHistoryModal(p));

            const editBtn = card.querySelector(".edit-btn");
            editBtn.addEventListener("click", () => openEditModal(p));

            const deleteBtn = card.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", () => window.deletePatient(p.personalId));

            patientsListContainer.appendChild(card);
        });
    }

    function openEditModal(patient) {
        document.querySelector("#patient-modal h2").textContent = "პაციენტის რედაქტირება";
        document.querySelector("#patient-form .submit-btn").textContent = "განახლება";
        document.getElementById("edit-mode-id").value = patient.personalId;

        // Populate fields
        document.getElementById("firstName").value = patient.firstName;
        document.getElementById("lastName").value = patient.lastName;
        document.getElementById("personalId").value = patient.personalId;
        document.getElementById("dob").value = patient.dob;
        document.getElementById("gender").value = patient.gender;
        document.getElementById("citizenship").value = patient.citizenship;
        document.getElementById("phone").value = patient.phone;
        document.getElementById("addressActual").value = patient.addressActual;
        document.getElementById("addressLegal").value = patient.addressLegal;
        document.getElementById("email").value = patient.email || "";
        document.getElementById("bloodGroup").value = patient.bloodGroup || "";
        document.getElementById("allergies").value = patient.allergies || "";
        document.getElementById("status").value = patient.status;
        document.getElementById("familyDoctor").value = patient.familyDoctor || "";
        document.getElementById("diagnosis").value = patient.diagnosis || "";
        document.getElementById("insuranceCompany").value = patient.insuranceCompany || "";
        document.getElementById("policyNumber").value = patient.policyNumber || "";
        document.getElementById("insuranceType").value = patient.insuranceType || "";
        
        document.getElementById("consent").checked = true;

        addModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    function openViewModal(patient) {
        if (!viewDetailsContainer) return;

        viewDetailsContainer.innerHTML = `
            <div class="detail-group">
                <h3>პირადი ინფორმაცია</h3>
                <p><strong>სახელი გვარი:</strong> ${patient.firstName} ${patient.lastName}</p>
                <p><strong>პირადი ნომერი:</strong> ${patient.personalId}</p>
                <p><strong>დაბადების თარიღი:</strong> ${patient.dob}</p>
                <p><strong>სქესი:</strong> ${patient.gender}</p>
                <p><strong>მოქალაქეობა:</strong> ${patient.citizenship}</p>
            </div>
            <div class="detail-group">
                <h3>კონტაქტი</h3>
                <p><strong>ტელეფონი:</strong> ${patient.phone}</p>
                <p><strong>ელ-ფოსტა:</strong> ${patient.email || "N/A"}</p>
                <p><strong>მისამართი (ფაქტიური):</strong> ${patient.addressActual}</p>
                <p><strong>მისამართი (იურიდიული):</strong> ${patient.addressLegal}</p>
            </div>
            <div class="detail-group">
                <h3>სამედიცინო</h3>
                <p><strong>სისხლის ჯგუფი:</strong> ${patient.bloodGroup || "უცნობი"}</p>
                <p><strong>ალერგიები:</strong> ${patient.allergies || "არა"}</p>
                <p><strong>სტატუსი:</strong> ${patient.status}</p>
                <p><strong>დიაგნოზი:</strong> ${patient.diagnosis || "N/A"}</p>
                <p><strong>ოჯახის ექიმი:</strong> ${patient.familyDoctor || "N/A"}</p>
            </div>
            <div class="detail-group">
                <h3>დაზღვევა</h3>
                <p><strong>კომპანია:</strong> ${patient.insuranceCompany || "N/A"}</p>
                <p><strong>პოლისის #:</strong> ${patient.policyNumber || "N/A"}</p>
                <p><strong>ტიპი:</strong> ${patient.insuranceType || "არა"}</p>
            </div>
        `;
        
        viewModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    // --- History Functions ---
    function openHistoryModal(patient) {
        currentHistoryPatient = patient;
        historyPatientInfo.innerHTML = `
            <div>${patient.firstName} ${patient.lastName} (ID: ${patient.personalId})</div>
            <div>დაბადების თარიღი: ${patient.dob}</div>
        `;
        
        renderHistoryTable(patient);
        historyModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    function renderHistoryTable(patient) {
        historyTableBody.innerHTML = "";
        const history = patient.history || [];

        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">ისტორია ცარიელია</td></tr>';
            return;
        }

        // Sort by date desc
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        history.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 10px; border: 1px solid #ddd;">${item.date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.serviceName}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.serviceCode}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.price} GEL</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${getDoctorName(item.doctor)}</td>
            `;
            historyTableBody.appendChild(tr);
        });
    }



    function printPatientHistory() {
        if (!currentHistoryPatient) return;
        
        const history = currentHistoryPatient.history || [];
        
        let printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>პაციენტის ისტორია</title>');
        printWindow.document.write('<style>body{font-family: sans-serif;} table{width: 100%; border-collapse: collapse; margin-top: 20px;} th, td{border: 1px solid black; padding: 8px; text-align: left;} .header{margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px;} </style>');
        printWindow.document.write('</head><body>');
        
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<h1>Clinic Healthy - პაციენტის ისტორია</h1>');
        printWindow.document.write(`<p><strong>პაციენტი:</strong> ${currentHistoryPatient.firstName} ${currentHistoryPatient.lastName}</p>`);
        printWindow.document.write(`<p><strong>პირადი ნომერი:</strong> ${currentHistoryPatient.personalId}</p>`);
        printWindow.document.write(`<p><strong>დაბადების თარიღი:</strong> ${currentHistoryPatient.dob}</p>`);
        printWindow.document.write('</div>');

        if (history.length > 0) {
            printWindow.document.write('<table><thead><tr><th>თარიღი</th><th>სერვისი</th><th>კოდი</th><th>თანხა</th><th>ექიმი</th></tr></thead><tbody>');
            
            history.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            history.forEach(item => {
                printWindow.document.write(`<tr>
                    <td>${item.date}</td>
                    <td>${item.serviceName}</td>
                    <td>${item.serviceCode}</td>
                    <td>${item.price} GEL</td>
                    <td>${getDoctorName(item.doctor)}</td>
                </tr>`);
            });
            printWindow.document.write('</tbody></table>');
        } else {
            printWindow.document.write('<p>ისტორია ცარიელია.</p>');
        }

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }

    function printPatientAnketa() {
        if (!currentHistoryPatient) return;
        const p = currentHistoryPatient;

        let printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>პაციენტის ანკეტა</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: "DejaVu Sans", sans-serif; padding: 40px; }');
        printWindow.document.write('h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }');
        printWindow.document.write('.section { margin-bottom: 20px; }');
        printWindow.document.write('.section h3 { background-color: #f2f2f2; padding: 5px 10px; border-bottom: 1px solid #ccc; }');
        printWindow.document.write('.row { display: flex; margin-bottom: 8px; }');
        printWindow.document.write('.label { font-weight: bold; width: 200px; }');
        printWindow.document.write('.value { flex: 1; border-bottom: 1px dotted #ccc; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');

        printWindow.document.write('<h1>Clinic Healthy - პაციენტის ანკეტა</h1>');

        printWindow.document.write('<div class="section"><h3>1. პერსონალური ინფორმაცია</h3>');
        printWindow.document.write(`<div class="row"><span class="label">სახელი, გვარი:</span><span class="value">${p.firstName} ${p.lastName}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">პირადი ნომერი:</span><span class="value">${p.personalId}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">დაბადების თარიღი:</span><span class="value">${p.dob}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">სქესი:</span><span class="value">${p.gender}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">მოქალაქეობა:</span><span class="value">${p.citizenship}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="section"><h3>2. საკონტაქტო ინფორმაცია</h3>');
        printWindow.document.write(`<div class="row"><span class="label">ტელეფონი:</span><span class="value">${p.phone}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">ელ-ფოსტა:</span><span class="value">${p.email || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">ფაქტიური მისამართი:</span><span class="value">${p.addressActual}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">იურიდიული მისამართი:</span><span class="value">${p.addressLegal}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="section"><h3>3. სამედიცინო ინფორმაცია</h3>');
        printWindow.document.write(`<div class="row"><span class="label">სისხლის ჯგუფი:</span><span class="value">${p.bloodGroup || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">ალერგიები:</span><span class="value">${p.allergies || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">დიაგნოზი / პრობლემა:</span><span class="value">${p.diagnosis || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">ოჯახის ექიმი:</span><span class="value">${p.familyDoctor || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">სტატუსი:</span><span class="value">${p.status}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="section"><h3>4. დაზღვევა</h3>');
        printWindow.document.write(`<div class="row"><span class="label">კომპანია:</span><span class="value">${p.insuranceCompany || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">პოლისის ნომერი:</span><span class="value">${p.policyNumber || "-"}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">ტიპი:</span><span class="value">${p.insuranceType || "-"}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div style="margin-top: 50px; display: flex; justify-content: space-between;">');
        printWindow.document.write('<div><strong>თარიღი:</strong> _______________</div>');
        printWindow.document.write('<div><strong>პაციენტის ხელმოწერა:</strong> _______________</div>');
        printWindow.document.write('</div>');

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }

    function getDoctorName(id) {
        if (!id) return "N/A";
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const doc = doctors.find(d => d.id === id);
        return doc ? `${doc.firstName} ${doc.lastName}` : id;
    }

    function seedPatients() {
        if (!localStorage.getItem("patients")) {
            localStorage.setItem("patients", JSON.stringify([]));
        }
    }
});
