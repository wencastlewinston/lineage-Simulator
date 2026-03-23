const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSU8nSVvI4rNFr0HXt6UN7rLp138Af8JuBkzEuzOX8FT75hJpoNE9UecJ-w1iAzLHGXbz3uo1-vpKwu/pub?output=csv";
let currentYearFilter = "";
let currentAreaFilter = "";
let currentAlbum = [];
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

let autoPlayTimer = null;
let isAutoPlaying = false;

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

function openAlbum(linksText) {
    if (!linksText || linksText.trim() === "" || linksText === "undefined") return;
    currentAlbum = linksText.replace(/"/g, '').split(/[\s,]+/).filter(link => link.startsWith('http'));
    if (currentAlbum.length === 0) return;
    currentIndex = 0;
    renderPhoto();
    document.getElementById('albumOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderPhoto() {
    const mainPhoto = document.getElementById('mainPhoto');
    const strip = document.getElementById('filmstrip');
    mainPhoto.style.opacity = '0.5';
    mainPhoto.src = currentAlbum[currentIndex];
    mainPhoto.onload = () => { mainPhoto.style.opacity = '1'; };
    strip.innerHTML = "";
    currentAlbum.forEach((link, index) => {
        const img = document.createElement('img');
        img.src = link.includes('iili.io') ? link.replace(/\.(jpg|png|jpeg)$/i, '.md.$1') : link; 
        img.className = `strip-thumb ${index === currentIndex ? 'active' : ''}`;
        img.onclick = (e) => { 
            e.stopPropagation(); 
            stopAutoPlay(); 
            currentIndex = index; 
            renderPhoto(); 
        };
        strip.appendChild(img);
    });
    const activeThumb = strip.querySelector('.active');
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

function toggleAutoPlay() {
    if (isAutoPlaying) stopAutoPlay();
    else startAutoPlay();
}

function startAutoPlay() {
    if (currentAlbum.length <= 1) return;
    isAutoPlaying = true;
    const btn = document.getElementById('autoPlayBtn');
    if (btn) { btn.innerText = "⏸️"; btn.classList.add('playing'); }
    autoPlayTimer = setInterval(() => {
        currentIndex = (currentIndex < currentAlbum.length - 1) ? currentIndex + 1 : 0;
        renderPhoto();
    }, 3000);
}

function stopAutoPlay() {
    isAutoPlaying = false;
    const btn = document.getElementById('autoPlayBtn');
    if (btn) { btn.innerText = "▶️"; btn.classList.remove('playing'); }
    if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
}

const albumOverlay = document.getElementById('albumOverlay');
if (albumOverlay) {
    albumOverlay.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, false);
    albumOverlay.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, false);
}

function handleSwipe() {
    if (Math.abs(touchEndX - touchStartX) > 50) {
        stopAutoPlay();
        if (touchEndX < touchStartX) {
            if (currentIndex < currentAlbum.length - 1) { currentIndex++; renderPhoto(); }
        } else {
            if (currentIndex > 0) { currentIndex--; renderPhoto(); }
        }
    }
}

function closeAlbum() { 
    stopAutoPlay();
    document.getElementById('albumOverlay').style.display = 'none'; 
    document.body.style.overflow = 'auto';
}

async function fetchCampData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        const rows = [];
        let currentRow = "";
        let insideQuotes = false;
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            if (char === '"') insideQuotes = !insideQuotes;
            if (char === '\n' && !insideQuotes) { rows.push(currentRow); currentRow = ""; }
            else { currentRow += char; }
        }
        if (currentRow) rows.push(currentRow);

        const campBody = document.getElementById('campBody');
        const listCamping = document.getElementById('list-camping');
        const areaBar = document.getElementById('area-tool-bar');
        campBody.innerHTML = ""; listCamping.innerHTML = "";
        const currentTrack = {};
        const areas = new Set();

        rows.slice(1).forEach((row) => {
            const cols = [];
            let currCol = "";
            let inQ = false;
            for (let i = 0; i < row.length; i++) {
                const c = row[i];
                if (c === '"') inQ = !inQ;
                else if (c === ',' && !inQ) { cols.push(currCol.trim()); currCol = ""; }
                else currCol += c;
            }
            cols.push(currCol.trim());
            if (cols.length < 4) return;

            const [cat, count, date, name, v1, v2, v3, , , altitude, location, tentCount, weather, photoLinks] = cols;
            if (location) { const city = location.substring(0, 2); if (city) areas.add(city); }
            
            // 🌸 溫家堡 V2.0 季節小圖修正：春天🌸、夏天🌻、秋天🍁、冬天❄️
            let seasonIcon = "";
            if (date) {
                const dateParts = date.split('.');
                if (dateParts.length >= 2) {
                    const month = parseInt(dateParts[1]);
                    if (month >= 3 && month <= 5) seasonIcon = " 🌸";
                    else if (month >= 6 && month <= 8) seasonIcon = " 🌻"; // 夏天改為向日葵
                    else if (month >= 9 && month <= 11) seasonIcon = " 🍁";
                    else seasonIcon = " ❄️";
                }
            }

            // 🌸 溫家堡 V2.0 天氣小圖修正：晴天☀️、多雲☁️、雨天🌧️、雷雨⛈️
            let weatherIcon = "";
            if (weather) {
                const w = weather.trim();
                if (w === "1") weatherIcon = " ☀️"; // 晴天維持太陽
                else if (w === "2") weatherIcon = " ☁️";
                else if (w === "3") weatherIcon = " 🌧️";
                else if (w === "4") weatherIcon = " ⛈️";
                else if (w !== "") weatherIcon = ` ${w}`;
            }

            const isUpcoming = !v1 || v1.trim() === "";
            currentTrack[name] = (currentTrack[name] || 0) + 1;
            const thisVisitNum = currentTrack[name];
            let revisitHtml = (thisVisitNum > 1) ? `<div class="revisit-tag" data-visit="${thisVisitNum}">${"🏅".repeat(thisVisitNum)} 第 ${thisVisitNum} 訪</div>` : "";
            
            let altHtml = "";
            if (altitude) {
                const altV = parseInt(altitude);
                const barColor = altV > 1000 ? "var(--high)" : (altV > 500 ? "var(--mid)" : "var(--low)");
                const barWidth = Math.min((altV / 2000) * 100, 100);
                altHtml = `<div class="altitude-row"><div class="alt-bar-fill" style="width:${barWidth}%; background:${barColor}; opacity:0.3;"></div><span class="altitude-tag">⛰️ ${altitude}m</span></div>`;
            }
            let tentHtml = (tentCount && tentCount.trim() !== "") ? `<div class="tent-count-tag"><span>🏕️ 同行帳數：${tentCount} 帳</span></div>` : "";

            let idBtnsHtml = `<div class="thumb-id-row">`;
            [v1, v2, v3].forEach((vid, index) => {
                if (vid && vid.trim() !== "") {
                    idBtnsHtml += `<div class="id-btn red-mode ${index===0 ? 'active' : ''}" onclick="event.stopPropagation(); switchThumb(this, '${vid}')">${index+1}</div>`;
                }
            });
            if (photoLinks && photoLinks.includes("http")) {
                idBtnsHtml += `<span class="album-icon-btn" onclick="event.stopPropagation(); openAlbum(\`${photoLinks.replace(/\n/g, ' ')}\`)">📸</span>`;
            }
            idBtnsHtml += `</div>`;

            const item = document.createElement('div');
            item.className = `camp-item fade-in ${isUpcoming ? 'is-upcoming' : ''}`;
            const yt1 = parseYoutube(v1);
            item.innerHTML = `
                <div class="col-thumb">
                    <div class="thumb-box" ${(!isUpcoming && yt1) ? `onclick="openVid('${v1}')"` : ''}>
                        ${isUpcoming ? `<div class="upcoming-thumb"><span class="center-text">預備..</span></div>` : `<img src="https://img.youtube.com/vi/${yt1.id}/mqdefault.jpg" class="camp-thumb-img" loading="lazy">`}
                        <div class="count-badge">${count}</div>
                    </div>
                    ${isUpcoming ? '' : idBtnsHtml}${(!isUpcoming && revisitHtml) ? revisitHtml : ''}
                </div>
                <div class="col-info">
                    <div class="camp-date">📅 ${date}${seasonIcon}${weatherIcon}</div>
                    <div class="camp-location">[${location || '未標註'}]</div>
                    <div class="camp-name-row"><span class="camp-name">${name}</span>${isUpcoming ? '<span class="status-badge">期待中</span>' : ''}</div>
                    ${altHtml}${tentHtml}
                </div>`;
            if (cat.trim() === "露營") listCamping.appendChild(item); else campBody.prepend(item);
        });

        areaBar.innerHTML = '<div class="tag active area-tag" onclick="filterData(\'\', this, \'area\')">所有地區</div>';
        Array.from(areas).sort().forEach(city => {
            const tag = document.createElement('div');
            tag.className = 'tag area-tag'; tag.innerText = city;
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
    document.getElementById('stat-camps').innerText = visibleItems.filter(item => !item.querySelector('.revisit-tag')).length;
    document.getElementById('stat-visit2').innerText = visibleItems.filter(item => {
        const tag = item.querySelector('.revisit-tag');
        return tag && tag.getAttribute('data-visit') === "2";
    }).length;
    document.getElementById('stat-visit3').innerText = visibleItems.filter(item => {
        const tag = item.querySelector('.revisit-tag');
        return tag && parseInt(tag.getAttribute('data-visit')) >= 3;
    }).length;

    const now = new Date();
    const timerElem = document.getElementById('update-timer');
    if (timerElem) timerElem.innerText = `更新時間：${now.getFullYear()-1911}/${now.getMonth()+1}/${now.getDate()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
}

function toggleView() { document.body.classList.toggle("grid-mode"); }
function openVid(u) { const yt = parseYoutube(u); if(!yt) return; document.getElementById('popup_player').src = yt.isList ? `https://www.youtube.com/embed/videoseries?list=${yt.id}&autoplay=1` : `https://www.youtube.com/embed/${yt.id}?autoplay=1`; document.getElementById('videoOverlay').style.display = 'flex'; }
function closeVid() { document.getElementById('popup_player').src = ""; document.getElementById('videoOverlay').style.display = 'none'; }
function togglePlaylist() { 
    const content = document.getElementById('list-camping'); 
    content.style.display = (content.style.display === "none") ? "block" : "none"; 
    document.getElementById('arrow').innerText = (content.style.display === "none") ? "▲" : "▼";
}
function reverseAll() { const campBody = document.getElementById('campBody'); const listCamping = document.getElementById('list-camping'); [campBody, listCamping].forEach(box => { const items = Array.from(box.children); box.innerHTML = ''; items.reverse().forEach(item => box.appendChild(item)); }); }
window.onscroll = () => { document.getElementById("goTopBtn").style.display = (window.scrollY > 300) ? "flex" : "none"; };
fetchCampData();