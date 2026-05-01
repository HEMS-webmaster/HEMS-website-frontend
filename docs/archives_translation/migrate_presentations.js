const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../src/frontend/src/data/master_workshops.json');
const workshops = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

for (const ws of workshops) {
  if (ws.presentations && Array.isArray(ws.presentations)) {
    const daysMap = new Map();
    
    // Group existing presentations
    for (const pres of ws.presentations) {
      const pDate = pres.date || '';
      const pSession = pres.session || 'General Session';
      
      const groupKey = `${pDate}||${pSession}`;
      
      if (!daysMap.has(groupKey)) {
        daysMap.set(groupKey, {
          date: pDate,
          title: pSession,
          location: "",
          presentations: []
        });
      }
      
      const sessionGroup = daysMap.get(groupKey);
      
      // Push the presentation WITHOUT date and session fields
      const { date, session, ...cleanPres } = pres;
      sessionGroup.presentations.push(cleanPres);
    }
    
    // Assign new grouped array
    ws.presentation_sessions = Array.from(daysMap.values());
    
    // Delete old flat array
    delete ws.presentations;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(workshops, null, 2));
console.log('Successfully migrated presentations to presentation_sessions!');
