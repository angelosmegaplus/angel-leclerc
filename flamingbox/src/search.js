const input = document.getElementById('q');
for (const button of document.querySelectorAll('[data-query]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.query || '';
    input.form.requestSubmit();
  });
}
