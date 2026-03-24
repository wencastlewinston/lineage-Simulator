// 介面控制工具
function filterData(val, btn, type) {
    if (type === 'year') {
        document.querySelectorAll('.year-tag').forEach(t => t.classList.remove('active'));
        currentYearFilter = val;
    } else {
        document.querySelectorAll('.area-tag').forEach(t => t.classList.remove('active'));
        currentAreaFilter = val;
    }
    btn.classList.add('active');
    searchTable();
}

function searchTable() { 
    const searchInput = document.getElementById("searchInput").value.toUpperCase(); 
    document.querySelectorAll(".camp-item").forEach(item => { 
        const text = item.textContent.toUpperCase();
        const matchYear = currentYearFilter === "" || text.includes(currentYearFilter);
        const matchArea = currentAreaFilter === "" || text.includes(currentAreaFilter);
        const matchSearch = searchInput === "" || text.includes(searchInput);
        item.style.display = (matchYear && matchArea && matchSearch) ? "" : "none"; 
    }); 
    updateStats(); 
}

function updateStats() {
    const visibleItems = Array.from(document.querySelectorAll('.camp-item:not(.is-upcoming)')).filter(item => item.style.display !== 'none');
    const totalEl = document.getElementById('stat-total');
    if(totalEl) {
        document.getElementById('stat-total').innerText = visibleItems.length;
        document.getElementById('stat-camps').innerText = visibleItems.filter(item => !item.querySelector('.revisit-tag')).length;
        document.getElementById('stat-visit2').innerText = visibleItems.filter(item => {
            const tag = item.querySelector('.revisit-tag');
            return tag && tag.getAttribute('data-visit') === "2";
        }).length;
        document.getElementById('stat-visit3').innerText = visibleItems.filter(item => {
            const tag = item.querySelector('.revisit-tag');
            return tag && parseInt(tag.getAttribute('data-visit')) >= 3;
        }).length;
    }
}

function toggleView() { document.body.classList.toggle("grid-mode"); }

function togglePlaylist() { 
    const content = document.getElementById('list-camping'); 
    content.style.display = (content.style.display === "none") ? "block" : "none"; 
    document.getElementById('arrow').innerText = (content.style.display === "none") ? "▲" : "▼";
}

function reverseAll() { 
    const campBody = document.getElementById('campBody'); 
    const listCamping = document.getElementById('list-camping'); 
    [campBody, listCamping].forEach(box => { 
        const items = Array.from(box.children); 
        box.innerHTML = ''; items.reverse().forEach(item => box.appendChild(item)); 
    }); 
}

window.onscroll = () => { 
    const btn = document.getElementById("goTopBtn");
    if(btn) btn.style.display = (window.scrollY > 300) ? "flex" : "none"; 
};