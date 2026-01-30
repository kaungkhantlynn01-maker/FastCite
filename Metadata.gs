var Metadata = (function () {
  function fetchAndUpdateMetadata(refId) {
    var library = Library.loadLibrary();
    var ref = library.refs[refId];
    if (!ref) {
      return { ok: false, message: 'Reference not found.' };
    }

    try {
      var updated = null;
      if (ref.doi) {
        updated = fetchFromCrossref(ref.doi);
      } else if (ref.pmid) {
        updated = fetchFromPubMed(ref.pmid);
      } else if (ref.url) {
        updated = fetchFromUrl(ref.url);
      }

      if (updated && updated.status === 'ok') {
        ref = mergeReference(ref, updated);
        ref.status = 'ok';
      } else {
        ref.status = 'failed';
      }
    } catch (error) {
      Logger.log('Metadata fetch error: ' + error);
      ref.status = 'failed';
    }

    ref.updated_at = new Date().toISOString();
    library.refs[refId] = ref;
    library = dedupeIfNeeded(library, ref);
    Library.saveLibrary(library);

    return { ok: true, status: ref.status, ref: ref };
  }

  function fetchFromCrossref(doi) {
    var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      return { status: 'failed' };
    }
    var data = JSON.parse(response.getContentText());
    var message = data.message || {};
    return normalizeMetadata({
      title: Array.isArray(message.title) ? message.title[0] : message.title,
      authors: (message.author || []).map(formatCrossrefAuthor),
      year: extractYear(message.issued),
      journal: Array.isArray(message['container-title']) ? message['container-title'][0] : message['container-title'],
      volume: message.volume,
      issue: message.issue,
      pages: message.page,
      doi: message.DOI
    });
  }

  function fetchFromPubMed(pmid) {
    var url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + encodeURIComponent(pmid) + '&retmode=json';
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      return { status: 'failed' };
    }
    var data = JSON.parse(response.getContentText());
    var result = data.result && data.result[pmid];
    if (!result) {
      return { status: 'failed' };
    }
    return normalizeMetadata({
      title: result.title,
      authors: (result.authors || []).map(function (author) { return author.name; }),
      year: result.pubdate ? result.pubdate.substring(0, 4) : null,
      journal: result.fulljournalname,
      volume: result.volume,
      issue: result.issue,
      pages: result.pages,
      pmid: pmid
    });
  }

  function fetchFromUrl(url) {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (response.getResponseCode() !== 200) {
      return { status: 'failed' };
    }
    var html = response.getContentText();
    var doiMatch = html.match(/10\.[0-9]{4,9}\/[-._;()/:A-Z0-9]+/i);
    if (doiMatch) {
      return fetchFromCrossref(Cite.normalizeDoi(doiMatch[0]));
    }
    return { status: 'failed' };
  }

  function normalizeMetadata(raw) {
    return {
      status: 'ok',
      title: raw.title || null,
      authors: raw.authors || [],
      year: raw.year || null,
      journal: raw.journal || null,
      volume: raw.volume || null,
      issue: raw.issue || null,
      pages: raw.pages || null,
      doi: raw.doi || null,
      pmid: raw.pmid || null,
      url: raw.url || null
    };
  }

  function formatCrossrefAuthor(author) {
    if (!author) {
      return '';
    }
    var parts = [];
    if (author.family) {
      parts.push(author.family);
    }
    if (author.given) {
      parts.push(author.given);
    }
    return parts.join(' ');
  }

  function extractYear(issued) {
    if (!issued || !issued['date-parts'] || !issued['date-parts'][0]) {
      return null;
    }
    return issued['date-parts'][0][0];
  }

  function mergeReference(ref, update) {
    var merged = JSON.parse(JSON.stringify(ref));
    ['title', 'authors', 'year', 'journal', 'volume', 'issue', 'pages', 'doi', 'pmid', 'url'].forEach(function (field) {
      if (update[field]) {
        merged[field] = update[field];
      }
    });
    return merged;
  }

  function dedupeIfNeeded(library, ref) {
    if (ref.status !== 'ok') {
      return library;
    }
    var signature = Library.buildSignature(ref);
    var existing = Library.findBySignature(library.refs, signature);
    if (existing && existing.ref_id !== ref.ref_id) {
      existing.updated_at = new Date().toISOString();
      library.refs[existing.ref_id] = mergeReference(existing, ref);
    }
    return library;
  }

  return {
    fetchAndUpdateMetadata: fetchAndUpdateMetadata
  };
})();
