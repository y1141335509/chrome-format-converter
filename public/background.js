chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'index.html',
    type: 'popup',
    width: 800,
    height: 600,
    focused: true
  });
});