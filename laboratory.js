document.addEventListener("DOMContentLoaded", function () {
    const labListContainer = document.getElementById("lab-list-container");
    const addLabBtn = document.getElementById("add-lab-btn");
    const labModal = document.getElementById("lab-modal");
    const closeLabModalBtn = document.querySelector(".close-modal");
    const labForm = document.getElementById("lab-form");
    const searchInput = document.getElementById("search-lab");

    // Result Modal Elements
    const resultModal = document.getElementById("result-modal");
    const closeResultModalBtn = document.querySelector(".close-result-modal");
    const resultForm = document.getElementById("result-form");
    const doctorSelect = document.getElementById("doctorSelect");

    // Form Inputs
    const patientSelect = document.getElementById("patientSelect");
    const serviceSelect = document.getElementById("serviceSelect");
    const testCodeInput = document.getElementById("testCode");
    const priceInput = document.getElementById("price");

    // --- Initialization ---
    populateDropdowns();
    renderLabOrders();

    // --- Modal Logic (Add Order) ---
    if (addLabBtn) {
        addLabBtn.addEventListener("click", () => {
            document.querySelector("#lab-modal h2").textContent = "ახალი კვლევის დანიშვნა";
            labForm.reset();
            testCodeInput.value = "";
            priceInput.value = "";
            labModal.style.display = "block";
            document.body.style.overflow = "hidden";
        });
    }

    if (closeLabModalBtn) {
        closeLabModalBtn.addEventListener("click", () => {
            labModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    // --- Modal Logic (Result) ---
    if (closeResultModalBtn) {
        closeResultModalBtn.addEventListener("click", () => {
            resultModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === labModal) {
            labModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
        if (e.target === resultModal) {
            resultModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // --- Dropdown Logic ---
    function populateDropdowns() {
        // Patients
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        patientSelect.innerHTML = '<option value="">აირჩიეთ პაციენტი...</option>';
        patients.forEach(p => {
            const option = document.createElement("option");
            option.value = p.personalId;
            option.textContent = `${p.firstName} ${p.lastName} (${p.personalId})`;
            patientSelect.appendChild(option);
        });

        // Services (Laboratory only)
        const services = JSON.parse(localStorage.getItem("services")) || [];
        const labServices = services.filter(s => s.classification === "Laboratory");
        serviceSelect.innerHTML = '<option value="">აირჩიეთ კვლევა...</option>';
        labServices.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = s.name;
            option.dataset.code = s.code;
            option.dataset.price = s.price;
            option.dataset.name = s.name; // Store name for easy access
            serviceSelect.appendChild(option);
        });

        // Doctors (for Result signing)
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        doctorSelect.innerHTML = '<option value="">აირჩიეთ ექიმი...</option>';
        doctors.forEach(d => {
            const hasSig = d.signature ? " (ხელმოწერით)" : "";
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = `${d.firstName} ${d.lastName}${hasSig}`;
            doctorSelect.appendChild(option);
        });
    }

    // Update Price/Code on Service Selection
    if (serviceSelect) {
        serviceSelect.addEventListener("change", function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                testCodeInput.value = selectedOption.dataset.code;
                priceInput.value = selectedOption.dataset.price;
            } else {
                testCodeInput.value = "";
                priceInput.value = "";
            }
        });
    }

    // --- Add Order Submission ---
    if (labForm) {
        labForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const patientId = patientSelect.value;
            const serviceId = serviceSelect.value;
            const selectedServiceOption = serviceSelect.options[serviceSelect.selectedIndex];

            if (!patientId || !serviceId) {
                alert("გთხოვთ აირჩიოთ პაციენტი და სერვისი.");
                return;
            }

            const newOrder = {
                id: Date.now().toString(),
                patientId: patientId,
                serviceId: serviceId,
                serviceName: selectedServiceOption.dataset.name,
                code: testCodeInput.value,
                price: priceInput.value,
                status: "Pending", // Pending, Completed
                date: new Date().toISOString(),
                result: null,
                doctorId: null,
                signedAt: null
            };

            // Save to Lab Orders
            let labOrders = JSON.parse(localStorage.getItem("labOrders")) || [];
            labOrders.push(newOrder);
            localStorage.setItem("labOrders", JSON.stringify(labOrders));

            // Add to Patient History (for completeness in Patient View)
            let patients = JSON.parse(localStorage.getItem("patients")) || [];
            const pIndex = patients.findIndex(p => p.personalId === patientId);
            if (pIndex !== -1) {
                if (!patients[pIndex].history) patients[pIndex].history = [];
                patients[pIndex].history.push({
                    date: new Date().toISOString().split('T')[0],
                    serviceName: newOrder.serviceName,
                    serviceCode: newOrder.code,
                    price: newOrder.price,
                    doctor: "Laboratory" // Placeholder until signed
                });
                localStorage.setItem("patients", JSON.stringify(patients));
            }

            alert("კვლევა წარმატებით დაინიშნა!");
            labModal.style.display = "none";
            document.body.style.overflow = "auto";
            renderLabOrders();
        });
    }

    // --- Result Submission ---
    if (resultForm) {
        resultForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const orderId = document.getElementById("result-order-id").value;
            const resultText = document.getElementById("resultText").value;
            const docId = doctorSelect.value;

            if (!docId) {
                alert("გთხოვთ აირჩიოთ ხელმომწერი ექიმი.");
                return;
            }

            let labOrders = JSON.parse(localStorage.getItem("labOrders")) || [];
            const index = labOrders.findIndex(o => o.id === orderId);

            if (index !== -1) {
                labOrders[index].status = "Completed";
                labOrders[index].result = resultText;
                labOrders[index].doctorId = docId;
                labOrders[index].signedAt = new Date().toISOString();
                
                localStorage.setItem("labOrders", JSON.stringify(labOrders));
                
                // Update Patient History Doctor? 
                // It's a bit complex to sync back to patient history efficiently without ID, but for now LabOrders is the source of truth for Lab.
                
                alert("შედეგი შენახულია!");
                resultModal.style.display = "none";
                document.body.style.overflow = "auto";
                renderLabOrders();
            }
        });
    }

    // --- Rendering ---
    function renderLabOrders(searchTerm = "") {
        const labOrders = JSON.parse(localStorage.getItem("labOrders")) || [];
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        
        labListContainer.innerHTML = "";

        // Filter
        const filtered = labOrders.filter(o => {
            const patient = patients.find(p => p.personalId === o.patientId);
            const pName = patient ? `${patient.firstName} ${patient.lastName}` : "";
            const searchLower = searchTerm.toLowerCase();
            
            return pName.toLowerCase().includes(searchLower) || 
                   o.serviceName.toLowerCase().includes(searchLower) ||
                   o.code.toLowerCase().includes(searchLower);
        });

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            labListContainer.innerHTML = '<div class="no-data">კვლევები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(o => {
            const patient = patients.find(p => p.personalId === o.patientId);
            const pName = patient ? `${patient.firstName} ${patient.lastName}` : "უცნობი პაციენტი";
            
            const card = document.createElement("div");
            card.className = "patient-card"; // Reuse style

            let statusColor = o.status === "Completed" ? "#4caf50" : "#ff9800";
            let statusText = o.status === "Completed" ? "დასრულებული" : "მიმდინარე";

            let actionButtons = '';
            if (o.status !== "Completed") {
                actionButtons += `<button class="result-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">პასუხის შეყვანა</button>`;
            } else {
                actionButtons += `<button class="print-btn" style="flex: 1; background-color: #607d8b; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">🖨️ ბეჭდვა</button>`;
            }
            
            // Delete button (Admin only? Or safe to add for all for now)
            actionButtons += `<button class="delete-btn" style="flex: 0 0 auto; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>`;

            card.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar" style="background-color: #e8f5e9; color: #2e7d32;">
                        <i class="fa-solid fa-flask"></i>
                    </div>
                    <div class="patient-info-main">
                        <h3>${o.serviceName}</h3>
                        <span class="patient-id">${pName} | ${new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    <div class="patient-status" style="background-color: ${statusColor};">${statusText}</div>
                </div>
                <div class="patient-body">
                    <p><strong>კოდი:</strong> ${o.code}</p>
                    <p><strong>ფასი:</strong> ${o.price} GEL</p>
                    ${o.result ? `<p><strong>შედეგი:</strong> ${o.result.substring(0, 50)}...</p>` : ''}
                </div>
                <div class="patient-footer" style="display: flex; gap: 10px;">
                    ${actionButtons}
                </div>
            `;
            
            // Listeners
            const resultBtn = card.querySelector(".result-btn");
            if(resultBtn) resultBtn.addEventListener("click", () => openResultModal(o));

            const printBtn = card.querySelector(".print-btn");
            if(printBtn) printBtn.addEventListener("click", () => printResult(o));

            const deleteBtn = card.querySelector(".delete-btn");
            if(deleteBtn) deleteBtn.addEventListener("click", () => deleteOrder(o.id));

            labListContainer.appendChild(card);
        });
    }

    window.openResultModal = function(order) {
        document.getElementById("result-order-id").value = order.id;
        document.getElementById("resultText").value = order.result || "";
        if (order.doctorId) doctorSelect.value = order.doctorId;
        
        resultModal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    window.deleteOrder = function(id) {
        if(confirm("დარწმუნებული ხართ?")) {
            let labOrders = JSON.parse(localStorage.getItem("labOrders")) || [];
            labOrders = labOrders.filter(o => o.id !== id);
            localStorage.setItem("labOrders", JSON.stringify(labOrders));
            renderLabOrders(searchInput.value);
        }
    }

    // --- Search ---
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderLabOrders(e.target.value);
        });
    }

    // --- Print Function ---
    function printResult(order) {
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        
        const patient = patients.find(p => p.personalId === order.patientId);
        const doctor = doctors.find(d => d.id === order.doctorId);

        if (!patient || !doctor) {
            alert("მონაცემები არასრულია (პაციენტი ან ექიმი ვერ მოიძებნა).");
            return;
        }

        let printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>ლაბორატორიული კვლევის პასუხი</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: "DejaVu Sans", sans-serif; padding: 40px; color: #333; }');
        printWindow.document.write('.header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #009688; padding-bottom: 20px; }');
        printWindow.document.write('.meta { display: flex; justify-content: space-between; margin-bottom: 30px; }');
        printWindow.document.write('.result-box { border: 1px solid #ccc; padding: 20px; min-height: 200px; margin-bottom: 30px; border-radius: 5px; background: #f9f9f9; }');
        printWindow.document.write('.footer { margin-top: 50px; display: flex; justify-content: flex-end; align-items: flex-end; flex-direction: column; }');
        printWindow.document.write('.signature-box { text-align: center; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');

        printWindow.document.write('<div class="header">');
        printWindow.document.write('<h1>Clinic Healthy</h1>');
        printWindow.document.write('<h3>ლაბორატორიული კვლევის პასუხი</h3>');
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="meta">');
        printWindow.document.write(`<div>
            <p><strong>პაციენტი:</strong> ${patient.firstName} ${patient.lastName}</p>
            <p><strong>პირადი ნომერი:</strong> ${patient.personalId}</p>
            <p><strong>ასაკი:</strong> ${calculateAge(patient.dob)} წელი</p>
        </div>`);
        printWindow.document.write(`<div>
            <p><strong>კვლევა:</strong> ${order.serviceName}</p>
            <p><strong>კოდი:</strong> ${order.code}</p>
            <p><strong>თარიღი:</strong> ${new Date(order.signedAt || order.date).toLocaleDateString()}</p>
        </div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<h4>კვლევის შედეგი:</h4>');
        printWindow.document.write(`<div class="result-box"><pre style="font-family: inherit; white-space: pre-wrap;">${order.result}</pre></div>`);

        printWindow.document.write('<div class="footer">');
        printWindow.document.write('<div class="signature-box">');
        
        if (doctor.signature) {
            printWindow.document.write(`<img src="${doctor.signature}" alt="ხელმოწერა" width="150" style="border-bottom: 1px solid #ccc; padding-bottom: 5px; display: block; margin: 0 auto;">`);
        } else {
            printWindow.document.write('<div style="width: 150px; height: 50px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>');
        }
        
        printWindow.document.write(`<p><strong>ექიმი:</strong> ${doctor.firstName} ${doctor.lastName}</p>`);
        printWindow.document.write(`<p style="font-size: 0.8em; color: #666;">ხელმოწერის დრო: ${new Date(order.signedAt).toLocaleString()}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('</div>');

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        // Allow images to load before print?
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    function calculateAge(dob) {
        if (!dob) return "-";
        const birthDate = new Date(dob);
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference); 
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
});
