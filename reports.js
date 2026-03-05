document.addEventListener("DOMContentLoaded", function () {
    const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const services = JSON.parse(localStorage.getItem("services")) || [];
    const tableBody = document.getElementById("reports-table-body");
    const totalRevenueEl = document.getElementById("total-revenue");
    const totalServicesEl = document.getElementById("total-services");
    const printBtn = document.getElementById("print-report-btn");

    // 1. Calculate Stats
    let totalRevenue = 0;
    
    // Sort appointments by date descending
    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render Table
    if (tableBody) {
        tableBody.innerHTML = "";
        
        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">მონაცემები არ არის</td></tr>';
        } else {
            appointments.forEach(app => {
                let price = parseFloat(app.price);
                
                // Fallback for old data: Look up service price if appointment price is missing
                if (isNaN(price)) {
                    const svc = services.find(s => s.id === app.serviceId);
                    if (svc) {
                        price = parseFloat(svc.price) || 0;
                    } else {
                        price = 0;
                    }
                }

                totalRevenue += price;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${app.date}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${app.patientName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${app.serviceName || "N/A"}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${getDoctorName(app.doctor)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${price.toFixed(2)} GEL</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    // Update Stats Display
    if (totalRevenueEl) totalRevenueEl.innerText = `${totalRevenue.toFixed(2)} GEL`;
    if (totalServicesEl) totalServicesEl.innerText = appointments.length;

    // Print Logic
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            printReport(appointments, totalRevenue);
        });
    }

    function getDoctorName(doctorVal) {
        if (!doctorVal) return "N/A";
        
        // Check if it looks like a full string (has space and parenthesis)
        if (doctorVal.includes("(") && doctorVal.includes(")")) {
            return doctorVal;
        }

        // Try to look up by ID
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const found = doctors.find(d => d.id === doctorVal);
        if (found) {
            return `${found.firstName} ${found.lastName} (${found.specialty})`;
        }

        return doctorVal; 
    }

    function printReport(data, revenue) {
        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write('<html><head><title>სრული რეპორტი</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: "DejaVu Sans", sans-serif; padding: 40px; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
        printWindow.document.write('th { background-color: #f2f2f2; }');
        printWindow.document.write('.header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }');
        printWindow.document.write('.summary { display: flex; justify-content: space-around; margin-bottom: 30px; font-size: 18px; font-weight: bold; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<h1>Clinic Healthy - სრული ფინანსური რეპორტი</h1>');
        printWindow.document.write(`<p>თარიღი: ${new Date().toLocaleDateString()}</p>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="summary">');
        printWindow.document.write(`<div>სულ სერვისები: ${data.length}</div>`);
        printWindow.document.write(`<div>სულ შემოსავალი: ${revenue.toFixed(2)} GEL</div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<table><thead><tr><th>თარიღი</th><th>პაციენტი</th><th>სერვისი</th><th>ექიმი</th><th>ფასი</th></tr></thead><tbody>');
        
        data.forEach(item => {
             printWindow.document.write(`<tr>
                    <td>${item.date}</td>
                    <td>${item.patientName}</td>
                    <td>${item.serviceName || "N/A"}</td>
                    <td>${getDoctorName(item.doctor)}</td>
                    <td>${(parseFloat(item.price)||0).toFixed(2)} GEL</td>
                </tr>`);
        });

        printWindow.document.write('</tbody></table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
});
