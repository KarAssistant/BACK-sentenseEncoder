const fs = require("fs");
const start = require("./universalSentenceEncoder").start;
const encodeSentence = require("./universalSentenceEncoder").encodeSentence;
const crypto = require('crypto');

function sha1(str) {
    const sha1sum = crypto.createHash('sha1');
    sha1sum.update(str);
    return sha1sum.digest('hex');
  }

const vectors = [];

let lineProgress = "";
function progressLog(text) {
  if (process.stdout.cursorTo) {
    for (let index = 0; index < text.length; index++) {
      if (text[index] !== lineProgress[index]) {
        process.stdout.cursorTo(index);
        process.stdout.write(text[index]);
      }
    }

    for (let index = text.length; index < lineProgress.length; index++) {
      process.stdout.write(" ");
    }

    lineProgress = text;
  } else {
    console.log(text);
  }
}

function dateDiff(dateStart, dateEnd) {
  const timeDifference = dateEnd - dateStart;

  const seconds = Math.floor(timeDifference / 1000) % 60;
  const minutes = Math.floor(timeDifference / (1000 * 60)) % 60;
  const hours = Math.floor(timeDifference / (1000 * 60 * 60)) % 24;
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) % 30; // Assuming a month has 30 days for simplicity
  const months = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 30)) % 12;
  const years = Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365));

  let result = "";

  if (years > 0) {
    result += `${years} year${years > 1 ? "s" : ""} `; //Yes, you have to worry if the encoding lasts more than a year
  }

  if (months > 0) {
    result += `${months} month${months > 1 ? "s" : ""} `; //Yes, you have to worry if the encoding lasts more than a month
  }

  if (days > 0) {
    result += `${days} day${days > 1 ? "s" : ""} `; //Yes, you have to worry if the encoding lasts more than a day
  }

  if (hours > 0) {
    result += `${hours} hour${hours > 1 ? "s" : ""} `; //Yes, you have to worry if the encoding lasts more than a hour
  }

  if (minutes > 0) {
    result += `${minutes} minute${minutes > 1 ? "s" : ""} `;
  }

  if (seconds > 0) {
    result += `${seconds} second${seconds > 1 ? "s" : ""} `;
  }

  if (result == "") {
    result += `${timeDifference} millisecond${timeDifference > 1 ? "s" : ""} `;
  }

  return result.trim();
}

function loadSkill({ skill }) {
  console.log("-- " + skill);
  const file = require(__dirname + "/../skills/" + skill + "/text.json");
  const phrases = file.phrases;
  const langs = Object.keys(phrases);
  for (const lang of langs) {
    for (const phrase of phrases[lang]) {
      vectors.push({ skill: skill, lang, phrase });
    }
  }
}

function getAllSkills(path) {
  let result = [];
  if (fs.existsSync(__dirname + "/../skills/" + path) && fs.lstatSync(__dirname + "/../skills/" + path).isDirectory()) {
    const elementExist = fs.existsSync(__dirname + "/../skills/" + path + "/text.json");
    const elementIsFile = elementExist ? fs.lstatSync(__dirname + "/../skills/" + path + "/text.json").isFile() : false;

    if (elementExist && elementIsFile) {
      result.push(path);
    } else {
      const elements = fs.readdirSync(__dirname + "/../skills/" + path);
      for (const element of elements) {
        const resultFolder = getAllSkills(`${path}${path != "" ? "/" : ""}${element}`);
        result = result.concat(resultFolder);
      }
    }
  }
  return result;
}

module.exports.start = async () => {
  await start();
  const dateStart = new Date();

  console.log(`\n\x1b[34mskills`);
  const limitSkills = !process.argv[2]
    ? false
    : fs.existsSync(__dirname + "/../skills/" + process.argv[2] + "/text.json");
  if (!limitSkills && process.argv[2])
    console.log(`\x1b[31mThe skill '${process.argv[2]}' doesn't exist.\nSkipping limit, loading all skills\x1b[0m`);
  if (limitSkills) {
    loadSkill({ skill: process.argv[2] });
  } else {
    const folders = getAllSkills("");

    for (let index = 0; index < folders.length; index++) {
      const folder = folders[index];

      loadSkill({ skill: folder });
    }
  }

  console.log("\n\x1b[33mStart encode sentences\x1b[34m");
  const length = vectors.length;
  progressLog(`0/${length} 00.00%`);
  for (let index = 0; index < vectors.length; index++) {
    const hashSha1 = sha1(vectors[index].phrase);
    if(!fs.existsSync(__dirname + "/../data/vectors/" + hashSha1 + ".json")){
        const vector = await encodeSentence(vectors[index].phrase);
        fs.writeFileSync(__dirname + "/../data/vectors/" + hashSha1 + ".json", JSON.stringify(vector));
    }
    progressLog(`${index + 1}/${length} ${(((index + 1) / length) * 100).toFixed(2)}%`);
  }

  if (process.stdout.cursorTo) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  } else process.stdout.write("\n");


  process.stdout.write(`\x1b[32m${length}/${length} 100.00%`);
  const dateEnd = new Date();
  const elapsedTimeText = dateDiff(dateStart, dateEnd);
  console.log(`\n\x1b[33mEncode sentences finished in \x1b[35m${elapsedTimeText}\x1b[0m\n`);
};
