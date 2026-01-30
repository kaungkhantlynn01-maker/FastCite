var Cite = (function () {
  var TOKEN_PREFIX = '{{FASTCITE:';
  var TOKEN_SUFFIX = '}}';

  function citeInput(input) {
    var cleaned = (input || '').trim();
    if (!cleaned) {
      return { ok: false, message: 'Please paste a DOI, PMID, or URL.' };
    }

    var parsed = parseInput(cleaned);
    if (!parsed) {
      return { ok: false, message: 'Could not parse DOI, PMID, or URL.' };
    }

    var library = Library.loadLibrary();
    var ref = Library.getOrCreateReference(library, parsed, cleaned);
    Library.saveLibrary(library);

    insertPlaceholder(ref.ref_id);

    return {
      ok: true,
      ref_id: ref.ref_id,
      status: ref.status,
      needsFetch: ref.status === 'pending'
    };
  }

  function insertPlaceholder(refId) {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    if (!cursor) {
      throw new Error('Place the cursor in the document to insert a citation.');
    }
    cursor.insertText(TOKEN_PREFIX + refId + TOKEN_SUFFIX);
  }

  function parseInput(input) {
    var doi = extractDoi(input);
    if (doi) {
      return { type: 'doi', doi: normalizeDoi(doi) };
    }

    var pmid = extractPmid(input);
    if (pmid) {
      return { type: 'pmid', pmid: pmid };
    }

    var url = extractUrl(input);
    if (url) {
      return { type: 'url', url: normalizeUrl(url) };
    }

    return null;
  }

  function extractDoi(input) {
    var doiRegex = /(10\.[0-9]{4,9}\/[-._;()/:A-Z0-9]+)/i;
    var match = input.match(doiRegex);
    if (match) {
      return match[1];
    }
    if (input.toLowerCase().indexOf('doi:') === 0) {
      return input.slice(4).trim();
    }
    return null;
  }

  function extractPmid(input) {
    if (/^\d{4,10}$/.test(input)) {
      return input;
    }
    var match = input.match(/pmid\s*[:#]?\s*(\d{4,10})/i);
    return match ? match[1] : null;
  }

  function extractUrl(input) {
    if (/^https?:\/\//i.test(input)) {
      return input;
    }
    return null;
  }

  function normalizeDoi(doi) {
    return doi
      .replace(/^https?:\/\/doi\.org\//i, '')
      .replace(/^doi:/i, '')
      .trim()
      .toLowerCase();
  }

  function normalizeUrl(url) {
    return url.trim();
  }

  return {
    citeInput: citeInput,
    parseInput: parseInput,
    normalizeDoi: normalizeDoi,
    normalizeUrl: normalizeUrl
  };
})();
