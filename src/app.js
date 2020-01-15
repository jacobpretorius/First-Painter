const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const flags = {
  chromeFlags: ['--headless']
};

// Set the target url and runs from command line flags
const targetUrl = process.argv[2];
const runs = process.argv[3] || 3;

// Opens up Chrome in headless mode and returns the lighthouse results
function launchChromeAndRunLighthouse(url, config = null) {
  return chromeLauncher.launch(flags).then(chrome => {
    flags.port = chrome.port;
    return lighthouse(url, flags, config).then(results =>
      chrome.kill().then(() => results));
  });
}

// Transform the full lighthouse result object into our stripped down result object
function makeResultObject(results) {
  return {
    fcp : results.lhr.audits.metrics.details.items[0].firstContentfulPaint,
    fmp : results.lhr.audits.metrics.details.items[0].firstMeaningfulPaint,
    speedIndex : results.lhr.audits.metrics.details.items[0].speedIndex,
    tbt : results.lhr.audits.metrics.details.items[0].totalBlockingTime
  };
}

// Make a presentable text output object
function makeResultOutputString(resultObject) {
  let result = `First Paint:\t\t\t${resultObject.fcp}\n`;
  result += `First Meaningful Paint:\t\t${resultObject.fmp}\n`;
  result += `Speed Index:\t\t\t${resultObject.speedIndex}\n`;
  result += `Total Blocking Time:\t\t${resultObject.tbt}\n`;
  return result;
}

// RUN THE TEST BABY!
function runTaskAsync() {
  return new Promise((resolve) => {
    launchChromeAndRunLighthouse(targetUrl)
    .then(results => { 
      let resultObject = makeResultObject(results);
      let resultOutputString = makeResultOutputString(resultObject);

      console.log(resultOutputString);
      resolve(resultObject);
    });
  });
};

// General one liner to get the average of an array of numbers
const average = (array) => toFixed(array.reduce((a, b) => a + b) / array.length, 2);

// Why do I need to do this again?
function toFixed(num, fixed) {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}

// Print the averages for our ran tests
function displayAverages(testResultObjectArr) {
  let firstPaintArr = testResultObjectArr.map(el => el.fcp);
  let firstMeaningfulPaintArr = testResultObjectArr.map(el => el.fmp);
  let speedIndexArr = testResultObjectArr.map(el => el.speedIndex);
  let totalBlockingTimeArr = testResultObjectArr.map(el => el.tbt);

  console.log('------------------------------');
  console.log(targetUrl);
  console.log('AVERAGES\t\t\tMilliseconds');
  console.log(`First Paint:\t\t\t${average(firstPaintArr)}`);
  console.log(`First Meaningful Paint:\t\t${average(firstMeaningfulPaintArr)}`);
  console.log(`Speed Index:\t\t\t${average(speedIndexArr)}`);
  console.log(`Total Blocking Time:\t\t${average(totalBlockingTimeArr)}`);
  console.log('------------------------------');
}

// Step runner for our five test executions
const runner = async _ => {
  console.log(`\n\nStarting for ${targetUrl}\n`);
  let testResults = [];

  for (let i = 1; i <= runs; i++) {
    console.log(`RUN ${i}\t\t\t\tMilliseconds`);
    testResults.push(await runTaskAsync());
  }

  displayAverages(testResults);

  console.log('\nDone.\n\n');
}

// Go Johnny go, go
runner();
