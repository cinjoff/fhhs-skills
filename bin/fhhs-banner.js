#!/usr/bin/env node

// FHHS colored banner — run with: node fhhs-banner.js [--summary]

const R = '\x1b[91m';   // bright red — horse body
const G = '\x1b[92m';   // bright green — goggles + arm
const Y = '\x1b[33m';   // yellow/amber — fire traces
const B = '\x1b[1m';    // bold
const X = '\x1b[0m';    // reset

const isSummary = process.argv.includes('--summary');
const rule = '\u2501'.repeat(69);

// Horse art — 13 lines, welcome mode (text on right)
// Goggle arm: diagonal / going up lines 4→5→6 toward ear
const horse = [
  R + '          /           /' + X,
  R + "         /' .,,,,  ./" + Y + '══════─ ·' + X + '    ' + B + R + 'FIRE HORSE HACKER SYNDICATE' + X,
  R + "        /';'     ,/" + Y + '═══════─ ·' + X + '     fhhs-skills',
  R + "       / /   ,,//," + G + "/" + R + "'`" + Y + '════─ ·' + X,
  R + "      ( ,, '_,  ," + G + "/" + R + ",' ``" + X + '           Unified workflow for',
  R + '      |  ' + G + '<═◆●◆═>/' + R + ',,, ;" `' + X + '         software development',
  R + "     /    .   ,''/' `,``" + X,
  R + "    /   .     ./, `,, ` ;" + X,
  R + " ,./  .   ,-,',` ,,/''\\,'" + X,
  R + "|   /; ./,,'`,,'' |   |" + X,
  R + "|     /   ','    /    |" + X,
  R + " \\___/'   '     |     |" + X,
  R + "  `,,'   |      /     `\\" + X,
];

if (isSummary) {
  horse[1] = R + "         /' .,,,,  ./" + Y + '══════─ ·' + X;
  horse[2] = R + "        /';'     ,/" + Y + '═══════─ ·' + X + '     Ready to ride.';
  horse[4] = R + "      ( ,, '_,  ," + G + "/" + R + ",' ``" + X;
  horse[5] = R + '      |  ' + G + '<═◆●◆═>/' + R + ',,, ;" `' + X;
  console.log(rule);
  console.log(' FHHS \u25b6 SETUP COMPLETE \u2713');
  console.log(rule);
} else {
  console.log(rule);
}

console.log('');
horse.forEach(l => console.log(l));
console.log('');
if (!isSummary) console.log(rule);
