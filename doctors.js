document.addEventListener("DOMContentLoaded", function () {
    const doctorsListContainer = document.getElementById("doctors-list-container");
    const addDoctorBtn = document.getElementById("add-doctor-btn");
    const doctorModal = document.getElementById("doctor-modal");
    const closeDoctorModalBtn = document.querySelector(".close-modal");
    const doctorForm = document.getElementById("doctor-form");
    const searchInput = document.getElementById("search-doctor");

    // --- Role Check ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Seed Data if needed
    seedDoctors();
    renderDoctors();

    // --- Signature Canvas Logic ---
    const canvas = document.getElementById("signature-pad");
    const clearBtn = document.getElementById("clear-signature");
    let ctx = null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    if (canvas) {
        ctx = canvas.getContext("2d");
        
        // Drawing functions
        function draw(e) {
            if (!isDrawing) return;
            
            // Get position relative to canvas
            const rect = canvas.getBoundingClientRect();
            let x, y;
            
            if (e.type.includes('touch')) {
                x = e.touches[0].clientX - rect.left;
                y = e.touches[0].clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.stroke();
            
            [lastX, lastY] = [x, y];
        }

        canvas.addEventListener("mousedown", (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });

        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", () => isDrawing = false);
        canvas.addEventListener("mouseout", () => isDrawing = false);
        
        // Touch support
        canvas.addEventListener("touchstart", (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.touches[0].clientX - rect.left;
            lastY = e.touches[0].clientY - rect.top;
            e.preventDefault(); // Prevent scrolling
        });
        canvas.addEventListener("touchmove", (e) => {
            draw(e);
            e.preventDefault();
        });
        canvas.addEventListener("touchend", () => isDrawing = false);

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }
    }

    function loadSignature(dataUrl) {
        if (!ctx || !dataUrl) {
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    // --- Modal Logic ---
    if (addDoctorBtn) {
        if (!isAdmin) {
            addDoctorBtn.style.display = 'none';
        } else {
            addDoctorBtn.addEventListener("click", () => {
                document.querySelector("#doctor-modal h2").textContent = "ექიმის დამატება";
                document.querySelector("#doctor-form .submit-btn").textContent = "შენახვა";
                document.getElementById("doctor-edit-id").value = "";
                doctorForm.reset();
                if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear signature
                doctorModal.style.display = "block";
                document.body.style.overflow = "hidden";
            });
        }
    }

    if (closeDoctorModalBtn) {
        closeDoctorModalBtn.addEventListener("click", () => {
            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === doctorModal) {
            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // --- Form Submission ---
    if (doctorForm && isAdmin) {
        doctorForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const editId = document.getElementById("doctor-edit-id").value;
            // Get Signature Data
            const signatureData = canvas ? canvas.toDataURL() : null;

            const newDoctor = {
                firstName: document.getElementById("docFirstName").value,
                lastName: document.getElementById("docLastName").value,
                role: document.getElementById("docRole").value,
                id: document.getElementById("docId").value,
                specialty: document.getElementById("docSpecialty").value,
                phone: document.getElementById("docPhone").value,
                email: document.getElementById("docEmail").value,
                username: document.getElementById("docUsername").value,
                password: document.getElementById("docPassword").value,
                signature: signatureData, // Save signature
                createdAt: editId ? undefined : new Date().toISOString()
            };

            let doctors = JSON.parse(localStorage.getItem("doctors")) || [];

            if (editId) {
                // Edit Mode
                if (editId !== newDoctor.id && doctors.some(d => d.id === newDoctor.id)) {
                    alert("ექიმი ამ ID-ით უკვე არსებობს.");
                    return;
                }

                const index = doctors.findIndex(d => d.id === editId);
                if (index !== -1) {
                    newDoctor.createdAt = doctors[index].createdAt;
                    doctors[index] = newDoctor;
                    localStorage.setItem("doctors", JSON.stringify(doctors));
                    alert("ექიმის მონაცემები განახლდა!");
                }
            } else {
                // Add Mode
                if (doctors.some(d => d.id === newDoctor.id)) {
                    alert("ექიმი ამ ID-ით უკვე არსებობს.");
                    return;
                }
                // Check if username exists
                if (doctors.some(d => d.username === newDoctor.username)) {
                     alert("ექიმი ამ მომხმარებლის სახელით უკვე არსებობს.");
                     return;
                }

                doctors.push(newDoctor);
                localStorage.setItem("doctors", JSON.stringify(doctors));
                alert("ექიმი წარმატებით დაემატა! ახლა მას შეუძლია ავტორიზაცია.");
            }

            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
            renderDoctors();
        });
    }

    // --- Search ---
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderDoctors(e.target.value);
        });
    }

    // --- Delete Global Function ---
    window.deleteDoctor = function(id) {
        if (!isAdmin) return;
        if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ ექიმის წაშლა?")) {
            let doctors = JSON.parse(localStorage.getItem("doctors")) || [];
            doctors = doctors.filter(d => d.id !== id);
            localStorage.setItem("doctors", JSON.stringify(doctors));
            renderDoctors(searchInput ? searchInput.value : "");
        }
    }

    // --- Edit Global Helper ---
    window.openEditDoctorModal = function(id) {
        if (!isAdmin) return;
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const doctor = doctors.find(d => d.id === id);
        
        if (doctor) {
            document.querySelector("#doctor-modal h2").textContent = "ექიმის რედაქტირება";
            document.querySelector("#doctor-form .submit-btn").textContent = "განახლება";
            document.getElementById("doctor-edit-id").value = doctor.id;

            if(document.getElementById("docRole")) document.getElementById("docRole").value = doctor.role || "doctor";
            document.getElementById("docFirstName").value = doctor.firstName;
            document.getElementById("docLastName").value = doctor.lastName;
            document.getElementById("docId").value = doctor.id;
            document.getElementById("docSpecialty").value = doctor.specialty;
            document.getElementById("docPhone").value = doctor.phone || "";
            document.getElementById("docEmail").value = doctor.email || "";
            document.getElementById("docUsername").value = doctor.username || "";
            document.getElementById("docPassword").value = doctor.password || "";
            
            // Load signature
            loadSignature(doctor.signature);

            doctorModal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    }

    // --- Details Global Helper ---
    window.showDoctorDetails = function(id) {
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const doctor = doctors.find(d => d.id === id);
        if(!doctor) return;
        
        let content = `
            <div style="line-height: 1.6;">
                <p><strong>სახელი გვარი:</strong> ${doctor.firstName} ${doctor.lastName}</p>
                <p><strong>ID:</strong> ${doctor.id}</p>
                <p><strong>სპეციალობა:</strong> ${doctor.specialty}</p>
                <p><strong>ტელეფონი:</strong> ${doctor.phone || "N/A"}</p>
                <p><strong>ელ-ფოსტა:</strong> ${doctor.email || "N/A"}</p>
            </div>
        `;
        
        if (isAdmin) {
            content += `
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                    <p><strong>მომხმარებელი:</strong> ${doctor.username || "N/A"}</p>
                    <p><strong>პაროლი:</strong> ${doctor.password || "N/A"}</p>
                </div>
            `;
        }
        
        // Use generic modal if available (defined in dashboard.js)
        if (window.showCustomModal) {
            window.showCustomModal("ექიმის დეტალები", content);
        } else {
            alert("დეტალები:\n" + content.replace(/<[^>]*>?/gm, ' '));
        }
    }

    function renderDoctors(searchTerm = "") {
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        doctorsListContainer.innerHTML = "";

        if (doctors.length === 0) {
            doctorsListContainer.innerHTML = '<div class="no-data">ექიმები არ მოიძებნა.</div>';
            return;
        }

        const filtered = doctors.filter(d => 
            d.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.includes(searchTerm) ||
            d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            doctorsListContainer.innerHTML = '<div class="no-data">შესაბამისი ექიმები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(d => {
            const card = document.createElement("div");
            card.className = "patient-card"; // Reusing patient card style
            
            let buttonsHtml = '';
            if (isAdmin) {
                buttonsHtml = `
                    <button class="details-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">დეტალები</button>
                    <button class="edit-btn" style="flex: 1; background-color: #ff9800; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">რედაქტირება</button>
                    <button class="delete-btn" style="flex: 1; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">წაშლა</button>
                `;
            } else {
                buttonsHtml = `
                    <button class="details-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">დეტალები</button>
                `;
            }

            card.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar" style="background-color: #e3f2fd; color: #1976d2;">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="patient-info-main">
                        <h3>${d.firstName} ${d.lastName}</h3>
                        <span class="patient-id">ID: ${d.id} <small>(${d.role === 'admin' ? 'ადმინი' : 'ექიმი'})</small></span>
                    </div>
                    <div class="patient-status" style="background-color: #1a73e8;">${d.specialty}</div>
                </div>
                <div class="patient-body">
                    <p><strong>ტელეფონი:</strong> ${d.phone || "N/A"}</p>
                    <p><strong>ელ-ფოსტა:</strong> ${d.email || "N/A"}</p>
                </div>
                <div class="patient-footer" style="display: flex; gap: 10px;">
                    ${buttonsHtml}
                </div>
            `;
            
            // Attach Event Listeners
            const detailsBtn = card.querySelector(".details-btn");
            if(detailsBtn) detailsBtn.addEventListener("click", () => showDoctorDetails(d.id));

            if (isAdmin) {
                const editBtn = card.querySelector(".edit-btn");
                if(editBtn) editBtn.addEventListener("click", () => openEditDoctorModal(d.id));

                const deleteBtn = card.querySelector(".delete-btn");
                if(deleteBtn) deleteBtn.addEventListener("click", () => deleteDoctor(d.id));
            }

            doctorsListContainer.appendChild(card);
        });
    }

    function seedDoctors() {
        if (!localStorage.getItem("doctors")) {
            localStorage.setItem("doctors", JSON.stringify([]));
        }
    }
});
