const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkSucZrtLhXgqIqCb1U1UzIy-aKNyWLQvxCaHas1qLm1RXM9GI3fSnrFcSXPKwjohy/exec?type=json";

let allData = [];

window.onload = function() {
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('printDate').innerText = new Date().toLocaleDateString();
    generateKhmerDate();
    fetchData();
};

async function fetchData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        allData = data;
        document.getElementById('loader').classList.add('hidden');
        populateClassFilter();
        filterData();
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('loader').classList.add('hidden');
        alert("មិនអាចទាញទិន្នន័យបានទេ!");
    }
}

function generateKhmerDate() {
    const days = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const khnum = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
    const d = new Date();
    const day = d.getDate().toString().split('').map(n => khnum[n]).join('');
    const year = d.getFullYear().toString().split('').map(n => khnum[n]).join('');
    document.getElementById('khmerDateDisplay').innerText = `ថ្ងៃ${days[d.getDay()]} ទី${day} ខែ${months[d.getMonth()]} ឆ្នាំ${year}`;
}

function populateClassFilter() {
    const classes = [...new Set(allData.map(row => row[3]))].sort();
    const select = document.getElementById('classFilter');
    classes.forEach(c => {
        if(c) {
            let opt = new Option(c, c);
            select.add(opt);
        }
    });
}

function parseMoney(str) {
    if(!str) return 0;
    return parseFloat(str.toString().replace(/[^0-9.-]+/g,"")) || 0;
}

function filterData() {
    const selectedClass = document.getElementById('classFilter').value;
    const tbody = document.getElementById('tableBodyDesktop');
    const mobileContainer = document.getElementById('mobileCardsContainer');
    
    tbody.innerHTML = "";
    mobileContainer.innerHTML = "";

    const filtered = selectedClass === "All" ? allData : allData.filter(row => row[3] === selectedClass);
    document.getElementById('printClassSelected').innerText = selectedClass;

    updateStats(filtered);

    filtered.forEach(row => {
        const id = row[0];
        const name = row[1];
        const gender = row[2];
        const className = row[3];
        const fee = row[4];
        const paidAmt = row[6]; // Column G = Index 6

        const feeVal = parseMoney(fee);
        const paidVal = parseMoney(paidAmt);
        const balVal = feeVal - paidVal;
        
        const balance = balVal <= 0 ? "0 KHR" : balVal.toLocaleString() + " KHR";

        let badge = "";
        let borderClass = "";

        if (paidVal >= feeVal && feeVal > 0) {
            badge = `<span class="badge-paid px-2 py-0.5 rounded text-[10px] font-bold">PAID</span>`;
            borderClass = "border-green-500";
        } else if (paidVal > 0) {
            badge = `<span class="badge-partial px-2 py-0.5 rounded text-[10px] font-bold">PARTIAL</span>`;
            borderClass = "border-yellow-500";
        } else {
            badge = `<span class="badge-unpaid px-2 py-0.5 rounded text-[10px] font-bold">UNPAID</span>`;
            borderClass = "border-red-500";
        }

        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-medium">${id}</td>
                <td class="p-3">${name}</td>
                <td class="p-3">${gender}</td>
                <td class="p-3">${className}</td>
                <td class="p-3 text-right">${fee}</td>
                <td class="p-3 text-right text-blue-600 font-semibold">${paidAmt}</td>
                <td class="p-3 text-right text-red-500 font-semibold">${balance}</td>
                <td class="p-3 text-center">${badge}</td>
            </tr>`;

        mobileContainer.innerHTML += `
            <div class="mobile-card ${borderClass} bg-white shadow-sm mb-3 p-4 rounded-lg border-l-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="font-bold text-gray-800">${name}</div>
                        <div class="text-xs text-gray-500">${id} • ${className}</div>
                    </div>
                    ${badge}
                </div>
                <div class="flex justify-between text-xs mt-2">
                    <span>Paid: <b class="text-blue-600">${paidAmt}</b></span> 
                    <span>Due: <b class="text-red-600">${balance}</b></span>
                </div>
            </div>`;
    });
}

function updateStats(data) {
    const total = data.length;
    const female = data.filter(r => r[2] === 'Female').length;
    let paid = 0, partial = 0, unpaid = 0, sumFee = 0, sumPaid = 0, sumBal = 0;

    data.forEach(row => {
        const feeVal = parseMoney(row[4]);
        const paidVal = parseMoney(row[6]); // Column G = Index 6
        const balVal = feeVal - paidVal;

        sumFee += feeVal;
        sumPaid += paidVal;
        sumBal += (balVal > 0 ? balVal : 0);

        if (paidVal >= feeVal && feeVal > 0) paid++;
        else if (paidVal > 0) partial++;
        else unpaid++;
    });

    const updateLabel = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    };

    updateLabel('totalStudents', total);
    updateLabel('totalFemale', female);
    updateLabel('totalPaid', paid);
    updateLabel('totalPartial', partial);
    updateLabel('totalUnpaid', unpaid);

    updateLabel('pTotalStudents', total);
    updateLabel('pTotalFemale', female);
    updateLabel('pTotalPaid', paid);
    updateLabel('pTotalPartial', partial);
    updateLabel('pTotalUnpaid', unpaid);
    updateLabel('pTotalFee', sumFee.toLocaleString() + " KHR");
    updateLabel('pTotalCollected', sumPaid.toLocaleString() + " KHR");
    updateLabel('pTotalBalance', sumBal.toLocaleString() + " KHR");
}
