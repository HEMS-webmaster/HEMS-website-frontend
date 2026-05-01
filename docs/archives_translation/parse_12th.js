const fs = require('fs');
const path = require('path');

const programText = fs.readFileSync(path.join(__dirname, 'raw_text', '2018.txt'), 'utf-8');
const dataPath = path.join(__dirname, '../../src/frontend/src/data/master_workshops.json');
const workshops = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Build 12th Workshop object
const ws12 = {
  number: 12,
  year: 2018,
  dates: "October 16-18, 2018",
  city: "Cologne, Germany",
  venue: "Maritim Hotel",
  address: "Heumarkt",
  venue_url: "",
  program_url: "https://www.hems-workshop.org/12thWS_EUROHEMS/12thProgram.html",
  program_file: "12th_Program.pdf",
  presentations: [],
  sponsors: [],
  student_awards: [],
  posters: [],
  events: []
};

// Parse events from the markdown
const lines = programText.split('\n').map(l => l.trim()).filter(l => l);

let currentGroup = null;
let currentSession = null;

const timeRegex = /^(\d{1,2}:\d{2}\s*[aApP]\.?[mM]\.?)/i;
const dateRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*(\d{1,2}\/\d{1,2})/i;
const sessionRegex = /(Technical\s*Session\s*[IVX]+)/i;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (dateRegex.test(line)) {
    const match = line.match(dateRegex);
    const dateTitle = line.replace(dateRegex, '').trim().replace(/^\|/, '').trim() || "Workshop Day";
    currentGroup = {
      date: `2018-${match[2].split('/')[0].padStart(2, '0')}-${match[2].split('/')[1].padStart(2, '0')}`,
      title: dateTitle,
      events: []
    };
    ws12.events.push(currentGroup);
    currentSession = null;
    continue;
  }

  if (sessionRegex.test(line)) {
    const match = line.match(sessionRegex);
    currentSession = match[1];
    continue;
  }

  if (timeRegex.test(line)) {
    const match = line.match(timeRegex);
    const time = match[1];
    let restOfLine = line.replace(time, '').trim().replace(/^\|/, '').trim();
    
    // Check if it's a presentation (has quotes)
    if (restOfLine.startsWith('"')) {
      const titleEndIdx = restOfLine.lastIndexOf('"');
      if (titleEndIdx > 0) {
        const title = restOfLine.substring(1, titleEndIdx);
        let remainder = restOfLine.substring(titleEndIdx + 1).trim();
        // remove "Abstract" from the end if present
        if (remainder.endsWith("Abstract")) {
            remainder = remainder.substring(0, remainder.length - 8).trim();
        }
        
        ws12.presentations.push({
          title,
          name: remainder.split(',')[0], // Approximation
          affiliation: remainder,
          session: currentSession || "General",
          date: currentGroup ? currentGroup.date : "",
          time: time,
          url: "",
          abstract_url: ""
        });
        continue;
      }
    }

    // Regular event
    if (currentGroup) {
      currentGroup.events.push({
        time: time,
        title: restOfLine,
        subtitle: "",
        location: "",
        location_url: ""
      });
    }
  }
}

// Replace or append
const existingIdx = workshops.findIndex(w => w.number === 12);
if (existingIdx !== -1) {
  workshops[existingIdx] = ws12;
} else {
  // Try to insert in order
  const idx = workshops.findIndex(w => w.number > 12);
  if (idx !== -1) {
    workshops.splice(idx, 0, ws12);
  } else {
    workshops.push(ws12);
  }
}

fs.writeFileSync(dataPath, JSON.stringify(workshops, null, 2));
console.log('Successfully added Workshop 12!');
