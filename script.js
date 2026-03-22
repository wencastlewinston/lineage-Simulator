const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSU8nSVvI4rNFr0HXt6UN7rLp138Af8JuBkzEuzOX8FT75hJpoNE9UecJ-w1iAzLHGXbz3uo1-vpKwu/pub?output=csv";
let currentYearFilter = "";
let currentAreaFilter = "";

function parseYoutube(idOrUrl) {
    if (!idOrUrl || idOrUrl.trim() === "") return null;
    const str = idOrUrl.trim();
    if (str.includes("list=")) return { id: str.split("list=")[1].split("&")[0], isList: true };
    if (str.includes("v=")) return { id: str.split("v=")[1].split("&")[0], isList: false };
    if (str.includes("youtu.be/")) return { id: str.split("youtu.be/")[1].split("?")[0], isList: false };
    return { id: str, isList: false };
}

function switchThumb(btn, vid) {
    const container = btn.closest('.col-thumb');
    const thumbImg = container.querySelector('.camp-thumb-img');
    const thumbBox = container.querySelector('.thumb-box');
    const btns = container.querySelectorAll('.id-btn');
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const yt = parseYoutube(vid);
    if (yt) {
        thumbImg.src = `https://img.youtube.com/vi/${yt.id}/mqdefault.jpg`;
        thumbBox.onclick = () => openVid(vid);
    }
}

