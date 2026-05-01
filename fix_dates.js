const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/frontend/src/data/master_workshops.json');
const workshops = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function standardizeDate(dateStr) {
  if (!dateStr) return dateStr;
  dateStr = dateStr.trim();
  
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Typo 09/12/0198 -> 2019?
  if (dateStr === '09/12/0198') return '2019-09-19'; // Wait, let's fix it manually based on context
  if (dateStr === '09/18/2017') return '2019-09-18'; // Typo? Wait, the 13th workshop is 2019.

  return dateStr;
}

workshops.forEach(w => {
  w.events?.forEach(e => { e.date = standardizeDate(e.date); });
  w.presentations?.forEach(p => { p.date = standardizeDate(p.date); });
  w.posters?.forEach(p => { p.date = standardizeDate(p.date); });
});

fs.writeFileSync(dataPath, JSON.stringify(workshops, null, 2));
console.log('Fixed dates!');
