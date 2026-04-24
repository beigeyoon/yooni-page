function optimizePostHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img'));

  images.forEach((img, index) => {
    const isPriorityImage = index === 0;

    img.setAttribute('decoding', 'async');
    img.setAttribute('loading', isPriorityImage ? 'eager' : 'lazy');
    img.setAttribute('fetchpriority', isPriorityImage ? 'high' : 'low');

    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', `본문 이미지 ${index + 1}`);
    }
  });

  return doc.body.innerHTML;
}

export default optimizePostHtml;