async function fetchCampData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        const allRows = data.split(/\r?\n/).slice(1).filter(r => r.trim() !== "");
        const campBody = document.getElementById('campBody');
        const listCamping = document.getElementById('list-camping');
        const areaBar = document.getElementById('area-tool-bar');
        
        campBody.innerHTML = ""; listCamping.innerHTML = "";
        const currentTrack = {};
        const areas = new Set();
        const parsedRows = allRows.map(row => row.split(',').map(c => c ? c.trim() : ""));
        
        parsedRows.forEach((cols) => {
            if (cols.length < 4) return;
            const [cat, count, date, name, v1, v2, v3, , , altitude, location, tentCount] = cols;
            if (location) {
                const city = location.substring(0, 2);
                if (city) areas.add(city);
            }
            let seasonIcon = "";
            if (date) {
                const dateParts = date.split('.');
                if (dateParts.length >= 2) {
                    const month = parseInt(dateParts[1]);
                    if (month >= 3 && month <= 5) seasonIcon = " 🌸";
                    else if (month >= 6 && month <= 8) seasonIcon = " ☀️";
                    else if (month >= 9 && month <= 11) seasonIcon = " 🍁";
                    else seasonIcon = " ❄️";
                }
            }
            const isUpcoming = !v1 || v1.trim() === "";
            currentTrack[name] = (currentTrack[name] || 0) + 1;
            const thisVisitNum = currentTrack[name];
            let revisitHtml = "";
            if (thisVisitNum > 1) {
                const medals = "🏅".repeat(thisVisitNum);
                revisitHtml = `<div class="revisit-tag" data-visit="${thisVisitNum}">${medals} 第 ${thisVisitNum} 訪</div>`;
            }
            let altHtml = "";
            if (altitude) {
                const altV = parseInt(altitude);
                const barColor = altV > 1000 ? "var(--high)" : (altV > 500 ? "var(--mid)" : "var(--low)");
                const barWidth = Math.min((altV / 2000) * 100, 100);
                altHtml = `<div class="altitude-row"><div class="alt-bar-fill" style="width:${barWidth}%; background:${barColor}; opacity:0.3;"></div><span class="altitude-tag">⛰️ ${altitude}m</span></div>`;
            }
            let tentHtml = "";
            if (tentCount && tentCount.trim() !== "") {
                tentHtml = `<div class="tent-count-tag"><span>🏕️ 同行帳數：${tentCount} 帳</span></div>`;
            }
            const vids = [v1, v2, v3];
            const icons = ["➊", "➋", "➌"];
            let idBtnsHtml = `<div class="thumb-id-row">`;
            vids.forEach((vid, index) => {
                const hasVid = vid && vid.trim() !== "";
                idBtnsHtml += `<div class="id-btn ${hasVid ? 'has-vid' : 'no-vid'} ${index===0 && hasVid ? 'active' : ''}" ${hasVid ? `onclick="event.stopPropagation(); switchThumb(this, '${vid}')"` : ''}>${icons[index]}</div>`;
            });
            idBtnsHtml += `</div>`;
            const item = document.createElement('div');
            item.className = `camp-item fade-in ${isUpcoming ? 'is-upcoming' : ''}`;
            const yt1 = parseYoutube(v1);
            const colThumbHtml = `
                <div class="col-thumb">
                    <div class="thumb-box" ${(!isUpcoming && yt1) ? `onclick="openVid('${v1}')"` : ''}>
                        ${isUpcoming ? `<div class="upcoming-thumb"><span class="center-text">預備..</span></div>` : `<img src="https://img.youtube.com/vi/${yt1.id}/mqdefault.jpg" class="camp-thumb-img" loading="lazy">`}
                        <div class="count-badge">${count}</div>
                    </div>
                    ${isUpcoming ? '' : idBtnsHtml}
                    ${(!isUpcoming && revisitHtml) ? revisitHtml : ''}
                </div>`;
            item.innerHTML = `
                ${colThumbHtml}
                <div class="col-info">
                    <div class="camp-date">📅 ${date}${seasonIcon}</div>
                    <div class="camp-location">[${location || '未標註'}]</div>
                    <div class="camp-name-row"><span class="camp-name">${name}</span>${isUpcoming ? '<span class="status-badge">期待中</span>' : ''}</div>
                    ${altHtml}
                    ${tentHtml}
                </div>`;
            if (cat.trim() === "露營") { listCamping.appendChild(item); } else { campBody.prepend(item); }
        });
        Array.from(areas).sort().forEach(city => {
            const tag = document.createElement('div');
            tag.className = 'tag area-tag';
            tag.innerText = city;
            tag.onclick = function() { filterData(city, this, 'area'); };
            areaBar.appendChild(tag);
        });
        updateStats(); 
        setTimeout(() => { document.getElementById('loader').style.display='none'; }, 500);
    } catch (e) { console.error(e); }
}

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
    document.getElementById('stat-total').innerText = visibleItems.length;
    const v1 = visibleItems.filter(item => !item.querySelector('.revisit-tag'));
    document.getElementById('stat-camps').innerText = v1.length;
    const v2 = visibleItems.filter(item => {
        const tag = item.querySelector('.revisit-tag');
        return tag && tag.getAttribute('data-visit') === "2";
    });
    document.getElementById('stat-visit2').innerText = v2.length;
    const v3plus = visibleItems.filter(item => {
        const tag = item.querySelector('.revisit-tag');
        return tag && parseInt(tag.getAttribute('data-visit')) >= 3;
    });
    document.getElementById('stat-visit3').innerText = v3plus.length;

    // 🌸 秘書小姐姐新增：格式化時間標籤 (格式：115/3/22 13:22)
    const now = new Date();
    const twYear = now.getFullYear() - 1911;
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const timeStr = `${twYear}/${month}/${date} ${hours}:${minutes}`;
    const timerElem = document.getElementById('update-timer');
    if (timerElem) {
        timerElem.innerText = `最後同步：${timeStr}`;
    }
}

function toggleView() { document.body.classList.toggle("grid-mode"); }
function openVid(u) { const yt = parseYoutube(u); if(!yt) return; document.getElementById('popup_player').src = yt.isList ? `https://www.youtube.com/embed/videoseries?list=${yt.id}&autoplay=1` : `https://www.youtube.com/embed/${yt.id}?autoplay=1`; document.getElementById('videoOverlay').style.display = 'flex'; }
function closeVid() { document.getElementById('popup_player').src = ""; document.getElementById('videoOverlay').style.display = 'none'; }
function togglePlaylist() { 
    const content = document.getElementById('list-camping'); 
    content.style.display = content.style.display === "none" ? "block" : "none"; 
    document.getElementById('arrow').innerText = (content.style.display === "none") ? "▲" : "▼";
    updateStats();
}
function reverseAll() { const campBody = document.getElementById('campBody'); const listCamping = document.getElementById('list-camping'); [campBody, listCamping].forEach(box => { const items = Array.from(box.children); box.innerHTML = ''; items.reverse().forEach(item => box.appendChild(item)); }); }
window.onscroll = () => { document.getElementById("goTopBtn").style.display = (window.scrollY > 300) ? "flex" : "none"; };
fetchCampData();