var Update = (function () {
  var TOKEN_PATTERN = '\\\\{\\\\{FASTCITE:([a-zA-Z0-9_\\\\-]+)\\\\}\\\\}';

  function updateCitationsAndBibliography() {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var occurrences = findCitationPlaceholders(body);
    var numbering = buildNumberingMap(occurrences);
    replacePlaceholders(occurrences, numbering);

    var library = Library.loadLibrary();
    var settings = Settings.getSettings();
    var bibLines = buildBibliographyLines(numbering, library);
    upsertBibliographyBlock(body, settings.bibliographyHeading, bibLines);

    return {
      ok: true,
      totalCitations: occurrences.length,
      uniqueRefs: Object.keys(numbering.map).length,
      unresolved: numbering.unresolved
    };
  }

  function findCitationPlaceholders(body) {
    var occurrences = [];
    var searchResult = null;
    while (true) {
      searchResult = body.findText(TOKEN_PATTERN, searchResult);
      if (!searchResult) {
        break;
      }
      var element = searchResult.getElement().asText();
      var match = element.getText().substring(searchResult.getStartOffset(), searchResult.getEndOffsetInclusive() + 1);
      var idMatch = match.match(new RegExp(TOKEN_PATTERN));
      if (idMatch) {
        occurrences.push({
          element: element,
          start: searchResult.getStartOffset(),
          end: searchResult.getEndOffsetInclusive(),
          refId: idMatch[1]
        });
      }
    }
    return occurrences;
  }

  function buildNumberingMap(occurrences) {
    var map = {};
    var order = [];
    var unresolved = [];
    occurrences.forEach(function (occurrence) {
      if (!map[occurrence.refId]) {
        map[occurrence.refId] = order.length + 1;
        order.push(occurrence.refId);
      }
    });
    var library = Library.loadLibrary();
    order.forEach(function (refId) {
      if (!library.refs[refId]) {
        unresolved.push(refId);
      }
    });
    return { map: map, order: order, unresolved: unresolved };
  }

  function replacePlaceholders(occurrences, numbering) {
    for (var i = occurrences.length - 1; i >= 0; i--) {
      var occurrence = occurrences[i];
      var number = numbering.map[occurrence.refId];
      var replacement = number ? '[' + number + ']' : '[?]';
      occurrence.element.deleteText(occurrence.start, occurrence.end);
      occurrence.element.insertText(occurrence.start, replacement);
    }
  }

  function buildBibliographyLines(numbering, library) {
    return numbering.order.map(function (refId) {
      var ref = library.refs[refId];
      if (!ref) {
        return numbering.map[refId] + '. ' + 'Unresolved reference.';
      }
      return Format.formatBibliographyEntry(ref, numbering.map[refId]);
    });
  }

  function upsertBibliographyBlock(body, heading, lines) {
    var startMarker = '{{FASTCITE:BIB_START}}';
    var endMarker = '{{FASTCITE:BIB_END}}';
    var startResult = body.findText(startMarker);
    var endResult = body.findText(endMarker);

    if (startResult && endResult) {
      var startParagraph = startResult.getElement().getParent();
      var endParagraph = endResult.getElement().getParent();
      var startIndex = body.getChildIndex(startParagraph);
      if (startIndex > 0) {
        var possibleHeading = body.getChild(startIndex - 1);
        if (possibleHeading.getType && possibleHeading.getType() === DocumentApp.ElementType.PARAGRAPH) {
          var headingText = possibleHeading.asParagraph().getText();
          if (headingText === heading) {
            startIndex = startIndex - 1;
          }
        }
      }
      var endIndex = body.getChildIndex(endParagraph);
      for (var i = endIndex; i >= startIndex; i--) {
        body.removeChild(body.getChild(i));
      }
      insertBibliographyBlock(body, startIndex, heading, lines, startMarker, endMarker);
      return;
    }

    insertBibliographyBlock(body, body.getNumChildren(), heading, lines, startMarker, endMarker);
  }

  function insertBibliographyBlock(body, index, heading, lines, startMarker, endMarker) {
    var insertAt = index;
    body.insertParagraph(insertAt++, heading).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.insertParagraph(insertAt++, startMarker);
    lines.forEach(function (line) {
      body.insertParagraph(insertAt++, line);
    });
    body.insertParagraph(insertAt, endMarker);
  }

  function getDocumentSummary() {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var occurrences = findCitationPlaceholders(body);
    var numbering = buildNumberingMap(occurrences);
    return {
      totalCitations: occurrences.length,
      uniqueRefs: Object.keys(numbering.map).length,
      unresolved: numbering.unresolved.length
    };
  }

  return {
    updateCitationsAndBibliography: updateCitationsAndBibliography,
    getDocumentSummary: getDocumentSummary,
    findCitationPlaceholders: findCitationPlaceholders,
    buildNumberingMap: buildNumberingMap
  };
})();
