document.addEventListener("DOMContentLoaded", function () {
    const calendarHeader = document.getElementById("calendar-header");
    const calendarGrid = document.getElementById("calendar-grid");
    const addAppointmentBtn = document.getElementById("add-appointment-btn");
    
    // Add Appointment Modal Elements
    const appointmentModal = document.getElementById("appointment-modal");
    const closeModalBtn = document.querySelector(".close-modal");
    const appointmentForm = document.getElementById("appointment-form");
    const patientSearchInput = document.getElementById("patient-search");
    const patientSearchResults = document.getElementById("patient-search-results");
    const selectedPatientDisplay = document.getElementById("selected-patient-display");
    const selectedPatientIdInput = document.getElementById("selected-patient-id");
    const serviceSelect = document.getElementById("service-select");
    const doctorSelect = document.getElementById("doctor-select");
    
    // Price Editing Elements
    const priceContainer = document.getElementById("price-container");
    const originalPriceDisplay = document.getElementById("original-price-display");
    const editPriceBtn = document.getElementById("edit-price-btn");
    const customPriceInput = document.getElementById("custom-price-input");

    // Appointment Details Modal Elements
    const detailsModal = document.getElementById("appointment-details-modal");
    const closeDetailsModalBtn = document.querySelector(".close-details-modal");
    const detailPatient = document.getElementById("detail-patient");
    const detailService = document.getElementById("detail-service");
    const detailDoctor = document.getElementById("detail-doctor");
    const detailTime = document.getElementById("detail-time");
    const detailReason = document.getElementById("detail-reason");
    const detailStatus = document.getElementById("detail-status");
    const updateStatusBtn = document.getElementById("update-status-btn");
    const deleteAppointmentBtn = document.getElementById("delete-appointment-btn");

    let currentDetailId = null; // Store ID of appointment currently being viewed
    let currentDate = new Date();
    let selectedPatient = null;
    let selectedServiceData = null; // Store full service object

    // Load Initial Data
    populateDoctorSelect();
    populateServiceSelect();
    renderCalendar(currentDate);

    // --- Calendar Navigation ---
    document.getElementById("prev-month").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    document.getElementById("next-month").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // --- Add Appointment Modal Logic ---
    if (addAppointmentBtn) {
        addAppointmentBtn.addEventListener("click", () => {
            appointmentModal.style.display = "block";
            resetForm();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            appointmentModal.style.display = "none";
        });
    }

    // --- Details Modal Logic ---
    if (closeDetailsModalBtn) {
        closeDetailsModalBtn.addEventListener("click", () => {
            detailsModal.style.display = "none";
            currentDetailId = null;
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === appointmentModal) {
            appointmentModal.style.display = "none";
        }
        if (e.target === detailsModal) {
            detailsModal.style.display = "none";
            currentDetailId = null;
        }
    });

    // --- Price Logic ---
    if (serviceSelect) {
        serviceSelect.addEventListener("change", (e) => {
            const serviceId = e.target.value;
            const services = JSON.parse(localStorage.getItem("services")) || [];
            selectedServiceData = services.find(s => s.id === serviceId);

            if (selectedServiceData) {
                priceContainer.style.display = "block";
                originalPriceDisplay.textContent = `${selectedServiceData.price} GEL`;
                customPriceInput.style.display = "none";
                customPriceInput.value = "";
                editPriceBtn.style.display = "inline-block";
            } else {
                priceContainer.style.display = "none";
            }
        });
    }

    if (editPriceBtn) {
        editPriceBtn.addEventListener("click", () => {
             customPriceInput.style.display = "inline-block";
             customPriceInput.value = selectedServiceData ? selectedServiceData.price : "";
             customPriceInput.focus();
             editPriceBtn.style.display = "none";
        });
    }

    // --- Populate Doctors ---
    function populateServiceSelect() {
        if (!serviceSelect) return;
        const services = JSON.parse(localStorage.getItem("services")) || [];
        
        serviceSelect.innerHTML = '<option value="" disabled selected>აირჩიეთ სერვისი</option>';
        
        if (services.length === 0) {
            const option = document.createElement("option");
            option.disabled = true;
            option.textContent = "სერვისები არ მოიძებნა";
            serviceSelect.appendChild(option);
            return;
        }

        services.forEach(svc => {
            const option = document.createElement("option");
            option.value = svc.id; 
            option.textContent = `${svc.name}`;
            serviceSelect.appendChild(option);
        });
    }

    function populateDoctorSelect() {
        let doctors = JSON.parse(localStorage.getItem("doctors"));
        
        // Seeding if empty (robustness)
        if (!doctors) {
            doctors = [];
        }

        doctorSelect.innerHTML = '<option value="" disabled selected>აირჩიეთ ექიმი</option>';
        
        if (doctors.length === 0) {
            const option = document.createElement("option");
            option.disabled = true;
            option.textContent = "ექიმები არ მოიძებნა";
            doctorSelect.appendChild(option);
            return;
        }

        doctors.forEach(doc => {
            const option = document.createElement("option");
            // Saving ID as value, but you could save name if your logic prefers
            // The original code saved the name/value directly. Let's save ID to be robust, 
            // but for backward compatibility with existing data structure, maybe save "Name (Specialty)"
            // Actually, let's save the ID as value and show nice text.
            // When saving appointment, we can look up the doctor name if needed, or save both.
            // The existing code saved `doctor: doctorSelect.value`.
            
            // Let's stick to saving the ID as value, but for display let's show Name + Spec
            option.value = `${doc.firstName} ${doc.lastName} (${doc.specialty})`; 
            option.textContent = `${doc.firstName} ${doc.lastName} (${doc.specialty})`;
            doctorSelect.appendChild(option);
        });
    }

    // --- Patient Search Logic ---
    if (patientSearchInput) {
        patientSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                patientSearchResults.style.display = "none";
                return;
            }

            const patients = JSON.parse(localStorage.getItem("patients")) || [];
            const filtered = patients.filter(p => 
                p.firstName.toLowerCase().includes(query) || 
                p.lastName.toLowerCase().includes(query) || 
                p.personalId.includes(query)
            );

            renderSearchResults(filtered);
        });
    }

    function renderSearchResults(patients) {
        patientSearchResults.innerHTML = "";
        if (patients.length === 0) {
            patientSearchResults.style.display = "none";
            return;
        }

        patients.forEach(p => {
            const div = document.createElement("div");
            div.className = "search-result-item";
            div.textContent = `${p.firstName} ${p.lastName} (ID: ${p.personalId})`;
            div.addEventListener("click", () => selectPatient(p));
            patientSearchResults.appendChild(div);
        });

        patientSearchResults.style.display = "block";
    }

    function selectPatient(patient) {
        selectedPatient = patient;
        selectedPatientIdInput.value = patient.personalId;
        patientSearchInput.value = "";
        patientSearchResults.style.display = "none";
        selectedPatientDisplay.innerHTML = `<strong>არჩეული პაციენტი:</strong> ${patient.firstName} ${patient.lastName} (${patient.personalId}) <span id="remove-patient" style="color:red; cursor:pointer; margin-left:10px;">✖</span>`;
        
        document.getElementById("remove-patient").addEventListener("click", () => {
            selectedPatient = null;
            selectedPatientIdInput.value = "";
            selectedPatientDisplay.innerHTML = "";
        });
    }

    // --- Create Appointment ---
    if (appointmentForm) {
        appointmentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!selectedPatientIdInput.value) {
                alert("გთხოვთ აირჩიოთ პაციენტი.");
                return;
            }
            if (!serviceSelect.value) {
                alert("გთხოვთ აირჩიოთ სერვისი.");
                return;
            }
            if (!doctorSelect.value) {
                alert("გთხოვთ აირჩიოთ ექიმი.");
                return;
            }

            const appointmentDate = document.getElementById("appointment-date").value;
            const appointmentTime = document.getElementById("appointment-time").value;
            const doctor = doctorSelect.value;
            const reason = document.getElementById("appointment-reason").value;

            // Determine final price
            let finalPrice = selectedServiceData ? selectedServiceData.price : 0;
            if (customPriceInput.style.display !== "none" && customPriceInput.value) {
                finalPrice = parseFloat(customPriceInput.value);
            }

            const newAppointment = {
                id: Date.now().toString(),
                patientId: selectedPatient.personalId,
                patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                serviceId: selectedServiceData.id,
                serviceName: selectedServiceData.name,
                serviceCode: selectedServiceData.code,
                date: appointmentDate,
                time: appointmentTime,
                doctor: doctor,
                reason: reason,
                price: finalPrice, // Save the specific price for this visit
                status: "Scheduled"
            };

            // 1. Save Appointment
            let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
            appointments.push(newAppointment);
            localStorage.setItem("appointments", JSON.stringify(appointments));

            // 2. Handle Form IV-100 Logic (Add to Patient History)
            if (selectedServiceData.formIV100) {
                let patients = JSON.parse(localStorage.getItem("patients")) || [];
                const patientIndex = patients.findIndex(p => p.personalId === selectedPatient.personalId);
                
                if (patientIndex !== -1) {
                    if (!patients[patientIndex].history) {
                        patients[patientIndex].history = [];
                    }
                    
                    patients[patientIndex].history.push({
                        date: appointmentDate,
                        serviceName: selectedServiceData.name,
                        serviceCode: selectedServiceData.code,
                        price: finalPrice,
                        doctor: doctor, // Using doctor name string here as stored in appointment
                        notes: reason
                    });
                    
                    localStorage.setItem("patients", JSON.stringify(patients));
                }
            }

            printAppointmentReceipt(newAppointment);

            appointmentModal.style.display = "none";
            renderCalendar(currentDate);
            // alert("ვიზიტი წარმატებით დაიჯავშნა!");
        });
    }

    function resetForm() {
        appointmentForm.reset();
        selectedPatient = null;
        selectedPatientDisplay.innerHTML = "";
        selectedPatientIdInput.value = "";
        patientSearchResults.style.display = "none";
        doctorSelect.selectedIndex = 0;
        if(serviceSelect) serviceSelect.selectedIndex = 0;
        
        // Reset Price UI
        priceContainer.style.display = "none";
        customPriceInput.style.display = "none";
        editPriceBtn.style.display = "inline-block";
        selectedServiceData = null;
    }

    // --- Update Status ---
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener("click", () => {
            if (!currentDetailId) return;

            const newStatus = detailStatus.value;
            let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
            const index = appointments.findIndex(a => a.id === currentDetailId);

            if (index !== -1) {
                appointments[index].status = newStatus;
                localStorage.setItem("appointments", JSON.stringify(appointments));
                renderCalendar(currentDate);
                detailsModal.style.display = "none";
                currentDetailId = null;
            }
        });
    }

    // --- Delete Appointment ---
    if (deleteAppointmentBtn) {
        deleteAppointmentBtn.addEventListener("click", () => {
            if (!currentDetailId) return;
            if(!confirm("დარწმუნებული ხართ, რომ გსურთ ვიზიტის წაშლა?")) return;

            let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
            appointments = appointments.filter(a => a.id !== currentDetailId);
            localStorage.setItem("appointments", JSON.stringify(appointments));
            
            renderCalendar(currentDate);
            detailsModal.style.display = "none";
            currentDetailId = null;
        });
    }

    // --- Calendar Rendering ---
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthNames = [
            "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
            "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
        ];

        calendarHeader.textContent = `${monthNames[month]} ${year}`;
        calendarGrid.innerHTML = "";

        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Padding days
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day empty";
            calendarGrid.appendChild(emptyCell);
        }

        // Real days
        const appointments = JSON.parse(localStorage.getItem("appointments")) || [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.className = "calendar-day";
            
            // Format date string to match input[type="date"] format (YYYY-MM-DD)
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayAppointments = appointments.filter(app => app.date === dateString);

            dayCell.innerHTML = `<div class="day-number">${day}</div>`;
            
            if (dayAppointments.length > 0) {
                const dotsContainer = document.createElement("div");
                dotsContainer.className = "appointment-dots";
                
                dayAppointments.forEach(app => {
                    const dot = document.createElement("div");
                    dot.className = `appointment-dot`;
                    
                    // Add status class
                    if (app.status === "Cancelled") dot.classList.add("status-cancelled");
                    if (app.status === "Arrived") dot.classList.add("status-arrived");

                    dot.title = `${app.time} - ${app.patientName} (${app.status})`;
                    dot.textContent = `${app.time} ${app.patientName}`;
                    
                    // Click on specific appointment to view details
                    dot.addEventListener("click", (e) => {
                        e.stopPropagation(); // Prevent opening "Add Appointment"
                        openDetailsModal(app);
                    });

                    dotsContainer.appendChild(dot);
                });
                dayCell.appendChild(dotsContainer);
            }

            // Click on day cell to add new appointment
            dayCell.addEventListener("click", () => {
                document.getElementById("appointment-date").value = dateString;
                appointmentModal.style.display = "block";
                resetForm();
                document.getElementById("appointment-date").value = dateString; 
            });

            calendarGrid.appendChild(dayCell);
        }
    }

    function openDetailsModal(appointment) {
        currentDetailId = appointment.id;
        detailPatient.textContent = appointment.patientName;
        detailService.textContent = appointment.serviceName || "N/A";
        detailDoctor.textContent = appointment.doctor;
        detailTime.textContent = `${appointment.date} | ${appointment.time}`;
        detailReason.textContent = appointment.reason || "N/A";
        detailStatus.value = appointment.status || "Scheduled";

        detailsModal.style.display = "block";
    }

    function printAppointmentReceipt(appointment) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>ვიზიტის ქვითარი</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: "DejaVu Sans", sans-serif; padding: 20px; }'); 
        printWindow.document.write('.receipt-container { border: 1px solid #ccc; padding: 20px; max-width: 400px; margin: 0 auto; text-align: left; }');
        printWindow.document.write('h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }');
        printWindow.document.write('.info-item { margin-bottom: 10px; font-size: 16px; }');
        printWindow.document.write('.label { font-weight: bold; }');
        printWindow.document.write('@media print { .no-print { display: none; } }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="receipt-container">');
        printWindow.document.write('<h2>ვიზიტის ქვითარი</h2>');
        printWindow.document.write(`<div class="info-item"><span class="label">კოდი:</span> ${appointment.id}</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">პაციენტი:</span> ${appointment.patientName}</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">სერვისი:</span> ${appointment.serviceName || "N/A"}</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">ფასი:</span> ${appointment.price} GEL</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">ექიმი:</span> ${appointment.doctor}</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">თარიღი/დრო:</span> ${appointment.date} / ${appointment.time}</div>`);
        printWindow.document.write(`<div class="info-item"><span class="label">მიზანი:</span> ${appointment.reason}</div>`);
        printWindow.document.write('<div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">გმადლობთ რომ სარგებლობთ ჩვენი კლინიკით!</div>');
        printWindow.document.write('<div class="no-print" style="text-align: center; margin-top: 20px;">');
        printWindow.document.write('<button onclick="window.print()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">ბეჭდვა</button>');
        printWindow.document.write('<button onclick="window.close()" style="padding: 10px 20px; background: #d93025; color: white; border: none; border-radius: 4px; cursor: pointer;">დახურვა</button>');
        printWindow.document.write('</div>');
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        // Removed auto-close timeout
    }
});
