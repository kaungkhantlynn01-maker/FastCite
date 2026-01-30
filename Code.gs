function onOpen() {
  DocumentApp.getUi()
    .createMenu('FastCite')
    .addItem('Open FastCite', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('FastCite');
  DocumentApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function citeInput(input) {
  return Cite.citeInput(input);
}

function fetchAndUpdateMetadata(refId) {
  return Metadata.fetchAndUpdateMetadata(refId);
}

function getLibraryView(query) {
  return Library.getLibraryView(query || '');
}

function deleteReference(refId) {
  return Library.deleteReference(refId);
}

function updateReference(refId, fields) {
  return Library.updateReference(refId, fields);
}

function getQuickCiteView() {
  return Library.getQuickCiteView();
}

function updateCitationsAndBibliography() {
  return Update.updateCitationsAndBibliography();
}

function getSettings() {
  return Settings.getSettings();
}

function saveSettings(settings) {
  return Settings.saveSettings(settings);
}

function getDocumentSummary() {
  return Update.getDocumentSummary();
}

var Settings = (function () {
  var HEADING_KEY = 'fastcite_bib_heading';

  function getSettings() {
    var props = PropertiesService.getUserProperties();
    return {
      bibliographyHeading: props.getProperty(HEADING_KEY) || 'References'
    };
  }

  function saveSettings(settings) {
    var props = PropertiesService.getUserProperties();
    if (settings && settings.bibliographyHeading) {
      props.setProperty(HEADING_KEY, settings.bibliographyHeading);
    }
    return getSettings();
  }

  return {
    getSettings: getSettings,
    saveSettings: saveSettings
  };
})();
