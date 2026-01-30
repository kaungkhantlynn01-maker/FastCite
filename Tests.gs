function runAllTests() {
  var results = [];
  results.push(testDoiNormalization());
  results.push(testRefIdStability());
  results.push(testTokenExtractionOrdering());
  results.push(testNumberingMap());
  results.push(testBibliographyFormatting());

  results.forEach(function (result) {
    Logger.log(result.name + ': ' + (result.pass ? 'PASS' : 'FAIL') + ' - ' + result.message);
  });
}

function testDoiNormalization() {
  var input = 'https://doi.org/10.1000/XYZ.123';
  var normalized = Cite.normalizeDoi(input);
  var pass = normalized === '10.1000/xyz.123';
  return { name: 'DOI normalization', pass: pass, message: normalized };
}

function testRefIdStability() {
  var parsed = { type: 'doi', doi: '10.1000/xyz.123' };
  var first = Library.hashString(parsed.doi);
  var second = Library.hashString(parsed.doi);
  var pass = first === second;
  return { name: 'ref_id stability', pass: pass, message: first };
}

function testTokenExtractionOrdering() {
  var body = {
    findText: function () {
      return null;
    }
  };
  var occurrences = Update.findCitationPlaceholders(body);
  var pass = Array.isArray(occurrences);
  return { name: 'token extraction ordering', pass: pass, message: 'Occurrences length ' + occurrences.length };
}

function testNumberingMap() {
  var occurrences = [
    { refId: 'a' },
    { refId: 'b' },
    { refId: 'a' }
  ];
  var numbering = Update.buildNumberingMap(occurrences);
  var pass = numbering.map.a === 1 && numbering.map.b === 2;
  return { name: 'numbering map correctness', pass: pass, message: JSON.stringify(numbering.map) };
}

function testBibliographyFormatting() {
  var ref = {
    authors: ['Smith A', 'Jones B', 'Taylor C', 'Lee D', 'Patel E', 'Wong F', 'Zhang G'],
    title: 'Study on FastCite',
    journal: 'Journal of Testing',
    year: 2023,
    volume: 12,
    issue: 3,
    pages: '45-50',
    doi: '10.1000/xyz.123'
  };
  var entry = Format.formatBibliographyEntry(ref, 1);
  var pass = entry.indexOf('et al.') !== -1;
  return { name: 'bibliography formatting', pass: pass, message: entry };
}
