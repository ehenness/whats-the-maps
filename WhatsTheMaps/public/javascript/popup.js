const test = document.getElementById('test');
const popup = document.getElementById('popup');

test.addEventListener('click', () => {
  if (popup.style.display === 'none') {
    popup.style.display = 'block';
  } else {
    popup.style.display = 'none';
  }
});
