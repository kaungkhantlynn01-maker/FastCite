var Library = (function () {
  var FOLDER_NAME = 'FastCite';
  var FILE_NAME = 'fastcite_library.json';

  function loadLibrary() {
    var file = getLibraryFile();
    var content = file.getBlob().getDataAsString();
    if (!content) {
      return createEmptyLibrary();
    }
    try {
      var parsed = JSON.parse(content);
      if (!parsed.refs) {
        return createEmptyLibrary();
      }
      return parsed;
    } catch (error) {
      Logger.log('Library parse error: ' + error);
      return createEmptyLibrary();
    }
  }

  function saveLibrary(library) {
    library.updated_at = new Date().toISOString();
    var file = getLibraryFile();
    file.setContent(JSON.stringify(library, null, 2));
  }

  function createEmptyLibrary() {
    return {
      version: 1,
      updated_at: new Date().toISOString(),
      refs: {}
    };
  }

  function getLibraryFile() {
    var folder = getOrCreateFolder(FOLDER_NAME);
    var files = folder.getFilesByName(FILE_NAME);
    if (files.hasNext()) {
      return files.next();
    }
    return folder.createFile(FILE_NAME, JSON.stringify(createEmptyLibrary(), null, 2), 'application/json');
  }

  function getOrCreateFolder(name) {
    var folders = DriveApp.getFoldersByName(name);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(name);
  }

  function getOrCreateReference(library, parsed, sourceInput) {
    var existing = findExistingReference(library, parsed);
    if (existing) {
      existing.source_input = sourceInput;
      existing.updated_at = new Date().toISOString();
      return existing;
    }

    var refId = buildRefId(parsed);
    var now = new Date().toISOString();
    var ref = {
      ref_id: refId,
      title: null,
      authors: [],
      year: null,
      journal: null,
      volume: null,
      issue: null,
      pages: null,
      doi: parsed.doi || null,
      pmid: parsed.pmid || null,
      url: parsed.url || null,
      status: 'pending',
      source_input: sourceInput,
      created_at: now,
      updated_at: now
    };
    library.refs[refId] = ref;
    return ref;
  }

  function findExistingReference(library, parsed) {
    var refs = library.refs || {};
    if (parsed.type === 'doi') {
      return findByDoi(refs, parsed.doi);
    }
    if (parsed.type === 'pmid') {
      return findByPmid(refs, parsed.pmid);
    }
    if (parsed.type === 'url') {
      return findByUrl(refs, parsed.url);
    }
    return null;
  }

  function findByDoi(refs, doi) {
    var keys = Object.keys(refs);
    for (var i = 0; i < keys.length; i++) {
      var ref = refs[keys[i]];
      if (ref.doi && ref.doi.toLowerCase() === doi.toLowerCase()) {
        return ref;
      }
    }
    return null;
  }

  function findByPmid(refs, pmid) {
    var keys = Object.keys(refs);
    for (var i = 0; i < keys.length; i++) {
      var ref = refs[keys[i]];
      if (ref.pmid && ref.pmid === pmid) {
        return ref;
      }
    }
    return null;
  }

  function findByUrl(refs, url) {
    var keys = Object.keys(refs);
    for (var i = 0; i < keys.length; i++) {
      var ref = refs[keys[i]];
      if (ref.url && ref.url === url) {
        return ref;
      }
    }
    return null;
  }

  function findBySignature(refs, signature) {
    var keys = Object.keys(refs);
    for (var i = 0; i < keys.length; i++) {
      var ref = refs[keys[i]];
      if (buildSignature(ref) === signature) {
        return ref;
      }
    }
    return null;
  }

  function buildSignature(ref) {
    var parts = [
      normalizeText(ref.title),
      ref.year || '',
      normalizeText(ref.authors && ref.authors[0])
    ];
    return parts.join('|');
  }

  function normalizeText(text) {
    return (text || '').toString().trim().toLowerCase();
  }

  function buildRefId(parsed) {
    if (parsed.type === 'doi') {
      return 'doi_' + hashString(parsed.doi);
    }
    if (parsed.type === 'pmid') {
      return 'pmid_' + parsed.pmid;
    }
    if (parsed.type === 'url') {
      return 'url_' + hashString(parsed.url);
    }
    return 'ref_' + hashString(JSON.stringify(parsed));
  }

  function hashString(value) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, value, Utilities.Charset.UTF_8);
    return digest.map(function (byte) {
      var v = (byte + 256) % 256;
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  function updateReference(refId, fields) {
    var library = loadLibrary();
    var ref = library.refs[refId];
    if (!ref) {
      throw new Error('Reference not found: ' + refId);
    }
    Object.keys(fields).forEach(function (key) {
      ref[key] = fields[key];
    });
    ref.updated_at = new Date().toISOString();
    library.refs[refId] = ref;
    saveLibrary(library);
    return ref;
  }

  function deleteReference(refId) {
    var library = loadLibrary();
    delete library.refs[refId];
    saveLibrary(library);
    return true;
  }

  function getLibraryView(query) {
    var library = loadLibrary();
    var refs = Object.keys(library.refs || {}).map(function (key) {
      return library.refs[key];
    });
    if (query) {
      var q = query.toLowerCase();
      refs = refs.filter(function (ref) {
        return [ref.title, ref.journal, ref.doi, ref.pmid, ref.url, (ref.authors || []).join(' ')].join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }
    refs.sort(function (a, b) {
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    });
    return {
      refs: refs
    };
  }

  function getQuickCiteView() {
    var library = loadLibrary();
    var refs = Object.keys(library.refs || {}).map(function (key) {
      return library.refs[key];
    });
    refs.sort(function (a, b) {
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    });
    var recent = refs.slice(0, 20);
    var issues = refs.filter(function (ref) {
      return ref.status !== 'ok';
    });
    return {
      recent: recent,
      issues: issues
    };
  }

  return {
    loadLibrary: loadLibrary,
    saveLibrary: saveLibrary,
    getOrCreateReference: getOrCreateReference,
    updateReference: updateReference,
    deleteReference: deleteReference,
    getLibraryView: getLibraryView,
    getQuickCiteView: getQuickCiteView,
    findBySignature: findBySignature,
    buildSignature: buildSignature,
    hashString: hashString
  };
})();
