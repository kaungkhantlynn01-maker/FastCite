var Format = (function () {
  function formatBibliographyEntry(ref, number) {
    var authorText = formatAuthors(ref.authors || []);
    var title = ref.title ? ref.title.trim() : 'Untitled.';
    var journal = ref.journal ? ref.journal.trim() : '';
    var year = ref.year ? ref.year.toString() : '';
    var volume = ref.volume ? ref.volume.toString() : '';
    var issue = ref.issue ? ref.issue.toString() : '';
    var pages = ref.pages ? ref.pages.toString() : '';
    var locator = buildLocator(year, volume, issue, pages);
    var tail = ref.doi ? (' DOI:' + ref.doi + '.') : (ref.url ? (' ' + ref.url + '.') : '');

    return [
      number + '.',
      authorText,
      title,
      journal,
      locator + tail
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  function formatAuthors(authors) {
    if (!authors || !authors.length) {
      return 'Unknown.';
    }
    var list = authors.slice();
    if (list.length > 6) {
      list = list.slice(0, 3).concat(['et al.']);
    }
    return list.join(', ') + '.';
  }

  function buildLocator(year, volume, issue, pages) {
    var parts = [];
    if (year) {
      parts.push(year + ';' + volumePart(volume, issue) + pagesPart(pages));
    } else if (volume || issue || pages) {
      parts.push(volumePart(volume, issue) + pagesPart(pages));
    }
    return parts.join('');
  }

  function volumePart(volume, issue) {
    if (!volume) {
      return '';
    }
    return volume + (issue ? '(' + issue + ')' : '');
  }

  function pagesPart(pages) {
    if (!pages) {
      return '';
    }
    return ':' + pages;
  }

  return {
    formatBibliographyEntry: formatBibliographyEntry,
    formatAuthors: formatAuthors
  };
})();
