// main.js - 溫家堡 v2.3 啟動大腦 (無啟動畫面版)
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
            
            let seasonIcon = "";
            if (date) {
                const month = parseInt(date.split('.')[1]);
                if (month >= 3 && month <= 5) seasonIcon = " 🌸";
                else if (month >= 6 && month <= 8) seasonIcon = " ☀️";
                else if (month >= 9 && month <= 11) seasonIcon = " 🍁";
                else seasonIcon = " ❄️";
            }

            let weatherIcon = "";
            if (weather) {
                const w = weather.trim();
                if (w === "1") weatherIcon = " ☀️";
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
                    let iconClass = index === 0 ? 'fa-play' : 'fa-stop';
                    idBtnsHtml += `<div class="id-btn red-mode ${index===0 ? 'active' : ''}" onclick="event.stopPropagation(); if(window.switchThumb) switchThumb(this, '${vid}')"><i class="fas ${iconClass}"></i></div>`;
                }
            });
            if (photoLinks && photoLinks.includes("http")) {
                idBtnsHtml += `<span class="album-icon-btn" onclick="event.stopPropagation(); if(window.openAlbum) openAlbum(\`${photoLinks.replace(/\n/g, ' ')}\`)">📸</span>`;
            }
            idBtnsHtml += `</div>`;

            const item = document.createElement('div');
            item.className = `camp-item fade-in ${isUpcoming ? 'is-upcoming' : ''}`;
            const yt1 = (window.parseYoutube) ? parseYoutube(v1) : null;
            
            item.innerHTML = `
                <div class="col-thumb">
                    <div class="thumb-box" ${(!isUpcoming && yt1) ? `onclick="openVid('${v1}')"` : ''}>
                        ${isUpcoming ? `<div class="upcoming-thumb"><span class="center-text">預備..</span></div>` : `<img src="https://img.youtube.com/vi/${yt1 ? yt1.id : ''}/mqdefault.jpg" class="camp-thumb-img" loading="lazy">`}
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
        
        if(window.updateStats) updateStats();

    } catch (e) { 
        console.error("載入失敗：", e);
    }
}

fetchCampData();