// 溫家堡 v2.3 設定檔 - 地基變數
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSU8nSVvI4rNFr0HXt6UN7rLp138Af8JuBkzEuzOX8FT75hJpoNE9UecJ-w1iAzLHGXbz3uo1-vpKwu/pub?output=csv";

let currentYearFilter = "";
let currentAreaFilter = "";
let currentAlbum = [];
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
let autoPlayTimer = null;
let isAutoPlaying = false;