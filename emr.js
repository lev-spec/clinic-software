document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("emr-search");
    const searchBtn = document.getElementById("emr-search-btn");
    const resultsContainer = document.getElementById("emr-results");

    function renderPatients(searchTerm = "") {
        const patients = JSON.parse(localStorage.getItem("patients")) || [];
        resultsContainer.innerHTML = "";

        if (patients.length === 0) {
            resultsContainer.innerHTML = '<div class="no-data">პაციენტები არ მოიძებნა.</div>';
            return;
        }

        const filtered = patients.filter(p => 
            p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.personalId.includes(searchTerm)
        );

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="no-data">შესაბამისი პაციენტები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement("div");
            card.className = "patient-emr-card";
            card.style.flexDirection = "column";
            card.style.alignItems = "stretch";

            let historyHtml = '';
            const history = p.history || [];
            if (history.length === 0) {
                historyHtml = '<p>ჩანაწერები არ მოიძებნა.</p>';
            } else {
                historyHtml = `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: #f5f5f5; text-align: left;">
                            <th style="padding: 8px; border: 1px solid #ddd;">თარიღი</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">დიაგნოზი / სერვისი</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">ექიმი</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(item => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.date}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.serviceName}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.doctor || "N/A"}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div>
                        <h3 style="margin: 0;">${p.firstName} ${p.lastName}</h3>
                        <div style="color: #666; font-size: 0.9em; margin-top: 5px;">პირადი ნომერი: ${p.personalId} | ტელ: ${p.phone || "N/A"}</div>
                    </div>
                    <button class="toggle-emr-btn" style="padding: 8px 15px; background: #607d8b; color: white; border: none; border-radius: 4px; cursor: pointer;">EMR ნახვა</button>
                </div>
                <div class="emr-details">
                    <h4>ანამნეზი და დიაგნოზები</h4>
                    <p><strong>მიმდინარე დიაგნოზი:</strong> ${p.diagnosis || "N/A"}</p>
                    <p><strong>ალერგიები:</strong> ${p.allergies || "არა"}</p>
                    
                    <h4 style="margin-top: 15px;">ვიზიტების ისტორია</h4>
                    ${historyHtml}
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; border: 1px solid #eee;">
                        <h4>ახალი ჩანაწერის დამატება</h4>
                        <textarea class="new-record-text" placeholder="ექიმის ჩანაწერი / დანიშნულება..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; margin-top: 10px; height: 80px;"></textarea>
                        <button class="add-record-btn" style="padding: 8px 15px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">ჩანაწერის დამატება</button>
                    </div>
                </div>
            `;

            const toggleBtn = card.querySelector(".toggle-emr-btn");
            const detailsDiv = card.querySelector(".emr-details");
            
            toggleBtn.addEventListener("click", () => {
                if (detailsDiv.style.display === "block") {
                    detailsDiv.style.display = "none";
                    toggleBtn.textContent = "EMR ნახვა";
                } else {
                    detailsDiv.style.display = "block";
                    toggleBtn.textContent = "დამალვა";
                }
            });

            const addRecordBtn = card.querySelector(".add-record-btn");
            const newRecordText = card.querySelector(".new-record-text");
            addRecordBtn.addEventListener("click", () => {
                const text = newRecordText.value.trim();
                if (!text) {
                    alert("ჩანაწერი ცარიელია!");
                    return;
                }
                
                const currentUser = JSON.parse(localStorage.getItem("currentUser"));
                const doctorName = currentUser ? `\${currentUser.firstName} \${currentUser.lastName}` : "უცნობი ექიმი";

                const newRecord = {
                    date: new Date().toISOString().split('T')[0],
                    serviceName: "EMR ჩანაწერი: " + text,
                    serviceCode: "-",
                    price: 0,
                    doctor: doctorName
                };

                let allPatients = JSON.parse(localStorage.getItem("patients")) || [];
                const pIndex = allPatients.findIndex(pat => pat.personalId === p.personalId);
                if (pIndex !== -1) {
                    if (!allPatients[pIndex].history) allPatients[pIndex].history = [];
                    allPatients[pIndex].history.push(newRecord);
                    localStorage.setItem("patients", JSON.stringify(allPatients));
                    alert("ჩანაწერი დაემატა!");
                    renderPatients(searchInput.value);
                }
            });

            resultsContainer.appendChild(card);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            renderPatients(searchInput.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                renderPatients(searchInput.value);
            }
        });
        
        searchInput.addEventListener("input", () => {
            if (searchInput.value === "") {
                 resultsContainer.innerHTML = `
                    <div style="text-align: center; color: #999; padding: 40px;">
                        <i class="fa-solid fa-notes-medical" style="font-size: 48px; margin-bottom: 10px;"></i>
                        <h3>აირჩიეთ პაციენტი ისტორიის სანახავად</h3>
                    </div>`;
            } else {
                renderPatients(searchInput.value);
            }
        });
    }
});